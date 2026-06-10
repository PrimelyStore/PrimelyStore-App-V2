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

---

## 18. Fase 5.5C - Autenticacao e autorizacao da Edge Function Amazon

Em 2026-06-05, foi documentado o planejamento de autenticacao/autorizacao da futura Edge Function:

```txt
amazon-fees-quote
```

Modelo de autenticacao:

- exigir JWT de usuario autenticado;
- validar `Authorization: Bearer`;
- rejeitar chamadas anonimas;
- nao usar token fixo no frontend.

Modelo de autorizacao:

- consultar taxa exige acesso financeiro;
- aplicar em `produtos_precificacao` exige escrita financeira/admin;
- admin pode executar consulta e aplicacao;
- consultar taxa e aplicar taxa sao permissoes separadas.

Uso de service role:

- somente dentro da Edge Function;
- somente apos validar JWT e autorizacao;
- nunca no frontend;
- nunca em logs;
- nunca em `payload_bruto`;
- nunca em resposta ao usuario.

Permissoes por acao:

- `atualizar_precificacao = false`: acesso financeiro;
- `atualizar_precificacao = true`: escrita financeira/admin;
- `manual_override = true`: grava quote, mas nao aplica em `produtos_precificacao`;
- usuario sem permissao: rejeitar antes de consultar Amazon;
- usuario anonimo: rejeitar antes de qualquer operacao.

Fluxo seguro:

- receber request;
- validar metodo HTTP;
- validar `Authorization: Bearer`;
- obter usuario autenticado;
- validar permissao financeira;
- validar permissao de escrita se `atualizar_precificacao = true`;
- carregar mapeamento;
- validar status ativo;
- validar `marketplace = amazon`;
- validar campos Amazon;
- consultar cache;
- chamar Amazon somente se necessario;
- gravar `marketplace_fee_quotes`;
- atualizar `produtos_precificacao` somente se autorizado e `manual_override = false`;
- retornar resposta sanitizada.

Erros controlados:

- sem token;
- token invalido/expirado;
- usuario sem permissao financeira;
- tentativa de aplicar sem escrita financeira;
- RLS/permissao negada;
- `manual_override` ativo;
- mapeamento invalido.

Logs permitidos:

- `request_id`;
- `user_id`;
- `mapeamento_id`;
- `marketplace`;
- `status`;
- `fee_quote_id`;
- `aplicado_em_precificacao`.

Logs proibidos:

- JWT;
- Authorization header;
- access token;
- refresh token;
- client secret;
- AWS keys;
- service role;
- payload bruto nao sanitizado.

Riscos:

- usar service role cedo demais;
- consulta anonima consumir rate limit;
- aplicar precificacao com permissao fraca;
- logs vazarem tokens;
- confundir consulta com aplicacao e quebrar `manual_override`.

Checklist antes da implementacao:

- confirmar funcoes de autorizacao no remoto;
- confirmar semantica de `usuario_pode_acessar_financeiro`;
- confirmar semantica de `usuario_pode_escrever_financeiro`;
- definir anon client para validar usuario e service client para escrita;
- definir codigos HTTP;
- definir formato de erro sanitizado;
- definir politica de logs;
- definir comportamento definitivo de `manual_override`.

Proxima etapa recomendada:

```txt
5.5D - Planejamento tecnico da implementacao da Edge Function amazon-fees-quote, ainda sem codigo.
```

---

## 19. Fase 5.5D - Planejamento tecnico da implementacao da Edge Function Amazon

Em 2026-06-05, foi documentado o planejamento tecnico da futura Edge Function:

```txt
amazon-fees-quote
```

Estrutura futura:

```txt
supabase/functions/amazon-fees-quote/index.ts
supabase/functions/amazon-fees-quote/README.md
supabase/functions/amazon-fees-quote/_helpers.ts
```

O arquivo `_helpers.ts` e opcional e deve ser criado apenas se a funcao crescer o suficiente para justificar separacao.

Blocos internos planejados:

- Handler HTTP;
- Auth;
- Authorization;
- Supabase clients;
- Mapeamento;
- Cache;
- Amazon Auth;
- Amazon Request;
- Parser;
- Sanitizacao;
- Persistencia;
- Logs.

Fluxo tecnico:

- validar metodo `POST`;
- validar `Authorization: Bearer`;
- validar JWT;
- obter `user_id`;
- validar acesso financeiro;
- validar body;
- validar escrita financeira/admin se `atualizar_precificacao = true`;
- criar service client somente apos auth/autorizacao;
- carregar mapeamento;
- validar status ativo;
- validar `marketplace = amazon`;
- validar `seller_sku`, `marketplace_id` e `is_amazon_fulfilled`;
- checar cache por `mapeamento_id + preco_consultado`;
- retornar `api_recente` se cache valido e `force_refresh = false`;
- obter Amazon access token via LWA;
- assinar request SP-API;
- chamar Product Fees;
- interpretar resposta;
- calcular taxas;
- sanitizar payload;
- gravar `marketplace_fee_quotes`;
- atualizar `produtos_precificacao` somente se permitido;
- retornar resposta sanitizada.

Helpers planejados:

- `jsonResponse`;
- `errorResponse`;
- `validarUuid`;
- `parseBooleanDefault`;
- `sanitizarPayloadAmazon`;
- `sanitizarErro`;
- `calcularCacheValido`;
- `buscarQuoteRecente`;
- `extrairTaxasAmazon`;
- `validarPermissaoFinanceira`;
- `validarPermissaoEscrita`;
- `obterAmazonAccessToken`;
- `assinarRequestSpApi`.

Dados lidos:

- `produto_canal_marketplace_mapeamento`;
- `marketplace_fee_quotes`;
- `produtos_precificacao`;
- `produtos`;
- `canais_venda`.

Dados escritos:

- `marketplace_fee_quotes`;
- `produtos_precificacao` somente quando `manual_override = false`, `atualizar_precificacao = true` e usuario autorizado.

Regras especiais:

- cache por `mapeamento_id + preco_consultado`;
- `force_refresh` ignora cache;
- `manual_override` nao bloqueia consulta, mas bloqueia aplicacao automatica;
- service role apenas apos JWT e autorizacao;
- `payload_bruto` sempre sanitizado.

Riscos:

- assinatura Amazon SP-API/SigV4;
- rate limit 429;
- parsing incorreto das taxas;
- uso antecipado de service role;
- payload bruto sensivel;
- `manual_override` mal aplicado;
- cache sem preco.

Checklist antes de implementar:

- secrets definidos no projeto correto;
- mapeamento Amazon de teste cadastrado;
- usuario com acesso financeiro validado;
- usuario com escrita financeira/admin validado;
- produto e preco de teste definidos;
- cache confirmado;
- `manual_override` confirmado;
- decisao sobre gravacao de erros;
- formato final de resposta aprovado;
- estrategia de assinatura SP-API confirmada.

Recomendacao:

```txt
Implementar primeiro o esqueleto seguro da funcao. Somente depois acoplar LWA/SigV4/Product Fees.
```

Proxima etapa recomendada:

```txt
5.5E - Planejamento do esqueleto seguro da Edge Function, ainda sem chamar Amazon.
```

---

## 20. Fase 5.5E-4 - Esqueleto seguro local da Edge Function Amazon

Em 2026-06-05, foi criado localmente o esqueleto seguro da futura Edge Function:

```txt
supabase/functions/amazon-fees-quote/index.ts
```

O que o esqueleto faz:

- aceita `POST`;
- responde `OPTIONS` para CORS;
- valida `Authorization: Bearer`;
- obtem usuario autenticado via JWT;
- rejeita token ausente/invalido;
- valida `mapeamento_id`;
- valida `preco_consultado > 0`;
- valida permissao financeira via `usuario_pode_acessar_financeiro`;
- carrega `produto_canal_marketplace_mapeamento`;
- valida status ativo;
- valida `marketplace = amazon`;
- valida `seller_sku`, `marketplace_id` e `is_amazon_fulfilled`;
- aceita `is_amazon_fulfilled = false` como valido;
- retorna resposta mock/controlada.

O que ainda nao faz:

- nao chama Amazon SP-API;
- nao implementa LWA;
- nao implementa assinatura SigV4;
- nao grava `marketplace_fee_quotes`;
- nao atualiza `produtos_precificacao`;
- nao usa service role;
- nao faz deploy.

Ajuste aplicado:

- body JSON invalido retorna erro controlado `400`.

Decisao preservada:

```txt
O esqueleto valida a porta de entrada e o contexto gerencial antes de qualquer integracao externa. A conversa real com Amazon fica para fase futura.
```

