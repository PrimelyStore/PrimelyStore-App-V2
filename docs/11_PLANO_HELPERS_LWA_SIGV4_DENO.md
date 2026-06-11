# Plano de Helpers LWA e AWS SigV4 em Deno (Fase 5.5L-5A)

## 1. Objetivo
Este documento define o plano tecnico detalhado para a futura criacao de helpers Deno TypeScript que gerenciem a autenticacao Login With Amazon (LWA) e a assinatura criptografica AWS Signature Version 4 (SigV4) na Edge Function `amazon-fees-quote`.

Nenhuma linha de codigo de producao e criada nesta fase, nenhuma chamada de rede e efetuada e nenhum secret real e exposto ou lido.

---

## 2. Abordagem Criptografica (Web Crypto API no Deno)
Para evitar o uso de pacotes pesados do AWS SDK no Deno, a geracao da assinatura AWS SigV4 devera utilizar a API nativa Web Crypto (`crypto.subtle`).

### 2.1. Fluxo de Derivacao de Chave (HMAC-SHA256)
A derivacao de chaves no Deno sera feita usando:
1. `crypto.subtle.importKey`:
   - Importar o segredo bruto como chave do tipo `raw`.
   - Algoritmo: `{ name: "HMAC", hash: "SHA-256" }`.
   - Usos permitidos: `["sign"]`.
2. `crypto.subtle.sign`:
   - Assinar a string de derivacao (e.g., date, region, service, request type) sequencialmente com a chave importada.

### 2.2. Algoritmo Detalhado de Derivacao
```typescript
// Exemplo conceitual de passos criptograficos futuros no Deno
async function assinarHmac(chaveBruta: Uint8Array, dados: string): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey(
    "raw",
    chaveBruta,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buffer = new TextEncoder().encode(dados);
  const signature = await crypto.subtle.sign("HMAC", chave, buffer);
  return new Uint8Array(signature);
}

// Derivacao em cadeia
const kDate = await assinarHmac(new TextEncoder().encode("AWS4" + secretKey), dateStamp);
const kRegion = await assinarHmac(kDate, region);
const kService = await assinarHmac(kRegion, service);
const kSigning = await assinarHmac(kService, "aws4_request");
```

---

## 3. Estrutura de Helpers Planejada
Os helpers serao implementados em arquivos isolados da pasta da Edge Function no futuro:

### 3.1. Arquivo: `_helpers_lwa.ts`
Contem funcoes para obter tokens LWA temporarios.
- `obterLwaAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string>`
  - POST sincrono para `https://api.amazon.com/auth/o2/token`
  - Payload encoded como `application/x-www-form-urlencoded`.
  - Retorna `access_token` em caso de sucesso (HTTP 200).
  - Trata erros de rede e credenciais sem registrar as chaves nos logs.

### 3.2. Arquivo: `_helpers_sigv4.ts`
Contem funcoes para geracao criptografica do cabecalho de autorizacao AWS.
- `calcularSha256(payload: string): Promise<string>`
  - Calcula o hash do corpo do request usando `crypto.subtle.digest("SHA-256", data)`.
- `montarCanonicalRequest(metodo: string, path: string, headers: Record<string, string>, bodyHash: string): string`
  - Normaliza headers (lowercase e ordenados) e gera a string canonica.
- `montarStringToSign(dateTime: string, credentialScope: string, canonicalRequestHash: string): string`
  - Monta a string do request a ser assinada.
- `assinarRequestSpApi(headers: Headers, accessKey: string, secretKey: string, region: string, method: string, path: string, body: string): Promise<Headers>`
  - Junta todo o fluxo de derivacao e assinatura, retornando os cabecalhos assinados (`Authorization` e `x-amz-date`).

---

## 4. Fluxo Seguro de Requisicao (SP-API)
O fluxo seguro planejado dentro da Edge Function sera executado na seguinte ordem:
1. **Validacao**: A Edge Function valida CORS, JWT do Supabase local e permissao financeira. Rejeita se invalido.
2. **Obtencao de Token**:
   - Tenta ler o `access_token` LWA ativo.
   - Se expirado ou ausente, invoca `obterLwaAccessToken` e atualiza o token em memoria.
