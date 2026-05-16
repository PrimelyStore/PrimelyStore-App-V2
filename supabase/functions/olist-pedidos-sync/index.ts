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

type OlistPedidoListagem = {
  id?: number | null
  situacao?: number | string | null
  numeroPedido?: number | string | null
  ecommerce?: {
    id?: number | null
    nome?: string | null
    numeroPedidoEcommerce?: string | null
    numeroPedidoCanalVenda?: string | null
    canalVenda?: string | null
    [key: string]: unknown
  } | null
  dataCriacao?: string | null
  dataPrevista?: string | null
  cliente?: Record<string, unknown> | null
  valor?: number | string | null
  vendedor?: Record<string, unknown> | null
  transportador?: {
    id?: number | null
    nome?: string | null
    [key: string]: unknown
  } | null
  origemPedido?: number | string | null
  [key: string]: unknown
}

type OlistPedidosListResponse = {
  itens?: OlistPedidoListagem[]
  paginacao?: {
    limit?: number
    offset?: number
    total?: number
  }
  [key: string]: unknown
}

type OlistPedidoDetalhe = {
  id?: number | null
  numeroPedido?: number | string | null
  idNotaFiscal?: number | null
  dataFaturamento?: string | null
  valorTotalProdutos?: number | string | null
  valorTotalPedido?: number | string | null
  ecommerce?: {
    id?: number | null
    nome?: string | null
    numeroPedidoEcommerce?: string | null
    numeroPedidoCanalVenda?: string | null
    canalVenda?: string | null
    [key: string]: unknown
  } | null
  transportador?: {
    id?: number | null
    nome?: string | null
    [key: string]: unknown
  } | null
  deposito?: {
    id?: number | null
    nome?: string | null
    [key: string]: unknown
  } | null
  itens?: Array<{
    produto?: {
      id?: number | null
      sku?: string | null
      descricao?: string | null
      tipo?: string | null
      [key: string]: unknown
    } | null
    quantidade?: number | string | null
    valorUnitario?: number | string | null
    valorDesconto?: number | string | null
    infoAdicional?: string | null
    [key: string]: unknown
  }> | null
  situacao?: number | string | null
  data?: string | null
  dataEntrega?: string | null
  numeroOrdemCompra?: string | null
  valorDesconto?: number | string | null
  valorFrete?: number | string | null
  valorOutrasDespesas?: number | string | null
  dataPrevista?: string | null
  dataEnvio?: string | null
  observacoes?: string | null
  observacoesInternas?: string | null
  origemPedido?: number | string | null
  [key: string]: unknown
}

type PedidoSnapshotRow = {
  provider: string
  id_pedido_olist: number
  numero_pedido: string | null
  numero_pedido_ecommerce: string | null
  numero_pedido_canal_venda: string | null
  ecommerce_nome: string | null
  canal_venda_olist: string | null
  origem_pedido: string | null
  situacao: string | null
  data_pedido: string | null
  data_criacao_olist: string | null
  data_alteracao_olist: string | null
  data_envio: string | null
  data_entrega: string | null
  id_deposito_olist: number | null
  deposito_nome: string | null
  transportador_nome: string | null
  valor_produtos: number
  valor_frete: number
  valor_desconto: number
  valor_outras_despesas: number
  valor_total: number
  canal_venda_id: string | null
  local_saida_id: string | null
  venda_id: string | null
  status_processamento: 'pendente' | 'processado' | 'erro' | 'ignorado'
  mensagem_erro: string | null
  raw_data: Record<string, unknown>
  sincronizado_em: string
  updated_at: string
}

type ItemSnapshotRow = {
  pedido_snapshot_id: string
  provider: string
  id_pedido_olist: number
  ordem_item: number
  id_item_olist: string | null
  id_produto_olist: number | null
  sku: string | null
  descricao: string | null
  quantidade: number
  valor_unitario: number
  valor_desconto_item: number
  valor_total_item: number
  produto_id: string | null
  venda_item_id: string | null
  status_processamento: 'pendente' | 'processado' | 'erro' | 'ignorado'
  mensagem_erro: string | null
  raw_data: Record<string, unknown>
  updated_at: string
}

