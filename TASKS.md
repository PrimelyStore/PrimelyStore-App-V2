# TASKS.md - Controle de Tarefas do Projeto

## Estado Atual do Projeto
- [x] Fase 5.5L-4 validada tecnicamente (Edge Function mock validada localmente).
- [x] Fases 5.5L-4R, 5.5L-4S, 5.5L-4T e 5.5L-4U de correcoes documentais concluidas.
- [x] Decisao humana tomada: manter e versionar a pasta scripts/ no Git.
- [x] Criacao dos arquivos documentais TASKS.md e ACCEPTANCE_CRITERIA.md (Fase 5.5L-4W).
- [x] Planejamento documental de taxas e custos logisticos do Mercado Livre (Fase 5.5L-6A) concluido.
- [x] Implementacao local e mockada de helpers e testes unitarios offline do Mercado Livre em Deno (Fase 5.5L-6B/C) concluida.
- [x] Implementacao da Edge Function mockada mercado-livre-fees-quote e testes HTTP locais (Fase 5.5L-6D) concluida e commitada.
- [x] Planejamento documental do simulador local independente do Mercado Livre (Fase 5.5L-6E) concluido e comitado.
- [x] Simulador Mercado Livre Local/Mockado Independente no Frontend (Fase 5.5L-6F) - Concluido e comitado.
  - [x] Ajustar o script `scripts/codex-responder-antigravity.ps1` para usar UTF-8 na leitura e saida.
  - [x] Classificar `head_custos.tsx` e `temp_diff_service.txt` como arquivos temporarios untracked proibidos para stage/commit.
- [/] Planejamento da Abstracao de Provedores de Taxas do Mercado Livre (Fase 5.5L-6G) - Em andamento.
  - [x] 5.5L-6G.1: Planejamento documental e formalizacao (Concluido e comitado).
  - [x] 5.5L-6G.2: Criacao dos tipos TypeScript e interface do provedor (Concluido e comitado no commit 18972ea).
  - [/] 5.5L-6G.3: Criacao do provedor local mockado delegando para a funcao existente (Implementacao concluida, aguardando nova auditoria do Codex.).
  - [ ] 5.5L-6G.4: Injecao do provedor em CustosMargem.tsx.
  - [ ] 5.5L-6G.5: Testes de contrato e regressao.
  - [ ] 5.5L-6G.6: Extracao final da logica e remocao de compatibilidade (apos aprovacao).

## Tarefas de Controle Pendentes
- [x] Obter veredito final favoravel na auditoria tecnica do Codex para a Fase 5.5L-6G.1 (Documental).
- [x] Obter veredito final favoravel na auditoria tecnica do Codex para a Fase 5.5L-6G.2 (Tipos/Interface).
- [ ] Obter veredito final favoravel na auditoria tecnica do Codex para a Fase 5.5L-6G.3 (Provedor Local).
