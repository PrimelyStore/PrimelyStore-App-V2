// supabase/functions/amazon-fees-quote/_helpers_sigv4.ts

export async function calcularSha256(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload || "");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function assinarHmac(
  key: Uint8Array | string,
  data: string,
): Promise<Uint8Array> {
  const keyUint8 = typeof key === "string"
    ? new TextEncoder().encode(key)
    : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyUint8 as any,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const dataUint8 = new TextEncoder().encode(data);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    dataUint8,
  );
  return new Uint8Array(signatureBuffer);
}

export async function derivarChaveAssinatura(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<Uint8Array> {
  const kDate = await assinarHmac("AWS4" + secretKey, dateStamp);
  const kRegion = await assinarHmac(kDate, region);
  const kService = await assinarHmac(kRegion, service);
  const kSigning = await assinarHmac(kService, "aws4_request");
  return kSigning;
}

export function encodeUriAws(val: string, encodeSlash: boolean): string {
  let result = "";
  for (let i = 0; i < val.length; i++) {
    const ch = val[i];
    if (
      (ch >= "A" && ch <= "Z") ||
      (ch >= "a" && ch <= "z") ||
      (ch >= "0" && ch <= "9") ||
      ch === "_" || ch === "-" || ch === "~" || ch === "."
    ) {
      result += ch;
    } else if (ch === "/") {
      result += encodeSlash ? "%2F" : ch;
    } else {
      const code = ch.charCodeAt(0);
      result += "%" + code.toString(16).toUpperCase().padStart(2, "0");
    }
  }
  return result;
}

export function montarCanonicalQueryString(
  queryParams: Record<string, string>,
): string {
  if (!queryParams) return "";
  const keys = Object.keys(queryParams).sort();
  const pairs: string[] = [];
  for (const key of keys) {
    const encodedKey = encodeUriAws(key, true);
    const encodedValue = encodeUriAws(queryParams[key], true);
    pairs.push(`${encodedKey}=${encodedValue}`);
  }
  return pairs.join("&");
}

export function montarCanonicalUri(path: string): string {
  if (!path) return "/";
  const absolutePath = path.startsWith("/") ? path : "/" + path;
  return encodeUriAws(absolutePath, false);
}

export function montarCanonicalHeaders(
  headers: Record<string, string>,
): { canonicalHeaders: string; signedHeaders: string } {
  if (!headers) return { canonicalHeaders: "", signedHeaders: "" };
  const sortedKeys = Object.keys(headers).map((k) => k.toLowerCase()).sort();
  let canonicalHeaders = "";
  const signedHeadersList: string[] = [];

  for (const key of sortedKeys) {
    const originalKey = Object.keys(headers).find((k) =>
      k.toLowerCase() === key
    );
    if (originalKey) {
      const value = headers[originalKey].trim().replace(/\s+/g, " ");
      canonicalHeaders += `${key}:${value}\n`;
      signedHeadersList.push(key);
    }
  }

  return {
    canonicalHeaders,
    signedHeaders: signedHeadersList.join(";"),
  };
}

export function montarCanonicalRequest(
  method: string,
  path: string,
  queryString: string,
  canonicalHeaders: string,
  signedHeaders: string,
  bodyHash: string,
): string {
  return [
    method.toUpperCase(),
    montarCanonicalUri(path),
    queryString,
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");
}

export function montarStringToSign(
  dateTime: string,
  credentialScope: string,
  canonicalRequestHash: string,
): string {
  return [
    "AWS4-HMAC-SHA256",
    dateTime,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");
}

export async function assinarRequestSpApi(
  headers: Record<string, string>,
  accessKey: string,
  secretKey: string,
  region: string,
  service: string,
  method: string,
  path: string,
  queryParams: Record<string, string>,
  body: string,
  fixedDateTime?: string,
): Promise<Record<string, string>> {
  if (!accessKey || !secretKey || !region || !service) {
    throw new Error("Credenciais AWS incompletas para assinatura SigV4.");
  }

  const now = fixedDateTime ? new Date(fixedDateTime) : new Date();
  const dateTime = now.toISOString().replace(/[:-]/g, "").replace(
    /\.\d{3}/,
    "",
  );
  const dateStamp = dateTime.substring(0, 8);

  const headersAssinados = { ...headers };
  headersAssinados["x-amz-date"] = dateTime;

  const bodyHash = await calcularSha256(body);

  const { canonicalHeaders, signedHeaders } = montarCanonicalHeaders(
    headersAssinados,
  );
  const queryString = montarCanonicalQueryString(queryParams);

  const canonicalRequest = montarCanonicalRequest(
    method,
    path,
    queryString,
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  );

  const canonicalRequestHash = await calcularSha256(canonicalRequest);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const stringToSign = montarStringToSign(
    dateTime,
    credentialScope,
    canonicalRequestHash,
  );

  const signingKey = await derivarChaveAssinatura(
    secretKey,
    dateStamp,
    region,
    service,
  );
  const signatureBytes = await assinarHmac(signingKey, stringToSign);
  const signatureHex = Array.from(signatureBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  headersAssinados["Authorization"] =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

  return headersAssinados;
}
