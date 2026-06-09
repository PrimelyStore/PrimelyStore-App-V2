-- Baseline local minima do schema legado.
--
-- Objetivo:
-- - permitir reproducao local do schema antes da migration 20260516;
-- - permitir supabase start/local reset em ambiente local zerado;
-- - nao inserir dados reais;
-- - nao transformar o Primely Store em ERP;
-- - manter Olist/Tiny como ERP operacional oficial;
-- - manter Primely Store como painel gerencial inteligente;
-- - servir apenas como base estrutural para supabase start/local reset.
--
-- Esta migration foi montada a partir da auditoria somente leitura do schema remoto.
-- Nao execute supabase db push com esta migration sem autorizacao explicita.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.definir_atualizado_por()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then
    if tg_op = 'UPDATE' then
      new.atualizado_por = old.atualizado_por;
    end if;
  else
    new.atualizado_por = auth.uid();
  end if;

  return new;
end;
$$;

create table if not exists public.usuarios_perfis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text,
  email text not null,
  papel text not null default 'operador',
  tipo_usuario text not null default 'humano',
  observacoes text,
  status text not null default 'ativo',
  ultimo_login_em timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint usuarios_perfis_email_key unique (email),
  constraint usuarios_perfis_user_id_key unique (user_id),
  constraint usuarios_perfis_papel_check
    check (papel in ('admin', 'operador', 'financeiro', 'leitura', 'integracao', 'ia')),
  constraint usuarios_perfis_tipo_usuario_check
    check (tipo_usuario in ('humano', 'n8n', 'ia', 'api', 'sistema')),
  constraint usuarios_perfis_status_check
    check (status in ('ativo', 'inativo', 'bloqueado'))
);

-- Funcoes de autorizacao necessarias para permitir a criacao de RLS/policies
-- no ambiente local. Elas reproduzem a regra auditada e nao representam
-- mudanca de regra de negocio.
create or replace function public.usuario_tem_papel(p_papeis text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_perfis up
    where up.user_id = auth.uid()
      and up.status = 'ativo'
      and up.papel = any(p_papeis)
  );
$$;

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_tem_papel(array['admin']);
$$;

create or replace function public.usuario_pode_ler_operacional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_tem_papel(
    array['admin', 'operador', 'financeiro', 'leitura', 'integracao', 'ia']
  );
$$;

create or replace function public.usuario_pode_escrever_operacional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_tem_papel(
    array['admin', 'operador', 'integracao']
  );
$$;

create or replace function public.usuario_pode_acessar_financeiro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_tem_papel(
    array['admin', 'financeiro']
  );
$$;

create or replace function public.usuario_pode_escrever_financeiro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_tem_papel(
    array['admin', 'financeiro']
  );
$$;

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sku text not null,
  asin varchar(10),
  ean text,
  marca text,
  categoria text,
  status text not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint produtos_sku_key unique (sku),
  constraint produtos_asin_tamanho_check
    check (asin is null or length(asin::text) = 10)
);

create table if not exists public.canais_venda (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  modalidade_logistica text not null default 'nao_informado',
  codigo_externo text,
  marketplace_id text,
  observacoes text,
  status text not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint canais_venda_nome_unique unique (nome),
  constraint canais_venda_tipo_check
    check (tipo in ('amazon', 'mercado_livre', 'shopee', 'site_proprio', 'venda_manual', 'outro')),
  constraint canais_venda_modalidade_logistica_check
    check (modalidade_logistica in ('fba', 'fbm', 'dba', 'mercado_livre_full', 'mercado_livre_flex', 'estoque_proprio', 'nao_informado', 'outro')),
  constraint canais_venda_status_check
    check (status in ('ativo', 'inativo'))
);

create table if not exists public.locais_estoque (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  codigo_externo text,
  responsavel_nome text,
  email text,
  telefone text,
  whatsapp text,
  endereco text,
  cidade text,
  estado text,
  pais text default 'Brasil',
  observacoes text,
  status text not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint locais_estoque_tipo_check
    check (tipo in ('prep_center', 'amazon_fba', 'mercado_livre_full', 'estoque_proprio', 'fornecedor', 'outro')),
  constraint locais_estoque_status_check
    check (status in ('ativo', 'inativo'))
);

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_fantasia text,
  tipo_pessoa text not null default 'nao_informado',
  documento text,
  contato_nome text,
  email text,
  telefone text,
  whatsapp text,
  site text,
  endereco text,
  cidade text,
  estado text,
  pais text default 'Brasil',
  observacoes text,
  status text not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fornecedores_documento_key unique (documento),
  constraint fornecedores_tipo_pessoa_check
    check (tipo_pessoa in ('fisica', 'juridica', 'internacional', 'nao_informado')),
  constraint fornecedores_status_check
    check (status in ('ativo', 'inativo'))
);

