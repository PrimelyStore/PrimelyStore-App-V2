# Resposta Antigravity - Fase 5.5L-6B/C (Correcoes e Auditoria Completa)

## 1. Branch e Status do Git
- **Branch atual**: `feature/mercado-livre-taxas-mockadas`
- **git status --short**:
  ```bash
   M TASKS.md
   M ROADMAP.md
   M docs/12_PLANEJAMENTO_MERCADO_LIVRE_TAXAS_LOGISTICA.md
   M docs/antigravity/HISTORICO_EXECUCOES.md
   M docs/antigravity/PROXIMO_COMANDO.md
   M docs/antigravity/RESPOSTA_ANTIGRAVITY.md
   M docs/antigravity/STATUS_ATUAL.md
  ?? supabase/functions/mercado-livre-fees-quote/
  ```

---

## 2. Novos Arquivos TypeScript Criados (Mockados)
Todos os arquivos criados estao isolados na pasta de testes de Edge Functions:
- `supabase/functions/mercado-livre-fees-quote/_helpers_ml_fees.ts` (8.360 bytes)
- `supabase/functions/mercado-livre-fees-quote/_helpers_ml_fees.test.ts` (5.190 bytes)
- `supabase/functions/mercado-livre-fees-quote/_helpers_ml_shipping.ts` (3.275 bytes)
- `supabase/functions/mercado-livre-fees-quote/_helpers_ml_shipping.test.ts` (2.426 bytes)

---

## 3. Conteudo Completo dos Novos Arquivos para Auditoria

