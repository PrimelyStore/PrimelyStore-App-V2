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
    wrapper_service?: string
    wrapper_note?: string
    wrapper_lote_seguro?: {
        limit?: number
        maxPages?: number
        offset?: number
        itemDelayMs?: number
        processar?: boolean
        dryRun?: boolean
    }
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

export type ProgressoSincronizacaoNotasEntradaOlist = {
    offsetAtual: number
    proximoOffset: number
    totalReportado: number | null
    chamadasRealizadas: number
    notasLidas: number
    notasInseridas: number
    notasAtualizadas: number
    itensInseridos: number
    itensAtualizados: number
    errosNotas: number
    errosItens: number
    ultimaNotaNumero: string | null
    concluido: boolean
    limiteAtingido: boolean
}

export type ResumoSincronizacaoNotasEntradaOlist = {
    ok: true
    totalReportado: number | null
    offsetInicial: number
    proximoOffset: number
    chamadasRealizadas: number
    notasLidas: number
    notasInseridas: number
    notasAtualizadas: number
    itensInseridos: number
    itensAtualizados: number
    errosNotas: number
    errosItens: number
    ultimaNotaNumero: string | null
    concluido: boolean
    limiteAtingido: boolean
    resultados: ResultadoSincronizacaoNotasEntradaOlist[]
}

type BuscarTodasNotasEntradaOlistComprasOptions = {
    offsetInicial?: number
    maxNotas?: number
    itemDelayMs?: number
    intervaloEntreChamadasMs?: number
    onProgresso?: (
        progresso: ProgressoSincronizacaoNotasEntradaOlist,
        resultado: ResultadoSincronizacaoNotasEntradaOlist
    ) => void
}

const CHAVE_OFFSET_NFS_COMPRAS_OLIST = 'primely:compras:olist:nfs:proximo-offset'

function lerOffsetNotasEntradaOlistCompras() {
    try {
        const valorSalvo = window.localStorage.getItem(CHAVE_OFFSET_NFS_COMPRAS_OLIST)
        const numero = Number(valorSalvo)

        if (!Number.isFinite(numero) || numero < 0) {
            return 0
        }

        return Math.trunc(numero)
    } catch {
        return 0
    }
}

function salvarOffsetNotasEntradaOlistCompras(offset: number) {
    try {
        window.localStorage.setItem(
            CHAVE_OFFSET_NFS_COMPRAS_OLIST,
            String(Math.max(0, Math.trunc(offset)))
        )
    } catch {
        // Se o navegador bloquear localStorage, a busca continua funcionando.
    }
}

function calcularProximoOffsetNotasEntradaOlistCompras(
    resultado: ResultadoSincronizacaoNotasEntradaOlist,
    offsetAtual: number
) {
    const proximoOffset = resultado.result?.next_offset_if_continues
    const totalReportado = resultado.result?.total_reported_by_api
    const notasRecebidas = resultado.result?.received_count ?? 0

    if (typeof proximoOffset === 'number' && proximoOffset >= 0) {
        if (typeof totalReportado === 'number' && proximoOffset >= totalReportado) {
            return 0
        }

        return proximoOffset
    }

    if (notasRecebidas <= 0) {
        return 0
    }

    return offsetAtual + 1
}

function aguardar(ms: number) {
    return new Promise((resolve) => {
        window.setTimeout(() => resolve(undefined), ms)
    })
}

