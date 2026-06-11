# Planejamento Tecnico Documental - LWA e Assinatura AWS SigV4 (Fase 5.5L-4Y)

## 1. Objetivo
Este documento define o planejamento tecnico e a arquitetura de seguranca para a futura implementacao da autenticacao Login With Amazon (LWA) e do protocolo de assinatura AWS Signature Version 4 (SigV4) na Edge Function `amazon-fees-quote`.

Nenhuma linha de codigo operacional foi implementada nesta etapa, nenhuma chamada de rede real foi efetuada e nenhum segredo ou credencial real foi lido.

---

## 2. Contexto Atual da Edge Function
A Edge Function `amazon-fees-quote` local encontra-se atualmente estruturada da seguinte forma:
- **`index.ts`**: Esqueleto seguro de mock. Valida CORS, o metodo HTTP (POST), a presenca do JWT do Supabase Auth local, a permissao financeira do usuario e busca o mapeamento ativo no banco de dados.
- **`_helpers.ts`**: Helpers puros TypeScript para normalizar parametros, validar entradas, montar os payloads da Amazon (por SKU, ASIN ou lote), extrair as taxas da resposta e sanitizar logs de dados sensiveis.
- **`_helpers.test.ts`**: 16 testes unitarios rodando via `deno test` cobrindo todas as funcoes puras.

---

## 3. Planejamento da Autenticacao LWA (Login With Amazon)
A Selling Partner API (SP-API) exige que toda chamada contenha um access token temporario associado a aplicacao parceira da Amazon.

### 3.1. Fluxo de Geracao de Token
1. **Chamada**: A Edge Function realizara um POST sincrono para o endpoint de autenticacao da Amazon:
   `POST https://api.amazon.com/auth/o2/token`
2. **Payload**: O body da requisicao devera conter os parametros em formato `application/x-www-form-urlencoded`:
   - `grant_type = refresh_token`
   - `client_id = AMAZON_LWA_CLIENT_ID`
   - `client_secret = AMAZON_LWA_CLIENT_SECRET`
   - `refresh_token = AMAZON_LWA_REFRESH_TOKEN`
3. **Response de Sucesso (HTTP 200)**: Retorna um JSON contendo:
   - `access_token`: String do token de acesso.
   - `expires_in`: Tempo de expiracao do token em segundos (padrao: 3600s / 1 hora).
4. **Armazenamento em Memoria**: O token LWA temporario devera ser usado na chamada da API subsequente e nunca armazenado de forma persistente em banco ou enviado ao navegador.

---

## 4. Planejamento da Assinatura AWS SigV4
Todas as chamadas para endpoints da SP-API devem ser assinadas digitalmente usando o protocolo AWS Signature Version 4. Isso garante a autoria, integridade e protecao do request contra ataques de replay.

### 4.1. Elementos Necessarios para a Assinatura
- **AWS Access Key ID** e **AWS Secret Access Key** associados a um usuario IAM com permissao para invocar a SP-API.
- **AWS Region**: Regiao da AWS associada ao endpoint da SP-API (e.g., `us-east-1` para o endpoint norte-americano que atende o Brasil).
- **AWS Service**: O servico a ser assinado e `execute-api`.
- **ISO8601 Date**: Data/Hora da requisicao formatada no padrao UTC UTC (e.g., `YYYYMMDDTHHMMSSZ` e `YYYYMMDD`).

### 4.2. Algoritmo de Assinatura (Conceitual)
1. **Construcao da Requisicao Canonica (Canonical Request)**:
   - Formatar o metodo HTTP (POST).
   - URI do recurso com URL encoding.
   - Query String ordenada e codificada.
   - Cabecalhos (headers) formatados e ordenados alfabeticamente.
   - Hash SHA-256 do body do request.
2. **Construcao da String para Assinatura (String to Sign)**:
   - Algoritmo: `AWS4-HMAC-SHA256`.
   - Data/Hora UTC.
   - Escopo de Credencial: `data/regiao/execute-api/aws4_request`.
   - Hash SHA-256 do Canonical Request.
