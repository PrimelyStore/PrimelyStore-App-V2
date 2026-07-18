// supabase/functions/amazon-fees-quote/_helpers_lwa.ts

export function sanitizarMensagemLwa(msg: string): string {
  if (!msg) return "";
  return msg
    .replace(/client_secret=[^&]+/g, "client_secret=[REDACTED]")
    .replace(/refresh_token=[^&]+/g, "refresh_token=[REDACTED]")
    .replace(/client_id=[^&]+/g, "client_id=[REDACTED]")
    .replace(/client_secret%22%3A%22[^%]+/g, "client_secret%22%3A%22[REDACTED]")
    .replace(/"client_secret"\s*:\s*"[^"]*"/g, '"client_secret":"[REDACTED]"')
    .replace(/"refresh_token"\s*:\s*"[^"]*"/g, '"refresh_token":"[REDACTED]"');
}

export async function obterLwaAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  fetchFn = fetch,
): Promise<string> {
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Credenciais LWA incompletas.");
  }

  const url = "https://api.amazon.com/auth/o2/token";
  const bodyParams = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  try {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const cleanError = sanitizarMensagemLwa(errorText);
      throw new Error(
        `Erro na autenticacao LWA (status ${response.status}): ${cleanError}`,
      );
    }

    const data = await response.json();
    if (!data || !data.access_token) {
      throw new Error("Resposta do servidor LWA nao contem access_token.");
    }

    return data.access_token;
  } catch (error: any) {
    const rawMsg = error.message || String(error);
    const cleanMsg = sanitizarMensagemLwa(rawMsg);
    throw new Error(`Falha ao obter access token LWA: ${cleanMsg}`);
  }
}
