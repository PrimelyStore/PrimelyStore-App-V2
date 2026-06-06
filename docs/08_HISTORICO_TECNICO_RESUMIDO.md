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

---

## 11. Fase 5.4B - Auditoria local do schema de taxas por API

Em 2026-06-05, foi documentada a auditoria local do schema atual para a futura integracao de taxas por API.

Documento atualizado:

```txt
docs/09_CONTRATO_TAXAS_MARKETPLACE_API.md
```

Campos ja cobertos:

- `produtos.sku`;
- `produtos.asin`;
- `canais_venda.modalidade_logistica`;
- `canais_venda.codigo_externo`;
- `canais_venda.marketplace_id`;
- `configuracoes_operacao.moeda_padrao`;
- `marketplace_fee_quotes`;
- `produtos_precificacao` com origem/cache/`fee_quote_id`;
- `produtos_dimensoes_gerenciais`;
- snapshot Amazon com `marketplace_id`, `seller_sku`, `asin` e `fn_sku`.

Campos parcialmente cobertos:

- `seller_sku`;
- `asin`;
- `marketplace_id` Amazon;
- moeda padrao;
- origem da taxa;
- `fee_quote_id`.

Campos ausentes:

- `item_id` Mercado Livre;
- `category_id` Mercado Livre;
- `listing_type_id`;
- `logistic_type`;
- `shipping_mode`;
- `free_shipping`;
- `manual_override` explicito;
- validade/cache da cotacao API;
- tabela clara de mapeamento produto-canal-marketplace.

Riscos preservados:

- Amazon e viavel apenas em piloto unitario/controlado;
- Mercado Livre tem risco alto sem campos logisticos e dados de anuncio/categoria;
- existe risco de sobrescrever override manual;
- `api_recente` ainda nao tem prazo objetivo.

Recomendacao:

```txt
Planejar a primeira Edge Function Amazon em modo unitario, recebendo todos os campos no request. Antes de automacao completa e Mercado Livre, planejar uma tabela/migration de mapeamento produto-canal-marketplace. Nao implementar Edge Functions antes de resolver override, cache e mapeamento.
```

Proxima etapa recomendada:

```txt
5.4C - Planejamento da tabela/migration de mapeamento produto-canal-marketplace, ainda sem aplicar nada.
```

---

## 12. Fase 5.4C - Planejamento do mapeamento produto-canal-marketplace

Em 2026-06-05, foi documentado o planejamento da futura tabela:

```txt
produto_canal_marketplace_mapeamento
```

Objetivo:

- mapear produto interno Primely;
- mapear canal de venda;
- mapear marketplace;
- guardar SKU/anuncio;
- guardar modalidade logistica e contexto de cotacao;
- controlar `manual_override`;
- definir validade/cache da API.

Campos principais planejados:

- `produto_id`;
- `canal_venda_id`;
- `marketplace`;
- `seller_sku`;
- `asin`;
- `marketplace_id`;
- `item_id`;
- `category_id`;
- `listing_type_id`;
- `logistic_type`;
- `shipping_mode`;
- `free_shipping`;
- `is_amazon_fulfilled`;
- `moeda`;
- `manual_override`;
- `validade_cache_horas`;
- `status`;
- `observacoes`;
- `atualizado_por`;
- `created_at`;
- `updated_at`.

Decisao preservada:

```txt
Antes de automatizar consultas de taxas por API, o Primely precisa saber qual produto/canal/anuncio/modalidade logistica sera usado em cada cotacao. Essa tabela e mapeamento gerencial, nao operacao oficial de marketplace.
```

Regras planejadas:

- um produto pode ter varios canais;
- um produto pode ter varios anuncios;
- Amazon FBA e FBM/DBA podem ter mapeamentos separados;
- Mercado Livre Full/Flex/Classico/Premium podem ter mapeamentos separados;
- `manual_override` bloqueia sobrescrita automatica por API;
- `validade_cache_horas` define objetivamente `api_recente`.

Recomendacao:

```txt
Criar migration futura para essa tabela antes de Edge Functions automaticas, considerar `mapeamento_id` em `marketplace_fee_quotes` e nao implementar integracao automatica de Mercado Livre sem esse mapeamento.
```

---

## 13. Fase 5.4D - Decisoes finais antes da migration de mapeamento

Em 2026-06-05, foram documentadas as decisoes finais antes da futura migration de mapeamento produto-canal-marketplace.

Decisoes preservadas:

