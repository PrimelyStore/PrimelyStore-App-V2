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
