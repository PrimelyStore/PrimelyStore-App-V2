// supabase/functions/mercado-livre-fees-quote/_helpers_ml_fees.test.ts

// NOTA DE EXECUCAO OFFLINE: Este teste depende de imports do modulo assert da biblioteca padrao
// do Deno (deno.land). Em execucao estritamente offline, estes imports sao carregados a partir
// do cache local de dependencias pre-adquiridas (deno cache).

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  calcularComissaoML,
  calcularMargemLucroROI,
  calcularPrecoMinimoRecomendado,
  validarEntradaFeesQuote,
} from "./_helpers_ml_fees.ts";

Deno.test("validarEntradaFeesQuote - deve validar payload correto", () => {
  const payloadValido = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    preco_consultado: 100.00,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
    custo_logistico_sem_frete: 6.00,
    custo_logistico_frete_gratis: 25.00,
  };
  const validado = validarEntradaFeesQuote(payloadValido);
  assertEquals(validado.preco_consultado, 100.00);
  assertEquals(validado.cogs, 50.00);
  assertEquals(validado.aliquota_imposto, 0.04);
});

Deno.test("validarEntradaFeesQuote - deve falhar se mapeamento_id nao for UUID", () => {
  const payloadInvalido = {
    mapeamento_id: "id-invalido-123",
    preco_consultado: 100.00,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
  };
  assertThrows(() => validarEntradaFeesQuote(payloadInvalido));
});

Deno.test("validarEntradaFeesQuote - deve falhar para preco zero ou negativo", () => {
  const payloadPrecoZero = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    preco_consultado: 0,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
  };
  assertThrows(() => validarEntradaFeesQuote(payloadPrecoZero));
});

Deno.test("validarEntradaFeesQuote - deve falhar se contiver chaves sensiveis", () => {
  const payloadSensivel = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    preco_consultado: 100.00,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
    ml_client_secret: "chave_secreta_real",
  };
  assertThrows(() => validarEntradaFeesQuote(payloadSensivel));
});

Deno.test("validarEntradaFeesQuote - deve falhar se preco for NaN ou Infinity", () => {
  const payloadNaN = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    preco_consultado: NaN,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
  };
  assertThrows(() => validarEntradaFeesQuote(payloadNaN));

  const payloadInfinity = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    preco_consultado: Infinity,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
  };
  assertThrows(() => validarEntradaFeesQuote(payloadInfinity));
});

Deno.test("validarEntradaFeesQuote - deve falhar para custos logísticos negativos", () => {
  const payloadNegativo = {
    mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
    preco_consultado: 100.00,
    category_id: "MLB12345",
    listing_type_id: "gold_special",
    cogs: 50.00,
    aliquota_imposto: 0.04,
    custo_logistico_sem_frete: -10.00,
  };
  assertThrows(() => validarEntradaFeesQuote(payloadNegativo));
});

Deno.test("calcularComissaoML - deve calcular comissao padrao sem tarifa fixa para preco >= 79", () => {
  // Preco >= 79.00 -> Tarifa fixa = 0
  // Categoria padrao, gold_special -> 12%
  const res = calcularComissaoML(100.00, "MLB99999", "gold_special");
  assertEquals(res.taxaPercentual, 0.12);
  assertEquals(res.valorComissao, 12.00);
  assertEquals(res.tarifaFixa, 0);
  assertEquals(res.totalComissao, 12.00);
});

Deno.test("calcularComissaoML - deve adicionar tarifa fixa de R$ 6 para preco < 79", () => {
  // Preco < 79.00 -> Tarifa fixa = 6.00
  // Categoria MLB12345, gold_pro -> 15%
  const res = calcularComissaoML(50.00, "MLB12345", "gold_pro");
  assertEquals(res.taxaPercentual, 0.15);
  assertEquals(res.valorComissao, 7.50);
  assertEquals(res.tarifaFixa, 6.00);
  assertEquals(res.totalComissao, 13.50);
});

Deno.test("calcularMargemLucroROI - deve calcular corretamente lucro, margem e ROI", () => {
  // Preco: 100.00, COGS: 50.00, Imposto: 4.00, Comissao: 12.00, Frete: 14.00
  // Lucro: 100 - 50 - 4 - 12 - 14 = 20.00
  // Margem: 20 / 100 = 20%
  // ROI: 20 / 50 = 40%
  const res = calcularMargemLucroROI(100.00, 50.00, 0.04, 12.00, 14.00);
  assertEquals(res.lucroLiquido, 20.00);
  assertEquals(res.margemLiquida, 0.2000);
  assertEquals(res.roi, 0.4000);
});

