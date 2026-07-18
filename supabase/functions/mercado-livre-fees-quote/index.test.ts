// supabase/functions/mercado-livre-fees-quote/index.test.ts

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { handleMercadoLivreFeesQuote } from "./index.ts";

const authMock = (authHeader: string | null) =>
  authHeader === "Bearer mock-valid-token";

interface RespostaSimulacaoML {
  status: string;
  origem: string;
  payload_recebido: {
    mapeamento_id: string;
    preco_consultado: number;
    category_id: string;
    listing_type_id: string;
    cogs: number;
    aliquota_imposto: number;
    custo_logistico_sem_frete: number;
    custo_logistico_frete_gratis: number;
  };
  calculos: {
    comissao: {
      taxaPercentual: number;
      valorComissao: number;
      tarifaFixa: number;
      totalComissao: number;
    };
    frete_e_logistica: {
      custo_logistico_aplicado: number;
      reputacao_normalizada: string;
      peso_gramas: number | null;
      frete_calculado: number | null;
    };
    margem: {
      lucroLiquido: number;
      margemLiquida: number;
      roi: number;
    };
    break_even: {
      preco_minimo_recomendado: number;
    };
  };
  warnings: string[];
}

Deno.test("handleMercadoLivreFeesQuote - OPTIONS - deve retornar HTTP 200 com headers CORS", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "OPTIONS",
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    res.headers.get("Access-Control-Allow-Methods"),
    "POST, OPTIONS",
  );
});

Deno.test("handleMercadoLivreFeesQuote - GET - deve retornar HTTP 405 Metodo nao permitido", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "GET",
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 405);
  const data = (await res.json()) as Record<string, unknown>;
  assertEquals(data.error, "Metodo nao permitido. Use POST.");
});

Deno.test("handleMercadoLivreFeesQuote - POST sem Authorization - deve retornar HTTP 401", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 401);
  const data = (await res.json()) as Record<string, unknown>;
  assertEquals(data.error, "Nao autorizado. Token invalido ou ausente.");
});

Deno.test("handleMercadoLivreFeesQuote - POST com Authorization invalido - deve retornar HTTP 401", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer token-invalido-123",
    },
    body: JSON.stringify({}),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 401);
});

Deno.test("handleMercadoLivreFeesQuote - POST sem injetar checkAuth (comportamento padrao) - deve retornar HTTP 401", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
    },
    body: JSON.stringify({}),
  });
  const res = await handleMercadoLivreFeesQuote(req);
  assertEquals(res.status, 401);
});

Deno.test("handleMercadoLivreFeesQuote - POST com JSON malformado - deve retornar HTTP 400", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
    },
    body: "{ malformed json }",
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 400);
  const data = (await res.json()) as Record<string, unknown>;
  assertEquals(data.error, "JSON de entrada malformado ou invalido.");
});

Deno.test("handleMercadoLivreFeesQuote - POST com payload invalido (sem campos obrigatorios) - deve retornar HTTP 400", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      preco_consultado: 100.00,
    }),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 400);
  const data = (await res.json()) as Record<string, unknown>;
  const errMsg = data.error as string;
  assertEquals(errMsg.startsWith("Erro de validacao:"), true);
});

Deno.test("handleMercadoLivreFeesQuote - POST com payload valido preco >= 79 - deve retornar HTTP 200 com calculos completos", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
      preco_consultado: 100.00,
      category_id: "MLB12345",
      listing_type_id: "gold_special",
      cogs: 50.00,
      aliquota_imposto: 0.04,
      custo_logistico_sem_frete: 6.00,
      custo_logistico_frete_gratis: 14.00,
    }),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 200);
  const data = (await res.json()) as RespostaSimulacaoML;
  assertEquals(data.status, "sucesso");
  assertEquals(data.origem, "simulacao_mock");

  // Calculos comissao: 100.00 * 0.10 = 10.00, tarifaFixa: 0.00, totalComissao: 10.00
  assertEquals(data.calculos.comissao.totalComissao, 10.00);
  // Logistica aplicada: preco >= 79 -> custo_logistico_frete_gratis = 14.00
  assertEquals(
    data.calculos.frete_e_logistica.custo_logistico_aplicado,
    14.00,
  );
  // Margem: 100 - 50 - 4 (imposto) - 10 (comissao) - 14 (frete) = 22.00
  assertEquals(data.calculos.margem.lucroLiquido, 22.00);
  assertEquals(data.calculos.margem.roi, 0.44); // 22 / 50
  assertEquals(data.calculos.margem.margemLiquida, 0.22); // 22 / 100
});

