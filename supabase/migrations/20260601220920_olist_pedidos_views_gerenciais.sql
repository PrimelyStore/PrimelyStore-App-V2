-- Etapa 133 - Parte 0D-19
-- Views gerenciais de pedidos Olist
-- Projeto: Agentes Primely Store / PrimelyStore-App-V2
--
-- Objetivo:
-- Criar views somente leitura para análise dos pedidos importados do Olist.
--
-- Importante:
-- Estas views não processam vendas, não executam baixa FIFO
-- e não alteram estoque. Elas apenas consultam snapshots.

create or replace view public.olist_pedidos_gerencial_view as
select
  p.id as pedido_snapshot_id,
  i.id as pedido_item_snapshot_id,

  p.provider,
  p.id_pedido_olist,
  p.numero_pedido,
  p.numero_pedido_ecommerce,
  p.numero_pedido_canal_venda,
  p.ecommerce_nome,
  p.canal_venda_olist,
  p.origem_pedido,
  p.situacao,

  p.data_pedido,
  p.data_criacao_olist,
  p.data_envio,
  p.data_entrega,

  p.id_deposito_olist,
  p.deposito_nome,

  case
    when p.deposito_nome ilike '%fba%' then 'Amazon FBA'
    when p.deposito_nome ilike '%geral%' then 'Prep Center / Geral'
    else 'Outro / não classificado'
  end as local_estoque_conceitual,

  p.transportador_nome,

  p.valor_produtos,
  p.valor_frete,
  p.valor_desconto,
  p.valor_outras_despesas,
  p.valor_total,

  p.status_processamento as status_processamento_pedido,
  p.mensagem_erro as mensagem_erro_pedido,
  p.venda_id,
  p.canal_venda_id,
  p.local_saida_id,
  p.processado_em,

  i.ordem_item,
  i.id_item_olist,
  i.id_produto_olist,
  i.sku as sku_olist,
  i.descricao as descricao_olist,
  i.quantidade,
  i.valor_unitario,
  i.valor_desconto_item,
  i.valor_total_item,

  i.status_processamento as status_processamento_item,
  i.mensagem_erro as mensagem_erro_item,
  i.venda_item_id,

  i.produto_id,
  pr.nome as produto_nome_primely,
  pr.sku as produto_sku_primely,
  pr.asin as produto_asin,
  pr.ean as produto_ean,
  pr.marca as produto_marca,
  pr.categoria as produto_categoria,
  pr.status as produto_status,

  case
    when i.produto_id is not null then true
    else false
  end as produto_vinculado,

  case
    when i.id is null then 'pedido_sem_item'
    when i.produto_id is null then 'item_sem_produto_vinculado'
    when p.status_processamento = 'pendente'
      and i.status_processamento = 'pendente'
      and i.produto_id is not null then 'pronto_para_analise'
    when p.status_processamento = 'processado' then 'pedido_processado'
    when p.status_processamento = 'erro' then 'pedido_com_erro'
    when p.status_processamento = 'ignorado' then 'pedido_ignorado'
    else 'verificar'
  end as status_gerencial,

  p.sincronizado_em as pedido_sincronizado_em,
  p.created_at as pedido_criado_em,
  p.updated_at as pedido_atualizado_em,
  i.created_at as item_criado_em,
  i.updated_at as item_atualizado_em

from public.olist_pedidos_snapshot p
left join public.olist_pedidos_itens_snapshot i
  on i.pedido_snapshot_id = p.id
left join public.produtos pr
  on pr.id = i.produto_id;


create or replace view public.olist_pedidos_resumo_gerencial_view as
with itens_por_pedido as (
  select
    pedido_snapshot_id,
    count(*) as total_itens,
    count(*) filter (where produto_id is not null) as itens_com_produto_vinculado,
    count(*) filter (where produto_id is null) as itens_sem_produto_vinculado,
    sum(quantidade) as quantidade_total_itens,
    sum(valor_total_item) as valor_total_itens
  from public.olist_pedidos_itens_snapshot
  group by pedido_snapshot_id
),
pedidos_base as (
  select
    p.id as pedido_snapshot_id,
    p.provider,
    p.id_pedido_olist,

    coalesce(
      p.data_pedido::date,
      p.data_criacao_olist::date,
      p.sincronizado_em::date
    ) as data_referencia,

    date_trunc(
      'month',
      coalesce(
        p.data_pedido,
        p.data_criacao_olist,
        p.sincronizado_em
      )
    )::date as mes_referencia,

    coalesce(
      nullif(p.ecommerce_nome, ''),
      nullif(p.canal_venda_olist, ''),
      'Não informado'
    ) as canal_gerencial,

    p.ecommerce_nome,
    p.canal_venda_olist,
    p.deposito_nome,

    case
      when p.deposito_nome ilike '%fba%' then 'Amazon FBA'
      when p.deposito_nome ilike '%geral%' then 'Prep Center / Geral'
      else 'Outro / não classificado'
    end as local_estoque_conceitual,

    p.situacao,
    p.status_processamento,
    p.valor_produtos,
    p.valor_frete,
    p.valor_desconto,
    p.valor_outras_despesas,
    p.valor_total,

    coalesce(i.total_itens, 0) as total_itens,
    coalesce(i.itens_com_produto_vinculado, 0) as itens_com_produto_vinculado,
    coalesce(i.itens_sem_produto_vinculado, 0) as itens_sem_produto_vinculado,
    coalesce(i.quantidade_total_itens, 0) as quantidade_total_itens,
    coalesce(i.valor_total_itens, 0) as valor_total_itens,

    p.sincronizado_em
  from public.olist_pedidos_snapshot p
  left join itens_por_pedido i
    on i.pedido_snapshot_id = p.id
)
select
  data_referencia,
  mes_referencia,
  canal_gerencial,
  ecommerce_nome,
  canal_venda_olist,
  deposito_nome,
  local_estoque_conceitual,
  situacao,
  status_processamento,

  count(*) as total_pedidos,

  count(*) filter (
    where status_processamento = 'pendente'
  ) as pedidos_pendentes,

  count(*) filter (
    where status_processamento = 'processado'
  ) as pedidos_processados,

  count(*) filter (
    where status_processamento = 'erro'
  ) as pedidos_com_erro,

  count(*) filter (
    where status_processamento = 'ignorado'
  ) as pedidos_ignorados,

  sum(total_itens) as total_itens,
  sum(itens_com_produto_vinculado) as itens_com_produto_vinculado,
  sum(itens_sem_produto_vinculado) as itens_sem_produto_vinculado,
  sum(quantidade_total_itens) as quantidade_total_itens,

  sum(valor_produtos) as valor_produtos_total,
  sum(valor_frete) as valor_frete_total,
  sum(valor_desconto) as valor_desconto_total,
  sum(valor_outras_despesas) as valor_outras_despesas_total,
  sum(valor_total) as valor_total_pedidos,
  sum(valor_total_itens) as valor_total_itens,

  max(sincronizado_em) as ultima_sincronizacao

from pedidos_base
group by
  data_referencia,
  mes_referencia,
  canal_gerencial,
  ecommerce_nome,
  canal_venda_olist,
  deposito_nome,
  local_estoque_conceitual,
  situacao,
  status_processamento;