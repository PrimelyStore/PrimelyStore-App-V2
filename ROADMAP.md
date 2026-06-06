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
- [ ] 5.5B Planejamento dos secrets e variaveis da Edge Function Amazon

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
