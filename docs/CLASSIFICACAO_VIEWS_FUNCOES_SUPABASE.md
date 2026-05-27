# Classificação de Views e Funções do Supabase — Agentes Primely Store

## 1. Objetivo deste documento

Este documento registra a classificação inicial das views e funções existentes no schema `public` do Supabase do projeto **Agentes Primely Store / PrimelyStore-App-V2**.

O objetivo é organizar a arquitetura do banco, separando os objetos por finalidade, para evitar que o projeto fique confuso conforme novas integrações e relatórios forem adicionados.

Esta classificação foi criada durante a **Etapa 135 — Parte 2B**.

Importante: este documento é apenas uma organização técnica. Nenhuma view ou função deve ser removida apenas com base nesta classificação. Antes de qualquer remoção futura, será necessário confirmar se o objeto é usado pelo frontend, por Edge Functions, por automações n8n ou por outras funções do banco.

---

## 2. Diagnóstico geral

O banco possui diversas views e funções porque o sistema já controla operações reais de:

- Compras
- Vendas
- Estoque
- Lotes
- FIFO
- Movimentações
- Olist
- Amazon FBA
- Auditoria
- Dashboard
- Alertas
- Segurança

A existência dessas funções e views não é, por si só, um problema. Em um sistema com estoque por lote, FIFO e integrações externas, parte importante da regra de negócio precisa ficar protegida no banco, e não apenas no frontend.

O principal ponto de atenção não é remover funções, mas sim:

- Documentar a finalidade de cada grupo.
- Evitar duplicidade desnecessária.
- Confirmar quais views são realmente usadas pelo frontend.
- Separar objetos permanentes de objetos temporários.
- Consolidar a estrutura do banco em migrations oficiais.

---

## 3. Classificação das funções

### 3.1 Funções críticas de estoque e FIFO

Estas funções fazem parte do núcleo crítico do sistema e devem ser mantidas.

Funções:

- `baixar_estoque_venda_fifo`
- `baixar_estoque_venda_item_fifo`
- `consumir_lotes_fifo`
- `gerar_lote_compra_item`
- `receber_compra`
- `receber_item_compra`
- `transferir_estoque_fifo`
- `transferir_lotes_fifo`
- `validar_venda_baixa_fifo`
- `validar_compra_para_recebimento`

Finalidade:

- Impedir estoque negativo.
- Evitar baixa duplicada.
- Garantir baixa FIFO por venda.
- Garantir transferência FIFO entre locais.
- Gerar lotes de compra.
- Receber compras com segurança.
- Bloquear recebimento de compra sem local de destino.
- Bloquear recebimento de NF antiga ou compra divergente.

Recomendação:

Manter e documentar em detalhes. Essas funções são parte essencial da integridade operacional do sistema.

---

### 3.2 Funções de integração com Olist

Estas funções transformam dados brutos do Olist em dados oficiais do Primely.

Funções:

- `processar_olist_pedidos_snapshot`
- `processar_olist_pedidos_pendentes_com_baixa_fifo`
- `processar_olist_notas_entrada_para_compras`
- `criar_carga_inicial_olist`

Finalidade:

- Converter pedidos do Olist em vendas Primely.
- Converter itens de pedidos em itens de venda.
- Processar baixa FIFO de pedidos importados.
- Converter notas fiscais de entrada do Olist em compras.
- Criar carga inicial de estoque a partir do Olist.

Recomendação:

Manter. Estas funções são centrais para o fluxo em que o Olist funciona como base operacional.

---

### 3.3 Função de custo operacional

Função:

- `calcular_custo_prep_center`

Finalidade:

Calcular custos ligados ao Prep Center, que afetam o custo real, a margem e a lucratividade dos produtos.

Recomendação:

Manter. O custo do Prep Center é importante para relatórios de margem, ROI e precificação.

---

### 3.4 Função de auditoria

Função:

- `registrar_evento_auditoria`

Finalidade:

Registrar eventos relevantes para rastreabilidade e auditoria do sistema.

Recomendação:

