# Contrato de Taxas Marketplace API - Fase 5.4A

## 1. Contexto

Este documento registra o contrato tecnico planejado para a Fase 5.4 do Modulo 5 - Custos e Margem Estimada.

O objetivo da fase e preparar a integracao futura de taxas por API sem transformar o Primely Store em ERP operacional. O Primely continua sendo painel gerencial inteligente: consulta, consolida, audita, simula e apoia decisao.

Escopo planejado:

- Amazon SP-API Product Fees;
- Mercado Livre `listing_prices` e cotacoes logisticas;
- persistencia de historico em `marketplace_fee_quotes`;
- atualizacao controlada de caches calculados em `produtos_precificacao`;
- uso de matrizes locais como fallback;
- protecao total de tokens, secrets e credenciais.

Este documento nao implementa Edge Functions, nao cria migrations e nao altera banco. Ele define somente o contrato esperado para as proximas microetapas.

---

## 2. Edge Function futura `amazon-fees-quote`

### 2.1. Objetivo

Consultar a Amazon SP-API Product Fees para estimar taxas de marketplace e, quando identificavel, taxas logisticas/FBA de um produto em um canal Amazon.

A consulta deve ser feita exclusivamente por Edge Function ou backend confiavel. O frontend nunca deve chamar SP-API diretamente.

### 2.2. Request esperado

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `produto_id` | uuid | Sim | Produto interno do Primely. |
| `canal_venda_id` | uuid | Sim | Canal Amazon cadastrado no Primely. |
| `seller_sku` | string | Sim | SKU usado na conta Amazon. |
| `asin` | string | Nao | Identificador Amazon, se aplicavel em consulta futura. |
| `marketplace_id` | string | Sim | Marketplace Amazon alvo. |
| `preco_consultado` | number | Sim | Preco usado para estimar as taxas. |
| `moeda` | string | Sim | Moeda da cotacao, por exemplo `BRL`. |
| `is_amazon_fulfilled` | boolean | Sim | Define se a simulacao e FBA (`true`) ou FBM (`false`). |
| `shipping_estimado` | number | Nao | Frete estimado quando aplicavel. |
| `atualizar_precificacao` | boolean | Nao | Se deve atualizar `produtos_precificacao`. Default futuro recomendado: `true`. |

### 2.3. Response esperado

| Campo | Tipo | Descricao |
|---|---|---|
| `success` | boolean | Resultado da operacao. |
| `fee_quote_id` | uuid/null | ID criado em `marketplace_fee_quotes`, quando houver gravacao. |
| `produto_id` | uuid | Produto consultado. |
| `canal_venda_id` | uuid | Canal consultado. |
| `marketplace` | string | Valor esperado: `amazon`. |
| `taxa_marketplace_calculada` | number | Taxa principal de marketplace estimada pela API. |
| `taxa_logistica_calculada` | number | Taxa logistica/FBA quando identificavel. |
| `custo_total_calculado` | number | Soma das taxas calculadas. |
| `origem` | string | `api`, `matriz`, `estimativa_padrao` ou `manual`. |
| `status` | string | `sucesso` ou `erro`. |
| `erro` | string/null | Erro sanitizado, sem segredo. |

### 2.4. Mapeamento para `marketplace_fee_quotes`

| Coluna | Valor planejado |
|---|---|
| `produto_id` | `request.produto_id` |
| `canal_venda_id` | `request.canal_venda_id` |
| `produto_sku_snapshot` | `request.seller_sku` |
| `canal_nome_snapshot` | Nome do canal Amazon no momento da consulta. |
| `origem` | `api` quando SP-API responder com sucesso. |
| `marketplace` | `amazon` |
| `tipo_consulta` | `sp_api_product_fees_sku` |
| `preco_consultado` | `request.preco_consultado` |
| `taxa_marketplace_calculada` | Total/referral fee identificada na resposta. |
| `taxa_logistica_calculada` | Taxa FBA/logistica identificada, quando confiavel. |
| `custo_total_calculado` | Soma de taxa marketplace e logistica. |
| `payload_bruto` | Payload de resposta sanitizado. |
| `status` | `sucesso` ou `erro`. |
| `erro` | Mensagem sanitizada quando houver falha. |

### 2.5. Mapeamento para `produtos_precificacao`

| Coluna | Regra planejada |
|---|---|
| `origem_taxa_marketplace` | `api` quando a cotacao for valida. |
| `taxa_marketplace_calculada` | Valor estimado pela SP-API. |
| `origem_taxa_logistica` | `api` quando a taxa logistica/FBA for confiavel; caso contrario fallback. |
| `taxa_logistica_calculada` | Valor retornado ou calculado. |
| `data_ultima_consulta_api` | Momento da cotacao. |
| `fee_quote_id` | ID da cotacao gravada em `marketplace_fee_quotes`. |

Regra de protecao: nao sobrescrever um futuro `manual_override` ativo sem regra explicita aprovada pelo usuario.

### 2.6. Erros e fallbacks

