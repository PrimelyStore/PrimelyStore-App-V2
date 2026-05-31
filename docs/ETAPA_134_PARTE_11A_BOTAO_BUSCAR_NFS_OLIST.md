# Etapa 134 — Parte 11A — Botão seguro para buscar NFs de compra no Olist

## Objetivo

Criar o primeiro botão na tela Compras para buscar NFs de entrada do Olist com marcador `Compras`.

Nesta parte, o botão apenas sincroniza snapshots:

- busca NFs no Olist;
- detalha NFs;
- detalha itens;
- atualiza fornecedores;
- salva/atualiza snapshots.

Ele não faz:

- recebimento de estoque;
- criação de lote;
- movimentação de estoque;
- baixa FIFO;
- processamento automático de compra.

## Arquivos alterados

- `src/pages/Compras.tsx`
- `src/services/comprasService.ts`

## Arquivo novo

- `supabase/functions/compras-olist-notas-entrada-sync/index.ts`

## Segurança

O frontend não deve receber nem expor `PRIMELY_INTERNAL_FUNCTION_TOKEN`.

Por isso foi criada uma Edge Function intermediária:

`compras-olist-notas-entrada-sync`

Ela valida o usuário autenticado e só então chama internamente:

`olist-notas-entrada-sync`

passando o header interno `x-primely-internal-token` pelo backend.

## Parâmetros usados

A chamada do app usa limites conservadores:

```txt
limit = 3
maxPages = 3
offset = 0
detalhar = true
detalharItens = true
buscarFornecedores = true
marcadores = Compras
orderBy = desc
itemDelayMs = 3000
processar = false
dryRun = false
```

## Testes recomendados

1. Deploy da Edge Function nova.
2. `npm run build`.
3. Abrir tela Compras.
4. Clicar em `Buscar NFs Olist`.
5. Conferir mensagem de resultado.
6. Confirmar que não houve movimentação automática de estoque.

## Comandos de validação

```sql
select
    *
from public.olist_notas_entrada_sync_log
order by created_at desc
limit 10;
```

```sql
select
    status_processamento,
    count(*) as total
from public.olist_notas_entrada_snapshot
group by status_processamento
order by status_processamento;
```

```sql
select
    *
from public.movimentacoes_estoque
where
    coalesce(documento_origem, '') ilike '%OLIST-NF%'
    or coalesce(observacoes, '') ilike '%OLIST-NF%'
order by created_at desc nulls last
limit 30;
```
