-- Etapa 133 - Parte 14A
-- Registro local das funções SQL criadas no Supabase para validação e processamento com baixa FIFO.
-- Este arquivo é documentação/migration para versionamento no Git.

create or replace function public.validar_venda_baixa_fifo(
  p_venda_id uuid
)
returns table (
  venda_id uuid,
  numero_pedido text,
  produto_id uuid,
  sku_vendido text,
  produto_nome text,
  local_saida_id uuid,
  local_saida_nome text,
  quantidade_pendente_baixa numeric,
  saldo_atual numeric,
  decisao text
)
language sql
stable
set search_path = public
as $$
  with consumo as (
    select
      venda_item_id,
      sum(quantidade_consumida)::numeric as quantidade_baixada
    from public.vendas_itens_lotes
    group by venda_item_id
  ),
  necessidade as (
    select
      v.id as venda_id,
      v.numero_pedido,
      vi.produto_id,
      vi.sku_vendido,
      p.nome as produto_nome,
      v.local_saida_id,
      le.nome as local_saida_nome,
      sum(vi.quantidade::numeric - coalesce(c.quantidade_baixada, 0)) as quantidade_pendente_baixa
    from public.vendas v
    join public.vendas_itens vi
      on vi.venda_id = v.id
    join public.produtos p
      on p.id = vi.produto_id
    join public.locais_estoque le
      on le.id = v.local_saida_id
    left join consumo c
      on c.venda_item_id = vi.id
    where v.id = p_venda_id
    group by
      v.id,
      v.numero_pedido,
      vi.produto_id,
      vi.sku_vendido,
      p.nome,
      v.local_saida_id,
      le.nome
  )
  select
    n.venda_id,
    n.numero_pedido,
    n.produto_id,
    n.sku_vendido,
    n.produto_nome,
    n.local_saida_id,
    n.local_saida_nome,
    n.quantidade_pendente_baixa,
    coalesce(s.saldo_atual, 0)::numeric as saldo_atual,
    case
      when n.quantidade_pendente_baixa <= 0 then 'nao_precisa_baixar'
      when coalesce(s.saldo_atual, 0)::numeric >= n.quantidade_pendente_baixa then 'pode_baixar'
      else 'nao_pode_baixar_estoque_insuficiente'
    end as decisao
  from necessidade n
  left join public.saldos_estoque s
    on s.produto_id = n.produto_id
   and s.local_estoque_id = n.local_saida_id;
$$;

