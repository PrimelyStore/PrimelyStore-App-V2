import { supabase } from '../lib/supabase'

export type AmazonFBAEstoqueSnapshot = {
    id: string
    marketplace_id: string
    asin: string | null
    fn_sku: string | null
    seller_sku: string
    condition: string | null
    product_name: string | null

    fulfillable_quantity: number
    inbound_working_quantity: number
    inbound_shipped_quantity: number
    inbound_receiving_quantity: number

    reserved_total_quantity: number
    reserved_pending_customer_order_quantity: number
    reserved_pending_transshipment_quantity: number
    reserved_fc_processing_quantity: number

    researching_total_quantity: number

    unfulfillable_total_quantity: number
    unfulfillable_customer_damaged_quantity: number
    unfulfillable_warehouse_damaged_quantity: number
    unfulfillable_distributor_damaged_quantity: number
    unfulfillable_carrier_damaged_quantity: number
    unfulfillable_defective_quantity: number
    unfulfillable_expired_quantity: number

    future_supply_reserved_quantity: number
    future_supply_buyable_quantity: number

    total_quantity: number
    last_updated_time: string | null

    raw_data: Record<string, unknown>

    sincronizado_em: string
    created_at: string
    updated_at: string
}

export type ResumoAmazonFBAEstoqueSnapshot = {
    total_registros: number
    total_unidades: number
    unidades_disponiveis: number
    unidades_reservadas: number
    unidades_em_pesquisa: number
    unidades_indisponiveis: number
    ultima_sincronizacao: string | null
}

export type SincronizacaoAmazonFBAResultado = {
    ok: boolean
    service: string
    message: string
    timestamp?: string
    authorization_mode?: string
    security_note?: string
    result?: {
        status?: number
        ok?: boolean
        marketplace_id?: string
        seller_skus_filter_count?: number
        details?: string
        received_count?: number
        saved_count?: number
        skipped_without_seller_sku?: number
        next_token_present?: boolean
        synchronized_at?: string
    }
}

export async function buscarAmazonFBAEstoqueSnapshot() {
    const { data, error } = await supabase
        .from('amazon_fba_estoque_snapshot')
        .select('*')
        .order('total_quantity', { ascending: false })
        .order('seller_sku', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as AmazonFBAEstoqueSnapshot[]
}

export async function buscarResumoAmazonFBAEstoqueSnapshot() {
    const dados = await buscarAmazonFBAEstoqueSnapshot()

    const resumo = dados.reduce<ResumoAmazonFBAEstoqueSnapshot>(
        (total, item) => {
            total.total_registros += 1
            total.total_unidades += Number(item.total_quantity ?? 0)
            total.unidades_disponiveis += Number(
                item.fulfillable_quantity ?? 0
            )
            total.unidades_reservadas += Number(
                item.reserved_total_quantity ?? 0
            )
            total.unidades_em_pesquisa += Number(
                item.researching_total_quantity ?? 0
            )
            total.unidades_indisponiveis += Number(
                item.unfulfillable_total_quantity ?? 0
            )

            if (
                !total.ultima_sincronizacao ||
                new Date(item.sincronizado_em).getTime() >
                    new Date(total.ultima_sincronizacao).getTime()
            ) {
                total.ultima_sincronizacao = item.sincronizado_em
            }

            return total
        },
        {
            total_registros: 0,
            total_unidades: 0,
            unidades_disponiveis: 0,
            unidades_reservadas: 0,
            unidades_em_pesquisa: 0,
            unidades_indisponiveis: 0,
            ultima_sincronizacao: null,
        }
    )

    return resumo
}

export async function sincronizarAmazonFBAEstoqueSnapshot() {
    const { data, error } =
        await supabase.functions.invoke<SincronizacaoAmazonFBAResultado>(
            'amazon-spapi-fba-inventory',
            {
                method: 'POST',
                body: {},
            }
        )

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('A função de sincronização não retornou dados.')
    }

    if (!data.ok) {
        throw new Error(data.message || 'Erro ao sincronizar Amazon FBA.')
    }

    return data
}

export type AmazonSaudeResultado = {
    ok: boolean
    message: string | null
    timestamp: string | null
    configured_secrets_count: number | null
    total_expected_secrets: number | null
    lwa_token_ok: boolean
}

export async function buscarSaudeAmazon(): Promise<AmazonSaudeResultado> {
    const { data, error } = await supabase.functions.invoke('amazon-spapi-health', {
        method: 'GET',
    })

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('A verificação de saúde da Amazon não retornou dados.')
    }

    return {
        ok: Boolean(data.ok),
        message: typeof data.message === 'string' ? data.message : null,
        timestamp: typeof data.timestamp === 'string' ? data.timestamp : null,
        configured_secrets_count: typeof data.configured_secrets_count === 'number' ? data.configured_secrets_count : null,
        total_expected_secrets: typeof data.total_expected_secrets === 'number' ? data.total_expected_secrets : null,
        lwa_token_ok: Boolean(data.lwa_token_ok ?? data.lwa?.ok),
    }
}

