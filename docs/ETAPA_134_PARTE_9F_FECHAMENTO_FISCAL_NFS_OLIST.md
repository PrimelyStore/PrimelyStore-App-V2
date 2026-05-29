# Etapa 134 — Parte 9F — Fechamento fiscal das NFs de entrada Olist

## 1. Objetivo desta documentação

Este documento registra o fechamento da validação fiscal e operacional das notas fiscais de entrada importadas do Olist para o sistema **Agentes Primely Store**.

A finalidade é deixar documentado:

- quais NFs foram conferidas;
- quais fornecedores estavam envolvidos;
- quais regras de conversão de unidade foram aplicadas;
- quais regras fiscais foram aplicadas;
- quais totais foram validados;
- qual classificação operacional foi definida;
- por que essas NFs não devem gerar estoque/lote neste momento.

---

## 2. Contexto

Durante a Etapa 134, o sistema passou a importar **Notas Fiscais de Entrada do Olist** e convertê-las em compras internas do Primely Store.

Fluxo envolvido:

```txt
Olist NF de entrada
↓
olist_notas_entrada_snapshot
↓
olist_notas_entrada_itens_snapshot
↓
processar_olist_notas_entrada_para_compras
↓
compras
↓
compras_itens
```

Importante:

```txt
Nesta etapa, a conversão da NF para compra não gera lote.
Nesta etapa, a conversão da NF para compra não movimenta estoque.
Nesta etapa, a conversão da NF para compra não executa recebimento.
```

---

## 3. NFs validadas

Foram validadas 3 NFs importadas do Olist:

```txt
NF 220525 — Flaps Produtos Automotivos Ltda
NF 224330 — Flaps Produtos Automotivos Ltda
NF 351272 — MOAS INDUSTRIA E COMERCIO IMPORTACAO E EXPORTACAO LTDA
```

Todas foram convertidas em compras internas com número de pedido no padrão:

```txt
OLIST-NF-...
```

---

## 4. Regras de conversão de unidade

Foi confirmada a tabela:

```txt
public.produto_fornecedor_conversao_unidade
```

Essa tabela contém regras para converter a unidade da NF para a unidade vendável do Primely.

Para o fornecedor:

```txt
Flaps Produtos Automotivos Ltda
```

Foi confirmada a regra:

```txt
unidade_nf = cx12
fator_conversao = 12
ativo = true
```

Isso significa:

```txt
1 caixa cx12 na NF = 12 unidades vendáveis no Primely
```

Exemplo:

```txt
Quantidade NF: 4 cx12
Fator: 12
Quantidade convertida: 48 unidades
```

E o custo unitário é ajustado:

```txt
Valor unitário da caixa ÷ 12 = custo unitário vendável
```

---

## 5. Regras fiscais aplicadas

Foi confirmada a tabela:

```txt
public.config_custo_fiscal_compra
```

As regras fiscais validadas foram:

```txt
IPI        → entra no custo
ICMS-ST    → entra no custo por rateio/configuração
ICMS normal → não entra automaticamente no custo
PIS        → não entra automaticamente no custo
COFINS     → não entra automaticamente no custo
Simples    → não entra automaticamente no custo
```

A decisão aplicada evita somar novamente impostos que já estão embutidos no preço da mercadoria.

---

## 6. Função de conversão validada

Foi conferida a função:

```txt
public.processar_olist_notas_entrada_para_compras(
    p_limit integer,
    p_dry_run boolean
)
```

Conclusão da análise:

```txt
A função já está preparada para usar regras fiscais e regras de conversão de unidade.
```

A função já contempla:

```txt
1. Leitura da tabela config_custo_fiscal_compra.
2. Leitura da tabela produto_fornecedor_conversao_unidade.
3. Conversão de unidade quando necessário.
4. Conversão de cx12 para unidade vendável.
5. Ajuste de custo unitário pelo fator de conversão.
6. Cálculo de imposto que entra no custo.
7. Inclusão de IPI quando aplicável.
8. Inclusão de ICMS-ST quando aplicável.
9. Não inclusão automática de ICMS normal, PIS, COFINS e Simples.
10. Não geração de lote.
11. Não movimentação de estoque.
```

---

## 7. Totais validados por NF

### 7.1 NF 220525 — Flaps

Fornecedor:

```txt
Flaps Produtos Automotivos Ltda
```

Resultado validado:

```txt
Produtos calculado: R$ 2.604,36
Impostos no custo: R$ 0,00
Total estimado: R$ 2.604,36
Status da compra: rascunho
```

Conclusão:

```txt
Valor correto.
Conversão cx12 aplicada.
Sem imposto adicional no custo.
```

---

### 7.2 NF 224330 — Flaps

Fornecedor:

```txt
Flaps Produtos Automotivos Ltda
```

Resultado validado:

```txt
Produtos calculado: R$ 3.172,81
Impostos no custo: R$ 0,00
Total estimado: R$ 3.172,81
Status da compra: rascunho
```

