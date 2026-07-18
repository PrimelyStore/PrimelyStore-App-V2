create table if not exists public.compras_controle_recebimento (
  id uuid primary key default gen_random_uuid(),

  compra_id uuid not null references public.compras(id) on delete cascade,

  classificacao_operacional text not null,
  bloqueia_recebimento boolean not null default false,

  motivo text,
  origem text not null default 'manual',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint compras_controle_recebimento_compra_unique
    unique (compra_id),

  constraint compras_controle_recebimento_classificacao_check
    check (
      classificacao_operacional in (
        'recebimento_real',
        'historico_fiscal_sem_entrada_estoque',
        'pendente_conferencia_operacional'
      )
    )
);

create index if not exists idx_compras_controle_recebimento_compra_id
  on public.compras_controle_recebimento (compra_id);

create index if not exists idx_compras_controle_recebimento_classificacao
  on public.compras_controle_recebimento (classificacao_operacional);


insert into public.compras_controle_recebimento (
  compra_id,
  classificacao_operacional,
  bloqueia_recebimento,
  motivo,
  origem
)
select
  c.id,
  'historico_fiscal_sem_entrada_estoque',
  true,
  'NF antiga importada do Olist apenas para histórico fiscal/rastreabilidade. Estoque já refletido na carga inicial Olist, portanto não deve gerar nova entrada.',
  'etapa_134_parte_11j'
from public.compras c
where c.numero_nota_fiscal in ('220525', '224330', '351272')
on conflict (compra_id) do update
set
  classificacao_operacional = excluded.classificacao_operacional,
  bloqueia_recebimento = excluded.bloqueia_recebimento,
  motivo = excluded.motivo,
  origem = excluded.origem,
  updated_at = now();


create or replace function public.validar_compra_para_recebimento(
  p_compra_id uuid
)
returns table (
  compra_id uuid,
  numero_pedido text,
  numero_nota_fiscal text,
  local_destino_id uuid,
  local_destino_nome text,
  origem_olist boolean,
  status_auditoria text,
  status_validacao text
)
language plpgsql
as $$
declare
  v_compra record;
  v_origem_olist boolean := false;
  v_status_auditoria text;

  v_classificacao_operacional text;
  v_bloqueia_recebimento boolean := false;
  v_motivo_bloqueio text;
begin
  select
    c.id,
    c.numero_pedido,
    c.numero_nota_fiscal,
    c.local_destino_id,
    le.nome as local_destino_nome
  into v_compra
  from public.compras c
  left join public.locais_estoque le
    on le.id = c.local_destino_id
  where c.id = p_compra_id;

  if v_compra.id is null then
    raise exception 'Compra não encontrada: %', p_compra_id;
  end if;

  select
    cr.classificacao_operacional,
    cr.bloqueia_recebimento,
    cr.motivo
  into
    v_classificacao_operacional,
    v_bloqueia_recebimento,
    v_motivo_bloqueio
  from public.compras_controle_recebimento cr
  where cr.compra_id = p_compra_id
  limit 1;

  if coalesce(v_bloqueia_recebimento, false) then
    raise exception
      'Recebimento bloqueado: a compra % / NF % está classificada como "%". Motivo: %',
      coalesce(v_compra.numero_pedido, '[sem pedido]'),
      coalesce(v_compra.numero_nota_fiscal, '[sem NF]'),
      coalesce(v_classificacao_operacional, '[sem classificação]'),
      coalesce(v_motivo_bloqueio, 'sem motivo informado');
  end if;

  if v_compra.local_destino_id is null then
    raise exception
      'Recebimento bloqueado: a compra % / NF % não possui local de destino definido.',
      coalesce(v_compra.numero_pedido, '[sem pedido]'),
      coalesce(v_compra.numero_nota_fiscal, '[sem NF]');
  end if;

  select exists (
    select 1
    from public.olist_notas_entrada_snapshot n
    where n.compra_id = p_compra_id
  )
  into v_origem_olist;

  if v_origem_olist then
    select a.status_auditoria
    into v_status_auditoria
    from public.olist_compras_auditoria a
    where a.compra_id = p_compra_id
    limit 1;

    if v_status_auditoria is null then
      raise exception
        'Recebimento bloqueado: a compra % / NF % veio do Olist, mas não possui auditoria encontrada.',
        coalesce(v_compra.numero_pedido, '[sem pedido]'),
        coalesce(v_compra.numero_nota_fiscal, '[sem NF]');
    end if;

    if v_status_auditoria <> 'ok' then
      raise exception
        'Recebimento bloqueado: a compra % / NF % veio do Olist, mas a auditoria está como "%". Corrija antes de receber.',
        coalesce(v_compra.numero_pedido, '[sem pedido]'),
        coalesce(v_compra.numero_nota_fiscal, '[sem NF]'),
        v_status_auditoria;
    end if;
  end if;

  return query
  select
    v_compra.id,
    v_compra.numero_pedido,
    v_compra.numero_nota_fiscal,
    v_compra.local_destino_id,
    v_compra.local_destino_nome,
    v_origem_olist,
    v_status_auditoria,
    'ok'::text;
end;
$$;