Deno.test("calcularPrecoMinimoRecomendado - deve calcular break-even na faixa de baixo custo (< 79)", () => {
  // COGS: 20.00, Imposto: 4%, Categoria padrao, gold_special (12%), Frete sem frete gratis: R$ 0, Tarifa fixa: R$ 6.00
  // divisor = 1 - 0.04 - 0.12 = 0.84
  // precoBaixoCusto = (20.00 + 6.00 + 0) / 0.84 = 26 / 0.84 = 30.95
  const precoMin = calcularPrecoMinimoRecomendado(
    20.00,
    0.04,
    "MLB99999",
    "gold_special",
    0,
    15.00,
  );
  assertEquals(precoMin, 30.95);
});

Deno.test("calcularPrecoMinimoRecomendado - deve calcular break-even na faixa de alto custo (>= 79)", () => {
  // COGS: 70.00, Imposto: 4%, Categoria padrao, gold_special (12%), Frete gratis: R$ 20.00
  // divisor = 1 - 0.04 - 0.12 = 0.84
  // precoBaixoCusto = (70.00 + 6.00) / 0.84 = 90.48 (invalido, pois >= 79)
  // precoAltoCusto = (70.00 + 20.00) / 0.84 = 90.00 / 0.84 = 107.14 (valido, pois >= 79)
  const precoMin = calcularPrecoMinimoRecomendado(
    70.00,
    0.04,
    "MLB99999",
    "gold_special",
    0,
    20.00,
  );
  assertEquals(precoMin, 107.14);
});

Deno.test("calcularPrecoMinimoRecomendado - deve resolver a descontinuidade no limite de 79", () => {
  // COGS: 50.00, Imposto: 4%, Categoria MLB12345, gold_special (10%), Frete sem frete: 0, Frete gratis: 16.00
  // divisor = 1 - 0.04 - 0.10 = 0.86
  // precoBaixoCusto = (50 + 6 + 0) / 0.86 = 56 / 0.86 = 65.12 (Valido, pois < 79)
  // precoAltoCusto = (50 + 16) / 0.86 = 66 / 0.86 = 76.74 (Invalido, pois daria abaixo de 79)
  // Como precoBaixoCusto e valido e precoAltoCusto nao, o valor retornado deve ser o baixo custo
  const precoMin = calcularPrecoMinimoRecomendado(
    50.00,
    0.04,
    "MLB12345",
    "gold_special",
    0,
    16.00,
  );
  assertEquals(precoMin, 65.12);
});

Deno.test("calcularPrecoMinimoRecomendado - deve lidar com descontinuidade quando nenhuma faixa calculada e inicialmente valida", () => {
  // COGS: 61.00, Imposto: 4%, Categoria padrao, gold_special (12%), Frete sem frete: 0, Frete gratis: 5.00
  // divisor = 1 - 0.04 - 0.12 = 0.84
  // precoBaixoCusto = (61.00 + 6.00 + 0) / 0.84 = 79.76 >= 79 (Invalido, pois maior/igual que 79)
  // precoAltoCusto = (61.00 + 5.00) / 0.84 = 78.57 < 79 (Invalido, pois menor que 79)
  // O algoritmo deve testar o limite de 79.00. Lucro no limite: 79 - 61 - (79*0.04) - (79*0.12) - 5 = 0.36 >= 0.
  // Como o lucro no limite e positivo, o break-even retornado e exatamente 79.00.
  const precoMin = calcularPrecoMinimoRecomendado(
    61.00,
    0.04,
    "MLB99999",
    "gold_special",
    0,
    5.00,
  );
  assertEquals(precoMin, 79.00);
});

Deno.test("calcularPrecoMinimoRecomendado - deve lidar com descontinuidade no limite de 79,00 gerando prejuizo", () => {
  // COGS: 61.00, Imposto: 4%, Categoria padrao, gold_special (12%), Frete sem frete: 0, Frete gratis: 6.00
  // divisor = 1 - 0.04 - 0.12 = 0.84
  // precoBaixoCusto = (61 + 6) / 0.84 = 79.76 >= 79 (Invalido)
  // precoAltoCusto = (61 + 6) / 0.84 = 79.76 >= 79 (Valido)
  // Lucro no limite de 79.00: 79 - 61 - (79*0.04) - (79*0.12) - 6.00 = -0.64 < 0.
  // Como no limite de 79.00 da prejuizo, ele cai no alto custo de 79.76.
  const precoMin = calcularPrecoMinimoRecomendado(
    61.00,
    0.04,
    "MLB99999",
    "gold_special",
    0,
    6.00,
  );
  assertEquals(precoMin, 79.76);
});
