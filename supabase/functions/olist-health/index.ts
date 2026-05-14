import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-primely-internal-token',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

type OlistTokenRow = {
  id: string
  provider: string
  access_token: string
  refresh_token: string | null
  token_type: string | null
  scope: string | null
  expires_at: string | null
  refresh_expires_at: string | null
  status: string
  created_at: string
  updated_at: string
}

type OlistInfoResponse = {
  razaoSocial?: string
  cpfCnpj?: string
  fantasia?: string
  fone?: string
  email?: string
  inscricaoEstadual?: string
  regimeTributario?: number
  enderecoEmpresa?: Record<string, unknown>
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

function mascararDocumento(valor?: string) {
  if (!valor) {
    return null
  }

  const apenasNumeros = valor.replace(/\D/g, '')

  if (apenasNumeros.length <= 4) {
    return '****'
  }

  return `${apenasNumeros.slice(0, 2)}********${apenasNumeros.slice(-2)}`
}

function mascararEmail(valor?: string) {
  if (!valor || !valor.includes('@')) {
    return null
  }

  const [usuario, dominio] = valor.split('@')

  if (!usuario || !dominio) {
    return null
  }

  const usuarioMascarado =
    usuario.length <= 2
      ? `${usuario[0] ?? '*'}***`
      : `${usuario.slice(0, 2)}***`

  return `${usuarioMascarado}@${dominio}`
}

function tokenEstaExpirado(token: OlistTokenRow) {
  if (!token.expires_at) {
    return false
  }

  return new Date(token.expires_at).getTime() <= Date.now()
}

async function buscarTokenAtivo() {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_oauth_tokens')
    .select(
      'id, provider, access_token, refresh_token, token_type, scope, expires_at, refresh_expires_at, status, created_at, updated_at'
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

async function chamarInfoConta(accessToken: string) {
  const baseUrl = 'https://api.tiny.com.br/public-api/v3'
  const url = `${baseUrl}/info`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const responseText = await response.text()

  let responseJson: OlistInfoResponse = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error_body_preview: responseText.slice(0, 900),
      response_keys: Object.keys(responseJson),
    }
  }

  return {
    ok: true,
    status: response.status,
    account_preview: {
      razaoSocial: responseJson.razaoSocial ?? null,
      fantasia: responseJson.fantasia ?? null,
      cpfCnpj_masked: mascararDocumento(responseJson.cpfCnpj),
      email_masked: mascararEmail(responseJson.email),
      regimeTributario: responseJson.regimeTributario ?? null,
      inscricaoEstadual_present: Boolean(responseJson.inscricaoEstadual),
      enderecoEmpresa_present: Boolean(responseJson.enderecoEmpresa),
    },
    response_keys: Object.keys(responseJson),
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
          service: 'olist-health',
          message: 'Method not allowed. Use GET.',
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
            service: 'olist-health',
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

    const token = await buscarTokenAtivo()
    const expired = tokenEstaExpirado(token)

    if (expired) {
      return new Response(
        JSON.stringify(
          {
            ok: false,
            service: 'olist-health',
            message:
              'Olist access token is expired. The next step is creating refresh-token logic.',
            authorization_mode: authorization.mode,
            token_status: {
              provider: token.provider,
              status: token.status,
              token_type: token.token_type,
              expires_at: token.expires_at,
              refresh_expires_at: token.refresh_expires_at,
              expired: true,
              access_token_present: true,
              refresh_token_present: Boolean(token.refresh_token),
            },
            security_note:
              'This function never returns access token, refresh token, client secret, or service role key.',
          },
          null,
          2
        ),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const apiResult = await chamarInfoConta(token.access_token)

    const responseBody = {
      ok: apiResult.ok,
      service: 'olist-health',
      message: apiResult.ok
        ? 'Olist API connection succeeded.'
        : 'Olist API connection failed.',
      authorization_mode: authorization.mode,
      token_status: {
        provider: token.provider,
        status: token.status,
        token_type: token.token_type,
        expires_at: token.expires_at,
        refresh_expires_at: token.refresh_expires_at,
        expired: false,
        access_token_present: true,
        refresh_token_present: Boolean(token.refresh_token),
      },
      api: apiResult,
      security_note:
        'This function never returns access token, refresh token, client secret, or service role key.',
    }

    return new Response(JSON.stringify(responseBody, null, 2), {
      status: apiResult.ok ? 200 : 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Edge Function error.'

    return new Response(
      JSON.stringify(
        {
          ok: false,
          service: 'olist-health',
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