async function buscarNotaEntradaOlistComprasPorOffset(
    offsetAtual: number,
    itemDelayMs = 2000
) {
    const { data, error } =
        await supabase.functions.invoke<ResultadoSincronizacaoNotasEntradaOlist>(
            'compras-olist-notas-entrada-sync',
            {
                body: {
                    // Lote pequeno para evitar WORKER_RESOURCE_LIMIT no Supabase
                    // e reduzir risco de bloqueio 429 na Olist.
                    limit: 1,
                    maxPages: 1,
                    offset: offsetAtual,
                    itemDelayMs,
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

export async function buscarNotasEntradaOlistCompras() {
    const offsetAtual = lerOffsetNotasEntradaOlistCompras()
    const data = await buscarNotaEntradaOlistComprasPorOffset(offsetAtual)

    salvarOffsetNotasEntradaOlistCompras(
        calcularProximoOffsetNotasEntradaOlistCompras(data, offsetAtual)
    )

    return data
}

export function resetarOffsetNotasEntradaOlistCompras() {
    salvarOffsetNotasEntradaOlistCompras(0)
}

export async function buscarTodasNotasEntradaOlistCompras(
    options: BuscarTodasNotasEntradaOlistComprasOptions = {}
): Promise<ResumoSincronizacaoNotasEntradaOlist> {
    const offsetInicial = Math.max(0, Math.trunc(options.offsetInicial ?? 0))
    const maxNotas = Math.min(
        Math.max(1, Math.trunc(options.maxNotas ?? 30)),
        50
    )
    const itemDelayMs = Math.min(
        Math.max(1000, Math.trunc(options.itemDelayMs ?? 2000)),
        2500
    )
    const intervaloEntreChamadasMs = Math.min(
        Math.max(500, Math.trunc(options.intervaloEntreChamadasMs ?? 1200)),
        5000
    )

    let offsetAtual = offsetInicial
    let totalReportado: number | null = null
    let proximoOffset = offsetInicial
    let ultimaNotaNumero: string | null = null
    let concluido = false

    const resultados: ResultadoSincronizacaoNotasEntradaOlist[] = []
    const acumulado = {
        chamadasRealizadas: 0,
        notasLidas: 0,
        notasInseridas: 0,
        notasAtualizadas: 0,
        itensInseridos: 0,
        itensAtualizados: 0,
        errosNotas: 0,
        errosItens: 0,
    }

    for (let indice = 0; indice < maxNotas; indice += 1) {
        const resultado = await buscarNotaEntradaOlistComprasPorOffset(
            offsetAtual,
            itemDelayMs
        )

        resultados.push(resultado)
        acumulado.chamadasRealizadas += 1

        const resumo = resultado.result
        const notasLidas = resumo?.received_count ?? 0
        const totalDaApi = resumo?.total_reported_by_api

        if (typeof totalDaApi === 'number') {
            totalReportado = totalDaApi
        }

        ultimaNotaNumero = resumo?.preview?.[0]?.numero ?? ultimaNotaNumero
        acumulado.notasLidas += notasLidas
        acumulado.notasInseridas += resumo?.inserted_notas_count ?? 0
        acumulado.notasAtualizadas += resumo?.updated_notas_count ?? 0
        acumulado.itensInseridos += resumo?.inserted_items_count ?? 0
        acumulado.itensAtualizados += resumo?.updated_items_count ?? 0
        acumulado.errosNotas += resumo?.notas_errors_count ?? 0
        acumulado.errosItens += resumo?.items_errors_count ?? 0

        if (typeof resumo?.next_offset_if_continues === 'number') {
            proximoOffset = resumo.next_offset_if_continues
        } else if (notasLidas <= 0) {
            proximoOffset = offsetAtual
        } else {
            proximoOffset = offsetAtual + 1
        }

        if (notasLidas <= 0) {
            concluido = true
        }

        if (typeof totalReportado === 'number' && proximoOffset >= totalReportado) {
            concluido = true
        }

        const limiteAtingidoParcial = !concluido && indice === maxNotas - 1

        options.onProgresso?.(
            {
                offsetAtual,
                proximoOffset,
                totalReportado,
                chamadasRealizadas: acumulado.chamadasRealizadas,
                notasLidas: acumulado.notasLidas,
                notasInseridas: acumulado.notasInseridas,
                notasAtualizadas: acumulado.notasAtualizadas,
                itensInseridos: acumulado.itensInseridos,
                itensAtualizados: acumulado.itensAtualizados,
                errosNotas: acumulado.errosNotas,
                errosItens: acumulado.errosItens,
                ultimaNotaNumero,
                concluido,
                limiteAtingido: limiteAtingidoParcial,
            },
            resultado
        )

        if (concluido) {
            break
        }

        offsetAtual = proximoOffset

        if (indice < maxNotas - 1) {
            await aguardar(intervaloEntreChamadasMs)
        }
    }

    const limiteAtingido = !concluido

    salvarOffsetNotasEntradaOlistCompras(limiteAtingido ? proximoOffset : 0)

    return {
        ok: true,
        totalReportado,
        offsetInicial,
        proximoOffset,
        chamadasRealizadas: acumulado.chamadasRealizadas,
        notasLidas: acumulado.notasLidas,
        notasInseridas: acumulado.notasInseridas,
        notasAtualizadas: acumulado.notasAtualizadas,
        itensInseridos: acumulado.itensInseridos,
        itensAtualizados: acumulado.itensAtualizados,
        errosNotas: acumulado.errosNotas,
        errosItens: acumulado.errosItens,
        ultimaNotaNumero,
        concluido,
        limiteAtingido,
        resultados,
    }
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
