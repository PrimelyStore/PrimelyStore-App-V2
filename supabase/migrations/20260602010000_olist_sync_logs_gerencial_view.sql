-- Etapa 134 - Parte 2C
-- View gerencial segura para logs de sincronização Olist.
--
-- Objetivo:
-- Exibir na tela Integrações Olist apenas campos gerenciais dos logs,
-- sem expor raw_data, detalhes internos, tokens ou qualquer informação sensível.
--
-- Esta migration não processa pedidos, não cria vendas oficiais
-- e não executa baixa FIFO.

create or replace view public.olist_sync_logs_gerencial_view as
select
  'pedidos'::text as origem,
  tipo_sync,
  status,
  data_inicio,
  data_fim,
  pedidos_lidos as lidos,
  pedidos_inseridos as inseridos,
  pedidos_atualizados as atualizados,
  pedidos_com_erro as erros,
  mensagem,
  created_at
from public.olist_pedidos_sync_log

union all

select
  'notas_entrada'::text as origem,
  tipo_sync,
  status,
  data_inicio,
  data_fim,
  notas_lidas as lidos,
  notas_inseridas as inseridos,
  notas_atualizadas as atualizados,
  notas_com_erro as erros,
  mensagem,
  created_at
from public.olist_notas_entrada_sync_log;

comment on view public.olist_sync_logs_gerencial_view is
  'View segura e sanitizada para exibir logs gerenciais do Olist na tela Integrações Olist, sem expor raw_data ou detalhes internos.';

grant select on public.olist_sync_logs_gerencial_view to authenticated;
