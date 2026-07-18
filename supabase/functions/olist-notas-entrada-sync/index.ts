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

type OlistEndereco = {
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  municipio?: string | null
  cep?: string | null
  uf?: string | null
  pais?: string | null
  [key: string]: unknown
}

type OlistContatoResumo = {
  id?: number | null
  nome?: string | null
  codigo?: string | null
  fantasia?: string | null
  tipoPessoa?: string | null
  cpfCnpj?: string | null
  inscricaoEstadual?: string | null
  rg?: string | null
  telefone?: string | null
  celular?: string | null
  email?: string | null
  endereco?: OlistEndereco | null
  [key: string]: unknown
}

type OlistContatoDetalhe = OlistContatoResumo & {
  situacao?: string | null
  dataCriacao?: string | null
  dataAtualizacao?: string | null
  statusCrm?: string | null
  tipos?: unknown[] | null
  contatos?: unknown[] | null
  vendedor?: Record<string, unknown> | null
  limiteCredito?: number | string | null
  observacoes?: string | null
}

type OlistNotaListagem = {
  id?: number | null
  situacao?: number | string | null
  tipo?: string | null
  numero?: string | number | null
  serie?: string | null
  chaveAcesso?: string | null
  dataEmissao?: string | null
  dataPrevista?: string | null
  cliente?: OlistContatoResumo | null
  valor?: number | string | null
  valorProdutos?: number | string | null
  valorFrete?: number | string | null
  ecommerce?: Record<string, unknown> | null
  origem?: {
    id?: string | number | null
    tipo?: string | null
    [key: string]: unknown
  } | null
  [key: string]: unknown
}

type OlistNotasListResponse = {
  itens?: OlistNotaListagem[]
  paginacao?: {
    limit?: number
    offset?: number
    total?: number
  }
  [key: string]: unknown
}

type OlistNotaItemBasico = {
  idItem?: number | null
  idProduto?: number | null
  codigo?: string | null
  ncm?: string | null
  descricao?: string | null
  unidade?: string | null
  quantidade?: number | string | null
  valorUnitario?: number | string | null
  valorTotal?: number | string | null
  cfop?: string | null
  naturezaOperacao?: string | null
  [key: string]: unknown
}

type OlistNotaDetalhe = OlistNotaListagem & {
  finalidade?: number | string | null
  regimeTributario?: number | string | null
  dataInclusao?: string | null
  baseIcms?: number | string | null
  valorIcms?: number | string | null
  baseIcmsSt?: number | string | null
  valorIcmsSt?: number | string | null
  valorServicos?: number | string | null
  valorSeguro?: number | string | null
  valorOutras?: number | string | null
  valorIpi?: number | string | null
  valorIssqn?: number | string | null
  valorDesconto?: number | string | null
  valorFaturado?: number | string | null
  valorNotaComImpostos?: number | string | null
  condicaoPagamento?: string | null
  observacoes?: string | null
  enderecoEntrega?: Record<string, unknown> | null
  transportador?: Record<string, unknown> | null
  parcelas?: unknown[] | null
  pagamentosIntegrados?: unknown[] | null
  marcadores?: unknown[] | null
  itens?: OlistNotaItemBasico[] | null
  origem?: {
    id?: string | number | null
    tipo?: string | null
    [key: string]: unknown
  } | null
  ecommerce?: Record<string, unknown> | null
  valorTotalBCIBSCBS?: number | string | null
  valorTotalIBSUF?: number | string | null
  valorTotalCBS?: number | string | null
}

type OlistNotaItemDetalhado = {
  id?: number | null
  idProduto?: number | null
  codigo?: string | null
  ncm?: string | null
  descricao?: string | null
  unidade?: string | null
  quantidade?: number | string | null
  valorUnitario?: number | string | null
  valorTotal?: number | string | null
  valorFrete?: number | string | null
  valorTotalComImpostos?: number | string | null
  cfop?: string | null
  naturezaOperacao?: string | null
  origem?: string | null
  gtin?: string | null
  gtinEmbalagem?: string | null
  tipo?: string | null
  numeroPedidoCompra?: string | null
  numeroItemPedidoCompra?: number | string | null
  pesoLiq?: number | string | null
  pesoBruto?: number | string | null
  infoAdicional?: string | null
  obs?: string | null
  pis?: { valorImposto?: number | string | null } | null
  icms?: { valorImposto?: number | string | null } | null
  cofins?: { valorImposto?: number | string | null } | null
  simples?: { valorImposto?: number | string | null } | null
  ipi?: { valorImposto?: number | string | null } | null
  ibsCbsIs?: {
    cstIbsCbs?: string | null
    cClassTribIbsCbs?: string | null
    valorImpostoCbs?: number | string | null
    valorImpostoIbsUf?: number | string | null
  } | null
  [key: string]: unknown
}

type NotaPreparada = {
  id_nota_olist: number
  listagem: OlistNotaListagem
  detalhe: OlistNotaDetalhe | null
  detalhe_error: string | null
  row: Record<string, unknown>
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
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


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryAfterMs(value: string | null) {
  if (!value) {
    return null
  }

  const seconds = Number(value)

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000
  }

  const dateMs = new Date(value).getTime()

  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now())
  }

  return null
}

