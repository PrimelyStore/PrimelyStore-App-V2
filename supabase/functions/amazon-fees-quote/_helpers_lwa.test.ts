// supabase/functions/amazon-fees-quote/_helpers_lwa.test.ts

import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { obterLwaAccessToken, sanitizarMensagemLwa } from "./_helpers_lwa.ts";

Deno.test("sanitizarMensagemLwa - deve remover parametros de query sensiveis", () => {
  const queryError =
    "error=invalid_client&client_secret=supersecret123&refresh_token=rt_456&client_id=cid_789";
  const clean = sanitizarMensagemLwa(queryError);
  assertEquals(
    clean,
    "error=invalid_client&client_secret=[REDACTED]&refresh_token=[REDACTED]&client_id=[REDACTED]",
  );
});

Deno.test("sanitizarMensagemLwa - deve remover propriedades JSON sensiveis", () => {
  const jsonError =
    '{"error":"invalid_grant","client_secret":"mysecret","refresh_token":"mytoken"}';
  const clean = sanitizarMensagemLwa(jsonError);
  assertEquals(
    clean,
    '{"error":"invalid_grant","client_secret":"[REDACTED]","refresh_token":"[REDACTED]"}',
  );
});

Deno.test("obterLwaAccessToken - deve retornar token obtido com sucesso via mock", async () => {
  const fakeFetch = () => {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          access_token: "Atzr|MockAccessToken",
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );
  };

  const token = await obterLwaAccessToken(
    "mock-client-id",
    "mock-client-secret",
    "mock-refresh-token",
    fakeFetch as any,
  );

  assertEquals(token, "Atzr|MockAccessToken");
});

Deno.test("obterLwaAccessToken - deve sanitizar chaves na resposta de erro 400 da Amazon", async () => {
  const fakeFetch = () => {
    return Promise.resolve(
      new Response(
        "error=invalid_client&client_secret=segredomuitoimportante&refresh_token=refreshsecreto",
        { status: 400 },
      ),
    );
  };

  const promise = obterLwaAccessToken(
    "mock-client-id",
    "mock-client-secret",
    "mock-refresh-token",
    fakeFetch as any,
  );

  await assertRejects(
    async () => {
      await promise;
    },
    Error,
    "client_secret=[REDACTED]",
  );

  await assertRejects(
    async () => {
      await promise;
    },
    Error,
    "refresh_token=[REDACTED]",
  );
});

Deno.test("obterLwaAccessToken - deve lancar erro caso access_token nao venha no JSON", async () => {
  const fakeFetch = () => {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );
  };

  await assertRejects(
    async () => {
      await obterLwaAccessToken(
        "mock-client-id",
        "mock-client-secret",
        "mock-refresh-token",
        fakeFetch as any,
      );
    },
    Error,
    "Resposta do servidor LWA nao contem access_token.",
  );
});