3. **Assinatura SigV4**:
   - Calcula o hash SHA-256 do corpo do payload (SKUs, precos e ASINs).
   - Executa a cadeia de derivacao HMAC usando as chaves AWS configuradas localmente nos Secrets.
   - Monta o cabecalho `Authorization` com a assinatura calculada.
4. **Chamada SP-API**:
   - Dispara o request autenticado para a SP-API da Amazon.
5. **Tratamento de Erros e Sanitizacao**:
   - Bloco try-catch intercepta falhas de rede.
   - Qualquer log de erro passa pela funcao `sanitizarPayloadAmazonFees`, que stripa cabecalhos `Authorization`, tokens LWA e chaves AWS antes de exibir as mensagens no console.

---

## 5. Variveis de Ambiente (Apenas Nomes)
Os helpers dependerao exclusivamente das seguintes chaves configuradas de forma segura no Supabase Vault:
- `AMAZON_LWA_CLIENT_ID`
- `AMAZON_LWA_CLIENT_SECRET`
- `AMAZON_LWA_REFRESH_TOKEN`
- `AMAZON_AWS_ACCESS_KEY_ID`
- `AMAZON_AWS_SECRET_ACCESS_KEY`
- `AMAZON_AWS_REGION` (e.g., `us-east-1`)
- `AMAZON_SPAPI_ENDPOINT` (e.g., `https://sellingpartnerapi-na.amazon.com`)

Nenhuma chave real deve ser colocada neste documento ou commitada no Git.

---

## 6. Plano de Testes Unitarios Locais (Com Mocks)
Os testes unitarios futuros serao escritos em `_helpers.test.ts` e rodarao localmente no Deno sem chamadas reais.
- **Teste de LWA**: Mockar a resposta HTTP da Amazon contendo token ficticio e validar que o parser do access token funciona.
- **Teste de SigV4**: Usar chaves de teste estaticas e strings de teste conhecidas da documentacao da AWS para verificar se o hash SHA-256 e a cadeia de derivacao de chaves HMAC-SHA256 geram a assinatura hex exata esperada.
- **Teste de Sanitizacao**: Inserir tokens reais ficticios em payloads de erro e certificar que a funcao de limpeza remove com sucesso todos os segredos antes do log.

---

## 7. Criterios de Aceite
1. Deno test com 100% de cobertura nos fluxos mockados de LWA e SigV4.
2. Zero imports de dependencias AWS SDK proprietarias (uso estrito da Web Crypto API nativa do Deno).
3. Zero logs exibindo chaves ou segredos reais.
4. Assinatura gerada compativel com o formato e delimitadores exigidos pela AWS.

---

## 8. Riscos de Seguranca
- **Vazamento nos Logs**: Evitado pelo sanitizador de logs de erro nativo.
- **Exposicao no Frontend**: O frontend nunca recebe tokens ou segredos, pois toda a computacao ocorre estritamente dentro do sandbox do Deno na Edge Function.

---

## 9. Rollback Documental
- Remocao do arquivo `docs/11_PLANO_HELPERS_LWA_SIGV4_DENO.md` e git checkout nos arquivos de controle da pasta `docs/antigravity/`.

---

## 10. Resultados da Implementacao Local (Fase 5.5L-5C)
Em 2026-06-11, a implementacao mockada e isolada dos helpers LWA e AWS SigV4 no Deno foi concluida com sucesso absoluto.

### 10.1. Arquivos Criados
- `supabase/functions/amazon-fees-quote/_helpers_lwa.ts`: Implementacao de autenticacao LWA e sanitizacao de erros.
- `supabase/functions/amazon-fees-quote/_helpers_sigv4.ts`: Implementacao de hashes SHA-256 e assinaturas AWS SigV4 baseadas em `crypto.subtle`.
- `supabase/functions/amazon-fees-quote/_helpers_lwa.test.ts`: Testes unitarios do fluxo LWA (5 testes passando).
- `supabase/functions/amazon-fees-quote/_helpers_sigv4.test.ts`: Testes unitarios do fluxo SigV4 (7 testes passando).

### 10.2. Resumo de Testes Executados
Todos os 12 testes unitarios foram executados sem permissao de rede (`--allow-net` desativado) e sem variaveis de ambiente, garantindo isolamento total do ambiente de producao:
- `deno fmt --check`: OK (codigo formatado).
- `deno check`: OK (tipo TypeScript validado).
- `deno test`: OK (12 testes passando em 104ms).

