---
name: marketplace-integrations
description: Use para Olist/Tiny, Amazon SP-API, Keepa, Mercado Livre API, n8n, Telegram, snapshots, syncs e logs.
---

# Marketplace Integrations

## Princípio

Integrações devem alimentar snapshots, logs, views, conciliações e alertas.

Integrações **não devem duplicar o ERP**.

---

## Fontes

### Olist/Tiny

Fonte operacional oficial para:

- produtos;
- pedidos;
- estoque por depósito;
- notas;
- fornecedores;
- operação diária.

O Primely importa snapshots para análise.

### Amazon SP-API

Fonte para:

- inventário FBA;
- taxas;
- relatórios;
- pedidos, quando permitido;
- conciliação com Olist;
- margem real/estimada.

### Keepa

Fonte para:

- preço histórico;
- Buy Box;
- BSR;
- reviews;
- concorrência;
- mineração;
- oportunidades;
- risco de margem.

### Mercado Livre API

Fonte futura para:

- vendas;
- estoque Full/Flex;
- anúncios;
- conciliação.

### n8n e Telegram

Usar para:

- relatórios;
- alertas;
- automações;
- perguntas em linguagem natural;
- agentes de IA.

---

## Regras obrigatórias

1. Nunca chamar APIs sensíveis diretamente do frontend.
2. Usar Edge Functions ou n8n para integrações com tokens.
3. Nunca expor secrets em código, console ou resposta.
4. Registrar logs de sincronização.
5. Guardar última sincronização.
6. Tratar paginação.
7. Tratar rate limit.
8. Tratar token vencido.
9. Tratar erro de API com mensagem clara.
10. Não sobrescrever dados sem estratégia.
11. Não gravar no Olist/Tiny sem autorização explícita.
12. Exibir saúde da integração no sistema.

---

## Edge Functions

Toda Edge Function de integração deve ter:

- validação do método HTTP;
- autenticação ou token interno;
- validação de variáveis de ambiente;
- tratamento de erro;
- retorno JSON padronizado;
- logs resumidos;
- nenhum vazamento de token;
- paginação/lote quando necessário.

---

## Worker limit

Evitar processamento muito grande em uma única execução.

Preferir:

- lotes pequenos;
- paginação;
- cursores;
- logs;
- retentativas;
- execução agendada;
- processamento incremental.

---

## Resultado esperado

Toda integração deve permitir responder:

- Quando rodou?
- Deu certo?
- Quantos registros vieram?
- Houve erro?
- Precisa reprocessar?
- Os dados estão confiáveis para relatório?
