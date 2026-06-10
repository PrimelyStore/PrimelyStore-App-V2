import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  extrairResumoTaxasAmazon,
  montarPayloadFeesAsin,
  montarPayloadFeesBatch,
  montarPayloadFeesSku,
  normalizarModoConsulta,
  sanitizarPayloadAmazonFees,
  validarEntradaFeesQuote,
} from "./_helpers.ts";

Deno.test("normalizarModoConsulta - deve retornar auto por padrao", () => {
  assertEquals(normalizarModoConsulta(), "auto");
  assertEquals(normalizarModoConsulta(""), "auto");
  assertEquals(normalizarModoConsulta(null), "auto");
  assertEquals(normalizarModoConsulta("  "), "auto");
});

Deno.test("normalizarModoConsulta - deve aceitar auto, sku e asin em qualquer case", () => {
  assertEquals(normalizarModoConsulta("AUTO"), "auto");
  assertEquals(normalizarModoConsulta("sku "), "sku");
  assertEquals(normalizarModoConsulta("AsIn"), "asin");
});

Deno.test("normalizarModoConsulta - deve falhar para modo invalido", () => {
  assertThrows(() => normalizarModoConsulta("batch"));
  assertThrows(() => normalizarModoConsulta(123 as any));
});

Deno.test("validarEntradaFeesQuote - deve validar UUID e preco maior que zero", () => {
  const payloadValido = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 150.50,
    is_amazon_fulfilled: true,
    seller_sku: "SKU-TESTE-1",
    modo_consulta: "sku",
  };
  const result = validarEntradaFeesQuote(payloadValido);
  assertEquals(result.preco_consultado, 150.50);
});

Deno.test("validarEntradaFeesQuote - deve rejeitar preco zero ou negativo", () => {
  const payloadInvalido = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 0,
    is_amazon_fulfilled: true,
    seller_sku: "SKU-TESTE-1",
    modo_consulta: "sku",
  };
  assertThrows(() => validarEntradaFeesQuote(payloadInvalido));
});

Deno.test("validarEntradaFeesQuote - deve rejeitar campos sensiveis", () => {
  const payloadSensiveis = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    is_amazon_fulfilled: true,
    seller_sku: "SKU-TESTE-1",
    modo_consulta: "sku",
    secret_access_key: "MINHACHAVELOCAL",
  };
  assertThrows(() => validarEntradaFeesQuote(payloadSensiveis));
});

Deno.test("validarEntradaFeesQuote - deve aceitar ASIN sem iniciar com B", () => {
  const payloadAsinSemB = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    is_amazon_fulfilled: true,
    asin: "1234567890",
    modo_consulta: "asin",
  };
  const result = validarEntradaFeesQuote(payloadAsinSemB);
  assertEquals(result.asin, "1234567890");
});

Deno.test("validarEntradaFeesQuote - deve rejeitar ASIN invalido (tamanho != 10)", () => {
  const payloadAsinInvalido = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    is_amazon_fulfilled: true,
    asin: "B000TESTE", // 9 chars
    modo_consulta: "asin",
  };
  assertThrows(() => validarEntradaFeesQuote(payloadAsinInvalido));
});

Deno.test("montarPayloadFeesSku - deve fazer encodeURIComponent do SKU no endpoint_path", () => {
  const input = {
    seller_sku: "TESTE SKU / 123",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    moeda: "BRL",
    is_amazon_fulfilled: true,
  };
  const result = montarPayloadFeesSku(input);
  assertEquals(
    result.endpoint_path,
    "/products/fees/v0/listings/TESTE%20SKU%20%2F%20123/feesEstimate",
  );
});

Deno.test("montarPayloadFeesSku - deve evitar duplo encoding para SKU especial", () => {
  const input = {
    seller_sku: "TESTE SKU/AMZ FEES",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 99.9,
    moeda: "BRL",
    is_amazon_fulfilled: true,
  };
  const result = montarPayloadFeesSku(input);
  assertEquals(
    result.endpoint_path,
    "/products/fees/v0/listings/TESTE%20SKU%2FAMZ%20FEES/feesEstimate",
  );
});