| Situacao | Acao planejada |
|---|---|
| API retorna sucesso | Gravar cotacao e atualizar cache, se permitido. |
| Rate limit | Registrar erro sanitizado e usar fallback conforme precedencia. |
| Token vencido/permissao negada | Registrar erro de integracao, sem expor token. |
| Payload incompleto | Gravar erro ou cotacao parcial, sem atualizar cache critico. |
| SKU sem configuracao | Retornar erro validavel e sugerir completar mapeamento. |

---

## 3. Edge Function futura `mercadolivre-fees-quote`

### 3.1. Objetivo

Consultar custos de venda e logistica do Mercado Livre para estimar comissao, taxa de anuncio e frete/logistica por produto, anuncio, modalidade e preco.

A consulta deve ser feita exclusivamente por Edge Function ou backend confiavel. O frontend nunca deve chamar APIs sensiveis do Mercado Livre diretamente.

### 3.2. Request esperado

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `produto_id` | uuid | Sim | Produto interno do Primely. |
| `canal_venda_id` | uuid | Sim | Canal Mercado Livre cadastrado. |
| `item_id` | string | Nao | ID do anuncio, quando existir. |
| `category_id` | string | Sim | Categoria Mercado Livre para calculo de comissao. |
| `preco_consultado` | number | Sim | Preco usado na simulacao. |
| `moeda` | string | Sim | Moeda da cotacao, por exemplo `BRL`. |
| `listing_type_id` | string | Sim | Tipo de anuncio, como classico ou premium. |
| `logistic_type` | string | Sim | Tipo logistico, como fulfillment ou self_service. |
| `shipping_mode` | string | Sim | Modo de envio, por exemplo Mercado Envios. |
| `free_shipping` | boolean | Sim | Define se o anuncio oferece frete gratis. |
| `peso_g` | number | Condicional | Necessario quando a cotacao depende de dimensoes. |
| `altura_mm` | number | Condicional | Dimensao para cotacao logistica. |
| `largura_mm` | number | Condicional | Dimensao para cotacao logistica. |
| `comprimento_mm` | number | Condicional | Dimensao para cotacao logistica. |
| `atualizar_precificacao` | boolean | Nao | Se deve atualizar `produtos_precificacao`. Default futuro recomendado: `true`. |

### 3.3. Separacao de modalidades

| Modalidade | Criterio planejado |
|---|---|
| Full | `logistic_type = fulfillment` |
| Flex | `logistic_type = self_service` |
| Classico | `listing_type_id` equivalente ao anuncio classico no site alvo. |
| Premium | `listing_type_id` equivalente ao anuncio premium no site alvo. |

As equivalencias finais de `listing_type_id` devem ser confirmadas por site/conta antes da implementacao.

### 3.4. Response esperado

| Campo | Tipo | Descricao |
|---|---|---|
| `success` | boolean | Resultado da operacao. |
| `fee_quote_id` | uuid/null | ID criado em `marketplace_fee_quotes`, quando houver gravacao. |
| `produto_id` | uuid | Produto consultado. |
| `canal_venda_id` | uuid | Canal consultado. |
| `marketplace` | string | Valor esperado: `mercado_livre`. |
| `taxa_marketplace_calculada` | number | Comissao/taxa de venda estimada. |
| `taxa_logistica_calculada` | number | Custo de frete/logistica estimado para o vendedor. |
| `custo_total_calculado` | number | Soma de comissao e logistica. |
| `origem` | string | `api`, `matriz`, `estimativa_padrao` ou `manual`. |
| `status` | string | `sucesso` ou `erro`. |
| `erro` | string/null | Erro sanitizado, sem segredo. |

### 3.5. Mapeamento para `marketplace_fee_quotes`

| Coluna | Valor planejado |
|---|---|
| `produto_id` | `request.produto_id` |
| `canal_venda_id` | `request.canal_venda_id` |
| `produto_sku_snapshot` | SKU interno ou snapshot do item/anuncio. |
| `canal_nome_snapshot` | Nome do canal Mercado Livre no momento da consulta. |
| `origem` | `api` quando a API responder com sucesso. |
| `marketplace` | `mercado_livre` |
| `tipo_consulta` | `listing_prices`, `shipping_options` ou combinacao equivalente. |
| `preco_consultado` | `request.preco_consultado` |
| `taxa_marketplace_calculada` | Comissao/taxa de venda estimada. |
| `taxa_logistica_calculada` | Frete/logistica estimada para o vendedor. |
| `custo_total_calculado` | Soma de taxa marketplace e logistica. |
| `payload_bruto` | Payload de resposta sanitizado. |
| `status` | `sucesso` ou `erro`. |
| `erro` | Mensagem sanitizada quando houver falha. |

### 3.6. Mapeamento para `produtos_precificacao`

