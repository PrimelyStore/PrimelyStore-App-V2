import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-primely-internal-token',
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

type InventorySummary = {
  asin?: string
  fnSku?: string
  sellerSku?: string
  condition?: string
  productName?: string
  totalQuantity?: number
  lastUpdatedTime?: string
  inventoryDetails?: {
    fulfillableQuantity?: number
    inboundWorkingQuantity?: number
    inboundShippedQuantity?: number
    inboundReceivingQuantity?: number
    reservedQuantity?: {
      totalReservedQuantity?: number
      pendingCustomerOrderQuantity?: number
      pendingTransshipmentQuantity?: number
      fcProcessingQuantity?: number
    }
    researchingQuantity?: {
      totalResearchingQuantity?: number
    }
    unfulfillableQuantity?: {
      totalUnfulfillableQuantity?: number
      customerDamagedQuantity?: number
      warehouseDamagedQuantity?: number
      distributorDamagedQuantity?: number
      carrierDamagedQuantity?: number
      defectiveQuantity?: number
      expiredQuantity?: number
    }
    futureSupplyQuantity?: {
      reservedFutureSupplyQuantity?: number
      futureSupplyBuyableQuantity?: number
    }
  }
}

type SnapshotRow = {
  marketplace_id: string
  asin: string | null
  fn_sku: string | null
  seller_sku: string
  condition: string
  product_name: string | null

  fulfillable_quantity: number
  inbound_working_quantity: number
  inbound_shipped_quantity: number
  inbound_receiving_quantity: number

  reserved_total_quantity: number
  reserved_pending_customer_order_quantity: number
  reserved_pending_transshipment_quantity: number
  reserved_fc_processing_quantity: number

  researching_total_quantity: number

  unfulfillable_total_quantity: number
  unfulfillable_customer_damaged_quantity: number
  unfulfillable_warehouse_damaged_quantity: number
  unfulfillable_distributor_damaged_quantity: number
  unfulfillable_carrier_damaged_quantity: number
  unfulfillable_defective_quantity: number
  unfulfillable_expired_quantity: number

  future_supply_reserved_quantity: number
  future_supply_buyable_quantity: number

  total_quantity: number
  last_updated_time: string | null
  raw_data: InventorySummary
  sincronizado_em: string
  updated_at: string
}

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

