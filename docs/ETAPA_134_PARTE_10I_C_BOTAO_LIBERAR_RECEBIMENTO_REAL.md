# Etapa 134 — Parte 10I-C — Documentação da preparação do botão seguro Liberar recebimento real

## 1. Objetivo desta documentação

Este documento registra a preparação do botão seguro:

```txt
Liberar recebimento real
```

na tela **Compras** do sistema **Agentes Primely Store**.

O objetivo do botão é permitir, no futuro, que uma NF Olist nova e pendente de conferência operacional seja liberada para o fluxo normal de recebimento.

Importante:

```txt
O botão não recebe item automaticamente.
O botão não gera lote.
O botão não movimenta estoque.
O botão não altera quantidade recebida.
O botão não altera vendas.
O botão não executa FIFO.
```

Ele apenas altera o controle operacional da compra para permitir que o recebimento seja feito depois, pelo fluxo normal do sistema.

---

## 2. Contexto

Antes desta etapa, a base foi saneada e ficaram apenas as 3 compras Olist históricas:

```txt
OLIST-NF-220525
OLIST-NF-224330
OLIST-NF-351272
```

Essas NFs estão classificadas como:

```txt
historico_fiscal_sem_entrada_estoque
bloqueia_recebimento = true
```

Portanto, elas não devem gerar estoque, lote ou movimentação.

A preparação do botão foi feita com a regra principal:

```txt
NFs históricas não podem ser liberadas pelo botão.
```

---

## 3. Arquivos envolvidos

Arquivos analisados e/ou incluídos na etapa:

```txt
src/pages/Compras.tsx
src/services/comprasService.ts
```

O arquivo `comprasService.ts` já possuía a função necessária:

```txt
definirControleRecebimentoCompra(...)
```

Por isso, a alteração principal foi feita na tela:

```txt
src/pages/Compras.tsx
```

---

## 4. Função segura usada no banco

A liberação usa a função já existente no banco:

```txt
public.definir_controle_recebimento_compra(
    p_compra_id uuid,
    p_classificacao_operacional text,
    p_motivo text,
    p_origem text
)
```

Quando liberada corretamente, a compra deve passar para:

```txt
classificacao_operacional = recebimento_real
bloqueia_recebimento = false
```

---

## 5. Regra para o botão aparecer

O botão **Liberar recebimento real** só deve aparecer quando a compra atender às condições de segurança.

Condições planejadas:

```txt
numero_pedido começa com OLIST-NF-
classificacao_operacional = pendente_conferencia_operacional
bloqueia_recebimento = true
compra tem itens
compra tem local de destino
quantidade recebida = 0
compra não está cancelada
compra não está recebida
```

---

## 6. Quando o botão não deve aparecer

O botão não deve aparecer para:

```txt
compras históricas
compras manuais comuns
compras já liberadas como recebimento_real
compras recebidas
compras canceladas
compras sem itens
compras sem local de destino
compras com quantidade já recebida
```

Principalmente, ele não deve aparecer para:

```txt
OLIST-NF-220525
OLIST-NF-224330
OLIST-NF-351272
```

Porque essas NFs são históricas.

---

## 7. Comportamento validado nas NFs atuais

Após a implementação, foi feita validação visual na tela Compras.

Resultado validado:

```txt
Compras encontradas: 3
Itens das compras: 25
Unidades compradas: 492
Unidades recebidas: 0
Unidades pendentes: 492
Valor total estimado: R$ 8.849,40
```

As 3 compras Olist continuaram aparecendo como:

```txt
rascunho
Histórico fiscal
Bloqueado
```

E o botão **Liberar recebimento real** não apareceu para elas.

Isso confirma que a regra de proteção funcionou corretamente.

---

## 8. O que acontece ao liberar uma compra válida

Quando houver uma NF Olist nova em:

```txt
pendente_conferencia_operacional
```

e o usuário clicar em **Liberar recebimento real**, o sistema deve:

```txt
1. Exibir confirmação.
2. Chamar a função definirControleRecebimentoCompra.
3. Alterar a classificação operacional para recebimento_real.
4. Alterar bloqueia_recebimento para false.
5. Atualizar a lista de compras.
6. Atualizar a lista de itens.
7. Exibir a compra como liberada.
```

---

## 9. Mensagem de confirmação planejada

Antes da liberação, o sistema deve alertar o usuário.

Mensagem planejada:

```txt
Você está prestes a liberar esta NF para recebimento real.

Depois disso, os itens poderão ser recebidos e poderão gerar lote e entrada de estoque.

Confirme somente se:
- a mercadoria ainda não entrou no estoque Primely;
- a NF não é apenas histórico fiscal;
- os produtos, quantidades e custos foram conferidos.

Deseja continuar?
```

---

## 10. O que o botão não faz

O botão não executa nenhuma operação de estoque.

Ele não faz:

```txt
receber item
gerar lote
criar movimentação de estoque
alterar quantidade_recebida
alterar status de item para recebido
alterar status da compra para recebida
baixar FIFO
alterar vendas
alterar dashboard diretamente
```

A entrada real de estoque continua dependendo do fluxo normal de recebimento.

---

## 11. Validação técnica

Foi executado:

```powershell
npm run build
```

Resultado:

```txt
build concluído com sucesso
```

Aviso conhecido:

```txt
Some chunks are larger than 500 kB after minification
```

Esse aviso não quebra o sistema. Ele apenas indica oportunidade futura de otimização com code splitting.

---

## 12. Commit da etapa

Commit criado:

```txt
21fa1a9 feat: preparar liberacao segura de recebimento real
```

Status final validado no Git:

```txt
nothing to commit, working tree clean
```

---

## 13. Estado final após a etapa

Após esta etapa:

```txt
botão preparado com regras de segurança
NFs históricas continuam bloqueadas
botão não aparece para NFs históricas
nenhum item foi recebido
nenhum lote foi criado
nenhum estoque foi movimentado
nenhuma venda foi alterada
nenhuma baixa FIFO foi executada
```

---

## 14. Próximo teste real

No momento da documentação, não existe nenhuma NF Olist nova com:

```txt
pendente_conferencia_operacional
```

Por isso, o botão ainda não aparece na base atual.

O teste completo deverá ocorrer quando:

```txt
1. Uma nova NF Olist for importada.
2. A compra for criada.
3. A compra ficar pendente de conferência operacional.
4. A tela exibir o botão Liberar recebimento real.
5. O usuário conferir os itens.
6. O usuário liberar a compra.
```

---

## 15. Próxima etapa recomendada

A próxima etapa recomendada é documentar ou preparar o fluxo de teste de uma NF nova real.

Possíveis próximos passos:

```txt
1. Aguardar uma NF Olist real nova.
2. Validar se ela entra como pendente_conferencia_operacional.
3. Conferir itens, custos e quantidades.
4. Testar o botão Liberar recebimento real.
5. Depois testar o recebimento item a item.
```

Não é recomendado criar dados artificiais de teste sem necessidade neste momento.

---

## 16. Status da Etapa 134 — Parte 10I-C

Status:

```txt
Documentação criada.
Botão seguro planejado e preparado.
Build validado.
Commit validado.
Validação visual concluída.
NFs históricas protegidas.
Estoque preservado.
Lotes preservados.
Vendas preservadas.
FIFO preservado.
```
