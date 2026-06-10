export type ModoConsultaAmazonFees = "auto" | "sku" | "asin";
export type TipoConsultaAmazonFees = "sku" | "asin" | "batch";

export type EntradaFeesQuote = {
  mapeamento_id: string;
  marketplace_id: string;
  preco_consultado: number;
  moeda?: string;
  is_amazon_fulfilled: boolean;
  seller_sku?: string | null;
  asin?: string | null;
  modo_consulta?: string | null;
  permitir_fallback_asin?: boolean;
};

export type EntradaPayloadSku = {
  seller_sku: string;
  marketplace_id: string;
  preco_consultado: number;
  moeda: string;
  is_amazon_fulfilled: boolean;
};

export type EntradaPayloadAsin = {
  asin: string;
  marketplace_id: string;
  preco_consultado: number;
  moeda: string;
  is_amazon_fulfilled: boolean;
};

export type EntradaPayloadBatchItem = {
  identificador: string;
  tipo_identificador: "sku" | "asin";
  marketplace_id: string;
  preco_consultado: number;
  moeda: string;
  is_amazon_fulfilled: boolean;
};

export type ResultadoPayloadFees = {
  tipo_consulta: TipoConsultaAmazonFees;
  endpoint_path: string;
  identificador_usado: "sku" | "asin";
  seller_sku_usado: string | null;
  asin_usado: string | null;
  payload_request_sanitizado: Record<string, unknown>;
  warnings: string[];
  erros_validacao: string[];
};

export type ResumoTaxasAmazonFees = {
  taxa_marketplace: number | null;
  taxa_logistica: number | null;
  taxa_total: number | null;
  detalhes: Array<{ tipo: string; valor: number; moeda: string }>;
  warnings: string[];
  erros_validacao: string[];
};

/**
 * Normaliza o modo de consulta vindo no payload da requisição.
 */
export function normalizarModoConsulta(
  valor?: unknown,
): ModoConsultaAmazonFees {
  if (
    valor === undefined || valor === null ||
    (typeof valor === "string" && valor.trim() === "")
  ) {
    return "auto";
  }
  if (typeof valor === "string") {
    const normalized = valor.trim().toLowerCase();
    if (
      normalized === "auto" || normalized === "sku" || normalized === "asin"
    ) {
      return normalized as ModoConsultaAmazonFees;
    }
  }
  throw new Error(`Modo de consulta invalido: ${valor}`);
}

/**
 * Executa validações de tipo e valores do request body localmente.
 */
export function validarEntradaFeesQuote(
  entrada: Record<string, unknown>,
): EntradaFeesQuote {
  if (contemCamposSensiveis(entrada)) {
    throw new Error("Requisicao contem campos ou credenciais sensiveis.");
  }

  const mapeamento_id = entrada.mapeamento_id;
  if (typeof mapeamento_id !== "string" || !validarUuid(mapeamento_id)) {
    throw new Error("mapeamento_id deve ser um UUID valido.");
  }

  const marketplace_id = entrada.marketplace_id;
  if (typeof marketplace_id !== "string" || marketplace_id.trim() === "") {
    throw new Error("marketplace_id e obrigatorio.");
  }

  const preco_consultado = Number(entrada.preco_consultado);
  if (!Number.isFinite(preco_consultado) || preco_consultado <= 0) {
    throw new Error("preco_consultado deve ser um numero maior que zero.");
  }

  const moeda = typeof entrada.moeda === "string"
    ? entrada.moeda.trim().toUpperCase()
    : "BRL";
  if (moeda.length !== 3) {
    throw new Error("moeda deve conter exatamente 3 caracteres.");
  }

  const is_amazon_fulfilled = entrada.is_amazon_fulfilled;
  if (typeof is_amazon_fulfilled !== "boolean") {
    throw new Error("is_amazon_fulfilled deve ser um booleano.");
  }

  const modo_consulta = normalizarModoConsulta(entrada.modo_consulta);
  const seller_sku = typeof entrada.seller_sku === "string"
    ? entrada.seller_sku.trim()
    : null;
  const asin = typeof entrada.asin === "string" ? entrada.asin.trim() : null;

  if (modo_consulta === "sku") {
    if (!seller_sku) {
      throw new Error("seller_sku e obrigatorio para modo 'sku'.");
    }
  } else if (modo_consulta === "asin") {
    if (!asin) {
      throw new Error("asin e obrigatorio para modo 'asin'.");
    }
  } else if (modo_consulta === "auto") {
    if (!seller_sku && !asin) {
      throw new Error(
        "Pelo menos seller_sku ou asin deve estar preenchido no modo 'auto'.",
      );
    }
  }

  if (asin) {
    const asinRegex = /^[a-z0-9]{10}$/i;
    if (!asinRegex.test(asin)) {
      throw new Error(
        "ASIN deve ser um identificador alfanumerico de 10 caracteres.",
      );
    }
  }

  if (seller_sku === "") {
    throw new Error("seller_sku nao pode ser vazio.");
  }

  return {
    mapeamento_id,
    marketplace_id,
    preco_consultado,
    moeda,
    is_amazon_fulfilled,
    seller_sku,
    asin,
    modo_consulta,
    permitir_fallback_asin: entrada.permitir_fallback_asin !== false,
  };
}