-- Tabela incluida porque a migration 202605250001 cria a view
-- public.olist_compras_itens_auditoria, que depende dela. Isto e apenas
-- suporte local para replay das migrations, sem dados reais e sem nova
-- funcionalidade operacional.
create table if not exists public.produto_fornecedor_conversao_unidade (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid references public.fornecedores(id),
  produto_id uuid not null references public.produtos(id),
  codigo_produto_fornecedor text,
  unidade_nf text not null,
  fator_conversao numeric(14,4) not null default 1,
  ativo boolean not null default true,
  origem text not null default 'manual',
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint produto_fornecedor_conversao_unidade_fator_check
    check (fator_conversao > 0)
);

create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid references public.fornecedores(id) on delete restrict,
  local_destino_id uuid references public.locais_estoque(id) on delete restrict,
  numero_pedido text,
  numero_nota_fiscal text,
  data_compra date not null default current_date,
  data_prevista_entrega date,
  data_recebimento date,
  status text not null default 'rascunho',
  valor_frete numeric(12,2) not null default 0,
  valor_desconto numeric(12,2) not null default 0,
  outros_custos numeric(12,2) not null default 0,
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint compras_status_check
    check (status in ('rascunho', 'pedido_realizado', 'parcialmente_recebido', 'recebido', 'cancelado')),
  constraint compras_valor_frete_check check (valor_frete >= 0),
  constraint compras_valor_desconto_check check (valor_desconto >= 0),
  constraint compras_outros_custos_check check (outros_custos >= 0)
);

create table if not exists public.compras_itens (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade integer not null,
  quantidade_recebida integer not null default 0,
  custo_unitario numeric(12,4) not null default 0,
  valor_desconto_item numeric(12,2) not null default 0,
  valor_impostos_item numeric(12,2) not null default 0,
  outros_custos_item numeric(12,2) not null default 0,
  codigo_produto_fornecedor text,
  lote text,
  validade date,
  status text not null default 'pendente',
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint compras_itens_quantidade_check check (quantidade > 0),
  constraint compras_itens_quantidade_recebida_check
    check (quantidade_recebida >= 0 and quantidade_recebida <= quantidade),
  constraint compras_itens_custo_unitario_check check (custo_unitario >= 0),
  constraint compras_itens_valor_desconto_item_check check (valor_desconto_item >= 0),
  constraint compras_itens_valor_impostos_item_check check (valor_impostos_item >= 0),
  constraint compras_itens_outros_custos_item_check check (outros_custos_item >= 0),
  constraint compras_itens_status_check
    check (status in ('pendente', 'parcialmente_recebido', 'recebido', 'cancelado'))
);

create table if not exists public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete restrict,
  local_origem_id uuid references public.locais_estoque(id) on delete restrict,
  local_destino_id uuid references public.locais_estoque(id) on delete restrict,
  tipo text not null,
  quantidade integer not null,
  data_movimentacao timestamp with time zone not null default now(),
  documento_origem text,
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint movimentacoes_estoque_tipo_check
    check (tipo in ('compra_entrada', 'transferencia', 'venda_saida', 'ajuste_entrada', 'ajuste_saida', 'devolucao_entrada', 'perda_saida')),
  constraint movimentacoes_estoque_quantidade_check check (quantidade > 0),
  constraint movimentacoes_estoque_entrada_destino_check
    check (tipo not in ('compra_entrada', 'ajuste_entrada', 'devolucao_entrada') or local_destino_id is not null),
  constraint movimentacoes_estoque_saida_origem_check
    check (tipo not in ('venda_saida', 'ajuste_saida', 'perda_saida') or local_origem_id is not null),
  constraint movimentacoes_estoque_transferencia_locais_check
    check (tipo <> 'transferencia' or (local_origem_id is not null and local_destino_id is not null and local_origem_id <> local_destino_id))
);

