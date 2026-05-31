import { supabase } from '../lib/supabase'

export type ClassificacaoOperacionalRecebimento =
    | 'recebimento_real'
    | 'historico_fiscal_sem_entrada_estoque'
    | 'pendente_conferencia_operacional'

export type CompraResumo = {
    compra_id: string
    fornecedor_id: string | null
    fornecedor_nome: string | null
    local_destino_id: string | null
    local_destino_nome: string | null
    numero_pedido: string | null
    numero_nota_fiscal: string | null
    data_compra: string
    data_prevista_entrega: string | null
    data_recebimento: string | null
    status: string
    quantidade_itens_distintos: number | null
    quantidade_total_unidades: number | null
    valor_bruto_produtos: number | null
    valor_descontos_itens: number | null
    valor_impostos_itens: number | null
    outros_custos_itens: number | null
    valor_frete: number | null
    valor_desconto_compra: number | null
    outros_custos_compra: number | null
    valor_total_estimado: number | null
    created_at: string
    updated_at: string
    classificacao_operacional_recebimento: ClassificacaoOperacionalRecebimento | string | null
    bloqueia_recebimento: boolean
    motivo_bloqueio_recebimento: string | null
    origem_controle_recebimento: string | null
}

export type CompraControleRecebimento = {
    compra_id: string
    classificacao_operacional: ClassificacaoOperacionalRecebimento | string
    bloqueia_recebimento: boolean
    motivo: string | null
    origem: string | null
}

export type ControleRecebimentoResultado = {
    compra_id: string
    numero_pedido: string | null
    numero_nota_fiscal: string | null
    classificacao_operacional: ClassificacaoOperacionalRecebimento | string
    bloqueia_recebimento: boolean
    motivo: string | null
    origem: string | null
    status_validacao: string
}

export type Compra = {
    id: string
    fornecedor_id: string | null
    local_destino_id: string | null
    numero_pedido: string | null
    numero_nota_fiscal: string | null
    data_compra: string
    data_prevista_entrega: string | null
    data_recebimento: string | null
    status: string
    valor_frete: number
    valor_desconto: number
    outros_custos: number
    observacoes: string | null
    created_at: string
    updated_at: string
}

export type NovaCompra = {
    fornecedor_id: string | null
    local_destino_id: string | null
    numero_pedido: string | null
    numero_nota_fiscal: string | null
    data_compra: string
    data_prevista_entrega: string | null
    data_recebimento: string | null
    status: string
    valor_frete: number
    valor_desconto: number
    outros_custos: number
    observacoes: string | null
}

export type CompraItem = {
    id: string
    compra_id: string
    produto_id: string
    quantidade: number
    quantidade_recebida: number
    custo_unitario: number
    valor_desconto_item: number
    valor_impostos_item: number
    outros_custos_item: number
    codigo_produto_fornecedor: string | null
    lote: string | null
    validade: string | null
    status: string
    observacoes: string | null
    created_at: string
    updated_at: string
}

export type CompraItemDetalhado = CompraItem & {
    compras: {
        numero_pedido: string | null
        status: string
    } | null
    produtos: {
        nome: string
        sku: string
        asin: string | null
    } | null
    classificacao_operacional_recebimento: ClassificacaoOperacionalRecebimento | string | null
    bloqueia_recebimento: boolean
    motivo_bloqueio_recebimento: string | null
    origem_controle_recebimento: string | null
}

export type NovoCompraItem = {
    compra_id: string
    produto_id: string
    quantidade: number
    quantidade_recebida: number
    custo_unitario: number
    valor_desconto_item: number
    valor_impostos_item: number
    outros_custos_item: number
    codigo_produto_fornecedor: string | null
    lote: string | null
    validade: string | null
    status: string
    observacoes: string | null
}

async function buscarControlesRecebimento(compraIds: string[]) {
    const idsUnicos = Array.from(new Set(compraIds.filter(Boolean)))

    if (idsUnicos.length === 0) {
        return new Map<string, CompraControleRecebimento>()
    }

    const { data, error } = await supabase
        .from('compras_controle_recebimento_publico')
        .select('compra_id, classificacao_operacional, bloqueia_recebimento, motivo, origem')
        .in('compra_id', idsUnicos)

    if (error) {
        throw new Error(error.message)
    }

    return new Map(
        ((data ?? []) as CompraControleRecebimento[]).map((controle) => [
            controle.compra_id,
            controle,
        ])
    )
}

