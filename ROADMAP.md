# ROADMAP — PRIMELY STORE V3

## Status

- [ ] Pendente
- [~] Em progresso
- [x] Concluído
- [!] Bloqueado
- [L] Legado / manter sem evoluir por enquanto

---

## Módulo 1 — Auditoria e Governança

Status: [~] Em progresso  
Prioridade: Alta  
Objetivo: garantir que o projeto siga o conceito de painel gerencial e não volte a virar ERP.

Etapas:

- [x] 1.1 Verificar `git status` — limpo, checkpoint feito
- [x] 1.2 Validar `.gitignore` — protege .env.local ✅
- [~] 1.3 Validar `.env.local` e `.env.example` — divergência de variável corrigida com fallback
- [x] 1.4 Validar `AGENTS.md` — completo ✅
- [x] 1.5 Validar Skills — 6 skills presentes e corretas ✅
- [x] 1.6 Validar MCP em modo somente leitura — read_only=true ✅
- [x] 1.7 Classificar módulos atuais — auditoria completa realizada
- [~] 1.8 Corrigir variável VITE_SUPABASE_PUBLISHABLE_KEY → VITE_SUPABASE_ANON_KEY — fallback aplicado
- [x] 1.9 Ocultar telas legado do menu (Compras, Fornecedores, Lotes, Movimentações)
- [x] 1.10 Reorganizar menu do AppLayout em seções (Gerencial, Integrações, Análises)
- [ ] 1.12 Verificar dashboardService não depende de tabelas legadas — diagnóstico feito, pendente ação

Critério de conclusão:

- Antigravity configurado com regras, skills e documentação.
- Nenhum segredo versionado.
- ROADMAP revisado.

---

## Módulo 2 — Saúde das Integrações

Status: [x] Concluído  
Prioridade: Alta  
Objetivo: mostrar se os dados do sistema estão confiáveis.

Etapas:

- [x] 2.1 Mapear Edge Functions existentes
- [x] 2.2 Mapear logs de sincronização
- [x] 2.3 Criar tela de status das integrações
- [x] 2.4 Mostrar última sincronização
- [x] 2.5 Mostrar erros recentes
- [x] 2.6 Mostrar contagem de produtos/estoque/pedidos/notas

---

## Módulo 3 — Dashboard Gerencial

Status: [x] Concluído  
Prioridade: Alta
Objetivo: criar visão executiva baseada em snapshots, views e dados consolidados.

Etapas:

- [x] 3.1 Auditar fontes reais de dados;
- [x] 3.2 Definir cards principais;
- [x] 3.3 Definir filtros;
- [x] 3.4 Criar/ajustar services;
- [x] 3.5 Criar layout responsivo;
- [x] 3.6 Criar gráficos principais;
- [x] 3.7 Validar números com consultas diretas.

---

## Módulo 4 — Estoque Consolidado

Status: [~] Em progresso  
Prioridade: Alta  
Objetivo: consolidar estoque por SKU de forma analítica e gerencial.

Etapas:

- [x] 4.1 Preparação segura do `estoqueService.ts` com tipos e consolidação reativa V4
- [x] 4.2 Reestruturação da tela `Estoque.tsx` (3 abas, KPIs, divergências e alertas gerenciais)
- [ ] 4.3 Mercado Livre Full, quando as integrações e snapshots estiverem disponíveis

---

## Módulo 5 — Custos e Margem Estimada

Status: [~] Em progresso  
Prioridade: Alta  
Objetivo: gerenciar e simular custos e comissões por canal, estimando lucro e margem gerencial.

Etapas:

- [x] 5.1 Preparação segura do `precificacaoService.ts` em modo leitura e simulação
- [x] 5.2 Desenvolvimento da página `CustosMargem.tsx` (3 abas, simulador e parâmetros de custos)
- [x] 5.3A Registro de rota oficial e inclusão do link "Custos & Margens" no menu lateral
- [x] 5.3B-2 Auditoria e replanejamento de Custos por Canal
- [x] 5.3C-1 Migration de Schema 1 (Matrizes e Cubagem)
- [x] 5.3C-2 Planejamento da Carga Inicial de Dados/Seed
- [ ] 5.3C-3 Criação da Migration de Seed SQL
- [ ] 5.3C-4 Migration de Schema 2 (Precificação e Cotações)
- [ ] 5.3D Edge Functions de Tarifas
- [ ] 5.3E Visualização e Gravação de Custos por Canal com Overrides
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

## Módulo 6 — Vendas Analíticas

Status: [ ] Pendente  
Prioridade: Média  
Objetivo: analisar vendas por período, produto, canal e logística.

Etapas:

- [ ] 6.1 Mapear snapshots de pedidos
- [ ] 6.2 Definir receita bruta/líquida
- [ ] 6.3 Criar filtros
- [ ] 6.4 Criar tabela analítica
- [ ] 6.5 Criar comparativos

---

## Módulo 7 — Curva ABC Inteligente

Status: [ ] Pendente  
Prioridade: Alta  
Objetivo: implementar análise estratégica de produtos.

Etapas:

- [ ] 7.1 Auditar dados disponíveis
- [ ] 7.2 Criar view/RPC de base
- [ ] 7.3 ABC por faturamento
- [ ] 7.4 ABC por lucro
- [ ] 7.5 ABC por volume
- [ ] 7.6 Matriz estratégica
- [ ] 7.7 Alertas
- [ ] 7.8 Recomendações de ação
- [ ] 7.9 Tela responsiva
- [ ] 7.10 Exportação

---

## Módulo 8 — Conciliações

Status: [ ] Pendente  
Prioridade: Média  
Objetivo: encontrar divergências entre sistemas.

Etapas:

- [ ] 8.1 Olist x Amazon FBA
- [ ] 8.2 Olist x Mercado Livre Full
- [ ] 8.3 Produtos sem vínculo
- [ ] 8.4 Estoque divergente
- [ ] 8.5 Alertas

---

## Módulo 9 — Keepa e Mineração

Status: [ ] Pendente  
Prioridade: Média  
Objetivo: trazer inteligência de mercado.

Etapas:

- [ ] 9.1 Definir ASINs elegíveis
- [ ] 9.2 Definir snapshots Keepa
- [ ] 9.3 Controlar tokens/rate limit
- [ ] 9.4 Criar alertas de oportunidade
- [ ] 9.5 Criar tela de mineração

---

## Módulo 10 — n8n + Telegram

Status: [ ] Pendente  
Prioridade: Média  
Objetivo: alertas e consultas gerenciais.

Etapas:

- [ ] 10.1 Relatório diário
- [ ] 10.2 Relatório semanal
- [ ] 10.3 Alertas de ruptura
- [ ] 10.4 Alertas de margem
- [ ] 10.5 Perguntas via Telegram

---

## Módulo 11 — Legado

Status: [ ] Pendente  
Prioridade: Baixa  
Objetivo: decidir o que manter, adaptar, ocultar ou remover.

Etapas:

- [ ] 11.1 Auditar módulos antigos
- [ ] 11.2 Marcar telas como legado quando necessário
- [ ] 11.3 Ocultar rotas que confundem o usuário
- [ ] 11.4 Remover apenas com confirmação

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
- nao registrar Authorization/JWT em logs.

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
- Perfil financeiro correspondente inserido em `public.usuarios_perfis` com papel `financeiro` e status `ativo` diretamente via SQL/Docker.
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

