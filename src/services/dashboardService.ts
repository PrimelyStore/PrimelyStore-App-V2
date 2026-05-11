import { supabase } from '../lib/supabase'

type NumeroBanco = number | string | null

export type DashboardKpisGerais = {
    total_produtos: NumeroBanco
    total_produtos_ativos: NumeroBanco
    produtos_com_estoque: NumeroBanco
    produtos_sem_estoque: NumeroBanco
    produtos_com_estoque_fba: NumeroBanco
    produtos_sem_fba_com_estoque_outro_local: NumeroBanco
    estoque_total_unidades: NumeroBanco
    estoque_total_prep_center: NumeroBanco
    estoque_total_amazon_fba: NumeroBanco
    estoque_total_mercado_livre_full: NumeroBanco
    unidades_vendidas_total: NumeroBanco
    receita_bruta_total: NumeroBanco
    custo_total_estimado: NumeroBanco
    custo_total_real: NumeroBanco
    lucro_estimado_total: NumeroBanco
    lucro_real_total: NumeroBanco
    margem_real_geral_percentual: NumeroBanco
    diferenca_total_custo_real_vs_estimado: NumeroBanco
    produtos_lucrativos: NumeroBanco
    produtos_com_prejuizo: NumeroBanco
    produtos_sem_lucro: NumeroBanco
    produtos_sem_venda: NumeroBanco
    produtos_curva_a_faturamento: NumeroBanco
    produtos_curva_b_faturamento: NumeroBanco
    produtos_curva_c_faturamento: NumeroBanco
    produtos_curva_a_lucro_real: NumeroBanco
    produtos_prioritarios_saudaveis: NumeroBanco
    produtos_prioritarios_sem_fba: NumeroBanco
    produtos_prioritarios_revisar_lucro: NumeroBanco
    produtos_para_monitorar: NumeroBanco
    produtos_sem_historico: NumeroBanco
    atualizado_em: string | null
}

export type DashboardAlertasResumo = {
    total_alertas: NumeroBanco
    alertas_altos: NumeroBanco
    alertas_medios: NumeroBanco
    alertas_baixos: NumeroBanco
    alertas_estoque: NumeroBanco
    alertas_produto: NumeroBanco
    alertas_custo_real: NumeroBanco
    alertas_divergencia_estoque_lotes: NumeroBanco
    alertas_produto_prioritario_sem_fba: NumeroBanco
    alertas_produto_prioritario_revisar_lucro: NumeroBanco
    alertas_problema_custo_real: NumeroBanco
    status_geral_alertas: string | null
    atualizado_em: string | null
}

export type DashboardAlertaOperacional = {
    categoria_alerta: string | null
    tipo_alerta: string | null
    severidade: string | null
    produto_id: string | null
    produto_nome: string | null
    produto_sku: string | null
    produto_asin: string | null
    local_estoque_id: string | null
    local_estoque_nome: string | null
    canal_venda_nome: string | null
    saldo_movimentacoes: NumeroBanco
    saldo_lotes_disponivel: NumeroBanco
    diferenca_movimentacoes_vs_lotes: NumeroBanco
    receita_bruta: NumeroBanco
    lucro_real: NumeroBanco
    margem_real_percentual: NumeroBanco
    status_origem: string | null
    descricao_alerta: string | null
    gerado_em: string | null
}

export type DashboardCompraRecente = {
    compra_id: string
    fornecedor_nome: string | null
    local_destino_nome: string | null
    numero_pedido: string | null
    data_compra: string | null
    data_recebimento: string | null
    status: string | null
    quantidade_total_unidades: NumeroBanco
    valor_total_estimado: NumeroBanco
}

export type DashboardVendaRecente = {
    venda_id: string
    canal_venda_nome: string | null
    local_saida_nome: string | null
    numero_pedido: string | null
    numero_pedido_marketplace: string | null
    data_venda: string | null
    status: string | null
    quantidade_total_unidades: NumeroBanco
    receita_liquida_calculada: NumeroBanco
    lucro_estimado: NumeroBanco
    margem_percentual_estimada: NumeroBanco
}

export type DashboardSaldoEstoque = {
    produto_id: string
    produto_nome: string
    produto_sku: string | null
    produto_asin: string | null
    local_estoque_id: string
    local_estoque_nome: string
    local_estoque_tipo: string
    saldo_atual: NumeroBanco
}

export async function buscarDashboardKpisGerais() {
    const { data, error } = await supabase
        .from('dashboard_kpis_gerais')
        .select('*')
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardKpisGerais | null
}

export async function buscarDashboardAlertasResumo() {
    const { data, error } = await supabase
        .from('dashboard_alertas_resumo')
        .select('*')
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardAlertasResumo | null
}

export async function buscarDashboardAlertasOperacionais() {
    const { data, error } = await supabase
        .from('dashboard_alertas_operacionais')
        .select('*')
        .order('gerado_em', { ascending: false })
        .limit(10)

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardAlertaOperacional[]
}

export async function buscarDashboardComprasRecentes() {
    const { data, error } = await supabase
        .from('compras_resumo')
        .select(`
      compra_id,
      fornecedor_nome,
      local_destino_nome,
      numero_pedido,
      data_compra,
      data_recebimento,
      status,
      quantidade_total_unidades,
      valor_total_estimado
    `)
        .order('data_compra', { ascending: false })
        .limit(5)

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardCompraRecente[]
}

export async function buscarDashboardVendasRecentes() {
    const { data, error } = await supabase
        .from('vendas_resumo')
        .select(`
      venda_id,
      canal_venda_nome,
      local_saida_nome,
      numero_pedido,
      numero_pedido_marketplace,
      data_venda,
      status,
      quantidade_total_unidades,
      receita_liquida_calculada,
      lucro_estimado,
      margem_percentual_estimada
    `)
        .order('data_venda', { ascending: false })
        .limit(5)

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardVendaRecente[]
}

export async function buscarDashboardSaldosEstoque() {
    const { data, error } = await supabase
        .from('saldos_estoque')
        .select('*')
        .order('produto_nome', { ascending: true })
        .limit(10)

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardSaldoEstoque[]
}