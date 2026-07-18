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
    throw new Error(
      "preco_consultado deve ser um numero finito maior que zero.",
    );
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
  if (
    payload.custo_logistico_sem_frete !== undefined &&
    payload.custo_logistico_sem_frete !== null
  ) {
    if (
      typeof payload.custo_logistico_sem_frete !== "number" ||
      !Number.isFinite(payload.custo_logistico_sem_frete) ||
      payload.custo_logistico_sem_frete < 0
    ) {
      throw new Error(
        "custo_logistico_sem_frete deve ser um numero finito nao negativo.",
      );
    }
    custo_logistico_sem_frete = payload.custo_logistico_sem_frete;
  }

  let custo_logistico_frete_gratis = 0;
  if (
    payload.custo_logistico_frete_gratis !== undefined &&
    payload.custo_logistico_frete_gratis !== null
  ) {
    if (
      typeof payload.custo_logistico_frete_gratis !== "number" ||
      !Number.isFinite(payload.custo_logistico_frete_gratis) ||
      payload.custo_logistico_frete_gratis < 0
    ) {
      throw new Error(
        "custo_logistico_frete_gratis deve ser um numero finito nao negativo.",
      );
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
  if (
    aliquotaImposto < 0 || aliquotaImposto > 1 ||
    !Number.isFinite(aliquotaImposto)
  ) {
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
  if (
    aliquotaImposto < 0 || aliquotaImposto > 1 ||
    !Number.isFinite(aliquotaImposto)
  ) {
    throw new Error("aliquotaImposto deve ser um numero finito entre 0 e 1.");
  }
  if (custoLogisticoSemFrete < 0 || !Number.isFinite(custoLogisticoSemFrete)) {
    throw new Error(
      "custoLogisticoSemFrete deve ser um numero finito nao negativo.",
    );
  }
  if (
    custoLogisticoFreteGratis < 0 || !Number.isFinite(custoLogisticoFreteGratis)
  ) {
    throw new Error(
      "custoLogisticoFreteGratis deve ser um numero finito nao negativo.",
    );
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
