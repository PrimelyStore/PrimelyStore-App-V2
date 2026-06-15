# ROADMAP - PRIMELY STORE V3

## Status

- [ ] Pendente
- [~] Em progresso
- [x] Concluido
- [!] Bloqueado
- [L] Legado / manter sem evoluir por enquanto

---

## Modulo 1 - Auditoria e Governanca

Status: [~] Em progresso  
Prioridade: Alta  
Objetivo: garantir que o projeto siga o conceito de painel gerencial e nao volte a virar ERP.

Etapas:

- [x] 1.1 Verificar `git status` - limpo, checkpoint feito
- [x] 1.2 Validar `.gitignore` - protege .env.local
- [~] 1.3 Validar `.env.local` e `.env.example` - divergencia de variavel corrigida com fallback
- [x] 1.4 Validar `AGENTS.md` - completo
- [x] 1.5 Validar Skills - 6 skills presentes e corretas
- [x] 1.6 Validar MCP em modo somente leitura - read_only=true
- [x] 1.7 Classificar modulos atuais - auditoria completa realizada
- [~] 1.8 Corrigir variavel VITE_SUPABASE_PUBLISHABLE_KEY -> VITE_SUPABASE_ANON_KEY - fallback aplicado
- [x] 1.9 Ocultar telas legado do menu (Compras, Fornecedores, Lotes, Movimentacoes)
- [x] 1.10 Reorganizar menu do AppLayout em secoes (Gerencial, Integracoes, Analises)
- [ ] 1.12 Verificar dashboardService nao depende de tabelas legadas - diagnostico feito, pendente acao

Criterio de conclusao:

- Antigravity configurado com regras, skills e documentacao.
- Nenhum segredo versionado.
- ROADMAP revisado.

---

## Modulo 2 - Saude das Integracoes

Status: [x] Concluido  
Prioridade: Alta  
Objetivo: mostrar se os dados do sistema estao confiaveis.

Etapas:

- [x] 2.1 Mapear Edge Functions existentes
- [x] 2.2 Mapear logs de sincronizacao
- [x] 2.3 Criar tela de status das integracoes
- [x] 2.4 Mostrar ultima sincronizacao
- [x] 2.5 Mostrar erros recentes
- [x] 2.6 Mostrar contagem de produtos/estoque/pedidos/notas

---

## Modulo 3 - Dashboard Gerencial

Status: [x] Concluido  
Prioridade: Alta
Objetivo: criar visao executiva baseada em snapshots, views e dados consolidados.

Etapas:

- [x] 3.1 Auditar fontes reais de dados;
- [x] 3.2 Definir cards principais;
- [x] 3.3 Definir filtros;
- [x] 3.4 Criar/ajustar services;
- [x] 3.5 Criar layout responsivo;
- [x] 3.6 Criar graficos principais;
- [x] 3.7 Validar numeros com consultas diretas.

---

## Modulo 4 - Estoque Consolidado

Status: [~] Em progresso  
Prioridade: Alta  
Objetivo: consolidar estoque por SKU de forma analitica e gerencial.

Etapas:

- [x] 4.1 Preparacao segura do `estoqueService.ts` com tipos e consolidacao reativa V4
- [x] 4.2 Reestruturacao da tela `Estoque.tsx` (3 abas, KPIs, divergencias e alertas gerenciais)
- [ ] 4.3 Mercado Livre Full, quando as integracoes e snapshots estiverem disponiveis

---

## Modulo 5 - Custos e Margem Estimada

Status: [~] Em progresso  
Prioridade: Alta  
Objetivo: gerenciar e simular custos e comissoes por canal, estimando lucro e margem gerencial.

Etapas:

- [x] 5.1 Preparacao segura do `precificacaoService.ts` em modo leitura e simulacao
- [x] 5.2 Desenvolvimento da pagina `CustosMargem.tsx` (3 abas, simulador e parametros de custos)
- [x] 5.3A Registro de rota oficial e inclusao do link "Custos & Margens" no menu lateral
- [x] 5.3B-2 Auditoria e replanejamento de Custos por Canal
- [x] 5.3C-1 Migration de Schema 1 (Matrizes e Cubagem)
- [x] 5.3C-2 Planejamento da Carga Inicial de Dados/Seed
- [ ] 5.3C-3 Criacao da Migration de Seed SQL
- [ ] 5.3C-4 Migration de Schema 2 (Precificacao e Cotacoes)
- [ ] 5.3D Edge Functions de Tarifas
- [ ] 5.3E Visualizacao e Gravacao de Custos por Canal com Overrides
- [x] 5.4F Tela de Mapeamento Marketplace em Custos & Margens
- [x] 5.5A Planejamento da primeira Edge Function Amazon Product Fees em modo unitario/controlado
- [x] 5.5B Planejamento dos secrets e variaveis da Edge Function Amazon
- [x] 5.5C Planejamento da autenticacao/autorizacao da Edge Function `amazon-fees-quote`
- [x] 5.5D Planejamento tecnico da implementacao da Edge Function `amazon-fees-quote`
- [x] 5.5E Esqueleto seguro local da Edge Function, ainda sem chamar Amazon
- [x] 5.5F Planejamento da validacao local/deploy controlado da Edge Function mock, sem Amazon
- [x] 5.5G Validacao estatica local da Edge Function mock
- [x] 5.5H Validacao Deno/TypeScript da Edge Function mock
- [x] 5.5I Planejamento do teste local com `supabase functions serve`, ainda sem Amazon
- [ ] 5.5J Executar teste local controlado com `supabase functions serve`, somente apos autorizacao

---

## Modulo 6 - Vendas Analiticas

Status: [ ] Pendente  
Prioridade: Media  
Objetivo: analisar vendas por periodo, produto, canal e logistica.

Etapas:

- [ ] 6.1 Mapear snapshots de pedidos
- [ ] 6.2 Definir receita bruta/liquida
- [ ] 6.3 Criar filtros
- [ ] 6.4 Criar tabela analitica
- [ ] 6.5 Criar comparativos

---

## Modulo 7 - Curva ABC Inteligente

Status: [ ] Pendente  
Prioridade: Alta  
Objetivo: implementar analise estrategica de produtos.

Etapas:

- [ ] 7.1 Auditar dados disponiveis
- [ ] 7.2 Criar view/RPC de base
- [ ] 7.3 ABC por faturamento
- [ ] 7.4 ABC por lucro
- [ ] 7.5 ABC por volume
- [ ] 7.6 Matriz estrategica
- [ ] 7.7 Alertas
- [ ] 7.8 Recomendacoes de acao
- [ ] 7.9 Tela responsiva
- [ ] 7.10 Exportacao

---

## Modulo 8 - Conciliacoes

Status: [ ] Pendente  
Prioridade: Media  
Objetivo: encontrar divergencias entre sistemas.

Etapas:

- [ ] 8.1 Olist x Amazon FBA
- [ ] 8.2 Olist x Mercado Livre Full
- [ ] 8.3 Produtos sem vinculo
- [ ] 8.4 Estoque divergente
- [ ] 8.5 Alertas

---

## Modulo 9 - Keepa e Mineracao

Status: [ ] Pendente  
Prioridade: Media  
Objetivo: trazer inteligencia de mercado.

Etapas:

- [ ] 9.1 Definir ASINs elegiveis
- [ ] 9.2 Definir snapshots Keepa
- [ ] 9.3 Controlar tokens/rate limit
- [ ] 9.4 Criar alertas de oportunidade
- [ ] 9.5 Criar tela de mineracao

---

## Modulo 10 - n8n + Telegram

Status: [ ] Pendente  
Prioridade: Media  
Objetivo: alertas e consultas gerenciais.

Etapas:

- [ ] 10.1 Relatorio diario
- [ ] 10.2 Relatorio semanal
- [ ] 10.3 Alertas de ruptura
- [ ] 10.4 Alertas de margem
- [ ] 10.5 Perguntas via Telegram

---

## Modulo 11 - Legado

Status: [ ] Pendente  
Prioridade: Baixa  
Objetivo: decidir o que manter, adaptar, ocultar ou remover.

Etapas:

- [ ] 11.1 Auditar modulos antigos
- [ ] 11.2 Marcar telas como legado quando necessario
- [ ] 11.3 Ocultar rotas que confundem o usuario
- [ ] 11.4 Remover somente com confirmacao

---

## Registro 2026-06-03 - Fase 5.3C-7

Status: [x] Concluido

Objetivo: registrar a conclusao da aplicacao das migrations de custos por canal e a normalizacao local do historico de migrations.

