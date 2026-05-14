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

type OlistProdutoListagem = {
  id?: number
  sku?: string
  descricao?: string
  tipo?: string
  situacao?: string
  dataCriacao?: string | null
  dataAlteracao?: string | null
  unidade?: string
  gtin?: string
  precos?: {
    preco?: number | null
    precoPromocional?: number | null
    precoCusto?: number | null
    precoCustoMedio?: number | null
  }
  estoque?: {
    localizacao?: string | null
  }
  tipoVariacao?: string | null
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

function copiarParametroSeExistir(
  origem: URLSearchParams,
  destino: URLSearchParams,
  nome: string
) {
  const valor = origem.get(nome)

  if (valor !== null && valor.trim() !== '') {
    destino.set(nome, valor.trim())
  }
}

function montarUrlProdutos(req: Request) {
  const requestUrl = new URL(req.url)
  const origem = requestUrl.searchParams

  const url = new URL('https://api.tiny.com.br/public-api/v3/produtos')

  const limit = origem.get('limit') ?? '100'
  const offset = origem.get('offset') ?? '0'
  const situacao = origem.get('situacao') ?? 'A'

  url.searchParams.set('limit', limit)
  url.searchParams.set('offset', offset)
  url.searchParams.set('situacao', situacao)

  copiarParametroSeExistir(origem, url.searchParams, 'nome')
  copiarParametroSeExistir(origem, url.searchParams, 'codigo')
  copiarParametroSeExistir(origem, url.searchParams, 'gtin')
  copiarParametroSeExistir(origem, url.searchParams, 'dataCriacao')
  copiarParametroSeExistir(origem, url.searchParams, 'dataAlteracao')
  copiarParametroSeExistir(origem, url.searchParams, 'idListaPreco')

  return url
}

function resumirProduto(produto: OlistProdutoListagem) {
  return {
    id: produto.id ?? null,
    sku: produto.sku ?? null,
    descricao: produto.descricao ?? null,
    tipo: produto.tipo ?? null,
    situacao: produto.situacao ?? null,
    dataCriacao: produto.dataCriacao ?? null,
    dataAlteracao: produto.dataAlteracao ?? null,
    unidade: produto.unidade ?? null,
    gtin: produto.gtin ?? null,
    tipoVariacao: produto.tipoVariacao ?? null,
    preco: produto.precos?.preco ?? null,
    precoPromocional: produto.precos?.precoPromocional ?? null,
    precoCusto: produto.precos?.precoCusto ?? null,
    precoCustoMedio: produto.precos?.precoCustoMedio ?? null,
    localizacaoEstoque: produto.estoque?.localizacao ?? null,
  }
}

async function chamarListagemProdutos(accessToken: string, req: Request) {
  const url = montarUrlProdutos(req)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
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
      ok: false,
      status: response.status,
      request: {
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
      },
      error_body_preview: responseText.slice(0, 1200),
      response_keys: Object.keys(responseJson),
    }
  }

  const itens = Array.isArray(responseJson.itens)
    ? (responseJson.itens as OlistProdutoListagem[])
    : []

  const paginacao =
    responseJson.paginacao && typeof responseJson.paginacao === 'object'
      ? responseJson.paginacao
      : null

  return {
    ok: true,
    status: response.status,
    request: {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
    },
    received_count: itens.length,
    paginacao,
    produtos_preview: itens.slice(0, 20).map(resumirProduto),
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
          service: 'olist-produtos-listar',
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
            service: 'olist-produtos-listar',
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
            service: 'olist-produtos-listar',
            message:
              'Olist access token is expired. Run olist-token-refresh before listing products.',
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

    const apiResult = await chamarListagemProdutos(token.access_token, req)

    const responseBody = {
      ok: apiResult.ok,
      service: 'olist-produtos-listar',
      message: apiResult.ok
        ? 'Olist products request succeeded.'
        : 'Olist products request failed.',
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
          service: 'olist-produtos-listar',
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