### 3.1. _helpers_ml_fees.ts
```typescript
// supabase/functions/mercado-livre-fees-quote/_helpers_ml_fees.ts

// ATENCAO: Estes valores e fixtures sao estritamente ficticios e mockados para fins de teste.
// Eles NAO representam regras comerciais oficiais vigentes do Mercado Livre.

export interface EntradaFeesQuote {
  mapeamento_id: string;
  preco_consultado: number;
  category_id: string;
  listing_type_id: string; // 'gold_special' (classico) ou 'gold_pro' (premium)
  cogs: number;
  aliquota_imposto: number; // ex: 0.04 (4%)
  custo_logistico_sem_frete?: number;
  custo_logistico_frete_gratis?: number;
}

export interface FixturesTaxasML {
  limiteTarifaFixa: number; // ex: 79.00
  tarifaFixa: number; // ex: 6.00
  comissaoEspecialPorCategoria: Record<
    string,
    { gold_special: number; gold_pro: number }
  >;
  comissaoPadrao: { gold_special: number; gold_pro: number };
}

export interface ResultadoComissao {
  taxaPercentual: number;
  valorComissao: number;
  tarifaFixa: number;
  totalComissao: number;
}

export interface CalculoMargemResultado {
  lucroLiquido: number;
  margemLiquida: number;
  roi: number;
}

// Fixtures mockadas padrao para simulacoes nos testes (ficticias e nao oficiais)
export const FIXTURES_PADRAO_ML: FixturesTaxasML = {
  limiteTarifaFixa: 79.00,
  tarifaFixa: 6.00,
  comissaoPadrao: {
    gold_special: 0.12, // 12%
    gold_pro: 0.17, // 17%
  },
  comissaoEspecialPorCategoria: {
    "MLB12345": {
      gold_special: 0.10, // 10%
      gold_pro: 0.15, // 15%
    },
    "MLB67890": {
      gold_special: 0.14, // 14%
      gold_pro: 0.19, // 19%
    },
  },
};

/**
 * Valida o payload de entrada da simulacao para evitar valores invalidos, nao finitos ou credenciais
 */
export function validarEntradaFeesQuote(payload: any): EntradaFeesQuote {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload de entrada invalido.");
  }

  // Validar campos obrigatorios
  if (!payload.mapeamento_id || typeof payload.mapeamento_id !== "string") {
    throw new Error("mapeamento_id e obrigatorio e deve ser string.");
  }

  // Validacao de UUID simples
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(payload.mapeamento_id)) {
    throw new Error("mapeamento_id invalido. Deve ser um UUID.");
  }

  // Validacao numerica restrita (rejeitando NaN, Infinity)
  if (
    typeof payload.preco_consultado !== "number" ||
    !Number.isFinite(payload.preco_consultado) ||
    payload.preco_consultado <= 0
  ) {
    throw new Error("preco_consultado deve ser um numero finito maior que zero.");
  }

  if (
    typeof payload.cogs !== "number" ||
    !Number.isFinite(payload.cogs) ||
    payload.cogs < 0
  ) {
    throw new Error("cogs deve ser um numero finito nao negativo.");
  }

  if (
    typeof payload.aliquota_imposto !== "number" ||
    !Number.isFinite(payload.aliquota_imposto) ||
    payload.aliquota_imposto < 0 ||
    payload.aliquota_imposto > 1
  ) {
    throw new Error("aliquota_imposto deve ser um numero finito entre 0 e 1.");
  }

  // Validacao numerica explicita de custos opcionais
  let custo_logistico_sem_frete = 0;
  if (payload.custo_logistico_sem_frete !== undefined && payload.custo_logistico_sem_frete !== null) {
    if (
      typeof payload.custo_logistico_sem_frete !== "number" ||
      !Number.isFinite(payload.custo_logistico_sem_frete) ||
      payload.custo_logistico_sem_frete < 0
    ) {
      throw new Error("custo_logistico_sem_frete deve ser um numero finito nao negativo.");
    }
    custo_logistico_sem_frete = payload.custo_logistico_sem_frete;
  }

  let custo_logistico_frete_gratis = 0;
  if (payload.custo_logistico_frete_gratis !== undefined && payload.custo_logistico_frete_gratis !== null) {
    if (
      typeof payload.custo_logistico_frete_gratis !== "number" ||
      !Number.isFinite(payload.custo_logistico_frete_gratis) ||
      payload.custo_logistico_frete_gratis < 0
    ) {
      throw new Error("custo_logistico_frete_gratis deve ser um numero finito nao negativo.");
    }
    custo_logistico_frete_gratis = payload.custo_logistico_frete_gratis;
  }

  if (!payload.category_id || typeof payload.category_id !== "string") {
    throw new Error("category_id e obrigatorio.");
  }

  if (!payload.listing_type_id || typeof payload.listing_type_id !== "string") {
    throw new Error("listing_type_id e obrigatorio.");
  }

  if (
    payload.listing_type_id !== "gold_special" &&
    payload.listing_type_id !== "gold_pro"
  ) {
    throw new Error("listing_type_id deve ser 'gold_special' ou 'gold_pro'.");
  }

  // Prevenir campos de credenciais sensiveis
  const chavesSensiveis = [
    "secret",
    "token",
    "password",
    "key",
    "auth",
    "credential",
  ];
  for (const key of Object.keys(payload)) {
    if (chavesSensiveis.some((cs) => key.toLowerCase().includes(cs))) {
      throw new Error(
        `Campo de credencial sensivel detectado na entrada: ${key}`,
      );
    }
  }

  return {
    mapeamento_id: payload.mapeamento_id,
    preco_consultado: payload.preco_consultado,
    category_id: payload.category_id,
    listing_type_id: payload.listing_type_id,
    cogs: payload.cogs,
    aliquota_imposto: payload.aliquota_imposto,
    custo_logistico_sem_frete,
    custo_logistico_frete_gratis,
  };
}

/**
 * Calcula a comissao e tarifas fixas do Mercado Livre
 */
export function calcularComissaoML(
  precoVenda: number,
  categoryId: string,
  listingTypeId: string,
  fixtures: FixturesTaxasML = FIXTURES_PADRAO_ML,
): ResultadoComissao {
  if (precoVenda <= 0 || !Number.isFinite(precoVenda)) {
    throw new Error("precoVenda deve ser um numero finito maior que zero.");
  }

  const regrasCategoria = fixtures.comissaoEspecialPorCategoria[categoryId];
  const taxaPercentual = regrasCategoria
    ? (listingTypeId === "gold_pro"
      ? regrasCategoria.gold_pro
      : regrasCategoria.gold_special)
    : (listingTypeId === "gold_pro"
      ? fixtures.comissaoPadrao.gold_pro
      : fixtures.comissaoPadrao.gold_special);

  const valorComissao = Number((precoVenda * taxaPercentual).toFixed(2));

  // Tarifa fixa ficticia se preco abaixo do limite
  const tarifaFixa = precoVenda < fixtures.limiteTarifaFixa
    ? fixtures.tarifaFixa
    : 0;
  const totalComissao = Number((valorComissao + tarifaFixa).toFixed(2));

  return {
    taxaPercentual,
    valorComissao,
    tarifaFixa,
    totalComissao,
  };
}

/**
 * Calcula Lucro Liquido, Margem e ROI do produto
 */
export function calcularMargemLucroROI(
  precoVenda: number,
  cogs: number,
  aliquotaImposto: number,
  comissaoTotal: number,
  custoLogistico: number,
): CalculoMargemResultado {
  if (precoVenda <= 0 || !Number.isFinite(precoVenda)) {
    throw new Error("precoVenda deve ser um numero finito maior que zero.");
  }
  if (cogs < 0 || !Number.isFinite(cogs)) {
    throw new Error("cogs deve ser um numero finito nao negativo.");
  }
  if (aliquotaImposto < 0 || aliquotaImposto > 1 || !Number.isFinite(aliquotaImposto)) {
    throw new Error("aliquotaImposto deve ser um numero finito entre 0 e 1.");
  }
  if (comissaoTotal < 0 || !Number.isFinite(comissaoTotal)) {
    throw new Error("comissaoTotal deve ser um numero finito nao negativo.");
  }
  if (custoLogistico < 0 || !Number.isFinite(custoLogistico)) {
    throw new Error("custoLogistico deve ser um numero finito nao negativo.");
  }

  const valorImposto = Number((precoVenda * aliquotaImposto).toFixed(2));
  const lucroLiquido = Number(
    (precoVenda - cogs - valorImposto - comissaoTotal - custoLogistico).toFixed(
      2,
    ),
  );

  const margemLiquida = precoVenda > 0
    ? Number((lucroLiquido / precoVenda).toFixed(4))
    : 0;
  const roi = cogs > 0 ? Number((lucroLiquido / cogs).toFixed(4)) : 0;

  return {
    lucroLiquido,
    margemLiquida,
    roi,
  };
}

/**
 * Calcula o Preco Minimo Recomendado (Break-even) para que o lucro seja zero,
 * tratando a descontinuidade matematica da faixa de R$ 79,00
 */
export function calcularPrecoMinimoRecomendado(
  cogs: number,
  aliquotaImposto: number,
  categoryId: string,
  listingTypeId: string,
  custoLogisticoSemFrete: number,
  custoLogisticoFreteGratis: number,
  fixtures: FixturesTaxasML = FIXTURES_PADRAO_ML,
): number {
  if (cogs < 0 || !Number.isFinite(cogs)) {
    throw new Error("cogs deve ser um numero finito nao negativo.");
  }
  if (aliquotaImposto < 0 || aliquotaImposto > 1 || !Number.isFinite(aliquotaImposto)) {
    throw new Error("aliquotaImposto deve ser um numero finito entre 0 e 1.");
  }
  if (custoLogisticoSemFrete < 0 || !Number.isFinite(custoLogisticoSemFrete)) {
    throw new Error("custoLogisticoSemFrete deve ser um numero finito nao negativo.");
  }
  if (custoLogisticoFreteGratis < 0 || !Number.isFinite(custoLogisticoFreteGratis)) {
    throw new Error("custoLogisticoFreteGratis deve ser um numero finito nao negativo.");
  }

  const regrasCategoria = fixtures.comissaoEspecialPorCategoria[categoryId];
  const taxaPercentual = regrasCategoria
    ? (listingTypeId === "gold_pro"
      ? regrasCategoria.gold_pro
      : regrasCategoria.gold_special)
    : (listingTypeId === "gold_pro"
      ? fixtures.comissaoPadrao.gold_pro
      : fixtures.comissaoPadrao.gold_special);

  const divisor = 1 - aliquotaImposto - taxaPercentual;
  if (divisor <= 0) {
    throw new Error(
      "Aliquota de imposto somada a comissao deve ser menor que 100% para evitar divisao por zero.",
    );
  }

  // 1. Calcular para a faixa de Baixo Custo (com Tarifa Fixa e custo logistico sem frete gratis)
  const precoBaixoCusto =
    (cogs + fixtures.tarifaFixa + custoLogisticoSemFrete) / divisor;

  // 2. Calcular para a faixa de Alto Custo (sem Tarifa Fixa e com custo logistico de frete gratis)
  const precoAltoCusto = (cogs + custoLogisticoFreteGratis) / divisor;

  // Validar qual faixa e matematicamente coerente
  const eValidoBaixoCusto = precoBaixoCusto < fixtures.limiteTarifaFixa;
  const eValidoAltoCusto = precoAltoCusto >= fixtures.limiteTarifaFixa;

  if (eValidoBaixoCusto && !eValidoAltoCusto) {
    return Number(precoBaixoCusto.toFixed(2));
  }
  if (!eValidoBaixoCusto && eValidoAltoCusto) {
    return Number(precoAltoCusto.toFixed(2));
  }
  if (eValidoBaixoCusto && eValidoAltoCusto) {
    // Ambos sao matematicamente viaveis na teoria, prioriza o menor preco viavel
    return Number(Math.min(precoBaixoCusto, precoAltoCusto).toFixed(2));
  }

  // Se nenhum for valido na sua respectiva faixa de preco (zona de descontinuidade),
  // o break-even ideal estara exatamente no limite (e.g. R$ 79,00).
  // Vamos testar o lucro liquido em R$ 79,00 para garantir que nao causara prejuizo.
  const precoLimite = fixtures.limiteTarifaFixa;

  // No limite exato de R$ 79,00, a tarifa fixa e 0 e o frete gratis e obrigatorio.
  const comissaoNoLimite = precoLimite * taxaPercentual;
  const impostoNoLimite = precoLimite * aliquotaImposto;
  const lucroNoLimite = precoLimite - cogs - impostoNoLimite -
    comissaoNoLimite - custoLogisticoFreteGratis;

  if (lucroNoLimite >= 0) {
    return precoLimite;
  }

  // Se mesmo em R$ 79,00 der prejuizo devido ao frete gratis alto, entao o break-even real
  // obrigatoriamente cai na faixa de alto custo (que e maior que R$ 79,00).
  return Number(precoAltoCusto.toFixed(2));
}
```