Proxima etapa recomendada:

```txt
5.5F - Planejamento da validacao local/deploy controlado da Edge Function mock, sem Amazon.
```

---

## 21. Fase 5.5F - Planejamento da validacao local/deploy controlado mock

Em 2026-06-05, foi documentado o plano de validacao da Edge Function `amazon-fees-quote` em modo mock, antes de qualquer integracao real com Amazon.

Validacao estatica planejada:

- confirmar imports;
- confirmar ausencia de SDK Amazon;
- confirmar ausencia de libs novas;
- confirmar ausencia de `fetch`;
- confirmar ausencia de endpoint Amazon;
- confirmar ausencia de LWA;
- confirmar ausencia de SigV4;
- confirmar ausencia de insert/update/upsert/delete;
- confirmar ausencia de uso operacional de `marketplace_fee_quotes`;
- confirmar ausencia de update em `produtos_precificacao`;
- confirmar ausencia de `SUPABASE_SERVICE_ROLE_KEY`;
- confirmar retorno mock claro.

Comandos seguros sugeridos, nao executados nesta fase:

```txt
deno check supabase/functions/amazon-fees-quote/index.ts
supabase functions serve amazon-fees-quote
curl local com JWT de teste nao exposto
```

Matriz de cenarios planejada:

- metodo diferente de POST;
- sem Authorization;
- token invalido;
- body JSON invalido;
- `mapeamento_id` ausente/invalido;
- `preco_consultado` ausente/invalido;
- usuario sem permissao;
- mapeamento inexistente;
- mapeamento inativo;
- marketplace diferente de Amazon;
- Amazon sem `seller_sku`;
- Amazon sem `marketplace_id`;
- `is_amazon_fulfilled` null;
- `is_amazon_fulfilled = false` valido;
- mapeamento Amazon valido retornando mock.

Plano de teste manual:

- inspecao estatica;
- `deno check`, se possivel;
- servir localmente;
- testar com JWT sem expor valor;
- conferir respostas;
- confirmar ausencia de escrita em banco;
- confirmar logs sem Authorization/JWT.

Deploy controlado futuro:

- somente apos validacao local;
- dev/staging primeiro;
- sem configurar Amazon secrets ainda;
- validar apenas autenticacao, autorizacao, body e mapeamento;
- confirmar `origem = mock`.

Riscos:

- `supabase functions serve` pode carregar variaveis locais;
- `deno check` pode resolver dependencias;
- `--no-verify-jwt` nao simula producao;
- JWT pode vazar se copiado para terminal/log/chat;
- RLS pode bloquear mapeamento;
- mock pode ser confundido com integracao real.

Checklist antes do primeiro deploy mock:

- projeto Supabase correto;
- branch/commit correto;
- funcao sem `fetch`;
- funcao sem LWA/SigV4;
- funcao sem escrita em banco;
- sem service role;
- `origem = mock`;
- usuario financeiro de teste;
- `mapeamento_id` Amazon de teste;
- logs sem Authorization/JWT;
- dev/staging primeiro.

Proxima etapa recomendada:

```txt
5.5G - Validacao estatica local da Edge Function mock.
```

---

## 22. Fase 5.5H-2 - Validacao Deno/TypeScript da Edge Function mock

Em 2026-06-08, foi documentada a validacao Deno/TypeScript da Edge Function mock:

```txt
supabase/functions/amazon-fees-quote/index.ts
```

Problema corrigido:

- erro TS2322 envolvendo `ReturnType<typeof createClient>`;
- a inferencia dos generics do `createClient` gerava incompatibilidade de tipo no `AuthContext`;
- a correcao usou import de tipo `SupabaseClient` e alias local `AppSupabaseClient`.

Trecho conceitual da correcao:

```txt
type AppSupabaseClient = SupabaseClient<any, 'public', any>
```

Resultado:

```txt
deno check supabase/functions/amazon-fees-quote/index.ts
```

Status:

```txt
Passou no ambiente do usuario.
```

Garantias mantidas:

- sem chamada Amazon;
- sem LWA;
- sem SigV4;
- sem `fetch`;
- sem escrita em `marketplace_fee_quotes`;
- sem atualizacao em `produtos_precificacao`;
- sem service role funcional;
- sem deploy.

Proxima etapa recomendada:

```txt
5.5I - Planejamento do teste local com supabase functions serve, ainda sem Amazon.
```

