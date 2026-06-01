# Etapa 134 — Parte 11E — Painel de conferência das NFs Olist

## Objetivo

Criar na tela **Compras** um painel para acompanhar as NFs de entrada importadas da Olist, separando claramente:

- NFs importadas para snapshot;
- NFs já processadas em compras;
- NFs pendentes;
- NFs com erro;
- NFs ignoradas;
- NFs prontas para converter;
- NFs pendentes de conversão/conferência.

## Arquivos alterados

- `src/pages/Compras.tsx`
- `src/services/comprasService.ts`

## Fonte dos dados

O painel consulta a view existente:

- `public.olist_notas_entrada_conferencia`

Colunas usadas:

- `numero`
- `fornecedor_nome`
- `status_processamento`
- `compra_id`
- `status_conferencia`
- `total_itens`
- `total_itens_com_erro`
- `total_itens_vinculados`

## Regras preservadas

Esta etapa não altera:

- estoque;
- lotes;
- FIFO;
- recebimento;
- Edge Functions;
- migrations;
- regras fiscais;
- confirmação de recebimento real.

## O que mudou visualmente

Foi adicionada uma seção nova na tela Compras:

**Conferência das NFs Olist**

Com cards de resumo e uma tabela com:

- NF;
- fornecedor;
- status de processamento;
- status de conferência;
- total de itens;
- itens vinculados;
- itens com erro;
- se já existe compra vinculada.

## Validação recomendada

Após aplicar os arquivos, rodar:

```powershell
npm run build
```

Depois abrir a tela Compras e conferir:

1. A tela abre sem erro.
2. O botão Buscar NFs Olist continua funcionando.
3. O painel Conferência das NFs Olist aparece.
4. As contagens batem com o Supabase.
5. A seção Itens das compras continua agrupada por NF.
6. Não foi criada movimentação de estoque automaticamente.

Consulta de segurança:

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

O esperado é não retornar movimentações novas geradas pela busca/conferência Olist.
