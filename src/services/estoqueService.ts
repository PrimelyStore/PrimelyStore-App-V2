import { supabase } from '../lib/supabase'

export type EstoqueSaldo = {
    produto_id: string
    produto_nome: string
    produto_sku: string | null
    produto_asin: string | null
    local_estoque_id: string
    local_estoque_nome: string
    local_estoque_tipo: string
    saldo_atual: number | null
}

export type MovimentacaoEstoqueDetalhada = {
    movimentacao_id: string
    produto_id: string
    produto_nome: string
    produto_sku: string | null
    produto_asin: string | null
    produto_marca: string | null
    produto_categoria: string | null
    local_origem_id: string | null
    local_origem_nome: string | null
    local_origem_tipo: string | null
    local_destino_id: string | null
    local_destino_nome: string | null
    local_destino_tipo: string | null
    tipo: string
    quantidade: number
    data_movimentacao: string | null
    documento_origem: string | null
    observacoes: string | null
    direcao_movimento: string | null
    created_at: string
    updated_at: string
}

export type EstoqueLoteDetalhado = {
    lote_id: string
    produto_id: string
    produto_nome: string
    produto_sku: string | null
    produto_asin: string | null
    produto_marca: string | null
    produto_categoria: string | null

    local_estoque_id: string
    local_estoque_nome: string
    local_estoque_tipo: string

    compra_id: string | null
    compra_numero_pedido: string | null
    compra_numero_nota_fiscal: string | null
    fornecedor_id: string | null
    fornecedor_nome: string | null

    compra_item_id: string | null
    codigo_produto_fornecedor: string | null
    compra_item_lote: string | null
    compra_item_validade: string | null

    codigo_lote: string | null
    documento_origem: string | null
    data_entrada: string | null
    quantidade_inicial: number
    quantidade_disponivel: number
    quantidade_consumida: number
    percentual_disponivel: number | null

    custo_unitario_compra: number | null
    custo_unitario_frete_rateado: number | null
    custo_unitario_outros_rateado: number | null
    custo_unitario_final: number | null
    custo_total_lote: number | null
    valor_total_disponivel: number | null

    tipo_lote: string | null
    status: string | null
    observacoes: string | null

    lote_origem_id: string | null
    lote_origem_codigo: string | null

    movimentacao_estoque_id: string | null
    movimentacao_tipo: string | null
    movimentacao_quantidade: number | null
    data_movimentacao: string | null

    created_at: string
    updated_at: string
}

export type NovaTransferenciaEstoque = {
    produto_id: string
    local_origem_id: string
    local_destino_id: string
    quantidade: number
    documento_origem: string | null
    observacoes: string | null
}