---

## 23. Fase 5.5I - Planejamento do teste local com Supabase Functions Serve

Em 2026-06-08, foi documentado o planejamento do teste local da Edge Function mock:

```txt
amazon-fees-quote
```

Objetivo:

- testar localmente a funcao em modo mock;
- nao chamar Amazon;
- nao fazer deploy;
- nao gravar no banco;
- nao expor JWT, tokens ou secrets.

Pre-requisitos:

- Supabase CLI disponivel;
- Deno disponivel;
- projeto Supabase corretamente linkado;
- ambiente local seguro;
- JWT de teste valido sem expor valor;
- usuario de teste com e sem permissao financeira, se possivel;
- `mapeamento_id` Amazon de teste cadastrado;
- funcao ainda em modo mock, sem `fetch`, LWA, SigV4, service role e escrita no banco.

Comando futuro planejado:

```txt
supabase functions serve amazon-fees-quote
```

Cuidados:

- nao usar `--no-verify-jwt` para validar fluxo real de autenticacao;
- `--no-verify-jwt` somente para teste isolado de CORS/metodo;
- nao colar JWT no chat;
- nao commitar JWT;
- nao imprimir headers completos;
- nao ler nem expor `.env.local`;
- nao usar Amazon secrets;
- nao configurar secrets Amazon nesta etapa;
- nao rodar deploy;
- nao registrar Authorization/JWT em logs.

Cenarios planejados:

- `OPTIONS`;
- `GET` retornando 405;
- POST sem Authorization retornando 401;
- POST com token invalido retornando 401;
- JSON invalido retornando 400;
- `mapeamento_id` invalido retornando 400;
- `preco_consultado` invalido retornando 400;
- usuario sem permissao retornando 403;
- mapeamento inexistente retornando 404;
- mapeamento inativo retornando erro controlado;
- marketplace diferente de Amazon retornando erro controlado;
- Amazon sem `seller_sku` retornando erro controlado;
- Amazon sem `marketplace_id` retornando erro controlado;
- `is_amazon_fulfilled` null retornando erro controlado;
- `is_amazon_fulfilled = false` valido;
- Amazon valido retornando 200 com `status = mock`, `origem = mock` e `aplicado_em_precificacao = false`.

Riscos:

- `supabase functions serve` pode carregar variaveis locais;
- JWT pode vazar se copiado para chat/logs;
- `--no-verify-jwt` pode dar falsa sensacao de validacao real;
- RLS pode bloquear leitura do mapeamento;
- usuario sem permissao pode falhar corretamente e parecer erro funcional;
- mock pode ser confundido com cotacao real;
- ambiente linkado errado pode levar a testes contra projeto indevido.

Checklist antes de rodar:

- confirmar projeto Supabase correto;
- confirmar ambiente local seguro;
- confirmar Deno disponivel;
- confirmar Supabase CLI disponivel;
- confirmar que nao havera deploy;
- confirmar que nao serao usados Amazon secrets;
- confirmar JWT de teste sem expor valor;
- confirmar `mapeamento_id` Amazon de teste;
- confirmar usuario com acesso financeiro;
- confirmar logs sem Authorization/JWT;
- confirmar funcao sem `fetch` e sem escrita no banco.

Proxima etapa recomendada:

```txt
5.5J - Executar teste local controlado com supabase functions serve, somente apos autorizacao.
```

---

## 24. Fase 5.5J-4A & 5.5J-5 - Teste local autenticado e estrategia de baseline

Em 2026-06-09, foi executado o teste autenticado local da Edge Function `amazon-fees-quote` em modo mock e documentada a recomendacao tecnica de baseline.

### 24.1. Cenarios testados e resultados

- **CORS e metodo**:
  - `OPTIONS` respondeu `HTTP 200`.
  - `GET` respondeu `HTTP 405` (metodo nao permitido).
- **Validacao de Token (Sem JWT e Token Invalido)**:
  - Chamada sem header `Authorization` retornou `HTTP 401`.
  - Chamada com JWT expirado/invalido retornou `HTTP 401`.
- **Validacao de Usuario e Perfil Ficticio**:
  - Usuario `teste-financeiro-local@primely.local` criado localmente.
  - Perfil cadastrado em `public.usuarios_perfis` com papel `financeiro` e status `ativo` diretamente por SQL no container Docker.
  - Login obteve o JWT com sucesso em memoria.
  - `/auth/v1/user` respondeu com `HTTP 200`.
