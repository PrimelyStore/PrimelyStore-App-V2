const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const encoder = new TextEncoder()

type TemporaryAwsCredentials = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  expiration: string | null
}

type SignedHeaders = Record<string, string>

function isConfigured(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0
}

function getRequiredSecret(name: string) {
  const value = Deno.env.get(name)

  if (!isConfigured(value)) {
    throw new Error(`Missing required secret: ${name}`)
  }

  return value!.trim()
}

function toHex(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)

  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  )
}

function buildCanonicalQuery(params: URLSearchParams) {
  return Array.from(params.entries())
    .sort(([keyA, valueA], [keyB, valueB]) => {
      if (keyA === keyB) {
        return valueA.localeCompare(valueB)
      }

      return keyA.localeCompare(keyB)
    })
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join('&')
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return toHex(digest)
}

async function hmacSha256Raw(key: Uint8Array | ArrayBuffer, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    {
      name: 'HMAC',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(value)
  )

  return new Uint8Array(signature)
}

function getAmzDates(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '')

  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  }
}

function getCredentialScope(
  dateStamp: string,
  region: string,
  service: string
) {
  return `${dateStamp}/${region}/${service}/aws4_request`
}

async function getSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
) {
  const kDate = await hmacSha256Raw(
    encoder.encode(`AWS4${secretAccessKey}`),
    dateStamp
  )
  const kRegion = await hmacSha256Raw(kDate, region)
  const kService = await hmacSha256Raw(kRegion, service)
  return await hmacSha256Raw(kService, 'aws4_request')
}

async function signAwsRequest(params: {
  method: string
  url: URL
  region: string
  service: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string | null
  extraHeaders?: SignedHeaders
  body?: string
}) {
  const method = params.method.toUpperCase()
  const body = params.body ?? ''
  const { amzDate, dateStamp } = getAmzDates()
  const credentialScope = getCredentialScope(
    dateStamp,
    params.region,
    params.service
  )

  const headersToSign: SignedHeaders = {
    host: params.url.host,
    'x-amz-date': amzDate,
    ...(params.sessionToken ? { 'x-amz-security-token': params.sessionToken } : {}),
    ...(params.extraHeaders ?? {}),
  }

  const sortedHeaderNames = Object.keys(headersToSign)
    .map((header) => header.toLowerCase())
    .sort()

  const normalizedHeaders: SignedHeaders = {}

  for (const headerName of sortedHeaderNames) {
    const originalValue = headersToSign[headerName]
    normalizedHeaders[headerName] = originalValue.trim().replace(/\s+/g, ' ')
  }

  const canonicalHeaders = sortedHeaderNames
    .map((headerName) => `${headerName}:${normalizedHeaders[headerName]}\n`)
    .join('')

  const signedHeaders = sortedHeaderNames.join(';')
  const payloadHash = await sha256Hex(body)
  const canonicalQuery = buildCanonicalQuery(params.url.searchParams)

  const canonicalRequest = [
    method,
    params.url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n')

  const signingKey = await getSigningKey(
    params.secretAccessKey,
    dateStamp,
    params.region,
    params.service
  )

  const signature = toHex(await hmacSha256Raw(signingKey, stringToSign))

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ')

  return {
    authorization,
    signedHeaders,
    amzDate,
    headers: {
      ...normalizedHeaders,
      authorization,
    },
  }
}

async function requestLwaAccessToken() {
  const clientId = getRequiredSecret('SPAPI_LWA_CLIENT_ID')
  const clientSecret = getRequiredSecret('SPAPI_LWA_CLIENT_SECRET')
  const refreshToken = getRequiredSecret('SPAPI_REFRESH_TOKEN')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  })

  const responseText = await response.text()

  let responseJson: Record<string, unknown> = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `LWA token request failed: ${response.status} ${
        typeof responseJson.error === 'string' ? responseJson.error : ''
      } ${
        typeof responseJson.error_description === 'string'
          ? responseJson.error_description
          : ''
      }`.trim()
    )
  }

  if (typeof responseJson.access_token !== 'string') {
    throw new Error('LWA response did not include access_token.')
  }

  return {
    accessToken: responseJson.access_token,
    tokenType:
      typeof responseJson.token_type === 'string'
        ? responseJson.token_type
        : null,
    expiresIn:
      typeof responseJson.expires_in === 'number'
        ? responseJson.expires_in
        : null,
  }
}

function extractXmlValue(xml: string, tagName: string) {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's')
  const match = xml.match(regex)
  return match?.[1] ?? null
}