type PedidoPreparado = {
  id_pedido_olist: number
  listagem: OlistPedidoListagem
  detalhe: OlistPedidoDetalhe | null
  detalhe_error: string | null
  row: PedidoSnapshotRow
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

function parseBooleanParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: boolean
) {
  const rawValue = searchParams.get(name)

  if (rawValue === null || rawValue.trim() === '') {
    return defaultValue
  }

  const normalized = rawValue.trim().toLowerCase()

  if (['1', 'true', 'sim', 'yes'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'nao', 'não', 'no'].includes(normalized)) {
    return false
  }

  return defaultValue
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

function montarUrlPedidos(params: {
  req: Request
  limit: number
  offset: number
}) {
  const requestUrl = new URL(params.req.url)
  const origem = requestUrl.searchParams

  const url = new URL('https://api.tiny.com.br/public-api/v3/pedidos')

  url.searchParams.set('limit', String(params.limit))
  url.searchParams.set('offset', String(params.offset))

  const parametrosPermitidos = [
    'numero',
    'nomeCliente',
    'codigoCliente',
    'cpfCnpj',
    'dataInicial',
    'dataFinal',
    'dataAtualizacao',
    'situacao',
    'numeroPedidoEcommerce',
    'idVendedor',
    'marcadores',
    'origemPedido',
    'orderBy',
  ]

  for (const parametro of parametrosPermitidos) {
    copiarParametroSeExistir(origem, url.searchParams, parametro)
  }

  return url
}

async function buscarPaginaPedidos(params: {
  accessToken: string
  req: Request
  limit: number
  offset: number
}) {
  const url = montarUrlPedidos({
    req: params.req,
    limit: params.limit,
    offset: params.offset,
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
    },
  })

  const responseText = await response.text()

  let responseJson: OlistPedidosListResponse = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist orders list request failed: ${response.status} ${responseText.slice(
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

async function obterPedidoDetalhado(params: {
  accessToken: string
  idPedido: number
}) {
  const url = new URL(
    `https://api.tiny.com.br/public-api/v3/pedidos/${params.idPedido}`
  )

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
    },
  })

  const responseText = await response.text()

  let responseJson: OlistPedidoDetalhe = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist order detail request failed for id ${params.idPedido}: ${response.status} ${responseText.slice(
        0,
        1200
      )}`
    )
  }

  return responseJson
}

function trimOrNull(value?: string | number | null) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

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

  return null
}

function safePositiveNumber(value: unknown) {
  const parsed = safeNumber(value)

  if (parsed === null || parsed < 0) {
    return 0
  }

  return parsed
}

function parseDateToIso(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  let normalized = trimmed

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    normalized = `${normalized}T00:00:00`
  } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(normalized)) {
    normalized = normalized.replace(' ', 'T')
  }

  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function safeInteger(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function getEcommerce(
  listagem: OlistPedidoListagem,
  detalhe: OlistPedidoDetalhe | null
) {
  return detalhe?.ecommerce ?? listagem.ecommerce ?? null
}

function mapPedidoToSnapshotRow(params: {
  listagem: OlistPedidoListagem
  detalhe: OlistPedidoDetalhe | null
  detalheError: string | null
  synchronizedAt: string
}): PedidoSnapshotRow | null {
  const idPedido = safeInteger(params.detalhe?.id ?? params.listagem.id)

  if (idPedido === null) {
    return null
  }

  const ecommerce = getEcommerce(params.listagem, params.detalhe)
  const transportador = params.detalhe?.transportador ?? params.listagem.transportador ?? null
  const deposito = params.detalhe?.deposito ?? null
  const rawData = {
    listagem: params.listagem,
    detalhe: params.detalhe,
  }

  const valorProdutos = safePositiveNumber(params.detalhe?.valorTotalProdutos)
  const valorFrete = safePositiveNumber(params.detalhe?.valorFrete)
  const valorDesconto = safePositiveNumber(params.detalhe?.valorDesconto)
  const valorOutrasDespesas = safePositiveNumber(
    params.detalhe?.valorOutrasDespesas
  )
  const valorTotal = safePositiveNumber(
    params.detalhe?.valorTotalPedido ?? params.listagem.valor
  )

  return {
    provider: 'olist_tiny',
    id_pedido_olist: idPedido,
    numero_pedido: trimOrNull(
      params.detalhe?.numeroPedido ?? params.listagem.numeroPedido
    ),
    numero_pedido_ecommerce: trimOrNull(ecommerce?.numeroPedidoEcommerce),
    numero_pedido_canal_venda: trimOrNull(ecommerce?.numeroPedidoCanalVenda),
    ecommerce_nome: trimOrNull(ecommerce?.nome),
    canal_venda_olist: trimOrNull(ecommerce?.canalVenda),
    origem_pedido: trimOrNull(
      params.detalhe?.origemPedido ?? params.listagem.origemPedido
    ),
    situacao: trimOrNull(params.detalhe?.situacao ?? params.listagem.situacao),
    data_pedido: parseDateToIso(params.detalhe?.data ?? params.listagem.dataCriacao),
    data_criacao_olist: parseDateToIso(params.listagem.dataCriacao),
    data_alteracao_olist: null,
    data_envio: parseDateToIso(params.detalhe?.dataEnvio),
    data_entrega: parseDateToIso(params.detalhe?.dataEntrega),
    id_deposito_olist: safeInteger(deposito?.id),
    deposito_nome: trimOrNull(deposito?.nome),
    transportador_nome: trimOrNull(transportador?.nome),
    valor_produtos: valorProdutos,
    valor_frete: valorFrete,
    valor_desconto: valorDesconto,
    valor_outras_despesas: valorOutrasDespesas,
    valor_total: valorTotal,
    canal_venda_id: null,
    local_saida_id: null,
    venda_id: null,
    status_processamento: params.detalheError ? 'erro' : 'pendente',
    mensagem_erro: params.detalheError,
    raw_data: rawData,
    sincronizado_em: params.synchronizedAt,
    updated_at: params.synchronizedAt,
  }
}

async function criarSyncLog(params: {
  filtroDataInicial: string | null
  filtroDataFinal: string | null
  rawData: Record<string, unknown>
}) {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_pedidos_sync_log')
    .insert({
      provider: 'olist_tiny',
      tipo_sync: 'pedidos',
      status: 'iniciado',
      data_inicio: new Date().toISOString(),
      filtro_data_inicial: parseDateToIso(params.filtroDataInicial),
      filtro_data_final: parseDateToIso(params.filtroDataFinal),
      raw_data: params.rawData,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Supabase sync log insert failed: ${error.message}`)
  }

  return data.id as string
}

