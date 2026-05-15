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

type ProdutoSnapshot = {
  id_produto_olist: number
  sku: string | null
  descricao: string | null
  unidade: string | null
  situacao: string | null
}

type OlistDepositoEstoque = {
  id?: number
  nome?: string
  desconsiderar?: boolean
  saldo?: number
  reservado?: number
  disponivel?: number
  empresa?: string
  [key: string]: unknown
}

type OlistEstoqueProdutoResponse = {
  id?: number
  nome?: string
  codigo?: string
  unidade?: string
  saldo?: number
  reservado?: number
  disponivel?: number
  localizacao?: string | null
  depositos?: OlistDepositoEstoque[]
  [key: string]: unknown
}

type EstoqueDepositoSnapshotRow = {
  id_produto_olist: number
  sku: string | null
  produto_nome: string | null
  unidade: string | null
  saldo_total: number
  reservado_total: number
  disponivel_total: number
  localizacao: string | null
  id_deposito_olist: number
  deposito_nome: string
  deposito_desconsiderar: boolean
  deposito_empresa: string | null
  saldo_deposito: number
  reservado_deposito: number
  disponivel_deposito: number
  raw_produto: OlistEstoqueProdutoResponse
  raw_deposito: OlistDepositoEstoque
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

function trimOrNull(value?: string | null) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed || null
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

  return 0
}

function booleanSeguro(value: unknown) {
  return typeof value === 'boolean' ? value : false
}