create or replace function public.processar_olist_pedidos_pendentes_com_baixa_fifo(
  p_limit integer default 10,
  p_executar_baixa boolean default false
)
returns table (
  total_alvo integer,
  mapeamentos_aplicados integer,
  total_lidos integer,
  vendas_criadas integer,
  vendas_vinculadas integer,
  itens_criados integer,
  pedidos_com_erro integer,
  pedidos_processados integer,
  vendas_aptas_baixa integer,
  vendas_baixadas integer,
  vendas_sem_estoque integer,
  vendas_ja_baixadas integer,
  erros_baixa integer,
  observacao text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proc record;
  v_snapshot record;
  v_total_alvo integer := 0;
  v_mapeamentos_aplicados integer := 0;
  v_vendas_aptas_baixa integer := 0;
  v_vendas_baixadas integer := 0;
  v_vendas_sem_estoque integer := 0;
  v_vendas_ja_baixadas integer := 0;
  v_erros_baixa integer := 0;
  v_tem_pendente boolean := false;
  v_tem_bloqueio boolean := false;
  v_resultado_baixa text;
begin
  create temp table tmp_olist_pedidos_alvo on commit drop as
  select p.id
  from public.olist_pedidos_snapshot p
  where p.status_processamento = 'pendente'
    and p.venda_id is null
  order by p.sincronizado_em asc, p.created_at asc
  limit greatest(coalesce(p_limit, 10), 1);

  select count(*)::integer
  into v_total_alvo
  from tmp_olist_pedidos_alvo;

  update public.olist_pedidos_snapshot p
  set
    canal_venda_id = m.canal_venda_id,
    local_saida_id = m.local_saida_id,
    updated_at = now()
  from public.olist_canais_venda_mapeamento m
  join tmp_olist_pedidos_alvo t
    on true
  where p.id = t.id
    and m.status = 'ativo'
    and m.provider = p.provider
    and lower(trim(coalesce(p.ecommerce_nome, ''))) = lower(trim(m.ecommerce_nome_olist))
    and lower(trim(coalesce(p.canal_venda_olist, ''))) = lower(trim(m.canal_venda_olist))
    and (
      p.canal_venda_id is distinct from m.canal_venda_id
      or p.local_saida_id is distinct from m.local_saida_id
    );

  get diagnostics v_mapeamentos_aplicados = row_count;

  select *
  into v_proc
  from public.processar_olist_pedidos_snapshot(greatest(coalesce(p_limit, 10), 1));

  if p_executar_baixa then
    for v_snapshot in
      select p.*
      from public.olist_pedidos_snapshot p
      join tmp_olist_pedidos_alvo t
        on t.id = p.id
      where p.status_processamento = 'processado'
        and p.venda_id is not null
      order by p.processado_em asc
    loop
      select exists (
        select 1
        from public.validar_venda_baixa_fifo(v_snapshot.venda_id)
        where quantidade_pendente_baixa > 0
      )
      into v_tem_pendente;

      if not v_tem_pendente then
        v_vendas_ja_baixadas := v_vendas_ja_baixadas + 1;
        continue;
      end if;

      select exists (
        select 1
        from public.validar_venda_baixa_fifo(v_snapshot.venda_id)
        where decisao <> 'pode_baixar'
      )
      into v_tem_bloqueio;

      if v_tem_bloqueio then
        update public.olist_pedidos_snapshot
        set
          mensagem_erro = 'Baixa FIFO não executada: estoque insuficiente ou venda não apta para baixa.',
          updated_at = now()
        where id = v_snapshot.id;

        v_vendas_sem_estoque := v_vendas_sem_estoque + 1;
        continue;
      end if;

      v_vendas_aptas_baixa := v_vendas_aptas_baixa + 1;

      begin
        select public.baixar_estoque_venda_fifo(v_snapshot.venda_id)::text
        into v_resultado_baixa;

        update public.olist_pedidos_snapshot
        set
          mensagem_erro = null,
          updated_at = now()
        where id = v_snapshot.id;

        v_vendas_baixadas := v_vendas_baixadas + 1;
      exception when others then
        update public.olist_pedidos_snapshot
        set
          mensagem_erro = concat('Erro na baixa FIFO: ', SQLERRM),
          updated_at = now()
        where id = v_snapshot.id;

        v_erros_baixa := v_erros_baixa + 1;
      end;
    end loop;
  end if;

  total_alvo := v_total_alvo;
  mapeamentos_aplicados := v_mapeamentos_aplicados;
  total_lidos := coalesce(v_proc.total_lidos, 0);
  vendas_criadas := coalesce(v_proc.vendas_criadas, 0);
  vendas_vinculadas := coalesce(v_proc.vendas_vinculadas, 0);
  itens_criados := coalesce(v_proc.itens_criados, 0);
  pedidos_com_erro := coalesce(v_proc.pedidos_com_erro, 0);
  pedidos_processados := coalesce(v_proc.pedidos_processados, 0);
  vendas_aptas_baixa := v_vendas_aptas_baixa;
  vendas_baixadas := v_vendas_baixadas;
  vendas_sem_estoque := v_vendas_sem_estoque;
  vendas_ja_baixadas := v_vendas_ja_baixadas;
  erros_baixa := v_erros_baixa;
  observacao := case
    when p_executar_baixa then 'Processamento executado com tentativa de baixa FIFO.'
    else 'Processamento executado sem baixa FIFO. Use p_executar_baixa=true para baixar estoque.'
  end;

  return next;
end;
$$;