async function assumeSpApiRole() {
  const region = getRequiredSecret('SPAPI_REGION')
  const accessKeyId = getRequiredSecret('SPAPI_AWS_ACCESS_KEY_ID')
  const secretAccessKey = getRequiredSecret('SPAPI_AWS_SECRET_ACCESS_KEY')
  const roleArn = getRequiredSecret('SPAPI_ROLE_ARN')

  const url = new URL('https://sts.amazonaws.com/')
  url.searchParams.set('Action', 'AssumeRole')
  url.searchParams.set('RoleArn', roleArn)
  url.searchParams.set('RoleSessionName', 'PrimelyStoreSPAPI')
  url.searchParams.set('DurationSeconds', '3600')
  url.searchParams.set('Version', '2011-06-15')

  const signedRequest = await signAwsRequest({
    method: 'GET',
    url,
    region,
    service: 'sts',
    accessKeyId,
    secretAccessKey,
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: signedRequest.headers,
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(
      `AWS STS AssumeRole failed: ${response.status} ${responseText.slice(0, 700)}`
    )
  }

  const temporaryCredentials: TemporaryAwsCredentials = {
    accessKeyId: extractXmlValue(responseText, 'AccessKeyId') ?? '',
    secretAccessKey: extractXmlValue(responseText, 'SecretAccessKey') ?? '',
    sessionToken: extractXmlValue(responseText, 'SessionToken') ?? '',
    expiration: extractXmlValue(responseText, 'Expiration'),
  }

  if (
    !temporaryCredentials.accessKeyId ||
    !temporaryCredentials.secretAccessKey ||
    !temporaryCredentials.sessionToken
  ) {
    throw new Error('AWS STS response did not include temporary credentials.')
  }

  return temporaryCredentials
}

function parseSellerSkusFromRequest(req: Request) {
  const url = new URL(req.url)
  const sellerSku = url.searchParams.get('sellerSku')
  const sellerSkus = url.searchParams.get('sellerSkus')

  const values = [sellerSku, sellerSkus]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set(values)).slice(0, 50)
}

function createInventoryUrl(req: Request) {
  const endpoint = getRequiredSecret('SPAPI_ENDPOINT').replace(/\/$/, '')
  const marketplaceId = getRequiredSecret('SPAPI_MARKETPLACE_ID')

  const requestUrl = new URL(req.url)
  const details = requestUrl.searchParams.get('details') ?? 'true'
  const sellerSkus = parseSellerSkusFromRequest(req)

  const url = new URL('/fba/inventory/v1/summaries', endpoint)

  url.searchParams.set('details', details)
  url.searchParams.set('granularityType', 'Marketplace')
  url.searchParams.set('granularityId', marketplaceId)
  url.searchParams.set('marketplaceIds', marketplaceId)

  for (const sku of sellerSkus) {
    url.searchParams.append('sellerSkus', sku)
  }

  return {
    url,
    marketplaceId,
    sellerSkus,
    details,
  }
}

function buildInventoryPreview(responseJson: Record<string, unknown>) {
  const payload = responseJson.payload

  if (!payload || typeof payload !== 'object') {
    return {
      inventory_summaries_count: 0,
      next_token_present: false,
      summaries_preview: [],
      response_keys: Object.keys(responseJson),
    }
  }

  const payloadObject = payload as Record<string, unknown>
  const summaries = payloadObject.inventorySummaries

  const summariesArray = Array.isArray(summaries) ? summaries : []

  return {
    inventory_summaries_count: summariesArray.length,
    next_token_present: typeof payloadObject.nextToken === 'string',
    summaries_preview: summariesArray.slice(0, 10),
    response_keys: Object.keys(responseJson),
    payload_keys: Object.keys(payloadObject),
  }
}

async function callFbaInventory(req: Request) {
  const region = getRequiredSecret('SPAPI_REGION')
  const lwa = await requestLwaAccessToken()
  const awsCredentials = await assumeSpApiRole()
  const { url, marketplaceId, sellerSkus, details } = createInventoryUrl(req)

  const signedRequest = await signAwsRequest({
    method: 'GET',
    url,
    region,
    service: 'execute-api',
    accessKeyId: awsCredentials.accessKeyId,
    secretAccessKey: awsCredentials.secretAccessKey,
    sessionToken: awsCredentials.sessionToken,
    extraHeaders: {
      'x-amz-access-token': lwa.accessToken,
    },
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: signedRequest.headers,
  })

  const responseText = await response.text()

  let responseJson: Record<string, unknown> = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  return {
    status: response.status,
    ok: response.ok,
    marketplace_id: marketplaceId,
    seller_skus_filter_count: sellerSkus.length,
    details,
    lwa: {
      token_received: true,
      token_type: lwa.tokenType,
      expires_in: lwa.expiresIn,
    },
    aws: {
      assumed_role: true,
      temporary_credentials_received: true,
      temporary_credentials_expiration: awsCredentials.expiration,
    },
    spapi_request: {
      path: url.pathname,
      query_keys: Array.from(url.searchParams.keys()),
    },
    amazon_response: response.ok
      ? buildInventoryPreview(responseJson)
      : {
          error_body_preview: responseText.slice(0, 1200),
          response_keys: Object.keys(responseJson),
        },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: 'Method not allowed. Use GET.',
        },
        null,
        2
      ),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  try {
    const result = await callFbaInventory(req)

    return new Response(
      JSON.stringify(
        {
          ok: result.ok,
          service: 'amazon-spapi-fba-inventory',
          message: result.ok
            ? 'FBA Inventory request succeeded.'
            : 'FBA Inventory request failed.',
          timestamp: new Date().toISOString(),
          security_note:
            'This function never returns LWA access token, refresh token, client secret, AWS secret, or temporary AWS credentials.',
          result,
        },
        null,
        2
      ),
      {
        status: result.ok ? 200 : 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Edge Function error.'

    return new Response(
      JSON.stringify(
        {
          ok: false,
          service: 'amazon-spapi-fba-inventory',
          message,
          security_note:
            'No secret value is returned by this function.',
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
