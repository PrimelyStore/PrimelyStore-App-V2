// supabase/functions/amazon-fees-quote/_helpers_sigv4.test.ts

import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  assinarRequestSpApi,
  calcularSha256,
  encodeUriAws,
  montarCanonicalHeaders,
  montarCanonicalQueryString,
  montarCanonicalUri,
} from "./_helpers_sigv4.ts";

Deno.test("calcularSha256 - deve retornar hash SHA-256 correto em hex", async () => {
  const hashEmpty = await calcularSha256("");
  assertEquals(
    hashEmpty,
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );

  const hashHello = await calcularSha256("Hello World");
  assertEquals(
    hashHello,
    "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
  );
});

Deno.test("encodeUriAws - deve escapar caracteres especiais conforme regras AWS", () => {
  // Com encodeSlash = false (util para path)
  assertEquals(encodeUriAws("/foo/bar", false), "/foo/bar");
  assertEquals(encodeUriAws("/foo/bar space", false), "/foo/bar%20space");

  // Com encodeSlash = true (util para query params)
  assertEquals(encodeUriAws("/foo/bar", true), "%2Ffoo%2Fbar");
  assertEquals(encodeUriAws("TEST_~-.", true), "TEST_~-.");
});

Deno.test("montarCanonicalQueryString - deve ordenar lexicograficamente as chaves", () => {
  const query = {
    Version: "2010-05-08",
    Action: "ListUsers",
  };
  const canonicalQuery = montarCanonicalQueryString(query);
  assertEquals(canonicalQuery, "Action=ListUsers&Version=2010-05-08");
});

Deno.test("montarCanonicalUri - deve retornar barra para path vazio", () => {
  assertEquals(montarCanonicalUri(""), "/");
  assertEquals(montarCanonicalUri("/"), "/");
  assertEquals(montarCanonicalUri("products"), "/products");
});

Deno.test("montarCanonicalHeaders - deve ordenar e normalizar headers em lowercase", () => {
  const headers = {
    "Host": "iam.amazonaws.com",
    "Content-Type": "application/json  ",
    "X-Amz-Date": "20150830T123600Z",
  };

  const { canonicalHeaders, signedHeaders } = montarCanonicalHeaders(headers);

  assertEquals(
    canonicalHeaders,
    "content-type:application/json\nhost:iam.amazonaws.com\nx-amz-date:20150830T123600Z\n",
  );
  assertEquals(signedHeaders, "content-type;host;x-amz-date");
});

Deno.test("assinarRequestSpApi - deve gerar headers de autorizacao com data fixa deterministica", async () => {
  const originalHeaders = {
    "Host": "sellingpartnerapi-na.amazon.com",
    "Content-Type": "application/json",
  };

  const signed = await assinarRequestSpApi(
    originalHeaders,
    "AKIAIOSFODNN7EXAMPLE",
    "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "us-east-1",
    "execute-api",
    "POST",
    "/products/fees/v0/items/B000TESTE1/feesEstimate",
    { MarketplaceId: "A2Q3Y263D00KWC" },
    JSON.stringify({ test: "data" }),
    "2015-08-30T12:36:00Z", // Data fixa
  );

  // Deve possuir os headers obrigatorios
  assertEquals(signed["x-amz-date"], "20150830T123600Z");
  assertEquals(signed["Host"], "sellingpartnerapi-na.amazon.com");

  // O header Authorization deve iniciar com o prefixo correto
  const auth = signed["Authorization"];
  assertEquals(auth.startsWith("AWS4-HMAC-SHA256 Credential="), true);
  assertEquals(
    auth.includes(
      "AKIAIOSFODNN7EXAMPLE/20150830/us-east-1/execute-api/aws4_request",
    ),
    true,
  );
  assertEquals(auth.includes("SignedHeaders="), true);
  assertEquals(auth.includes("Signature="), true);
});

Deno.test("assinarRequestSpApi - deve falhar se credenciais estiverem vazias", async () => {
  await assertRejects(
    async () => {
      await assinarRequestSpApi(
        {},
        "",
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "us-east-1",
        "execute-api",
        "GET",
        "/",
        {},
        "",
      );
    },
    Error,
    "Credenciais AWS incompletas para assinatura SigV4.",
  );
});
