# Fonte Oficial — Primely Store V3

## 1. Definição oficial do projeto

O **Primely Store** é um **painel gerencial inteligente** para uma empresa que vende em marketplaces.

Ele deve importar, consolidar, cruzar, auditar, alertar e gerar inteligência sobre a operação.

Ele **não substitui o Olist/Tiny** e **não deve duplicar o que o Olist/Tiny já faz como ERP operacional**.

---

## 2. Decisão arquitetural central

| Camada | Papel oficial |
|---|---|
| Olist/Tiny | ERP operacional oficial |
| Primely Store | Painel gerencial inteligente |
| Supabase/PostgreSQL | Base de consolidação, snapshots, views, logs, análises e configurações |
| Edge Functions | Camada segura para integrações e rotinas protegidas |
| n8n | Orquestração, alertas, automações e agentes |
| Amazon SP-API | Inventário FBA, taxas, pedidos/relatórios quando permitido |
| Keepa | Histórico de preço, Buy Box, BSR, demanda, concorrência e mineração |
| Mercado Livre API | Vendas, estoque Full/Flex e conciliações futuras |
| Telegram | Canal inicial de alertas e consultas gerenciais |

---

## 3. Stack oficial

```txt
React
Vite
TypeScript
Tailwind CSS
Supabase / PostgreSQL
Supabase Edge Functions em Deno/TypeScript
Olist/Tiny API V3
Amazon SP-API
Keepa
Mercado Livre API
n8n
Telegram
```

Não trocar a stack sem autorização explícita.

---

## 4. Objetivo do sistema

O sistema deve responder perguntas como:

- Quais produtos mais vendem?
- Quais produtos mais faturam?
- Quais produtos dão mais lucro?
- Quais produtos vendem muito, mas têm margem ruim?
- Quais produtos estão parados?
- Quais produtos estão com risco de ruptura?
- Quais produtos têm estoque alto e venda baixa?
- Quais produtos precisam de reposição?
- Quais produtos precisam de revisão de preço?
- Quais produtos dependem demais de Ads?
- Quais produtos são Curva A por lucro?
- Quais produtos são armadilha?
- Quais produtos merecem mais investimento?
- Quais produtos devem ser pausados, liquidados ou descontinuados?

Resumo:

```txt
Olist/Tiny = onde a operação acontece.
Primely Store = onde a gestão entende se a operação está saudável e lucrativa.
```

---

## 5. O que o Primely Store deve fazer

- Dashboard gerencial;
- Relatórios por período, canal, produto, fornecedor e logística;
- Estoque consolidado;
- Curva ABC Inteligente;
- Margem estimada;
- Lucro líquido estimado;
- ROI;
- Alertas de ruptura;
- Alertas de margem baixa;
- Alertas de estoque parado;
- Alertas de produtos sem custo;
- Alertas de falha de integração;
- Conciliação entre Olist, Amazon FBA e futuros canais;
- Saúde das integrações;
- Mineração de produtos com Keepa;
- Relatórios e alertas via n8n/Telegram.

---

## 6. O que o Primely Store não deve fazer por padrão

- Não substituir o Olist/Tiny.
- Não virar ERP.
- Não duplicar estoque operacional.
- Não criar fluxo principal de pedidos paralelo ao Olist.
- Não criar fluxo principal de notas fiscais paralelo ao Olist.
- Não executar baixa FIFO automática em massa.
- Não processar pedidos Olist em massa como vendas oficiais internas.
- Não tratar tabelas internas antigas como fonte oficial sem conciliação.
- Não gravar, editar ou excluir dados no Olist sem decisão explícita.
- Não expor chaves, tokens ou secrets no frontend.

---

## 7. Tratamento dos módulos antigos

Se ainda existirem no sistema, os módulos abaixo devem ser tratados com cuidado:

| Módulo | Tratamento atual |
|---|---|
| Produtos | Manter como base auxiliar e conciliar com Olist/Amazon |
| Fornecedores | Manter para custos, histórico e análises |
| Compras | Usar com cuidado como apoio/auditoria, não como ERP principal |
| Recebimento | Manter como legado/auditoria se ainda existir |
| Lotes/FIFO | Manter como legado/auditoria; não automatizar |
| Estoque interno | Não usar como saldo oficial principal sem conciliação |
| Transferência FIFO | Legado/manual/auditoria |
| Vendas internas | Não alimentar em massa por padrão |
| Baixa FIFO | Desativada por padrão |
| Alertas antigos | Adaptar para snapshots, views e conciliações atuais |

---

## 8. Regras obrigatórias para qualquer IA

1. Responder sempre em português do Brasil.
2. Ser didática e trabalhar por etapas.
3. Não usar achismos.
4. Não inventar nomes de tabelas, colunas, views, funções, rotas ou arquivos.
5. Pedir estrutura real quando faltar informação.
6. Preservar a versão funcionando.
7. Antes de mudanças grandes, solicitar `git status`.
8. Fazer alterações pequenas, testáveis e reversíveis.
9. Não executar migrations ou SQL destrutivo sem confirmação.
10. Não apagar módulos antigos sem auditoria e confirmação.
11. Não expor credenciais.
12. Atualizar documentação quando houver alteração relevante.
13. Se a tarefa começar a virar ERP, parar e refazer o plano.

---

## 9. Prompt de correção de escopo

Use quando a IA fugir do conceito:

```txt
Pare.

Você está fugindo do escopo oficial.

O Primely Store não é ERP.
O Olist/Tiny é o ERP operacional oficial.
O Primely Store é painel gerencial inteligente.

Não crie controle operacional duplicado de estoque, pedidos, notas fiscais, lotes, baixa FIFO ou transferências operacionais.

Refaça o plano para relatórios, análises, alertas, conciliações, Curva ABC, margem, estoque consolidado e tomada de decisão.

Não escreva código ainda.
```
