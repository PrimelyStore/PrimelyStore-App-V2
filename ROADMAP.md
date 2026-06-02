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

Status: [ ] Pendente  
Prioridade: Alta  
Objetivo: mostrar se os dados do sistema estão confiáveis.

Etapas:

- [ ] 2.1 Mapear Edge Functions existentes
- [ ] 2.2 Mapear logs de sincronização
- [ ] 2.3 Criar tela de status das integrações
- [ ] 2.4 Mostrar última sincronização
- [ ] 2.5 Mostrar erros recentes
- [ ] 2.6 Mostrar contagem de produtos/estoque/pedidos/notas

---

## Módulo 3 — Dashboard Gerencial

Status: [ ] Pendente  
Prioridade: Alta  
Objetivo: criar visão executiva baseada em snapshots e views.

Etapas:

- [ ] 3.1 Auditar fontes reais de dados
- [ ] 3.2 Definir cards principais
- [ ] 3.3 Definir filtros
- [ ] 3.4 Criar/ajustar services
- [ ] 3.5 Criar layout responsivo
- [ ] 3.6 Validar dados

---

## Módulo 4 — Estoque Consolidado

Status: [ ] Pendente  
Prioridade: Alta  
Objetivo: consolidar estoque por origem sem substituir o Olist.

Etapas:

- [ ] 4.1 Olist Depósito Geral / Prep Center
- [ ] 4.2 Olist FBA
- [ ] 4.3 Amazon FBA
- [ ] 4.4 Mercado Livre Full, quando disponível
- [ ] 4.5 Divergências
- [ ] 4.6 Alertas

---

## Módulo 5 — Custos e Margem Estimada

Status: [ ] Pendente  
Prioridade: Alta  
Objetivo: criar base confiável para lucro, margem, ROI e Curva ABC.

Etapas:

- [ ] 5.1 Mapear custos existentes
- [ ] 5.2 Definir custos por produto/canal/logística
- [ ] 5.3 Definir impostos
- [ ] 5.4 Definir taxas marketplace
- [ ] 5.5 Definir custos Prep Center
- [ ] 5.6 Criar views/RPCs de margem

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
