# Etapa 134 — Parte 11D — Itens de compra agrupados por NF

## Objetivo

Melhorar a visualização da seção **Itens das compras** na tela `Compras`, agrupando os itens por compra/NF.

Antes, cada produto aparecia em uma linha principal, repetindo o número da compra várias vezes. Agora, a tela mostra uma linha resumida por NF/compra e permite abrir os produtos pelo botão **Ver itens**.

## Arquivo alterado

- `src/pages/Compras.tsx`

## O que foi alterado

1. A seção **Itens das compras** passou a agrupar os itens por `compra_id`.
2. A linha principal mostra:
   - Compra / NF
   - Fornecedor
   - Quantidade de itens
   - Unidades totais
   - Unidades recebidas
   - Unidades pendentes
   - Progresso geral
   - Status geral
   - Botão `Ver itens` / `Ocultar itens`
3. Ao expandir uma NF, a tela mostra a tabela detalhada dos produtos daquela compra.
4. As ações individuais de recebimento continuam nos itens detalhados.
5. O bloqueio operacional de recebimento continua visível.

## O que não foi alterado

- Não foi alterado `comprasService.ts`.
- Não foram alteradas tabelas do Supabase.
- Não foram alteradas views, funções RPC ou Edge Functions.
- Não foi alterada regra de recebimento.
- Não foi alterada regra de estoque.
- Não foi alterada regra de lote.
- Não foi alterado FIFO.
- Nenhum recebimento automático foi criado.

## Validação recomendada

Após aplicar o arquivo, executar:

```powershell
npm run build
```

Depois abrir a tela **Compras** e validar:

1. A tela abre sem erro.
2. A seção **Itens das compras** mostra uma linha por NF/compra.
3. O botão **Ver itens** expande os produtos da NF.
4. O botão **Ocultar itens** recolhe os produtos da NF.
5. Os badges de status continuam aparecendo.
6. Itens bloqueados continuam bloqueados.
7. Nenhum recebimento real deve ser feito durante este teste.
8. A seção **Compras encontradas** continua funcionando.

## Commit sugerido

```powershell
git add src/pages/Compras.tsx docs/ETAPA_134_PARTE_11D_ITENS_COMPRA_AGRUPADOS_POR_NF.md
git commit -m "feat: agrupar itens de compras por nota fiscal"
git push origin etapa-133-melhorias-vendas
git status
```
