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
    token_type: tokenResponse.token_type ?? tokenAnterior.token_type,
    scope: tokenResponse.scope ?? tokenAnterior.scope,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt ?? tokenAnterior.refresh_expires_at,
    access_token_salvo: true,
    refresh_token_salvo: Boolean(novoRefreshToken),
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
          service: 'olist-token-refresh',
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
            service: 'olist-token-refresh',
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

    const tokenAnterior = await buscarTokenAtivo()
    validarRefreshToken(tokenAnterior)

    const tokenResponse = await renovarTokenNoOlist(tokenAnterior.refresh_token!)
    const tokenSalvo = await salvarNovoToken(tokenAnterior, tokenResponse)

    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: 'olist-token-refresh',
          message: 'Olist OAuth token refreshed and saved.',
          authorization_mode: authorization.mode,
          token_status: {
            provider: 'olist_tiny',
            status: 'ativo',
            token_type: tokenSalvo.token_type,
            scope: tokenSalvo.scope,
            expires_at: tokenSalvo.expires_at,
            refresh_expires_at: tokenSalvo.refresh_expires_at,
            access_token_salvo: tokenSalvo.access_token_salvo,
            refresh_token_salvo: tokenSalvo.refresh_token_salvo,
          },
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
          service: 'olist-token-refresh',
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
