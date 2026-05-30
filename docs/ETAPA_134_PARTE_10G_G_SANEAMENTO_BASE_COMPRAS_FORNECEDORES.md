# Etapa 134 — Parte 10G-G — Documentação do saneamento da base

## 1. Objetivo desta documentação

Este documento registra o saneamento realizado na base de dados do projeto **Agentes Primely Store**, antes da evolução do fluxo de recebimento real de NFs Olist.

O objetivo do saneamento foi remover registros de teste que poderiam poluir:

```txt
tela de Compras
cards de resumo
dashboard
relatórios futuros
fluxo de recebimento real
análises de estoque e compras
```

A limpeza foi feita com backup e conferência prévia, sem afetar dados reais, NFs Olist, estoque, lotes, movimentações ou vendas.

---

## 2. Contexto

Antes da limpeza, a tela de Compras mostrava registros de teste criados durante etapas anteriores de validação do sistema.

Esses registros foram úteis durante o desenvolvimento, mas poderiam atrapalhar o uso operacional do sistema.

Foram identificados dois grupos de dados de teste:

```txt
compras de teste
fornecedores de teste
```

---

## 3. Compras de teste removidas

Foram removidas 5 compras de teste:

```txt
COMPRA-AUTH-001
COMPRA-TESTE-FRONTEND-001
COMPRA-TESTE-PARTE2-001
COMPRA-TESTE-SISTEMA-001
COMPRA-VALIDACAO-134-001
```

Antes da remoção, foi validado que essas compras tinham:

```txt
0 itens
0 unidades
R$ 0,00 em produtos
0 unidades recebidas
sem recebimento real
sem controle de recebimento
sem lote
sem auditoria vinculada
```

Conclusão:

```txt
As compras de teste não tinham impacto operacional real e puderam ser removidas com segurança após backup.
```

---

## 4. Backups criados para compras de teste

Antes do DELETE das compras de teste, foram criadas tabelas de backup:

```txt
backup_etapa134_parte10gc_compras_teste_before_delete
backup_etapa134_parte10gc_compras_itens_teste_before_delete
backup_etapa134_parte10gc_controle_recebimento_teste_before_delete
backup_etapa134_parte10gc_estoque_lotes_teste_before_delete
backup_etapa134_parte10gc_auditoria_eventos_teste_before_delete
```

Resultado validado dos backups:

```txt
backup_compras_teste                 5
backup_compras_itens_teste           0
backup_controle_recebimento_teste    0
backup_estoque_lotes_teste           0
backup_auditoria_eventos_teste       0
```

---

## 5. Remoção das compras de teste

A remoção foi feita com validação prévia usando transação e simulação.

Resultado do DELETE real:

```txt
auditorias_apagadas: 0
lotes_apagados: 0
controles_apagados: 0
itens_apagados: 0
compras_apagadas: 5
```

Isso confirmou que apenas as 5 compras de teste foram removidas.

---

## 6. Compras Olist preservadas

As compras Olist foram preservadas:

```txt
OLIST-NF-220525
OLIST-NF-224330
OLIST-NF-351272
```

Essas compras representam NFs importadas do Olist para histórico fiscal.

Resumo preservado:

```txt
total_compras: 3
total_itens: 25
unidades: 492
total_produtos: R$ 8.605,39
unidades_recebidas: 0
```

Classificação operacional:

```txt
historico_fiscal_sem_entrada_estoque
bloqueia_recebimento = true
```

Essas NFs não devem gerar estoque, lote ou movimentação de entrada.

---

## 7. Fornecedores de teste removidos

Após remover as compras de teste, foram auditados fornecedores de teste.

Foram encontrados 2 fornecedores de teste:

```txt
Fornecedor Teste Frontend
Fornecedor Teste Sistema
```

Antes da remoção, foi validado que eles não tinham vínculos em:

```txt
compras
produto_fornecedor_conversao_unidade
produtos_fornecedores
```

---

## 8. Dependências de fornecedores analisadas

A auditoria de chaves estrangeiras mostrou que a tabela `fornecedores` é referenciada por:

```txt
compras
produto_fornecedor_conversao_unidade
produtos_fornecedores
```