create table if not exists public.estoque_lotes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete restrict,
  compra_id uuid references public.compras(id) on delete set null,
  compra_item_id uuid references public.compras_itens(id) on delete set null,
  local_estoque_id uuid not null references public.locais_estoque(id) on delete restrict,
  codigo_lote text,
  documento_origem text,
  data_entrada timestamp with time zone not null default now(),
  quantidade_inicial integer not null,
  quantidade_disponivel integer not null,
  custo_unitario_compra numeric(12,4) not null default 0,
  custo_unitario_frete_rateado numeric(12,4) not null default 0,
  custo_unitario_outros_rateado numeric(12,4) not null default 0,
  custo_unitario_final numeric(12,4) not null default 0,
  custo_total_lote numeric(12,4) not null default 0,
  observacoes text,
  status text not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  lote_origem_id uuid references public.estoque_lotes(id) on delete set null,
  movimentacao_estoque_id uuid references public.movimentacoes_estoque(id) on delete set null,
  tipo_lote text not null default 'compra',
  constraint estoque_lotes_quantidade_inicial_check check (quantidade_inicial > 0),
  constraint estoque_lotes_quantidade_disponivel_check
    check (quantidade_disponivel >= 0 and quantidade_disponivel <= quantidade_inicial),
  constraint estoque_lotes_custo_unitario_compra_check check (custo_unitario_compra >= 0),
  constraint estoque_lotes_custo_unitario_frete_rateado_check check (custo_unitario_frete_rateado >= 0),
  constraint estoque_lotes_custo_unitario_outros_rateado_check check (custo_unitario_outros_rateado >= 0),
  constraint estoque_lotes_custo_unitario_final_check check (custo_unitario_final >= 0),
  constraint estoque_lotes_custo_total_lote_check check (custo_total_lote >= 0),
  constraint estoque_lotes_status_check
    check (status in ('ativo', 'consumido', 'cancelado')),
  constraint estoque_lotes_tipo_lote_check
    check (tipo_lote in ('compra', 'transferencia', 'ajuste', 'devolucao'))
);

create table if not exists public.vendas (
  id uuid primary key default gen_random_uuid(),
  canal_venda_id uuid references public.canais_venda(id) on delete restrict,
  local_saida_id uuid references public.locais_estoque(id) on delete restrict,
  numero_pedido text,
  numero_pedido_marketplace text,
  data_venda timestamp with time zone not null default now(),
  data_pagamento date,
  data_envio date,
  data_entrega date,
  status text not null default 'rascunho',
  valor_produtos numeric(12,2) not null default 0,
  valor_frete_cobrado numeric(12,2) not null default 0,
  valor_desconto numeric(12,2) not null default 0,
  valor_taxas_marketplace numeric(12,2) not null default 0,
  valor_taxas_logistica numeric(12,2) not null default 0,
  valor_impostos numeric(12,2) not null default 0,
  outros_custos numeric(12,2) not null default 0,
  valor_total numeric(12,2) not null default 0,
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint vendas_status_check
    check (status in ('rascunho', 'aprovado', 'enviado', 'entregue', 'cancelado', 'devolvido', 'reembolsado')),
  constraint vendas_valor_produtos_check check (valor_produtos >= 0),
  constraint vendas_valor_frete_cobrado_check check (valor_frete_cobrado >= 0),
  constraint vendas_valor_desconto_check check (valor_desconto >= 0),
  constraint vendas_valor_taxas_marketplace_check check (valor_taxas_marketplace >= 0),
  constraint vendas_valor_taxas_logistica_check check (valor_taxas_logistica >= 0),
  constraint vendas_valor_impostos_check check (valor_impostos >= 0),
  constraint vendas_outros_custos_check check (outros_custos >= 0),
  constraint vendas_valor_total_check check (valor_total >= 0)
);