async function fetchWithRetry(params: {
  url: string
  init: RequestInit
  label: string
  maxRetries?: number
  baseDelayMs?: number
}) {
  const maxRetries = params.maxRetries ?? 4
  const baseDelayMs = params.baseDelayMs ?? 800
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(params.url, params.init)
    lastResponse = response

    if (![429, 500, 502, 503, 504].includes(response.status)) {
      return response
    }

    if (attempt >= maxRetries) {
      return response
    }

    const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'))
    const exponentialDelayMs = baseDelayMs * Math.pow(2, attempt)
    const jitterMs = Math.floor(Math.random() * 250)
    const delayMs = Math.min(retryAfterMs ?? exponentialDelayMs + jitterMs, 10000)

    console.log(
      `${params.label}: tentativa ${attempt + 1} recebeu HTTP ${response.status}. Aguardando ${delayMs}ms antes de tentar novamente.`
    )

    await sleep(delayMs)
  }

  return lastResponse!
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

function montarUrlNotas(params: {
  req: Request
  limit: number
  offset: number
}) {
  const requestUrl = new URL(params.req.url)
  const origem = requestUrl.searchParams

  const url = new URL('https://api.tiny.com.br/public-api/v3/notas')

  url.searchParams.set('tipo', 'E')
  url.searchParams.set('limit', String(params.limit))
  url.searchParams.set('offset', String(params.offset))

  const parametrosPermitidos = [
    'numero',
    'cpfCnpj',
    'dataInicial',
    'dataFinal',
    'situacao',
    'numeroPedidoEcommerce',
    'idVendedor',
    'idFormaEnvio',
    'idVenda',
    'marcadores',
    'orderBy',
  ]

  for (const parametro of parametrosPermitidos) {
    copiarParametroSeExistir(origem, url.searchParams, parametro)
  }

  return url
}

