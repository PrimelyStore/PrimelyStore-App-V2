# Arquitetura Oficial — Primely Store V3

## 1. Visão geral

A arquitetura do Primely Store deve separar claramente:

```txt
Operação diária       → Olist/Tiny
Inteligência gerencial → Primely Store
Base analítica         → Supabase/PostgreSQL
Integração segura      → Edge Functions / n8n
Fontes externas        → Amazon SP-API, Keepa, Mercado Livre API
```

---

## 2. Fluxo oficial de dados

```txt
Olist/Tiny
  ↓
Edge Functions / n8n
  ↓
Supabase snapshots e logs
  ↓
Views / RPCs analíticas
  ↓
Services React
  ↓
Páginas e dashboards do Primely Store
  ↓
Alertas, relatórios e decisões
```

---

## 3. Camadas do sistema

### 3.1. Frontend

Tecnologias:

```txt
React
Vite
TypeScript
Tailwind CSS
```

Responsabilidades:

- Exibir telas;
- Aplicar filtros;
- Exibir cards, tabelas, gráficos e alertas;
- Consumir services;
- Mostrar estados de carregamento, vazio e erro;
- Ser responsivo.

Não deve:

- Guardar tokens secretos;
- Chamar APIs sensíveis diretamente;
- Ter regras críticas de negócio espalhadas nos componentes;
- Executar cálculos pesados que deveriam ficar em view/RPC.

---

### 3.2. Services

Local recomendado:

```txt
src/services/
```

Responsabilidades:

- Consultar Supabase;
- Chamar Edge Functions quando necessário;
- Centralizar acesso a dados;
- Tipar retornos;
- Evitar chamadas Supabase soltas dentro das páginas.

Exemplos:

```txt
dashboardService.ts
estoqueService.ts
vendasService.ts
curvaAbcService.ts
integracoesService.ts
custosService.ts
conciliacaoService.ts
```

---

### 3.3. Supabase/PostgreSQL

Responsabilidades:

- Guardar snapshots;
- Guardar logs de sincronização;
- Guardar configurações;
- Criar views e RPCs para consultas gerenciais;
- Consolidar indicadores;
- Apoiar conciliações;
- Apoiar alertas.

Regra:

```txt
O banco pode calcular indicadores gerenciais, mas não deve virar ERP operacional paralelo ao Olist/Tiny.
```

---

### 3.4. Edge Functions

Responsabilidades:

- Proteger credenciais;
- Chamar APIs externas;
- Validar usuário ou token interno;
- Registrar logs;
- Padronizar erros;
- Executar integrações com segurança.

Não deve:

- Expor tokens ao frontend;
- Rodar processos longos sem controle;
- Fazer alterações operacionais em massa sem confirmação.

---

### 3.5. n8n

Responsabilidades futuras:

- Agendar sincronizações;
- Enviar alertas;
- Gerar relatórios automáticos;
- Integrar com Telegram;
- Orquestrar agentes de IA.

---

## 4. Módulos oficiais

### 4.1. Integrações e Saúde dos Dados

Primeiro módulo recomendado para implementação/revisão.

Deve mostrar:

- status Olist;
- status Amazon;
- status Keepa;
- status n8n;
- status Telegram;
- última sincronização;
- total importado;
- erros recentes;
- logs;
- tokens próximos de expirar, quando aplicável.

---

### 4.2. Dashboard Gerencial

Deve mostrar visão executiva da empresa.

Indicadores:

- faturamento;
- pedidos;
- vendas por canal;
- estoque por origem;
- margem estimada;
- top produtos;
- alertas;
- divergências.

---

### 4.3. Estoque Consolidado

Deve mostrar o estoque como análise gerencial.

Fontes:

- Olist Depósito Geral;
- Olist FBA;
- Amazon FBA;
- Mercado Livre Full, quando integrado.

---

### 4.4. Vendas Analíticas

Deve analisar vendas e pedidos por:

- período;
- marketplace;
- canal;
- produto;
- logística;
- status;
- receita;
- quantidade;
- margem estimada.

---

### 4.5. Custos e Margem

Base para lucro, ROI e Curva ABC.

Deve controlar ou consolidar:

- custo do produto;
- taxa marketplace;
- imposto;
- frete;
- FBA/Full;
- Prep Center;
- embalagem;
- Ads;
- outros custos variáveis.

---

### 4.6. Curva ABC Inteligente

Módulo estratégico para tomada de decisão.

Deve cruzar:

- faturamento;
- lucro;
- margem;
- volume;
- estoque;
- giro;
- Ads;
- ROI;
- TACOS;
- ACOS.

---

### 4.7. Conciliações

Deve identificar divergências entre:

- Olist x Amazon FBA;
- Olist x Mercado Livre Full;
- produtos Olist x produtos internos;
- SKUs sem vínculo;
- produtos sem custo;
- produtos sem ASIN/EAN.

---

## 5. Boas práticas de arquitetura

- Não criar página sem saber qual service/view alimenta os dados.
- Não criar tabela nova sem classificar sua finalidade.
- Não criar cálculo importante apenas no frontend.
- Não duplicar regra de negócio.
- Não automatizar fluxo operacional sensível sem auditoria.
- Sempre documentar decisão técnica importante.
