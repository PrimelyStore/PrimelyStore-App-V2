create or replace view public.olist_notas_entrada_resumo_gerencial_view as
select
  count(*)::integer as total_notas,
  count(*) filter (where status_processamento = 'pendente')::integer as notas_pendentes,
  count(*) filter (where status_processamento = 'processado')::integer as notas_processadas,
  count(*) filter (where status_processamento = 'erro')::integer as notas_com_erro,
  count(*) filter (where status_processamento = 'ignorado')::integer as notas_ignoradas,
  coalesce(sum(valor), 0)::numeric(14, 4) as valor_total,
  max(sincronizado_em) as ultima_sincronizacao
from public.olist_notas_entrada_snapshot;

grant select on public.olist_notas_entrada_resumo_gerencial_view to anon;
grant select on public.olist_notas_entrada_resumo_gerencial_view to authenticated;
