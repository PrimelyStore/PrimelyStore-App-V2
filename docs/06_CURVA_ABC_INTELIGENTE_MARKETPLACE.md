# Curva ABC Inteligente de Produtos — Marketplace

## 1. Objetivo da página

A página **Curva ABC Inteligente** deve apoiar a tomada de decisão gerencial em uma operação de vendas em marketplaces.

Ela não deve mostrar apenas quais produtos mais faturam.

Ela deve identificar quais produtos realmente são importantes para o negócio considerando:

- faturamento;
- lucro bruto;
- lucro líquido;
- margem líquida;
- volume vendido;
- giro de estoque;
- dias de estoque;
- dependência de Ads;
- ROI;
- TACOS;
- ACOS;
- custo de aquisição;
- custo logístico;
- taxas de marketplace;
- custo de Prep Center;
- estoque parado;
- risco de ruptura.

---

## 2. Conceito principal

Em marketplace, o produto que mais fatura nem sempre é o melhor produto.

Um produto pode vender muito, mas:

- ter margem baixa;
- consumir muito Ads;
- gerar pouco lucro líquido;
- ocupar muito estoque;
- exigir muito capital de giro;
- ter alto custo logístico;
- depender demais de Buy Box;
- depender de preço agressivo.

A análise correta deve seguir esta regra:

```txt
Produto bom = vende bem + dá lucro + tem margem + gira estoque + não depende demais de Ads.
```

---

## 3. Estrutura da página

A página deve ter:

1. Cabeçalho;
2. Filtros avançados;
3. Cards de resumo;
4. Abas de análise;
5. Gráficos estratégicos;
6. Tabela analítica;
7. Alertas automáticos;
8. Recomendações de ação.

---

## 4. Filtros obrigatórios

- Período;
- Marketplace;
- Canal de venda;
- Tipo de logística;
- Produto;
- SKU;
- ASIN;
- EAN/GTIN;
- Categoria;
- Marca;
- Fornecedor;
- Status do produto;
- Status de estoque;
- Status de anúncio.

Períodos recomendados:

- hoje;
- últimos 7 dias;
- últimos 15 dias;
- últimos 30 dias;
- últimos 60 dias;
- últimos 90 dias;
- mês atual;
- mês anterior;
- ano atual;
- personalizado.

---

## 5. Cards de resumo

Cards recomendados:

- Faturamento total;
- Receita líquida;
- Lucro bruto;
- Lucro líquido estimado;
- Margem líquida média;
- Quantidade vendida;
- Ticket médio;
- Produtos Curva A;
- Produtos Curva B;
- Produtos Curva C;
- Produtos com risco de ruptura;
- Produtos com estoque parado;
- Produtos com margem baixa;
- Produtos com Ads prejudicial.

---

## 6. Abas recomendadas

### 6.1. Visão Geral

Resumo executivo com:

- top produtos por faturamento;
- top produtos por lucro;
- produtos com risco;
- produtos parados;
- produtos oportunidade;
- produtos armadilha.

### 6.2. ABC por Faturamento

Classifica produtos pelo faturamento acumulado:

```txt
A = até 80%
B = acima de 80% até 95%
C = acima de 95% até 100%
```

### 6.3. ABC por Lucro Líquido

Mostra quais produtos realmente colocam dinheiro no caixa.

### 6.4. ABC por Volume

Mostra quais produtos têm maior saída em unidades.

### 6.5. ABC por Margem/Oportunidade

Margem não deve ser analisada isoladamente.

Cruzar margem com faturamento, lucro e volume.

### 6.6. Matriz Estratégica

Cruzamento:

```txt
Eixo X = Faturamento
Eixo Y = Margem Líquida
Tamanho = Quantidade vendida
Cor = Classificação estratégica
```

### 6.7. Estoque e Giro

Responde:

- quais produtos vão faltar;
- quais estão parados;
- quais precisam reposição;
- quais ocupam capital sem retorno.

### 6.8. Ads e Rentabilidade

Responde:

- quais produtos dependem demais de Ads;
- quais têm TACOS alto;
- quais têm ACOS acima do limite;
- quais vendem bem organicamente;
- quais devem reduzir ou aumentar investimento.

---

## 7. Fórmulas obrigatórias

### Faturamento bruto

```txt
Faturamento Bruto = Preço de Venda x Quantidade Vendida
```

### Receita líquida

```txt
Receita Líquida = Faturamento Bruto - Descontos - Cancelamentos - Reembolsos
```

### CPV

```txt
CPV = Custo Unitário Médio ou FIFO x Quantidade Vendida
```

### Lucro bruto

```txt
Lucro Bruto = Receita Líquida - CPV
```

### Lucro líquido estimado

```txt
Lucro Líquido =
Receita Líquida
- Custo do Produto
- Taxas do Marketplace
- Impostos
- Frete
- Custo FBA / Full / Logística
- Custo Prep Center
- Investimento em Ads
```

### Margem líquida

```txt
Margem Líquida % = Lucro Líquido / Receita Líquida x 100
```

