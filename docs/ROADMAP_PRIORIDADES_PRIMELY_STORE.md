# Roadmap e Prioridades — Agentes Primely Store

## 1. Objetivo deste documento

Este documento organiza as próximas prioridades do projeto Agentes Primely Store, evitando que o sistema cresça de forma desordenada.

A finalidade é separar claramente:

- o que é consolidação técnica;
- o que é melhoria operacional;
- o que é relatório gerencial;
- o que é integração externa;
- o que é automação com n8n;
- o que deve ser evitado por enquanto.

O objetivo principal continua sendo:

```txt
Olist como centro operacional
Primely Store como sistema de gestão, auditoria, estoque, custo, margem e decisão
Amazon, Mercado Livre, Keepa, n8n e agentes de IA como integrações estratégicas
```

---

## 2. Princípios de prioridade

Antes de criar novas tabelas, funções ou telas, seguir estes princípios:

1. Não criar função nova se uma função existente puder ser ajustada com segurança.
2. Não criar tabela nova sem definir se ela é operacional, integração, configuração, auditoria ou temporária.
3. Não criar tela nova antes de saber qual view/service irá alimentar os dados.
4. Não automatizar recebimento, baixa ou estoque sem auditoria.
5. Não misturar dados brutos de integração com dados oficiais do Primely.
6. Não avançar para integrações novas sem consolidar o núcleo atual.
7. Toda regra crítica deve ficar protegida no banco, e não apenas no frontend.
8. Toda alteração permanente deve ter migration versionada.
9. Toda melhoria deve ser pequena, testável e reversível.
10. Toda etapa sensível deve ter checkpoint no GitHub.

---

## 3. Prioridade 1 — Consolidação técnica

Essa é a prioridade mais importante antes de expandir para Keepa, Mercado Livre direto ou relatórios avançados.

### 3.1 Consolidar migrations do banco

Problema atual:

```txt
O banco atual possui mais estrutura do que as migrations locais conseguem recriar.
```

Risco:

```txt
Um novo ambiente Supabase não será recriado completamente apenas com as migrations existentes.
```

Ações recomendadas:

- gerar inventário completo dos objetos permanentes;
- separar backups temporários;
- identificar tabelas oficiais;
- identificar views oficiais;
- identificar funções oficiais;
- criar migration base consolidada ou dump controlado da estrutura oficial;
- documentar a ordem correta das migrations.

Status:

```txt
Pendente
```

---

### 3.2 Organizar backups temporários

Problema atual:

```txt
Existem muitas tabelas backup_% no schema public.
```

Elas foram úteis durante o desenvolvimento, mas não fazem parte do sistema final.

Ações recomendadas:

- listar todos os backups;
- classificar por etapa;
- confirmar se ainda são necessários;
- exportar se necessário;
- mover para schema separado como backup_dev ou remover depois de checkpoint seguro;
- evitar novos backups permanentes no public.

Status:

```txt
Pendente
```

---

### 3.3 Documentar funções críticas

Funções críticas:

- `receber_item_compra`
- `receber_compra`
- `gerar_lote_compra_item`
- `baixar_estoque_venda_fifo`
- `baixar_estoque_venda_item_fifo`
- `consumir_lotes_fifo`
- `transferir_estoque_fifo`
- `transferir_lotes_fifo`
- `validar_venda_baixa_fifo`
- `validar_compra_para_recebimento`
- `processar_olist_pedidos_pendentes_com_baixa_fifo`
- `processar_olist_notas_entrada_para_compras`

Ações recomendadas:

- documentar entrada, saída e efeito de cada função;
- indicar quais tabelas cada função altera;
- indicar riscos;
- indicar pré-condições;
- indicar quando usar e quando não usar.

Status:

```txt
Pendente
```

---

### 3.4 Revisar duplicidade de views

Views que merecem revisão futura:

- `produtos_dashboard`
- `produtos_dashboard_custo_real`
- `produtos_dashboard_gerencial`
- `produtos_desempenho_vendas`
- `produtos_desempenho_vendas_custo_real`
- `vendas_resumo`
- `vendas_resumo_custo_real`
- `olist_amazon_fba_conciliacao`
- `amazon_olist_primely_fba_conciliacao`

Ação recomendada:

- verificar quais são usadas no frontend;
- verificar quais alimentam services;
- consolidar somente depois de validação;
- não remover agora.

Status:

```txt
Pendente
```

---

## 4. Prioridade 2 — Operação segura de compras e estoque

### 4.1 Finalizar fluxo de classificação de compras Olist

Já existe:

- `compras_controle_recebimento`;
- bloqueio de NF antiga no banco;
- aviso visual na tela Compras;
- botão bloqueado para histórico fiscal.

Próximos passos:

- criar ação segura para mudar classificação da compra;
- permitir classificar como:
  - `recebimento_real`;
  - `historico_fiscal_sem_entrada_estoque`;
  - `pendente_conferencia_operacional`;
- garantir que novas NFs Olist entrem como `pendente_conferencia_operacional`;
- permitir liberar recebimento apenas após conferência.

Status:

```txt
Parcialmente concluído
```

---

### 4.2 Melhorar tela Compras

Melhorias recomendadas:

- filtro por NF;
- filtro por fornecedor;
- filtro por status;
- filtro por classificação operacional;
- destaque para NF histórica;
- destaque para compra pendente de conferência;
- exibição de auditoria da NF;
- botão para classificar compra;
- modal de confirmação antes de liberar recebimento real.

Status:

```txt
Pendente
```

---

### 4.3 Criar tela ou painel de conferência de compras Olist

Objetivo:

Mostrar claramente:

- NF;
- fornecedor;
- itens;
- unidade original;
- quantidade convertida;
- custo unitário;
- impostos que entram no custo;
- diferença entre NF e compra;
- status de auditoria;
- classificação operacional;
- se pode ou não receber.

Status:

```txt
Pendente
```

---

## 5. Prioridade 3 — Relatórios gerenciais de produtos

Essa prioridade conversa diretamente com o objetivo principal do sistema.

### 5.1 Criar painel gerencial de produtos

Objetivo:

Responder perguntas como:

- quais produtos vendem mais;
- quais têm maior margem;
- quais têm menor margem;
- quais estão parados;
- quais estão sem estoque;
- quais estão com excesso de estoque;
- quais são curva A, B e C;
- qual é o custo real de cada produto;
- qual o estoque por local.

Views candidatas:

- `produtos_curva_abc`
- `produtos_curva_abc_custo_real`
- `produtos_dashboard_gerencial`
- `produtos_dashboard_custo_real`
- `produtos_desempenho_vendas_custo_real`
- `produtos_resumo_estoque`
- `saldos_estoque`

Status:

```txt
Pendente
```

---

### 5.2 Criar relatório de margem por produto

Campos recomendados:

- SKU;
- produto;
- canal;
- quantidade vendida;
- receita bruta;
- custo FIFO;
- taxas;
- impostos;
- custo prep center;
- lucro estimado;
- margem;
- ROI.

Observação:

Algumas informações ainda dependem de integração futura com taxas reais da Amazon/Olist/Mercado Livre.

Status:

```txt
Pendente
```

---

### 5.3 Criar curva ABC

Objetivo:

Classificar produtos por relevância de venda, faturamento ou lucro.

Possíveis critérios:

- faturamento;
- quantidade vendida;
- lucro bruto;
- margem de contribuição;
- giro de estoque.

Status:

```txt
Pendente
```

---

### 5.4 Criar alerta de reposição

Objetivo:

Identificar produtos que precisam de compra ou reposição.

Critérios futuros:

- estoque atual;
- vendas médias;
- lead time do fornecedor;
- estoque mínimo;
- estoque em trânsito;
- estoque por local;
- prazo de envio para FBA ou Full.

Status:

```txt
Pendente
```

---

## 6. Prioridade 4 — Integração Amazon

### 6.1 Consolidar estoque FBA

Já existe:

- `amazon_fba_estoque_snapshot`;
- Edge Function `amazon-spapi-fba-inventory`;
- views de conciliação.

Próximos passos:

- validar sincronização recorrente;
- mapear SKU Amazon x SKU Primely;
- comparar estoque Amazon x Olist x Primely;
- gerar alertas de divergência.

Status:

```txt
Parcialmente iniciado
```

---

### 6.2 Integrar taxas e custos Amazon

Objetivo:

Trazer ou calcular:

- referral fee;
- fulfillment fee;
- storage fee quando aplicável;
- outras taxas FBA;
- custo final por venda;
- margem por SKU vendido na Amazon.

Status:

```txt
Futuro
```

---

### 6.3 Relatórios Amazon

Possíveis relatórios:

- vendas por SKU;
- inventário FBA;
- pagamentos;
- taxas;
- performance;
- devoluções;
- reembolsos;
- anúncios.

Status:

```txt
Futuro
```

---

## 7. Prioridade 5 — Integração Keepa

Keepa ainda não possui estrutura dedicada no banco.

### 7.1 Primeira fase Keepa

Objetivo:

Criar base para análise de produtos Amazon.

Dados desejados:

- ASIN;
- preço atual;
- histórico de preço;
- BSR;
- histórico de BSR;
- estimativa de vendas;
- concorrência;
- Buy Box;
- número de ofertas;
- reviews;
- rating.

Status:

```txt
Futuro
```

---

### 7.2 Uso gerencial do Keepa

Objetivo:

Ajudar em:

- mineração de produtos;
- precificação;
- análise de concorrência;
- análise de tendência;
- decisão de compra;
- alerta de queda/subida de preço;
- alerta de oportunidade.

Status:

```txt
Futuro
```

---

## 8. Prioridade 6 — Mercado Livre

No estágio atual, Mercado Livre é tratado principalmente via Olist.

### 8.1 Avaliar necessidade de integração direta

Antes de integrar direto, responder:

- O Olist já entrega os pedidos necessários?
- O Olist já entrega estoque suficiente?
- Existe divergência relevante com Mercado Livre?
- Precisa controlar Mercado Livre Full/Flex separado?
- Precisa de dados que o Olist não fornece?

Status:

```txt
Futuro
```

---

## 9. Prioridade 7 — n8n e agentes de IA

O n8n deve ser usado como camada de automação, não como substituto do banco.

Possíveis automações:

- sincronização agendada Olist;
- sincronização Amazon;
- alertas de estoque baixo;
- alertas de venda sem baixa;
- alertas de divergência;
- envio de relatórios por WhatsApp/Telegram/e-mail;
- agente de análise de produtos;
- agente de reposição;
- agente de margem;
- agente de conciliação.

Status:

```txt
Futuro
```

---

## 10. Prioridade 8 — Interface e usabilidade

### 10.1 Criar componentes reutilizáveis

Componentes recomendados:

- `BadgeStatus`
- `CardResumo`
- `TabelaPadrao`
- `BotaoAcao`
- `ModalConfirmacao`
- `FiltroPeriodo`
- `FiltroProduto`
- `ResumoFinanceiro`
- `StatusRecebimento`
- `StatusAuditoria`

Status:

```txt
Futuro
```

---

### 10.2 Melhorar navegação

Criar ou revisar menus para:

- Operação;
- Estoque;
- Compras;
- Vendas;
- Integrações;
- Relatórios;
- Configurações;
- Auditoria.

Status:

```txt
Futuro
```

---

## 11. O que evitar agora

Evitar neste momento:

- criar integração Keepa antes de consolidar banco;
- criar integração Mercado Livre direta sem necessidade clara;
- apagar tabelas `backup_%` sem plano;
- remover views sem verificar uso no frontend;
- criar novas funções sem documentação;
- alterar fluxo de estoque sem backup;
- receber NFs antigas;
- automatizar recebimento de compras sem classificação operacional;
- depender apenas do frontend para bloquear ações críticas.

---

## 12. Roadmap resumido recomendado

### Etapa 135 — Consolidação

- Documentar arquitetura;
- classificar tabelas;
- classificar views e funções;
- definir prioridades;
- planejar limpeza de backups;
- planejar migration base consolidada.

### Etapa 136 — Controle operacional de compras Olist

- criar função segura para classificar compra;
- ajustar processamento para novas NFs entrarem como pendentes;
- melhorar tela Compras.

### Etapa 137 — Relatórios gerenciais de produtos

- tela de produtos gerenciais;
- curva ABC;
- margem por produto;
- estoque por local;
- produtos parados;
- alerta de reposição.

### Etapa 138 — Consolidação de estoque e conciliação

- revisar saldos Primely;
- conciliar Olist x Primely;
- conciliar Amazon FBA x Olist x Primely;
- alertas de divergência.

### Etapa 139 — Amazon avançado

- taxas;
- vendas;
- relatórios;
- margem real por venda Amazon.

### Etapa 140 — Keepa

- snapshots;
- histórico;
- análise de concorrência;
- mineração de produtos.

### Etapa 141 — n8n e agentes

- alertas;
- relatórios automáticos;
- agentes de decisão;
- automações operacionais.

---

## 13. Conclusão

O sistema está no caminho certo, mas a prioridade agora deve ser organização, consolidação e relatórios gerenciais antes de novas integrações grandes.

A ordem recomendada é:

```txt
1. Consolidar o que já existe.
2. Garantir que o banco possa ser recriado.
3. Reduzir ruído de backups temporários.
4. Melhorar compras/estoque com segurança.
5. Criar relatórios gerenciais úteis.
6. Depois avançar para Keepa, Amazon avançado, Mercado Livre direto e n8n.
```

Essa ordem evita crescimento desorganizado e mantém o sistema alinhado ao objetivo principal da operação Primely Store.
