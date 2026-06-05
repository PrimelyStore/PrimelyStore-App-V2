# Histórico Técnico Resumido — Primely Store

Este documento substitui a necessidade de manter dezenas de documentos de etapas antigas na pasta principal `docs/`.

A finalidade é preservar decisões importantes sem poluir o contexto do Antigravity.

---

## 1. Decisão mais importante

Durante o desenvolvimento, o sistema começou a caminhar para virar um segundo ERP.

A decisão atual é:

```txt
Olist/Tiny fica como ERP operacional oficial.
Primely Store fica como painel gerencial inteligente.
```

Isso significa que fluxos antigos de estoque, lote, venda oficial e baixa FIFO devem ser tratados como legado, auditoria ou uso controlado, não como fluxo principal automático.

---

## 2. Compras e NFs Olist

Foram criados fluxos para buscar NFs de entrada do Olist e salvar snapshots no Supabase.

Decisão atual:

```txt
Buscar NFs e salvar snapshots é permitido.
Transformar NFs em operação real, lote ou estoque automático deve exigir confirmação.
```

Pontos preservados:

- uso de Edge Function intermediária;
- proteção de `PRIMELY_INTERNAL_FUNCTION_TOKEN`;
- busca progressiva para evitar limite de worker;
- painel de conferência de snapshots;
- clareza visual de que snapshot não significa operação final.

---

## 3. Worker limit nas Edge Functions

Foi identificado erro `WORKER_RESOURCE_LIMIT` ao tentar processar muita informação em uma única execução.

Regra preservada:

```txt
Integrações pesadas devem usar paginação, lotes pequenos, logs, retentativas e processamento progressivo.
```

---

## 4. Painel de conferência de NFs

Foi criado conceito de painel para mostrar:

- NFs importadas;
- snapshots;
- NFs processadas;
- NFs pendentes;
- NFs com erro;
- itens vinculados;
- itens com erro.

Esse conceito pode ser reaproveitado na área de Saúde dos Dados.

---

## 5. Responsividade e padrão visual

Foram feitas melhorias de:

- layout fluido;
- tabelas grandes;
- sidebar recolhível;
- cards;
- formulários;
- remoção de debug visual;
- componentes reutilizáveis.

Decisão preservada:

```txt
Continuar usando componentes visuais reutilizáveis e evitar repetição excessiva de Tailwind nas páginas.
```

---

## 6. Tela Vendas

Houve saneamento de vendas de teste e melhoria visual.

Decisão atual:

```txt
Vendas devem ser analisadas como dados gerenciais.
Não processar pedidos Olist em massa como vendas internas oficiais sem confirmação.
```

---

## 7. Curva ABC

Foi criada documentação extensa para a página Curva ABC Inteligente.

Decisão preservada:

```txt
Curva ABC deve analisar faturamento, lucro, margem, volume, estoque, giro, Ads, ROI, TACOS e ACOS.
```

---

## 8. O que não trazer para a documentação principal

Não manter na raiz de `docs/` documentos muito específicos de etapas antigas, como:

- parte 10D;
- parte 10F;
- parte 10G;
- parte 10I;
- parte 11A;
- parte 11B;
- parte 11C;
- parte 11D;
- parte 11E;
- parte 11F;
- parte 9F;
- etapa 137;
- etapa 138;
- etapa 140.

Se quiser guardar, mover para:

```txt
docs/_arquivo_historico/
```

Não usar esses documentos como fonte ativa principal.

---

## 9. Fase 5.3C-7 - Custos por canal e historico de migrations

Em 2026-06-03, foi registrada a conclusao da aplicacao das migrations de custos por canal:

- `20260603000100_custos_por_canal_matrizes_cubagem.sql`
- `20260603000200_seed_minimo_comissoes_marketplaces.sql`
- `20260603000300_precificacao_e_cotacoes.sql`

Validacoes confirmadas apos a aplicacao:

- tabelas novas existem no remoto;
- colunas novas em `produtos_precificacao` existem;
- seed minimo de comissoes foi inserido;
- historico remoto de migrations foi normalizado;
- duplicidade local `20260516` foi resolvida por baseline consolidado.

A normalizacao local de `20260516` consolidou os arquivos duplicados em:

```txt
supabase/migrations/20260516_etapa133_baseline_fifo_e_pedidos_olist.sql
```

Os arquivos originais foram preservados como baseline/documentacao em:

```txt
docs/baseline/migrations_duplicadas_20260516/
```

Decisao preservada:

```txt
As estruturas de custos por canal servem para analise, simulacao, auditoria e tomada de decisao. Elas nao transformam o Primely Store em ERP operacional.
```

Nesta fase de documentacao nao foi executado SQL, nao houve alteracao de banco, nao houve alteracao de Edge Functions e nao houve mudanca de regra de negocio.

---

## 10. Fase 5.4A - Contrato de taxas por API

Em 2026-06-05, foi documentado o contrato tecnico para futuras integracoes de taxas por API.

Documento criado:

```txt
docs/09_CONTRATO_TAXAS_MARKETPLACE_API.md
```

Escopo registrado:

- contrato planejado da futura Edge Function `amazon-fees-quote`;
- contrato planejado da futura Edge Function `mercadolivre-fees-quote`;
- mapeamento para `marketplace_fee_quotes`;
- mapeamento para `produtos_precificacao`;
- precedencia de fallbacks `manual_override > api_recente > matriz_local > seed_minimo > alerta_sem_taxa`;
- regras de seguranca para tokens, secrets e `payload_bruto`;
- campos possivelmente faltantes antes da implementacao.

Decisao preservada:

```txt
APIs de marketplace devem ser chamadas somente por Edge Functions, n8n ou backend confiavel. O frontend nunca deve receber tokens, refresh tokens, client_secret, service_role ou connection strings.
```

Proxima etapa recomendada:

```txt
5.4B - Auditoria local do schema atual para verificar campos faltantes.
```