Manter. Em uma etapa futura, verificar se as principais operações já chamam esta função ou se ela ainda precisa ser integrada aos fluxos críticos.

---

### 3.5 Funções de segurança e permissões

Funções:

- `criar_perfil_usuario_auth`
- `usuario_atual_perfil`
- `usuario_e_admin`
- `usuario_tem_papel`
- `usuario_pode_acessar_financeiro`
- `usuario_pode_escrever_financeiro`
- `usuario_pode_escrever_operacional`
- `usuario_pode_executar_integracao`
- `usuario_pode_gerenciar_usuarios`
- `usuario_pode_ler_auditoria`
- `usuario_pode_ler_operacional`
- `usuario_pode_registrar_auditoria`

Finalidade:

- Controlar perfis de usuário.
- Apoiar regras de permissão.
- Apoiar RLS no Supabase.
- Separar permissões operacionais, financeiras, administrativas e de integração.

Recomendação:

Manter. Futuramente deve haver uma etapa específica para revisar RLS, permissões e perfis.

---

### 3.6 Função auxiliar técnica

Função:

- `set_updated_at`

Finalidade:

Atualizar automaticamente o campo `updated_at` em tabelas que utilizam triggers.

Recomendação:

Manter. É uma função técnica comum e útil.

---

## 4. Classificação das views

### 4.1 Views de núcleo operacional

Views:

- `compras_resumo`
- `vendas_resumo`
- `estoque_lotes_detalhado`
- `movimentacoes_estoque_detalhado`
- `saldos_estoque`
- `vendas_itens_custo_real`
- `vendas_resumo_custo_real`

Finalidade:

- Facilitar telas operacionais.
- Exibir compras e vendas resumidas.
- Exibir lotes com informações detalhadas.
- Exibir movimentações de estoque de forma legível.
- Calcular saldos por produto/local.
- Exibir custo real nas vendas.

Recomendação:

Manter. Essas views apoiam a operação principal do sistema.

---

### 4.2 Views de compras e Olist

Views:

- `olist_compras_auditoria`
- `olist_compras_itens_auditoria`
- `olist_notas_entrada_conferencia`
- `olist_notas_entrada_itens_conferencia`
- `olist_notas_entrada_resumo_processamento`
- `compras_controle_recebimento_publico`
- `compras_itens_custo_rateado_preview`

Finalidade:

- Auditar notas fiscais de entrada do Olist.
- Conferir vínculo de fornecedor e produto.
- Conferir valores da NF contra a compra.
- Conferir conversão de unidade.
- Conferir impostos que entram no custo.
- Expor o controle de recebimento para o frontend.
- Apoiar análise de custo rateado.

Recomendação:

Manter. A view `compras_itens_custo_rateado_preview` deve ser revisada futuramente para confirmar se ainda está em uso ou se virou apenas prévia de desenvolvimento.

---

### 4.3 Views de vendas e FIFO

View:

- `vendas_pendentes_baixa_fifo`

Finalidade:

Identificar vendas pendentes de baixa FIFO, vendas com estoque insuficiente ou itens ainda não baixados.

Recomendação:

Manter. É importante para alertas operacionais.

---

### 4.4 Views de dashboard e alertas

Views:

- `dashboard_alertas_operacionais`
- `dashboard_alertas_resumo`
- `dashboard_alertas_vendas_pendentes_baixa`
- `dashboard_kpis_gerais`
- `dashboard_resumo_executivo`
- `dashboard_saude_sistema`
- `sistema_status_geral`

Finalidade:

- Exibir indicadores no dashboard.
- Monitorar saúde do sistema.
- Alertar vendas pendentes de baixa.
- Mostrar problemas operacionais.
- Resumir indicadores gerais.

Recomendação:

Manter. Em etapa futura, confirmar quais views são usadas diretamente pelo frontend e consolidar se houver duplicidade.

---

### 4.5 Views de produtos, margem e curva ABC

Views:

- `produtos_curva_abc`
- `produtos_curva_abc_custo_real`
- `produtos_dashboard`
- `produtos_dashboard_custo_real`
- `produtos_dashboard_gerencial`
- `produtos_dashboard_precificacao`
- `produtos_desempenho_vendas`
- `produtos_desempenho_vendas_custo_real`
- `produtos_precificacao_calculo`
- `produtos_resumo_estoque`

