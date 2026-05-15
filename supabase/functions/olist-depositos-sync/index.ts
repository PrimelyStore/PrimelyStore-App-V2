import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-primely-internal-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

type OlistTokenRow = {
  id: string
  provider: string
  access_token: string
  refresh_token: string | null
  token_type: string | null
  scope: string | null
  expires_in: number | null
  expires_at: string | null
  refresh_expires_at: string | null
  status: string
  created_at: string
  updated_at: string
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  refresh_expires_in?: number
  scope?: string
  [key: string]: unknown
}

type OlistDeposito = {
  id?: number
  descricao?: string
  tipo?: string
  desconsideraSaldo?: boolean
  padrao?: boolean
  possuiReserva?: boolean
  [key: string]: unknown
}

type SnapshotRow = {
  id_deposito_olist: number
  descricao: string
  tipo: string | null
  desconsidera_saldo: boolean
  padrao: boolean
  possui_reserva: boolean
  raw_data: OlistDeposito
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

function addSeconds(date: Date, seconds?: number | null) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return null
  }

  return new Date(date.getTime() + seconds * 1000).toISOString()
}

function tokenExpiraEmMenosDeCincoMinutos(token: OlistTokenRow) {
  if (!token.expires_at) {
    return false
  }

  const expiresAt = new Date(token.expires_at).getTime()
  const margemSegurancaMs = 5 * 60 * 1000

  return expiresAt <= Date.now() + margemSegurancaMs
}

async function buscarTokenAtivo() {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_oauth_tokens')
    .select(
      'id, provider, access_token, refresh_token, token_type, scope, expires_in, expires_at, refresh_expires_at, status, created_at, updated_at'
    )
    .eq('provider', 'olist_tiny')
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Supabase token lookup failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No active Olist OAuth token found.')
  }

  return data as OlistTokenRow
}

function validarRefreshToken(token: OlistTokenRow) {
  if (!token.refresh_token) {
    throw new Error('Active Olist token does not have refresh_token.')
  }

  if (token.refresh_expires_at) {
    const refreshExpirou =
      new Date(token.refresh_expires_at).getTime() <= Date.now()

    if (refreshExpirou) {
      throw new Error(
        'Olist refresh token is expired. Run the OAuth authorization flow again.'
      )
    }
  }
}

async function renovarTokenNoOlist(refreshToken: string) {
  const tokenUrl = getRequiredSecret('OLIST_TOKEN_URL')
  const clientId = getRequiredSecret('OLIST_CLIENT_ID')
  const clientSecret = getRequiredSecret('OLIST_CLIENT_SECRET')

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  })

  const responseText = await response.text()

  let responseJson: TokenResponse = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    const safeError =
      typeof responseJson.error === 'string' ? responseJson.error : responseText

    throw new Error(
      `Olist refresh token request failed: ${response.status} ${String(
        safeError
      ).slice(0, 500)}`
    )
  }

  if (!responseJson.access_token) {
    throw new Error('Olist refresh response did not include access_token.')
  }

  return responseJson
}

async function salvarNovoToken(
  tokenAnterior: OlistTokenRow,
  tokenResponse: TokenResponse
) {
  const supabaseAdmin = createSupabaseAdminClient()
  const now = new Date()
  const nowIso = now.toISOString()

  const expiresAt = addSeconds(now, tokenResponse.expires_in)
  const refreshExpiresAt = addSeconds(now, tokenResponse.refresh_expires_in)
  const novoRefreshToken =
    tokenResponse.refresh_token ?? tokenAnterior.refresh_token

  const { error: updateError } = await supabaseAdmin
    .from('olist_oauth_tokens')
    .update({
      status: 'substituido',
      updated_at: nowIso,
    })
    .eq('provider', 'olist_tiny')
    .eq('status', 'ativo')

  if (updateError) {
    throw new Error(
      `Supabase previous token update failed: ${updateError.message}`
    )
  }

  const { error: insertError } = await supabaseAdmin
    .from('olist_oauth_tokens')
    .insert({
      provider: 'olist_tiny',
      access_token: tokenResponse.access_token,
      refresh_token: novoRefreshToken,
      token_type: tokenResponse.token_type ?? tokenAnterior.token_type,
      scope: tokenResponse.scope ?? tokenAnterior.scope,
      expires_in: tokenResponse.expires_in ?? null,
      expires_at: expiresAt,
      refresh_expires_at: refreshExpiresAt ?? tokenAnterior.refresh_expires_at,
      raw_response: tokenResponse,
      status: 'ativo',
      created_at: nowIso,
      updated_at: nowIso,
    })

  if (insertError) {
    throw new Error(`Supabase new token insert failed: ${insertError.message}`)
  }

  return {
    ...tokenAnterior,
    access_token: tokenResponse.access_token,
    refresh_token: novoRefreshToken ?? null,
    token_type: tokenResponse.token_type ?? tokenAnterior.token_type,
    scope: tokenResponse.scope ?? tokenAnterior.scope,
    expires_in: tokenResponse.expires_in ?? null,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt ?? tokenAnterior.refresh_expires_at,
    status: 'ativo',
    updated_at: nowIso,
  } as OlistTokenRow
}