async function atualizarSyncLog(params: {
  logId: string
  status: 'sucesso' | 'erro' | 'parcial'
  pedidosLidos: number
  pedidosInseridos: number
  pedidosAtualizados: number
  pedidosComErro: number
  mensagem: string | null
  rawData: Record<string, unknown>
}) {
  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('olist_pedidos_sync_log')
    .update({
      status: params.status,
      data_fim: new Date().toISOString(),
      pedidos_lidos: params.pedidosLidos,
      pedidos_inseridos: params.pedidosInseridos,
      pedidos_atualizados: params.pedidosAtualizados,
      pedidos_com_erro: params.pedidosComErro,
      mensagem: params.mensagem,
      raw_data: params.rawData,
    })
    .eq('id', params.logId)

  if (error) {
    throw new Error(`Supabase sync log update failed: ${error.message}`)
  }
}

async function buscarPedidosExistentes(ids: number[]) {
  if (ids.length === 0) {
    return new Set<number>()
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_pedidos_snapshot')
    .select('id_pedido_olist')
    .eq('provider', 'olist_tiny')
    .in('id_pedido_olist', ids)

  if (error) {
    throw new Error(`Supabase existing orders lookup failed: ${error.message}`)
  }

  return new Set(
    (data ?? [])
      .map((row) => safeInteger(row.id_pedido_olist))
      .filter((value): value is number => value !== null)
  )
}

async function salvarPedidosSnapshot(rows: PedidoSnapshotRow[]) {
  if (rows.length === 0) {
    return [] as Array<{ id: string; id_pedido_olist: number }>
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_pedidos_snapshot')
    .upsert(rows, {
      onConflict: 'provider,id_pedido_olist',
    })
    .select('id, id_pedido_olist')

  if (error) {
    throw new Error(`Supabase orders snapshot upsert failed: ${error.message}`)
  }

  return (data ?? []) as Array<{ id: string; id_pedido_olist: number }>
}

async function buscarProdutosPorSku(skus: string[]) {
  const normalizedSkus = Array.from(
    new Set(skus.map((sku) => sku.trim()).filter(Boolean))
  )

  if (normalizedSkus.length === 0) {
    return new Map<string, string>()
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('produtos')
    .select('id, sku')
    .in('sku', normalizedSkus)

  if (error) {
    throw new Error(`Supabase products by SKU lookup failed: ${error.message}`)
  }

  const map = new Map<string, string>()

  for (const row of data ?? []) {
    if (typeof row.sku === 'string' && typeof row.id === 'string') {
      map.set(row.sku, row.id)
    }
  }

  return map
}

function mapItensToSnapshotRows(params: {
  pedido: PedidoPreparado
  pedidoSnapshotId: string
  produtoIdPorSku: Map<string, string>
  synchronizedAt: string
}) {
  const itens = Array.isArray(params.pedido.detalhe?.itens)
    ? params.pedido.detalhe!.itens!
    : []

  return itens.map((item, index): ItemSnapshotRow => {
    const sku = trimOrNull(item.produto?.sku)
    const quantidade = safePositiveNumber(item.quantidade)
    const valorUnitario = safePositiveNumber(item.valorUnitario)
    const valorDescontoItem = safePositiveNumber(item.valorDesconto)

    return {
      pedido_snapshot_id: params.pedidoSnapshotId,
      provider: 'olist_tiny',
      id_pedido_olist: params.pedido.id_pedido_olist,
      ordem_item: index + 1,
      id_item_olist: null,
      id_produto_olist: safeInteger(item.produto?.id),
      sku,
      descricao: trimOrNull(item.produto?.descricao),
      quantidade,
      valor_unitario: valorUnitario,
      valor_desconto_item: valorDescontoItem,
      valor_total_item: Math.max(0, quantidade * valorUnitario - valorDescontoItem),
      produto_id: sku ? params.produtoIdPorSku.get(sku) ?? null : null,
      venda_item_id: null,
      status_processamento: 'pendente',
      mensagem_erro: null,
      raw_data: item as Record<string, unknown>,
      updated_at: params.synchronizedAt,
    }
  })
}

async function salvarItensSnapshot(rows: ItemSnapshotRow[]) {
  if (rows.length === 0) {
    return {
      saved_count: 0,
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('olist_pedidos_itens_snapshot')
    .upsert(rows, {
      onConflict: 'pedido_snapshot_id,ordem_item',
    })

  if (error) {
    throw new Error(`Supabase order items snapshot upsert failed: ${error.message}`)
  }

  return {
    saved_count: rows.length,
  }
}

async function prepararPedidos(params: {
  accessToken: string
  pedidosListagem: OlistPedidoListagem[]
  detalharPedidos: boolean
  synchronizedAt: string
}) {
  const preparados: PedidoPreparado[] = []
  let skipped_without_id = 0

  for (const pedidoListagem of params.pedidosListagem) {
    const idPedido = safeInteger(pedidoListagem.id)

    if (idPedido === null) {
      skipped_without_id += 1
      continue
    }

    let detalhe: OlistPedidoDetalhe | null = null
    let detalheError: string | null = null

    if (params.detalharPedidos) {
      try {
        detalhe = await obterPedidoDetalhado({
          accessToken: params.accessToken,
          idPedido,
        })
      } catch (error) {
        detalheError =
          error instanceof Error ? error.message : 'Unknown order detail error.'
      }
    }

    const row = mapPedidoToSnapshotRow({
      listagem: pedidoListagem,
      detalhe,
      detalheError,
      synchronizedAt: params.synchronizedAt,
    })

    if (!row) {
      skipped_without_id += 1
      continue
    }

    preparados.push({
      id_pedido_olist: idPedido,
      listagem: pedidoListagem,
      detalhe,
      detalhe_error: detalheError,
      row,
    })
  }

  return {
    preparados,
    skipped_without_id,
  }
}

async function sincronizarPedidos(req: Request, accessToken: string) {
  const requestUrl = new URL(req.url)
  const searchParams = requestUrl.searchParams

  const limit = parseIntegerParam(searchParams, 'limit', 20, 1, 100)
  const startOffset = parseIntegerParam(searchParams, 'offset', 0, 0, 1000000)
  const maxPages = parseIntegerParam(searchParams, 'maxPages', 1, 1, 20)
  const detalharPedidos = parseBooleanParam(searchParams, 'detalhar', true)
  const synchronizedAt = new Date().toISOString()

  const logId = await criarSyncLog({
    filtroDataInicial: searchParams.get('dataInicial'),
    filtroDataFinal: searchParams.get('dataFinal'),
    rawData: {
      query: Object.fromEntries(searchParams.entries()),
      limit,
      startOffset,
      maxPages,
      detalharPedidos,
    },
  })

  let offset = startOffset
  let nextOffset = startOffset
  let pages_requested = 0
  let total_reported_by_api: number | null = null
  let received_count = 0
  let saved_orders_count = 0
  let saved_items_count = 0
  let skipped_without_id = 0
  let detail_errors_count = 0
  let inserted_count = 0
  let updated_count = 0
  let last_request: Record<string, unknown> | null = null
  let last_response_keys: string[] = []
  let has_more = false
  let stop_reason = 'max_pages_reached'

  const preview: Array<{
    id_pedido_olist: number
    numero_pedido: string | null
    numero_pedido_ecommerce: string | null
    ecommerce_nome: string | null
    canal_venda_olist: string | null
    situacao: string | null
    valor_total: number
    status_processamento: string
    itens: number
  }> = []

  try {
    for (let page = 0; page < maxPages; page += 1) {
      const pageResult = await buscarPaginaPedidos({
        accessToken,
        req,
        limit,
        offset,
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

      const itensListagem = pageResult.itens
      received_count += itensListagem.length

      const preparation = await prepararPedidos({
        accessToken,
        pedidosListagem: itensListagem,
        detalharPedidos,
        synchronizedAt,
      })

      skipped_without_id += preparation.skipped_without_id
      detail_errors_count += preparation.preparados.filter(
        (pedido) => pedido.detalhe_error !== null
      ).length

      const ids = preparation.preparados.map((pedido) => pedido.id_pedido_olist)
      const existentes = await buscarPedidosExistentes(ids)

      const savedOrders = await salvarPedidosSnapshot(
        preparation.preparados.map((pedido) => pedido.row)
      )

      saved_orders_count += savedOrders.length
      inserted_count += ids.filter((id) => !existentes.has(id)).length
      updated_count += ids.filter((id) => existentes.has(id)).length

      const snapshotIdByPedidoId = new Map(
        savedOrders.map((row) => [safeInteger(row.id_pedido_olist), row.id])
      )

      const skus = preparation.preparados.flatMap((pedido) =>
        Array.isArray(pedido.detalhe?.itens)
          ? pedido.detalhe!.itens!
              .map((item) => trimOrNull(item.produto?.sku))
              .filter((sku): sku is string => sku !== null)
          : []
      )

      const produtoIdPorSku = await buscarProdutosPorSku(skus)

      const itemRows: ItemSnapshotRow[] = []

      for (const pedido of preparation.preparados) {
        const pedidoSnapshotId = snapshotIdByPedidoId.get(pedido.id_pedido_olist)

        if (!pedidoSnapshotId) {
          continue
        }

        itemRows.push(
          ...mapItensToSnapshotRows({
            pedido,
            pedidoSnapshotId,
            produtoIdPorSku,
            synchronizedAt,
          })
        )
      }

      const savedItems = await salvarItensSnapshot(itemRows)
      saved_items_count += savedItems.saved_count

      for (const pedido of preparation.preparados.slice(
        0,
        Math.max(0, 10 - preview.length)
      )) {
        preview.push({
          id_pedido_olist: pedido.id_pedido_olist,
          numero_pedido: pedido.row.numero_pedido,
          numero_pedido_ecommerce: pedido.row.numero_pedido_ecommerce,
          ecommerce_nome: pedido.row.ecommerce_nome,
          canal_venda_olist: pedido.row.canal_venda_olist,
          situacao: pedido.row.situacao,
          valor_total: pedido.row.valor_total,
          status_processamento: pedido.row.status_processamento,
          itens: Array.isArray(pedido.detalhe?.itens)
            ? pedido.detalhe!.itens!.length
            : 0,
        })
      }

      nextOffset = offset + limit

      const finishedByShortPage = itensListagem.length < limit
      const finishedByTotal =
        typeof total_reported_by_api === 'number' &&
        nextOffset >= total_reported_by_api

      if (itensListagem.length === 0) {
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

    const finalStatus = detail_errors_count > 0 ? 'parcial' : 'sucesso'

    const result = {
      limit,
      start_offset: startOffset,
      next_offset_if_continues: has_more ? nextOffset : null,
      has_more,
      stop_reason,
      max_pages: maxPages,
      pages_requested,
      total_reported_by_api,
      received_count,
      saved_orders_count,
      saved_items_count,
      inserted_count,
      updated_count,
      skipped_without_id,
      detail_errors_count,
      detailed_orders: detalharPedidos,
      synchronized_at: synchronizedAt,
      last_request,
      last_response_keys,
      preview,
    }

    await atualizarSyncLog({
      logId,
      status: finalStatus,
      pedidosLidos: received_count,
      pedidosInseridos: inserted_count,
      pedidosAtualizados: updated_count,
      pedidosComErro: detail_errors_count,
      mensagem:
        finalStatus === 'parcial'
          ? 'Pedidos sincronizados com erros em alguns detalhes.'
          : 'Pedidos sincronizados com sucesso.',
      rawData: result,
    })

    return {
      ...result,
      sync_log_id: logId,
      status: finalStatus,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown orders sync error.'

    await atualizarSyncLog({
      logId,
      status: 'erro',
      pedidosLidos: received_count,
      pedidosInseridos: inserted_count,
      pedidosAtualizados: updated_count,
      pedidosComErro: Math.max(1, detail_errors_count),
      mensagem: message,
      rawData: {
        error: message,
        received_count,
        saved_orders_count,
        saved_items_count,
        inserted_count,
        updated_count,
        skipped_without_id,
        detail_errors_count,
        last_request,
        last_response_keys,
      },
    })

    throw error
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
          service: 'olist-pedidos-sync',
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
            service: 'olist-pedidos-sync',
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
    const syncResult = await sincronizarPedidos(req, tokenResult.token.access_token)

    return new Response(
      JSON.stringify(
        {
          ok: true,
          service: 'olist-pedidos-sync',
          message: 'Olist orders synchronized into snapshot.',
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
          service: 'olist-pedidos-sync',
          message,
          security_note: 'No secret value is returned by this function.',
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
