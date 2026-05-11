import { supabase } from '../lib/supabase'

export type AlertasResumo = {
    total_alertas?: number
    alertas_altos?: number
    alertas_medios?: number
    alertas_baixos?: number
    alertas_estoque?: number
    alertas_produto?: number
    alertas_custo_real?: number
    alertas_divergencia_estoque_lotes?: number
    alertas_produto_prioritario_sem_fba?: number
    alertas_produto_prioritario_revisar_lucro?: number
    alertas_problema_custo_real?: number
    status_geral_alertas?: string
    atualizado_em?: string
}

export type AlertaOperacional = {
    categoria_alerta?: string
    tipo_alerta?: string
    severidade?: string
    produto_id?: string
    produto_nome?: string
    produto_sku?: string
    produto_asin?: string
    local_estoque_id?: string
    local_estoque_nome?: string
    canal_venda_nome?: string
    saldo_movimentacoes?: number
    saldo_lotes_disponivel?: number
    diferenca_movimentacoes_vs_lotes?: number
    receita_bruta?: number
    lucro_real?: number
    margem_real_percentual?: number
    status_origem?: string
    descricao_alerta?: string
    gerado_em?: string
}

export async function buscarResumoAlertas() {
    const { data, error } = await supabase
        .from('dashboard_alertas_resumo')
        .select('*')
        .limit(1)

    if (error) {
        throw new Error(error.message)
    }

    return (data?.[0] ?? null) as AlertasResumo | null
}

export async function buscarAlertasOperacionais() {
    const { data, error } = await supabase
        .from('dashboard_alertas_operacionais')
        .select('*')
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as AlertaOperacional[]
}