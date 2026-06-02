create or replace view public.olist_notas_entrada_recentes_gerencial_view as
with itens_por_nota as (
  select
    i.nota_snapshot_id,
    count(*)::integer as total_itens_nf,
    count(*) filter (where i.produto_id is not null)::integer as total_itens_com_produto,
    count(*) filter (where i.produto_id is null)::integer as total_itens_sem_produto,
    count(*) filter (where i.status_processamento = 'erro')::integer as total_itens_com_erro,
    coalesce(sum(i.valor_total), 0)::numeric(14, 4) as valor_total_itens_nf
  from public.olist_notas_entrada_itens_snapshot i
  group by i.nota_snapshot_id
)
select
  n.id as nota_snapshot_id,
  n.id_nota_olist,
  n.numero as numero_nf,
  n.serie,
  n.chave_acesso,
  n.data_emissao,
  n.data_prevista,
  n.data_inclusao,
  n.fornecedor_nome,
  n.fornecedor_cpf_cnpj,
  coalesce(n.valor, 0)::numeric(14, 4) as valor_total_nf,
  coalesce(n.valor_produtos, 0)::numeric(14, 4) as valor_produtos_nf,
  coalesce(n.valor_frete, 0)::numeric(14, 4) as valor_frete_nf,
  coalesce(n.valor_ipi, 0)::numeric(14, 4) as valor_ipi_nf,
  coalesce(n.valor_icms_st, 0)::numeric(14, 4) as valor_icms_st_nf,
  n.status_processamento,
  n.mensagem_erro,
  n.compra_id,
  (n.compra_id is not null) as compra_vinculada,
  coalesce(ipn.total_itens_nf, 0)::integer as total_itens_nf,
  coalesce(ipn.total_itens_com_produto, 0)::integer as total_itens_com_produto,
  coalesce(ipn.total_itens_sem_produto, 0)::integer as total_itens_sem_produto,
  coalesce(ipn.total_itens_com_erro, 0)::integer as total_itens_com_erro,
  coalesce(ipn.valor_total_itens_nf, 0)::numeric(14, 4) as valor_total_itens_nf,
  n.sincronizado_em,
  n.updated_at
from public.olist_notas_entrada_snapshot n
left join itens_por_nota ipn
  on ipn.nota_snapshot_id = n.id;

grant select on public.olist_notas_entrada_recentes_gerencial_view to anon;
grant select on public.olist_notas_entrada_recentes_gerencial_view to authenticated;