function createSupabaseAdminClient() {
  const supabaseUrl = getRequiredSecret('SUPABASE_URL')
  const serviceRoleKey = getRequiredSecret('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function isAuthorizedRequest(req: Request) {
  const internalToken = Deno.env.get('PRIMELY_INTERNAL_FUNCTION_TOKEN')
  const providedInternalToken = req.headers.get('x-primely-internal-token')

  if (
    isConfigured(internalToken) &&
    providedInternalToken &&
    providedInternalToken === internalToken
  ) {
    return {
      authorized: true,
      mode: 'internal_token',
      user_id: null,
      email: null,
    }
  }

  const authorization = req.headers.get('authorization') ?? ''
  const bearerToken = authorization.replace(/^Bearer\s+/i, '').trim()

  if (!bearerToken) {
    return {
      authorized: false,
      mode: 'none',
      user_id: null,
      email: null,
    }
  }

  const supabaseUrl = getRequiredSecret('SUPABASE_URL')
  const supabaseAnonKey = getRequiredSecret('SUPABASE_ANON_KEY')

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data, error } = await userClient.auth.getUser()

  if (error || !data.user) {
    return {
      authorized: false,
      mode: 'invalid_user_token',
      user_id: null,
      email: null,
    }
  }

  return {
    authorized: true,
    mode: 'authenticated_user',
    user_id: data.user.id,
    email: data.user.email ?? null,
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

function safeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return 0
}

function normalizeLastUpdatedTime(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function mapSummaryToSnapshotRow(
  summary: InventorySummary,
  marketplaceId: string,
  synchronizedAt: string
): SnapshotRow | null {
  const sellerSku = summary.sellerSku?.trim()

  if (!sellerSku) {
    return null
  }

  const details = summary.inventoryDetails ?? {}
  const reserved = details.reservedQuantity ?? {}
  const researching = details.researchingQuantity ?? {}
  const unfulfillable = details.unfulfillableQuantity ?? {}
  const futureSupply = details.futureSupplyQuantity ?? {}

  return {
    marketplace_id: marketplaceId,
    asin: summary.asin ?? null,
    fn_sku: summary.fnSku ?? null,
    seller_sku: sellerSku,
    condition: summary.condition ?? 'UNKNOWN',
    product_name: summary.productName ?? null,

    fulfillable_quantity: safeNumber(details.fulfillableQuantity),
    inbound_working_quantity: safeNumber(details.inboundWorkingQuantity),
    inbound_shipped_quantity: safeNumber(details.inboundShippedQuantity),
    inbound_receiving_quantity: safeNumber(details.inboundReceivingQuantity),

    reserved_total_quantity: safeNumber(reserved.totalReservedQuantity),
    reserved_pending_customer_order_quantity: safeNumber(
      reserved.pendingCustomerOrderQuantity
    ),
    reserved_pending_transshipment_quantity: safeNumber(
      reserved.pendingTransshipmentQuantity
    ),
    reserved_fc_processing_quantity: safeNumber(reserved.fcProcessingQuantity),

    researching_total_quantity: safeNumber(researching.totalResearchingQuantity),

    unfulfillable_total_quantity: safeNumber(
      unfulfillable.totalUnfulfillableQuantity
    ),
    unfulfillable_customer_damaged_quantity: safeNumber(
      unfulfillable.customerDamagedQuantity
    ),
    unfulfillable_warehouse_damaged_quantity: safeNumber(
      unfulfillable.warehouseDamagedQuantity
    ),
    unfulfillable_distributor_damaged_quantity: safeNumber(
      unfulfillable.distributorDamagedQuantity
    ),
    unfulfillable_carrier_damaged_quantity: safeNumber(
      unfulfillable.carrierDamagedQuantity
    ),
    unfulfillable_defective_quantity: safeNumber(
      unfulfillable.defectiveQuantity
    ),
    unfulfillable_expired_quantity: safeNumber(unfulfillable.expiredQuantity),

    future_supply_reserved_quantity: safeNumber(
      futureSupply.reservedFutureSupplyQuantity
    ),
    future_supply_buyable_quantity: safeNumber(
      futureSupply.futureSupplyBuyableQuantity
    ),

    total_quantity: safeNumber(summary.totalQuantity),
    last_updated_time: normalizeLastUpdatedTime(summary.lastUpdatedTime),
    raw_data: summary,
    sincronizado_em: synchronizedAt,
    updated_at: synchronizedAt,
  }
}

function extractInventorySummaries(responseJson: Record<string, unknown>) {
  const payload = responseJson.payload

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const payloadObject = payload as Record<string, unknown>
  const summaries = payloadObject.inventorySummaries

  if (!Array.isArray(summaries)) {
    return []
  }

  return summaries as InventorySummary[]
}

function getNextToken(responseJson: Record<string, unknown>) {
  const payload = responseJson.payload

  if (!payload || typeof payload !== 'object') {
    return null
  }

  const payloadObject = payload as Record<string, unknown>

  return typeof payloadObject.nextToken === 'string'
    ? payloadObject.nextToken
    : null
}

async function saveInventorySnapshot(rows: SnapshotRow[]) {
  if (rows.length === 0) {
    return {
      saved_count: 0,
      skipped_count: 0,
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('amazon_fba_estoque_snapshot')
    .upsert(rows, {
      onConflict: 'marketplace_id,seller_sku,condition',
    })

  if (error) {
    throw new Error(`Supabase snapshot upsert failed: ${error.message}`)
  }

  return {
    saved_count: rows.length,
    skipped_count: 0,
  }
}

async function callFbaInventoryAndSave(req: Request) {
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

  if (!response.ok) {
    return {
      status: response.status,
      ok: false,
      marketplace_id: marketplaceId,
      seller_skus_filter_count: sellerSkus.length,
      details,
      saved_count: 0,
      skipped_without_seller_sku: 0,
      next_token_present: false,
      amazon_response: {
        error_body_preview: responseText.slice(0, 1200),
        response_keys: Object.keys(responseJson),
      },
    }
  }

  const synchronizedAt = new Date().toISOString()
  const summaries = extractInventorySummaries(responseJson)

  const rowsWithNulls = summaries.map((summary) =>
    mapSummaryToSnapshotRow(summary, marketplaceId, synchronizedAt)
  )

  const rows = rowsWithNulls.filter((row): row is SnapshotRow => row !== null)
  const skippedWithoutSellerSku = rowsWithNulls.length - rows.length

  const saveResult = await saveInventorySnapshot(rows)
  const nextToken = getNextToken(responseJson)

  return {
    status: response.status,
    ok: true,
    marketplace_id: marketplaceId,
    seller_skus_filter_count: sellerSkus.length,
    details,
    received_count: summaries.length,
    saved_count: saveResult.saved_count,
    skipped_without_seller_sku: skippedWithoutSellerSku,
    next_token_present: Boolean(nextToken),
    synchronized_at: synchronizedAt,
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
    amazon_response_preview: {
      summaries_preview: summaries.slice(0, 5),
      response_keys: Object.keys(responseJson),
      payload_keys:
        responseJson.payload && typeof responseJson.payload === 'object'
          ? Object.keys(responseJson.payload as Record<string, unknown>)
          : [],
    },
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          error: 'Method not allowed. Use GET or POST.',
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
    const authorization = await isAuthorizedRequest(req)

    if (!authorization.authorized) {
      return new Response(
        JSON.stringify(
          {
            ok: false,
            service: 'amazon-spapi-fba-inventory',
            message:
              'Unauthorized. Use an authenticated Supabase user token or the internal function token.',
            authorization_mode: authorization.mode,
          },
          null,
          2
        ),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const result = await callFbaInventoryAndSave(req)

    return new Response(
      JSON.stringify(
        {
          ok: result.ok,
          service: 'amazon-spapi-fba-inventory',
          message: result.ok
            ? 'FBA Inventory request succeeded and snapshot was saved.'
            : 'FBA Inventory request failed.',
          timestamp: new Date().toISOString(),
          authorization_mode: authorization.mode,
          security_note:
            'This function never returns LWA access token, refresh token, client secret, AWS secret, service role key, or temporary AWS credentials.',
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
