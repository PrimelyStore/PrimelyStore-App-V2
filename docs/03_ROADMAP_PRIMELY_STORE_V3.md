# Roadmap — Primely Store V3

## Legenda

```txt
[ ] Pendente
[~] Em progresso
[x] Concluído
[!] Bloqueado
[L] Legado / manter sem evoluir por enquanto
```

---

## Módulo 1 — Auditoria e Governança

Status: [ ] Pendente  
Prioridade: Alta

Objetivo: garantir que o projeto siga o conceito de painel gerencial e não volte a virar um segundo ERP.

Etapas:

- [ ] 1.1 Validar `git status`;
- [ ] 1.2 Validar `.gitignore`;
- [ ] 1.3 Validar `.env.local` e `.env.example`;
- [ ] 1.4 Validar `AGENTS.md`;
- [ ] 1.5 Validar Skills;
- [ ] 1.6 Validar MCP Supabase em modo leitura;
- [ ] 1.7 Classificar módulos atuais;
- [ ] 1.8 Identificar telas que ainda parecem ERP;
- [ ] 1.9 Definir o que fica, o que vira legado e o que será removido.

Critério de conclusão:

- Documentação oficial atualizada;
- Nenhum segredo versionado;
- ROADMAP aceito;
- Antigravity configurado com regras claras.

---

## Módulo 2 — Integrações e Saúde dos Dados

Status: [ ] Pendente  
Prioridade: Alta

Objetivo: mostrar se os dados do sistema estão confiáveis.

Etapas:

- [ ] 2.1 Mapear Edge Functions existentes;
- [ ] 2.2 Mapear tabelas de log;
- [ ] 2.3 Mapear snapshots Olist;
- [ ] 2.4 Criar tela de status das integrações;
- [ ] 2.5 Mostrar última sincronização;
- [ ] 2.6 Mostrar total de produtos, depósitos, estoque, pedidos e notas;
- [ ] 2.7 Mostrar erros recentes;
- [ ] 2.8 Mostrar alertas de token/API.

Critério de conclusão:

- Usuário consegue saber se os dados estão atualizados antes de analisar dashboard e Curva ABC.

---

## Módulo 3 — Dashboard Gerencial

Status: [ ] Pendente  
Prioridade: Alta

Objetivo: criar visão executiva baseada em snapshots, views e dados consolidados.

Etapas:

- [ ] 3.1 Auditar fontes reais de dados;
- [ ] 3.2 Definir cards principais;
- [ ] 3.3 Definir filtros;
- [ ] 3.4 Criar/ajustar services;
- [ ] 3.5 Criar layout responsivo;
- [ ] 3.6 Criar gráficos principais;
- [ ] 3.7 Validar números com consultas diretas.

Indicadores sugeridos:

- faturamento;
- pedidos;
- produtos vendidos;
- margem estimada;
- estoque consolidado;
- produtos com alerta;
- produtos sem custo;
- divergências.

---

## Módulo 4 — Estoque Consolidado

Status: [ ] Pendente  
Prioridade: Alta

Objetivo: analisar estoque por origem sem substituir o Olist.

Etapas:

- [ ] 4.1 Mapear estoque Olist Depósito Geral;
- [ ] 4.2 Mapear estoque Olist FBA;
- [ ] 4.3 Mapear Amazon FBA;
- [ ] 4.4 Preparar Mercado Livre Full;
- [ ] 4.5 Criar visão consolidada;
- [ ] 4.6 Criar alertas de ruptura;
- [ ] 4.7 Criar alertas de excesso/estoque parado.

---

## Módulo 5 — Custos e Margem Estimada

Status: [ ] Pendente  
Prioridade: Alta

Objetivo: criar base confiável para lucro, margem, ROI e Curva ABC.

Etapas:

- [ ] 5.1 Mapear custos existentes;
- [ ] 5.2 Definir custo por produto;
- [ ] 5.3 Definir custo por canal/logística;
- [ ] 5.4 Definir impostos;
- [ ] 5.5 Definir taxas marketplace;
- [ ] 5.6 Definir custos Prep Center;
- [ ] 5.7 Criar views/RPCs de margem;
- [ ] 5.8 Validar cálculo em produtos reais.

---

## Módulo 6 — Vendas Analíticas

Status: [ ] Pendente  
Prioridade: Média

Objetivo: analisar vendas por período, produto, canal e logística.

Etapas:

- [ ] 6.1 Mapear snapshots de pedidos;
- [ ] 6.2 Definir receita bruta e líquida;
- [ ] 6.3 Criar filtros;
- [ ] 6.4 Criar tabela analítica;
- [ ] 6.5 Criar comparativos entre períodos;
- [ ] 6.6 Criar exportação.

---

## Módulo 7 — Curva ABC Inteligente

Status: [ ] Pendente  
Prioridade: Alta

Objetivo: implementar análise estratégica de produtos.

Etapas:

- [ ] 7.1 Auditar dados disponíveis;
- [ ] 7.2 Criar view/RPC base;
- [ ] 7.3 ABC por faturamento;
- [ ] 7.4 ABC por lucro;
- [ ] 7.5 ABC por volume;
- [ ] 7.6 ABC por margem/oportunidade;
- [ ] 7.7 Matriz estratégica;
- [ ] 7.8 Alertas;
- [ ] 7.9 Recomendações de ação;
- [ ] 7.10 Tela responsiva;
- [ ] 7.11 Exportação CSV/Excel.

---

## Módulo 8 — Conciliações

Status: [ ] Pendente  
Prioridade: Média

Objetivo: encontrar divergências entre sistemas.

Etapas:

- [ ] 8.1 Olist x Amazon FBA;
- [ ] 8.2 Olist x Mercado Livre Full;
- [ ] 8.3 Produtos sem vínculo;
- [ ] 8.4 Estoque divergente;
- [ ] 8.5 Produtos sem custo;
- [ ] 8.6 Alertas de conciliação.

---

## Módulo 9 — Keepa e Mineração

Status: [ ] Pendente  
Prioridade: Média

Objetivo: trazer inteligência de mercado.

Etapas:

- [ ] 9.1 Definir ASINs elegíveis;
- [ ] 9.2 Criar snapshots Keepa;
- [ ] 9.3 Controlar tokens/rate limit;
- [ ] 9.4 Criar alertas de oportunidade;
- [ ] 9.5 Criar tela de mineração;
- [ ] 9.6 Integrar com Curva ABC.

---

## Módulo 10 — n8n + Telegram

Status: [ ] Pendente  
Prioridade: Média

Objetivo: alertas e consultas gerenciais.

Etapas:

- [ ] 10.1 Relatório diário;
- [ ] 10.2 Relatório semanal;
- [ ] 10.3 Alertas de ruptura;
- [ ] 10.4 Alertas de margem;
- [ ] 10.5 Alertas de falha de sync;
- [ ] 10.6 Perguntas via Telegram.

---

## Módulo 11 — Revisão dos Legados

Status: [ ] Pendente  
Prioridade: Baixa

Objetivo: decidir o que manter, adaptar, ocultar ou remover.

Etapas:

- [ ] 11.1 Auditar módulos antigos;
- [ ] 11.2 Marcar telas como legado quando necessário;
- [ ] 11.3 Ocultar rotas que confundem o usuário;
- [ ] 11.4 Remover somente com confirmação e backup;
- [ ] 11.5 Atualizar documentação.
