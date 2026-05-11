import { supabase } from '../lib/supabase'

export type CanalVenda = {
    id: string
    nome: string
    tipo: string
    modalidade_logistica: string
    codigo_externo: string | null
    marketplace_id: string | null
    observacoes: string | null
    status: string
    created_at: string
    updated_at: string
}

export type VendaResumo = {
    venda_id: string
    canal_venda_id: string | null
    canal_venda_nome: string | null
    canal_venda_tipo: string | null
    modalidade_logistica: string | null
    local_saida_id: string | null
    local_saida_nome: string | null
    numero_pedido: string | null
    numero_pedido_marketplace: string | null
    data_venda: string | null
    data_pagamento: string | null
    data_envio: string | null
    data_entrega: string | null
    status: string | null
    quantidade_itens_distintos: number | null
    quantidade_total_unidades: number | null
    valor_bruto_itens: number | null
    valor_descontos_itens: number | null
    valor_taxas_marketplace_itens: number | null
    valor_taxas_logistica_itens: number | null
    valor_impostos_itens: number | null
    outros_custos_itens: number | null
    custo_estimado_produtos: number | null
    valor_produtos_cabecalho: number | null
    valor_frete_cobrado: number | null
    valor_desconto_cabecalho: number | null
    valor_taxas_marketplace_cabecalho: number | null
    valor_taxas_logistica_cabecalho: number | null
    valor_impostos_cabecalho: number | null
    outros_custos_cabecalho: number | null
    valor_total_cabecalho: number | null
    receita_liquida_calculada: number | null
    custos_variaveis_calculados: number | null
    lucro_estimado: number | null
    margem_percentual_estimada: number | null
    created_at: string | null
    updated_at: string | null
}

export type Venda = {
    id: string
    canal_venda_id: string | null
    local_saida_id: string | null
    numero_pedido: string | null
    numero_pedido_marketplace: string | null
    data_venda: string
    data_pagamento: string | null
    data_envio: string | null
    data_entrega: string | null
    status: string
    valor_produtos: number
    valor_frete_cobrado: number
    valor_desconto: number
    valor_taxas_marketplace: number
    valor_taxas_logistica: number
    valor_impostos: number
    outros_custos: number
    valor_total: number
    observacoes: string | null
    created_at: string
    updated_at: string
}

export type NovaVenda = {
    canal_venda_id: string
    local_saida_id: string
    numero_pedido: string | null
    numero_pedido_marketplace: string | null
    data_venda: string
    data_pagamento: string | null
    data_envio: string | null
    data_entrega: string | null
    status: string
    valor_produtos: number
    valor_frete_cobrado: number
    valor_desconto: number
    valor_taxas_marketplace: number
    valor_taxas_logistica: number
    valor_impostos: number
    outros_custos: number
    valor_total: number
    observacoes: string | null
}

export type VendaItem = {
    id: string
    venda_id: string
    produto_id: string
    sku_vendido: string | null
    asin_vendido: string | null
    quantidade: number
    valor_unitario: number
    valor_desconto_item: number
    valor_taxa_marketplace_item: number
    valor_taxa_logistica_item: number
    valor_imposto_item: number
    outros_custos_item: number
    custo_unitario_estimado: number
    status: string
    observacoes: string | null
    created_at: string
    updated_at: string
}

export type VendaItemDetalhado = VendaItem & {
    vendas: {
        numero_pedido: string | null
        status: string
        local_saida_id: string | null
    } | null
    produtos: {
        nome: string
        sku: string
        asin: string | null
    } | null
    vendas_itens_lotes: {
        quantidade_consumida: number
    }[] | null
}

export type NovoVendaItem = {
    venda_id: string
    produto_id: string
    sku_vendido: string | null
    asin_vendido: string | null
    quantidade: number
    valor_unitario: number
    valor_desconto_item: number
    valor_taxa_marketplace_item: number
    valor_taxa_logistica_item: number
    valor_imposto_item: number
    outros_custos_item: number
    custo_unitario_estimado: number
    status: string
    observacoes: string | null
}

export async function buscarCanaisVendaAtivos() {
    const { data, error } = await supabase
        .from('canais_venda')
        .select('*')
        .order('nome', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as CanalVenda[]
}

export async function buscarVendasResumo() {
    const { data, error } = await supabase
        .from('vendas_resumo')
        .select('*')
        .order('data_venda', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as VendaResumo[]
}

export async function buscarItensVendas() {
    const { data, error } = await supabase
        .from('vendas_itens')
        .select(`
      *,
      vendas (
        numero_pedido,
        status,
        local_saida_id
      ),
      produtos (
        nome,
        sku,
        asin
      ),
      vendas_itens_lotes (
        quantidade_consumida
      )
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        throw new Error(error.message)
    }

    return data as VendaItemDetalhado[]
}

export async function cadastrarVenda(venda: NovaVenda) {
    const { data, error } = await supabase
        .from('vendas')
        .insert(venda)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Venda
}

export async function cadastrarItemVenda(item: NovoVendaItem) {
    const { data, error } = await supabase
        .from('vendas_itens')
        .insert(item)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as VendaItem
}

export async function baixarEstoqueVendaFIFO(vendaId: string) {
    const { data, error } = await supabase.rpc('baixar_estoque_venda_fifo', {
        p_venda_id: vendaId,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}