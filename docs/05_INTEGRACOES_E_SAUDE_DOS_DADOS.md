# Integrações e Saúde dos Dados — Primely Store V3

## 1. Objetivo

A área de Integrações e Saúde dos Dados deve mostrar se os dados usados nos relatórios são confiáveis.

Antes de analisar Dashboard, Estoque, Vendas ou Curva ABC, o usuário precisa saber:

```txt
Os dados foram sincronizados?
Quando foram sincronizados?
Houve erro?
Quantos registros vieram?
Algum token está vencido?
Alguma API falhou?
```

---

## 2. Integrações principais

### 2.1. Olist/Tiny

Uso:

- produtos;
- depósitos;
- estoque por depósito;
- pedidos;
- itens de pedido;
- notas de entrada;
- fornecedores;
- logs.

Regra:

```txt
Olist/Tiny é a fonte operacional oficial.
O Primely importa snapshots para análise.
```

---

### 2.2. Amazon SP-API

Uso:

- inventário FBA;
- taxas;
- relatórios;
- pedidos, quando permitido;
- conciliação com Olist;
- dados para margem real/estimada.

Regra:

```txt
Nunca chamar SP-API diretamente do frontend.
```

---

### 2.3. Keepa

Uso:

- preço histórico;
- Buy Box;
- BSR;
- reviews;
- concorrência;
- mineração de produtos;
- alertas de oportunidade;
- alertas de risco.

Regra:

```txt
Controlar tokens/rate limit e salvar snapshots úteis.
```

---

### 2.4. Mercado Livre API

Uso futuro:

- estoque Full;
- vendas;
- anúncios;
- conciliação;
- margem por canal.

---

### 2.5. n8n e Telegram

Uso futuro:

- relatórios automáticos;
- alertas;
- perguntas em linguagem natural;
- orquestração de fluxos;
- agentes de IA.

---

## 3. Tela de Saúde dos Dados

A tela deve mostrar cards como:

- Olist conectado;
- Amazon conectada;
- Keepa configurado;
- n8n ativo;
- Telegram ativo;
- última sincronização de produtos;
- última sincronização de estoque;
- última sincronização de pedidos;
- última sincronização de notas;
- total de produtos;
- total de depósitos;
- total de linhas de estoque;
- total de pedidos;
- erros recentes;
- status dos tokens.

---

## 4. Logs recomendados

Tabelas ou views de log devem permitir responder:

- qual integração rodou;
- quando começou;
- quando terminou;
- quantos registros foram processados;
- quantos erros ocorreram;
- qual foi o erro;
- se precisa nova tentativa;
- qual usuário/rotina acionou.

---

## 5. Boas práticas

- Não misturar dados brutos com dados calculados sem identificar a origem.
- Sempre mostrar a fonte do dado.
- Sempre mostrar data da última atualização.
- Tratar paginação das APIs.
- Tratar rate limit.
- Tratar erro de token vencido.
- Não sobrescrever dados locais sem estratégia.
- Não gravar no Olist sem autorização explícita.
- Não confiar em sync parcial como se fosse base completa.

---

## 6. Primeira implementação recomendada

Antes de evoluir Dashboard e Curva ABC, criar ou revisar:

```txt
Página: Integrações / Saúde dos Dados
```

Motivo:

```txt
Sem saber se os dados estão atualizados, qualquer relatório pode induzir decisão errada.
```