- **Execucao com Deno Edge Runtime**:
  - O Deno Edge Runtime local apresentou um erro de validacao de assinatura (`TypeError: Key for the ES256 algorithm must be of type CryptoKey. Received an instance of Uint8Array`) no gateway Kong porque tentava validar chaves ES256 com logica de HMAC.
  - O contorno foi iniciar o servidor local com a flag `--no-verify-jwt` no gateway, permitindo que a Edge Function fizesse a validacao manual chamando a API de Auth (GoTrue), que resolveu o token perfeitamente.
- **Resposta da Edge Function**:
  - Chamada autenticada com UUID de teste valido `d3b07384-d113-4956-a5cc-48419eb42597` retornou `HTTP 404` com erro controlado:
    ```json
    {
      "success": false,
      "status": "erro",
      "origem": "mock",
      "erro": "Mapeamento marketplace nao encontrado."
    }
    ```
  - Teste com nil UUID `00000000-0000-0000-0000-000000000000` retornou `HTTP 400` com erro de validacao de formato.

### 24.2. Seguranca e governanca

- Nenhuma credencial real de producao foi lida ou salva em arquivos do repositorio.
- Nenhuma chamada real foi feita a servicos da Amazon, Keepa, LWA ou AWS SigV4.
- Nenhuma gravacao/escrita operacional foi feita em banco.
- O Git status permaneceu inalterado (nenhuma mudanca no repositorio de producao).
- A baseline local `supabase/migrations/20260515000000_baseline_schema_legado_minimo.sql` continuou isolada e untracked.

### 24.3. Recomendacao sobre a Baseline Local

Recomenda-se adotar a **Opcao B (Mover para docs/baseline ou similar)** e documentar seu uso local. Isso evita sujar o fluxo oficial do `supabase/migrations/` (impedindo tentativas de `supabase db push` ou `migration repair` desnecessarios no remoto de producao), enquanto ainda disponibiliza o arquivo para outros desenvolvedores ou agentes locais.

---

## 25. Fase 5.5J-6 - Mover baseline local para docs/baseline com seguranca

Em 2026-06-09, foi implementada a estrategia de baseline local atraves da Opcao B (Desvinculacao do diretorio de migrations principais).

### 25.1. Acoes concluidas

- **Estruturacao de Pastas**: Criado o diretorio `docs/baseline/`.
- **Relocacao do Arquivo**: O arquivo `20260515000000_baseline_schema_legado_minimo.sql` foi transferido de `supabase/migrations/` para `docs/baseline/20260515000000_baseline_schema_legado_minimo.sql`.
- **Remocao de Risco**: O diretorio `supabase/migrations/` foi limpo da baseline, garantindo que o Supabase CLI nao execute `supabase db push` acidental com este arquivo para o ambiente de producao.
- **Documentacao de Instrucoes**: Criado o arquivo `docs/baseline/README.md` detalhando a finalidade de reprodutibilidade local, os passos para copia temporaria e remocao pos-start, o papel do Olist/Tiny como ERP operacional e do Primely Store como painel gerencial inteligente.

---

## 26. Fase 5.5J-7 & 5.5J-8 - Teste mock de sucesso HTTP 200 da amazon-fees-quote

Em 2026-06-09, foi validado o fluxo de sucesso (HTTP 200) com dados ficticios locais de teste e documentados os resultados do esqueleto mock da Edge Function `amazon-fees-quote`.

### 26.1. Detalhes tecnicos e resultados

- **Mock de Sucesso**:
  - Usuario ficticio `teste-financeiro-local@primely.local` criado e autenticado localmente (retornando `AUTH HTTP 200`).
  - Criado o perfil de usuario com papel `financeiro` e status `ativo`.
  - Criadas entidades ficticias no banco de dados local Docker de forma controlada: produto `TESTE-AMZ-FEES-LOCAL`, canal `Amazon FBA Teste Local` e mapeamento ativo correspondente na tabela `public.produto_canal_marketplace_mapeamento` com os parametros estritos da Amazon (`seller_sku`, `asin`, `marketplace_id`, `is_amazon_fulfilled = true`).
  - Executada a chamada contra `/functions/v1/amazon-fees-quote` com o `mapeamento_id` real recem-gerado, retornando `FUNCAO HTTP 200` e a resposta estruturada do mock:
    ```json
    {
      "success": true,
      "status": "mock",
      "origem": "mock",
      "marketplace": "amazon",
      "mapeamento_id": "c826c03d-57a7-4eab-a833-7eac07eae29d",
      "aplicado_em_precificacao": false,
      "mensagem": "Esqueleto validado. Integracao Amazon Product Fees ainda nao ativada."
    }
    ```
  - Todos os dados foram totalmente limpos pos-teste por identificadores especificos, mantendo o banco de dados local integro e higienizado.

