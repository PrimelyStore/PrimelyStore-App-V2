import { supabase } from '../lib/supabase'

type NumeroBanco = number | string | null

export type AlertasResumo = {
    total_alertas?: NumeroBanco
    alertas_altos?: NumeroBanco
    alertas_medios?: NumeroBanco
    alertas_baixos?: NumeroBanco
    alertas_estoque?: NumeroBanco
    alertas_produto?: NumeroBanco
    alertas_custo_real?: NumeroBanco
    alertas_divergencia_estoque_lotes?: NumeroBanco
    alertas_produto_prioritario_sem_fba?: NumeroBanco
    alertas_produto_prioritario_revisar_lucro?: NumeroBanco
    alertas_problema_custo_real?: NumeroBanco
    status_geral_alertas?: string | null
    atualizado_em?: string | null
}

export type AlertasVendasPendentesBaixa = {
    total_pendencias?: NumeroBanco
    total_alto?: NumeroBanco
    total_medio?: NumeroBanco
    total_baixo?: NumeroBanco
    total_estoque_insuficiente?: NumeroBanco
    total_aptas_para_baixa?: NumeroBanco
    total_origem_olist?: NumeroBanco
    total_pedidos_afetados?: NumeroBanco
    total_unidades_pendentes?: NumeroBanco
    atualizado_em?: string | null
}

export type AlertaOperacional = {
    categoria_alerta?: string | null
    tipo_alerta?: string | null
    severidade?: string | null
    produto_id?: string | null
    produto_nome?: string | null
    produto_sku?: string | null
    produto_asin?: string | null
    local_estoque_id?: string | null
    local_estoque_nome?: string | null
    canal_venda_nome?: string | null
    saldo_movimentacoes?: NumeroBanco
    saldo_lotes_disponivel?: NumeroBanco
    diferenca_movimentacoes_vs_lotes?: NumeroBanco
    receita_bruta?: NumeroBanco
    lucro_real?: NumeroBanco
    margem_real_percentual?: NumeroBanco
    status_origem?: string | null
    descricao_alerta?: string | null
    gerado_em?: string | null
}

export type AlertaVendaPendenteBaixaFIFO = {
    venda_id: string
    numero_pedido: string | null
    numero_pedido_marketplace: string | null
    status_venda: string | null
    data_venda: string | null
    venda_criada_em: string | null
    venda_atualizada_em: string | null
    canal_venda_nome: string | null
    canal_venda_tipo: string | null
    canal_modalidade_logistica: string | null
    local_saida_id: string | null
    local_saida_nome: string | null
    local_saida_tipo: string | null
    olist_snapshot_id: string | null
    id_pedido_olist: NumeroBanco
    ecommerce_nome: string | null
    canal_venda_olist: string | null
    olist_status_processamento: string | null
    olist_mensagem_erro: string | null
    olist_sincronizado_em: string | null
    olist_processado_em: string | null
    produto_id: string | null
    sku_vendido: string | null
    produto_nome: string | null
    quantidade_pendente_baixa: NumeroBanco
    saldo_atual: NumeroBanco
    decisao: string | null
    severidade: string | null
    descricao_alerta: string | null
    origem_integracao: string | null
}

export async function buscarResumoAlertas() {
    const { data, error } = await supabase
        .from('dashboard_alertas_resumo')
        .select('*')
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data as AlertasResumo | null
}

export async function buscarResumoVendasPendentesBaixa() {
    const { data, error } = await supabase
        .from('dashboard_alertas_vendas_pendentes_baixa')
        .select('*')
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data as AlertasVendasPendentesBaixa | null
}

export async function buscarAlertasOperacionais() {
    const { data, error } = await supabase
        .from('dashboard_alertas_operacionais')
        .select('*')
        .order('gerado_em', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as AlertaOperacional[]
}

export async function buscarVendasPendentesBaixaFIFO() {
    const { data, error } = await supabase
        .from('vendas_pendentes_baixa_fifo')
        .select('*')
        .order('data_venda', { ascending: false })
        .order('numero_pedido', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as AlertaVendaPendenteBaixaFIFO[]
}
