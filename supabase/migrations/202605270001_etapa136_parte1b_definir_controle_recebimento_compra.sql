create or replace function public.definir_controle_recebimento_compra(
  p_compra_id uuid,
  p_classificacao_operacional text,
  p_motivo text default null,
  p_origem text default 'manual'
)
returns table (
  compra_id uuid,
  numero_pedido text,
  numero_nota_fiscal text,
  classificacao_operacional text,
  bloqueia_recebimento boolean,
  motivo text,
  origem text,
  status_validacao text
)
language plpgsql
as $$
declare
  v_compra record;
  v_classificacao text;
  v_bloqueia boolean;
  v_motivo text;
  v_origem text;

  v_total_recebido numeric := 0;
  v_total_lotes integer := 0;
  v_origem_olist boolean := false;
  v_status_auditoria text;
begin
  v_classificacao := lower(trim(coalesce(p_classificacao_operacional, '')));
  v_motivo := nullif(trim(coalesce(p_motivo, '')), '');
  v_origem := coalesce(nullif(trim(p_origem), ''), 'manual');

  if v_classificacao not in (
    'recebimento_real',
    'historico_fiscal_sem_entrada_estoque',
    'pendente_conferencia_operacional'
  ) then
    raise exception
      'Classificação operacional inválida: %. Use recebimento_real, historico_fiscal_sem_entrada_estoque ou pendente_conferencia_operacional.',
      coalesce(p_classificacao_operacional, '[nula]');
  end if;

  select
    c.id,
    c.numero_pedido,
    c.numero_nota_fiscal,
    c.status,
    c.local_destino_id
  into v_compra
  from public.compras c
  where c.id = p_compra_id;

  if v_compra.id is null then
    raise exception 'Compra não encontrada: %', p_compra_id;
  end if;

  select coalesce(sum(ci.quantidade_recebida), 0)
  into v_total_recebido
  from public.compras_itens ci
  where ci.compra_id = p_compra_id
    and ci.status <> 'cancelado';

  select count(*)::integer
  into v_total_lotes
  from public.estoque_lotes el
  where el.compra_id = p_compra_id;

  select exists (
    select 1
    from public.olist_notas_entrada_snapshot n
    where n.compra_id = p_compra_id
  )
  into v_origem_olist;

  if v_classificacao in (
    'historico_fiscal_sem_entrada_estoque',
    'pendente_conferencia_operacional'
  ) then
    if coalesce(v_total_recebido, 0) > 0 then
      raise exception
        'Não é possível classificar a compra % / NF % como %, pois ela já possui quantidade recebida: %.',
        coalesce(v_compra.numero_pedido, '[sem pedido]'),
        coalesce(v_compra.numero_nota_fiscal, '[sem NF]'),
        v_classificacao,
        v_total_recebido;
    end if;

    if coalesce(v_total_lotes, 0) > 0 then
      raise exception
        'Não é possível classificar a compra % / NF % como %, pois ela já possui lote(s) de estoque vinculado(s): %.',
        coalesce(v_compra.numero_pedido, '[sem pedido]'),
        coalesce(v_compra.numero_nota_fiscal, '[sem NF]'),
        v_classificacao,
        v_total_lotes;
    end if;
  end if;

  if v_classificacao = 'recebimento_real' then
    if v_compra.local_destino_id is null then
      raise exception
        'Não é possível liberar recebimento real para a compra % / NF %, pois ela não possui local de destino definido.',
        coalesce(v_compra.numero_pedido, '[sem pedido]'),
        coalesce(v_compra.numero_nota_fiscal, '[sem NF]');
    end if;

    if v_origem_olist then
      select a.status_auditoria
      into v_status_auditoria
      from public.olist_compras_auditoria a
      where a.compra_id = p_compra_id
      limit 1;

      if v_status_auditoria is null then
        raise exception
          'Não é possível liberar recebimento real para a compra % / NF %, pois ela veio do Olist e não possui auditoria encontrada.',
          coalesce(v_compra.numero_pedido, '[sem pedido]'),
          coalesce(v_compra.numero_nota_fiscal, '[sem NF]');
      end if;

      if v_status_auditoria <> 'ok' then
        raise exception
          'Não é possível liberar recebimento real para a compra % / NF %, pois a auditoria Olist está como "%".',
          coalesce(v_compra.numero_pedido, '[sem pedido]'),
          coalesce(v_compra.numero_nota_fiscal, '[sem NF]'),
          v_status_auditoria;
      end if;
    end if;
  end if;

  v_bloqueia :=
    case
      when v_classificacao = 'recebimento_real' then false
      else true
    end;

  if v_motivo is null then
    v_motivo :=
      case v_classificacao
        when 'recebimento_real' then
          'Compra classificada como recebimento real. Pode gerar entrada de estoque após conferência operacional.'
        when 'historico_fiscal_sem_entrada_estoque' then
          'Compra classificada como histórico fiscal sem entrada de estoque. Não deve gerar nova entrada para evitar duplicidade.'
        when 'pendente_conferencia_operacional' then
          'Compra aguardando conferência operacional. Recebimento bloqueado até decisão.'
      end;
  end if;

  insert into public.compras_controle_recebimento (
    compra_id,
    classificacao_operacional,
    bloqueia_recebimento,
    motivo,
    origem
  )
  values (
    p_compra_id,
    v_classificacao,
    v_bloqueia,
    v_motivo,
    v_origem
  )
  on conflict on constraint compras_controle_recebimento_compra_unique
  do update
  set
    classificacao_operacional = excluded.classificacao_operacional,
    bloqueia_recebimento = excluded.bloqueia_recebimento,
    motivo = excluded.motivo,
    origem = excluded.origem,
    updated_at = now();

  return query
  select
    v_compra.id,
    v_compra.numero_pedido,
    v_compra.numero_nota_fiscal,
    v_classificacao,
    v_bloqueia,
    v_motivo,
    v_origem,
    'ok'::text;
end;
$$;
