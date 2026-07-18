create or replace view public.olist_compras_auditoria as
with itens_nf_totais as (
  select
    i.nota_snapshot_id,
    count(*)::integer as total_itens_nf,
    count(*) filter (where i.produto_id is not null)::integer as total_itens_com_produto,
    count(*) filter (where i.produto_id is null)::integer as total_itens_sem_produto,
    count(*) filter (where i.status_processamento = 'processado')::integer as total_itens_processados,
    count(*) filter (where i.status_processamento = 'erro')::integer as total_itens_com_erro,
    coalesce(sum(i.valor_total), 0) as soma_valor_total_itens_nf,
    coalesce(sum(i.ipi_valor_imposto), 0) as soma_ipi_itens_nf,
    coalesce(sum(i.impostos_total), 0) as soma_todos_impostos_itens_nf
  from public.olist_notas_entrada_itens_snapshot i
  group by i.nota_snapshot_id
),
compra_totais as (
  select
    ci.compra_id,
    count(*)::integer as total_itens_compra,
    coalesce(sum(ci.quantidade), 0) as soma_quantidade_compra,
    coalesce(sum(ci.quantidade_recebida), 0) as soma_quantidade_recebida,
    coalesce(sum(ci.quantidade * ci.custo_unitario), 0) as soma_produtos_compra,
    coalesce(sum(ci.valor_impostos_item), 0) as soma_impostos_que_entram_no_custo,
    coalesce(sum(ci.valor_desconto_item), 0) as soma_descontos_itens,
    coalesce(sum(ci.outros_custos_item), 0) as soma_outros_custos_itens
  from public.compras_itens ci
  group by ci.compra_id
)
select
  n.id as nota_snapshot_id,
  n.id_nota_olist,
  n.numero as numero_nf,
  n.serie,
  n.chave_acesso,

  n.data_emissao,
  n.data_prevista,

  n.fornecedor_nome as fornecedor_nome_olist,
  f.nome as fornecedor_nome_primely,
  n.fornecedor_cpf_cnpj,

  n.status_processamento as status_processamento_nota,
  n.mensagem_erro as mensagem_erro_nota,
  n.processado_em,

  c.id as compra_id,
  c.numero_pedido,
  c.numero_nota_fiscal,
  c.status as status_compra,
  c.data_compra,
  c.data_prevista_entrega,
  c.data_recebimento,

  coalesce(inf.total_itens_nf, 0) as total_itens_nf,
  coalesce(inf.total_itens_com_produto, 0) as total_itens_com_produto,
  coalesce(inf.total_itens_sem_produto, 0) as total_itens_sem_produto,
  coalesce(inf.total_itens_processados, 0) as total_itens_processados,
  coalesce(inf.total_itens_com_erro, 0) as total_itens_com_erro,

  coalesce(ct.total_itens_compra, 0) as total_itens_compra,
  coalesce(ct.soma_quantidade_compra, 0) as soma_quantidade_compra,
  coalesce(ct.soma_quantidade_recebida, 0) as soma_quantidade_recebida,

  round(coalesce(n.valor_produtos, 0)::numeric, 2) as valor_produtos_nf,
  round(coalesce(n.valor_frete, 0)::numeric, 2) as valor_frete_nf,
  round(coalesce(n.valor_desconto, 0)::numeric, 2) as valor_desconto_nf,
  round(coalesce(n.valor_outras, 0)::numeric, 2) as valor_outras_nf,
  round(coalesce(n.valor_seguro, 0)::numeric, 2) as valor_seguro_nf,
  round(coalesce(n.valor_ipi, 0)::numeric, 2) as valor_ipi_nf,
  round(coalesce(n.valor_icms_st, 0)::numeric, 2) as valor_icms_st_nf,
  round(coalesce(n.valor, 0)::numeric, 2) as valor_total_nf,

  round(coalesce(inf.soma_valor_total_itens_nf, 0)::numeric, 2) as soma_valor_total_itens_nf,
  round(coalesce(inf.soma_ipi_itens_nf, 0)::numeric, 2) as soma_ipi_itens_nf,
  round(coalesce(inf.soma_todos_impostos_itens_nf, 0)::numeric, 2) as soma_todos_impostos_itens_nf,

  round(coalesce(ct.soma_produtos_compra, 0)::numeric, 2) as soma_produtos_compra,
  round(coalesce(ct.soma_impostos_que_entram_no_custo, 0)::numeric, 2) as soma_impostos_que_entram_no_custo,
  round(coalesce(c.valor_frete, 0)::numeric, 2) as valor_frete_compra,
  round(coalesce(c.valor_desconto, 0)::numeric, 2) as valor_desconto_compra,
  round(coalesce(c.outros_custos, 0)::numeric, 2) as outros_custos_compra,

  case
    when c.id is null then null
    else round((
      coalesce(ct.soma_produtos_compra, 0)
      + coalesce(ct.soma_impostos_que_entram_no_custo, 0)
      + coalesce(c.valor_frete, 0)
      + coalesce(c.outros_custos, 0)
      - coalesce(c.valor_desconto, 0)
    )::numeric, 2)
  end as total_estimado_compra,

  case
    when c.id is null then null
    else round((
      (
        coalesce(ct.soma_produtos_compra, 0)
        + coalesce(ct.soma_impostos_que_entram_no_custo, 0)
        + coalesce(c.valor_frete, 0)
        + coalesce(c.outros_custos, 0)
        - coalesce(c.valor_desconto, 0)
      )
      - coalesce(n.valor, 0)
    )::numeric, 2)
  end as diferenca_nf_compra,

  case
    when n.status_processamento = 'ignorado' then 'ignorada'
    when c.id is null then 'sem_compra'
    when coalesce(inf.total_itens_nf, 0) = 0 then 'sem_itens_nf'
    when coalesce(ct.total_itens_compra, 0) = 0 then 'sem_itens_compra'
    when abs(round((
      (
        coalesce(ct.soma_produtos_compra, 0)
        + coalesce(ct.soma_impostos_que_entram_no_custo, 0)
        + coalesce(c.valor_frete, 0)
        + coalesce(c.outros_custos, 0)
        - coalesce(c.valor_desconto, 0)
      )
      - coalesce(n.valor, 0)
    )::numeric, 2)) <= 0.01 then 'ok'
    else 'divergente'
  end as status_auditoria

