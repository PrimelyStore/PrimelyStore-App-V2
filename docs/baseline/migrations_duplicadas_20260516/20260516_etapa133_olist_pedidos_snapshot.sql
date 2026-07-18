-- Etapa 133 - Parte 6
-- Criação das tabelas de snapshot de pedidos do Olist/Tiny.
-- Este arquivo registra no Git o SQL já executado no Supabase.

begin;

create table if not exists public.olist_pedidos_snapshot (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'olist_tiny',

  id_pedido_olist bigint not null,

  numero_pedido text,
  numero_pedido_ecommerce text,
  numero_pedido_canal_venda text,

  ecommerce_nome text,
  canal_venda_olist text,
  origem_pedido text,
  situacao text,

  data_pedido timestamp with time zone,
  data_criacao_olist timestamp with time zone,
  data_alteracao_olist timestamp with time zone,
  data_envio timestamp with time zone,
  data_entrega timestamp with time zone,

  id_deposito_olist bigint,
  deposito_nome text,
  transportador_nome text,

  valor_produtos numeric not null default 0,
  valor_frete numeric not null default 0,
  valor_desconto numeric not null default 0,
  valor_outras_despesas numeric not null default 0,
  valor_total numeric not null default 0,

  canal_venda_id uuid references public.canais_venda(id) on delete set null,
  local_saida_id uuid references public.locais_estoque(id) on delete set null,

  venda_id uuid references public.vendas(id) on delete set null,

  status_processamento text not null default 'pendente',
  mensagem_erro text,

  raw_data jsonb not null default '{}'::jsonb,

  sincronizado_em timestamp with time zone not null default now(),
  processado_em timestamp with time zone,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint olist_pedidos_snapshot_status_processamento_check
    check (status_processamento in ('pendente', 'processado', 'erro', 'ignorado')),

  constraint olist_pedidos_snapshot_valor_produtos_check
    check (valor_produtos >= 0),

  constraint olist_pedidos_snapshot_valor_frete_check
    check (valor_frete >= 0),

  constraint olist_pedidos_snapshot_valor_desconto_check
    check (valor_desconto >= 0),

  constraint olist_pedidos_snapshot_valor_outras_despesas_check
    check (valor_outras_despesas >= 0),

  constraint olist_pedidos_snapshot_valor_total_check
    check (valor_total >= 0)
);

create unique index if not exists olist_pedidos_snapshot_provider_id_pedido_olist_uidx
  on public.olist_pedidos_snapshot (provider, id_pedido_olist);

create index if not exists idx_olist_pedidos_snapshot_numero_pedido
  on public.olist_pedidos_snapshot (numero_pedido);

create index if not exists idx_olist_pedidos_snapshot_numero_pedido_ecommerce
  on public.olist_pedidos_snapshot (numero_pedido_ecommerce);

create index if not exists idx_olist_pedidos_snapshot_status_processamento
  on public.olist_pedidos_snapshot (status_processamento);

create index if not exists idx_olist_pedidos_snapshot_data_pedido
  on public.olist_pedidos_snapshot (data_pedido);

create index if not exists idx_olist_pedidos_snapshot_venda_id
  on public.olist_pedidos_snapshot (venda_id);

create table if not exists public.olist_pedidos_itens_snapshot (
  id uuid primary key default gen_random_uuid(),

  pedido_snapshot_id uuid not null references public.olist_pedidos_snapshot(id) on delete cascade,

  provider text not null default 'olist_tiny',

  id_pedido_olist bigint not null,

  ordem_item integer not null,

  id_item_olist text,
  id_produto_olist bigint,

  sku text,
  descricao text,

  quantidade numeric not null default 0,
  valor_unitario numeric not null default 0,
  valor_desconto_item numeric not null default 0,
  valor_total_item numeric not null default 0,

  produto_id uuid references public.produtos(id) on delete set null,
  venda_item_id uuid references public.vendas_itens(id) on delete set null,

  status_processamento text not null default 'pendente',
  mensagem_erro text,

  raw_data jsonb not null default '{}'::jsonb,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint olist_pedidos_itens_snapshot_status_processamento_check
    check (status_processamento in ('pendente', 'processado', 'erro', 'ignorado')),

  constraint olist_pedidos_itens_snapshot_quantidade_check
    check (quantidade >= 0),

  constraint olist_pedidos_itens_snapshot_valor_unitario_check
    check (valor_unitario >= 0),

  constraint olist_pedidos_itens_snapshot_valor_desconto_item_check
    check (valor_desconto_item >= 0),

  constraint olist_pedidos_itens_snapshot_valor_total_item_check
    check (valor_total_item >= 0)
);

create unique index if not exists olist_pedidos_itens_snapshot_pedido_ordem_uidx
  on public.olist_pedidos_itens_snapshot (pedido_snapshot_id, ordem_item);

create index if not exists idx_olist_pedidos_itens_snapshot_pedido_snapshot_id
  on public.olist_pedidos_itens_snapshot (pedido_snapshot_id);

create index if not exists idx_olist_pedidos_itens_snapshot_id_pedido_olist
  on public.olist_pedidos_itens_snapshot (id_pedido_olist);

create index if not exists idx_olist_pedidos_itens_snapshot_sku
  on public.olist_pedidos_itens_snapshot (sku);

create index if not exists idx_olist_pedidos_itens_snapshot_produto_id
  on public.olist_pedidos_itens_snapshot (produto_id);

create index if not exists idx_olist_pedidos_itens_snapshot_venda_item_id
  on public.olist_pedidos_itens_snapshot (venda_item_id);

create table if not exists public.olist_pedidos_sync_log (
  id uuid primary key default gen_random_uuid(),

  provider text not null default 'olist_tiny',
  tipo_sync text not null default 'pedidos',

  status text not null default 'iniciado',

  data_inicio timestamp with time zone not null default now(),
  data_fim timestamp with time zone,

  filtro_data_inicial timestamp with time zone,
  filtro_data_final timestamp with time zone,

  pedidos_lidos integer not null default 0,
  pedidos_inseridos integer not null default 0,
  pedidos_atualizados integer not null default 0,
  pedidos_com_erro integer not null default 0,

  mensagem text,
  raw_data jsonb not null default '{}'::jsonb,

  created_at timestamp with time zone not null default now(),

  constraint olist_pedidos_sync_log_status_check
    check (status in ('iniciado', 'sucesso', 'erro', 'parcial')),

  constraint olist_pedidos_sync_log_contadores_check
    check (
      pedidos_lidos >= 0
      and pedidos_inseridos >= 0
      and pedidos_atualizados >= 0
      and pedidos_com_erro >= 0
    )
);

create index if not exists idx_olist_pedidos_sync_log_status
  on public.olist_pedidos_sync_log (status);

create index if not exists idx_olist_pedidos_sync_log_data_inicio
  on public.olist_pedidos_sync_log (data_inicio);

commit;