### 26.2. Governanca e seguranca

- Nenhuma credencial, JWT ou senha real de producao foi gravada em arquivos ou logs.
- Nao houve chamadas reais a servicos da Amazon, Keepa, LWA ou assinaturas de cabecalho SigV4.
- Nenhuma gravacao/atualizacao foi feita em tabelas de producao real (`marketplace_fee_quotes`, `produtos_precificacao`).
- O Git status permaneceu inalterado de arquivos ou diretorios novos na estrutura principal do projeto.

---

## 27. Fase 5.5K-1 - Planejamento da transicao do mock para Amazon Product Fees real

Em 2026-06-09, foi concluido o planejamento da evolucao da Edge Function `amazon-fees-quote` do modo mock para a integracao real com a Amazon Product Fees API.

### 27.1. Arquitetura futura da integracao

- **Secrets da Amazon**:
  - `AMAZON_LWA_CLIENT_ID` / `AMAZON_LWA_CLIENT_SECRET`: credenciais do app LWA.
  - `AMAZON_LWA_REFRESH_TOKEN`: refresh token de longa duracao para gerar tokens de acesso por hora.
  - `AMAZON_AWS_ACCESS_KEY_ID` / `AMAZON_AWS_SECRET_ACCESS_KEY` / `AMAZON_AWS_ROLE_ARN`: credenciais IAM necessarias caso a assinatura SigV4 de chamadas a SP-API seja exigida pelo tipo de app.
  - `AMAZON_SPAPI_ENDPOINT` / `AMAZON_SPAPI_REGION`: endpoints regionais (Brasil: `us-east-1` e `https://sellingpartnerapi-na.amazon.com`).
- **Chamada e Payload real**:
  - POST para `https://api.amazon.com/auth/o2/token` obtera o access token temporario.
  - POST para `https://sellingpartnerapi-na.amazon.com/products/fees/v0/items/{Asin}/feesEstimate` com payload contendo `MarketplaceId` (`A2Q3Y263D00KWC`), preco de simulacao, moeda `BRL` e contexto logistico `IsAmazonFulfilled` (true para FBA, false para FBM/DBA).
- **Cache com `marketplace_fee_quotes`**:
  - Gravar os retornos de sucesso (status `sucesso`) e de falha de requisicao (status `erro` com mensagem sanitizada) no banco de dados local para fins de auditoria tecnica.
  - Consultar cache antes de bater na Amazon, economizando rate limit de API se a janela de `validade_cache_horas` (default 24h) estiver ativa e `force_refresh = false`.
- **Logica de Precificacao**:
  - Sob comando `atualizar_precificacao = true`, perfil financeiro de escrita/admin e se `manual_override = false` no mapeamento, persistir as taxas recalculadas na tabela `produtos_precificacao` (`taxa_marketplace` e `taxa_logistica`), marcando `aplicado_em_precificacao = true` na cotacao gravada.
- **Estrategia de Identificacao (ASIN x SellerSKU)**:
  - A Product Fees API possui operacoes por ASIN, por SellerSKU e tambem operacao em lote. Como o Primely Store armazena seller_sku e pode armazenar ASIN no mapeamento Amazon, a Fase 5.5K-2 devera definir a estrategia oficial: usar ASIN, usar SellerSKU ou aplicar fallback controlado entre ambos. Nenhuma decisao de implementacao real foi tomada nesta fase.


### 27.2. Microfases futuras de implementacao

- `5.5K-2`: Definir contrato técnico ASIN x SellerSKU x operação em lote para Amazon Product Fees.
- `5.5K-3`: revisar schema de `marketplace_fee_quotes` para suportar modo_consulta/identificador usado/cache.
- `5.5K-4`: preparar helpers puros para montar payload SellerSKU/ASIN sem chamar Amazon.
- `5.5K-5`: preparar contrato de erros e normalização da resposta da Amazon.
- `5.5K-6`: planejar LWA/SigV4 isolados.
- `5.5K-7`: teste real controlado somente após autorização explícita.

