import { supabase } from '../lib/supabase'

export type MarketplaceMapeamentoTipo =
    | 'amazon'
    | 'mercado_livre'
    | 'shopee'
    | 'venda_manual'

export type MarketplaceMapeamentoStatus = 'ativo' | 'inativo'

export type MarketplaceMapeamento = {
    id: string
    produto_id: string
    canal_venda_id: string
    marketplace: MarketplaceMapeamentoTipo
    seller_sku: string | null
    asin: string | null
    marketplace_id: string | null
    item_id: string | null
    category_id: string | null
    listing_type_id: string | null
    logistic_type: string | null
    shipping_mode: string | null
    free_shipping: boolean | null
    is_amazon_fulfilled: boolean | null
    moeda: string
    manual_override: boolean
    validade_cache_horas: number
    status: MarketplaceMapeamentoStatus
    observacoes: string | null
    atualizado_por: string | null
    created_at: string
    updated_at: string
}

export type MarketplaceMapeamentoInput = {
    produto_id: string
    canal_venda_id: string
    marketplace: MarketplaceMapeamentoTipo
    seller_sku?: string | null
    asin?: string | null
    marketplace_id?: string | null
    item_id?: string | null
    category_id?: string | null
    listing_type_id?: string | null
    logistic_type?: string | null
    shipping_mode?: string | null
    free_shipping?: boolean | null
    is_amazon_fulfilled?: boolean | null
    moeda?: string
    manual_override?: boolean
    validade_cache_horas?: number
    status?: MarketplaceMapeamentoStatus
    observacoes?: string | null
}

export type MarketplaceMapeamentoFiltros = {
    produto_id?: string
    canal_venda_id?: string
    marketplace?: MarketplaceMapeamentoTipo
    status?: MarketplaceMapeamentoStatus | 'todos'
    busca?: string
}

export type ProdutoOpcaoMapeamento = {
    id: string
    nome: string
    sku: string
    asin: string | null
    status: string
}

export type CanalVendaOpcaoMapeamento = {
    id: string
    nome: string
    tipo: string
    modalidade_logistica: string | null
    codigo_externo: string | null
    marketplace_id: string | null
    status: string
}

function textoOpcional(valor?: string | null) {
    const texto = valor?.trim()
    return texto ? texto : null
}

function normalizarMoeda(moeda?: string) {
    return (moeda || 'BRL').trim().toUpperCase()
}

function validarInputMapeamento(input: MarketplaceMapeamentoInput) {
    if (!input.produto_id) {
        throw new Error('produto_id e obrigatorio para o mapeamento.')
    }

    if (!input.canal_venda_id) {
        throw new Error('canal_venda_id e obrigatorio para o mapeamento.')
    }

    if (!input.marketplace) {
        throw new Error('marketplace e obrigatorio para o mapeamento.')
    }

    const validade = input.validade_cache_horas ?? 24
    if (!Number.isFinite(validade) || validade <= 0) {
        throw new Error('validade_cache_horas deve ser maior que zero.')
    }

    const moeda = normalizarMoeda(input.moeda)
    if (moeda.length !== 3) {
        throw new Error('moeda deve conter exatamente 3 caracteres.')
    }
}

function montarPayloadMapeamento(input: MarketplaceMapeamentoInput) {
    validarInputMapeamento(input)

    return {
        produto_id: input.produto_id,
        canal_venda_id: input.canal_venda_id,
        marketplace: input.marketplace,
        seller_sku: textoOpcional(input.seller_sku),
        asin: textoOpcional(input.asin)?.toUpperCase() ?? null,
        marketplace_id: textoOpcional(input.marketplace_id),
        item_id: textoOpcional(input.item_id),
        category_id: textoOpcional(input.category_id),
        listing_type_id: textoOpcional(input.listing_type_id),
        logistic_type: textoOpcional(input.logistic_type),
        shipping_mode: textoOpcional(input.shipping_mode),
        free_shipping: input.free_shipping ?? null,
        is_amazon_fulfilled: input.is_amazon_fulfilled ?? null,
        moeda: normalizarMoeda(input.moeda),
        manual_override: input.manual_override ?? false,
        validade_cache_horas: input.validade_cache_horas ?? 24,
        status: input.status ?? 'ativo',
        observacoes: textoOpcional(input.observacoes),
    }
}

export async function listarMapeamentosMarketplace(
    filtros: MarketplaceMapeamentoFiltros = {}
): Promise<MarketplaceMapeamento[]> {
    let query = supabase
        .from('produto_canal_marketplace_mapeamento')
        .select('*')
        .order('marketplace', { ascending: true })
        .order('updated_at', { ascending: false })

    if (filtros.produto_id) {
        query = query.eq('produto_id', filtros.produto_id)
    }

    if (filtros.canal_venda_id) {
        query = query.eq('canal_venda_id', filtros.canal_venda_id)
    }

    if (filtros.marketplace) {
        query = query.eq('marketplace', filtros.marketplace)
    }

    if (filtros.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status)
    }

    if (filtros.busca?.trim()) {
        const busca = filtros.busca.trim()
        query = query.or(
            [
                `seller_sku.ilike.%${busca}%`,
                `asin.ilike.%${busca}%`,
                `item_id.ilike.%${busca}%`,
                `observacoes.ilike.%${busca}%`,
            ].join(',')
        )
    }

    const { data, error } = await query

    if (error) {
        throw new Error(error.message)
    }

    return (data || []) as MarketplaceMapeamento[]
}

export async function buscarMapeamentoMarketplacePorId(
    id: string
): Promise<MarketplaceMapeamento | null> {
    const { data, error } = await supabase
        .from('produto_canal_marketplace_mapeamento')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data as MarketplaceMapeamento | null
}

export async function criarMapeamentoMarketplace(
    input: MarketplaceMapeamentoInput
): Promise<MarketplaceMapeamento> {
    const payload = montarPayloadMapeamento(input)

    const { data, error } = await supabase
        .from('produto_canal_marketplace_mapeamento')
        .insert(payload)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as MarketplaceMapeamento
}

export async function atualizarMapeamentoMarketplace(
    id: string,
    input: MarketplaceMapeamentoInput
): Promise<MarketplaceMapeamento> {
    const payload = montarPayloadMapeamento(input)

    const { data, error } = await supabase
        .from('produto_canal_marketplace_mapeamento')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as MarketplaceMapeamento
}

export async function inativarMapeamentoMarketplace(
    id: string
): Promise<MarketplaceMapeamento> {
    const { data, error } = await supabase
        .from('produto_canal_marketplace_mapeamento')
        .update({ status: 'inativo' })
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as MarketplaceMapeamento
}

export async function listarOpcoesProdutos(): Promise<ProdutoOpcaoMapeamento[]> {
    const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, sku, asin, status')
        .order('sku', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return (data || []) as ProdutoOpcaoMapeamento[]
}

export async function listarOpcoesCanaisVenda(): Promise<CanalVendaOpcaoMapeamento[]> {
    const { data, error } = await supabase
        .from('canais_venda')
        .select('id, nome, tipo, modalidade_logistica, codigo_externo, marketplace_id, status')
        .order('nome', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return (data || []) as CanalVendaOpcaoMapeamento[]
}