Migrations aplicadas com sucesso:

- `20260603000100_custos_por_canal_matrizes_cubagem.sql`
- `20260603000200_seed_minimo_comissoes_marketplaces.sql`
- `20260603000300_precificacao_e_cotacoes.sql`

Validacoes confirmadas:

- tabelas novas existem no remoto;
- colunas novas em `produtos_precificacao` existem;
- seed minimo de comissoes foi inserido;
- historico remoto de migrations foi normalizado;
- duplicidade local `20260516` foi resolvida por baseline consolidado.

Arquivos de baseline local:

- `supabase/migrations/20260516_etapa133_baseline_fifo_e_pedidos_olist.sql`
- `docs/baseline/migrations_duplicadas_20260516/README.md`

Governanca:

- a etapa mantem o Primely Store como painel gerencial inteligente;
- as estruturas novas apoiam analise, simulacao e gestao de custos por canal;
- nao houve alteracao de frontend, Edge Functions ou regras de negocio nesta fase de documentacao.

---

## Registro 2026-06-05 - Fase 5.4A

Status: [x] Planejamento documentado

Objetivo: documentar o contrato tecnico das futuras Edge Functions de consulta de taxas por API, sem implementar codigo e sem alterar banco.

Documento criado:

- `docs/09_CONTRATO_TAXAS_MARKETPLACE_API.md`

Escopo documentado:

- futura Edge Function `amazon-fees-quote`;
- futura Edge Function `mercadolivre-fees-quote`;
- mapeamento para `marketplace_fee_quotes`;
- mapeamento para `produtos_precificacao`;
- precedencia de fallbacks `manual_override > api_recente > matriz_local > seed_minimo > alerta_sem_taxa`;
- regras de seguranca e sanitizacao de `payload_bruto`;
- campos possivelmente faltantes no schema atual.

Proxima etapa recomendada:

- 5.4B - Auditoria local do schema atual para verificar campos faltantes.

---

## Registro 2026-06-05 - Fase 5.4B

Status: [x] Auditoria local documentada

Objetivo: registrar a auditoria local do schema atual para a futura integracao de taxas por API.

Resultado:

- campos cobertos: `produtos.sku`, `produtos.asin`, `canais_venda.modalidade_logistica`, `canais_venda.codigo_externo`, `canais_venda.marketplace_id`, `configuracoes_operacao.moeda_padrao`, `marketplace_fee_quotes`, `produtos_precificacao`, `produtos_dimensoes_gerenciais` e snapshot Amazon com `marketplace_id`, `seller_sku`, `asin`, `fn_sku`;
- campos parcialmente cobertos: `seller_sku`, `asin`, `marketplace_id` Amazon, moeda padrao, origem da taxa e `fee_quote_id`;
- campos ausentes: `item_id` Mercado Livre, `category_id`, `listing_type_id`, `logistic_type`, `shipping_mode`, `free_shipping`, `manual_override`, validade/cache da cotacao API e tabela clara de mapeamento produto-canal-marketplace.

Recomendacao:

- Amazon pode seguir para planejamento de piloto unitario/controlado;
- Mercado Livre e automacao completa devem aguardar planejamento de mapeamento produto-canal-marketplace;
- nao implementar Edge Functions antes de resolver override, cache e mapeamento.

Proxima etapa recomendada:

- 5.4C - Planejamento da tabela/migration de mapeamento produto-canal-marketplace, ainda sem aplicar nada.

---

## Registro 2026-06-05 - Fase 5.4C

Status: [x] Planejamento documentado

Objetivo: documentar a futura tabela de mapeamento produto-canal-marketplace para suportar cotacoes de taxas por API.

Nome recomendado:

- `produto_canal_marketplace_mapeamento`

Conteudo planejado:

- mapeamento entre produto interno, canal de venda, marketplace, SKU/anuncio e contexto logistico;
- campos Amazon: `seller_sku`, `asin`, `marketplace_id`, `is_amazon_fulfilled`;
- campos Mercado Livre: `item_id`, `category_id`, `listing_type_id`, `logistic_type`, `shipping_mode`, `free_shipping`;
- `manual_override` para bloquear sobrescrita automatica por API;
- `validade_cache_horas` para definir objetivamente `api_recente`;
- RLS com leitura authenticated, escrita financeira e delete admin.

Recomendacao:

- criar migration futura antes de Edge Functions automaticas;
- considerar `mapeamento_id` em `marketplace_fee_quotes`;
- nao implementar integracao automatica de Mercado Livre sem essa tabela.

---

## Registro 2026-06-05 - Fase 5.4D

Status: [x] Decisoes finais documentadas

Objetivo: fechar decisoes de negocio e arquitetura antes da futura migration de mapeamento produto-canal-marketplace.

Decisoes:

- permitir multiplos mapeamentos ativos para o mesmo produto/canal, diferenciados por contexto;
- Amazon diferencia por `seller_sku`, `marketplace_id` e `is_amazon_fulfilled`;
- Mercado Livre diferencia por `item_id`, `listing_type_id`, `logistic_type`, `shipping_mode` e `free_shipping`;
- `validade_cache_horas` padrao = `24`;
- `manual_override` bloqueia atualizacao automatica em `produtos_precificacao`, mas permite consulta API manual;
- cotacoes consultadas devem ser gravadas em `marketplace_fee_quotes`;
- futura migration deve adicionar `mapeamento_id` nullable e `aplicado_em_precificacao` boolean em `marketplace_fee_quotes`;
- `moeda` fica gravada no mapeamento, herdando `configuracoes_operacao.moeda_padrao` com fallback `BRL`;
- exclusao normal via `status = 'inativo'`; delete fisico somente admin.

Proxima etapa recomendada:

- 5.4E - Planejamento tecnico da migration `produto_canal_marketplace_mapeamento`, ainda sem aplicar nada.

---

## Registro 2026-06-05 - Fase 5.4E-2

Status: [x] Migration aplicada e documentada

Migration aplicada:

- `20260605000100_produto_canal_marketplace_mapeamento.sql`

Objetos confirmados:

- tabela `produto_canal_marketplace_mapeamento` existe;
- colunas da tabela existem;
- `marketplace_fee_quotes` recebeu `mapeamento_id`;
- `marketplace_fee_quotes` recebeu `aplicado_em_precificacao`;
- indices criados;
- policies RLS criadas.

Observacao:

- notices de `DROP TRIGGER IF EXISTS` foram esperados e nao representam erro.

Status:

- schema preparado para futuras Edge Functions;
- Edge Functions ainda nao devem ser implementadas nesta etapa.

Proximas etapas recomendadas:

- 5.4F - Planejamento do service/frontend de leitura do mapeamento; ou
- 5.5A - Planejamento da primeira Edge Function Amazon em modo unitario.

---

## Registro 2026-06-05 - Fase 5.4F-6

Status: [x] Tela criada, validada e documentada

Objetivo: registrar a conclusao da tela gerencial de Mapeamento Marketplace dentro de `Custos & Margens`.

Service criado:

- `src/services/produtoCanalMarketplaceService.ts`

Pagina alterada:

- `src/pages/CustosMargem.tsx`

Funcionalidades concluidas:

- aba `Mapeamento Marketplace`;
- listagem com filtros por marketplace, status e busca textual;
- criacao de mapeamento;
- edicao de mapeamento;
- inativacao logica via `status = inativo`;
- campos condicionais para Amazon;
- campos condicionais para Mercado Livre;
- validacoes basicas de produto, canal, marketplace, moeda e cache;
- tratamento de loading, estado vazio e erro/RLS.

Limitacoes intencionais:

- ainda nao consulta Amazon SP-API;
- ainda nao consulta Mercado Livre;
- ainda nao chama Edge Function;
- ainda nao atualiza `produtos_precificacao`;
- acao de consultar taxa fica para fase futura.

Governanca:

- a tela e cadastro gerencial de contexto para cotacao;
- nao cria fluxo operacional de ERP;
- nao consulta APIs sensiveis diretamente no frontend;
- respeita RLS via Supabase client normal.

Proxima etapa recomendada:

- 5.5A - Planejamento da primeira Edge Function Amazon Product Fees em modo unitario/controlado.

---

## Registro 2026-06-05 - Fase 5.5A

Status: [x] Planejamento documentado

Objetivo: documentar a futura Edge Function `amazon-fees-quote` em modo unitario/controlado, sem implementar codigo, sem chamar Amazon e sem alterar banco.