async function buscarPaginaNotas(params: {
  accessToken: string
  req: Request
  limit: number
  offset: number
}) {
  const url = montarUrlNotas({
    req: params.req,
    limit: params.limit,
    offset: params.offset,
  })

  const response = await fetchWithRetry({
    url: url.toString(),
    label: 'Olist notas list',
    maxRetries: 3,
    baseDelayMs: 700,
    init: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        Accept: 'application/json',
      },
    },
  })

  const responseText = await response.text()

  let responseJson: OlistNotasListResponse = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist notas list request failed: ${response.status} ${responseText.slice(
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

async function obterNotaDetalhada(params: {
  accessToken: string
  idNota: number
}) {
  const url = new URL(
    `https://api.tiny.com.br/public-api/v3/notas/${params.idNota}`
  )

  const response = await fetchWithRetry({
    url: url.toString(),
    label: `Olist nota detail ${params.idNota}`,
    maxRetries: 3,
    baseDelayMs: 800,
    init: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        Accept: 'application/json',
      },
    },
  })

  const responseText = await response.text()

  let responseJson: OlistNotaDetalhe = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist nota detail request failed for id ${params.idNota}: ${response.status} ${responseText.slice(
        0,
        1200
      )}`
    )
  }

  return responseJson
}

async function obterItemNotaDetalhado(params: {
  accessToken: string
  idNota: number
  idItem: number
}) {
  const url = new URL(
    `https://api.tiny.com.br/public-api/v3/notas/${params.idNota}/itens/${params.idItem}`
  )

  const response = await fetchWithRetry({
    url: url.toString(),
    label: `Olist nota item detail ${params.idNota}/${params.idItem}`,
    maxRetries: 5,
    baseDelayMs: 1200,
    init: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        Accept: 'application/json',
      },
    },
  })

  const responseText = await response.text()

  let responseJson: OlistNotaItemDetalhado = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist nota item detail request failed for nota ${params.idNota}, item ${params.idItem}: ${response.status} ${responseText.slice(
        0,
        1200
      )}`
    )
  }

  return responseJson
}

async function obterContatoDetalhado(params: {
  accessToken: string
  idContato: number
}) {
  const url = new URL(
    `https://api.tiny.com.br/public-api/v3/contatos/${params.idContato}`
  )

  const response = await fetchWithRetry({
    url: url.toString(),
    label: `Olist contact detail ${params.idContato}`,
    maxRetries: 3,
    baseDelayMs: 800,
    init: {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        Accept: 'application/json',
      },
    },
  })

  const responseText = await response.text()

  let responseJson: OlistContatoDetalhe = {}

  try {
    responseJson = JSON.parse(responseText)
  } catch {
    responseJson = {}
  }

  if (!response.ok) {
    throw new Error(
      `Olist contact detail request failed for id ${params.idContato}: ${response.status} ${responseText.slice(
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

function getCliente(
  listagem: OlistNotaListagem,
  detalhe: OlistNotaDetalhe | null
) {
  return detalhe?.cliente ?? listagem.cliente ?? null
}

function mapFornecedorToSnapshotRow(params: {
  contatoResumo: OlistContatoResumo
  contatoDetalhe: OlistContatoDetalhe | null
  synchronizedAt: string
}) {
  const idContato = safeInteger(params.contatoDetalhe?.id ?? params.contatoResumo.id)

  if (idContato === null) {
    return null
  }

  const contato = params.contatoDetalhe ?? params.contatoResumo
  const endereco = contato.endereco ?? null

  return {
    provider: 'olist_tiny',
    id_contato_olist: idContato,
    codigo: trimOrNull(contato.codigo),
    nome: trimOrNull(contato.nome),
    fantasia: trimOrNull(contato.fantasia),
    tipo_pessoa: trimOrNull(contato.tipoPessoa),
    cpf_cnpj: trimOrNull(contato.cpfCnpj),
    inscricao_estadual: trimOrNull(contato.inscricaoEstadual),
    rg: trimOrNull(contato.rg),
    telefone: trimOrNull(contato.telefone),
    celular: trimOrNull(contato.celular),
    email: trimOrNull(contato.email),
    endereco: trimOrNull(endereco?.endereco),
    numero: trimOrNull(endereco?.numero),
    complemento: trimOrNull(endereco?.complemento),
    bairro: trimOrNull(endereco?.bairro),
    municipio: trimOrNull(endereco?.municipio),
    cep: trimOrNull(endereco?.cep),
    uf: trimOrNull(endereco?.uf),
    pais: trimOrNull(endereco?.pais),
    situacao: trimOrNull(params.contatoDetalhe?.situacao),
    data_criacao: parseDateToIso(params.contatoDetalhe?.dataCriacao),
    data_atualizacao: parseDateToIso(params.contatoDetalhe?.dataAtualizacao),
    status_crm: trimOrNull(params.contatoDetalhe?.statusCrm),
    tipos_json: Array.isArray(params.contatoDetalhe?.tipos)
      ? params.contatoDetalhe?.tipos
      : null,
    contatos_json: Array.isArray(params.contatoDetalhe?.contatos)
      ? params.contatoDetalhe?.contatos
      : null,
    raw_json: params.contatoDetalhe ?? params.contatoResumo,
    status_processamento: 'pendente',
    mensagem_erro: null,
    sincronizado_em: params.synchronizedAt,
    updated_at: params.synchronizedAt,
  }
}

function mapNotaToSnapshotRow(params: {
  listagem: OlistNotaListagem
  detalhe: OlistNotaDetalhe | null
  detalheError: string | null
  synchronizedAt: string
}) {
  const idNota = safeInteger(params.detalhe?.id ?? params.listagem.id)

  if (idNota === null) {
    return null
  }

  const cliente = getCliente(params.listagem, params.detalhe)
  const origem = params.detalhe?.origem ?? params.listagem.origem ?? null
  const rawData = {
    listagem: params.listagem,
    detalhe: params.detalhe,
    detalhe_error: params.detalheError,
  }

  return {
    provider: 'olist_tiny',
    id_nota_olist: idNota,
    tipo: 'E',
    situacao: safeInteger(params.detalhe?.situacao ?? params.listagem.situacao),
    numero: trimOrNull(params.detalhe?.numero ?? params.listagem.numero),
    serie: trimOrNull(params.detalhe?.serie ?? params.listagem.serie),
    chave_acesso: trimOrNull(
      params.detalhe?.chaveAcesso ?? params.listagem.chaveAcesso
    ),
    data_emissao: parseDateToIso(
      params.detalhe?.dataEmissao ?? params.listagem.dataEmissao
    ),
    data_prevista: parseDateToIso(
      params.detalhe?.dataPrevista ?? params.listagem.dataPrevista
    ),
    data_inclusao: parseDateToIso(params.detalhe?.dataInclusao),
    id_contato_olist: safeInteger(cliente?.id),
    fornecedor_nome: trimOrNull(cliente?.nome),
    fornecedor_codigo: trimOrNull(cliente?.codigo),
    fornecedor_fantasia: trimOrNull(cliente?.fantasia),
    fornecedor_tipo_pessoa: trimOrNull(cliente?.tipoPessoa),
    fornecedor_cpf_cnpj: trimOrNull(cliente?.cpfCnpj),
    fornecedor_inscricao_estadual: trimOrNull(cliente?.inscricaoEstadual),
    fornecedor_email: trimOrNull(cliente?.email),
    fornecedor_telefone: trimOrNull(cliente?.telefone ?? cliente?.celular),
    valor: safePositiveNumber(params.detalhe?.valor ?? params.listagem.valor),
    valor_produtos: safePositiveNumber(
      params.detalhe?.valorProdutos ?? params.listagem.valorProdutos
    ),
    valor_frete: safePositiveNumber(
      params.detalhe?.valorFrete ?? params.listagem.valorFrete
    ),
    valor_desconto: safePositiveNumber(params.detalhe?.valorDesconto),
    valor_outras: safePositiveNumber(params.detalhe?.valorOutras),
    valor_seguro: safePositiveNumber(params.detalhe?.valorSeguro),
    valor_ipi: safePositiveNumber(params.detalhe?.valorIpi),
    valor_icms: safePositiveNumber(params.detalhe?.valorIcms),
    valor_icms_st: safePositiveNumber(params.detalhe?.valorIcmsSt),
    valor_servicos: safePositiveNumber(params.detalhe?.valorServicos),
    valor_issqn: safePositiveNumber(params.detalhe?.valorIssqn),
    valor_faturado: safePositiveNumber(params.detalhe?.valorFaturado),
    valor_nota_com_impostos: safePositiveNumber(
      params.detalhe?.valorNotaComImpostos
    ),
    finalidade: safeInteger(params.detalhe?.finalidade),
    regime_tributario: safeInteger(params.detalhe?.regimeTributario),
    condicao_pagamento: trimOrNull(params.detalhe?.condicaoPagamento),
    observacoes: trimOrNull(params.detalhe?.observacoes),
    origem_id: trimOrNull(origem?.id),
    origem_tipo: trimOrNull(origem?.tipo),
    transportador_json: params.detalhe?.transportador ?? null,
    endereco_entrega_json: params.detalhe?.enderecoEntrega ?? null,
    ecommerce_json: params.detalhe?.ecommerce ?? params.listagem.ecommerce ?? null,
    parcelas_json: Array.isArray(params.detalhe?.parcelas)
      ? params.detalhe?.parcelas
      : null,
    pagamentos_integrados_json: Array.isArray(
      params.detalhe?.pagamentosIntegrados
    )
      ? params.detalhe?.pagamentosIntegrados
      : null,
    marcadores_json: Array.isArray(params.detalhe?.marcadores)
      ? params.detalhe?.marcadores
      : null,
    itens_basicos_json: Array.isArray(params.detalhe?.itens)
      ? params.detalhe?.itens
      : null,
    raw_json: rawData,
    status_processamento: params.detalheError ? 'erro' : 'pendente',
    mensagem_erro: params.detalheError,
    sincronizado_em: params.synchronizedAt,
    updated_at: params.synchronizedAt,
  }
}

function devePreservarProcessamentoSnapshot(row: {
  compra_id?: string | null
  status_processamento?: string | null
}) {
  return (
    Boolean(row.compra_id) ||
    row.status_processamento === 'processado' ||
    row.status_processamento === 'ignorado'
  )
}

async function criarSyncLog(params: {
  limit: number
  offset: number
  detalhes: Record<string, unknown>
}) {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_notas_entrada_sync_log')
    .insert({
      provider: 'olist_tiny',
      tipo_sync: 'notas_entrada',
      status: 'iniciado',
      data_inicio: new Date().toISOString(),
      limit_usado: params.limit,
      offset_usado: params.offset,
      detalhes: params.detalhes,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Supabase notas sync log insert failed: ${error.message}`)
  }

  return data.id as string
}