### 27.3. Seguranca e riscos mitigados

- **secrets**: Restritos exclusivamente a Edge Function Secrets do Supabase local/remoto; nunca expostos ou passados ao frontend.
- **rate limiting**: Cache automatico de 24h impede o esgotamento de cota ou retornos HTTP 429 da API da Amazon.
- **sobrescrita manual**: A verificacao da flag `manual_override` no mapeamento garante a integridade e impede a alteracao indevida de precificacoes manuais decididas pelo gestor.

---

## 28. Fase 5.5K-2 - Definir contrato técnico ASIN x SellerSKU x operação em lote para Amazon Product Fees

Em 2026-06-09, foi definido o contrato técnico oficial de tomada de decisão para a futura integração real com a Amazon Product Fees API. O trabalho foi puramente analítico e de documentação, sem alterações de código ou chamadas a APIs reais da Amazon/AWS.

### 28.1. Estratégia de Consulta e Fallback Recomendada

1. **Priorização por SellerSKU**: O Primely Store priorizará a rota `/listings/{SellerSKU}/feesEstimate` quando o campo `seller_sku` estiver preenchido no mapeamento Amazon. Isso assegura que as taxas calculadas correspondam à listagem real sob controle do vendedor.
2. **Fallback por ASIN**: Se a consulta por SKU retornar um erro indicando que a listagem não foi encontrada ("Listing not found") ou se o `seller_sku` estiver ausente no mapeamento, e o `asin` estiver cadastrado, a Edge Function fará o fallback automático para a rota `/items/{Asin}/feesEstimate`.
3. **Lote (Batch)**: A operação em lote (`getMyFeesEstimates` limitada a 20 itens por chamada) será reservada estritamente para rotinas noturnas assíncronas ou atualizações de cache massivas no background, visando poupar cota de requisições, e não será empregada na chamada síncrona unitária da Edge Function.

### 28.2. Contrato de Decisão (`modo_consulta`)

* **`modo_consulta = "auto"` (Padrão)**: Tenta `SellerSKU` se preenchido. Em caso de falha de SKU não encontrado (Listing not found) e se `asin` estiver preenchido, recorre ao `ASIN`. Se ambos falharem ou não puderem ser acionados, gera erro controlado e grava cache de erro local.
* **`modo_consulta = "sku"`**: Consulta unicamente via `SellerSKU`. Retorna erro imediato se o SKU estiver ausente ou a chamada falhar.
* **`modo_consulta = "asin"`**: Consulta unicamente via `ASIN`. Retorna erro imediato se o ASIN estiver ausente ou a chamada falhar.

### 28.3. Validações e Contrato de Cache

* **Validações Obrigatórias**:
  - `marketplace_id` obrigatório (ex: `A2Q3Y263D00KWC`).
  - `preco_consultado` obrigatório e maior que zero.
  - `moeda` padrão `BRL`.
  - `is_amazon_fulfilled` booleano obrigatório (para separar taxas FBA de FBM/DBA).
* **Parâmetros Lógicos do Cache**: A persistência em `marketplace_fee_quotes` considerará na chave lógica de cache o `mapeamento_id`, `preco_consultado`, `moeda`, `is_amazon_fulfilled`, `modo_consulta` e o `identificador_usado` (SKU ou ASIN).
* **Escrita de Precificação**: A alteração automática de `produtos_precificacao` só ocorrerá se `atualizar_precificacao = true`, usuário tiver perfil financeiro/admin, resposta real for válida e a flag `manual_override` do mapeamento for `false`.

### 28.4. Riscos e Proteções Mapeados

* **URL Encoding**: Obrigatoriedade de URL encoding para SKUs com caracteres especiais na URL.
* **Logs Sanitizados**: Preservação de segredos e chaves nos logs de erros.
* **Warnings**: Retorno estruturado de avisos quando a Edge Function acionar o fallback por ASIN, alertando para possíveis erros de cadastro de SKU na conta Amazon.
* **Controle de Force Refresh**: Limitação do trigger de recarregamento forçado para proteger contra estouro de quota.

### 28.5. Cronograma de Microfases Futuras