Nome da futura Edge Function:

- `amazon-fees-quote`

Request esperado:

- `mapeamento_id`;
- `preco_consultado`;
- `atualizar_precificacao` boolean opcional, default `false`;
- `force_refresh` boolean opcional, default `false`.

Response esperado:

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

Fluxo planejado:

- validar metodo, autenticacao e payload;
- buscar mapeamento ativo em `produto_canal_marketplace_mapeamento`;
- exigir `marketplace = amazon`;
- validar `seller_sku`, `marketplace_id`, `is_amazon_fulfilled` e `preco_consultado > 0`;
- consultar cache por `mapeamento_id + preco_consultado` respeitando `validade_cache_horas`;
- retornar `api_recente` se cache valido e `force_refresh = false`;
- chamar Amazon Product Fees somente se cache vencido ou `force_refresh = true`;
- sanitizar payload antes de gravar;
- gravar `marketplace_fee_quotes`;
- atualizar `produtos_precificacao` somente se `manual_override = false` e `atualizar_precificacao = true`;
- marcar `aplicado_em_precificacao` como `true` ou `false`.

Limitacoes intencionais:

- ainda nao criar botao `Consultar taxa`;
- ainda nao implementar Edge Function;
- ainda nao chamar Amazon;
- ainda nao alterar `produtos_precificacao` automaticamente;
- sem lote, sem fila e sem retry agressivo no piloto.

Seguranca:

- secrets somente em Supabase Edge Function Secrets;
- frontend nunca recebe token Amazon;
- `payload_bruto` deve ser sanitizado;
- nunca salvar Authorization, access token, refresh token, client secret, AWS keys, LWA secret, service role ou connection string.

Proxima etapa recomendada:

- 5.5B - Planejamento dos secrets e variaveis da Edge Function Amazon, ainda sem implementar codigo.

---

## Registro 2026-06-05 - Fase 5.5B

Status: [x] Planejamento documentado

Objetivo: documentar os secrets e variaveis planejados para a futura Edge Function `amazon-fees-quote`, sem configurar valores reais e sem implementar codigo.

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

Onde devem ficar:

- Supabase Edge Function Secrets;
- nunca no frontend;
- nunca em `.env.local` lido pelo agente;
- nunca no banco;
- nunca em `payload_bruto`.