async function atualizarSyncLog(params: {
  logId: string
  status: 'sucesso' | 'erro' | 'parcial'
  totalReportadoApi: number | null
  notasLidas: number
  notasInseridas: number
  notasAtualizadas: number
  itensLidos: number
  itensInseridos: number
  itensAtualizados: number
  fornecedoresLidos: number
  fornecedoresInseridos: number
  fornecedoresAtualizados: number
  notasComErro: number
  itensComErro: number
  mensagem: string | null
  detalhes: Record<string, unknown>
}) {
  const supabaseAdmin = createSupabaseAdminClient()

  const { error } = await supabaseAdmin
    .from('olist_notas_entrada_sync_log')
    .update({
      status: params.status,
      data_fim: new Date().toISOString(),
      total_reportado_api: params.totalReportadoApi,
      notas_lidas: params.notasLidas,
      notas_inseridas: params.notasInseridas,
      notas_atualizadas: params.notasAtualizadas,
      itens_lidos: params.itensLidos,
      itens_inseridos: params.itensInseridos,
      itens_atualizados: params.itensAtualizados,
      fornecedores_lidos: params.fornecedoresLidos,
      fornecedores_inseridos: params.fornecedoresInseridos,
      fornecedores_atualizados: params.fornecedoresAtualizados,
      notas_com_erro: params.notasComErro,
      itens_com_erro: params.itensComErro,
      mensagem: params.mensagem,
      detalhes: params.detalhes,
    })
    .eq('id', params.logId)

  if (error) {
    throw new Error(`Supabase notas sync log update failed: ${error.message}`)
  }
}

