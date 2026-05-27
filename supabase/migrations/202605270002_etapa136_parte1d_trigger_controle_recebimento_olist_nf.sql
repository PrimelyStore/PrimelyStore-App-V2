create or replace function public.aplicar_controle_recebimento_olist_nf()
returns trigger
language plpgsql
as $$
begin
  if new.compra_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.compra_id is not distinct from new.compra_id then
    return new;
  end if;

  if not exists (
    select 1
    from public.compras_controle_recebimento cr
    where cr.compra_id = new.compra_id
  ) then
    perform 1
    from public.definir_controle_recebimento_compra(
      new.compra_id,
      'pendente_conferencia_operacional',
      'Compra criada automaticamente a partir de NF de entrada Olist. Recebimento bloqueado até conferência operacional.',
      'trigger_olist_nf_compra_id'
    );
  end if;

  return new;
end;
$$;


drop trigger if exists trg_aplicar_controle_recebimento_olist_nf
on public.olist_notas_entrada_snapshot;

create trigger trg_aplicar_controle_recebimento_olist_nf
after insert or update of compra_id
on public.olist_notas_entrada_snapshot
for each row
execute function public.aplicar_controle_recebimento_olist_nf();