### ROI

```txt
ROI % = Lucro Líquido / Custo Total do Produto x 100
```

### Giro de estoque

```txt
Giro de Estoque = Quantidade Vendida / Estoque Médio
```

### Média diária de vendas

```txt
Média Diária de Vendas = Quantidade Vendida no Período / Número de Dias do Período
```

### Dias de estoque

```txt
Dias de Estoque = Estoque Atual / Média Diária de Vendas
```

### ACOS

```txt
ACOS % = Investimento em Ads / Receita Atribuída aos Ads x 100
```

### TACOS

```txt
TACOS % = Investimento em Ads / Receita Total do Produto x 100
```

---

## 8. Classificações inteligentes

| Classificação | Condição típica | Ação recomendada |
|---|---|---|
| Produto Campeão | Alto faturamento, alto lucro, boa margem, bom giro | Comprar mais, proteger estoque e manter Ads controlado |
| Produto de Volume | Alto faturamento, alto volume, margem baixa | Revisar preço, fornecedor, taxas, logística e Ads |
| Produto Oportunidade | Baixo faturamento, boa margem, potencial de escala | Melhorar anúncio, imagens, SEO e campanhas |
| Produto Problema | Baixo faturamento, baixa margem, baixo giro | Liquidar, pausar, montar kit ou descontinuar |
| Produto Armadilha | Alto faturamento, baixo lucro, Ads/custo alto | Investigar imediatamente |

---

## 9. Alertas automáticos

Alertas recomendados:

- Produto Curva A com menos de 15 dias de estoque;
- Produto Curva A por lucro com menos de 20 dias de estoque;
- Margem líquida menor que o limite definido;
- TACOS acima do limite definido;
- Produto com estoque e sem venda há 30/60/90 dias;
- Produto Curva A por faturamento e Curva C por lucro;
- Produto sem custo atualizado;
- Produto sem ASIN/EAN/SKU vinculado;
- Produto vendido com margem negativa.

---

## 10. Ações recomendadas

| Situação | Ação |
|---|---|
| Curva A por lucro e estoque baixo | Comprar mais imediatamente |
| Curva A por faturamento e Curva C por lucro | Revisar preço, custo e Ads |
| Alta margem e baixa venda | Melhorar anúncio e tráfego |
| Alto Ads e baixo lucro | Reduzir lances, negativar termos ou pausar campanha |
| Estoque parado há mais de 90 dias | Liquidar ou montar kit |
| Boa venda e baixa margem | Renegociar fornecedor |
| Baixa venda e boa margem | Melhorar imagens, título e SEO |
| Margem negativa | Pausar venda ou corrigir preço imediatamente |

---

## 11. Score inteligente

Fórmula sugerida:

```txt
Score do Produto =
Faturamento Normalizado x 25%
+ Lucro Líquido Normalizado x 30%
+ Margem Líquida Normalizada x 20%
+ Giro de Estoque Normalizado x 15%
+ Saúde de Ads Normalizada x 10%
```

Classificação:

| Score | Classificação |
|---|---|
| 80 a 100 | Produto Excelente |
| 60 a 79 | Produto Bom |
| 40 a 59 | Produto de Atenção |
| 0 a 39 | Produto Problemático |

---

## 12. Colunas recomendadas da tabela

- Produto;
- SKU;
- ASIN;
- EAN/GTIN;
- Marketplace;
- Logística;
- Categoria;
- Marca;
- Fornecedor;
- Quantidade vendida;
- Faturamento bruto;
- Receita líquida;
- Custo unitário;
- CPV;
- Taxas marketplace;
- Custo logístico;
- Custo Prep Center;
- Impostos;
- Investimento Ads;
- Lucro bruto;
- Lucro líquido;
- Margem líquida;
- ROI;
- ACOS;
- TACOS;
- Estoque atual;
- Estoque Prep Center;
- Estoque Amazon FBA;
- Estoque Mercado Livre Full;
- Média diária de vendas;
- Dias de estoque;
- Giro;
- % faturamento;
- % lucro;
- % acumulado faturamento;
- % acumulado lucro;
- Curva faturamento;
- Curva lucro;
- Curva volume;
- Classificação estratégica;
- Ação recomendada.

---

## 13. Gráficos recomendados

- Pareto por faturamento;
- Pareto por lucro líquido;
- Matriz faturamento x margem;
- Ranking de lucro;
- Ranking de margem;
- Produtos com risco de ruptura;
- Produtos com estoque parado;
- Ads x lucro.

---

## 14. Requisitos técnicos

Frontend:

```txt
React
TypeScript
Vite
Tailwind CSS
Recharts
TanStack Query, se já estiver no projeto
```

Backend/Banco:

```txt
Supabase
PostgreSQL
Views analíticas
RPCs para filtros e cálculos consolidados
Edge Functions para sincronizações e cálculos sensíveis
```

Regra técnica:

```txt
Evitar calcular tudo no frontend.
O banco/views/RPCs devem consolidar os indicadores principais.
O frontend deve consultar, filtrar e exibir.
```