from public.olist_notas_entrada_snapshot n
left join public.compras c
  on c.id = n.compra_id
left join public.fornecedores f
  on f.id = coalesce(c.fornecedor_id, n.fornecedor_id)
left join itens_nf_totais inf
  on inf.nota_snapshot_id = n.id
left join compra_totais ct
  on ct.compra_id = c.id;


create or replace view public.olist_compras_itens_auditoria as
select
  n.id as nota_snapshot_id,
  n.id_nota_olist,
  n.numero as numero_nf,
  n.serie,
  n.fornecedor_nome as fornecedor_nome_olist,
  f.nome as fornecedor_nome_primely,

  c.id as compra_id,
  c.status as status_compra,

  i.id as item_snapshot_id,
  i.id_item_olist,
  i.codigo as codigo_nf,
  i.descricao as descricao_nf,
  i.unidade as unidade_nf,
  i.cfop,
  i.natureza_operacao,
  i.gtin,

  i.produto_id,
  p.sku as sku_primely,
  p.nome as produto_nome_primely,
  p.ean as ean_primely,

  i.quantidade as quantidade_nf,
  i.valor_unitario as custo_unitario_nf,
  i.valor_total as valor_total_nf_item,
  i.valor_total_com_impostos,
  i.impostos_total as impostos_totais_destacados_item,
  i.ipi_valor_imposto as ipi_item_nf,

  r.fator_conversao as fator_conversao_regra,

  case
    when ci.id is not null and coalesce(i.quantidade, 0) <> 0 then
      round((ci.quantidade::numeric / i.quantidade)::numeric, 4)
    when r.fator_conversao is not null then
      r.fator_conversao
    else null
  end as fator_conversao_calculado,

  ci.id as compra_item_id,
  ci.quantidade as quantidade_compra,
  ci.quantidade_recebida,
  ci.custo_unitario as custo_unitario_compra,
  ci.valor_desconto_item,
  ci.valor_impostos_item as impostos_que_entram_no_custo_item,
  ci.outros_custos_item,
  ci.codigo_produto_fornecedor,
  ci.status as status_compra_item,

  case
    when ci.id is null then null
    else round((ci.quantidade * ci.custo_unitario)::numeric, 2)
  end as valor_produto_compra_item,

  case
    when ci.id is null then null
    else round((
      ci.quantidade * ci.custo_unitario
      + ci.valor_impostos_item
      + ci.outros_custos_item
      - ci.valor_desconto_item
    )::numeric, 2)
  end as total_compra_item_com_custo,

  case
    when ci.id is null then null
    else round((
      (ci.quantidade * ci.custo_unitario)
      - coalesce(i.valor_total, 0)
    )::numeric, 2)
  end as diferenca_valor_produto_item,

  i.status_processamento as status_processamento_item_snapshot,
  i.mensagem_erro as mensagem_erro_item_snapshot,

  case
    when i.produto_id is null then 'sem_produto_vinculado'
    when c.id is null then 'nota_sem_compra'
    when ci.id is null then 'sem_item_compra'
    when abs(round((
      (ci.quantidade * ci.custo_unitario)
      - coalesce(i.valor_total, 0)
    )::numeric, 2)) <= 0.01 then 'ok'
    else 'divergente_valor_produto'
  end as status_auditoria_item

from public.olist_notas_entrada_itens_snapshot i
join public.olist_notas_entrada_snapshot n
  on n.id = i.nota_snapshot_id
left join public.compras c
  on c.id = n.compra_id
left join public.fornecedores f
  on f.id = coalesce(c.fornecedor_id, n.fornecedor_id)
left join public.compras_itens ci
  on ci.id = i.compra_item_id
left join public.produtos p
  on p.id = i.produto_id
left join lateral (
  select r1.fator_conversao
  from public.produto_fornecedor_conversao_unidade r1
  where r1.ativo = true
    and r1.produto_id = i.produto_id
    and lower(trim(r1.unidade_nf)) = lower(trim(coalesce(i.unidade, '')))
    and (
      r1.fornecedor_id = coalesce(c.fornecedor_id, n.fornecedor_id)
      or r1.fornecedor_id is null
    )
    and (
      r1.codigo_produto_fornecedor = i.codigo
      or r1.codigo_produto_fornecedor is null
    )
  order by
    case when r1.fornecedor_id = coalesce(c.fornecedor_id, n.fornecedor_id) then 0 else 1 end,
    case when r1.codigo_produto_fornecedor = i.codigo then 0 else 1 end
  limit 1
) r on true;