Secrets Supabase planejados:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY` somente dentro da Edge Function, se necessario;
- `service_role` nunca no frontend.

Seguranca obrigatoria:

- nunca logar secrets;
- nunca retornar tokens ao frontend;
- nunca salvar Authorization header;
- sanitizar `payload_bruto`;
- separar erro tecnico interno de erro exibido ao usuario;
- nao misturar credenciais dev/prod.

Riscos registrados:

- vazamento de refresh token ou client secret;
- uso indevido de service role;
- mistura dev/prod;
- payload bruto com dados sensiveis;
- fallback global de marketplace_id mascarar mapeamento incompleto.

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

- 5.5C - Planejamento da autenticacao/autorizacao da Edge Function `amazon-fees-quote`.

---

## Registro 2026-06-05 - Fase 5.5C

Status: [x] Planejamento documentado

Objetivo: documentar o modelo de autenticacao e autorizacao da futura Edge Function `amazon-fees-quote`, sem implementar codigo e sem configurar secrets.

Modelo de autenticacao:

- exigir JWT de usuario autenticado;
- validar `Authorization: Bearer`;
- rejeitar chamadas anonimas;
- nao usar token fixo no frontend.

Modelo de autorizacao:

- consultar taxa exige acesso financeiro;
- aplicar em `produtos_precificacao` exige escrita financeira/admin;
- admin pode executar ambas as acoes;
- separar explicitamente consultar taxa de aplicar taxa.

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

Logs:

- registrar `request_id`, `user_id`, `mapeamento_id`, `marketplace`, `status`, `fee_quote_id` e `aplicado_em_precificacao`;
- nunca registrar JWT, Authorization header, access token, refresh token, client secret, AWS keys, service role ou payload bruto nao sanitizado.

Proxima etapa recomendada:

- 5.5D - Planejamento tecnico da implementacao da Edge Function `amazon-fees-quote`, ainda sem codigo.

---

## Registro 2026-06-05 - Fase 5.5D

Status: [x] Planejamento documentado

Objetivo: documentar o blueprint tecnico da futura Edge Function `amazon-fees-quote`, sem criar arquivos, sem implementar codigo e sem chamar Amazon.

Estrutura futura:

- `supabase/functions/amazon-fees-quote/index.ts`;
- `supabase/functions/amazon-fees-quote/README.md`;
- `supabase/functions/amazon-fees-quote/_helpers.ts`, opcional se a funcao crescer.

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
- validar JWT e obter `user_id`;
- validar acesso financeiro;
- validar body;
- validar escrita financeira/admin se `atualizar_precificacao = true`;
- criar service client somente apos auth/autorizacao;
- carregar mapeamento;
- validar status ativo, `marketplace = amazon`, `seller_sku`, `marketplace_id` e `is_amazon_fulfilled`;
- checar cache por `mapeamento_id + preco_consultado`;
- retornar `api_recente` se cache valido e `force_refresh = false`;
- obter Amazon access token via LWA;
- assinar request SP-API;
- chamar Product Fees;
- interpretar resposta e calcular taxas;
- sanitizar payload;
- gravar `marketplace_fee_quotes`;
- atualizar `produtos_precificacao` somente se permitido;
- retornar resposta sanitizada.

Helpers planejados:

- `jsonResponse`;
- `errorResponse`;
- `validarUuid`;
- `parseBooleanDefault`;
- `sanitizarPayloadAmazonFees`;
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

Recomendacao final:

- implementar primeiro o esqueleto seguro da funcao;
- somente depois acoplar LWA/SigV4/Product Fees.

Proxima etapa recomendada:

- 5.5E - Planejamento do esqueleto seguro da Edge Function, ainda sem chamar Amazon.

---

## Registro 2026-06-05 - Fase 5.5E-4

Status: [x] Esqueleto local criado e documentado

Arquivo criado:

- `supabase/functions/amazon-fees-quote/index.ts`

O que o esqueleto faz:

- aceita `POST`;
- responde `OPTIONS` para CORS;
- valida `Authorization: Bearer`;
- obtem usuario autenticado via JWT;
- rejeita token ausente/invalido;
- valida `mapeamento_id`;
- valida `preco_consultado > 0`;
- valida permissao financeira;
- carrega `produto_canal_marketplace_mapeamento`;
- valida status ativo;
- valida `marketplace = amazon`;
- valida `seller_sku`, `marketplace_id` e `is_amazon_fulfilled`;
- aceita `is_amazon_fulfilled = false` como valido;
- retorna resposta mock/controlada.

O que ainda nao faz:

- nao chama Amazon;
- nao implementa LWA;
- nao implementa SigV4;
- nao grava `marketplace_fee_quotes`;
- nao atualiza `produtos_precificacao`;
- nao usa service role;
- nao faz deploy.

Ajuste aplicado:

- body JSON invalido retorna erro controlado `400`.

Proxima etapa recomendada:

- 5.5F - Planejamento da validacao local/deploy controlado da Edge Function mock, sem Amazon.

---

## Registro 2026-06-05 - Fase 5.5F

Status: [x] Planejamento documentado

Objetivo: documentar como validar a Edge Function `amazon-fees-quote` em modo mock antes de qualquer integracao real com Amazon.

Validacao estatica planejada:

- confirmar imports;
- confirmar ausencia de SDK Amazon e libs novas;
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

- `deno check supabase/functions/amazon-fees-quote/index.ts`;
- `supabase functions serve amazon-fees-quote`;
- `curl` local com JWT de teste nao exposto.

Matriz de cenarios:

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

Deploy controlado futuro:

- somente apos validacao local;
- dev/staging primeiro;
- sem configurar Amazon secrets ainda;
- validar apenas autenticacao, autorizacao, body e mapeamento;
- confirmar `origem = mock`;
- confirmar logs sem Authorization/JWT.

Proxima etapa recomendada:

- 5.5G - Validacao estatica local da Edge Function mock.

---

## Registro 2026-06-08 - Fase 5.5H-2

Status: [x] Validacao Deno/TypeScript documentada

Arquivo validado:

- `supabase/functions/amazon-fees-quote/index.ts`

Problema corrigido:

- erro TS2322 envolvendo `ReturnType<typeof createClient>`;
- correcao aplicada usando `SupabaseClient` e alias `AppSupabaseClient`.

Resultado:

- `deno check supabase/functions/amazon-fees-quote/index.ts` passou no ambiente do usuario.

Garantias mantidas:

- sem chamada Amazon;
- sem LWA;
- sem SigV4;
- sem `fetch`;
- sem escrita em `marketplace_fee_quotes`;
- sem atualizacao em `produtos_precificacao`;
- sem service role funcional.

Proxima etapa recomendada:

- 5.5I - Planejamento do teste local com `supabase functions serve`, ainda sem Amazon.

---

## Registro 2026-06-08 - Fase 5.5I

Status: [x] Planejamento documentado

Objetivo: documentar o teste local planejado da Edge Function mock `amazon-fees-quote` usando `supabase functions serve`, sem Amazon, sem deploy e sem gravacao no banco.

Pre-requisitos:

- Supabase CLI disponivel;
- Deno disponivel;
- projeto Supabase corretamente linkado;
- ambiente local seguro;
- JWT de teste valido sem expor valor;
- usuario de teste com e sem permissao financeira, se possivel;
- `mapeamento_id` Amazon de teste cadastrado;
- funcao ainda em modo mock, sem `fetch`, LWA, SigV4, service role e escrita no banco.

Comando futuro:

- `supabase functions serve amazon-fees-quote`

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
- nao registrar Authorization/JWT in logs.

Matriz esperada:

- `OPTIONS` retorna 200;
- `GET` retorna 405;
- POST sem Authorization retorna 401;
- token invalido retorna 401;
- JSON invalido retorna 400;
- `mapeamento_id` invalido retorna 400;
- `preco_consultado` invalido retorna 400;
- usuario sem permissao retorna 403;
- mapeamento inexistente retorna 404;
- mapeamento inativo retorna erro controlado;
- marketplace diferente de Amazon retorna erro controlado;
- Amazon sem `seller_sku` retorna erro controlado;
- Amazon sem `marketplace_id` retorna erro controlado;
- `is_amazon_fulfilled` null retorna erro controlado;
- `is_amazon_fulfilled = false` e valido;
- Amazon valido retorna 200 com `status = mock`, `origem = mock` e `aplicado_em_precificacao = false`.

Proxima etapa recomendada:

- 5.5J - Executar teste local controlado com `supabase functions serve`, somente apos autorizacao.

---

## Registro 2026-06-09 - Fase 5.5J-4A & 5.5J-5

Status: [x] Concluido

Objetivo: automatizar o teste autenticado local da Edge Function `amazon-fees-quote` em modo mock e documentar os resultados e estrategias de baseline.

Resultado do Teste Autenticado Local:
- Usuario ficticio `teste-financeiro-local@primely.local` criado/atualizado com sucesso no Auth local.
- Perfil financeiro correspondente inserido in `public.usuarios_perfis` com papel `financeiro` e status `ativo` diretamente via SQL/Docker.
- Login e obtencao do JWT em memoria concluidos com sucesso.
- Endpoint `/auth/v1/user` respondeu com `HTTP 200`.
- Edge Function `amazon-fees-quote` executada com sucesso com `--no-verify-jwt` no Deno Edge Runtime local para contornar incompatibilidade na validacao automatica do gateway local (que tentava verificar chaves ES256 como HMAC).
- Chamada autenticada para a Edge Function com UUID de teste valido `d3b07384-d113-4956-a5cc-48419eb42597` retornou `HTTP 404` com erro controlado:
  ```json
  {
    "success": false,
    "status": "erro",
    "origem": "mock",
    "erro": "Mapeamento marketplace nao encontrado."
  }
  ```
- Teste com nil UUID `00000000-0000-0000-0000-000000000000` retornou `HTTP 400` com erro de formato de UUID, validando as regras do esqueleto.

Garantias de Seguranca:
- Nenhum token, chave, segredo ou senha real foi exposto em logs ou salvo no repositorio.
- Nenhuma chamada real foi efetuada para Amazon SP-API, LWA ou assinaturas AWS SigV4.
- Nenhuma gravacao/atualizacao de tabelas reais de producao foi executada.
- O Git status permaneceu limpo, sem nenhuma alteracao nos arquivos do repositorio.

Estrategia de Baseline Local:
- Avaliada a recomendacao sobre a baseline local untracked (`supabase/migrations/20260515000000_baseline_schema_legado_minimo.sql`).
- Recomendada a **Opcao B (Mover para pasta docs/baseline ou similar)** como caminho seguro para manter o repositorio e o historico de migracoes remota limpos.

Proxima etapa recomendada:
- 5.5K - Definicao formal e aprovacao da estrategia da baseline antes da integracao real da Amazon.

---

## Registro 2026-06-09 - Fase 5.5J-6

Status: [x] Concluido

Objetivo: mover a baseline local untracked (`20260515000000_baseline_schema_legado_minimo.sql`) para a pasta de documentacao `docs/baseline/` para evitar `supabase db push` ou desvios de migracao remota.

Acoes concluidas:
- Criada a pasta `docs/baseline/`.
- Movido o arquivo da baseline legado de `supabase/migrations/` para `docs/baseline/20260515000000_baseline_schema_legado_minimo.sql`.
- Criado o arquivo `docs/baseline/README.md` com as diretrizes de reproducao local temporaria, regras de exclusao pos-start local e preservacao do conceito de ERP oficial (Olist/Tiny) x Painel Inteligente (Primely Store).
- A pasta `supabase/migrations/` foi limpa da baseline legado, eliminando qualquer risco de push acidental.

Proxima etapa recomendada:
- 5.5K - Planejamento da chamada real da API Product Fees da Amazon SP-API.

---

## Registro 2026-06-09 - Fase 5.5J-7 & 5.5J-8

Status: [x] Concluido

Objetivo: testar e documentar o cenario de sucesso mock (HTTP 200) da Edge Function `amazon-fees-quote` no ambiente local do Supabase, utilizando entidades ficticias validas (usuario, perfil, produto, canal e mapeamento) sem dependencias externas.

Cenario de Sucesso Mock Validado:
- **Entidades Ficticias**: Criadas no banco local Docker (`teste-financeiro-local@primely.local`, produto `TESTE-AMZ-FEES-LOCAL`, canal `Amazon FBA Teste Local` e mapeamento ativo correspondente).
- **Validacao de Auth**: Login do usuario e validacao do JWT contra `/auth/v1/user` retornou `HTTP 200`.
- **Validacao da Funcao**: Chamada para `/functions/v1/amazon-fees-quote` com o `mapeamento_id` ficticio real e token no header retornou `HTTP 200`.
- **Resposta Mock**:
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
- **Limpeza**: Todos os dados e chaves ficticias criados para o teste foram totalmente limpos do banco local pos-execucao por chaves primarias especificas.

Garantias de Seguranca:
- O gateway Kong local usou a flag `--no-verify-jwt` para evitar conflito local de chaves ES256, mas a autenticacao e permissao financeira foram executadas manualmente por codigo interno da Edge Function integrando-se com o Supabase Auth local.
- Nenhuma chave secreta, JWT ou senha real foi exposta nos logs.
- Nao houve chamadas reais para LWA, Amazon SP-API, Keepa ou assinaturas AWS SigV4.
- Nenhuma gravacao/atualizacao de tabelas reais de producao (`marketplace_fee_quotes`, `produtos_precificacao`) foi efetuada.

Proxima etapa recomendada:
- 5.5K - Planejamento da chamada real da API Product Fees da Amazon SP-API.

---

## Registro 2026-06-09 - Fase 5.5K-1

Status: [x] Planejamento concluido

Objetivo: planejar a transicao da Edge Function `amazon-fees-quote` do modo mock para a integracao real com a Amazon Product Fees API, desenhando a arquitetura de segredos, cache, precificacao, riscos e microfases futuras de implementacao.

Detalhes do Planejamento de Transicao:
1. **Fluxo de Conexao Amazon**:
   - Autenticacao via LWA (Login With Amazon) para obter token temporario de acesso a partir de `AMAZON_LWA_REFRESH_TOKEN` e segredos do app.
   - Assinatura de requisicao padrao AWS SigV4 (Signature Version 4) usando chaves IAM AWS.
   - Endpoint real da SP-API: `POST /products/fees/v0/items/{Asin}/feesEstimate` com payload contendo `MarketplaceId` (Brasil: `A2Q3Y263D00KWC`), preco de venda simulado (`ListingPrice`), contexto logistico (`IsAmazonFulfilled` true/false) e moeda (`BRL`).
2. **Estrategia de Cache local**:
   - Consultar na tabela `marketplace_fee_quotes` por `mapeamento_id + preco_consultado` antes de bater na API da Amazon, respeitando a janela definida por `validade_cache_horas` (default 24h).
   - Se cache valido e `force_refresh = false`, retornar dados locais com `origem = api_recente`.
   - Se chamada da API falhar por limites de quota ou rate limit (429), gravar log de erro no cache local para facilitar auditoria.
3. **Estrategia de Precificacao**:
   - Ao receber `atualizar_precificacao = true` sob perfil de escrita financeira/admin e se `manual_override = false` no mapeamento, atualizar na tabela `produtos_precificacao` as colunas `taxa_marketplace` (referral fee) e `taxa_logistica` (FBA fee), marcando `aplicado_em_precificacao = true` na cotacao gravada.
4. **Secrets do Supabase Vault**:
   - `AMAZON_LWA_CLIENT_ID`, `AMAZON_LWA_CLIENT_SECRET`, `AMAZON_LWA_REFRESH_TOKEN`, `AMAZON_AWS_ACCESS_KEY_ID`, `AMAZON_AWS_SECRET_ACCESS_KEY`, `AMAZON_AWS_ROLE_ARN`, `AMAZON_SPAPI_ENDPOINT`, `AMAZON_SPAPI_REGION`.
5. **Mitigacao de Riscos**:
   - RLS rigido para impedir acesso anonimo.
   - Restricao de `force_refresh` por IP/usuario para mitigar abusos de cota de API.
   - Isolamento completo de credenciais por ambiente (dev/prod).
6. **Observacao Tecnica de Integracao (ASIN x SellerSKU)**:
   - A Product Fees API possui operacoes por ASIN, por SellerSKU e tambem operacao em lote. Como o Primely Store armazena seller_sku e pode armazenar ASIN no mapeamento Amazon, a Fase 5.5K-2 devera definir a estrategia oficial: usar ASIN, usar SellerSKU ou aplicar fallback controlado entre ambos. Nenhuma decisao de implementacao real foi tomada nesta fase.

Plano de Microfases Futuras:
- **5.5K-2**: Definir contrato tecnico ASIN x SellerSKU x operacao em lote para Amazon Product Fees.
- **5.5K-3**: revisar schema de `marketplace_fee_quotes` para suportar modo_consulta/identificador usado/cache.
- **5.5K-4**: preparar helpers puros para montar payload SellerSKU/ASIN sem chamar Amazon.
- **5.5K-5**: preparar contrato de erros e normalizacao da resposta da Amazon.
- **5.5K-6**: planejar LWA/SigV4 isolados.
- **5.5K-7**: teste real controlado somente apos autorizacao explicita.

---

## Registro 2026-06-09 - Fase 5.5K-2

Status: [x] Contrato Tecnico Definido

Objetivo: definir a estrategia oficial do contrato tecnico da Edge Function `amazon-fees-quote` ao trafegar consultas por ASIN, por SellerSKU ou em lote, mitigando divergencias e determinando as regras de fallback.

Estrategia Oficial de Consulta e Decisao:
1. **Modos de Operacao (`modo_consulta`)**:
   - `"auto"` (Padrao): Tentar primeiro `SellerSKU` (se `seller_sku` preenchido); caso falhe por SKU inexistente/indisponivel na Amazon, acionar fallback automatico para `ASIN` (se `asin` preenchido); se ambos falharem, retornar erro controlado.
   - `"sku"`: Consultar unicamente via `SellerSKU`, obrigando preenchimento do SKU.
   - `"asin"`: Consultar unicamente via `ASIN`, obrigando preenchimento do ASIN.
   - `"batch"`: Reservado para futuras rotinas de sincronizacao e atualizacao de cache em massa.
2. **Caminhos da API Amazon**:
   - `SellerSKU`: `POST /products/fees/v0/listings/{SellerSKU}/feesEstimate` (Mais preciso para itens ja listados pelo seller).
   - `ASIN`: `POST /products/fees/v0/items/{Asin}/feesEstimate` (Ideal para catalogo ou simulacao antes de listar).
   - `Lote`: `POST /products/fees/v0/feesEstimate` (Aceita ate 20 itens por chamada).
3. **Evolucao do Input da Edge Function**:
   - Planejada a expansao do body para incluir: `modo_consulta` (`"auto" | "sku" | "asin"`), `permitir_fallback_asin` (boolean), `usar_cache` (boolean) e `contexto` (`"unitario" | "rotina_cache" | "simulador_precificacao"`).
4. **Validacao de Inputs**:
   - Exigencia estrita de `marketplace_id` (Brasil: `A2Q3Y263D00KWC`), `preco_consultado > 0`, moeda `BRL` e a flag de modalidade logistica `is_amazon_fulfilled` (para separar taxas FBA de FBM/DBA).
5. **Mitigacoes de Risco Adicionais**:
   - URL encoding obrigatorio para o parametro `SellerSKU` na rota do request.
   - Tratamento de divergencias entre ASIN do catalogo e SKU real vendido.
   - Isolamento de erros: falhas de fallback ou cadastro nao mascarados.

Ajuste do Plano de Microfases:
- **5.5K-3**: revisar schema de `marketplace_fee_quotes` para suportar modo_consulta/identificador usado/cache.
- **5.5K-4**: preparar helpers puros para montar payload SellerSKU/ASIN sem chamar Amazon.
- **5.5K-5**: preparar contrato de erros e normalizacao da resposta da Amazon.
- **5.5K-6**: planejar LWA/SigV4 isolados.
- **5.5K-7**: teste real controlado somente apos autorizacao explicita.

Garantias de Seguranca:
- O planejamento foi executado de forma puramente teorica e documental.
- Nenhuma chave secreta foi criada, lida ou exposta.
- A Edge Function original de mock nao sofreu alteracoes funcionais e continua ativa no repositorio.

---

## Registro 2026-06-09 - Fase 5.5K-3

Status: [x] Auditoria de Schema Concluida

Objetivo: auditar a estrutura atual da tabela `public.marketplace_fee_quotes` e suas relacoes para diagnosticar se ela atende as necessidades de cache de dados reais da API da Amazon.

Resultados da Auditoria:
1. **Campos Existentes**: `mapeamento_id`, `marketplace`, `preco_consultado`, `origem`, `status`, `consultado_em` (com equivalentes logicos para taxas de marketplace/logistica e payload response bruto).
2. **Campos Faltantes (Gaps)**: `modo_consulta`, `identificador_usado`, `seller_sku_usado`, `asin_usado`, `moeda`, `is_amazon_fulfilled`, `payload_request_sanitizado`, `erro_codigo`, `warnings`, `valido_ate`, `criado_por`.
3. **Riscos e Performance**: Funcionamento como historico/log de cotacoes acumulado cronologicamente, necessitando de indice normal de lookup com ordenacao de expiracao, sem impor restricao rigida de unicidade.
4. **Proposta DDL**: Desenho conceitual de DDL para estender a tabela com as colunas ausentes e criar um indice composto de lookup ordenado.

Garantias de Seguranca:
- Nenhuma migration fisica foi criada ou enviada ao banco de dados.
- Nenhuma chamada real foi efetuada e a Edge Function permanece em mock seguro.
- O Git status permanece focado nos registros de documentacao tecnica.

---

## Registro 2026-06-10 - Fase 5.5K-4

Status: [x] Contrato de Helpers Concluido

Objetivo: planejar o contrato tecnico dos helpers puros Deno de request/response para cotacao de taxas da Amazon Product Fees, especificando os endpoints logicos e estruturas sem implementar codigo.

Resumo dos Helpers Propostos:
1. **`montarPayloadFeesSku`**: Formata rota `/listings/{SellerSKU}/feesEstimate` com URL encoding estrito.
2. **`montarPayloadFeesAsin`**: Formata rota `/items/{Asin}/feesEstimate` e valida formato alfanumerico de 10 caracteres.
3. **`montarPayloadFeesBatch`**: Consolida multiplos requests de ate 20 itens no body para batch.
4. `normalizarModoConsulta`, `validarEntradaFeesQuote`, `sanitizarPayloadAmazonFees`, e `extrairResumoTaxasAmazon`.
5. **Isolamento de Seguranca**: Os helpers sao puramente logicos e nao efetuam chamadas fetch, acesso ao banco de dados, leitura de variaveis de ambiente ou logicas SigV4/LWA.

Cronograma Ajustado para Proxima Microfase:
- **5.5K-5**: Definir contrato de erros e normalizacao da resposta Amazon.
- **5.5K-6**: Criar helpers puros em arquivo isolado sem fetch e sem secrets.
- **5.5K-7**: teste real controlado somente apos autorizacao explicita.

Garantias de Seguranca:
- Nenhuma linha de codigo foi escrita ou alterada no repositorio.
- Nenhuma chamada real foi efetuada a Amazon e nenhuma credencial real foi exposta.

---

## Registro 2026-06-10 - Fase 5.5K-5

Status: [x] Contrato de Erros e Normalizacao Concluido

Objetivo: planejar e estruturar conceitualmente as regras de tratamento de erros, alertas e normalizacao do retorno (request/response) da futura integracao com a Amazon Product Fees API.

Definicoes de Erro e Normalizacao:
1. **Response Padronizado**: JSON unificado mapeando status do cache, detalhes de taxas estruturados (marketplace, logistica e totais) e objeto de erro com codigo, mensagem sanitizada e categoria.
2. **Fallback no Modo Auto**: Teste inicial via SKU com fallback para ASIN se falhar por SKU inexistente. Preservacao da mensagem de erro do SKU no warning `fallback_sku_para_asin` para fins de auditoria de cadastro.
3. **Tratamento de Erros e Cache**: Validacoes locais, erros LWA/SigV4 isolados e expiracao de cache logica (5 minutos para erros temporarios/rate limit e 24 horas para erros de cadastro).
4. **Logs Sanitizados**: Proibicao estrita de vazar Authorization, tokens LWA ou secrets AWS IAM no console.

Ajuste de Cronograma de Microfases:
- **5.5K-6**: Criar helpers puros em arquivo isolado sem fetch e sem secrets.
- **5.5K-7**: teste real controlado somente apos autorizacao explicita.

Garantias de Seguranca:
- Atividade puramente documental, sem codigos fisicos ou migrations alterados/criados.
- O Git status permanece focado nos registros de documentacao tecnica.

---

## Registro 2026-06-10 - Fase 5.5K-6

Status: [x] Helpers Puros Concluidos e Testados

Objetivo: criar helpers puros no Deno para a Edge Function `amazon-fees-quote`, contendo tipagens TypeScript e testes unitarios locais, sem rede, sem secrets e sem interacoes de banco.

Helpers Implementados em `_helpers.ts`:
1. **`normalizarModoConsulta`**: Normalizacao robusta do modo para `"auto" | "sku" | "asin"`.
2. **`validarEntradaFeesQuote`**: Validacoes de UUID, preco maior que zero, moeda `BRL`, flag de logistica FBA/FBM e prevencao ativa contra injecao de cabecalhos de autenticacao/tokens.
3. **`montarPayloadFeesSku`**: Monta o endpoint `/listings/{SellerSKU}/feesEstimate` aplicando URL encoding estrito ao SKU e constroi o body.
4. **`montarPayloadFeesAsin`**: Monta o endpoint `/items/{Asin}/feesEstimate` com ASIN em uppercase e validacao conservadora de 10 caracteres alfanumericos.
5. **`montarPayloadFeesBatch`**: Agrupa cotacoes em lote de ate 20 itens no padrao esperado pela API Amazon.
6. **`sanitizarPayloadAmazonFees`**: Filtra chaves sensiveis (Authorization, passwords, tokens) recursivamente no payload.
7. **`extrairResumoTaxasAmazon`**: Normaliza a resposta da Amazon, extraindo as taxas estimadas e consolidando os custos em camelCase.

Testes Unitarios (`_helpers.test.ts`):
- 16 testes unitarios criados e validados contra todas as funcoes de montagem, validacao e sanitizacao.
- Executado via `deno test` local com resultado: `16 passed | 0 failed (32ms)`.
- Validacao estrita de SKU com caracteres especiais saindo codificado, ASIN de 10 caracteres sem prefixo B obrigatorio, e remocao de tokens.

Garantias de Seguranca:
- O arquivo principal da Edge Function `index.ts` nao foi alterado nem importou os helpers.
- Nenhuma migration foi criada ou alterada, e nenhuma escrita no banco local ou remoto foi feita.
- Nenhuma chamada a rede externa (LWA/SigV4/Amazon) foi efetuada.
- O Git status acusa os novos arquivos de helpers isolados.

Plano de Microfases Futuras:
- **5.5K-8**: Integrar helpers no index.ts mantendo mock.
- **5.5K-9**: Teste real controlado somente apos autorizacao explicita.

---

## Registro 2026-06-10 - Fase 5.5K-7

Status: [x] Planejamento de Integracao dos Helpers Concluido

Objetivo: planejar e documentar como os helpers puros TypeScript (`_helpers.ts`) serao integrados na Edge Function `amazon-fees-quote/index.ts` mantendo a seguranca e o comportamento mock atual intacto, preparando as bases de testes e fluxos para acoplamentos futuros.

Analise e Fluxo de Integracao Planejado:
1. **Preservacao do Fluxo Critico**: A integracao dos helpers no `index.ts` deve manter a ordem estrita de seguranca e autenticacao (CORS -> Verificacao de Metodo -> Validacao de Bearer JWT -> Validacao de Permissao Financeira no Banco -> Carga do Mapeamento Marketplace do Banco).
2. **Consolidacao e Validacao de Entrada**: O body da requisicao (`mapeamento_id`, `preco_consultado`, etc.) sera combinado com os parametros do mapeamento consultado (`seller_sku`, `asin`, `marketplace_id`, `is_amazon_fulfilled`, `moeda` com fallback `BRL`) em uma estrutura unica `EntradaFeesQuote` e validado via `validarEntradaFeesQuote(...)`.
3. **Resolucao de Rota e Identificador**: Com a entrada validada e o modo de consulta normalizado (`normalizarModoConsulta(...)`), a Edge Function acionara as funcoes de montagem do payload (`montarPayloadFeesSku` ou `montarPayloadFeesAsin`), gerando e sanitizando o request body em memoria com `sanitizarPayloadAmazonFees(...)`.
4. **Preservacao do Mock Seguro**: Mesmo gerando os payloads em memoria, a Edge Function continuara retornando a resposta mock estruturada com HTTP 200 de sucesso, **sem fazer nenhuma chamada HTTP externa (fetch)**, sem ler secrets AWS/LWA e sem atualizar o banco nesta etapa.
5. **Mitigacao de Riscos**: Evita-se a inversao de validacoes (nunca validar o body ou mapeamento antes de validar o JWT/Autorizacao), previne-se o vazamento de chaves ou mensagens brutas e assegura-se que a compatibilidade com todos os testes mock de erros existentes (400, 401, 403, 404) seja 100% mantida.

Estrategia Recomendada para a Proxima Fase:
- **Proxima Fase (5.5K-8)**: Integrar de fato os helpers no `index.ts` mantendo o comportamento mock seguro e validar via `deno check` e testes locais de chamadas. Esta e a opcao mais segura por permitir verificar a integracao estatica e dinamica da logica sem expor o sistema a rede ou credenciais reais.

Garantias de Seguranca:
- O arquivo principal da Edge Function `index.ts` nao foi modificado.
- Nenhuma alteracao foi feita nos helpers ou testes criados.
- Nenhuma migration foi criada ou alterada, e nenhuma chamada externa ou leitura de secrets foi efetuada.
- O Git status permanece 100% limpo ao inicio da atividade.

---

## Registro 2026-06-10 - Fase 5.5K-8

Status: [x] Helpers Integrados no index.ts com Sucesso

Objetivo: importar e acoplar os helpers puros na Edge Function `amazon-fees-quote/index.ts`, executando a normalizacao, consolidacao e validacao estrutural do payload gerado em memoria antes de retornar o JSON mock sob as mesmas garantias de erros de cliente.

Melhorias Aplicadas:
1. **Extensao de Tipagem**: Mapeados os campos `asin` e `moeda` no tipo `MarketplaceMapping` do `index.ts` e na query de selecao no banco de dados local. Mapeados os campos `modo_consulta` e `permitir_fallback_asin` no tipo `FeesQuoteRequestBody`.
2. **Consolidacao e Validacao**: Adicionado bloco logico de try-catch interno para converter quaisquer falhas de validacao de dados em memoria disparados pelos helpers puros em um `AppError` com status HTTP `400` de cliente.
3. **Mapeamento e Sanitizacao**: Geracao do payload da Amazon com `montarPayloadFeesSku` e `montarPayloadFeesAsin` sanitizado de segredos por `sanitizarPayloadAmazonFees`.
4. **Enriquecimento do Retorno Mock**: O response de sucesso mock inclui agora os campos nao-sensiveis `modo_consulta`, `identificador_usado` e `payload_mock_sanitizado`.

Resultados Finais:
* **`deno fmt --check`**: Passou perfeitamente nos 3 arquivos.
* **`deno check`**: Passou perfeitamente, sem nenhum aviso de tipagem no `index.ts`.
* **`deno test`**: Passou perfeitamente com 16 testes de helpers verdes.
* **`task.md`**: Removido apos a conclusao da checklist conforme as regras da fase.

Garantias Cumpridas:
* O retorno da Edge Function continua mockado e sem trafego de rede (`fetch`).
* Nao foram manipulados segredos de ambiente ou chaves AWS/LWA reais.
* Nenhuma migration foi criada ou alterada, mantendo o banco e Git limpos de dados espurios.

---

## Registro 2026-06-10 - Fase 5.5K-9 / 5.5K-9A / 5.5K-9B

Status: [x] Testes Locais e Documentacao Concluidos com Sucesso

Objetivo: testar localmente a Edge Function `amazon-fees-quote` integrada aos helpers, auditar o URL encoding de SKU especial, e documentar oficialmente os resultados das validacoes sem rede e sem chaves privadas.

Cenarios de Teste Local e Validacoes:
1. **OPTIONS**: Retornou `HTTP 200` CORS pre-verificado.
2. **GET (Metodo invalido)**: Retornou `HTTP 405` com mensagem sanitizada do mock.
3. **POST sem Auth**: Retornou `HTTP 401` com erro controlado de Authorization ausente.
4. **POST com Bearer invalido**: Retornou `HTTP 401` de usuario nao autenticado pelo Supabase Auth local.
5. **Mapeamento inexistente**: Retornou `HTTP 404` com erro controlado.
6. **Mapeamento Amazon FBA valido**: Retornou `HTTP 200` com os campos mock e os dados de debug enriquecidos (`modo_consulta`, `identificador_usado`, `payload_mock_sanitizado` limpo).
7. **SKU com caractere especial**: Executado com SKU `"TESTE SKU/AMZ FEES"`. O endpoint path logico do helper e formatado com codificacao de URL simples (`TESTE%20SKU%2FAMZ%20FEES`), sem ocorrencia de duplo encoding.
8. **ASIN sem iniciar com B**: Executado com ASIN `"1234567890"` e aceito sem bloqueios, emitindo o warning apropriado de formato suspeito.
9. **FBM/DBA**: Executado com `is_amazon_fulfilled = false` e aceito como booleano valido.

Resultados de Auditoria e Prevencao de Segredos:
* **Duplo Encoding**: Investigado e comprovado que o helper `montarPayloadFeesSku` realiza a codificacao simples. Adicionado teste unitario extra no `_helpers.test.ts` cobrindo o SKU `"TESTE SKU/AMZ FEES"`.
* **Sanitizacao de Payloads**: O `payload_mock_sanitizado` nao contem metadados de autenticacao, JWT, tokens LWA, secrets AWS IAM ou connection strings.
* **Limpeza Local**: Todas as entidades temporarias inseridas locais (perfil, produto, canal, mapeamento e usuario auth) foram purgadas do banco local apos o termino dos testes de integracao.
* **Ferramentas Deno**: `deno fmt --check`, `deno check` e `deno test` (agora com 16 testes unitarios) passaram com sucesso absoluto.

Garantias Cumpridas:
* A Edge Function continua mockada e segura, nao devendo ser considerada integracao real com a Amazon.
* Nenhuma chamada de rede `fetch` foi efetuada, nenhum secret lido e nenhuma migration de banco alterada.

---

## Registro 2026-06-10 - Fase 5.5L-1

Status: [x] Planejamento e Auditoria de Cache de Cotacoes Concluidos

Objetivo: Planejar, sem implementar codigo, o comportamento do cache real para a futura integracao Amazon Product Fees utilizando a tabela `public.marketplace_fee_quotes`, avaliando a necessidade de evolucao do schema do banco.

Resultados de Auditoria e Planejamento:
1. **Diferencas de Schema (Gaps)**: A tabela atual `marketplace_fee_quotes` carece de metadados criticos para lookup seguro do cache, como `modo_consulta`, `identificador_usado`, `seller_sku_usado`, `asin_usado`, `moeda`, `is_amazon_fulfilled`, `payload_request_sanitizado`, `erro_codigo`, `warnings`, `valido_ate` e `criado_por`.
2. **Estrategia de Cache**: A Edge Function consultara a cotacao valida mais recente no banco ordenando por `valido_ate DESC`, com a clausula `valido_ate > now()`. O cache e persistido como historico/log no estilo audit-log, permitindo rastrear o comportamento ao longo do tempo.
3. **Regra de Force Refresh**: A flag `force_refresh = true` forcara a ignorar o cache e consultar a API da Amazon, enquanto `force_refresh = false` retornara a cotacao valida, marcando `origem = "cache"`.
4. **Tratamento de Validades**:
   * Sucesso da Amazon: validade de acordo com as horas do mapeamento (default 24h).
   * Erros temporarios (timeout, 5xx, 429 rate limits): expiracao curta (5 a 15 minutos) para permitir recuperacao sem travar consultas legitimas.
   * Erros de cadastro/negocio (404 SKU nao encontrado): expiracao longa (24h) para evitar requisicoes redundantes na API.
5. **Indice de Lookup**: Definido o indice de cache conceitual `idx_fee_quotes_cache_lookup` composto por `mapeamento_id`, `preco_consultado`, `moeda`, `is_amazon_fulfilled`, `modo_consulta`, `identificador_usado`, `status` e `valido_ate DESC`. O uso de UNIQUE INDEX parcial no tempo foi descartado devido ao comportamento de historico/log da tabela.
6. **Evolucao de Precificacao**: Diferenciamos cache de persistencia operacional. A atualizacao na tabela `produtos_precificacao` so ocorrera se o usuario possuir acesso financeiro de escrita, se `atualizar_precificacao = true`, se o retorno for sucesso de API valido e se `manual_override = false`.
7. **Proxima Fase Recomendada**: `5.5L-2 - Criar migration de metadados do cache (Fase A)`. Esta opcao e a mais segura e metodologica porque prepara a estrutura do banco local com os tipos e validacoes corretas antes de qualquer implementacao de leitura/escrita na Edge Function.

Garantias Cumpridas:
* Esta fase foi puramente conceitual, de analise e de documentacao.
* Nenhuma migration foi criada ou alterada, nenhuma Edge Function foi modificada, e nenhum comando de rede (`fetch`) ou SQL de escrita foi efetuado.

---

## Registro 2026-06-12 - Fase 5.5L-6B/C

Status: [x] Helpers e Testes Offline do Mercado Livre em Deno Concluidos

Objetivo: Criar e validar localmente em Deno, sem uso de rede ou credenciais reais, os helpers seguros para calculo de taxas, comissoes e fretes do Mercado Livre, alem do calculo de margem e preco minimo recomendado (Break-even), tratando a descontinuidade matematica de R$ 79,00.

Resultados de Auditoria e Implementacao:
1. **Helper de Taxas ML**: Implementados metodos de validacao estrita do payload (rejeitando NaN, Infinity e custos negativos), calculo de comissao classica/premium e tarifa fixa ficticia (para precos < R$ 79,00).
2. **Preco Minimo Recomendado**: Resolvida programaticamente a descontinuidade matematica de Break-even onde o frete gratis se torna obrigatorio, cobrindo o ponto de equilibrio exato em R$ 79,00 e situacoes de prejuizo no limite.
3. **Helper Logistico ML**: Implementada matriz ficticia de pesos/valores e descontos de reputacao do vendedor para simulacoes locais, alem de sanitizacao automatica de credenciais nos logs.
4. **Validacoes e Testes**: Criados 20 testes unitarios Deno offline (100% de sucesso).

Garantias Cumpridas:
* Sem chaves reais, sem acesso ao `.env.local`, sem chamadas HTTP reais de rede.
* Sem acoplamento na Edge Function principal de producao `index.ts`.

---

## Registro 2026-06-12 - Fase 5.5L-6D

Status: [x] Edge Function Mockada do Mercado Livre em Deno Concluida

Objetivo: Implementar e validar o handler principal `index.ts` e testes HTTP integrados em `index.test.ts` de forma estritamente local/offline e sem deploy.

Resultados de Auditoria e Implementacao:
1. **Handler principal (index.ts)**: Criado o endpoint mockado suportando requisicoes OPTIONS (CORS), POST com autenticacao Bearer local restrita a `Bearer mock-valid-token`, validacao e sanitizacao de payloads e orquestracao dos helpers locais de taxas e frete.
2. **Testes de integracao (index.test.ts)**: Implementados 13 testes integrados na memoria HTTP cobrindo cors, erros 401, erros 400 por JSON malformado/schema invalido e respostas 200 de simulacao de sucesso com calculos corretos e warnings.
3. **Validacoes locais**: Formatado com `deno fmt`, checado com `deno check` e testado com 100% de sucesso (33 testes passando).

Garantias Cumpridas:
* Nenhuma conexao real com APIs externas ou banco de dados.
* O token `mock-valid-token` e usado apenas para simulacoes e testes offline, sem validacao real de credenciais ou JWT.
* Sem deploy para o Supabase, sem migrations e sem chaves reais no codigo.

---

## Registro 2026-06-12 - Fase 5.5L-6E

Status: [x] Planejamento de Integracao Frontend/Simulador (Concluido)

Objetivo: Planejar de forma documental a integracao do simulador de precificacao com a Edge Function local do Mercado Livre, identificando a arquitetura de autenticacao segura.

Resultados de Auditoria e Implementacao:
1. **Documentacao de Integracao**: Criado o plano detalhado identificando campos de entrada, campos de preenchimento automatico e tratamento de erros sem calculos locais duplicados.
2. **Seguranca de Autenticacao**: Declarado o bloqueio de integracao direta do React usando chaves internas/mockadas. Definida a separacao entre testes em memoria, fetch mockado no frontend e a futura chamada HTTP local real.
3. **Interface Visual**: Estabelecida a obrigatoriedade do banner visual de alerta sobre calculos baseados em simulacoes locais.

Garantias Cumpridas:
* Etapa estritamente documental de planejamento conceitual.
* Sem chamadas de rede real, secrets expostos, deploy, migrations ou SQL.

---

## Registro 2026-06-13 - Fase 5.5L-6F

Status: [x] Simulador Mercado Livre Local/Mockado Independente no Frontend (Concluido e Comitado)

Objetivo: Concluir a implementacao do simulador de precificacao mockado independente no frontend, permitindo alternar de forma segura entre o Simulador Padrao e o Simulador Mercado Livre (Local/Mock) com aviso de governanca, calculo local puro em TypeScript, testes unitarios offline e interativos.

Resultados de Auditoria e Implementacao:
1. **Decisao Humana Oficial**: Aprovada a Opcao 1 pelo usuario para manter o simulador do Mercado Livre com formulas mockadas locais no frontend React, independente e sem chamada da Edge Function nesta fase.
2. **Camada de Servicos**: Habilitada a simulacao local mockada do Mercado Livre em `precificacaoService.ts` como funcao pura em TypeScript, sem chamadas HTTP e sem tokens. Implementada validacao estrita de finitude com `Number.isFinite` rejeitando NaN, Infinity, negativos e preco <= 0.
3. **Camada Visual**: Ajustada a interface do Mercado Livre em `CustosMargem.tsx` para exibir o formulario e resultados de forma visivel e acessivel localmente, exibindo o banner informativo amarelado de governanca e tratando erros locais sem bloquear a tela e sem mencao a JWT ou Supabase CLI. Restaurada a acentuacao e formatacao original no Simulador Padrao e abas para minimizar o diff, mantendo apenas o bloco Mercado Livre sem acentos.
4. **Validacao de Build e Testes**: Build completo executado sem erros (`npm run build`) e suite de 18 testes unitarios offline validada com 100% de sucesso no Vitest (sendo 11 testes diretos de servico e 7 testes de componentes visuais do frontend).
5. **Script de Auditoria**: Ajustado o script `scripts/codex-responder-antigravity.ps1` para forcar leitura e saida UTF-8 no console do PowerShell 5.1 local, evitando Mojibakes e caracteres corrompidos '?' no terminal.
6. **Arquivos Temporarios**: Classificados os arquivos untracked `head_custos.tsx` (backup do componente) e `temp_diff_service.txt` (diff do service) como arquivos temporarios de auditoria, proibidos de entrar no stage/commit e sem remocao sem confirmacao humana.

Garantias Cumpridas:
* Suite de 18 testes unitarios e de regressao offline aprovados no Vitest;
* Build de producao executado e aprovado sem erros;
* Fase concluida e comitada na branch publicada: `feature/mercado-livre-fees-quote-frontend-mock`;
* Commit realizado: `a71fe52 feat: adiciona simulador local mockado do Mercado Livre`;
* As dependencias de teste (Vitest, jsdom, Testing Library) estao restritas ao escopo de devDependencies;
* Os arquivos temporarios `head_custos.tsx` e `temp_diff_service.txt` permaneceram untracked e fora do stage/commit.

---

## Registro 2026-06-15 - Fase 5.5L-6G.1

Status: [/] Planejamento da Abstracao de Provedores de Taxas do Mercado Livre (Implementacao Documental Concluida, Auditoria Codex Pendente)

Objetivo: Planejar documentalmente a arquitetura de provedores de taxas do Mercado Livre, definindo a interface MercadoLivreFeesProvider, o provedor local Mockado, e conceituando o futuro provedor Edge Function desativado.

Resultados do Planejamento:
1. **Interface Conceitual**: Definida a interface MercadoLivreFeesProvider contendo simularTaxas com inputs, outputs, warnings e tratamento amigavel de erros.
2. **Provedores Conceituados**: Provedor local Mockado (ativo por padrao) delegando para a funcao existente e provedor Edge Function desativado de forma conceitual (sem criacao de classes, fetch, URL, JWT, tokens ou configuracoes de ambiente).
3. **Escopo da Edge Function**: Declarado que a Edge Function atual tambem utiliza regras mockadas, e nao representa taxas oficiais do Mercado Livre.
4. **UI Completamente Desacoplada**: A UI nao contera formulas, fixtures de peso/preco, URLs ou detalhes de infraestrutura da Edge Function / Supabase, conhecendo apenas os tipos de dados de entrada e saida.
5. **Selecao do Provedor**: Provedor local sera o unico disponivel no sistema via Factory de forma explicita, sem selecao automatica por sessao, token, URLs ou variavel VITE_.
6. **Estrategia de Testes**: Testes offline do provedor local, testes de contrato e mock do provedor na UI React. Testes de contrato detectam divergencias entre implementacoes, mas nao eliminam por si mesmos o risco de duplicacao de formulas.
7. **Compatibilidade Temporaria**: O novo provedor local delegara inicialmente a execucao para a funcao simularTaxasMercadoLivreLocal preexistente, movendo a logica e removendo a funcao antiga apenas em fase posterior apos testes.
8. **Plano de Rollback**: Procedimento de rollback de referencia (atraves de git checkout) para restaurar ou reverter apenas arquivos autorizados da microfase apos apresentar o diff e solicitar confirmacao humana explicita.
9. **Criterios de Aceite Documentais**:
   - Arquitetura de provedores documentada.
   - Somente provedor local autorizado na factory inicial.
   - Provedor remoto apenas conceitual.
   - Estrategia de migracao com testes de contrato (que detectam divergencias) e testes offline documentados.
   - Nenhuma alteracao em arquivos `.ts`, `.tsx`, JSON, configuracoes ou dependencias.
   - Nenhum stage (`git add`), commit, push ou deploy.
10. **Divisao de Microfases**:
    - **5.5L-6G.1**: Planejamento documental e formalizacao.
    - **5.5L-6G.2**: Criacao dos tipos TypeScript e definicao da interface do provedor.
    - **5.5L-6G.3**: Criacao do provedor local mockado delegando para a funcao existente.
    - **5.5L-6G.4**: Injecao do provedor em CustosMargem.tsx.
    - **5.5L-6G.5**: Testes de contrato e regressao.
    - **5.5L-6G.6**: Extracao final da logica e remocao de compatibilidade (apos aprovacao).
    - **Fase remota futura separada**: Planejamento do provedor Edge Function (sem data ou autorizacao).

Garantias Cumpridas:
* Nenhuma alteracao em arquivos .ts, .tsx, JSON, Edge Functions, dependencias ou configuracoes do Vite.
* Sem stage (git add), commit ou push nesta microfase documental.
* Sem deploy, secrets, API real, migrations ou SQL.