| Coluna | Regra planejada |
|---|---|
| `origem_taxa_marketplace` | `api` quando a cotacao for valida. |
| `taxa_marketplace_calculada` | Comissao/taxa de venda calculada. |
| `origem_taxa_logistica` | `api` quando a cotacao logistica for confiavel; caso contrario fallback. |
| `taxa_logistica_calculada` | Frete/logistica calculado. |
| `data_ultima_consulta_api` | Momento da cotacao. |
| `fee_quote_id` | ID da cotacao gravada em `marketplace_fee_quotes`. |

---

## 4. Fallbacks e precedencia

Regra de precedencia planejada:

```txt
manual_override > api_recente > matriz_local > seed_minimo > alerta_sem_taxa
```

| Fonte | Quando usar |
|---|---|
| `manual_override` | Quando o gestor definiu excecao explicita para produto/canal. Sempre tem prioridade. |
| `api_recente` | Quando existe cotacao API valida dentro da janela de cache definida. |
| `tarifas_comissoes_marketplaces` | Fallback de comissao por canal/categoria quando API falhar, nao estiver configurada ou estiver vencida. |
| `tarifas_logistica_amazon` | Fallback logistico Amazon/FBA/FBM quando a SP-API nao retornar detalhe confiavel. |
| `tarifas_logistica_mercado_livre` | Fallback logistico Mercado Livre por modalidade, peso, preco e reputacao/logistica. |
| `seed_minimo` | Estimativa inicial para nao deixar simulacao completamente sem referencia. |
| `alerta_sem_taxa` | Quando nenhuma fonte confiavel existe; a tela deve alertar que a taxa esta ausente. |

---

## 5. Seguranca

### 5.1. Dados que nunca vao ao frontend

```txt
access_token
refresh_token
client_secret
service_role
AWS access key
AWS secret access key
LWA client secret
SP-API refresh token
Mercado Livre client secret
connection string
Authorization header
cookies ou sessoes
```

### 5.2. Dados permitidos em `payload_bruto`

Somente dados sanitizados e uteis para auditoria:

```txt
request_id
status
marketplace_id
listing_type_id
logistic_type
shipping_mode
valores calculados
detalhes de fee sem credenciais
mensagens de erro sem secrets
timestamps de consulta
```

### 5.3. Regra de sanitizacao

Antes de gravar `payload_bruto`, remover qualquer campo sensivel por nome ou conteudo:

```txt
token
secret
password
authorization
bearer
cookie
session
client_secret
refresh_token
access_key
service_role
connection string
```

Tambem remover headers de request/response e qualquer URL contendo credenciais.

### 5.4. Onde secrets devem ficar futuramente

```txt
Supabase Edge Function secrets
n8n credentials, se a orquestracao usar n8n
backend confiavel fora do frontend
```

Regra obrigatoria: `service_role` nunca deve ir para o frontend e nunca deve ser usado no navegador.

---

## 6. Campos possivelmente faltantes no schema atual

Antes de implementar, auditar se estes campos ja existem em tabelas atuais ou se exigem nova modelagem:

| Campo | Motivo |
|---|---|
| `seller_sku` por produto-canal | Necessario para Amazon Product Fees por SKU. |
| `asin` por produto-canal | Util para consultas Amazon futuras e conciliacao. |
| `item_id` Mercado Livre | Necessario quando a cotacao depende do anuncio existente. |
| `category_id` Mercado Livre | Necessario para comissao/listing prices. |
| `listing_type_id` | Diferencia Classico e Premium. |
| `logistic_type` | Diferencia Full, Flex e outras modalidades. |
| `shipping_mode` | Necessario para cotacao logistica. |
| `moeda` padrao por canal | Evita consulta inconsistente. |
| validade/cache da cotacao | Define quando `api_recente` ainda e confiavel. |
| `manual_override` explicito | Protege excecoes do gestor contra sobrescrita automatica. |

---

## 7. Riscos e duvidas antes da implementacao

### 7.1. Riscos

- estimativas de API podem divergir do custo real faturado;
- rate limits podem bloquear processamento em lote;
- contexto logistico incompleto pode gerar taxa errada;
- payload bruto mal sanitizado pode vazar dado sensivel;
- atualizacao automatica pode sobrescrever excecao manual;
- diferencas por site/conta podem mudar `listing_type_id`, moeda e regras logisticas.

### 7.2. Duvidas abertas

- Onde hoje estao `seller_sku`, ASIN e IDs por canal?
- Como identificar e proteger `manual_override` no schema atual?
- Qual janela define `api_recente`: 24 horas, 7 dias ou 30 dias?
- A primeira implementacao sera Amazon BR, Mercado Livre MLB ou ambos?
- Quais produtos/canais serao usados como amostra controlada?

---

## 8. Proxima etapa recomendada

```txt
5.4B - Auditoria local do schema atual para verificar campos faltantes.
```

Escopo recomendado da 5.4B:

- auditar migrations e tipos locais;
- verificar se campos de SKU/ASIN/item/categoria/logistica ja existem;
- identificar se sera necessaria nova migration futura;
- nao executar SQL remoto;
- nao implementar Edge Functions ainda.