### 3.2. _helpers_ml_shipping.ts
```typescript
// supabase/functions/mercado-livre-fees-quote/_helpers_ml_shipping.ts

// ATENCAO: Estes valores e fixtures sao estritamente ficticios e mockados para fins de teste.
// Eles NAO representam regras comerciais oficiais vigentes do Mercado Livre.

export interface FaixaPesoML {
  maxGramas: number;
  valorBase: number;
}

export interface FixturesLogisticaML {
  matrizFrete: FaixaPesoML[];
  descontosReputacao: Record<string, number>;
  freteFlexFixo: number;
}

export const FIXTURES_LOGISTICA_PADRAO_ML: FixturesLogisticaML = {
  matrizFrete: [
    { maxGramas: 500, valorBase: 18.00 },
    { maxGramas: 1000, valorBase: 22.00 },
    { maxGramas: 2000, valorBase: 26.00 },
    { maxGramas: 5000, valorBase: 32.00 },
    { maxGramas: Infinity, valorBase: 45.00 },
  ],
  descontosReputacao: {
    "official_store": 0.50, // 50% de desconto
    "platinum": 0.50, // 50% de desconto
    "gold": 0.40, // 40% de desconto
    "green": 0.30, // 30% de desconto
    "none": 0.00, // sem desconto
  },
  freteFlexFixo: 12.90, // Exemplo de tarifa Flex repassada
};

/**
 * Normaliza e valida a reputacao do vendedor
 */
export function normalizarReputacao(
  reputacao: string | null | undefined,
): string {
  if (reputacao === null || reputacao === undefined) return "none";
  const rep = reputacao.trim().toLowerCase();

  const validas = ["official_store", "platinum", "gold", "green", "none"];
  if (validas.includes(rep)) {
    return rep;
  }
  return "none";
}

/**
 * Retorna o desconto de frete com base na reputacao
 */
export function obterDescontoFrete(
  reputacao: string,
  fixtures: FixturesLogisticaML = FIXTURES_LOGISTICA_PADRAO_ML,
): number {
  const repNormalizada = normalizarReputacao(reputacao);
  const desconto = fixtures.descontosReputacao[repNormalizada];
  if (desconto === undefined || desconto === null) {
    return 0.00;
  }
  return desconto;
}

/**
 * Calcula o custo do frete do Mercado Envios com base no peso e reputacao do vendedor
 */
export function calcularFreteEnvios(
  pesoGramas: number,
  reputacao: string,
  fixtures: FixturesLogisticaML = FIXTURES_LOGISTICA_PADRAO_ML,
): number {
  if (pesoGramas < 0 || !Number.isFinite(pesoGramas)) {
    throw new Error("Peso do produto deve ser um numero finito nao negativo.");
  }

  // Buscar faixa de peso correspondente de forma explicita
  const faixa = fixtures.matrizFrete.find((f) => pesoGramas <= f.maxGramas);
  if (!faixa) {
    throw new Error("Nenhuma faixa de peso correspondente encontrada.");
  }
  const valorBase = faixa.valorBase;

  const desconto = obterDescontoFrete(reputacao, fixtures);
  const valorComDesconto = valorBase * (1 - desconto);

  return Number(valorComDesconto.toFixed(2));
}

/**
 * Sanitiza objetos de payload de logs para evitar vazamento de credenciais ou tokens
 */
export function sanitizarPayloadML(payload: any): any {
  if (payload === null || payload === undefined) return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizarPayloadML(item));
  }

  if (typeof payload === "object") {
    const copia: Record<string, any> = {};
    const chavesSensiveis = [
      "token",
      "access_token",
      "refresh_token",
      "secret",
      "client_secret",
      "password",
      "authorization",
      "key",
      "jwt",
      "senha",
    ];

    for (const [key, value] of Object.entries(payload)) {
      if (chavesSensiveis.some((cs) => key.toLowerCase().includes(cs))) {
        copia[key] = "[REDACTED_SENSITIVE_FIELD]";
      } else if (typeof value === "object") {
        copia[key] = sanitizarPayloadML(value);
      } else {
        copia[key] = value;
      }
    }
    return copia;
  }

  return payload;
}
```