Conclusão:

```txt
Valor correto.
Conversão cx12 aplicada.
Sem imposto adicional no custo.
```

---

### 7.3 NF 351272 — MOAS

Fornecedor:

```txt
MOAS INDUSTRIA E COMERCIO IMPORTACAO E EXPORTACAO LTDA
```

Resultado validado:

```txt
Produtos calculado: R$ 2.828,22
Impostos no custo: R$ 244,01
Total estimado: R$ 3.072,23
Status da compra: rascunho
```

Conclusão:

```txt
Valor correto.
IPI + ICMS-ST foram considerados no custo.
Total estimado fecha com o valor esperado da NF.
```

---

## 8. Validação item a item

Foi realizada conferência detalhada dos itens das compras.

### NF 220525 — Flaps

Resumo:

```txt
Itens: 5
Quantidade convertida total: 216 unidades
Quantidade recebida: 0
Quantidade pendente: 216
Total estimado: R$ 2.604,36
Status dos itens: pendente
```

### NF 224330 — Flaps

Resumo:

```txt
Itens: 7
Quantidade convertida total: 228 unidades
Quantidade recebida: 0
Quantidade pendente: 228
Total estimado: R$ 3.172,81
Status dos itens: pendente
```

### NF 351272 — MOAS

Resumo:

```txt
Itens: 13
Quantidade total: 48 unidades
Quantidade recebida: 0
Quantidade pendente: 48
Produtos calculado: R$ 2.828,22
Impostos no custo: R$ 244,01
Total estimado: R$ 3.072,23
Status dos itens: pendente
```

---

## 9. Classificação operacional das compras

Foi conferida a tabela:

```txt
public.compras_controle_recebimento
```

As 3 compras foram classificadas como:

```txt
historico_fiscal_sem_entrada_estoque
```

E todas ficaram com:

```txt
bloqueia_recebimento = true
```

Resultado:

```txt
NF 220525 → historico_fiscal_sem_entrada_estoque → bloqueia_recebimento = true
NF 224330 → historico_fiscal_sem_entrada_estoque → bloqueia_recebimento = true
NF 351272 → historico_fiscal_sem_entrada_estoque → bloqueia_recebimento = true
```

---

## 10. Motivo da classificação como histórico fiscal

Essas NFs foram importadas para conferência e histórico fiscal, mas não representam, neste momento, uma entrada nova de estoque a ser recebida no Primely.

Por isso, elas devem permanecer bloqueadas para recebimento.

A classificação:

```txt
historico_fiscal_sem_entrada_estoque
```

evita:

```txt
duplicidade de estoque
geração indevida de lote
movimentação indevida de entrada
recebimento operacional indevido
```

---

## 11. Situação final das 3 NFs

Situação final validada:

```txt
Compras criadas: sim
Itens criados: sim
Totais corretos: sim
Conversão de unidade: validada
Regra fiscal: validada
Quantidade recebida: 0
Quantidade pendente: igual à quantidade total
Status dos itens: pendente
Status das compras: rascunho
Classificação operacional: historico_fiscal_sem_entrada_estoque
Bloqueio de recebimento: ativo
Geração de lote: não
Movimentação de estoque: não
```

---

## 12. O que não deve ser feito com essas NFs

Para essas 3 NFs antigas, não deve ser feito:

```txt
recebimento real
geração de lote
entrada de estoque
movimentação de estoque
liberação automática para recebimento
```

Qualquer mudança nessa decisão deve ser feita apenas com nova conferência operacional e backup.

---

## 13. Próxima decisão operacional

Depois desta validação, o próximo fluxo a planejar é o tratamento das **novas NFs reais**, ou seja, notas que realmente representam mercadoria nova a ser recebida.

Para novas NFs reais, o fluxo esperado será:

```txt
NF Olist importada
↓
Compra criada no Primely
↓
Classificação inicial: pendente_conferencia_operacional
↓
Conferência manual
↓
Liberação como recebimento_real
↓
Recebimento
↓
Geração de lote
↓
Entrada de estoque
```

---

## 14. Pontos importantes para as próximas etapas

Antes de automatizar recebimento real, ainda é recomendável definir:

```txt
1. Como selecionar uma NF nova para recebimento real.
2. Como conferir os itens antes de liberar recebimento.
3. Como definir local de destino.
4. Como gerar lote com segurança.
5. Como tratar lote, validade e custo.
6. Como evitar duplicidade caso o estoque já exista no Primely.
7. Como auditar quem liberou o recebimento.
```

---

## 15. Conclusão da Parte 9F

A validação fiscal das NFs Olist foi concluída com sucesso.

Foram confirmados:

```txt
conversão de unidade correta
custo unitário correto
regra fiscal correta
total por NF correto
itens pendentes corretos
bloqueio operacional correto
classificação como histórico fiscal correta
```

Essas 3 NFs ficam registradas no sistema como histórico fiscal e não devem gerar estoque.