async function buscarProdutosParaSincronizar(params: {
  req: Request
  limit: number
  offset: number
}) {
  const supabaseAdmin = createSupabaseAdminClient()
  const requestUrl = new URL(params.req.url)
  const situacao = requestUrl.searchParams.get('situacao')?.trim()

  let query = supabaseAdmin
    .from('olist_produtos_snapshot')
    .select('id_produto_olist, sku, descricao, unidade, situacao')
    .not('id_produto_olist', 'is', null)
    .order('id_produto_olist', { ascending: true })
    .range(params.offset, params.offset + params.limit - 1)

  if (situacao && situacao.toLowerCase() !== 'todos') {
    query = query.eq('situacao', situacao.toUpperCase())
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Supabase product snapshot lookup failed: ${error.message}`)
  }

  return (data ?? []) as ProdutoSnapshot[]
}

async function buscarIdsDepositosConhecidos() {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_depositos_snapshot')
    .select('id_deposito_olist')

  if (error) {
    throw new Error(`Supabase deposits snapshot lookup failed: ${error.message}`)
  }

  return new Set(
    (data ?? [])
      .map((item) => Number(item.id_deposito_olist))
      .filter((id) => Number.isFinite(id))
  )
}

async function buscarEstoqueProdutoOlist(
  accessToken: string,
  idProdutoOlist: number
) {
  const url = `https://api.tiny.com.br/public-api/v3/estoque/${idProdutoOlist}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const responseText = await response.text()

  let responseJson: OlistEstoqueProdutoResponse = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist stock request failed for product ${idProdutoOlist}: ${
        response.status
      } ${responseText.slice(0, 900)}`
    )
  }

  return responseJson
}

function mapEstoqueToRows(params: {
  produtoSnapshot: ProdutoSnapshot
  estoqueResponse: OlistEstoqueProdutoResponse
  depositosConhecidos: Set<number>
  synchronizedAt: string
}) {
  const depositos = Array.isArray(params.estoqueResponse.depositos)
    ? params.estoqueResponse.depositos
    : []

  const rows: EstoqueDepositoSnapshotRow[] = []
  let skippedDepositosSemId = 0
  let skippedDepositosDesconhecidos = 0

  for (const deposito of depositos) {
    if (typeof deposito.id !== 'number' || !Number.isFinite(deposito.id)) {
      skippedDepositosSemId += 1
      continue
    }

    if (!params.depositosConhecidos.has(deposito.id)) {
      skippedDepositosDesconhecidos += 1
      continue
    }

    const nomeDeposito = trimOrNull(deposito.nome) ?? `Depósito ${deposito.id}`

    rows.push({
      id_produto_olist: params.produtoSnapshot.id_produto_olist,
      sku:
        trimOrNull(params.produtoSnapshot.sku) ??
        trimOrNull(params.estoqueResponse.codigo),
      produto_nome:
        trimOrNull(params.estoqueResponse.nome) ??
        trimOrNull(params.produtoSnapshot.descricao),
      unidade:
        trimOrNull(params.estoqueResponse.unidade) ??
        trimOrNull(params.produtoSnapshot.unidade),
      saldo_total: safeNumber(params.estoqueResponse.saldo),
      reservado_total: safeNumber(params.estoqueResponse.reservado),
      disponivel_total: safeNumber(params.estoqueResponse.disponivel),
      localizacao: trimOrNull(params.estoqueResponse.localizacao),
      id_deposito_olist: deposito.id,
      deposito_nome: nomeDeposito,
      deposito_desconsiderar: booleanSeguro(deposito.desconsiderar),
      deposito_empresa: trimOrNull(deposito.empresa),
      saldo_deposito: safeNumber(deposito.saldo),
      reservado_deposito: safeNumber(deposito.reservado),
      disponivel_deposito: safeNumber(deposito.disponivel),
      raw_produto: params.estoqueResponse,
      raw_deposito: deposito,
      sincronizado_em: params.synchronizedAt,
      updated_at: params.synchronizedAt,
    })
  }

  return {
    rows,
    depositos_count: depositos.length,
    skippedDepositosSemId,
    skippedDepositosDesconhecidos,
  }
}

async function salvarRowsSnapshot(rows: EstoqueDepositoSnapshotRow[]) {
  if (rows.length === 0) {
    return {
      saved_count: 0,
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('olist_estoque_depositos_snapshot')
    .upsert(rows, {
      onConflict: 'id_produto_olist,id_deposito_olist',
    })

  if (error) {
    throw new Error(
      `Supabase stock deposits snapshot upsert failed: ${error.message}`
    )
  }

  return {
    saved_count: rows.length,
  }
}

async function sincronizarEstoquePorDeposito(params: {
  req: Request
  accessToken: string
}) {
  const requestUrl = new URL(params.req.url)
  const searchParams = requestUrl.searchParams

  const limit = parseIntegerParam(searchParams, 'limit', 10, 1, 50)
  const offset = parseIntegerParam(searchParams, 'offset', 0, 0, 1000000)
  const synchronizedAt = new Date().toISOString()

  const produtos = await buscarProdutosParaSincronizar({
    req: params.req,
    limit,
    offset,
  })

  const depositosConhecidos = await buscarIdsDepositosConhecidos()

  let produtos_processados = 0
  let produtos_com_erro = 0
  let depositos_recebidos = 0
  let rows_geradas = 0
  let rows_salvas = 0
  let depositos_sem_id = 0
  let depositos_desconhecidos = 0

  const erros: Array<{
    id_produto_olist: number
    sku: string | null
    message: string
  }> = []

  const preview: Array<{
    id_produto_olist: number
    sku: string | null
    deposito_nome: string
    saldo_deposito: number
    reservado_deposito: number
    disponivel_deposito: number
  }> = []

  for (const produto of produtos) {
    try {
      const estoqueResponse = await buscarEstoqueProdutoOlist(
        params.accessToken,
        produto.id_produto_olist
      )

      const mapped = mapEstoqueToRows({
        produtoSnapshot: produto,
        estoqueResponse,
        depositosConhecidos,
        synchronizedAt,
      })

      produtos_processados += 1
      depositos_recebidos += mapped.depositos_count
      depositos_sem_id += mapped.skippedDepositosSemId
      depositos_desconhecidos += mapped.skippedDepositosDesconhecidos
      rows_geradas += mapped.rows.length

      const saveResult = await salvarRowsSnapshot(mapped.rows)
      rows_salvas += saveResult.saved_count

      for (const row of mapped.rows.slice(0, Math.max(0, 15 - preview.length))) {
        preview.push({
          id_produto_olist: row.id_produto_olist,
          sku: row.sku,
          deposito_nome: row.deposito_nome,
          saldo_deposito: row.saldo_deposito,
          reservado_deposito: row.reservado_deposito,
          disponivel_deposito: row.disponivel_deposito,
        })
      }
    } catch (error) {
      produtos_com_erro += 1
      erros.push({
        id_produto_olist: produto.id_produto_olist,
        sku: produto.sku,
        message:
          error instanceof Error ? error.message : 'Unknown product stock error.',
      })
    }
  }

  const nextOffset =
    produtos.length === limit ? offset + limit : null

  return {
    limit,
    offset,
    next_offset_if_continues: nextOffset,
    has_more: nextOffset !== null,
    products_loaded_from_snapshot: produtos.length,
    produtos_processados,
    produtos_com_erro,
    depositos_conhecidos_count: depositosConhecidos.size,
    depositos_recebidos,
    rows_geradas,
    rows_salvas,
    depositos_sem_id,
    depositos_desconhecidos,
    synchronized_at: synchronizedAt,
    preview,
    errors_preview: erros.slice(0, 10),
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
          service: 'olist-estoque-depositos-sync',
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
            service: 'olist-estoque-depositos-sync',
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
    const syncResult = await sincronizarEstoquePorDeposito({
      req,
      accessToken: tokenResult.token.access_token,
    })

    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: 'olist-estoque-depositos-sync',
          message: 'Olist stock by deposits synchronized into snapshot.',
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
          service: 'olist-estoque-depositos-sync',
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
