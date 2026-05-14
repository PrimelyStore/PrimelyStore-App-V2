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
