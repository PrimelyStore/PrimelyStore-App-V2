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

type OlistProdutoListagem = {
  id?: number
  sku?: string | null
  descricao?: string | null
  tipo?: string | null
  situacao?: string | null
  dataCriacao?: string | null
  dataAlteracao?: string | null
  unidade?: string | null
  gtin?: string | null
  precos?: {
    preco?: number | null
    precoPromocional?: number | null
    precoCusto?: number | null
    precoCustoMedio?: number | null
  } | null
  estoque?: {
    localizacao?: string | null
    quantidade?: number | null
  } | null
  tipoVariacao?: string | null
  [key: string]: unknown
}

type OlistProdutosResponse = {
  itens?: OlistProdutoListagem[]
  paginacao?: {
    limit?: number
    offset?: number
    total?: number
  }
  [key: string]: unknown
}

type SnapshotRow = {
  id_produto_olist: number
  sku: string | null
  descricao: string | null
  tipo: string | null
  situacao: string | null
  data_criacao: string | null
  data_alteracao: string | null
  unidade: string | null
  gtin: string | null
  preco: number | null
  preco_promocional: number | null
  preco_custo: number | null
  preco_custo_medio: number | null
  estoque_quantidade: number | null
  estoque_localizacao: string | null
  tipo_variacao: string | null
  raw_data: OlistProdutoListagem
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

function parseIntegerParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number,
  min: number,
  max: number
) {
  const rawValue = searchParams.get(name)
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : defaultValue

  if (!Number.isFinite(parsed)) {
    return defaultValue
  }

  return Math.min(Math.max(parsed, min), max)
}

