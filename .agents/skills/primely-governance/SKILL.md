---
name: primely-governance
description: Use sempre no projeto Primely Store para manter o escopo correto: painel gerencial inteligente, não ERP.
---

# Primely Governance

## Regra principal

O **Primely Store não é ERP**.

- **Olist/Tiny** é o ERP operacional oficial.
- **Primely Store** é painel gerencial inteligente.
- **Supabase/PostgreSQL** guarda snapshots, views, RPCs, logs, análises e configurações.
- **Edge Functions/n8n** fazem integrações, automações e rotinas seguras.
- **Amazon SP-API, Keepa e Mercado Livre API** são fontes externas de inteligência e conciliação.

O Primely deve **importar, consolidar, cruzar, auditar, alertar e gerar inteligência**.

O Primely não deve duplicar a operação do Olist/Tiny.

---

## Antes de qualquer implementação

Sempre responda mentalmente:

```txt
Esta tarefa mantém o Primely como painel gerencial inteligente ou está criando um segundo ERP?
```

Se estiver criando ERP, pare e replaneje.

---

## Perguntas obrigatórias de governança

Antes de propor código, verifique:

- A tarefa duplica algo que o Olist/Tiny já faz?
- A tarefa altera estoque operacional?
- A tarefa cria pedidos ou vendas oficiais em massa?
- A tarefa executa baixa FIFO automática?
- A tarefa grava, edita ou exclui dados no Olist/Tiny?
- A tarefa cria segunda verdade de estoque?
- A tarefa usa tabela legada como fonte oficial sem conciliação?
- A tarefa expõe tokens, chaves ou secrets?

Se qualquer resposta for **sim**, não implemente sem explicar o risco e pedir confirmação.

---

## O que o Primely pode criar

- Dashboard gerencial;
- Relatórios;
- Estoque consolidado;
- Vendas analíticas;
- Custos e margem estimada;
- Curva ABC Inteligente;
- Conciliações;
- Alertas inteligentes;
- Saúde das integrações;
- Mineração com Keepa;
- Automações com n8n/Telegram.

---

## O que o Primely não deve criar por padrão

- ERP paralelo;
- Controle operacional oficial de estoque;
- Controle operacional oficial de notas;
- Baixa FIFO automática em massa;
- Processamento em massa de pedidos Olist como vendas oficiais internas;
- Transferência operacional concorrente com o Olist;
- Rotinas que escrevem no Olist sem decisão explícita.

---

## Resposta padrão esperada

Toda proposta deve informar:

1. Objetivo;
2. O que será alterado;
3. O que não será alterado;
4. Riscos;
5. Como testar;
6. Rollback;
7. Documentação que será atualizada.

---

## Freio de escopo

Se a tarefa começar a virar ERP, responda:

```txt
A tarefa está caminhando para duplicar uma função operacional do Olist/Tiny.
Pelo conceito oficial, o Primely deve atuar como painel gerencial inteligente.
Vou refazer o plano para análise, relatório, alerta, conciliação ou inteligência, sem duplicar o ERP.
```
