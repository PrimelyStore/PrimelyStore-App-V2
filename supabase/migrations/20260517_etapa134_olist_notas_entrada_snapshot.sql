-- Etapa 134 - Parte 5
-- Snapshots de Notas de Entrada e Fornecedores do Olist
-- Execute no Supabase SQL Editor ou mantenha como documentação/versionamento local.

begin;

create table if not exists public.olist_fornecedores_snapshot (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'olist_tiny',

  id_contato_olist bigint not null,
  codigo text,
  nome text,
  fantasia text,
  tipo_pessoa text,
  cpf_cnpj text,
  inscricao_estadual text,
  rg text,
  telefone text,
  celular text,
  email text,

  endereco text,
  numero text,
  complemento text,
  bairro text,
  municipio text,
  cep text,
  uf text,
  pais text,

  situacao text,
  data_criacao timestamptz,
  data_atualizacao timestamptz,
  status_crm text,

  tipos_json jsonb,
  contatos_json jsonb,
  raw_json jsonb,

  fornecedor_id uuid,

  status_processamento text not null default 'pendente',
  mensagem_erro text,

  sincronizado_em timestamptz not null default now(),
  processado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint olist_fornecedores_snapshot_status_check
    check (status_processamento in ('pendente', 'processado', 'erro', 'ignorado'))
);

create unique index if not exists olist_fornecedores_snapshot_uidx
  on public.olist_fornecedores_snapshot (provider, id_contato_olist);

create index if not exists idx_olist_fornecedores_snapshot_cpf_cnpj
  on public.olist_fornecedores_snapshot (cpf_cnpj);

create index if not exists idx_olist_fornecedores_snapshot_status
  on public.olist_fornecedores_snapshot (status_processamento);


create table if not exists public.olist_notas_entrada_snapshot (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'olist_tiny',

  id_nota_olist bigint not null,
  tipo text not null default 'E',
  situacao integer,

  numero text,
  serie text,
  chave_acesso text,

  data_emissao timestamptz,
  data_prevista timestamptz,
  data_inclusao timestamptz,

  id_contato_olist bigint,
  fornecedor_nome text,
  fornecedor_codigo text,
  fornecedor_fantasia text,
  fornecedor_tipo_pessoa text,
  fornecedor_cpf_cnpj text,
  fornecedor_inscricao_estadual text,
  fornecedor_email text,
  fornecedor_telefone text,

  valor numeric(14, 4) not null default 0,
  valor_produtos numeric(14, 4) not null default 0,
  valor_frete numeric(14, 4) not null default 0,
  valor_desconto numeric(14, 4) not null default 0,
  valor_outras numeric(14, 4) not null default 0,
  valor_seguro numeric(14, 4) not null default 0,
  valor_ipi numeric(14, 4) not null default 0,
  valor_icms numeric(14, 4) not null default 0,
  valor_icms_st numeric(14, 4) not null default 0,
  valor_servicos numeric(14, 4) not null default 0,
  valor_issqn numeric(14, 4) not null default 0,
  valor_faturado numeric(14, 4) not null default 0,
  valor_nota_com_impostos numeric(14, 4) not null default 0,

  finalidade integer,
  regime_tributario integer,
  condicao_pagamento text,
  observacoes text,

  origem_id text,
  origem_tipo text,

  transportador_json jsonb,
  endereco_entrega_json jsonb,
  ecommerce_json jsonb,
  parcelas_json jsonb,
  pagamentos_integrados_json jsonb,
  marcadores_json jsonb,
  itens_basicos_json jsonb,
  raw_json jsonb,

  compra_id uuid,
  fornecedor_id uuid,

  status_processamento text not null default 'pendente',
  mensagem_erro text,

  sincronizado_em timestamptz not null default now(),
  processado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint olist_notas_entrada_snapshot_tipo_check
    check (tipo = 'E'),

  constraint olist_notas_entrada_snapshot_status_check
    check (status_processamento in ('pendente', 'processado', 'erro', 'ignorado'))
);

create unique index if not exists olist_notas_entrada_snapshot_uidx
  on public.olist_notas_entrada_snapshot (provider, id_nota_olist);

create index if not exists idx_olist_notas_entrada_snapshot_chave_acesso
  on public.olist_notas_entrada_snapshot (chave_acesso);

create index if not exists idx_olist_notas_entrada_snapshot_numero
  on public.olist_notas_entrada_snapshot (numero);

create index if not exists idx_olist_notas_entrada_snapshot_fornecedor_cpf_cnpj
  on public.olist_notas_entrada_snapshot (fornecedor_cpf_cnpj);

create index if not exists idx_olist_notas_entrada_snapshot_status
  on public.olist_notas_entrada_snapshot (status_processamento);

