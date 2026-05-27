# Classificação das Tabelas do Supabase — Agentes Primely Store

## 1. Objetivo deste documento

Este documento classifica as tabelas atuais do schema `public` do Supabase do projeto Agentes Primely Store.

A finalidade é separar claramente:

- tabelas oficiais do núcleo operacional;
- tabelas de integração externa;
- tabelas de configuração e regras operacionais;
- tabelas de segurança/auditoria;
- tabelas temporárias de backup;
- tabelas que devem ser revisadas futuramente.

Esta documentação não apaga nem altera nenhuma tabela. Ela serve apenas como mapa técnico e operacional.

---

## 2. Diagnóstico geral

Na auditoria da Etapa 135 foram identificadas:

- 77 tabelas base no schema `public`;
- 42 tabelas com prefixo `backup_%`;
- 42 views;
- 29 funções RPC/trigger.

O principal ponto de atenção é que boa parte do volume aparente do banco vem de tabelas temporárias de backup criadas durante as etapas de segurança.

As tabelas de backup foram úteis durante o desenvolvimento, mas não fazem parte do núcleo oficial do sistema.

---

## 3. Tabelas oficiais do núcleo operacional

Estas tabelas representam o dado oficial do Primely Store e devem ser mantidas.

### 3.1 Cadastros principais

- `produtos`
- `fornecedores`
- `produtos_fornecedores`
- `produtos_precificacao`
- `canais_venda`
- `locais_estoque`

### 3.2 Compras

- `compras`
- `compras_itens`

Essas tabelas armazenam compras oficiais do Primely, sejam compras manuais ou compras geradas a partir de notas fiscais de entrada importadas do Olist.

### 3.3 Vendas

- `vendas`
- `vendas_itens`
- `vendas_itens_lotes`

Essas tabelas controlam vendas, itens vendidos e vínculo com lotes consumidos pelo FIFO.

### 3.4 Estoque, lotes e movimentações

- `estoque_lotes`
- `movimentacoes_estoque`

Essas tabelas são críticas para o controle de estoque real por local, lote e movimentação.

### Recomendação

Essas tabelas devem ser tratadas como núcleo permanente do sistema.

Não devem ser removidas, renomeadas ou alteradas sem planejamento, backup e migration versionada.

---

## 4. Tabelas de integração Olist

Essas tabelas armazenam dados recebidos do Olist ou mapeamentos entre o Olist e o Primely.

- `olist_oauth_tokens`
- `olist_produtos_snapshot`
- `olist_depositos_snapshot`
- `olist_depositos_locais_estoque`
- `olist_estoque_depositos_snapshot`
- `olist_pedidos_snapshot`
- `olist_pedidos_itens_snapshot`
- `olist_pedidos_sync_log`
- `olist_notas_entrada_snapshot`
- `olist_notas_entrada_itens_snapshot`
- `olist_notas_entrada_sync_log`
- `olist_fornecedores_snapshot`
- `olist_canais_venda_mapeamento`

### Função no sistema

Essas tabelas não substituem o núcleo operacional. Elas guardam snapshots, logs e mapeamentos vindos do Olist.

Fluxos principais:

```txt
Olist pedidos
↓
olist_pedidos_snapshot / olist_pedidos_itens_snapshot
↓
vendas / vendas_itens
↓
baixa FIFO
```

```txt
Olist notas de entrada
↓
olist_notas_entrada_snapshot / olist_notas_entrada_itens_snapshot
↓
compras / compras_itens
↓
recebimento quando for compra real
```

### Recomendação

Manter.

Essas tabelas são importantes para auditoria, rastreabilidade, reprocessamento controlado e comparação entre Olist e Primely.

---

## 5. Tabelas de integração Amazon

Tabela identificada:

- `amazon_fba_estoque_snapshot`

### Função no sistema

Armazena snapshots de estoque Amazon FBA vindos da integração Amazon SP-API.

### Recomendação

Manter.

A integração Amazon ainda está em fase inicial/intermediária. Futuramente podem surgir novas tabelas para taxas, pedidos, relatórios financeiros, anúncios e performance por SKU.

---

## 6. Mercado Livre e Keepa

### Mercado Livre

No estágio atual, não foi identificada tabela dedicada a uma integração direta com Mercado Livre.

O Mercado Livre parece estar sendo tratado indiretamente pelo Olist, quando vendas e estoque passam por lá.

### Keepa

No estágio atual, não foi identificada tabela dedicada ao Keepa.

### Recomendação futura

Quando essas integrações forem implementadas, criar tabelas específicas para snapshots e histórico, evitando misturar dados externos diretamente nas tabelas operacionais.

Possíveis futuras tabelas:

- `keepa_produtos_snapshot`
- `keepa_historico_precos`
- `keepa_historico_bsr`
- `keepa_concorrentes_snapshot`
- `mercadolivre_pedidos_snapshot`
- `mercadolivre_estoque_snapshot`

Esses nomes são apenas sugestões futuras e não devem ser considerados existentes no banco atual.

---

## 7. Tabelas de configuração e regras operacionais

Estas tabelas guardam regras de negócio configuráveis.

- `configuracoes_operacao`
- `custos_prep_center`
- `config_custo_fiscal_compra`
- `produto_fornecedor_conversao_unidade`
- `compras_controle_recebimento`

### 7.1 `config_custo_fiscal_compra`

