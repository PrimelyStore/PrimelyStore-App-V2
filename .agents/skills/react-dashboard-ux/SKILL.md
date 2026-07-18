---
name: react-dashboard-ux
description: Use para telas React/Vite/TypeScript/Tailwind, dashboards, tabelas, filtros, cards, gráficos, UX e responsividade.
---

# React Dashboard UX

## Objetivo

Criar telas gerenciais modernas, limpas, responsivas e fáceis de entender.

O foco visual do Primely Store é gestão de marketplace, tomada de decisão e clareza dos dados.

---

## Stack

- React;
- Vite;
- TypeScript;
- Tailwind CSS;
- componentes reutilizáveis do projeto;
- Recharts ou biblioteca já existente no projeto, quando necessário;
- TanStack Query, se já estiver instalado e em uso.

Não adicionar nova biblioteca sem justificar.

---

## Regras obrigatórias

1. Criar componentes pequenos e reutilizáveis.
2. Separar página, componentes, hooks e services.
3. Evitar `any`.
4. Não quebrar telas existentes.
5. Não reescrever arquivo grande sem necessidade.
6. Criar loading state, empty state e error state.
7. Garantir responsividade.
8. Tabelas grandes devem ter scroll horizontal controlado.
9. Filtros devem funcionar bem em mobile.
10. Informar fonte dos dados e última atualização quando possível.
11. Não calcular regra crítica pesada no componente visual.
12. Preferir services, views ou RPCs para dados consolidados.

---

## Responsividade mínima

Testar mentalmente para:

```txt
360px  → celular
768px  → tablet
1366px → notebook
1920px → desktop
```

---

## Estrutura recomendada de página

1. Cabeçalho da página;
2. Descrição curta;
3. Filtros;
4. Cards principais;
5. Gráficos/listas de destaque;
6. Tabela principal;
7. Alertas/recomendações;
8. Rodapé com fonte/última atualização, quando aplicável.

---

## Tabelas

Quando fizer sentido, tabelas devem ter:

- busca;
- filtros;
- ordenação;
- paginação;
- exportação;
- destaque visual para alertas;
- formatação monetária;
- formatação percentual;
- formatação de datas.

---

## Padrão de implementação

Antes de codar, informar:

- Qual tela será criada/alterada;
- Fonte dos dados;
- Services usados/criados;
- Componentes usados/criados;
- Estados da tela;
- Responsividade;
- Arquivos alterados;
- Como testar.
