# Etapa 134 — Parte 11B — Correção do botão Buscar NFs Olist

## Objetivo

Corrigir o botão **Buscar NFs Olist** da tela de Compras para evitar o erro:

```txt
WORKER_RESOURCE_LIMIT
status_code: 546
```

Esse erro ocorreu porque a Edge Function intermediária `compras-olist-notas-entrada-sync` ficou executando por tempo demais ao tentar buscar várias NFs e detalhar muitos itens em uma única chamada.

## Diagnóstico confirmado

O log do Supabase mostrou:

```txt
status_code: 546
sb_error_code: WORKER_RESOURCE_LIMIT
execution_time_ms: 150556
```

Isso significa que a função ficou aproximadamente 150 segundos em execução e foi encerrada pelo ambiente da Edge Function.

## Arquivos alterados

```txt
src/services/comprasService.ts
supabase/functions/compras-olist-notas-entrada-sync/index.ts
```

## Mudança aplicada

Antes, o botão chamava a função com lote maior:

```txt
limit = 3
maxPages = 3
itemDelayMs = 3000
```

Agora o fluxo foi reduzido para lote seguro:

```txt
limit = 1
maxPages = 1
itemDelayMs = 2000
processar = false
dryRun = false
```

A função intermediária também limita qualquer tentativa de chamada maior, sempre mantendo uma NF por execução.

## Comportamento esperado

Cada clique no botão busca uma posição da lista da Olist por vez, usando `offset`.

O frontend salva o próximo `offset` no `localStorage` do navegador:

```txt
primely:compras:olist:nfs:proximo-offset
```

Assim, o próximo clique tenta buscar a próxima NF, sem expor token interno no navegador.

## Segurança preservada

O botão continua sem expor:

```txt
PRIMELY_INTERNAL_FUNCTION_TOKEN
x-primely-internal-token
service role key
token da Olist
client secret da Olist
```

A Edge Function intermediária continua validando o usuário autenticado antes de chamar a função real.

## O que não foi alterado

Esta etapa não altera:

```txt
regras de estoque
recebimento real
lotes
baixa FIFO
views de conferência
funções SQL de processamento
Edge Function olist-notas-entrada-sync
```

## Validação recomendada

Depois de aplicar os arquivos:

```powershell
npm run build
supabase functions deploy compras-olist-notas-entrada-sync
npm run dev
```

Na tela Compras, clicar em:

```txt
Buscar NFs Olist
```

Depois conferir:

```sql
select
    *
from public.olist_notas_entrada_sync_log
order by created_at desc
limit 10;
```

E confirmar que não gerou estoque:

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

## Próximas melhorias futuras

Depois desta correção, a evolução recomendada é criar:

```txt
1. Uma tela/lista de NFs Olist pendentes.
2. Um painel de pendências de conversão de unidade.
3. Um botão para processar apenas NFs prontas para converter.
4. Uma automação agendada para rodar pequenos lotes em intervalos seguros.
```