Define quais impostos entram ou não no custo da compra.

Regras iniciais:

- IPI entra no custo quando compõe o total da NF.
- ICMS-ST entra no custo por rateio nos CFOPs configurados.
- ICMS normal, PIS, COFINS e Simples não entram automaticamente no custo.

### 7.2 `produto_fornecedor_conversao_unidade`

Controla conversão de unidade da NF para unidade vendável.

Exemplo validado:

```txt
Fornecedor Flaps
Unidade NF: cx12
Fator de conversão: 12
```

### 7.3 `compras_controle_recebimento`

Classifica compras quanto ao recebimento operacional.

Classificações atuais:

- `recebimento_real`
- `historico_fiscal_sem_entrada_estoque`
- `pendente_conferencia_operacional`

Essa tabela evita que NFs antigas gerem estoque duplicado.

### Recomendação

Manter.

Essas tabelas são importantes para evitar regra fixa dentro do código e permitir evolução segura do sistema.

---

## 8. Tabelas de segurança, usuários e auditoria

Foram identificadas funções de segurança e auditoria no banco. As tabelas relacionadas a esse grupo devem ser mantidas e revisadas em etapa específica de segurança/RLS.

Exemplos de áreas envolvidas:

- perfis de usuário;
- permissões;
- auditoria de eventos;
- controle de acesso operacional, financeiro, integração e administração.

### Recomendação

Manter.

Antes de qualquer limpeza nessa área, deve ser feita uma etapa específica de segurança e permissões.

---

## 9. Tabelas temporárias de backup

Foram identificadas 42 tabelas com prefixo:

```txt
backup_%
```

Essas tabelas foram criadas durante as etapas de desenvolvimento para preservar dados antes de alterações sensíveis.

### Função atual

Serviram como segurança durante:

- ajustes de compras;
- ajustes de itens;
- recebimento de teste;
- rollback de recebimento;
- alterações fiscais;
- alterações de funções;
- alterações de snapshots.

### Classificação

Essas tabelas são classificadas como:

```txt
temporárias de desenvolvimento
```

Elas não fazem parte do núcleo oficial do sistema.

### Recomendação

Não apagar agora.

Fazer futuramente uma etapa específica para:

1. listar todos os backups;
2. confirmar quais ainda podem ser úteis;
3. exportar se necessário;
4. mover para um schema separado, como `backup_dev`, ou remover depois de checkpoint seguro;
5. evitar criar novos backups permanentes no schema `public`.

---

## 10. Tabelas que devem ser mantidas

Devem ser mantidas:

- tabelas do núcleo operacional;
- tabelas de integração Olist;
- tabela Amazon FBA snapshot;
- tabelas de configuração operacional;
- tabelas de segurança;
- tabelas de auditoria oficiais;
- tabelas relacionadas a estoque, lotes, vendas e compras.

Motivo:

Essas tabelas sustentam o objetivo principal do sistema:

```txt
controle operacional + estoque FIFO + integração Olist/Amazon + auditoria + relatórios gerenciais
```

---

## 11. Tabelas para revisar futuramente

Devem ser revisadas futuramente, sem apagar agora:

- tabelas `backup_%`;
- possíveis tabelas antigas de testes;
- tabelas não usadas diretamente por services ou views;
- estruturas duplicadas ou substituídas por versões mais novas.

A revisão deve ser feita somente depois de:

- backup completo;
- commit/push atualizado;
- documentação dos objetos;
- validação de que a tabela não é usada por função, view ou frontend.

---

## 12. Regras para futuras tabelas

Antes de criar uma nova tabela, verificar:

1. Ela pertence ao núcleo operacional?
2. É snapshot de integração?
3. É tabela de configuração?
4. É tabela de auditoria?
5. É temporária?
6. Precisa estar em `public`?
7. Deve ter migration?
8. Deve ter RLS?
9. Deve aparecer no frontend?
10. Deve ser documentada?

Toda tabela permanente deve ter migration versionada no projeto.

---

## 13. Recomendações arquiteturais

### 13.1 Separar backups do schema public

Criar no futuro um schema:

```txt
backup_dev
```

ou exportar backups antigos antes de remover.

### 13.2 Criar migration base consolidada

O banco atual tem mais estrutura do que as migrations locais conseguem recriar.

Recomendação:

- gerar inventário completo;
- classificar objetos oficiais;
- criar dump controlado da estrutura;
- ou criar migration base consolidada do sistema oficial.

### 13.3 Documentar tabelas por domínio

Organizar documentação em domínios:

- Cadastros
- Compras
- Vendas
- Estoque/FIFO
- Integrações Olist
- Integrações Amazon
- Configurações
- Auditoria
- Relatórios
- Segurança

---

## 14. Conclusão

O banco não está errado nem necessariamente inchado em sua estrutura operacional.

O que torna o schema grande hoje é principalmente a quantidade de tabelas temporárias de backup.

As tabelas oficiais estão coerentes com o objetivo do sistema:

```txt
Olist como centro operacional
Primely como painel de gestão e inteligência
Estoque por local, lote e FIFO
Compras e vendas auditadas
Conciliação com Amazon
Futuras integrações com Mercado Livre, Keepa, n8n e agentes de IA
```

A prioridade agora é manter a documentação atualizada, consolidar o que é permanente e tratar backups temporários em uma etapa própria.