---

## 4. Diff Completo das Documentacoes Modificadas

### 4.1. ROADMAP.md
```diff
@@ -1296,4 +1296,23 @@
 Garantias Cumpridas:
 * Esta fase foi puramente conceitual, de analise e de documentacao.
 * Nenhuma migration foi criada ou alterada, nenhuma Edge Function foi modificada, e nenhum comando de rede (`fetch`) ou SQL de escrita foi efetuado.
+
+---
+
+## Registro 2026-06-12 - Fase 5.5L-6B/C
+
+Status: [x] Helpers e Testes Offline do Mercado Livre em Deno Concluidos
+
+Objetivo: Criar e validar localmente em Deno, sem uso de rede ou credenciais reais, os helpers seguros para calculo de taxas, comissoes e fretes do Mercado Livre, alem do calculo de margem e preco minimo recomendado (Break-even), tratando a descontinuidade matematica de R$ 79,00.
+
+Resultados de Auditoria e Implementacao:
+1. **Helper de Taxas ML**: Implementados metodos de validacao estrita do payload (rejeitando NaN, Infinity e custos negativos), calculo de comissao classica/premium e tarifa fixa ficticia (para precos < R$ 79,00).
+2. **Preco Minimo Recomendado**: Resolvida programaticamente a descontinuidade matematica de Break-even onde o frete gratis se torna obrigatorio, cobrindo o ponto de equilibrio exato em R$ 79,00 e situacoes de prejuizo no limite.
+3. **Helper Logistico ML**: Implementada matriz ficticia de pesos/valores e descontos de reputacao do vendedor para simulacoes locais, alem de sanitizacao automatica de credenciais nos logs.
+4. **Validacoes e Testes**: Criados 20 testes unitarios Deno offline (100% de sucesso).
+
+Garantias Cumpridas:
+* Sem chaves reais, sem acesso ao `.env.local`, sem chamadas HTTP reais de rede.
+* Sem acoplamento na Edge Function principal de producao `index.ts`.
+
```