create index if not exists idx_olist_notas_entrada_snapshot_data_emissao
  on public.olist_notas_entrada_snapshot (data_emissao);


create table if not exists public.olist_notas_entrada_itens_snapshot (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'olist_tiny',

  nota_snapshot_id uuid not null
    references public.olist_notas_entrada_snapshot(id)
    on delete cascade,

  id_nota_olist bigint not null,
  id_item_olist bigint not null,
  id_produto_olist bigint,

  codigo text,
  ncm text,
  descricao text,
  unidade text,

  quantidade numeric(14, 4) not null default 0,
  valor_unitario numeric(14, 4) not null default 0,
  valor_total numeric(14, 4) not null default 0,
  valor_frete numeric(14, 4) not null default 0,
  valor_total_com_impostos numeric(14, 4) not null default 0,

  cfop text,
  natureza_operacao text,
  origem text,
  gtin text,
  gtin_embalagem text,
  tipo text,

  numero_pedido_compra text,
  numero_item_pedido_compra integer,

  peso_liq numeric(14, 4),
  peso_bruto numeric(14, 4),

  info_adicional text,
  obs text,

  pis_valor_imposto numeric(14, 4) not null default 0,
  icms_valor_imposto numeric(14, 4) not null default 0,
  cofins_valor_imposto numeric(14, 4) not null default 0,
  simples_valor_imposto numeric(14, 4) not null default 0,
  ipi_valor_imposto numeric(14, 4) not null default 0,
  cbs_valor_imposto numeric(14, 4) not null default 0,
  ibs_uf_valor_imposto numeric(14, 4) not null default 0,

  ibs_cbs_cst text,
  ibs_cbs_class_trib text,

  impostos_total numeric(14, 4) generated always as (
    coalesce(pis_valor_imposto, 0)
    + coalesce(icms_valor_imposto, 0)
    + coalesce(cofins_valor_imposto, 0)
    + coalesce(simples_valor_imposto, 0)
    + coalesce(ipi_valor_imposto, 0)
    + coalesce(cbs_valor_imposto, 0)
    + coalesce(ibs_uf_valor_imposto, 0)
  ) stored,

  produto_id uuid,
  compra_item_id uuid,

  raw_json_basico jsonb,
  raw_json_detalhado jsonb,

  status_processamento text not null default 'pendente',
  mensagem_erro text,

  sincronizado_em timestamptz not null default now(),
  processado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint olist_notas_entrada_itens_snapshot_status_check
    check (status_processamento in ('pendente', 'processado', 'erro', 'ignorado'))
);

create unique index if not exists olist_notas_entrada_itens_snapshot_uidx
  on public.olist_notas_entrada_itens_snapshot (
    provider,
    id_nota_olist,
    id_item_olist
  );

create index if not exists idx_olist_notas_entrada_itens_snapshot_nota
  on public.olist_notas_entrada_itens_snapshot (nota_snapshot_id);

create index if not exists idx_olist_notas_entrada_itens_snapshot_codigo
  on public.olist_notas_entrada_itens_snapshot (codigo);

create index if not exists idx_olist_notas_entrada_itens_snapshot_gtin
  on public.olist_notas_entrada_itens_snapshot (gtin);

create index if not exists idx_olist_notas_entrada_itens_snapshot_produto_id
  on public.olist_notas_entrada_itens_snapshot (produto_id);

create index if not exists idx_olist_notas_entrada_itens_snapshot_status
  on public.olist_notas_entrada_itens_snapshot (status_processamento);


create table if not exists public.olist_notas_entrada_sync_log (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'olist_tiny',
  tipo_sync text not null default 'notas_entrada',

  status text not null default 'iniciado',

  data_inicio timestamptz not null default now(),
  data_fim timestamptz,

  limit_usado integer,
  offset_usado integer,
  total_reportado_api integer,

  notas_lidas integer not null default 0,
  notas_inseridas integer not null default 0,
  notas_atualizadas integer not null default 0,
  itens_lidos integer not null default 0,
  itens_inseridos integer not null default 0,
  itens_atualizados integer not null default 0,
  fornecedores_lidos integer not null default 0,
  fornecedores_inseridos integer not null default 0,
  fornecedores_atualizados integer not null default 0,
  notas_com_erro integer not null default 0,
  itens_com_erro integer not null default 0,

  mensagem text,
  detalhes jsonb,

  created_at timestamptz not null default now(),

  constraint olist_notas_entrada_sync_log_status_check
    check (status in ('iniciado', 'sucesso', 'erro', 'parcial'))
);

create index if not exists idx_olist_notas_entrada_sync_log_data_inicio
  on public.olist_notas_entrada_sync_log (data_inicio desc);

create index if not exists idx_olist_notas_entrada_sync_log_status
  on public.olist_notas_entrada_sync_log (status);

commit;