async function buscarNotasExistentes(ids: number[]) {
  const map = new Map<
    number,
    { id_nota_olist: number; compra_id: string | null; status_processamento: string | null; mensagem_erro: string | null }
  >()

  if (ids.length === 0) {
    return map
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_notas_entrada_snapshot')
    .select('id_nota_olist, compra_id, status_processamento, mensagem_erro')
    .eq('provider', 'olist_tiny')
    .in('id_nota_olist', ids)

  if (error) {
    throw new Error(`Supabase existing notas lookup failed: ${error.message}`)
  }

  for (const row of data ?? []) {
    const idNota = safeInteger(row.id_nota_olist)

    if (idNota !== null) {
      map.set(idNota, {
        id_nota_olist: idNota,
        compra_id: typeof row.compra_id === 'string' ? row.compra_id : null,
        status_processamento:
          typeof row.status_processamento === 'string'
            ? row.status_processamento
            : null,
        mensagem_erro:
          typeof row.mensagem_erro === 'string' ? row.mensagem_erro : null,
      })
    }
  }

  return map
}

async function buscarFornecedoresExistentes(ids: number[]) {
  const map = new Set<number>()

  if (ids.length === 0) {
    return map
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_fornecedores_snapshot')
    .select('id_contato_olist')
    .eq('provider', 'olist_tiny')
    .in('id_contato_olist', ids)

  if (error) {
    throw new Error(
      `Supabase existing suppliers lookup failed: ${error.message}`
    )
  }

  for (const row of data ?? []) {
    const idContato = safeInteger(row.id_contato_olist)

    if (idContato !== null) {
      map.add(idContato)
    }
  }

  return map
}


function deduplicarRowsPorChave(
  rows: Array<Record<string, unknown>>,
  obterChave: (row: Record<string, unknown>) => string | null
) {
  const map = new Map<string, Record<string, unknown>>()

  for (const row of rows) {
    const chave = obterChave(row)

    if (!chave) {
      continue
    }

    map.set(chave, row)
  }

  return Array.from(map.values())
}

async function buscarItensExistentes(chaves: Array<{ idNota: number; idItem: number }>) {
  const map = new Set<string>()

  if (chaves.length === 0) {
    return map
  }

  const supabaseAdmin = createSupabaseAdminClient()
  const idsNotas = Array.from(new Set(chaves.map((chave) => chave.idNota)))

  const { data, error } = await supabaseAdmin
    .from('olist_notas_entrada_itens_snapshot')
    .select('id_nota_olist, id_item_olist')
    .eq('provider', 'olist_tiny')
    .in('id_nota_olist', idsNotas)

  if (error) {
    throw new Error(`Supabase existing note items lookup failed: ${error.message}`)
  }

  for (const row of data ?? []) {
    const idNota = safeInteger(row.id_nota_olist)
    const idItem = safeInteger(row.id_item_olist)

    if (idNota !== null && idItem !== null) {
      map.add(`${idNota}:${idItem}`)
    }
  }

  return map
}

async function salvarFornecedoresSnapshot(rows: Array<Record<string, unknown>>) {
  const rowsUnicos = deduplicarRowsPorChave(rows, (row) => {
    const idContato = safeInteger(row.id_contato_olist)
    const provider = trimOrNull(row.provider) ?? 'olist_tiny'

    return idContato === null ? null : `${provider}:${idContato}`
  })

  if (rowsUnicos.length === 0) {
    return [] as Array<{ id: string; id_contato_olist: number }>
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_fornecedores_snapshot')
    .upsert(rowsUnicos, {
      onConflict: 'provider,id_contato_olist',
    })
    .select('id, id_contato_olist')

  if (error) {
    throw new Error(`Supabase suppliers snapshot upsert failed: ${error.message}`)
  }

  return (data ?? []) as Array<{ id: string; id_contato_olist: number }>
}

async function salvarNotasSnapshot(params: {
  rows: Array<Record<string, unknown>>
  estadosExistentes: Map<number, { compra_id: string | null; status_processamento: string | null; mensagem_erro: string | null }>
}) {
  if (params.rows.length === 0) {
    return [] as Array<{ id: string; id_nota_olist: number }>
  }

  const rowsPreservandoProcessamento = params.rows.map((row) => {
    const idNota = safeInteger(row.id_nota_olist)
    const existente = idNota !== null ? params.estadosExistentes.get(idNota) : null

    if (existente && devePreservarProcessamentoSnapshot(existente)) {
      return {
        ...row,
        compra_id: existente.compra_id,
        status_processamento: existente.status_processamento,
        mensagem_erro: existente.mensagem_erro,
      }
    }

    return row
  })

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_notas_entrada_snapshot')
    .upsert(rowsPreservandoProcessamento, {
      onConflict: 'provider,id_nota_olist',
    })
    .select('id, id_nota_olist')

  if (error) {
    throw new Error(`Supabase notas snapshot upsert failed: ${error.message}`)
  }

  return (data ?? []) as Array<{ id: string; id_nota_olist: number }>
}

async function buscarProdutosPorSku(codigos: string[]) {
  const normalized = Array.from(
    new Set(codigos.map((codigo) => codigo.trim()).filter(Boolean))
  )

  if (normalized.length === 0) {
    return new Map<string, string>()
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('produtos')
    .select('id, sku')
    .in('sku', normalized)

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

function mapItemToSnapshotRow(params: {
  idNota: number
  notaSnapshotId: string
  itemBasico: OlistNotaItemBasico
  itemDetalhado: OlistNotaItemDetalhado | null
  itemError: string | null
  produtoIdPorSku: Map<string, string>
  synchronizedAt: string
}) {
  const idItem = safeInteger(params.itemDetalhado?.id ?? params.itemBasico.idItem)

  if (idItem === null) {
    return null
  }

  const codigo = trimOrNull(params.itemDetalhado?.codigo ?? params.itemBasico.codigo)
  const ibsCbsIs = params.itemDetalhado?.ibsCbsIs ?? null

  return {
    provider: 'olist_tiny',
    nota_snapshot_id: params.notaSnapshotId,
    id_nota_olist: params.idNota,
    id_item_olist: idItem,
    id_produto_olist: safeInteger(
      params.itemDetalhado?.idProduto ?? params.itemBasico.idProduto
    ),
    codigo,
    ncm: trimOrNull(params.itemDetalhado?.ncm ?? params.itemBasico.ncm),
    descricao: trimOrNull(
      params.itemDetalhado?.descricao ?? params.itemBasico.descricao
    ),
    unidade: trimOrNull(params.itemDetalhado?.unidade ?? params.itemBasico.unidade),
    quantidade: safePositiveNumber(
      params.itemDetalhado?.quantidade ?? params.itemBasico.quantidade
    ),
    valor_unitario: safePositiveNumber(
      params.itemDetalhado?.valorUnitario ?? params.itemBasico.valorUnitario
    ),
    valor_total: safePositiveNumber(
      params.itemDetalhado?.valorTotal ?? params.itemBasico.valorTotal
    ),
    valor_frete: safePositiveNumber(params.itemDetalhado?.valorFrete),
    valor_total_com_impostos: safePositiveNumber(
      params.itemDetalhado?.valorTotalComImpostos
    ),
    cfop: trimOrNull(params.itemDetalhado?.cfop ?? params.itemBasico.cfop),
    natureza_operacao: trimOrNull(
      params.itemDetalhado?.naturezaOperacao ?? params.itemBasico.naturezaOperacao
    ),
    origem: trimOrNull(params.itemDetalhado?.origem),
    gtin: trimOrNull(params.itemDetalhado?.gtin),
    gtin_embalagem: trimOrNull(params.itemDetalhado?.gtinEmbalagem),
    tipo: trimOrNull(params.itemDetalhado?.tipo),
    numero_pedido_compra: trimOrNull(params.itemDetalhado?.numeroPedidoCompra),
    numero_item_pedido_compra: safeInteger(
      params.itemDetalhado?.numeroItemPedidoCompra
    ),
    peso_liq: safeNumber(params.itemDetalhado?.pesoLiq),
    peso_bruto: safeNumber(params.itemDetalhado?.pesoBruto),
    info_adicional: trimOrNull(params.itemDetalhado?.infoAdicional),
    obs: trimOrNull(params.itemDetalhado?.obs),
    pis_valor_imposto: safePositiveNumber(params.itemDetalhado?.pis?.valorImposto),
    icms_valor_imposto: safePositiveNumber(params.itemDetalhado?.icms?.valorImposto),
    cofins_valor_imposto: safePositiveNumber(
      params.itemDetalhado?.cofins?.valorImposto
    ),
    simples_valor_imposto: safePositiveNumber(
      params.itemDetalhado?.simples?.valorImposto
    ),
    ipi_valor_imposto: safePositiveNumber(params.itemDetalhado?.ipi?.valorImposto),
    cbs_valor_imposto: safePositiveNumber(ibsCbsIs?.valorImpostoCbs),
    ibs_uf_valor_imposto: safePositiveNumber(ibsCbsIs?.valorImpostoIbsUf),
    ibs_cbs_cst: trimOrNull(ibsCbsIs?.cstIbsCbs),
    ibs_cbs_class_trib: trimOrNull(ibsCbsIs?.cClassTribIbsCbs),
    produto_id: codigo ? params.produtoIdPorSku.get(codigo) ?? null : null,
    raw_json_basico: params.itemBasico,
    raw_json_detalhado: params.itemDetalhado,
    status_processamento: params.itemError ? 'erro' : 'pendente',
    mensagem_erro: params.itemError,
    sincronizado_em: params.synchronizedAt,
    updated_at: params.synchronizedAt,
  }
}

async function salvarItensSnapshot(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return [] as Array<{ id: string; id_nota_olist: number; id_item_olist: number }>
  }

  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('olist_notas_entrada_itens_snapshot')
    .upsert(rows, {
      onConflict: 'provider,id_nota_olist,id_item_olist',
    })
    .select('id, id_nota_olist, id_item_olist')

  if (error) {
    throw new Error(`Supabase nota items snapshot upsert failed: ${error.message}`)
  }

  return (data ?? []) as Array<{
    id: string
    id_nota_olist: number
    id_item_olist: number
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  const logContext: Record<string, unknown> = {
    service: 'olist-notas-entrada-sync',
    started_at: new Date().toISOString(),
  }

  let logId: string | null = null

  try {
    if (!['GET', 'POST'].includes(req.method)) {
      return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405)
    }

    const authorization = await isAuthorizedRequest(req)

    if (!authorization.authorized) {
      return jsonResponse(
        {
          ok: false,
          service: 'olist-notas-entrada-sync',
          message: 'Unauthorized.',
          authorization_mode: authorization.mode,
          security_note: 'No secret value is returned by this function.',
        },
        401
      )
    }

    const requestUrl = new URL(req.url)
    const searchParams = requestUrl.searchParams

    const limit = parseIntegerParam(searchParams, 'limit', 3, 1, 100)
    const maxPages = parseIntegerParam(searchParams, 'maxPages', 1, 1, 10)
    const startOffset = parseIntegerParam(searchParams, 'offset', 0, 0, 1000000)
    const detalharNotas = parseBooleanParam(searchParams, 'detalhar', true)
    const detalharItens = parseBooleanParam(searchParams, 'detalharItens', true)
    const buscarFornecedores = parseBooleanParam(
      searchParams,
      'buscarFornecedores',
      true
    )
    const itemDetailDelayMs = parseIntegerParam(
      searchParams,
      'itemDelayMs',
      700,
      0,
      5000
    )

    const tokenResult = await obterTokenValido()
    const accessToken = tokenResult.token.access_token

    logId = await criarSyncLog({
      limit,
      offset: startOffset,
      detalhes: {
        ...logContext,
        options: {
          limit,
          maxPages,
          startOffset,
          detalharNotas,
          detalharItens,
          buscarFornecedores,
          itemDetailDelayMs,
          tipo: 'E',
        },
        authorization_mode: authorization.mode,
      },
    })

    const synchronizedAt = new Date().toISOString()
    const notasPreparadas: NotaPreparada[] = []
    const fornecedoresRows: Array<Record<string, unknown>> = []
    const itemDetalhes = new Map<string, OlistNotaItemDetalhado | null>()
    const itemErrors = new Map<string, string | null>()

    let currentOffset = startOffset
    let totalReportedByApi: number | null = null
    let lastRequest: Record<string, unknown> | null = null
    let lastResponseKeys: string[] = []
    let stopReason = 'max_pages_reached'

    for (let page = 0; page < maxPages; page += 1) {
      const pageResult = await buscarPaginaNotas({
        accessToken,
        req,
        limit,
        offset: currentOffset,
      })

      lastRequest = pageResult.request
      lastResponseKeys = pageResult.response_keys

      if (typeof pageResult.paginacao?.total === 'number') {
        totalReportedByApi = pageResult.paginacao.total
      }

      if (pageResult.itens.length === 0) {
        stopReason = 'empty_page'
        break
      }

      for (const notaListagem of pageResult.itens) {
        const idNota = safeInteger(notaListagem.id)

        if (idNota === null) {
          continue
        }

        let detalhe: OlistNotaDetalhe | null = null
        let detalheError: string | null = null

        if (detalharNotas) {
          try {
            detalhe = await obterNotaDetalhada({ accessToken, idNota })
          } catch (error) {
            detalheError = error instanceof Error ? error.message : String(error)
          }
        }

        const row = mapNotaToSnapshotRow({
          listagem: notaListagem,
          detalhe,
          detalheError,
          synchronizedAt,
        })

        if (!row) {
          continue
        }

        notasPreparadas.push({
          id_nota_olist: idNota,
          listagem: notaListagem,
          detalhe,
          detalhe_error: detalheError,
          row,
        })

        const cliente = getCliente(notaListagem, detalhe)
        const idContato = safeInteger(cliente?.id)

        if (cliente && idContato !== null) {
          let contatoDetalhe: OlistContatoDetalhe | null = null

          if (buscarFornecedores) {
            try {
              contatoDetalhe = await obterContatoDetalhado({
                accessToken,
                idContato,
              })
            } catch {
              contatoDetalhe = null
            }
          }

          const fornecedorRow = mapFornecedorToSnapshotRow({
            contatoResumo: cliente,
            contatoDetalhe,
            synchronizedAt,
          })

          if (fornecedorRow) {
            fornecedoresRows.push(fornecedorRow)
          }
        }

        const itensBasicos = Array.isArray(detalhe?.itens) ? detalhe!.itens! : []

        if (detalharItens && detalhe && detalheError === null) {
          for (const itemBasico of itensBasicos) {
            const idItem = safeInteger(itemBasico.idItem)

            if (idItem === null) {
              continue
            }

            const chave = `${idNota}:${idItem}`

            try {
              const itemDetalhado = await obterItemNotaDetalhado({
                accessToken,
                idNota,
                idItem,
              })

              itemDetalhes.set(chave, itemDetalhado)
              itemErrors.set(chave, null)
            } catch (error) {
              itemDetalhes.set(chave, null)
              itemErrors.set(
                chave,
                error instanceof Error ? error.message : String(error)
              )
            }

            if (itemDetailDelayMs > 0) {
              await sleep(itemDetailDelayMs)
            }
          }
        }
      }

      currentOffset += limit

      if (pageResult.itens.length < limit) {
        stopReason = 'last_page_smaller_than_limit'
        break
      }

      if (
        typeof pageResult.paginacao?.total === 'number' &&
        currentOffset >= pageResult.paginacao.total
      ) {
        stopReason = 'api_total_reached'
        break
      }
    }

    const idNotas = notasPreparadas.map((nota) => nota.id_nota_olist)
    const estadosNotasExistentes = await buscarNotasExistentes(idNotas)

    const fornecedoresRowsUnicos = deduplicarRowsPorChave(
      fornecedoresRows,
      (row) => {
        const idContato = safeInteger(row.id_contato_olist)
        const provider = trimOrNull(row.provider) ?? 'olist_tiny'

        return idContato === null ? null : `${provider}:${idContato}`
      }
    )

    const idFornecedores = Array.from(
      new Set(
        fornecedoresRowsUnicos
          .map((row) => safeInteger(row.id_contato_olist))
          .filter((value): value is number => value !== null)
      )
    )
    const fornecedoresExistentes = await buscarFornecedoresExistentes(idFornecedores)

    const notasExistentesAntes = estadosNotasExistentes.size
    const fornecedoresExistentesAntes = fornecedoresExistentes.size

    await salvarFornecedoresSnapshot(fornecedoresRowsUnicos)

    const notasSalvas = await salvarNotasSnapshot({
      rows: notasPreparadas.map((nota) => nota.row),
      estadosExistentes: estadosNotasExistentes,
    })

    const notaSnapshotIdPorIdOlist = new Map<number, string>()

    for (const notaSalva of notasSalvas) {
      const idNota = safeInteger(notaSalva.id_nota_olist)

      if (idNota !== null) {
        notaSnapshotIdPorIdOlist.set(idNota, notaSalva.id)
      }
    }

    const codigosItens: string[] = []

    for (const nota of notasPreparadas) {
      const itensBasicos = Array.isArray(nota.detalhe?.itens) ? nota.detalhe!.itens! : []

      for (const itemBasico of itensBasicos) {
        const codigo = trimOrNull(itemBasico.codigo)

        if (codigo) {
          codigosItens.push(codigo)
        }
      }
    }

    const produtoIdPorSku = await buscarProdutosPorSku(codigosItens)
    const itemRows: Array<Record<string, unknown>> = []
    const itemChaves: Array<{ idNota: number; idItem: number }> = []

    for (const nota of notasPreparadas) {
      const notaSnapshotId = notaSnapshotIdPorIdOlist.get(nota.id_nota_olist)

      if (!notaSnapshotId || !nota.detalhe) {
        continue
      }

      const itensBasicos = Array.isArray(nota.detalhe.itens) ? nota.detalhe.itens : []

      for (const itemBasico of itensBasicos) {
        const idItem = safeInteger(itemBasico.idItem)

        if (idItem === null) {
          continue
        }

        const chave = `${nota.id_nota_olist}:${idItem}`
        const itemDetalhado = itemDetalhes.get(chave) ?? null
        const itemError = itemErrors.get(chave) ?? null

        const itemRow = mapItemToSnapshotRow({
          idNota: nota.id_nota_olist,
          notaSnapshotId,
          itemBasico,
          itemDetalhado,
          itemError,
          produtoIdPorSku,
          synchronizedAt,
        })

        if (itemRow) {
          itemRows.push(itemRow)
          itemChaves.push({ idNota: nota.id_nota_olist, idItem })
        }
      }
    }

    const itensExistentes = await buscarItensExistentes(itemChaves)
    const itensExistentesAntes = itensExistentes.size

    await salvarItensSnapshot(itemRows)

    const notasComErro = notasPreparadas.filter((nota) => nota.detalhe_error).length
    const itensComErro = Array.from(itemErrors.values()).filter(Boolean).length
    const statusFinal = notasComErro > 0 || itensComErro > 0 ? 'parcial' : 'sucesso'

    const notasInseridas = Math.max(0, notasPreparadas.length - notasExistentesAntes)
    const notasAtualizadas = Math.max(0, notasPreparadas.length - notasInseridas)
    const fornecedoresInseridos = Math.max(
      0,
      fornecedoresRowsUnicos.length - fornecedoresExistentesAntes
    )
    const fornecedoresAtualizados = Math.max(
      0,
      fornecedoresRowsUnicos.length - fornecedoresInseridos
    )
    const itensInseridos = Math.max(0, itemRows.length - itensExistentesAntes)
    const itensAtualizados = Math.max(0, itemRows.length - itensInseridos)

    const detalhesLog = {
      ...logContext,
      last_request: lastRequest,
      last_response_keys: lastResponseKeys,
      stop_reason: stopReason,
      options: {
        limit,
        maxPages,
        startOffset,
        detalharNotas,
        detalharItens,
        buscarFornecedores,
        tipo: 'E',
      },
      token_refreshed_before_sync: tokenResult.refreshed,
    }

    await atualizarSyncLog({
      logId,
      status: statusFinal,
      totalReportadoApi: totalReportedByApi,
      notasLidas: notasPreparadas.length,
      notasInseridas,
      notasAtualizadas,
      itensLidos: itemRows.length,
      itensInseridos,
      itensAtualizados,
      fornecedoresLidos: fornecedoresRowsUnicos.length,
      fornecedoresInseridos,
      fornecedoresAtualizados,
      notasComErro,
      itensComErro,
      mensagem:
        statusFinal === 'sucesso'
          ? 'Notas de entrada sincronizadas com sucesso.'
          : 'Notas de entrada sincronizadas parcialmente. Verifique itens/notas com erro.',
      detalhes: detalhesLog,
    })

    const preview = notasPreparadas.slice(0, 5).map((nota) => ({
      id_nota_olist: nota.id_nota_olist,
      numero: trimOrNull(nota.detalhe?.numero ?? nota.listagem.numero),
      serie: trimOrNull(nota.detalhe?.serie ?? nota.listagem.serie),
      tipo: trimOrNull(nota.detalhe?.tipo ?? nota.listagem.tipo),
      situacao: trimOrNull(nota.detalhe?.situacao ?? nota.listagem.situacao),
      fornecedor_nome: trimOrNull(getCliente(nota.listagem, nota.detalhe)?.nome),
      valor: safePositiveNumber(nota.detalhe?.valor ?? nota.listagem.valor),
      valor_produtos: safePositiveNumber(
        nota.detalhe?.valorProdutos ?? nota.listagem.valorProdutos
      ),
      itens: Array.isArray(nota.detalhe?.itens) ? nota.detalhe!.itens!.length : 0,
      status_processamento: nota.detalhe_error ? 'erro' : 'pendente',
    }))

    return jsonResponse({
      ok: true,
      service: 'olist-notas-entrada-sync',
      message: 'Olist incoming invoices synchronized into snapshot.',
      authorization_mode: authorization.mode,
      token_refreshed_before_sync: tokenResult.refreshed,
      options: {
        limit,
        max_pages: maxPages,
        start_offset: startOffset,
        detalhar_notas: detalharNotas,
        detalhar_itens: detalharItens,
        buscar_fornecedores: buscarFornecedores,
        item_detail_delay_ms: itemDetailDelayMs,
        tipo: 'E',
      },
      result: {
        limit,
        start_offset: startOffset,
        next_offset_if_continues: currentOffset,
        total_reported_by_api: totalReportedByApi,
        received_count: notasPreparadas.length,
        saved_notas_count: notasPreparadas.length,
        inserted_notas_count: notasInseridas,
        updated_notas_count: notasAtualizadas,
        saved_items_count: itemRows.length,
        inserted_items_count: itensInseridos,
        updated_items_count: itensAtualizados,
        saved_suppliers_count: fornecedoresRowsUnicos.length,
        inserted_suppliers_count: fornecedoresInseridos,
        updated_suppliers_count: fornecedoresAtualizados,
        notas_errors_count: notasComErro,
        items_errors_count: itensComErro,
        synchronized_at: synchronizedAt,
        stop_reason: stopReason,
        last_request: lastRequest,
        last_response_keys: lastResponseKeys,
        preview,
        sync_log_id: logId,
        status: statusFinal,
      },
      security_note:
        'This function never returns access token, refresh token, client secret, or service role key.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (logId) {
      try {
        await atualizarSyncLog({
          logId,
          status: 'erro',
          totalReportadoApi: null,
          notasLidas: 0,
          notasInseridas: 0,
          notasAtualizadas: 0,
          itensLidos: 0,
          itensInseridos: 0,
          itensAtualizados: 0,
          fornecedoresLidos: 0,
          fornecedoresInseridos: 0,
          fornecedoresAtualizados: 0,
          notasComErro: 1,
          itensComErro: 0,
          mensagem: message,
          detalhes: {
            ...logContext,
            error: message,
          },
        })
      } catch {
        // Não sobrescreve o erro principal.
      }
    }

    return jsonResponse(
      {
        ok: false,
        service: 'olist-notas-entrada-sync',
        message,
        security_note: 'No secret value is returned by this function.',
      },
      500
    )
  }
})
