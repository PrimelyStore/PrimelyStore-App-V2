# Etapa 134 — Parte 11F — Clareza do painel de NFs Olist

## Objetivo

Melhorar os textos do painel de conferência da tela **Compras** para deixar claro que o painel mostra os **snapshots já salvos no Supabase**, e não necessariamente o total atual exibido na listagem da Olist.

## Arquivo alterado

- `src/pages/Compras.tsx`

## O que foi ajustado

- O título passou de **Conferência das NFs Olist** para **Conferência dos snapshots Olist**.
- O card **Importadas** passou para **Snapshots no banco**.
- O card **Processadas** passou para **Viraram compra**.
- O card **Pendentes** passou para **Pendentes no snapshot**.
- O card **Prontas** passou para **Prontas para compra**.
- O card **Pendente conversão** passou para **Pend. conversão/produto**.
- Foi adicionada uma observação explicando por que o número de snapshots pode ser diferente do total mostrado na Olist.

## O que não foi alterado

Esta etapa não altera:

- estoque;
- lotes;
- FIFO;
- recebimento;
- services;
- Edge Functions;
- migrations;
- regras fiscais;
- processamento de compras.

## Testes recomendados

1. Rodar `npm run build`.
2. Abrir a tela **Compras**.
3. Conferir se o painel aparece com os novos textos.
4. Clicar em **Buscar NFs Olist** e conferir se o resumo final da busca continua aparecendo.
5. Confirmar que a seção **Itens das compras** continua agrupada por NF.
6. Confirmar que nenhuma movimentação de estoque foi criada automaticamente.
