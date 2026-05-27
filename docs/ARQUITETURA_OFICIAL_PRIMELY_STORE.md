# Arquitetura Oficial — Agentes Primely Store

## 1. Objetivo do sistema

O sistema Agentes Primely Store é uma aplicação web operacional e gerencial para controle de uma empresa que vende em marketplaces, principalmente Amazon Seller, utilizando Olist como centro operacional.

O objetivo é integrar e controlar:

- Produtos
- Fornecedores
- Compras
- Notas fiscais de entrada
- Vendas
- Estoque por local
- Lotes
- FIFO
- Movimentações de estoque
- Conciliação entre Olist, Amazon e Primely
- Custos reais por produto
- Margem de lucro
- Curva ABC
- Produtos mais vendidos
- Alertas operacionais
- Relatórios gerenciais
- Futuras integrações com Keepa, Mercado Livre direto, Amazon SP-API, n8n e agentes de IA

O sistema deve funcionar como painel de controle interno da operação, ajudando a responder perguntas como:

- Quanto tenho de estoque de cada produto?
- Onde está meu estoque: Prep Center, Amazon FBA, Mercado Livre Full ou estoque próprio?
- Qual produto vende mais?
- Qual produto dá mais margem?
- Qual produto está parado?
- Qual produto precisa de reposição?
- Qual venda já baixou estoque?
- Qual compra entrou realmente no estoque?
- Qual NF é apenas histórica?
- Qual produto está divergente entre Olist, Amazon e Primely?

---

## 2. Stack atual

O projeto utiliza:

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Edge Functions

Repositório seguro:

```txt
primelystore/PrimelyStore-App-V2