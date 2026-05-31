# Etapa 134 — Parte 11C — Busca progressiva de NFs Olist na tela Compras

## Objetivo

Melhorar o botão **Buscar NFs Olist** da tela Compras para consultar todas as NFs informadas pela Olist em chamadas pequenas e sequenciais, evitando o erro `WORKER_RESOURCE_LIMIT` da Edge Function.

## Problema encontrado

Na Parte 11A, a busca tentou consultar muitas notas em uma única execução da Edge Function e o Supabase retornou:

```txt
WORKER_RESOURCE_LIMIT
status_code: 546
execution_time_ms: 150556
```

Na Parte 11B, a busca foi reduzida para 1 NF por chamada, o que eliminou o erro, mas exigia cliques manuais para avançar os offsets.

## Solução desta parte

A tela agora executa uma **busca progressiva controlada pelo navegador**:

1. O usuário clica uma vez no botão **Buscar NFs Olist**.
2. O frontend chama a Edge Function intermediária `compras-olist-notas-entrada-sync` com `limit = 1` e `maxPages = 1`.
3. A cada resposta, o frontend lê `next_offset_if_continues`.
4. O frontend aguarda um pequeno intervalo.
5. O frontend chama novamente a próxima posição.
6. O processo continua até atingir o total informado pela Olist ou o limite de segurança configurado.

## Segurança operacional preservada

A busca continua usando:

```txt
processar = false
dryRun = false
```

Portanto, ela apenas importa/atualiza snapshots da Olist.

Ela não faz:

```txt
não cria estoque
não cria lote
não confirma recebimento
não processa compra automaticamente
não expõe token interno no navegador
```

## Arquivos alterados

```txt
src/pages/Compras.tsx
src/services/comprasService.ts
```

## Edge Function usada

A função intermediária permanece a mesma da Parte 11B:

```txt
supabase/functions/compras-olist-notas-entrada-sync
```

Nesta parte não foi necessário alterar o arquivo da Edge Function.

## Comportamento esperado na tela

Durante a busca, a tela mostra:

```txt
Total informado pela Olist
Chamadas realizadas
Offset atual
Próximo offset
Última NF lida
Notas lidas acumuladas
Notas inseridas
Notas atualizadas
Erros acumulados
```

Ao finalizar, mostra o resumo final da varredura.

## Limites definidos no frontend

```txt
offsetInicial = 0
maxNotas = 30
itemDelayMs = 2000
intervaloEntreChamadasMs = 1200
```

O `maxNotas = 30` é um limite de segurança para evitar varreduras excessivamente longas. Se no futuro houver muitas NFs, a rotina poderá ser evoluída para execução agendada em lotes.

## Como testar

1. Rodar o build:

```powershell
npm run build
```

2. Rodar o projeto:

```powershell
npm run dev
```

3. Abrir a tela Compras.

4. Clicar em **Buscar NFs Olist**.

5. Acompanhar o progresso na tela.

6. Validar no Supabase:

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
    numero,
    fornecedor_nome,
    data_emissao,
    valor,
    valor_produtos,
    status_processamento,
    compra_id,
    created_at,
    updated_at
from public.olist_notas_entrada_snapshot
order by data_emissao desc nulls last, numero desc;
```

7. Confirmar que não gerou estoque:

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

## Commit sugerido

```powershell
git status
git add src/pages/Compras.tsx src/services/comprasService.ts docs/ETAPA_134_PARTE_11C_BUSCA_PROGRESSIVA_NFS_OLIST.md
git commit -m "feat: buscar NFs Olist progressivamente em compras"
git push origin etapa-133-melhorias-vendas
git status
```
