create or replace view public.compras_controle_recebimento_publico as
select
  compra_id,
  classificacao_operacional,
  bloqueia_recebimento,
  motivo,
  origem
from public.compras_controle_recebimento;

grant select on public.compras_controle_recebimento_publico to anon;
grant select on public.compras_controle_recebimento_publico to authenticated;