* **`5.5K-3`**: revisar schema de `marketplace_fee_quotes` para suportar modo_consulta/identificador usado/cache.
* **`5.5K-4`**: preparar helpers puros para montar payload SellerSKU/ASIN sem chamar Amazon.
* **`5.5K-5`**: preparar contrato de erros e normalização da resposta da Amazon.
* **`5.5K-6`**: planejar LWA/SigV4 isolados.
* **`5.5K-7`**: teste real controlado somente após autorização explícita.

### 28.6. Garantias de Governança

* Nenhuma credencial foi criada, gravada ou exposta.
* Nenhuma chamada real foi efetuada à Amazon SP-API, LWA ou AWS SigV4.
* A Edge Function `amazon-fees-quote` manteve seu esqueleto mock original intacto.

---

## 29. Fase 5.5K-3 - Revisar schema de marketplace_fee_quotes para suportar cache real da Amazon Product Fees

Em 2026-06-09, foi executada a auditoria física de schema da tabela `public.marketplace_fee_quotes` e suas dependências diretas (`public.produto_canal_marketplace_mapeamento` e `public.produtos_precificacao`) no banco de dados local.

### 29.1. Diagnóstico e Resultados da Auditoria

1. **Existência e Relações**:
   - A tabela `public.marketplace_fee_quotes` existe no banco (criada em `20260603000300_precificacao_e_cotacoes.sql` e estendida em `20260605000100_produto_canal_marketplace_mapeamento.sql`).
   - Possui chaves estrangeiras com `public.produtos(id)`, `public.canais_venda(id)` e `public.produto_canal_marketplace_mapeamento(id)`.
2. **Políticas de RLS**:
   - RLS ativo com políticas robustas que limitam SELECT e INSERT apenas para perfis autenticados com permissões financeiras (`usuario_pode_acessar_financeiro()` e `usuario_pode_escrever_financeiro()`), e DELETE restrito a administradores. Não há policy de UPDATE, mantendo a imutabilidade histórica do cache.
3. **Mapeamento de Lacunas (Gaps)**:
   - *Campos já presentes*: `mapeamento_id`, `marketplace`, `preco_consultado`, `origem`, `status`, `consultado_em` (com equivalentes lógicos para taxas de marketplace/logística e payload response bruto).
   - *Campos ausentes para cache robusto*: `modo_consulta`, `identificador_usado`, `seller_sku_usado`, `asin_usado`, `moeda`, `is_amazon_fulfilled`, `payload_request_sanitizado`, `erro_codigo`, `warnings`, `valido_ate`, `criado_por`.
   - *Riscos identificados*: Por funcionar como log imutável, a tabela acumulará registros de forma cronológica. A Edge Function deverá ler a cotação válida mais recente com `valido_ate > now()`. Eventuais concorrências de chamadas paralelas de cotação não devem ser resolvidas com índices dinâmicos parciais baseados em `now()`. Se necessário, controles específicos transacionais ou *advisory locks* devem ser avaliados no futuro.

### 29.2. Proposta Técnica de Migration (DDL Recomendado)

Desenhou-se uma proposta conceitual de DDL (sem implementação real) para evolução do cache:
* **Novas Colunas**: `modo_consulta` (com check para auto/sku/asin/batch), `identificador_usado` (sku/asin), `seller_sku_usado`, `asin_usado`, `moeda` (upper de 3 caracteres), `is_amazon_fulfilled` (booleano), `payload_request_sanitizado` (jsonb), `erro_codigo` (text), `warnings` (jsonb), `valido_ate` (timestamptz), `criado_por` (uuid).
* **Lookup do Cache**:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_fee_quotes_cache_lookup
      ON public.marketplace_fee_quotes (
          mapeamento_id,
          preco_consultado,
          moeda,
          is_amazon_fulfilled,
          modo_consulta,
          identificador_usado,
          status,
          valido_ate DESC
      );
  ```
  O cache é consultado pela cotação válida mais recente (`valido_ate > now()`), ordenada decrescentemente por data de expiração, mantendo a característica de histórico.

### 29.3. Garantias de Governança Cumpridas

* A auditoria foi puramente de metadados do PostgreSQL.
* Nenhuma migration física foi gerada.
* Nenhum SQL de escrita ou comando destrutivo (INSERT, UPDATE, DELETE, TRUNCATE, DROP) foi executado.
* Nenhuma credencial foi lida, salva ou exposta, e o Git status permanece focado exclusivamente nos registros de documentação técnica.




