-- Migration: 20260602120000_curva_abc_olist_view (v2 - com ranking por margem)
-- Etapa: Curva ABC Olist
-- Projeto: Agentes Primely Store / PrimelyStore-App-V2
--
-- Objetivo:
--   Criar view somente leitura para classificação ABC de produtos
--   com base nos pedidos importados do Olist (snapshots).
--   Agora inclui custo médio (NF de entrada Olist) e margem estimada,
--   permitindo ranking tanto por faturamento quanto por margem.
--
-- Regras:
--   - Usa exclusivamente snapshots Olist (pedidos + notas de entrada).
--   - Não processa vendas, não executa baixa FIFO, não altera estoque.
--   - Curva por faturamento: A = acumulado até 80%, B = até 95%, C = restante.
--   - Curva por margem:      A = margem >= 30%, B = 10%-30%, C = < 10%.
--
-- Referência arquitetural:
--   Olist é o ERP operacional. Esta view é somente leitura/gerencial.

-- Drop necessário porque a v1 tinha coluna "ranking" e agora é "ranking_faturamento".
-- PostgreSQL não permite renomear colunas via CREATE OR REPLACE VIEW.
drop view if exists public.olist_curva_abc_view;

create view public.olist_curva_abc_view as
with faturamento_por_produto as (
  select
    i.produto_id,
    coalesce(
      nullif(trim(i.sku), ''),
      nullif(trim(pr.sku), '')
    ) as sku,
    coalesce(
      nullif(trim(pr.nome), ''),
      nullif(trim(i.descricao), ''),
      'Produto sem nome'
    ) as produto_nome,
    pr.marca,
    pr.categoria,
    pr.asin,
    sum(i.valor_total_item)              as faturamento_total,
    sum(i.quantidade)                    as quantidade_total,
    count(distinct i.id_pedido_olist)    as total_pedidos
  from public.olist_pedidos_itens_snapshot i
  left join public.produtos pr
    on pr.id = i.produto_id
  -- Considera apenas pedidos que não foram cancelados
  inner join public.olist_pedidos_snapshot p
    on p.id = i.pedido_snapshot_id
  where
    p.situacao not in ('Cancelado', 'cancelado')
    or p.situacao is null
  group by
    i.produto_id,
    i.sku,
    pr.sku,
    pr.nome,
    i.descricao,
    pr.marca,
    pr.categoria,
    pr.asin
),

-- Custo médio unitário por produto usando as notas de entrada Olist (snapshot)
-- Usa a média ponderada das últimas notas vinculadas ao produto
custo_medio_nf as (
  select
    ni.produto_id,
    -- Custo médio ponderado: soma(qtd * custo) / soma(qtd)
    case
      when sum(ni.quantidade) > 0
        then round((sum(ni.quantidade * ni.valor_unitario) / sum(ni.quantidade))::numeric, 4)
      else null
    end as custo_medio_unitario,
    -- Custo total das notas para referência
    sum(ni.valor_total) as custo_total_nf,
    count(distinct ni.nota_snapshot_id) as total_notas_entrada
  from public.olist_notas_entrada_itens_snapshot ni
  where ni.produto_id is not null
    and ni.valor_unitario > 0
    and ni.quantidade > 0
  group by ni.produto_id
),

total_geral as (
  select
    sum(faturamento_total) as faturamento_geral
  from faturamento_por_produto
),

ranking_produtos as (
  select
    fp.*,
    tg.faturamento_geral,

    -- Custo médio da NF Olist
    cn.custo_medio_unitario,
    cn.total_notas_entrada,

    -- Custo total estimado (custo_medio * quantidade vendida)
    case
      when cn.custo_medio_unitario is not null and cn.custo_medio_unitario > 0
        then round((cn.custo_medio_unitario * fp.quantidade_total)::numeric, 2)
      else null
    end as custo_total_estimado,

    -- Lucro estimado
    case
      when cn.custo_medio_unitario is not null and cn.custo_medio_unitario > 0
        then round((fp.faturamento_total - (cn.custo_medio_unitario * fp.quantidade_total))::numeric, 2)
      else null
    end as lucro_estimado,

    -- Margem estimada %
    case
      when cn.custo_medio_unitario is not null
        and cn.custo_medio_unitario > 0
        and fp.faturamento_total > 0
        then round(((fp.faturamento_total - (cn.custo_medio_unitario * fp.quantidade_total))
            / fp.faturamento_total * 100)::numeric, 2)
      else null
    end as margem_estimada_percentual,

    -- Ranking por faturamento
    row_number() over (
      order by fp.faturamento_total desc, fp.quantidade_total desc
    ) as ranking_faturamento,

    -- Percentual individual no faturamento total
    case
      when tg.faturamento_geral > 0
        then round((fp.faturamento_total / tg.faturamento_geral * 100)::numeric, 4)
      else 0
    end as percentual_faturamento,

    -- Percentual acumulado (window function por faturamento desc)
    case
      when tg.faturamento_geral > 0
        then round((
          sum(fp.faturamento_total) over (
            order by fp.faturamento_total desc, fp.quantidade_total desc
            rows between unbounded preceding and current row
          ) / tg.faturamento_geral * 100
        )::numeric, 4)
      else 0
    end as percentual_acumulado

  from faturamento_por_produto fp
  cross join total_geral tg
  left join custo_medio_nf cn
    on cn.produto_id = fp.produto_id
)

select
  rp.produto_id,
  rp.sku,
  rp.produto_nome,
  rp.marca,
  rp.categoria,
  rp.asin,

  rp.faturamento_total,
  rp.quantidade_total,
  rp.total_pedidos,

  -- Ticket médio por pedido
  case
    when rp.total_pedidos > 0
      then round((rp.faturamento_total / rp.total_pedidos)::numeric, 2)
    else 0
  end as ticket_medio,

  rp.percentual_faturamento,
  rp.percentual_acumulado,
  rp.ranking_faturamento,

  -- Dados de custo e margem (fonte: NFs de entrada Olist)
  rp.custo_medio_unitario,
  rp.custo_total_estimado,
  rp.lucro_estimado,
  rp.margem_estimada_percentual,
  rp.total_notas_entrada,

  -- Ranking por margem (apenas produtos com custo calculado)
  case
    when rp.margem_estimada_percentual is not null
      then row_number() over (
        order by rp.margem_estimada_percentual desc nulls last
      )
    else null
  end as ranking_margem,

  -- Classificação ABC por faturamento
  case
    when rp.percentual_acumulado <= 80 then 'A'
    when rp.percentual_acumulado <= 95 then 'B'
    else 'C'
  end as curva_faturamento,

  -- Classificação ABC por margem estimada
  -- A = margem >= 30%, B = 10% a 30%, C = < 10% (ou sem custo)
  case
    when rp.margem_estimada_percentual is null then 'sem_custo'
    when rp.margem_estimada_percentual >= 30  then 'A'
    when rp.margem_estimada_percentual >= 10  then 'B'
    else 'C'
  end as curva_margem

from ranking_produtos rp
order by rp.ranking_faturamento asc;

-- Comentário sobre a view
comment on view public.olist_curva_abc_view is
  'Classificação ABC de produtos com dois critérios: faturamento e margem estimada. '
  'Curva por faturamento: A=top 80%, B=15%, C=5%. '
  'Curva por margem: A>=30%, B=10-30%, C<10% (fonte: NFs entrada Olist). '
  'View somente leitura. Não altera dados operacionais.';