create table if not exists public.vendas_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  sku_vendido text,
  asin_vendido varchar(10),
  quantidade integer not null,
  valor_unitario numeric(12,2) not null default 0,
  valor_desconto_item numeric(12,2) not null default 0,
  valor_taxa_marketplace_item numeric(12,2) not null default 0,
  valor_taxa_logistica_item numeric(12,2) not null default 0,
  valor_imposto_item numeric(12,2) not null default 0,
  outros_custos_item numeric(12,2) not null default 0,
  custo_unitario_estimado numeric(12,4),
  status text not null default 'ativo',
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint vendas_itens_asin_tamanho_check
    check (asin_vendido is null or length(asin_vendido::text) = 10),
  constraint vendas_itens_quantidade_check check (quantidade > 0),
  constraint vendas_itens_valor_unitario_check check (valor_unitario >= 0),
  constraint vendas_itens_valor_desconto_item_check check (valor_desconto_item >= 0),
  constraint vendas_itens_valor_taxa_marketplace_item_check check (valor_taxa_marketplace_item >= 0),
  constraint vendas_itens_valor_taxa_logistica_item_check check (valor_taxa_logistica_item >= 0),
  constraint vendas_itens_valor_imposto_item_check check (valor_imposto_item >= 0),
  constraint vendas_itens_outros_custos_item_check check (outros_custos_item >= 0),
  constraint vendas_itens_custo_unitario_estimado_check
    check (custo_unitario_estimado is null or custo_unitario_estimado >= 0),
  constraint vendas_itens_status_check
    check (status in ('ativo', 'cancelado', 'devolvido', 'reembolsado'))
);

create table if not exists public.vendas_itens_lotes (
  id uuid primary key default gen_random_uuid(),
  venda_item_id uuid not null references public.vendas_itens(id) on delete cascade,
  estoque_lote_id uuid not null references public.estoque_lotes(id) on delete restrict,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade_consumida integer not null,
  custo_unitario_real numeric(12,4) not null default 0,
  custo_total_real numeric(12,4) not null default 0,
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint vendas_itens_lotes_unico_check unique (venda_item_id, estoque_lote_id),
  constraint vendas_itens_lotes_quantidade_check check (quantidade_consumida > 0),
  constraint vendas_itens_lotes_custo_unitario_real_check check (custo_unitario_real >= 0),
  constraint vendas_itens_lotes_custo_total_real_check check (custo_total_real >= 0)
);

create table if not exists public.olist_canais_venda_mapeamento (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'olist_tiny',
  ecommerce_nome_olist text not null,
  canal_venda_olist text not null default '',
  canal_venda_id uuid not null references public.canais_venda(id) on delete restrict,
  local_saida_id uuid not null references public.locais_estoque(id) on delete restrict,
  status text not null default 'ativo',
  observacoes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint olist_canais_venda_mapeamento_status_check
    check (status in ('ativo', 'inativo'))
);

-- Versao base de produtos_precificacao.
-- As colunas de origem/cache/cotacao continuam sendo adicionadas pela migration
-- 20260603000300_precificacao_e_cotacoes.sql.
create table if not exists public.produtos_precificacao (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  canal_venda_id uuid not null references public.canais_venda(id) on delete restrict,
  preco_venda numeric(12,2) not null default 0,
  custo_produto numeric(12,4) not null default 0,
  custo_prep_center numeric(12,2) not null default 0,
  custo_embalagem numeric(12,2) not null default 0,
  custo_frete_inbound numeric(12,2) not null default 0,
  taxa_marketplace numeric(12,2) not null default 0,
  taxa_logistica numeric(12,2) not null default 0,
  taxa_ads_estimada numeric(12,2) not null default 0,
  imposto_estimado numeric(12,2) not null default 0,
  outros_custos numeric(12,2) not null default 0,
  margem_desejada_percentual numeric(8,2),
  roi_desejado_percentual numeric(8,2),
  observacoes text,
  status text not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint produtos_precificacao_unico_check unique (produto_id, canal_venda_id),
  constraint produtos_precificacao_preco_venda_check check (preco_venda >= 0),
  constraint produtos_precificacao_custo_produto_check check (custo_produto >= 0),
  constraint produtos_precificacao_custo_prep_center_check check (custo_prep_center >= 0),
  constraint produtos_precificacao_custo_embalagem_check check (custo_embalagem >= 0),
  constraint produtos_precificacao_custo_frete_inbound_check check (custo_frete_inbound >= 0),
  constraint produtos_precificacao_taxa_marketplace_check check (taxa_marketplace >= 0),
  constraint produtos_precificacao_taxa_logistica_check check (taxa_logistica >= 0),
  constraint produtos_precificacao_taxa_ads_estimada_check check (taxa_ads_estimada >= 0),
  constraint produtos_precificacao_imposto_estimado_check check (imposto_estimado >= 0),
  constraint produtos_precificacao_outros_custos_check check (outros_custos >= 0),
  constraint produtos_precificacao_margem_desejada_check
    check (margem_desejada_percentual is null or margem_desejada_percentual >= 0),
  constraint produtos_precificacao_roi_desejado_check
    check (roi_desejado_percentual is null or roi_desejado_percentual >= 0),
  constraint produtos_precificacao_status_check
    check (status in ('ativo', 'inativo'))
);