/**
 * Auxiliar para verificar se o objeto contém chaves potencialmente sensíveis.
 */
function contemCamposSensiveis(obj: Record<string, unknown>): boolean {
  const chavesSensiveis = [
    "authorization",
    "bearer",
    "token",
    "access_token",
    "refresh_token",
    "client_secret",
    "secret",
    "secret_access_key",
    "password",
    "signature",
    "credential",
  ];

  function inspect(val: unknown): boolean {
    if (val && typeof val === "object") {
      for (const key of Object.keys(val as Record<string, unknown>)) {
        if (chavesSensiveis.some((cs) => key.toLowerCase().includes(cs))) {
          return true;
        }
        if (inspect((val as Record<string, unknown>)[key])) {
          return true;
        }
      }
    }
    return false;
  }

  return inspect(obj);
}

/**
 * Validador básico de formato UUID.
 */
function validarUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

/**
 * Monta o endpoint e o payload sanitizado para SellerSKU.
 */
export function montarPayloadFeesSku(
  entrada: EntradaPayloadSku,
): ResultadoPayloadFees {
  const sellerSkuUsado = entrada.seller_sku;
  const encodedSku = encodeURIComponent(sellerSkuUsado);
  const endpoint_path = `/products/fees/v0/listings/${encodedSku}/feesEstimate`;

  const payload_request_sanitizado = {
    FeesEstimateRequest: {
      MarketplaceId: entrada.marketplace_id,
      PriceToEstimateFees: {
        ListingPrice: {
          Amount: entrada.preco_consultado,
          CurrencyCode: entrada.moeda,
        },
      },
      Identifier: sellerSkuUsado,
      IsAmazonFulfilled: entrada.is_amazon_fulfilled,
    },
  };

  return {
    tipo_consulta: "sku",
    endpoint_path,
    identificador_usado: "sku",
    seller_sku_usado: sellerSkuUsado,
    asin_usado: null,
    payload_request_sanitizado,
    warnings: [],
    erros_validacao: [],
  };
}

/**
 * Monta o endpoint e o payload sanitizado para ASIN.
 */
export function montarPayloadFeesAsin(
  entrada: EntradaPayloadAsin,
): ResultadoPayloadFees {
  const asinUsado = entrada.asin.toUpperCase();
  const endpoint_path = `/products/fees/v0/items/${asinUsado}/feesEstimate`;

  const warnings: string[] = [];
  if (!asinUsado.startsWith("B")) {
    warnings.push("ASIN nao inicia com a letra B padrao do catalogo.");
  }

  const payload_request_sanitizado = {
    FeesEstimateRequest: {
      MarketplaceId: entrada.marketplace_id,
      PriceToEstimateFees: {
        ListingPrice: {
          Amount: entrada.preco_consultado,
          CurrencyCode: entrada.moeda,
        },
      },
      Identifier: asinUsado,
      IsAmazonFulfilled: entrada.is_amazon_fulfilled,
    },
  };

  return {
    tipo_consulta: "asin",
    endpoint_path,
    identificador_usado: "asin",
    seller_sku_usado: null,
    asin_usado: asinUsado,
    payload_request_sanitizado,
    warnings,
    erros_validacao: [],
  };
}

/**
 * Monta o endpoint e o payload sanitizado para a consulta em lote (batch).
 */
export function montarPayloadFeesBatch(itens: EntradaPayloadBatchItem[]): {
  endpoint_path: string;
  payload_request_sanitizado: Array<Record<string, unknown>>;
  warnings: string[];
  erros_validacao: string[];
} {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error(
      "A lista de itens para consulta em lote nao pode ser vazia.",
    );
  }
  if (itens.length > 20) {
    throw new Error("A consulta em lote aceita no maximo 20 itens.");
  }

  const payload_request_sanitizado = itens.map((item, index) => {
    if (!item.identificador || item.identificador.trim() === "") {
      throw new Error(`Item ${index} possui identificador vazio.`);
    }
    if (item.preco_consultado <= 0) {
      throw new Error(`Item ${index} possui preco menor ou igual a zero.`);
    }

    return {
      FeesEstimateRequest: {
        MarketplaceId: item.marketplace_id,
        PriceToEstimateFees: {
          ListingPrice: {
            Amount: item.preco_consultado,
            CurrencyCode: item.moeda,
          },
        },
        Identifier: item.tipo_identificador === "asin"
          ? item.identificador.toUpperCase()
          : item.identificador,
        IsAmazonFulfilled: item.is_amazon_fulfilled,
      },
      Id: `item_${index + 1}`,
    };
  });

  return {
    endpoint_path: "/products/fees/v0/feesEstimate",
    payload_request_sanitizado,
    warnings: [],
    erros_validacao: [],
  };
}