Finalidade:

- Apoiar relatórios gerenciais.
- Identificar produtos mais vendidos.
- Calcular curva ABC.
- Calcular custo real por produto.
- Apoiar precificação.
- Apoiar análise de margem.
- Mostrar resumo de estoque por produto.

Recomendação:

Manter por enquanto. Este grupo é importante para o objetivo final do sistema, mas deve passar por revisão futura porque há views parecidas com e sem `custo_real`.

---

### 4.6 Views de conciliação Olist, Amazon e Primely

Views:

- `amazon_olist_primely_fba_conciliacao`
- `olist_amazon_fba_conciliacao`
- `olist_x_primely_estoque_local_conciliacao`
- `olist_depositos_mapeamento_view`
- `olist_estoque_depositos_locais_view`
- `conciliacao_estoque_movimentacoes_lotes`

Finalidade:

- Comparar estoque entre Olist, Amazon e Primely.
- Conferir divergências de estoque por local.
- Validar depósitos do Olist contra locais de estoque do Primely.
- Conferir consistência entre movimentações e lotes.

Recomendação:

Manter. Futuramente revisar se há sobreposição entre views de conciliação Amazon/Olist/Primely.

---

### 4.7 Views de segurança e auditoria

Views:

- `auditoria_eventos_detalhado`
- `seguranca_funcoes_diagnostico`
- `seguranca_rls_diagnostico`
- `usuarios_perfis_permissoes`

Finalidade:

- Apoiar governança.
- Diagnosticar permissões.
- Diagnosticar funções e RLS.
- Exibir perfis e permissões de usuários.

Recomendação:

Manter. Estas views serão úteis em etapa futura de segurança.

---

## 5. Views marcadas para revisão futura

As views abaixo não devem ser removidas agora, mas devem ser revisadas futuramente para verificar se ainda são usadas ou se são versões intermediárias:

- `compras_itens_custo_rateado_preview`
- `produtos_dashboard`
- `produtos_dashboard_custo_real`
- `produtos_dashboard_gerencial`
- `produtos_desempenho_vendas`
- `produtos_desempenho_vendas_custo_real`
- `vendas_resumo`
- `vendas_resumo_custo_real`
- `olist_amazon_fba_conciliacao`
- `amazon_olist_primely_fba_conciliacao`

Motivo:

Algumas parecem versões evolutivas ou pares com e sem custo real. Antes de qualquer limpeza, será necessário confirmar uso no frontend, nos services, nas Edge Functions e em eventuais automações.

---

## 6. Recomendações

### 6.1 Não apagar objetos agora

Nenhuma função ou view deve ser apagada neste momento.

A etapa atual é de organização e documentação.

### 6.2 Confirmar uso antes de remover

Antes de remover qualquer view ou função, verificar:

- Uso no frontend.
- Uso nos services.
- Uso em Edge Functions.
- Uso em outras funções SQL.
- Uso em automações n8n.
- Uso em relatórios manuais ou consultas recorrentes.

### 6.3 Consolidar views duplicadas futuramente

Views parecidas devem ser comparadas, especialmente as de produtos, vendas e conciliações.

O objetivo futuro é ter menos views duplicadas e mais views oficiais bem nomeadas.

### 6.4 Documentar funções críticas

As funções de FIFO, recebimento, baixa de venda e processamento Olist precisam de documentação própria, explicando:

- Entrada da função.
- O que ela altera.
- Quais tabelas são afetadas.
- Quais erros ela bloqueia.
- Como testar com segurança.

---

## 7. Conclusão

A análise inicial indica que as views e funções existentes fazem sentido para um sistema real de gestão operacional de marketplace com Olist, Amazon, estoque por local, lotes e FIFO.

O principal problema não é excesso de funções, mas falta de classificação, documentação e consolidação.

A recomendação é manter os objetos atuais, documentar seu papel e, em etapa futura, revisar duplicidades com base no uso real do sistema.