async function obterTokenValido() {
  const token = await buscarTokenAtivo()

  if (!tokenExpiraEmMenosDeCincoMinutos(token)) {
    return {
      token,
      refreshed: false,
    }
  }

  validarRefreshToken(token)

  const tokenResponse = await renovarTokenNoOlist(token.refresh_token!)
  const refreshedToken = await salvarNovoToken(token, tokenResponse)

  return {
    token: refreshedToken,
    refreshed: true,
  }
}

async function buscarDepositosOlist(accessToken: string) {
  const url = 'https://api.tiny.com.br/public-api/v3/depositos'

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const responseText = await response.text()

  let responseJson: unknown = null

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = null
  }

  if (!response.ok) {
    throw new Error(
      `Olist deposits request failed: ${response.status} ${responseText.slice(
        0,
        1200
      )}`
    )
  }

  if (Array.isArray(responseJson)) {
    return responseJson as OlistDeposito[]
  }

  if (
    responseJson &&
    typeof responseJson === 'object' &&
    'itens' in responseJson &&
    Array.isArray((responseJson as { itens?: unknown }).itens)
  ) {
    return (responseJson as { itens: OlistDeposito[] }).itens
  }

  if (
    responseJson &&
    typeof responseJson === 'object' &&
    'depositos' in responseJson &&
    Array.isArray((responseJson as { depositos?: unknown }).depositos)
  ) {
    return (responseJson as { depositos: OlistDeposito[] }).depositos
  }

  const responseKeys =
    responseJson && typeof responseJson === 'object'
      ? Object.keys(responseJson as Record<string, unknown>).join(', ')
      : 'sem chaves'

  throw new Error(
    `Olist deposits response format not recognized. Response keys: ${responseKeys}. Body preview: ${responseText.slice(
      0,
      1200
    )}`
  )
}

function trimOrNull(value?: string | null) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed || null
}

function booleanSeguro(value: unknown) {
  return typeof value === 'boolean' ? value : false
}

function mapDepositoToSnapshotRow(
  deposito: OlistDeposito,
  synchronizedAt: string
): SnapshotRow | null {
  if (typeof deposito.id !== 'number' || !Number.isFinite(deposito.id)) {
    return null
  }

  const descricao = trimOrNull(deposito.descricao)

  if (!descricao) {
    return null
  }

  return {
    id_deposito_olist: deposito.id,
    descricao,
    tipo: trimOrNull(deposito.tipo),
    desconsidera_saldo: booleanSeguro(deposito.desconsideraSaldo),
    padrao: booleanSeguro(deposito.padrao),
    possui_reserva: booleanSeguro(deposito.possuiReserva),
    raw_data: deposito,
    sincronizado_em: synchronizedAt,
    updated_at: synchronizedAt,
  }
}

async function salvarDepositosSnapshot(rows: SnapshotRow[]) {
  if (rows.length === 0) {
    return {
      saved_count: 0,
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('olist_depositos_snapshot')
    .upsert(rows, {
      onConflict: 'id_deposito_olist',
    })

  if (error) {
    throw new Error(`Supabase deposits snapshot upsert failed: ${error.message}`)
  }

  return {
    saved_count: rows.length,
  }
}

async function sincronizarDepositos(accessToken: string) {
  const synchronizedAt = new Date().toISOString()
  const depositos = await buscarDepositosOlist(accessToken)

  const rowsWithNulls = depositos.map((deposito) =>
    mapDepositoToSnapshotRow(deposito, synchronizedAt)
  )

  const rows = rowsWithNulls.filter((row): row is SnapshotRow => row !== null)
  const skipped_count = rowsWithNulls.length - rows.length

  const saveResult = await salvarDepositosSnapshot(rows)

  return {
    received_count: depositos.length,
    saved_count: saveResult.saved_count,
    skipped_count,
    synchronized_at: synchronizedAt,
    preview: rows.slice(0, 20).map((row) => ({
      id_deposito_olist: row.id_deposito_olist,
      descricao: row.descricao,
      tipo: row.tipo,
      desconsidera_saldo: row.desconsidera_saldo,
      padrao: row.padrao,
      possui_reserva: row.possui_reserva,
    })),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          service: 'olist-depositos-sync',
          message: 'Method not allowed. Use POST or GET.',
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
            service: 'olist-depositos-sync',
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

    const tokenResult = await obterTokenValido()
    const syncResult = await sincronizarDepositos(tokenResult.token.access_token)

    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: 'olist-depositos-sync',
          message: 'Olist deposits synchronized into snapshot.',
          authorization_mode: authorization.mode,
          token_refreshed_before_sync: tokenResult.refreshed,
          result: syncResult,
          security_note:
            'This function never returns access token, refresh token, client secret, or service role key.',
        },
        null,
        2
      ),
      {
        status: 200,
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
          service: 'olist-depositos-sync',
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