function parseSituacao(searchParams: URLSearchParams) {
  const situacao = searchParams.get('situacao')?.trim().toUpperCase()

  if (situacao === 'A' || situacao === 'I' || situacao === 'E') {
    return situacao
  }

  return 'A'
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

function montarUrlProdutos(params: {
  req: Request
  limit: number
  offset: number
  situacao: string
}) {
  const requestUrl = new URL(params.req.url)
  const origem = requestUrl.searchParams

  const url = new URL('https://api.tiny.com.br/public-api/v3/produtos')

  url.searchParams.set('limit', String(params.limit))
  url.searchParams.set('offset', String(params.offset))
  url.searchParams.set('situacao', params.situacao)

  copiarParametroSeExistir(origem, url.searchParams, 'nome')
  copiarParametroSeExistir(origem, url.searchParams, 'codigo')
  copiarParametroSeExistir(origem, url.searchParams, 'gtin')
  copiarParametroSeExistir(origem, url.searchParams, 'dataCriacao')
  copiarParametroSeExistir(origem, url.searchParams, 'dataAlteracao')
  copiarParametroSeExistir(origem, url.searchParams, 'idListaPreco')

  return url
}

async function buscarPaginaProdutos(params: {
  accessToken: string
  req: Request
  limit: number
  offset: number
  situacao: string
}) {
  const url = montarUrlProdutos({
    req: params.req,
    limit: params.limit,
    offset: params.offset,
    situacao: params.situacao,
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
    },
  })

  const responseText = await response.text()

  let responseJson: OlistProdutosResponse = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist products request failed: ${response.status} ${responseText.slice(
        0,
        1200
      )}`
    )
  }

  const itens = Array.isArray(responseJson.itens) ? responseJson.itens : []

  return {
    itens,
    paginacao: responseJson.paginacao ?? null,
    request: {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
    },
    response_keys: Object.keys(responseJson),
  }
}

function parseDateToIso(value?: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function safeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(',', '.'))

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function trimOrNull(value?: string | null) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed || null
}

function mapProdutoToSnapshotRow(
  produto: OlistProdutoListagem,
  synchronizedAt: string
): SnapshotRow | null {
  if (typeof produto.id !== 'number' || !Number.isFinite(produto.id)) {
    return null
  }

  return {
    id_produto_olist: produto.id,
    sku: trimOrNull(produto.sku),
    descricao: trimOrNull(produto.descricao),
    tipo: trimOrNull(produto.tipo),
    situacao: trimOrNull(produto.situacao),
    data_criacao: parseDateToIso(produto.dataCriacao),
    data_alteracao: parseDateToIso(produto.dataAlteracao),
    unidade: trimOrNull(produto.unidade),
    gtin: trimOrNull(produto.gtin),
    preco: safeNumber(produto.precos?.preco),
    preco_promocional: safeNumber(produto.precos?.precoPromocional),
    preco_custo: safeNumber(produto.precos?.precoCusto),
    preco_custo_medio: safeNumber(produto.precos?.precoCustoMedio),
    estoque_quantidade: safeNumber(produto.estoque?.quantidade),
    estoque_localizacao: trimOrNull(produto.estoque?.localizacao),
    tipo_variacao: trimOrNull(produto.tipoVariacao),
    raw_data: produto,
    sincronizado_em: synchronizedAt,
    updated_at: synchronizedAt,
  }
}

async function salvarSnapshot(rows: SnapshotRow[]) {
  if (rows.length === 0) {
    return {
      saved_count: 0,
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('olist_produtos_snapshot')
    .upsert(rows, {
      onConflict: 'id_produto_olist',
    })

  if (error) {
    throw new Error(`Supabase products snapshot upsert failed: ${error.message}`)
  }

  return {
    saved_count: rows.length,
  }
}

async function sincronizarProdutos(req: Request, accessToken: string) {
  const requestUrl = new URL(req.url)
  const searchParams = requestUrl.searchParams

  const limit = parseIntegerParam(searchParams, 'limit', 100, 1, 100)
  const startOffset = parseIntegerParam(searchParams, 'offset', 0, 0, 1000000)
  const maxPages = parseIntegerParam(searchParams, 'maxPages', 20, 1, 100)
  const situacao = parseSituacao(searchParams)
  const synchronizedAt = new Date().toISOString()

  let offset = startOffset
  let nextOffset = startOffset
  let pages_requested = 0
  let total_reported_by_api: number | null = null
  let received_count = 0
  let saved_count = 0
  let skipped_without_id = 0
  let last_request: Record<string, unknown> | null = null
  let last_response_keys: string[] = []
  let has_more = false
  let stop_reason = 'max_pages_reached'

  const preview: Array<{
    id_produto_olist: number
    sku: string | null
    descricao: string | null
    situacao: string | null
    preco_custo: number | null
    preco_custo_medio: number | null
  }> = []

  for (let page = 0; page < maxPages; page += 1) {
    const pageResult = await buscarPaginaProdutos({
      accessToken,
      req,
      limit,
      offset,
      situacao,
    })

    pages_requested += 1
    last_request = pageResult.request
    last_response_keys = pageResult.response_keys

    if (
      pageResult.paginacao &&
      typeof pageResult.paginacao.total === 'number'
    ) {
      total_reported_by_api = pageResult.paginacao.total
    }

    const itens = pageResult.itens
    received_count += itens.length

    const rowsWithNulls = itens.map((produto) =>
      mapProdutoToSnapshotRow(produto, synchronizedAt)
    )

    const rows = rowsWithNulls.filter((row): row is SnapshotRow => row !== null)
    skipped_without_id += rowsWithNulls.length - rows.length

    const saveResult = await salvarSnapshot(rows)
    saved_count += saveResult.saved_count

    for (const row of rows.slice(0, Math.max(0, 10 - preview.length))) {
      preview.push({
        id_produto_olist: row.id_produto_olist,
        sku: row.sku,
        descricao: row.descricao,
        situacao: row.situacao,
        preco_custo: row.preco_custo,
        preco_custo_medio: row.preco_custo_medio,
      })
    }

    nextOffset = offset + limit

    const finishedByShortPage = itens.length < limit
    const finishedByTotal =
      typeof total_reported_by_api === 'number' &&
      nextOffset >= total_reported_by_api

    if (itens.length === 0) {
      has_more = false
      stop_reason = 'empty_page'
      break
    }

    if (finishedByShortPage) {
      has_more = false
      stop_reason = 'short_page'
      break
    }

    if (finishedByTotal) {
      has_more = false
      stop_reason = 'total_reached'
      break
    }

    has_more = true
    stop_reason = 'max_pages_reached'
    offset = nextOffset
  }

  return {
    limit,
    start_offset: startOffset,
    next_offset_if_continues: has_more ? nextOffset : null,
    has_more,
    stop_reason,
    max_pages: maxPages,
    pages_requested,
    total_reported_by_api,
    received_count,
    saved_count,
    skipped_without_id,
    situacao,
    synchronized_at: synchronizedAt,
    last_request,
    last_response_keys,
    preview,
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
          service: 'olist-produtos-sync',
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
            service: 'olist-produtos-sync',
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
    const syncResult = await sincronizarProdutos(req, tokenResult.token.access_token)

    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: 'olist-produtos-sync',
          message: 'Olist products synchronized into snapshot.',
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
          service: 'olist-produtos-sync',
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