### 4.2. TASKS.md
```diff
@@ -1,13 +1,10 @@
 # TASKS.md - Controle de Tarefas do Projeto

 ## Estado Atual do Projeto
 - [x] Fase 5.5L-4 validada tecnicamente (Edge Function mock validada localmente).
 - [x] Fases 5.5L-4R, 5.5L-4S, 5.5L-4T e 5.5L-4U de correcoes documentais concluidas.
 - [x] Decisao humana tomada: manter e versionar a pasta scripts/ no Git.
 - [x] Criacao dos arquivos documentais TASKS.md e ACCEPTANCE_CRITERIA.md (Fase 5.5L-4W).
-- [ ] Escolha humana do proximo direcionamento de planejamento (Amazon LWA/SigV4 documental, Mercado Livre documental ou outra indicada).
+- [x] Planejamento documental de taxas e custos logisticos do Mercado Livre (Fase 5.5L-6A) concluido.
+- [x] Implementacao local e mockada de helpers e testes unitarios offline do Mercado Livre em Deno (Fase 5.5L-6B/C) concluida.

 ## Tarefas de Controle Pendentes

-- [ ] Executar planejamento documental da etapa escolhida pelo usuario.
-- [ ] Validar status da Edge Function local e integracoes mock.
+- [ ] Executar a auditoria de stage e preparacao de commit local da Fase 5.5L-6B/C.
```

