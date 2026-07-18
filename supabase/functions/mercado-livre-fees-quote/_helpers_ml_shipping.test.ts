// supabase/functions/mercado-livre-fees-quote/_helpers_ml_shipping.test.ts

// NOTA DE EXECUCAO OFFLINE: Este teste depende de imports do modulo assert da biblioteca padrao
// do Deno (deno.land). Em execucao estritamente offline, estes imports sao carregados a partir
// do cache local de dependencias pre-adquiridas (deno cache).

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  calcularFreteEnvios,
  normalizarReputacao,
  obterDescontoFrete,
  sanitizarPayloadML,
} from "./_helpers_ml_shipping.ts";

Deno.test("normalizarReputacao - deve normalizar corretamente", () => {
  assertEquals(normalizarReputacao("PLATINUM"), "platinum");
  assertEquals(normalizarReputacao("  gold  "), "gold");
  assertEquals(normalizarReputacao(null), "none");
  assertEquals(normalizarReputacao("invalida"), "none");
});

Deno.test("obterDescontoFrete - deve retornar o desconto de reputacao esperado", () => {
  assertEquals(obterDescontoFrete("platinum"), 0.50);
  assertEquals(obterDescontoFrete("official_store"), 0.50);
  assertEquals(obterDescontoFrete("gold"), 0.40);
  assertEquals(obterDescontoFrete("green"), 0.30);
  assertEquals(obterDescontoFrete("none"), 0.00);
});

Deno.test("calcularFreteEnvios - deve calcular corretamente por faixas e descontos", () => {
  // Faixa de 300g (<= 500g): Base R$ 18.00
  // Reputacao: platinum (50% de desconto) -> R$ 9.00
  assertEquals(calcularFreteEnvios(300, "platinum"), 9.00);

  // Faixa de 1.5kg (<= 2000g): Base R$ 26.00
  // Reputacao: gold (40% de desconto) -> R$ 15.60
  assertEquals(calcularFreteEnvios(1500, "gold"), 15.60);

  // Faixa de 8kg (> 5000g): Base R$ 45.00
  // Reputacao: none (0% de desconto) -> R$ 45.00
  assertEquals(calcularFreteEnvios(8000, "none"), 45.00);
});

Deno.test("calcularFreteEnvios - deve rejeitar peso negativo", () => {
  assertThrows(() => calcularFreteEnvios(-100, "green"));
});

Deno.test("calcularFreteEnvios - deve rejeitar peso NaN e Infinity", () => {
  assertThrows(() => calcularFreteEnvios(NaN, "platinum"));
  assertThrows(() => calcularFreteEnvios(Infinity, "gold"));
});

Deno.test("sanitizarPayloadML - deve mascarar informacoes sensiveis", () => {
  const original = {
    user_id: "123456",
    access_token: "APP_USR-1234-5678-abc",
    client_secret: "minha_chave_secreta",
    detalhes: {
      client_id: "id_cliente",
      password: "minha_senha_123",
      tipo: "normal",
    },
  };

  const sanitizado = sanitizarPayloadML(original);

  assertEquals(sanitizado.user_id, "123456");
  assertEquals(sanitizado.access_token, "[REDACTED_SENSITIVE_FIELD]");
  assertEquals(sanitizado.client_secret, "[REDACTED_SENSITIVE_FIELD]");
  assertEquals(sanitizado.detalhes.client_id, "id_cliente");
  assertEquals(sanitizado.detalhes.password, "[REDACTED_SENSITIVE_FIELD]");
  assertEquals(sanitizado.detalhes.tipo, "normal");
});
