import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

function addSeconds(date: Date, seconds?: number) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return null
  }

  return new Date(date.getTime() + seconds * 1000).toISOString()
}

function buildHtmlResponse(params: {
  title: string
  message: string
  success: boolean
}) {
  const color = params.success ? '#10b981' : '#ef4444'

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${params.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #020617;
      color: #e2e8f0;
      font-family: Arial, sans-serif;
    }
    .card {
      max-width: 720px;
      margin: 24px;
      padding: 32px;
      border: 1px solid #1e293b;
      border-radius: 24px;
      background: #0f172a;
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
    }
    .tag {
      color: ${color};
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: .18em;
      font-weight: 700;
    }
    h1 {
      margin: 16px 0;
      font-size: 28px;
    }
    p {
      line-height: 1.6;
      color: #cbd5e1;
    }
    .note {
      margin-top: 20px;
      padding: 16px;
      border-radius: 16px;
      background: #020617;
      color: #94a3b8;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="tag">${params.success ? 'Sucesso' : 'Erro'}</div>
    <h1>${params.title}</h1>
    <p>${params.message}</p>
    <div class="note">
      Nenhum token, client secret ou credencial sensível foi exibido nesta página.
      Você já pode fechar esta aba e voltar ao Primely Store.
    </div>
  </main>
</body>
</html>`
}

async function exchangeCodeForTokens(code: string) {
  const tokenUrl = getRequiredSecret('OLIST_TOKEN_URL')
  const clientId = getRequiredSecret('OLIST_CLIENT_ID')
  const clientSecret = getRequiredSecret('OLIST_CLIENT_SECRET')
  const redirectUri = getRequiredSecret('OLIST_REDIRECT_URI')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
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
      `Olist token exchange failed: ${response.status} ${String(safeError).slice(
        0,
        500
      )}`
    )
  }

  if (!responseJson.access_token) {
    throw new Error('Olist token response did not include access_token.')
  }

  return responseJson
}

async function saveTokens(tokenResponse: TokenResponse) {
  const supabaseAdmin = createSupabaseAdminClient()
  const now = new Date()
  const nowIso = now.toISOString()

  const expiresAt = addSeconds(now, tokenResponse.expires_in)
  const refreshExpiresAt = addSeconds(now, tokenResponse.refresh_expires_in)

  await supabaseAdmin
    .from('olist_oauth_tokens')
    .update({
      status: 'substituido',
      updated_at: nowIso,
    })
    .eq('provider', 'olist_tiny')
    .eq('status', 'ativo')

  const { error } = await supabaseAdmin.from('olist_oauth_tokens').insert({
    provider: 'olist_tiny',
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token ?? null,
    token_type: tokenResponse.token_type ?? null,
    scope: tokenResponse.scope ?? null,
    expires_in: tokenResponse.expires_in ?? null,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt,
    raw_response: tokenResponse,
    status: 'ativo',
    created_at: nowIso,
    updated_at: nowIso,
  })

  if (error) {
    throw new Error(`Supabase token insert failed: ${error.message}`)
  }

  return {
    token_type: tokenResponse.token_type ?? null,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt,
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

  const requestUrl = new URL(req.url)
  const wantsJson = requestUrl.searchParams.get('format') === 'json'

  try {
    const errorFromProvider = requestUrl.searchParams.get('error')

    if (errorFromProvider) {
      const description =
        requestUrl.searchParams.get('error_description') ??
        'O Olist retornou erro durante a autorização.'

      throw new Error(`${errorFromProvider}: ${description}`)
    }

    const code = requestUrl.searchParams.get('code')
    const state = requestUrl.searchParams.get('state')
    const expectedState = getRequiredSecret('OLIST_OAUTH_STATE')

    if (!code) {
      throw new Error('Authorization code not found in callback URL.')
    }

    if (!state || state !== expectedState) {
      throw new Error('Invalid OAuth state. Authorization was rejected.')
    }

    const tokenResponse = await exchangeCodeForTokens(code)
    const savedToken = await saveTokens(tokenResponse)

    const safeResponse = {
      ok: true,
      service: 'olist-oauth-callback',
      message: 'Olist authorization completed and tokens were saved.',
      token_type: savedToken.token_type,
      expires_at: savedToken.expires_at,
      refresh_expires_at: savedToken.refresh_expires_at,
      security_note:
        'This function never returns access token, refresh token, client secret, or service role key.',
    }

    if (wantsJson) {
      return new Response(JSON.stringify(safeResponse, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(
      buildHtmlResponse({
        title: 'Olist autorizado com sucesso',
        message:
          'A autorização OAuth2 foi concluída e os tokens foram salvos com segurança no Supabase.',
        success: true,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Edge Function error.'

    const safeResponse = {
      ok: false,
      service: 'olist-oauth-callback',
      message,
      security_note:
        'No secret value is returned by this function.',
    }

    if (wantsJson) {
      return new Response(JSON.stringify(safeResponse, null, 2), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(
      buildHtmlResponse({
        title: 'Erro ao autorizar Olist',
        message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    )
  }
})
