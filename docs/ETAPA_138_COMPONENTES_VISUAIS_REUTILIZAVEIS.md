# Etapa 138 — Componentes visuais reutilizáveis

## 1. Objetivo da etapa

A Etapa 138 tem como objetivo iniciar a padronização visual do sistema **Agentes Primely Store**, criando componentes reutilizáveis para evitar repetição de classes Tailwind diretamente nas páginas.

A ideia é deixar o frontend mais organizado, mais fácil de manter e mais seguro para evoluir.

Esta etapa começou pela tela **Fornecedores**, por ser uma tela mais simples e adequada para validar o padrão antes de aplicar em telas mais críticas como Compras, Vendas, Estoque e Conciliações.

---

## 2. Contexto

Antes desta etapa, várias páginas repetiam manualmente os mesmos padrões visuais:

```txt
cards
cabeçalhos de página
cards de indicadores
tabelas grandes
badges/status
botões
```

Esse modelo funcionava, mas criava um problema de manutenção:

```txt
Para alterar o visual de um botão, card ou badge, seria necessário alterar várias páginas manualmente.
```

Por isso, a Etapa 138 iniciou a criação de componentes reutilizáveis.

---

## 3. Componentes criados

Foram criados os componentes visuais básicos na pasta:

```txt
src/components/ui
```

Arquivos criados:

```txt
src/components/ui/AppButton.tsx
src/components/ui/AppCard.tsx
src/components/ui/DataTableContainer.tsx
src/components/ui/PageHeader.tsx
src/components/ui/StatCard.tsx
src/components/ui/StatusBadge.tsx
src/components/ui/index.ts
```

---

## 4. Descrição dos componentes

### 4.1 AppCard

Arquivo:

```txt
src/components/ui/AppCard.tsx
```

Objetivo:

Padronizar cards usados no sistema.

Padrão visual:

```txt
rounded-2xl
border border-slate-800
bg-slate-900
p-4 sm:p-6
shadow-lg
```

Uso esperado:

```tsx
<AppCard>
    Conteúdo do card
</AppCard>
```

---

### 4.2 PageHeader

Arquivo:

```txt
src/components/ui/PageHeader.tsx
```

Objetivo:

Padronizar cabeçalhos de páginas.

Campos aceitos:

```txt
tag
title
description
className
```

Uso validado na tela Fornecedores:

```tsx
<PageHeader
    tag="MÓDULO"
    title="Fornecedores"
    description="Cadastro, edição e listagem dos fornecedores da operação."
/>
```

---

### 4.3 StatCard

Arquivo:

```txt
src/components/ui/StatCard.tsx
```

Objetivo:

Padronizar cards de indicadores.

Exemplos de uso futuro:

```txt
Produtos cadastrados
Estoque total
Vendas encontradas
Alertas
Lucro estimado
Unidades pendentes
```

Tons disponíveis:

```txt
default
success
warning
danger
info
purple
```

---

### 4.4 DataTableContainer

Arquivo:

```txt
src/components/ui/DataTableContainer.tsx
```

Objetivo:

Padronizar o container de tabelas grandes.

Comportamento:

```txt
scroll horizontal interno
scroll vertical interno
altura máxima padrão de 70vh
borda
cantos arredondados
```

Padrão usado:

```tsx
<DataTableContainer>
    <table>
        ...
    </table>
</DataTableContainer>
```

Também foi exportada a constante:

```txt
stickyTableHeadClassName
```

Uso:

```tsx
<thead className={`${stickyTableHeadClassName} text-slate-400`}>
```

Isso mantém o cabeçalho da tabela fixo durante a rolagem.

---

### 4.5 StatusBadge

Arquivo:

```txt
src/components/ui/StatusBadge.tsx
```

Objetivo:

Padronizar badges/status do sistema.

Tons disponíveis:

```txt
default
success
warning
danger
info
purple
muted
```

Uso validado na tela Fornecedores:

```tsx
<StatusBadge tone={fornecedor.status === 'ativo' ? 'success' : 'muted'}>
    {fornecedor.status}
</StatusBadge>
```

Benefício:

```txt
Evita quebra visual de status.
Padroniza cor e tamanho.
Melhora legibilidade.
```

---

### 4.6 AppButton

Arquivo:

```txt
src/components/ui/AppButton.tsx
```

Objetivo:

Padronizar botões do sistema.

Variantes disponíveis:

```txt
primary
secondary
danger
success
ghost
```

Tamanhos disponíveis:

```txt
sm
md
lg
```

Uso validado na tela Fornecedores:

```tsx
<AppButton type="button" variant="primary">
    Cadastrar novo fornecedor
</AppButton>
```

---

### 4.7 index.ts

Arquivo:

```txt
src/components/ui/index.ts
```

Objetivo:

Centralizar exportações dos componentes visuais.

Com isso, as páginas podem importar assim:

```tsx
import {
    AppButton,
    AppCard,
    DataTableContainer,
    PageHeader,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'
```

---

## 5. Tela modelo inicial: Fornecedores

A tela **Fornecedores** foi escolhida como tela piloto para validar os componentes visuais.

Arquivo alterado:

```txt
src/pages/Fornecedores.tsx
```

Componentes aplicados:

```txt
PageHeader
AppCard
DataTableContainer
stickyTableHeadClassName
StatusBadge
AppButton
```

---

## 6. Melhorias aplicadas na tela Fornecedores

### 6.1 PageHeader

Substituiu o cabeçalho manual da tela.

Antes:

```txt
Card manual com tag, título e descrição.
```

Depois:

```tsx
<PageHeader
    tag="MÓDULO"
    title="Fornecedores"
    description="Cadastro, edição e listagem dos fornecedores da operação."
/>
```

---

### 6.2 AppCard

Foi aplicado nos principais blocos da tela:

```txt
Card do formulário
Card de ação para abrir cadastro
Card de status da consulta
Card da listagem de fornecedores
```

---

### 6.3 DataTableContainer

Foi aplicado na tabela de fornecedores.

Objetivo:

```txt
Manter scroll interno.
Manter cabeçalho fixo.
Preservar padrão da Etapa 137.
```

---

### 6.4 StatusBadge

Foi aplicado na coluna de status dos fornecedores.

Regra visual:

```txt
ativo → success
outros status → muted
```

---

### 6.5 AppButton

Substituiu os botões manuais da tela:

```txt
Cadastrar novo fornecedor
Cadastrar fornecedor / Atualizar fornecedor
Cancelar cadastro / Cancelar edição
Editar
```

---

## 7. Melhoria adicional: formulário recolhido por padrão

Além da aplicação dos componentes, foi ajustada a experiência da tela Fornecedores.

Antes:

```txt
O formulário de cadastro aparecia aberto assim que a tela era acessada.
```

Depois:

```txt
A tela abre limpa, com o formulário fechado.
O botão "Cadastrar novo fornecedor" abre o formulário.
O botão "Editar" abre o formulário preenchido.
Cancelar cadastro/edição fecha o formulário.
```

Esse comportamento deixa a tela mais limpa e operacional.

---

## 8. O que foi preservado

A Etapa 138, até este ponto, não alterou:

```txt
Supabase
fornecedoresService.ts
tabela fornecedores
cadastro de fornecedor
edição de fornecedor
validações
busca/listagem
regras de negócio
```

As alterações foram focadas em organização visual e experiência de uso.

---

## 9. Validações realizadas

Durante a aplicação dos componentes na tela Fornecedores, foram realizados checkpoints com:

```powershell
npm run build
```

Resultado esperado e validado:

```txt
✓ built
```

Também foram realizados commits individuais para cada avanço.

---

## 10. Commits relacionados

Commits realizados nesta etapa:

```txt
feat: criar componentes visuais reutilizaveis
feat: aplicar pageheader na tela de fornecedores
feat: aplicar appcard na tela de fornecedores
feat: aplicar datatablecontainer na tela de fornecedores
feat: aplicar statusbadge na tela de fornecedores
feat: recolher formulario de fornecedor por padrao
feat: aplicar appbutton na tela de fornecedores
```

---

## 11. Padrão recomendado para próximas telas

A tela Fornecedores passa a ser o modelo inicial para replicação gradual.

Ordem recomendada para próximas telas:

```txt
Produtos
Lotes
Movimentações
Alertas
Vendas
Compras
Estoque
Conciliações
Dashboard
Amazon FBA
```

A recomendação é não aplicar tudo de uma vez em várias telas críticas.

Melhor estratégia:

```txt
1. Aplicar em uma tela.
2. Rodar build.
3. Validar visualmente.
4. Fazer commit.
5. Só depois avançar.
```

---

## 12. Próxima etapa recomendada

### Etapa 138 — Parte 1J

Aplicar o mesmo padrão visual na tela **Produtos**.

Objetivo:

```txt
PageHeader
AppCard
DataTableContainer
StatusBadge
AppButton
Formulário recolhido por padrão, se fizer sentido
```

A tela Produtos é uma boa próxima candidata porque é similar a Fornecedores, mas possui regras próprias de produto, SKU, ASIN e EAN. Por isso, deve ser feita com cuidado e validação por partes.

---

## 13. Observação final

A Etapa 138 está organizando o frontend para longo prazo.

O principal ganho não é apenas visual, mas de manutenção:

```txt
Menos repetição.
Mais consistência.
Mais segurança para alterar o design futuramente.
Código mais limpo.
Padrão validado antes de replicar.
```