-- View incluida porque a migration 20260516 cria funcao que depende de
-- public.saldos_estoque. Isto e apenas suporte local minimo para replay das
-- migrations e nao uma nova funcionalidade operacional.
create or replace view public.saldos_estoque
with (security_invoker = true)
as
with movimentos as (
  select
    produto_id,
    local_destino_id as local_estoque_id,
    quantidade
  from public.movimentacoes_estoque
  where local_destino_id is not null
    and tipo in ('compra_entrada', 'transferencia', 'ajuste_entrada', 'devolucao_entrada')

  union all

  select
    produto_id,
    local_origem_id as local_estoque_id,
    quantidade * -1 as quantidade
  from public.movimentacoes_estoque
  where local_origem_id is not null
    and tipo in ('transferencia', 'venda_saida', 'ajuste_saida', 'perda_saida')
)
select
  p.id as produto_id,
  p.nome as produto_nome,
  p.sku as produto_sku,
  p.asin as produto_asin,
  l.id as local_estoque_id,
  l.nome as local_estoque_nome,
  l.tipo as local_estoque_tipo,
  sum(m.quantidade) as saldo_atual
from movimentos m
join public.produtos p
  on p.id = m.produto_id
join public.locais_estoque l
  on l.id = m.local_estoque_id
group by
  p.id,
  p.nome,
  p.sku,
  p.asin,
  l.id,
  l.nome,
  l.tipo
having sum(m.quantidade) <> 0;

create index if not exists idx_usuarios_perfis_user_id on public.usuarios_perfis(user_id);
create index if not exists idx_usuarios_perfis_email on public.usuarios_perfis(email);
create index if not exists idx_usuarios_perfis_papel on public.usuarios_perfis(papel);
create index if not exists idx_usuarios_perfis_tipo_usuario on public.usuarios_perfis(tipo_usuario);
create index if not exists idx_usuarios_perfis_status on public.usuarios_perfis(status);

create index if not exists idx_canais_venda_tipo on public.canais_venda(tipo);
create index if not exists idx_canais_venda_modalidade_logistica on public.canais_venda(modalidade_logistica);
create index if not exists idx_canais_venda_status on public.canais_venda(status);

create index if not exists idx_locais_estoque_tipo on public.locais_estoque(tipo);
create index if not exists idx_locais_estoque_status on public.locais_estoque(status);

create index if not exists idx_produto_fornecedor_conversao_unidade_fornecedor on public.produto_fornecedor_conversao_unidade(fornecedor_id);
create index if not exists idx_produto_fornecedor_conversao_unidade_produto on public.produto_fornecedor_conversao_unidade(produto_id);
create index if not exists idx_produto_fornecedor_conversao_unidade_unidade on public.produto_fornecedor_conversao_unidade(unidade_nf);
create unique index if not exists produto_fornecedor_conversao_unidade_uidx
  on public.produto_fornecedor_conversao_unidade(fornecedor_id, produto_id, codigo_produto_fornecedor, uuid_nf)
  where ativo = true;

create index if not exists idx_compras_fornecedor_id on public.compras(fornecedor_id);
create index if not exists idx_compras_local_destino_id on public.compras(local_destino_id);
create index if not exists idx_compras_data_compra on public.compras(data_compra);
create index if not exists idx_compras_status on public.compras(status);

create index if not exists idx_compras_itens_compra_id on public.compras_itens(compra_id);
create index if not exists idx_compras_itens_produto_id on public.compras_itens(produto_id);
create index if not exists idx_compras_itens_status on public.compras_itens(status);