- permitir multiplos mapeamentos ativos para o mesmo produto/canal, diferenciados por contexto;
- Amazon diferencia por `seller_sku`, `marketplace_id` e `is_amazon_fulfilled`;
- Mercado Livre diferencia por `item_id`, `listing_type_id`, `logistic_type`, `shipping_mode` e `free_shipping`;
- `validade_cache_horas` padrao = `24`;
- `api_recente` deve respeitar essa validade;
- cache vencido permite nova consulta API;
- `manual_override` bloqueia somente atualizacao automatica em `produtos_precificacao`;
- consulta API manual continua permitida mesmo com `manual_override`;
- cotacao deve ser gravada em `marketplace_fee_quotes`;
- `produtos_precificacao` nao deve ser atualizado automaticamente quando `manual_override = true`;
- futura migration deve adicionar `mapeamento_id` nullable em `marketplace_fee_quotes`;
- futura migration deve adicionar `aplicado_em_precificacao` boolean em `marketplace_fee_quotes`;
- `moeda` fica gravada no mapeamento, herdando `configuracoes_operacao.moeda_padrao` com fallback `BRL`;
- exclusao normal via `status = 'inativo'`; delete fisico somente admin.

Riscos registrados:

- indice unico mal desenhado pode bloquear anuncios legitimos;
- indice frouxo pode permitir duplicidade;
- `manual_override` precisa ser respeitado nas futuras Edge Functions;
- `mapeamento_id` nullable precisa ser tratado nos relatorios;
- cache de 24h exige controle de rate limit.

Proxima etapa recomendada:

```txt
5.4E - Planejamento tecnico da migration produto_canal_marketplace_mapeamento, ainda sem aplicar nada.
```

---

## 14. Fase 5.4E-2 - Pos-aplicacao da migration de mapeamento

Em 2026-06-05, foi documentada a aplicacao bem-sucedida da migration:

```txt
20260605000100_produto_canal_marketplace_mapeamento.sql
```

Objetos confirmados:

- tabela `produto_canal_marketplace_mapeamento` existe;
- colunas da tabela existem;
- `marketplace_fee_quotes` recebeu `mapeamento_id`;
- `marketplace_fee_quotes` recebeu `aplicado_em_precificacao`;
- indices criados;
- policies RLS criadas.

Observacao de aplicacao:

```txt
Notices de DROP TRIGGER IF EXISTS foram esperados e nao representam erro.
```

Status preservado:

```txt
O schema esta preparado para futuras Edge Functions de cotacao de taxas por API, mas as Edge Functions ainda nao devem ser implementadas nesta etapa.
```

Proximas etapas recomendadas:

- `5.4F - Planejamento do service/frontend de leitura do mapeamento`;
- `5.5A - Planejamento da primeira Edge Function Amazon em modo unitario`.

---

## 15. Fase 5.4F-6 - Tela de Mapeamento Marketplace

Em 2026-06-05, foi registrada a conclusao da tela gerencial de Mapeamento Marketplace dentro da pagina `Custos & Margens`.

Arquivos envolvidos:

```txt
src/services/produtoCanalMarketplaceService.ts
src/pages/CustosMargem.tsx
```

Funcionalidades concluidas:

- service local para acesso a `produto_canal_marketplace_mapeamento`;
- aba `Mapeamento Marketplace`;
- listagem de mapeamentos com filtros por marketplace, status e busca textual;
- criacao de mapeamento;
- edicao de mapeamento;
- inativacao logica via `status = inativo`;
- campos condicionais Amazon;
- campos condicionais Mercado Livre;
- validacoes basicas;
- estados de carregamento, vazio e erro/RLS.

Limitacoes intencionais:

- nao consulta Amazon SP-API;
- nao consulta Mercado Livre;
- nao chama Edge Function;
- nao atualiza `produtos_precificacao`;
- nao possui botao/acao de consultar taxa nesta etapa.

Decisao preservada:

```txt
O Mapeamento Marketplace e uma configuracao gerencial para futuras cotacoes de taxas. Ele nao transforma o Primely Store em ERP operacional e nao chama APIs sensiveis diretamente no frontend.
```

Validacao registrada:

- `npx tsc -b` passou;
- `npm run build` deve ser executado pelo usuario em ambiente seguro quando necessario, pois Vite pode carregar `.env.local`.

Proxima etapa recomendada:

```txt
5.5A - Planejamento da primeira Edge Function Amazon Product Fees em modo unitario/controlado.
```

---

## 16. Fase 5.5A - Planejamento da Edge Function Amazon Product Fees

Em 2026-06-05, foi documentado o planejamento tecnico da futura Edge Function:

```txt
amazon-fees-quote
```

Objetivo:

- consultar Amazon SP-API Product Fees em modo unitario/controlado;
- usar um `mapeamento_id` ja cadastrado em `produto_canal_marketplace_mapeamento`;
- respeitar cache por `mapeamento_id + preco_consultado`;
- gravar historico em `marketplace_fee_quotes`;
- atualizar `produtos_precificacao` somente quando permitido.

Request planejado:

- `mapeamento_id`;
- `preco_consultado`;
- `atualizar_precificacao` boolean opcional, default `false`;
- `force_refresh` boolean opcional, default `false`.

Response planejado:

- `success`;
- `fee_quote_id`;
- `mapeamento_id`;
- `origem`;
- `marketplace`;
- `taxa_marketplace_calculada`;
- `taxa_logistica_calculada`;
- `custo_total_calculado`;
- `aplicado_em_precificacao`;
- `status`;
- `erro` sanitizado.

Fluxo preservado:

- validar metodo, autenticacao e payload;
- buscar mapeamento ativo;
- exigir `marketplace = amazon`;
- validar `seller_sku`, `marketplace_id`, `is_amazon_fulfilled` e `preco_consultado > 0`;
- consultar cache por `mapeamento_id + preco_consultado`;
- retornar `api_recente` quando cache estiver valido e `force_refresh = false`;
- chamar Amazon Product Fees somente quando necessario;
- sanitizar payload;
- gravar `marketplace_fee_quotes`;
- atualizar `produtos_precificacao` somente se `manual_override = false` e `atualizar_precificacao = true`;
- marcar `aplicado_em_precificacao`.

Manual override:

```txt
manual_override nao bloqueia consulta API manual, mas impede atualizacao automatica de produtos_precificacao.
```

Seguranca:

- secrets somente em Supabase Edge Function Secrets;
- frontend nunca recebe token Amazon;
- `payload_bruto` deve ser sanitizado;
- nunca salvar Authorization, access token, refresh token, client secret, AWS keys, LWA secret, service role ou connection string.

Limitacoes intencionais:

- nao criar botao `Consultar taxa`;
- nao implementar Edge Function ainda;
- nao chamar Amazon;
- nao alterar `produtos_precificacao` automaticamente;
- sem lote, sem fila e sem retry agressivo.

Proxima etapa recomendada:

```txt
5.5B - Planejamento dos secrets e variaveis da Edge Function Amazon, ainda sem implementar codigo.
```

---

## 17. Fase 5.5B - Planejamento dos secrets da Edge Function Amazon

Em 2026-06-05, foi documentado o planejamento dos secrets e variaveis da futura Edge Function:

```txt
amazon-fees-quote
```

Regra principal:

```txt
Documentar apenas nomes de variaveis. Nunca registrar valores reais de secrets em arquivos, chat, logs, banco ou payload bruto.
```

Secrets Amazon SP-API planejados:

- `AMAZON_LWA_CLIENT_ID`;
- `AMAZON_LWA_CLIENT_SECRET`;
- `AMAZON_LWA_REFRESH_TOKEN`;
- `AMAZON_AWS_ACCESS_KEY_ID`;
- `AMAZON_AWS_SECRET_ACCESS_KEY`;
- `AMAZON_AWS_ROLE_ARN`;
- `AMAZON_AWS_REGION`;
- `AMAZON_SPAPI_ENDPOINT`;
- `AMAZON_DEFAULT_MARKETPLACE_ID`.

Local correto:

- Supabase Edge Function Secrets;
- nunca no frontend;
- nunca no banco;
- nunca em `payload_bruto`;
- nunca em `.env.local` lido pelo agente.

Secrets Supabase planejados:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY` somente dentro da Edge Function, se necessario.

Decisao preservada:

```txt
service_role nunca deve ser usado no frontend. Se for usado, deve ficar restrito ao runtime da Edge Function e com validacao/autorizacao antes de qualquer escrita.
```

Variaveis publicas x privadas:

- frontend pode usar apenas variaveis publicas como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`;
- secrets Amazon e service role ficam somente em Edge Function Secrets;
- tokens, refresh tokens, client secrets, AWS keys, Authorization headers e connection strings nunca devem ser salvos em banco.

Seguranca obrigatoria:

- nunca logar secrets;
- nunca retornar tokens ao frontend;
- nunca salvar Authorization header;
- sanitizar `payload_bruto`;
- separar erro tecnico interno de erro exibido ao usuario;
- nao misturar credenciais dev/prod.

Riscos:

- vazamento de refresh token ou client secret;
- uso indevido de service role;
- mistura de credenciais dev/prod;
- payload bruto com dados sensiveis;
- fallback global de `marketplace_id` mascarar mapeamento incompleto.

Checklist antes da implementacao:

- confirmar projeto Supabase correto;
- confirmar ambiente;
- definir autenticacao da Edge Function;
- decidir uso de service role;
- confirmar nomes finais dos secrets;
- definir sanitizador;
- definir politica de logs;
- validar um `mapeamento_id` Amazon de teste.

Proxima etapa recomendada:

```txt
5.5C - Planejamento da autenticacao/autorizacao da Edge Function amazon-fees-quote.
```