Foram feitas consultas específicas para confirmar que os fornecedores de teste não estavam vinculados a essas tabelas.

Resultado:

```txt
compras: 0 vínculos
produto_fornecedor_conversao_unidade: 0 vínculos
produtos_fornecedores: 0 vínculos
```

---

## 9. Backups criados para fornecedores de teste

Antes de remover os fornecedores de teste, foram criados os backups:

```txt
bkp134_10gf_fornecedores_teste
bkp134_10gf_compras_forn_teste
bkp134_10gf_prod_forn_teste
bkp134_10gf_conv_unid_forn_teste
```

Resultado dos backups:

```txt
bkp134_10gf_fornecedores_teste      2
bkp134_10gf_compras_forn_teste      0
bkp134_10gf_prod_forn_teste         0
bkp134_10gf_conv_unid_forn_teste    0
```

---

## 10. Observação sobre erro de coluna `cnpj`

Durante a conferência do backup dos fornecedores, foi executada uma consulta tentando mostrar a coluna:

```txt
cnpj
```

O banco retornou:

```txt
column "cnpj" does not exist
```

Esse erro não afetou o backup nem a limpeza.

Ele apenas confirmou que a tabela `fornecedores` não possui uma coluna chamada `cnpj`.

---

## 11. Remoção dos fornecedores de teste

A remoção também foi feita com simulação antes do DELETE real.

Resultado da simulação:

```txt
vínculos produtos_fornecedores que seriam apagados: 0
regras de conversão que seriam apagadas: 0
compras que seriam apagadas: 0
fornecedores que seriam apagados: 2
```

Resultado do DELETE real:

```txt
vínculos produtos_fornecedores apagados: 0
regras de conversão apagadas: 0
compras apagadas: 0
fornecedores apagados: 2
```

---

## 12. Fornecedores reais preservados

Após a limpeza, a validação final mostrou que restaram apenas fornecedores reais:

```txt
Flaps Produtos Automotivos Ltda
MOAS INDUSTRIA E COMERCIO IMPORTACAO E EXPORTACAO LTDA
```

A busca por fornecedores com termos:

```txt
TESTE
FRONTEND
VALIDACAO
```

não retornou mais registros.

---

## 13. O que foi preservado

O saneamento não alterou:

```txt
NFs Olist
compras Olist
compras_itens Olist
fornecedores reais
produtos reais
estoque
lotes
movimentações
vendas
baixa FIFO
regras fiscais
regras de conversão reais
Edge Functions
RPCs
views
frontend
```

---

## 14. Estado final da base após saneamento

Após o saneamento, a base de compras ficou com:

```txt
3 compras Olist históricas
25 itens Olist
492 unidades históricas
R$ 8.605,39 em produtos
0 unidades recebidas
0 compras de teste
0 fornecedores de teste
```

Fornecedores finais:

```txt
Flaps Produtos Automotivos Ltda
MOAS INDUSTRIA E COMERCIO IMPORTACAO E EXPORTACAO LTDA
```

---

## 15. Benefícios do saneamento

A limpeza trouxe os seguintes benefícios:

```txt
Tela Compras mais limpa.
Indicadores menos poluídos.
Base preparada para receber novas NFs reais.
Menor risco de selecionar compra de teste por engano.
Menor risco de confundir histórico fiscal com operação real.
Maior segurança para criar o futuro botão de liberação de recebimento real.
```

---

## 16. Próxima etapa recomendada

Depois do saneamento, a próxima etapa recomendada é voltar ao planejamento do botão seguro:

```txt
Liberar recebimento real
```

Esse botão deverá:

```txt
aparecer apenas quando fizer sentido operacional
não aparecer para histórico fiscal sem entrada estoque
exigir confirmação explícita
mostrar aviso de risco
chamar função segura no banco
não receber item automaticamente
não gerar lote automaticamente
não movimentar estoque automaticamente
```

---

## 17. Status da Etapa 134 — Parte 10G-G

Status:

```txt
Documentação criada.
Saneamento de compras de teste validado.
Saneamento de fornecedores de teste validado.
Backups registrados.
Dados Olist preservados.
Estoque preservado.
Lotes preservados.
Movimentações preservadas.
Vendas preservadas.
Base preparada para próximos passos do recebimento real.
```