/**
 * Remove qualquer campo sensível do payload de forma recursiva por segurança preventiva.
 */
export function sanitizarPayloadAmazonFees<T>(payload: T): T {
  if (!payload) return payload;

  const chavesSensiveis = [
    "authorization",
    "bearer",
    "token",
    "access_token",
    "refresh_token",
    "client_secret",
    "secret",
    "secret_access_key",
    "password",
    "signature",
    "credential",
  ];

  function cloneAndSanitize(val: unknown): unknown {
    if (Array.isArray(val)) {
      return val.map(cloneAndSanitize);
    }
    if (val && typeof val === "object") {
      const cleaned: Record<string, unknown> = {};
      for (const key of Object.keys(val as Record<string, unknown>)) {
        const matchesSensitive = chavesSensiveis.some((cs) =>
          key.toLowerCase().includes(cs)
        );
        if (matchesSensitive) {
          cleaned[key] = "[REDACTED_SENSITIVE_FIELD]";
        } else {
          cleaned[key] = cloneAndSanitize(
            (val as Record<string, unknown>)[key],
          );
        }
      }
      return cleaned;
    }
    return val;
  }

  return cloneAndSanitize(payload) as T;
}

/**
 * Normaliza e extrai as taxas brutas estimadas da resposta da Amazon.
 */
export function extrairResumoTaxasAmazon(
  responseBody: unknown,
): ResumoTaxasAmazonFees {
  const warnings: string[] = [];
  const erros_validacao: string[] = [];

  if (!responseBody || typeof responseBody !== "object") {
    return {
      taxa_marketplace: null,
      taxa_logistica: null,
      taxa_total: null,
      detalhes: [],
      warnings,
      erros_validacao: ["Resposta Amazon vazia ou invalida."],
    };
  }

  const bodyObj = responseBody as Record<string, any>;
  const feesEstimateResult = bodyObj.FeesEstimateResult;

  if (!feesEstimateResult) {
    return {
      taxa_marketplace: null,
      taxa_logistica: null,
      taxa_total: null,
      detalhes: [],
      warnings,
      erros_validacao: ["Resposta nao contem FeesEstimateResult."],
    };
  }

  if (feesEstimateResult.Status !== "Success") {
    const errorMsg = feesEstimateResult.Error?.Message ||
      "Erro nao especificado na resposta da Amazon.";
    return {
      taxa_marketplace: null,
      taxa_logistica: null,
      taxa_total: null,
      detalhes: [],
      warnings,
      erros_validacao: [`Amazon retornou status de falha: ${errorMsg}`],
    };
  }

  const feesEstimate = feesEstimateResult.FeesEstimate;
  if (!feesEstimate) {
    return {
      taxa_marketplace: null,
      taxa_logistica: null,
      taxa_total: null,
      detalhes: [],
      warnings,
      erros_validacao: ["Resposta nao contem FeesEstimate."],
    };
  }

  const feeDetailList = feesEstimate.FeeDetailList;
  if (!Array.isArray(feeDetailList) || feeDetailList.length === 0) {
    return {
      taxa_marketplace: null,
      taxa_logistica: null,
      taxa_total: null,
      detalhes: [],
      warnings,
      erros_validacao: [
        "Lista FeeDetailList vazia ou inexistente na resposta da Amazon.",
      ],
    };
  }

  let taxa_marketplace = 0;
  let taxa_logistica = 0;
  const detalhes: Array<{ tipo: string; valor: number; moeda: string }> = [];

  for (const fee of feeDetailList) {
    const type = fee.FeeType;
    const amount = Number(fee.FeeAmount?.Amount);
    const currency = fee.FeeAmount?.CurrencyCode || "BRL";

    if (type && Number.isFinite(amount)) {
      detalhes.push({ tipo: type, valor: amount, moeda: currency });
      if (type === "ReferralFee") {
        taxa_marketplace += amount;
      } else if (
        type === "DeliveryFee" || type === "FBAAdminFee" ||
        type.toLowerCase().includes("logistics")
      ) {
        taxa_logistica += amount;
      }
    }
  }

  const taxa_total = taxa_marketplace + taxa_logistica;

  if (taxa_total === 0 && detalhes.length === 0) {
    return {
      taxa_marketplace: null,
      taxa_logistica: null,
      taxa_total: null,
      detalhes: [],
      warnings,
      erros_validacao: ["erro_sem_taxas"],
    };
  }

  return {
    taxa_marketplace,
    taxa_logistica,
    taxa_total,
    detalhes,
    warnings,
    erros_validacao,
  };
}
