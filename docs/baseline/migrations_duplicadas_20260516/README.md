# Baseline de migrations duplicadas 20260516

Esta pasta guarda os dois arquivos locais que tinham a mesma versao de migration:

- `20260516_etapa133_olist_pedidos_snapshot.sql`
- `20260516_etapa133_olist_orquestrador_fifo.sql`

Havia duas migrations locais iniciando com `20260516`, o que cria ambiguidade para o Supabase CLI, pois o historico remoto trabalha por versao de migration.

O remoto ja foi marcado como `applied` para `20260516`, e os objetos dos dois arquivos foram confirmados no banco remoto antes desta normalizacao local.

Os conteudos foram consolidados em uma unica migration local:

```txt
supabase/migrations/20260516_etapa133_baseline_fifo_e_pedidos_olist.sql
```

Esta normalizacao foi feita apenas no repositorio local. Nenhum SQL foi executado,
nenhuma migration foi aplicada e nenhum objeto do banco remoto foi criado,
alterado ou removido. O objetivo foi somente eliminar a duplicidade local de
timestamp `20260516` para evitar erro no Supabase CLI.

A ordem do arquivo consolidado e intencional:

1. snapshots/logs de pedidos Olist;
2. funcoes do orquestrador FIFO.

Essa ordem preserva a dependencia das funcoes FIFO sobre a estrutura `public.olist_pedidos_snapshot`.

Estes arquivos permanecem aqui apenas como referencia historica e baseline. Eles nao devem ser movidos de volta para `supabase/migrations` sem uma nova auditoria do historico remoto.