export async function buscarComprasResumo() {
    const { data, error } = await supabase
        .from('compras_resumo')
        .select('*')
        .order('data_compra', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    const compras = (data ?? []) as Omit<
        CompraResumo,
        | 'classificacao_operacional_recebimento'
        | 'bloqueia_recebimento'
        | 'motivo_bloqueio_recebimento'
        | 'origem_controle_recebimento'
    >[]

    const controlesPorCompra = await buscarControlesRecebimento(
        compras.map((compra) => compra.compra_id)
    )

    return compras.map((compra) => {
        const controle = controlesPorCompra.get(compra.compra_id)

        return {
            ...compra,
            classificacao_operacional_recebimento:
                controle?.classificacao_operacional ?? null,
            bloqueia_recebimento: controle?.bloqueia_recebimento ?? false,
            motivo_bloqueio_recebimento: controle?.motivo ?? null,
            origem_controle_recebimento: controle?.origem ?? null,
        }
    }) as CompraResumo[]
}

export async function buscarItensCompras() {
    const { data, error } = await supabase
        .from('compras_itens')
        .select(`
      *,
      compras (
        numero_pedido,
        status
      ),
      produtos (
        nome,
        sku,
        asin
      )
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        throw new Error(error.message)
    }

    const itens = (data ?? []) as Omit<
        CompraItemDetalhado,
        | 'classificacao_operacional_recebimento'
        | 'bloqueia_recebimento'
        | 'motivo_bloqueio_recebimento'
        | 'origem_controle_recebimento'
    >[]

    const controlesPorCompra = await buscarControlesRecebimento(
        itens.map((item) => item.compra_id)
    )

    return itens.map((item) => {
        const controle = controlesPorCompra.get(item.compra_id)

        return {
            ...item,
            classificacao_operacional_recebimento:
                controle?.classificacao_operacional ?? null,
            bloqueia_recebimento: controle?.bloqueia_recebimento ?? false,
            motivo_bloqueio_recebimento: controle?.motivo ?? null,
            origem_controle_recebimento: controle?.origem ?? null,
        }
    }) as CompraItemDetalhado[]
}


export type ResultadoSincronizacaoNotasEntradaOlist = {
    ok: boolean
    service?: string
    message?: string
    authorization_mode?: string
    token_refreshed_before_sync?: boolean
    result?: {
        limit?: number
        start_offset?: number
        next_offset_if_continues?: number
        total_reported_by_api?: number
        received_count?: number
        saved_notas_count?: number
        inserted_notas_count?: number
        updated_notas_count?: number
        saved_items_count?: number
        inserted_items_count?: number
        updated_items_count?: number
        saved_suppliers_count?: number
        inserted_suppliers_count?: number
        updated_suppliers_count?: number
        notas_errors_count?: number
        items_errors_count?: number
        synchronized_at?: string
        stop_reason?: string
        status?: string
        preview?: Array<{
            numero?: string
            fornecedor_nome?: string
            valor?: number
            itens?: number
            status_processamento?: string
        }>
    }
    error?: string
}

export async function buscarNotasEntradaOlistCompras() {
    const { data, error } =
        await supabase.functions.invoke<ResultadoSincronizacaoNotasEntradaOlist>(
            'compras-olist-notas-entrada-sync',
            {
                body: {
                    limit: 3,
                    maxPages: 3,
                    offset: 0,
                },
            }
        )

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('A sincronização Olist não retornou dados.')
    }

    if (!data.ok) {
        throw new Error(data.error ?? data.message ?? 'Erro ao sincronizar NFs de compra no Olist.')
    }

    return data
}

export async function cadastrarCompra(compra: NovaCompra) {
    const { data, error } = await supabase
        .from('compras')
        .insert(compra)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Compra
}

export async function cadastrarItemCompra(item: NovoCompraItem) {
    const { data, error } = await supabase
        .from('compras_itens')
        .insert(item)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as CompraItem
}

export async function receberItemCompra(
    compraItemId: string,
    quantidadeRecebida: number
) {
    const { data, error } = await supabase.rpc('receber_item_compra', {
        p_compra_item_id: compraItemId,
        p_quantidade_recebida: quantidadeRecebida,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function definirControleRecebimentoCompra(
    compraId: string,
    classificacaoOperacional: ClassificacaoOperacionalRecebimento,
    motivo: string,
    origem = 'tela_compras'
) {
    const { data, error } = await supabase.rpc(
        'definir_controle_recebimento_compra',
        {
            p_compra_id: compraId,
            p_classificacao_operacional: classificacaoOperacional,
            p_motivo: motivo,
            p_origem: origem,
        }
    )

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []) as ControleRecebimentoResultado[]
}