3. **Geracao da Chave de Assinatura (Signing Key)**:
   - Derivacao criptografica sucessiva usando HMAC-SHA256 a partir da AWS Secret Access Key:
     - `kDate = HMAC-SHA256("AWS4" + SecretAccessKey, "YYYYMMDD")`
     - `kRegion = HMAC-SHA256(kDate, Regiao)`
     - `kService = HMAC-SHA256(kRegion, "execute-api")`
     - `kSigning = HMAC-SHA256(kService, "aws4_request")`
4. **Calculo da Assinatura**:
   - Assinatura = Hex(HMAC-SHA256(kSigning, StringToSign)).
5. **Cabecalho Authorization**:
   - Montar a string `Authorization: AWS4-HMAC-SHA256 Credential=AccessKey/Escopo, SignedHeaders=..., Signature=...`.

### 4.3. Implementacao Futura em Deno
A assinatura SigV4 devera ser feita usando criptografia nativa Web Crypto (`crypto.subtle`) disponivel no Deno para evitar importacoes de pacotes AWS SDK pesados ou obsoletos.

---

## 5. Variaveis de Ambiente Necessarias (Nomes Apenas)
Para que a Edge Function opere de forma integrada no futuro, os seguintes segredos devem ser configurados exclusivamente no Supabase Vault / Edge Function Secrets:
- `AMAZON_LWA_CLIENT_ID`
- `AMAZON_LWA_CLIENT_SECRET`
- `AMAZON_LWA_REFRESH_TOKEN`
- `AMAZON_AWS_ACCESS_KEY_ID`
- `AMAZON_AWS_SECRET_ACCESS_KEY`
- `AMAZON_AWS_ROLE_ARN` (opcional, para assumir role temporaria)
- `AMAZON_AWS_REGION`
- `AMAZON_SPAPI_ENDPOINT`

Nenhuma chave ou valor real deve constar neste planejamento documental ou ser commitada no repositorio.

---

## 6. Riscos de Seguranca e Mitigacoes
- **Risco**: Vazamento de tokens ou chaves AWS IAM nos logs do Deno.
  - *Mitigacao*: Aplicar a funcao `sanitizarPayloadAmazonFees` em todo bloco `console.log` ou `console.error` dentro da Edge Function, eliminando cabecalhos `Authorization`, `x-amz-access-token` e credenciais AWS.
- **Risco**: Expor chaves no frontend.
  - *Mitigacao*: Toda a operacao criptografica e requisicao externa ocorre dentro da Edge Function (Deno Sandbox). O frontend apenas envia `mapeamento_id` e `preco_consultado`, e recebe de volta valores numericos de taxas ja calculados, sem qualquer contato com segredos.
- **Risco**: Ataques de Replay ou vazamento de chaves locais.
  - *Mitigacao*: O uso de credenciais locais em `.env.local` deve ser evitado pelo Antigravity/Codex. O script local de testes deve operar com mocks para validar o comportamento, restringindo o uso de credenciais reais apenas ao ambiente remoto seguro da Amazon e do Supabase Vault de producao.

---

## 7. Criterios de Aceite (Futura Implementacao)
1. O helper `obterAmazonAccessToken` deve gerar tokens validos de LWA via POST com codificacao urlencoded.
2. O helper `assinarRequestSpApi` deve gerar cabecalhos de assinatura AWS SigV4 compativeis usando Web Crypto API.
3. Chaves IAM ou tokens de acesso nao devem aparecer em nenhuma mensagem de retorno ao cliente ou logs da funcao.
4. Testes unitarios locais com dados mockados devem cobrir o fluxo criptografico da assinatura sem vazar chaves.

---

## 8. Rollback Tecnico e Documental
- **Rollback Tecnico**: Manter a chave `origem = "mock"` ativa no index.ts e isolar os novos helpers em arquivos desligados das rotas de producao.
- **Rollback Documental**: Exclusao do arquivo `docs/10_PLANEJAMENTO_LWA_SIGV4_AMAZON.md` e revert em `docs/09_CONTRATO_TAXAS_MARKETPLACE_API.md`.

