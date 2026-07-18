import { supabase } from '../lib/supabase'
import { buscarSaudeOlist } from './olistIntegracoesService'

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


export type DashboardAlertasVendasPendentesBaixa = {
    total_pendencias: NumeroBanco
    total_alto: NumeroBanco
    total_medio: NumeroBanco
    total_baixo: NumeroBanco
    total_estoque_insuficiente: NumeroBanco
    total_aptas_para_baixa: NumeroBanco
    total_origem_olist: NumeroBanco
    total_pedidos_afetados: NumeroBanco
    total_unidades_pendentes: NumeroBanco
    atualizado_em: string | null
}

export type DashboardVendaPendenteBaixaFifo = {
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


export async function buscarDashboardAlertasVendasPendentesBaixa() {
    const { data, error } = await supabase
        .from('dashboard_alertas_vendas_pendentes_baixa')
        .select('*')
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardAlertasVendasPendentesBaixa | null
}

export async function buscarDashboardVendasPendentesBaixaFIFO() {
    const { data, error } = await supabase
        .from('vendas_pendentes_baixa_fifo')
        .select('*')
        .order('data_venda', { ascending: false })
        .order('numero_pedido', { ascending: false })
        .limit(10)

    if (error) {
        throw new Error(error.message)
    }

    return data as DashboardVendaPendenteBaixaFifo[]
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

// ─── Módulo 3: Tipos de Dados Gerenciais V3 ───────────────────────────────────

export type DashboardKpisV3 = {
    faturamento_total: number
    total_pedidos: number
    total_itens_vendidos: number
    ticket_medio: number
    margem_media_estimada: number
    lucro_estimado_total: number
    total_produtos_ativos: number
    estoque_total_prep_center: number
    estoque_total_amazon_fba: number
    total_produtos_sem_custo: number
    atualizado_em: string | null
}

export type FaturamentoPorCanalV3 = {
    canal: string
    faturamento: number
    quantidade_pedidos: number
    participacao_percentual: number
}

export type TendenciaFaturamentoV3 = {
    data: string
    faturamento: number
    pedidos: number
}

export type PedidoRecenteOlistV3 = {
    id_pedido_olist: number | string
    numero_pedido: string | null
    numero_pedido_ecommerce: string | null
    canal_gerencial: string | null
    data_pedido: string | null
    valor_total: number
    status_gerencial: string | null
    sincronizado_em: string | null
}

export type NotaEntradaRecenteV3 = {
    id_nota_olist: number | string
    numero_nf: string | null
    fornecedor_nome: string | null
    data_emissao: string | null
    valor_total_nf: number
    total_itens_nf: number
    status_processamento: string | null
    sincronizado_em: string | null
}

export type EstoqueConsolidadoV3 = {
    sku: string | null
    produto_nome: string | null
    local_estoque: 'Prep Center' | 'Amazon FBA'
    deposito_nome: string | null
    saldo_disponivel: number
    saldo_reservado: number
    saldo_total: number
    sincronizado_em: string | null
}

export type AlertaGerencialV3 = {
    tipo: 'token_expiracao' | 'ruptura_fba' | 'vendas_sem_custo' | 'divergencia_sync'
    titulo: string
    descricao: string
    severidade: 'alto' | 'medio' | 'baixo'
    detalhes?: string
}

// ─── Módulo 3: Funções Gerenciais V3 (Somente Leitura) ───────────────────────

/**
 * Agrega e calcula KPIs gerenciais a partir das views e snapshots do Supabase.
 */
export async function buscarKpisGerenciaisV3(
    dataInicio?: string,
    dataFim?: string
): Promise<DashboardKpisV3> {
    // 1. Pedidos Olist
    let queryPedidos = supabase
        .from('olist_pedidos_resumo_gerencial_view')
        .select('data_referencia, total_pedidos, valor_total_pedidos, quantidade_total_itens, situacao, ultima_sincronizacao')
        .not('situacao', 'ilike', 'cancelado')

    if (dataInicio) {
        queryPedidos = queryPedidos.gte('data_referencia', dataInicio)
    }
    if (dataFim) {
        queryPedidos = queryPedidos.lte('data_referencia', dataFim)
    }

    const { data: pedidosData, error: errorPedidos } = await queryPedidos

    if (errorPedidos) {
        throw new Error(`Erro ao buscar KPIs de pedidos: ${errorPedidos.message}`)
    }

    let faturamentoTotal = 0
    let totalPedidos = 0
    let totalItensVendidos = 0

    for (const row of pedidosData || []) {
        faturamentoTotal += Number(row.valor_total_pedidos || 0)
        totalPedidos += Number(row.total_pedidos || 0)
        totalItensVendidos += Number(row.quantidade_total_itens || 0)
    }

    const ticketMedio = totalPedidos > 0 ? faturamentoTotal / totalPedidos : 0

    // 2. Produtos ativos count
    const { count: totalProdutosAtivos, error: errorProdutos } = await supabase
        .from('olist_produtos_snapshot')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 'A')

    if (errorProdutos) {
        throw new Error(`Erro ao buscar total de produtos ativos: ${errorProdutos.message}`)
    }

    // 3. Estoque Prep Center
    const { data: estoqueData, error: errorEstoque } = await supabase
        .from('olist_estoque_depositos_snapshot')
        .select('deposito_nome, disponivel_deposito')

    if (errorEstoque) {
        throw new Error(`Erro ao buscar estoque Olist: ${errorEstoque.message}`)
    }

    let estoquePrepCenter = 0
    for (const item of estoqueData || []) {
        const nome = (item.deposito_nome || '').toLowerCase()
        if (nome.includes('geral') || !nome.includes('fba')) {
            estoquePrepCenter += Number(item.disponivel_deposito || 0)
        }
    }

    // 4. Estoque Amazon FBA
    const { data: estoqueAmazonData, error: errorAmazon } = await supabase
        .from('amazon_fba_estoque_snapshot')
        .select('fulfillable_quantity')

    if (errorAmazon) {
        throw new Error(`Erro ao buscar estoque Amazon FBA: ${errorAmazon.message}`)
    }

    const estoqueAmazonFba = (estoqueAmazonData || []).reduce(
        (acc, item) => acc + Number(item.fulfillable_quantity || 0),
        0
    )

    // 5. Margem, Lucro e Sem Custo (Curva ABC)
    let margemMediaEstimada = 0
    let lucroEstimadoTotal = 0
    let totalProdutosSemCusto = 0

    try {
        const { data: abcData, error: errorAbc } = await supabase
            .from('olist_curva_abc_view')
            .select('curva_margem, faturamento_total, lucro_estimado, custo_total_estimado')

        if (errorAbc) {
            console.warn('Falha ao ler olist_curva_abc_view, utilizando valores padrão:', errorAbc.message)
        } else if (abcData && abcData.length > 0) {
            let faturamentoValido = 0
            let custoValido = 0

            for (const item of abcData) {
                if (item.curva_margem === 'sem_custo') {
                    totalProdutosSemCusto += 1
                }

                lucroEstimadoTotal += Number(item.lucro_estimado || 0)
                faturamentoValido += Number(item.faturamento_total || 0)
                custoValido += Number(item.custo_total_estimado || 0)
            }

            margemMediaEstimada = faturamentoValido > 0 
                ? ((faturamentoValido - custoValido) / faturamentoValido) * 100 
                : 0
        }
    } catch (e) {
        console.warn('Erro ao processar Curva ABC nos KPIs:', e)
    }

    // Determinar data de atualização geral
    const datasUpdate = [
        ...((pedidosData || []).map(p => p.ultima_sincronizacao).filter(Boolean) as string[])
    ]
    const atualizado_em = datasUpdate.length > 0 
        ? new Date(Math.max(...datasUpdate.map(d => new Date(d).getTime()))).toISOString()
        : new Date().toISOString()

    return {
        faturamento_total: faturamentoTotal,
        total_pedidos: totalPedidos,
        total_itens_vendidos: totalItensVendidos,
        ticket_medio: ticketMedio,
        margem_media_estimada: margemMediaEstimada,
        lucro_estimado_total: lucroEstimadoTotal,
        total_produtos_ativos: totalProdutosAtivos || 0,
        estoque_total_prep_center: estoquePrepCenter,
        estoque_total_amazon_fba: estoqueAmazonFba,
        total_produtos_sem_custo: totalProdutosSemCusto,
        atualizado_em,
    }
}

/**
 * Retorna faturamento e pedidos acumulados por canal de venda (Marketplace).
 */
export async function buscarFaturamentoPorCanalV3(
    dataInicio?: string,
    dataFim?: string
): Promise<FaturamentoPorCanalV3[]> {
    let query = supabase
        .from('olist_pedidos_resumo_gerencial_view')
        .select('canal_gerencial, total_pedidos, valor_total_pedidos, situacao')
        .not('situacao', 'ilike', 'cancelado')

    if (dataInicio) {
        query = query.gte('data_referencia', dataInicio)
    }
    if (dataFim) {
        query = query.lte('data_referencia', dataFim)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Erro ao buscar faturamento por canal: ${error.message}`)
    }

    const mapa = new Map<string, { faturamento: number; pedidos: number }>()
    let faturamentoTotalGeral = 0

    for (const row of data || []) {
        const canal = row.canal_gerencial || 'Outro / Não informado'
        const atual = mapa.get(canal) ?? { faturamento: 0, pedidos: 0 }

        const fat = Number(row.valor_total_pedidos || 0)
        atual.faturamento += fat
        atual.pedidos += Number(row.total_pedidos || 0)
        faturamentoTotalGeral += fat

        mapa.set(canal, atual)
    }

    const resultado: FaturamentoPorCanalV3[] = []
    for (const [canal, info] of mapa.entries()) {
        const participacao = faturamentoTotalGeral > 0 
            ? (info.faturamento / faturamentoTotalGeral) * 100 
            : 0

        resultado.push({
            canal,
            faturamento: info.faturamento,
            quantidade_pedidos: info.pedidos,
            participacao_percentual: participacao
        })
    }

    return resultado.sort((a, b) => b.faturamento - a.faturamento)
}

/**
 * Retorna a tendência diária de faturamento e volume de pedidos para gráficos de evolução temporal.
 */
export async function buscarTendenciaFaturamentoV3(
    dataInicio?: string,
    dataFim?: string
): Promise<TendenciaFaturamentoV3[]> {
    let query = supabase
        .from('olist_pedidos_resumo_gerencial_view')
        .select('data_referencia, total_pedidos, valor_total_pedidos, situacao')
        .not('situacao', 'ilike', 'cancelado')

    if (dataInicio) {
        query = query.gte('data_referencia', dataInicio)
    }
    if (dataFim) {
        query = query.lte('data_referencia', dataFim)
    }

    const { data, error } = await query

    if (error) {
        throw new Error(`Erro ao buscar tendência de faturamento: ${error.message}`)
    }

    const mapa = new Map<string, { faturamento: number; pedidos: number }>()

    for (const row of data || []) {
        const dataRef = row.data_referencia || 'Sem data'
        const atual = mapa.get(dataRef) ?? { faturamento: 0, pedidos: 0 }

        atual.faturamento += Number(row.valor_total_pedidos || 0)
        atual.pedidos += Number(row.total_pedidos || 0)

        mapa.set(dataRef, atual)
    }

    const resultado: TendenciaFaturamentoV3[] = []
    for (const [date, info] of mapa.entries()) {
        resultado.push({
            data: date,
            faturamento: info.faturamento,
            pedidos: info.pedidos
        })
    }

    return resultado.sort((a, b) => a.data.localeCompare(b.data))
}

/**
 * Busca os pedidos recentes agregados em nível gerencial sem duplicar linhas de itens.
 */
export async function buscarPedidosRecentesOlistV3(
    limite: number = 20
): Promise<PedidoRecenteOlistV3[]> {
    const { data, error } = await supabase
        .from('olist_pedidos_gerencial_view')
        .select('id_pedido_olist, numero_pedido, numero_pedido_ecommerce, canal_venda_olist, ecommerce_nome, data_pedido, valor_total, status_gerencial, pedido_sincronizado_em')
        .order('pedido_sincronizado_em', { ascending: false })
        .limit(limite)

    if (error) {
        throw new Error(`Erro ao buscar pedidos recentes gerenciais: ${error.message}`)
    }

    const mapa = new Map<string | number, PedidoRecenteOlistV3>()

    for (const row of data || []) {
        const id = row.id_pedido_olist
        if (!id) continue

        if (!mapa.has(id)) {
            mapa.set(id, {
                id_pedido_olist: id,
                numero_pedido: row.numero_pedido,
                numero_pedido_ecommerce: row.numero_pedido_ecommerce,
                canal_gerencial: row.ecommerce_nome ?? row.canal_venda_olist ?? 'Não informado',
                data_pedido: row.data_pedido,
                valor_total: Number(row.valor_total || 0),
                status_gerencial: row.status_gerencial,
                sincronizado_em: row.pedido_sincronizado_em
            })
        }
    }

    return Array.from(mapa.values())
}

/**
 * Retorna as notas fiscais de entrada recentes importadas nos snapshots do Olist.
 */
export async function buscarNotasEntradaRecentesV3(
    limite: number = 10
): Promise<NotaEntradaRecenteV3[]> {
    const { data, error } = await supabase
        .from('olist_notas_entrada_recentes_gerencial_view')
        .select('id_nota_olist, numero_nf, fornecedor_nome, data_emissao, valor_total_nf, total_itens_nf, status_processamento, sincronizado_em')
        .order('sincronizado_em', { ascending: false })
        .limit(limite)

    if (error) {
        throw new Error(`Erro ao buscar notas de entrada recentes: ${error.message}`)
    }

    return (data || []).map((row: any) => ({
        id_nota_olist: row.id_nota_olist,
        numero_nf: row.numero_nf,
        fornecedor_nome: row.fornecedor_nome,
        data_emissao: row.data_emissao,
        valor_total_nf: Number(row.valor_total_nf || 0),
        total_itens_nf: Number(row.total_itens_nf || 0),
        status_processamento: row.status_processamento,
        sincronizado_em: row.sincronizado_em
    }))
}

/**
 * Retorna uma visão unificada e consolidada do estoque Prep Center (Olist) e FBA Amazon (SP-API).
 */
export async function buscarEstoqueConsolidadoV3(): Promise<EstoqueConsolidadoV3[]> {
    // 1. Estoque Olist
    const { data: olistEstoque, error: olistError } = await supabase
        .from('olist_estoque_depositos_snapshot')
        .select('sku, produto_nome, deposito_nome, disponivel_deposito, reservado_deposito, saldo_deposito, sincronizado_em')

    if (olistError) {
        throw new Error(`Erro ao buscar estoque Olist consolidado: ${olistError.message}`)
    }

    // 2. Estoque Amazon FBA
    const { data: amazonEstoque, error: amazonError } = await supabase
        .from('amazon_fba_estoque_snapshot')
        .select('seller_sku, product_name, fulfillable_quantity, reserved_total_quantity, total_quantity, sincronizado_em')

    if (amazonError) {
        throw new Error(`Erro ao buscar estoque Amazon FBA consolidado: ${amazonError.message}`)
    }

    const resultado: EstoqueConsolidadoV3[] = []

    for (const item of olistEstoque || []) {
        const nomeDep = (item.deposito_nome || '').toLowerCase()
        const local: 'Prep Center' | 'Amazon FBA' = nomeDep.includes('fba') ? 'Amazon FBA' : 'Prep Center'

        resultado.push({
            sku: item.sku,
            produto_nome: item.produto_nome,
            local_estoque: local,
            deposito_nome: item.deposito_nome,
            saldo_disponivel: Number(item.disponivel_deposito || 0),
            saldo_reservado: Number(item.reservado_deposito || 0),
            saldo_total: Number(item.saldo_deposito || 0),
            sincronizado_em: item.sincronizado_em
        })
    }

    for (const item of amazonEstoque || []) {
        resultado.push({
            sku: item.seller_sku,
            produto_nome: item.product_name,
            local_estoque: 'Amazon FBA',
            deposito_nome: 'Amazon FBA (SP-API)',
            saldo_disponivel: Number(item.fulfillable_quantity || 0),
            saldo_reservado: Number(item.reserved_total_quantity || 0),
            saldo_total: Number(item.total_quantity || 0),
            sincronizado_em: item.sincronizado_em
        })
    }

    return resultado
}

/**
 * Calcula de forma dinâmica os alertas gerenciais sem depender de tabelas FIFO e lotes operacionais.
 */
export async function buscarAlertasGerenciaisV3(): Promise<AlertaGerencialV3[]> {
    const alertas: AlertaGerencialV3[] = []

    // 1. Alerta de Expiração do Token Olist
    try {
        const saudeOlist = await buscarSaudeOlist()
        
        if (saudeOlist && saudeOlist.token_status) {
            const expiraEmStr = saudeOlist.token_status.expires_at
            if (expiraEmStr) {
                const expiraEm = new Date(expiraEmStr)
                const hoje = new Date()
                const diferencaDias = (expiraEm.getTime() - hoje.getTime()) / (1000 * 3600 * 24)

                if (saudeOlist.token_status.expired) {
                    alertas.push({
                        tipo: 'token_expiracao',
                        titulo: 'Conexão Olist Expirada',
                        descricao: 'O token OAuth da Olist expirou. É necessário reautenticar a integração.',
                        severidade: 'alto',
                        detalhes: `Expirou em: ${new Date(expiraEmStr).toLocaleString('pt-BR')}`
                    })
                } else if (diferencaDias >= 0 && diferencaDias <= 7) {
                    alertas.push({
                        tipo: 'token_expiracao',
                        titulo: 'Renovação do Token Olist Pendente',
                        descricao: `O token OAuth da Olist vencerá em breve (menos de ${Math.ceil(diferencaDias)} dias).`,
                        severidade: 'medio',
                        detalhes: `Vencimento: ${new Date(expiraEmStr).toLocaleString('pt-BR')}`
                    })
                }
            } else if (!saudeOlist.ok) {
                alertas.push({
                    tipo: 'token_expiracao',
                    titulo: 'Conexão Olist Inoperante',
                    descricao: 'A conexão de saúde com a API Olist retornou erro genérico.',
                    severidade: 'alto'
                })
            }
        }
    } catch (e) {
        console.error('Falha ao processar alerta de token Olist:', e)
    }

    // 2. Alerta de Ruptura FBA para SKUs prioritários da Curva A/B
    try {
        const estoqueConsolidado = await buscarEstoqueConsolidadoV3()
        const { data: abcData } = await supabase
            .from('olist_curva_abc_view')
            .select('sku, curva_faturamento')
            .in('curva_faturamento', ['A', 'B'])

        if (abcData && abcData.length > 0) {
            const skusPrioritarios = new Set(abcData.map(item => item.sku).filter(Boolean))
            const saldosPorSku = new Map<string, { prepCenter: number; fba: number }>()

            for (const item of estoqueConsolidado) {
                const sku = item.sku
                if (!sku) continue

                const atual = saldosPorSku.get(sku) ?? { prepCenter: 0, fba: 0 }
                if (item.local_estoque === 'Prep Center') {
                    atual.prepCenter += item.saldo_disponivel
                } else {
                    atual.fba += item.saldo_disponivel
                }
                saldosPorSku.set(sku, atual)
            }

            let contagemRupturas = 0
            const rupturasSkus: string[] = []

            for (const [sku, saldos] of saldosPorSku.entries()) {
                if (skusPrioritarios.has(sku) && saldos.fba <= 0 && saldos.prepCenter > 0) {
                    contagemRupturas += 1
                    if (rupturasSkus.length < 5) {
                        rupturasSkus.push(sku)
                    }
                }
            }

            if (contagemRupturas > 0) {
                alertas.push({
                    tipo: 'ruptura_fba',
                    titulo: 'Alerta de Ruptura FBA Detectado',
                    descricao: `${contagemRupturas} produto(s) prioritário(s) da Curva A/B estão sem estoque no FBA Amazon mas têm saldo no Prep Center.`,
                    severidade: 'medio',
                    detalhes: `SKUs afetados: ${rupturasSkus.join(', ')}`
                })
            }
        }
    } catch (e) {
        console.error('Falha ao processar alerta de ruptura FBA:', e)
    }

    // 3. Alerta de SKUs vendidos recentemente sem custos cadastrados
    try {
        const { data: abcData } = await supabase
            .from('olist_curva_abc_view')
            .select('sku, curva_margem, faturamento_total')
            .eq('curva_margem', 'sem_custo')
            .gt('faturamento_total', 0)

        if (abcData && abcData.length > 0) {
            const skusSemCusto = abcData.map(item => item.sku).filter(Boolean)
            alertas.push({
                tipo: 'vendas_sem_custo',
                titulo: 'Produtos Vendidos Sem Custo Estimado',
                descricao: `${abcData.length} produto(s) ativos com faturamento gerencial não possuem custo médio calculado nas Notas de Entrada.`,
                severidade: 'baixo',
                detalhes: `SKUs afetados: ${skusSemCusto.slice(0, 5).join(', ')}`
            })
        }
    } catch (e) {
        console.error('Falha ao processar alerta de SKUs sem custo:', e)
    }

    return alertas
}