create index if not exists idx_movimentacoes_estoque_produto_id on public.movimentacoes_estoque(produto_id);
create index if not exists idx_movimentacoes_estoque_local_origem_id on public.movimentacoes_estoque(local_origem_id);
create index if not exists idx_movimentacoes_estoque_local_destino_id on public.movimentacoes_estoque(local_destino_id);
create index if not exists idx_movimentacoes_estoque_tipo on public.movimentacoes_estoque(tipo);
create index if not exists idx_movimentacoes_estoque_data on public.movimentacoes_estoque(data_movimentacao);

create index if not exists idx_estoque_lotes_produto_id on public.estoque_lotes(produto_id);
create index if not exists idx_estoque_lotes_compra_id on public.estoque_lotes(compra_id);
create index if not exists idx_estoque_lotes_compra_item_id on public.estoque_lotes(compra_item_id);
create index if not exists idx_estoque_lotes_local_estoque_id on public.estoque_lotes(local_estoque_id);
create index if not exists idx_estoque_lotes_lote_origem_id on public.estoque_lotes(lote_origem_id);
create index if not exists idx_estoque_lotes_movimentacao_estoque_id on public.estoque_lotes(movimentacao_estoque_id);
create index if not exists idx_estoque_lotes_data_entrada on public.estoque_lotes(data_entrada);
create index if not exists idx_estoque_lotes_status on public.estoque_lotes(status);
create index if not exists idx_estoque_lotes_tipo_lote on public.estoque_lotes(tipo_lote);

create index if not exists idx_vendas_canal_venda_id on public.vendas(canal_venda_id);
create index if not exists idx_vendas_local_saida_id on public.vendas(local_saida_id);
create index if not exists idx_vendas_numero_pedido on public.vendas(numero_pedido);
create index if not exists idx_vendas_numero_pedido_marketplace on public.vendas(numero_pedido_marketplace);
create index if not exists idx_vendas_data_venda on public.vendas(data_venda);
create index if not exists idx_vendas_status on public.vendas(status);

create index if not exists idx_vendas_itens_venda_id on public.vendas_itens(venda_id);
create index if not exists idx_vendas_itens_produto_id on public.vendas_itens(produto_id);
create index if not exists idx_vendas_itens_sku_vendido on public.vendas_itens(sku_vendido);
create index if not exists idx_vendas_itens_asin_vendido on public.vendas_itens(asin_vendido);
create index if not exists idx_vendas_itens_status on public.vendas_itens(status);

create index if not exists idx_vendas_itens_lotes_venda_item_id on public.vendas_itens_lotes(venda_item_id);
create index if not exists idx_vendas_itens_lotes_estoque_lote_id on public.vendas_itens_lotes(estoque_lote_id);
create index if not exists idx_vendas_itens_lotes_produto_id on public.vendas_itens_lotes(produto_id);

create index if not exists idx_olist_canais_venda_mapeamento_canal_venda_id on public.olist_canais_venda_mapeamento(canal_venda_id);
create index if not exists idx_olist_canais_venda_mapeamento_local_saida_id on public.olist_canais_venda_mapeamento(local_saida_id);
create index if not exists idx_olist_canais_venda_mapeamento_status on public.olist_canais_venda_mapeamento(status);
create unique index if not exists olist_canais_venda_mapeamento_uidx
  on public.olist_canais_venda_mapeamento(provider, ecommerce_nome_olist, canal_venda_olist);

create index if not exists idx_produtos_precificacao_produto_id on public.produtos_precificacao(produto_id);
create index if not exists idx_produtos_precificacao_canal_venda_id on public.produtos_precificacao(canal_venda_id);
create index if not exists idx_produtos_precificacao_status on public.produtos_precificacao(status);