---

## 5. Resultados Literais das Validacoes Offline Deno (20 Testes)
- **deno fmt --check**: `Checked 4 files`
- **deno check**: Aprovado com sucesso nos 4 arquivos.
- **deno test**:
  ```bash
  Check supabase/functions/mercado-livre-fees-quote/_helpers_ml_fees.test.ts
  Check supabase/functions/mercado-livre-fees-quote/_helpers_ml_shipping.test.ts
  running 14 tests from ./supabase/functions/mercado-livre-fees-quote/_helpers_ml_fees.test.ts
  validarEntradaFeesQuote - deve validar payload correto ... ok (12ms)
  validarEntradaFeesQuote - deve falhar se mapeamento_id nao for UUID ... ok (0ms)
  validarEntradaFeesQuote - deve falhar para preco zero ou negativo ... ok (0ms)
  validarEntradaFeesQuote - deve falhar se contiver chaves sensiveis ... ok (0ms)
  validarEntradaFeesQuote - deve falhar se preco for NaN ou Infinity ... ok (0ms)
  validarEntradaFeesQuote - deve falhar para custos logisticos negativos ... ok (0ms)
  calcularComissaoML - deve calcular comissao padrao sem tarifa fixa para preco >= 79 ... ok (0ms)
  calcularComissaoML - deve adicionar tarifa fixa de R$ 6 para preco < 79 ... ok (0ms)
  calcularMargemLucroROI - deve calcular corretamente lucro, margem e ROI ... ok (0ms)
  calcularPrecoMinimoRecomendado - deve calcular break-even na faixa de baixo custo (< 79) ... ok (0ms)
  calcularPrecoMinimoRecomendado - deve calcular break-even na faixa de alto custo (>= 79) ... ok (0ms)
  calcularPrecoMinimoRecomendado - deve resolver a descontinuidade no limite de 79 ... ok (0ms)
  calcularPrecoMinimoRecomendado - deve lidar com descontinuidade quando nenhuma faixa calculada e inicialmente valida ... ok (0ms)
  calcularPrecoMinimoRecomendado - deve lidar com descontinuidade no limite de 79,00 gerando prejuizo ... ok (0ms)
  running 6 tests from ./supabase/functions/mercado-livre-fees-quote/_helpers_ml_shipping.test.ts
  normalizarReputacao - deve normalizar corretamente ... ok (11ms)
  obterDescontoFrete - deve retornar o desconto de reputacao esperado ... ok (0ms)
  calcularFreteEnvios - deve calcular corretamente por faixas e descontos ... ok (0ms)
  calcularFreteEnvios - deve rejeitar peso negativo ... ok (0ms)
  calcularFreteEnvios - deve rejeitar peso NaN e Infinity ... ok (0ms)
  sanitizarPayloadML - deve mascarar informacoes sensiveis ... ok (0ms)

  ok | 20 passed | 0 failed (106ms)
  ```

---

## 6. Garantias de Seguranca
- **Offline e dependencias**: A execucao offline ocorre sem chamadas de rede no momento dos testes. Os imports remotos de `deno.land` utilizam o cache local do Deno.
- **RESTRIÇÕES**: Sem rede, sem secrets lidos, sem deploy, sem migrations, sem SQL destrutivo, sem stage.
- **RESPOSTA_CODEX.md**: Confirmado que `docs/antigravity/RESPOSTA_CODEX.md` permanece fora de qualquer stage ou commit por ser de controle dinamico.