Deno.test("handleMercadoLivreFeesQuote - POST com payload valido preco < 79 - deve aplicar tarifa fixa", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
      preco_consultado: 50.00,
      category_id: "MLB12345",
      listing_type_id: "gold_special",
      cogs: 20.00,
      aliquota_imposto: 0.04,
      custo_logistico_sem_frete: 2.00,
      custo_logistico_frete_gratis: 14.00,
    }),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 200);
  const data = (await res.json()) as RespostaSimulacaoML;
  assertEquals(data.status, "sucesso");

  // Calculos comissao: 50.00 * 0.10 = 5.00, tarifaFixa: 6.00, totalComissao: 11.00
  assertEquals(data.calculos.comissao.totalComissao, 11.00);
  // Logistica aplicada: preco < 79 -> custo_logistico_sem_frete = 2.00
  assertEquals(
    data.calculos.frete_e_logistica.custo_logistico_aplicado,
    2.00,
  );
  // Margem: 50 - 20 - 2 (imposto) - 11 (comissao) - 2 (frete) = 15.00
  assertEquals(data.calculos.margem.lucroLiquido, 15.00);
});

Deno.test("handleMercadoLivreFeesQuote - POST com peso e reputacao - deve calcular frete dinamicamente a partir do payload sanitizado", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
      preco_consultado: 90.00,
      category_id: "MLB12345",
      listing_type_id: "gold_special",
      cogs: 40.00,
      aliquota_imposto: 0.04,
      peso_gramas: 800,
      reputacao: "platinum",
    }),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 200);
  const data = (await res.json()) as RespostaSimulacaoML;
  assertEquals(data.status, "sucesso");

  // Peso 800g -> faixa <= 1000g -> valorBase: 22.00
  // Reputacao platinum -> 50% de desconto -> freteCalculado: 11.00
  assertEquals(data.calculos.frete_e_logistica.frete_calculado, 11.00);
  assertEquals(
    data.calculos.frete_e_logistica.custo_logistico_aplicado,
    11.00,
  );
  assertEquals(
    data.calculos.frete_e_logistica.reputacao_normalizada,
    "platinum",
  );
});

Deno.test("handleMercadoLivreFeesQuote - POST contendo campo sensivel - deve rejeitar com HTTP 400 na sanitizacao", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
      preco_consultado: 100.00,
      category_id: "MLB12345",
      listing_type_id: "gold_special",
      cogs: 50.00,
      aliquota_imposto: 0.04,
      ml_client_secret: "123456",
    }),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 400);
  const data = (await res.json()) as Record<string, unknown>;
  const errMsg = data.error as string;
  assertEquals(
    errMsg.includes("Campo de credencial sensivel detectado"),
    true,
  );
});

Deno.test("handleMercadoLivreFeesQuote - POST com break-even superior ao preco_consultado - deve gerar warnings", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    // cogs alto de 95.00 torna o lucro negativo e o break-even superior a 100.00
    body: JSON.stringify({
      mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
      preco_consultado: 100.00,
      category_id: "MLB12345",
      listing_type_id: "gold_special",
      cogs: 95.00,
      aliquota_imposto: 0.04,
      custo_logistico_sem_frete: 2.00,
      custo_logistico_frete_gratis: 14.00,
    }),
  });
  const res = await handleMercadoLivreFeesQuote(req, authMock);
  assertEquals(res.status, 200);
  const data = (await res.json()) as RespostaSimulacaoML;
  assertEquals(data.warnings.length >= 2, true);
  assertEquals(
    data.warnings.some((w: string) => w.includes("Lucro liquido negativo")),
    true,
  );
  assertEquals(
    data.warnings.some((w: string) =>
      w.includes("abaixo do break-even estimado")
    ),
    true,
  );
});

Deno.test("handleMercadoLivreFeesQuote - Erro HTTP 500 - deve retornar mensagem de erro sanitizada sem vazamento tecnico", async () => {
  const req = new Request("https://example.com/mercado-livre-fees-quote", {
    method: "POST",
    headers: {
      "Authorization": "Bearer mock-valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mapeamento_id: "c826c03d-57a7-4eab-a833-7eac07eae29d",
      preco_consultado: 100.00,
      category_id: "MLB12345",
      listing_type_id: "gold_special",
      cogs: 50.00,
      aliquota_imposto: 0.04,
    }),
  });

  // Forcor uma excecao passando um checkAuth que lanca erro
  const badAuth = () => {
    throw new Error("Erro tecnico interno simulado");
  };

  const res = await handleMercadoLivreFeesQuote(req, badAuth);
  assertEquals(res.status, 500);
  const data = (await res.json()) as Record<string, unknown>;
  // A mensagem deve ser generica
  assertEquals(data.error, "Erro interno no servidor.");
});