Deno.test("montarPayloadFeesAsin - deve criar endpoint_path correto", () => {
  const input = {
    asin: "b000teste1",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    moeda: "BRL",
    is_amazon_fulfilled: true,
  };
  const result = montarPayloadFeesAsin(input);
  assertEquals(
    result.endpoint_path,
    "/products/fees/v0/items/B000TESTE1/feesEstimate",
  );
  assertEquals(result.asin_usado, "B000TESTE1");
  assertEquals(result.warnings.length, 0);
});

Deno.test("montarPayloadFeesAsin - deve avisar (warning) se ASIN nao inicia com B", () => {
  const input = {
    asin: "1000teste1",
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    moeda: "BRL",
    is_amazon_fulfilled: true,
  };
  const result = montarPayloadFeesAsin(input);
  assertEquals(result.warnings.length, 1);
  assertEquals(
    result.warnings[0],
    "ASIN nao inicia com a letra B padrao do catalogo.",
  );
});

Deno.test("montarPayloadFeesBatch - deve falhar se tiver mais de 20 itens", () => {
  const itens = Array.from({ length: 21 }, (_, index) => ({
    identificador: `SKU-${index}`,
    tipo_identificador: "sku" as const,
    marketplace_id: "A2Q3Y263D00KWC",
    preco_consultado: 100,
    moeda: "BRL",
    is_amazon_fulfilled: true,
  }));
  assertThrows(() => montarPayloadFeesBatch(itens));
});

Deno.test("sanitizarPayloadAmazonFees - deve remover propriedades sensiveis", () => {
  const original = {
    marketplace_id: "A2Q3Y263D00KWC",
    authorization: "Bearer xxxxx",
    client_secret: "12345",
    subPayload: {
      password: "senha",
      normal: "campo_normal",
    },
  };
  const sanitizado = sanitizarPayloadAmazonFees(original);
  assertEquals(sanitizado.authorization, "[REDACTED_SENSITIVE_FIELD]");
  assertEquals(sanitizado.client_secret, "[REDACTED_SENSITIVE_FIELD]");
  assertEquals(sanitizado.subPayload.password, "[REDACTED_SENSITIVE_FIELD]");
  assertEquals(sanitizado.subPayload.normal, "campo_normal");
});

Deno.test("extrairResumoTaxasAmazon - deve normalizar taxas de sucesso", () => {
  const responseMock = {
    FeesEstimateResult: {
      Status: "Success",
      FeesEstimate: {
        FeeDetailList: [
          {
            FeeType: "ReferralFee",
            FeeAmount: { Amount: 18.00, CurrencyCode: "BRL" },
          },
          {
            FeeType: "FBAAdminFee",
            FeeAmount: { Amount: 15.50, CurrencyCode: "BRL" },
          },
        ],
      },
    },
  };
  const result = extrairResumoTaxasAmazon(responseMock);
  assertEquals(result.taxa_marketplace, 18.00);
  assertEquals(result.taxa_logistica, 15.50);
  assertEquals(result.taxa_total, 33.50);
  assertEquals(result.detalhes.length, 2);
  assertEquals(result.erros_validacao.length, 0);
});

Deno.test("extrairResumoTaxasAmazon - deve retornar erro estruturado para status de erro", () => {
  const responseErrorMock = {
    FeesEstimateResult: {
      Status: "ServerError",
      Error: {
        Message: "Item not found",
      },
    },
  };
  const result = extrairResumoTaxasAmazon(responseErrorMock);
  assertEquals(result.taxa_total, null);
  assertEquals(result.erros_validacao.length, 1);
  assertEquals(
    result.erros_validacao[0],
    "Amazon retornou status de falha: Item not found",
  );
});