export async function buscarEstoque() {
    const { data, error } = await supabase
        .from('saldos_estoque')
        .select('*')
        .order('produto_nome', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as EstoqueSaldo[]
}

export async function buscarMovimentacoesEstoque() {
    const { data, error } = await supabase
        .from('movimentacoes_estoque_detalhado')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as MovimentacaoEstoqueDetalhada[]
}

export async function buscarLotesEstoqueDetalhados() {
    const { data, error } = await supabase
        .from('estoque_lotes_detalhado')
        .select('*')
        .order('data_entrada', { ascending: false })
        .order('produto_nome', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as EstoqueLoteDetalhado[]
}

export async function transferirEstoqueFIFO(
    transferencia: NovaTransferenciaEstoque
) {
    const { data, error } = await supabase.rpc('transferir_estoque_fifo', {
        p_produto_id: transferencia.produto_id,
        p_local_origem_id: transferencia.local_origem_id,
        p_local_destino_id: transferencia.local_destino_id,
        p_quantidade: transferencia.quantidade,
        p_documento_origem: transferencia.documento_origem,
        p_observacoes: transferencia.observacoes,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// ─── Módulo 4: Tipos de Dados Gerenciais V4 ───────────────────────────────────

export type DivergenciaFbaV4Status = 'Sem divergência' | 'Olist sobrando' | 'Amazon sobrando'

export type EstoqueConsolidadoV4Item = {
    sku: string
    produto_nome: string
    asin: string | null
    unidade: string | null
    
    // Prep Center (Olist Geral)
    saldo_prep_center: number
    disponivel_prep_center: number
    reservado_prep_center: number
    
    // FBA Lógico (Olist FBA)
    saldo_fba_olist: number
    disponivel_fba_olist: number
    reservado_fba_olist: number
    
    // FBA Físico (Amazon SP-API)
    saldo_fba_amazon: number       // total_quantity
    disponivel_fba_amazon: number  // fulfillable_quantity
    reservado_fba_amazon: number   // reserved_total_quantity
    indisponivel_fba_amazon: number // unfulfillable_total_quantity
    
    // Divergência
    divergencia_fba: number        // Saldo Olist FBA - Saldo Amazon FBA
    status_divergencia: DivergenciaFbaV4Status
    
    // Alertas Gerenciais
    alerta_ruptura_fba: boolean    // Zerado na Amazon mas tem saldo no Prep Center
    alerta_excesso_fba: boolean    // > 100 na Amazon mas com pouca venda recente
    curva_faturamento: string | null
    quantidade_vendida_curva: number
    
    sincronizado_em_olist: string | null
    sincronizado_em_amazon: string | null
}

export type ResumoEstoqueConsolidadoV4 = {
    total_skus: number
    skus_com_divergencia: number
    skus_com_ruptura: number
    skus_com_excesso: number
    total_prep_center: number
    total_fba_olist: number
    total_fba_amazon: number
    atualizado_em: string | null
}

// ─── Módulo 4: Funções Gerenciais V4 (Somente Leitura) ───────────────────────

/**
 * Busca, agrupa e consolida reativamente por SKU o estoque Prep Center, FBA Olist e FBA Amazon.
 */
export async function buscarEstoqueConsolidadoV4(): Promise<EstoqueConsolidadoV4Item[]> {
    // 1. Buscar Estoque Olist
    const { data: olistData, error: olistError } = await supabase
        .from('olist_estoque_depositos_snapshot')
        .select('sku, produto_nome, deposito_nome, saldo_deposito, disponivel_deposito, reservado_deposito, unidade, sincronizado_em')

    if (olistError) {
        throw new Error(`Erro ao buscar estoque Olist: ${olistError.message}`)
    }

    // 2. Buscar Estoque Amazon FBA
    const { data: amazonData, error: amazonError } = await supabase
        .from('amazon_fba_estoque_snapshot')
        .select('seller_sku, product_name, asin, fulfillable_quantity, reserved_total_quantity, unfulfillable_total_quantity, total_quantity, sincronizado_em')

    if (amazonError) {
        throw new Error(`Erro ao buscar estoque Amazon FBA: ${amazonError.message}`)
    }

    // 3. Buscar Curva ABC (Média de Vendas/Classificação)
    const abcMap = new Map<string, { curva_faturamento: string; quantidade_total: number }>()
    try {
        const { data: abcData, error: abcError } = await supabase
            .from('olist_curva_abc_view')
            .select('sku, curva_faturamento, quantidade_total')

        if (!abcError && abcData) {
            for (const item of abcData) {
                if (item.sku) {
                    abcMap.set(item.sku, {
                        curva_faturamento: item.curva_faturamento,
                        quantidade_total: Number(item.quantidade_total || 0)
                    })
                }
            }
        }
    } catch (e) {
        console.warn('olist_curva_abc_view não disponível para classificação de alertas de estoque:', e)
    }

    // 4. Consolidar por SKU no frontend
    const mapaConsolidado = new Map<string, EstoqueConsolidadoV4Item>()

    const inicializarItem = (sku: string, nome: string, unidade?: string | null, asin?: string | null): EstoqueConsolidadoV4Item => ({
        sku,
        produto_nome: nome,
        asin: asin ?? null,
        unidade: unidade ?? null,
        saldo_prep_center: 0,
        disponivel_prep_center: 0,
        reservado_prep_center: 0,
        saldo_fba_olist: 0,
        disponivel_fba_olist: 0,
        reservado_fba_olist: 0,
        saldo_fba_amazon: 0,
        disponivel_fba_amazon: 0,
        reservado_fba_amazon: 0,
        indisponivel_fba_amazon: 0,
        divergencia_fba: 0,
        status_divergencia: 'Sem divergência',
        alerta_ruptura_fba: false,
        alerta_excesso_fba: false,
        curva_faturamento: null,
        quantidade_vendida_curva: 0,
        sincronizado_em_olist: null,
        sincronizado_em_amazon: null
    })

    // Processar Olist
    for (const row of olistData || []) {
        const sku = row.sku
        if (!sku) continue

        const item = mapaConsolidado.get(sku) ?? inicializarItem(sku, row.produto_nome || 'Sem nome', row.unidade)
        const deposito = (row.deposito_nome || '').toLowerCase()

        const saldo = Number(row.saldo_deposito || 0)
        const disp = Number(row.disponivel_deposito || 0)
        const res = Number(row.reservado_deposito || 0)

        if (deposito.includes('geral') || !deposito.includes('fba')) {
            item.saldo_prep_center += saldo
            item.disponivel_prep_center += disp
            item.reservado_prep_center += res
        } else {
            item.saldo_fba_olist += saldo
            item.disponivel_fba_olist += disp
            item.reservado_fba_olist += res
        }

        item.sincronizado_em_olist = row.sincronizado_em
        mapaConsolidado.set(sku, item)
    }

    // Processar Amazon FBA
    for (const row of amazonData || []) {
        const sku = row.seller_sku
        if (!sku) continue

        const item = mapaConsolidado.get(sku) ?? inicializarItem(sku, row.product_name || 'Sem nome', null, row.asin)

        if (row.asin && !item.asin) {
            item.asin = row.asin
        }

        item.saldo_fba_amazon = Number(row.total_quantity || 0)
        item.disponivel_fba_amazon = Number(row.fulfillable_quantity || 0)
        item.reservado_fba_amazon = Number(row.reserved_total_quantity || 0)
        item.indisponivel_fba_amazon = Number(row.unfulfillable_total_quantity || 0)
        item.sincronizado_em_amazon = row.sincronizado_em

        mapaConsolidado.set(sku, item)
    }

    const listaResultado: EstoqueConsolidadoV4Item[] = []

    for (const item of mapaConsolidado.values()) {
        const abcInfo = abcMap.get(item.sku)
        if (abcInfo) {
            item.curva_faturamento = abcInfo.curva_faturamento
            item.quantidade_vendida_curva = abcInfo.quantidade_total
        }

        // Divergência FBA = Saldo Olist FBA - Saldo Amazon FBA
        item.divergencia_fba = item.saldo_fba_olist - item.saldo_fba_amazon

        if (item.divergencia_fba > 0) {
            item.status_divergencia = 'Olist sobrando'
        } else if (item.divergencia_fba < 0) {
            item.status_divergencia = 'Amazon sobrando'
        } else {
            item.status_divergencia = 'Sem divergência'
        }

        // 1. Alerta de Ruptura FBA (Curva A/B zerados na Amazon com saldo no Prep Center)
        const ehPrioritario = item.curva_faturamento === 'A' || item.curva_faturamento === 'B'
        if (item.disponivel_fba_amazon <= 0 && item.disponivel_prep_center > 0 && ehPrioritario) {
            item.alerta_ruptura_fba = true
        }

        // 2. Alerta de Excesso de FBA (Regra gerencial temporária do código: >100 unidades no FBA físico e pouca venda no snapshot)
        const possuiSaldoAltoFba = item.disponivel_fba_amazon > 100
        const possuiPoucaVenda = item.quantidade_vendida_curva < 5
        if (possuiSaldoAltoFba && possuiPoucaVenda) {
            item.alerta_excesso_fba = true
        }

        listaResultado.push(item)
    }

    return listaResultado.sort((a, b) => a.sku.localeCompare(b.sku))
}

/**
 * Calcula o consolidado de KPIs do estoque a partir dos itens já carregados (frontend).
 */
export function calcularResumoEstoqueConsolidadoV4(
    itens: EstoqueConsolidadoV4Item[]
): ResumoEstoqueConsolidadoV4 {
    let skusComDivergencia = 0
    let skusComRuptura = 0
    let skusComExcesso = 0
    let totalPrepCenter = 0
    let totalFbaOlist = 0
    let totalFbaAmazon = 0
    const datasUpdate: string[] = []

    for (const item of itens) {
        if (item.status_divergencia !== 'Sem divergência') {
            skusComDivergencia += 1
        }
        if (item.alerta_ruptura_fba) {
            skusComRuptura += 1
        }
        if (item.alerta_excesso_fba) {
            skusComExcesso += 1
        }

        totalPrepCenter += item.saldo_prep_center
        totalFbaOlist += item.saldo_fba_olist
        totalFbaAmazon += item.saldo_fba_amazon

        if (item.sincronizado_em_olist) datasUpdate.push(item.sincronizado_em_olist)
        if (item.sincronizado_em_amazon) datasUpdate.push(item.sincronizado_em_amazon)
    }

    const atualizado_em = datasUpdate.length > 0 
        ? new Date(Math.max(...datasUpdate.map(d => new Date(d).getTime()))).toISOString()
        : new Date().toISOString()

    return {
        total_skus: itens.length,
        skus_com_divergencia: skusComDivergencia,
        skus_com_ruptura: skusComRuptura,
        skus_com_excesso: skusComExcesso,
        total_prep_center: totalPrepCenter,
        total_fba_olist: totalFbaOlist,
        total_fba_amazon: totalFbaAmazon,
        atualizado_em
    }
}

