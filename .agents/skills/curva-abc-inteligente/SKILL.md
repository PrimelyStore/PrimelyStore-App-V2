---
name: curva-abc-inteligente
description: Use para criar ou evoluir a página Curva ABC Inteligente de Produtos para marketplace.
---

# Curva ABC Inteligente

## Objetivo

Criar uma tela de inteligência de produtos para apoiar decisões de compra, preço, anúncios, estoque e descontinuação.

A página não deve analisar apenas faturamento.

Regra principal:

```txt
Produto bom = vende bem + dá lucro + tem margem + gira estoque + não depende demais de Ads.
```

---

## Critérios obrigatórios

A análise deve considerar:

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
- taxas marketplace;
- custo Prep Center;
- estoque parado;
- risco de ruptura.

---

## Abas recomendadas

1. Visão Geral;
2. ABC por Faturamento;
3. ABC por Lucro Líquido;
4. ABC por Volume;
5. ABC por Margem/Oportunidade;
6. Matriz Estratégica;
7. Estoque e Giro;
8. Ads e Rentabilidade.

---

## Fórmulas obrigatórias

```txt
Faturamento Bruto = Preço de Venda x Quantidade Vendida
```

```txt
Receita Líquida = Faturamento Bruto - Descontos - Cancelamentos - Reembolsos
```

```txt
CPV = Custo Unitário Médio ou FIFO x Quantidade Vendida
```

```txt
Lucro Bruto = Receita Líquida - CPV
```

```txt
Lucro Líquido =
Receita Líquida
- Custo do Produto
- Taxas Marketplace
- Impostos
- Frete
- Custo FBA / Full / Logística
- Custo Prep Center
- Investimento em Ads
```

```txt
Margem Líquida % = Lucro Líquido / Receita Líquida x 100
```

```txt
ROI % = Lucro Líquido / Custo Total do Produto x 100
```

```txt
Giro de Estoque = Quantidade Vendida / Estoque Médio
```

```txt
Média Diária de Vendas = Quantidade Vendida no Período / Número de Dias do Período
```

```txt
Dias de Estoque = Estoque Atual / Média Diária de Vendas
```

```txt
ACOS % = Investimento em Ads / Receita Atribuída aos Ads x 100
```

```txt
TACOS % = Investimento em Ads / Receita Total do Produto x 100
```

---

## Curva ABC

Classificação padrão:

```txt
A = até 80% acumulado
B = acima de 80% até 95% acumulado
C = acima de 95% até 100% acumulado
```

Aplicar para:

- faturamento;
- lucro líquido;
- volume.

---

## Classificações estratégicas

| Classificação | Condição típica | Ação |
|---|---|---|
| Produto Campeão | Alto faturamento + alto lucro + boa margem + bom giro | Comprar mais e proteger estoque |
| Produto de Volume | Alto faturamento + alto volume + margem baixa | Revisar preço, custo, taxas e Ads |
| Produto Oportunidade | Baixa venda + boa margem | Melhorar anúncio, SEO e tráfego |
| Produto Problema | Baixa venda + baixa margem + baixo giro | Liquidar, pausar ou descontinuar |
| Produto Armadilha | Alto faturamento + baixo lucro + alto custo/Ads | Investigar imediatamente |

---

## Alertas automáticos

Criar alertas para:

- Curva A com menos de 15 dias de estoque;
- Curva A por lucro com menos de 20 dias de estoque;
- margem líquida abaixo do mínimo;
- TACOS acima do limite;
- estoque parado há 30/60/90 dias;
- Curva A por faturamento e Curva C por lucro;
- produto sem custo;
- produto sem ASIN/EAN/SKU;
- margem negativa.

---

## Layout obrigatório

1. Cabeçalho;
2. Filtros avançados;
3. Cards gerenciais;
4. Abas;
5. Gráficos estratégicos;
6. Tabela analítica;
7. Alertas;
8. Recomendações.

---

## Regra técnica

Evitar calcular tudo no frontend.

Preferir:

```txt
Supabase views/RPCs → services React → tela
```

O frontend deve consultar, filtrar e exibir.