alter table public.usuarios_perfis enable row level security;
alter table public.produtos enable row level security;
alter table public.canais_venda enable row level security;
alter table public.locais_estoque enable row level security;
alter table public.fornecedores enable row level security;
alter table public.produto_fornecedor_conversao_unidade enable row level security;
alter table public.compras enable row level security;
alter table public.compras_itens enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.estoque_lotes enable row level security;
alter table public.vendas enable row level security;
alter table public.vendas_itens enable row level security;
alter table public.vendas_itens_lotes enable row level security;
alter table public.olist_canais_venda_mapeamento enable row level security;
alter table public.produtos_precificacao enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usuarios_perfis' and policyname = 'usuarios_perfis_select_proprio_ou_admin') then
    create policy usuarios_perfis_select_proprio_ou_admin on public.usuarios_perfis
      for select to authenticated
      using (user_id = auth.uid() or public.usuario_e_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usuarios_perfis' and policyname = 'usuarios_perfis_insert_admin') then
    create policy usuarios_perfis_insert_admin on public.usuarios_perfis
      for insert to authenticated
      with check (public.usuario_e_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usuarios_perfis' and policyname = 'usuarios_perfis_update_admin') then
    create policy usuarios_perfis_update_admin on public.usuarios_perfis
      for update to authenticated
      using (public.usuario_e_admin())
      with check (public.usuario_e_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usuarios_perfis' and policyname = 'usuarios_perfis_delete_admin') then
    create policy usuarios_perfis_delete_admin on public.usuarios_perfis
      for delete to authenticated
      using (public.usuario_e_admin());
  end if;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array['produtos', 'canais_venda', 'locais_estoque', 'fornecedores', 'compras', 'compras_itens', 'movimentacoes_estoque', 'estoque_lotes', 'vendas', 'vendas_itens', 'vendas_itens_lotes']
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select_operacional') then
      execute format('create policy %I on public.%I for select to authenticated using (public.usuario_pode_ler_operacional())', t || '_select_operacional', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert_operacional') then
      execute format('create policy %I on public.%I for insert to authenticated with check (public.usuario_pode_escrever_operacional())', t || '_insert_operacional', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update_operacional') then
      execute format('create policy %I on public.%I for update to authenticated using (public.usuario_pode_escrever_operacional()) with check (public.usuario_pode_escrever_operacional())', t || '_update_operacional', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_delete_admin') then
      execute format('create policy %I on public.%I for delete to authenticated using (public.usuario_e_admin())', t || '_delete_admin', t);
    end if;
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'produtos_precificacao' and policyname = 'produtos_precificacao_select_financeiro') then
    create policy produtos_precificacao_select_financeiro on public.produtos_precificacao
      for select to authenticated
      using (public.usuario_pode_acessar_financeiro());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'produtos_precificacao' and policyname = 'produtos_precificacao_insert_financeiro') then
    create policy produtos_precificacao_insert_financeiro on public.produtos_precificacao
      for insert to authenticated
      with check (public.usuario_pode_escrever_financeiro());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'produtos_precificacao' and policyname = 'produtos_precificacao_update_financeiro') then
    create policy produtos_precificacao_update_financeiro on public.produtos_precificacao
      for update to authenticated
      using (public.usuario_pode_escrever_financeiro())
      with check (public.usuario_pode_escrever_financeiro());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'produtos_precificacao' and policyname = 'produtos_precificacao_delete_admin') then
    create policy produtos_precificacao_delete_admin on public.produtos_precificacao
      for delete to authenticated
      using (public.usuario_e_admin());
  end if;
end $$;

-- O remoto auditado esta com RLS ativo em olist_canais_venda_mapeamento
-- sem policy propria explicita no dump filtrado. A baseline preserva esse estado.

do $$
declare
  item record;
begin
  for item in
    select *
    from (values
      ('usuarios_perfis', 'set_usuarios_perfis_updated_at'),
      ('produtos', 'set_produtos_updated_at'),
      ('canais_venda', 'set_canais_venda_updated_at'),
      ('locais_estoque', 'set_locais_estoque_updated_at'),
      ('fornecedores', 'set_fornecedores_updated_at'),
      ('compras', 'set_compras_updated_at'),
      ('compras_itens', 'set_compras_itens_updated_at'),
      ('movimentacoes_estoque', 'set_movimentacoes_estoque_updated_at'),
      ('estoque_lotes', 'set_estoque_lotes_updated_at'),
      ('vendas', 'set_vendas_updated_at'),
      ('vendas_itens', 'set_vendas_itens_updated_at'),
      ('vendas_itens_lotes', 'set_vendas_itens_lotes_updated_at'),
      ('produtos_precificacao', 'set_produtos_precificacao_updated_at')
    ) as v(tablename, triggername)
  loop
    if not exists (
      select 1
      from pg_trigger tg
      join pg_class c on c.oid = tg.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = item.tablename
        and tg.tgname = item.triggername
        and not tg.tgisinternal
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        item.triggername,
        item.tablename
      );
    end if;
  end loop;
end $$;
