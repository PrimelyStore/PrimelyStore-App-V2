# Padrão Visual e Responsividade — Primely Store V3

## 1. Objetivo

Padronizar o visual do sistema para que ele seja:

- moderno;
- limpo;
- profissional;
- responsivo;
- fácil de manter;
- adequado para uso gerencial;
- confortável em telas grandes e pequenas.

---

## 2. Stack visual

```txt
React
TypeScript
Tailwind CSS
Componentes reutilizáveis
```

Se o projeto já usa componentes próprios, o Antigravity deve reaproveitá-los antes de criar novos.

---

## 3. Componentes reutilizáveis recomendados

Componentes úteis:

```txt
PageHeader
AppCard
StatCard
StatusBadge
AppButton
DataTableContainer
EmptyState
LoadingState
ErrorState
FilterBar
SectionTitle
```

Regra:

```txt
Não repetir dezenas de classes Tailwind em várias páginas se puder criar componente reutilizável.
```

---

## 4. Layout padrão de página gerencial

Estrutura recomendada:

```txt
1. Cabeçalho da página
2. Descrição curta
3. Filtros
4. Cards principais
5. Gráficos/listas de destaque
6. Tabela principal
7. Alertas/recomendações
8. Rodapé com última atualização/fonte dos dados
```

---

## 5. Responsividade obrigatória

Toda tela deve ser pensada para:

```txt
360px  → celular
768px  → tablet
1366px → notebook
1920px → monitor grande
```

Boas práticas:

- cards em grid responsivo;
- tabelas com scroll horizontal controlado;
- filtros empilháveis no mobile;
- sidebar recolhível;
- evitar conteúdo cortado;
- evitar textos longos quebrando layout;
- badges compactos;
- botões com área confortável;
- tabelas grandes dentro de container próprio.

---

## 6. Estados obrigatórios

Toda tela com dados deve ter:

- estado carregando;
- estado vazio;
- estado de erro;
- botão de tentar novamente, quando fizer sentido;
- informação da fonte do dado;
- data/hora da última atualização, quando disponível.

---

## 7. Tabelas

Tabelas gerenciais devem ter, quando fizer sentido:

- busca;
- filtros;
- ordenação;
- paginação;
- scroll horizontal;
- exportação;
- destaque visual para alertas;
- colunas importantes fixas ou bem posicionadas;
- formatação monetária;
- formatação percentual;
- formatação de datas.

---

## 8. Gráficos

Gráficos devem:

- responder pergunta gerencial clara;
- ter título objetivo;
- não poluir a tela;
- respeitar filtros;
- permitir leitura fácil;
- evitar excesso de cores;
- não substituir tabela quando detalhe for importante.

---

## 9. Regra para o Antigravity

Antes de criar uma tela, o Antigravity deve informar:

- objetivo da tela;
- fonte dos dados;
- cards;
- filtros;
- tabela;
- gráficos;
- estados da tela;
- responsividade;
- arquivos que serão alterados.
