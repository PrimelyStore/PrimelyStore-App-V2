import { supabase } from '../lib/supabase'

type NumeroBanco = number | string | null

export type OlistResumoProdutos = {
    total: number
    ativos: number
    semSku: number
    ultimaSincronizacao: string | null
}

export type OlistDepositoSnapshot = {
    id_deposito_olist: number
    descricao: string | null
    tipo: string | null
    desconsidera_saldo: boolean | null
    padrao: boolean | null
    possui_reserva: boolean | null
    sincronizado_em: string | null
}

export type OlistEstoqueDepositoResumo = {
    deposito_nome: string
    total_produtos: number
    saldo_total: number
    reservado_total: number
    disponivel_total: number
    ultima_sincronizacao: string | null
}

export type OlistEstoqueDepositoDetalhado = {
    id_produto_olist: NumeroBanco
    sku: string | null
    produto_nome: string | null
    unidade: string | null
    deposito_nome: string | null
    saldo_deposito: NumeroBanco
    reservado_deposito: NumeroBanco
    disponivel_deposito: NumeroBanco
    localizacao: string | null
    sincronizado_em: string | null
}

export type OlistResumoPedidos = {
    totalPedidos: number
    pendentes: number
    processados: number
    comErro: number
    ignorados: number
    totalItens: number
    itensComProdutoVinculado: number
    itensSemProdutoVinculado: number
    valorTotalPedidos: number
    ultimaSincronizacao: string | null
}

export type OlistPedidoGerencial = {
    id_pedido_olist: NumeroBanco
    numero_pedido: string | null
    numero_pedido_ecommerce: string | null
    canal_gerencial: string | null
    canal_venda_olist?: string | null
    ecommerce_nome: string | null
    data_pedido: string | null
    deposito_nome: string | null
    local_estoque_conceitual: string | null
    status_processamento_pedido: string | null
    status_gerencial: string | null
    sku_olist: string | null
    descricao_olist: string | null
    quantidade: NumeroBanco
    valor_total_item: NumeroBanco
    produto_vinculado: boolean | null
    pedido_sincronizado_em: string | null
}

export type OlistResumoNotasEntrada = {
    total: number
    pendentes: number
    processadas: number
    comErro: number
    ignoradas: number
    valorTotal: number
    ultimaSincronizacao: string | null
}

export type OlistNotaEntradaGerencial = {
    nota_snapshot_id: string
    id_nota_olist: NumeroBanco
    numero_nf: string | null
    serie: string | null
    chave_acesso: string | null
    data_emissao: string | null
    data_prevista: string | null
    data_inclusao: string | null
    fornecedor_nome: string | null
    fornecedor_cpf_cnpj: string | null
    valor_total_nf: NumeroBanco
    valor_produtos_nf: NumeroBanco
    valor_frete_nf: NumeroBanco
    valor_ipi_nf: NumeroBanco
    valor_icms_st_nf: NumeroBanco
    status_processamento: string | null
    mensagem_erro: string | null
    compra_id: string | null
    compra_vinculada: boolean | null
    total_itens_nf: NumeroBanco
    total_itens_com_produto: NumeroBanco
    total_itens_sem_produto: NumeroBanco
    total_itens_com_erro: NumeroBanco
    sincronizado_em: string | null
    updated_at: string | null
}

export type OlistSyncLogResumo = {
    origem: 'pedidos' | 'notas_entrada'
    status: string | null
    data_inicio: string | null
    data_fim: string | null
    lidos: number
    inseridos: number
    atualizados: number
    erros: number
    mensagem: string | null
}

export type PainelIntegracoesOlist = {
    produtos: OlistResumoProdutos
    depositos: OlistDepositoSnapshot[]
    estoquePorDeposito: OlistEstoqueDepositoResumo[]
    estoqueDetalhado: OlistEstoqueDepositoDetalhado[]
    pedidos: OlistResumoPedidos
    pedidosRecentes: OlistPedidoGerencial[]
    notasEntrada: OlistResumoNotasEntrada
    notasEntradaRecentes: OlistNotaEntradaGerencial[]
    logsRecentes: OlistSyncLogResumo[]
}

type ProdutoSnapshotRow = {
    id_produto_olist: number
    sku: string | null
    situacao: string | null
    sincronizado_em: string | null
}

type EstoqueDepositoSnapshotRow = {
    id_produto_olist: number
    deposito_nome: string | null
    saldo_deposito: NumeroBanco
    reservado_deposito: NumeroBanco
    disponivel_deposito: NumeroBanco
    sincronizado_em: string | null
}

type PedidoResumoRow = {
    status_processamento: string | null
    total_pedidos: NumeroBanco
    pedidos_pendentes: NumeroBanco
    pedidos_processados: NumeroBanco
    pedidos_com_erro: NumeroBanco
    pedidos_ignorados: NumeroBanco
    total_itens: NumeroBanco
    itens_com_produto_vinculado: NumeroBanco
    itens_sem_produto_vinculado: NumeroBanco
    valor_total_pedidos: NumeroBanco
    ultima_sincronizacao: string | null
}

type NotaEntradaResumoGerencialRow = {
    total_notas: NumeroBanco
    notas_pendentes: NumeroBanco
    notas_processadas: NumeroBanco
    notas_com_erro: NumeroBanco
    notas_ignoradas: NumeroBanco
    valor_total: NumeroBanco
    ultima_sincronizacao: string | null
}

type OlistSyncLogGerencialRow = {
    origem: 'pedidos' | 'notas_entrada'
    status: string | null
    data_inicio: string | null
    data_fim: string | null
    lidos: number | string | null
    inseridos: number | string | null
    atualizados: number | string | null
    erros: number | string | null
    mensagem: string | null
}

function numeroSeguro(valor: NumeroBanco | undefined) {
    const numero = Number(valor ?? 0)

    if (!Number.isFinite(numero)) {
        return 0
    }

    return numero
}

function obterDataMaisRecente(datas: Array<string | null | undefined>) {
    const timestamps = datas
        .filter((data): data is string => Boolean(data))
        .map((data) => new Date(data).getTime())
        .filter((timestamp) => Number.isFinite(timestamp))

    if (timestamps.length === 0) {
        return null
    }

    return new Date(Math.max(...timestamps)).toISOString()
}

async function buscarResumoProdutosOlist(): Promise<OlistResumoProdutos> {
    const { data, error } = await supabase
        .from('olist_produtos_snapshot')
        .select('id_produto_olist, sku, situacao, sincronizado_em')
        .order('descricao', { ascending: true })
        .limit(5000)

    if (error) {
        throw new Error(error.message)
    }

    const produtos = (data ?? []) as ProdutoSnapshotRow[]

    return {
        total: produtos.length,
        ativos: produtos.filter((produto) => produto.situacao === 'A').length,
        semSku: produtos.filter((produto) => !produto.sku).length,
        ultimaSincronizacao: obterDataMaisRecente(
            produtos.map((produto) => produto.sincronizado_em)
        ),
    }
}

async function buscarDepositosOlist() {
    const { data, error } = await supabase
        .from('olist_depositos_snapshot')
        .select(
            'id_deposito_olist, descricao, tipo, desconsidera_saldo, padrao, possui_reserva, sincronizado_em'
        )
        .order('descricao', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []) as OlistDepositoSnapshot[]
}

async function buscarEstoquePorDepositoOlist() {
    const { data, error } = await supabase
        .from('olist_estoque_depositos_snapshot')
        .select(
            'id_produto_olist, deposito_nome, saldo_deposito, reservado_deposito, disponivel_deposito, sincronizado_em'
        )
        .order('deposito_nome', { ascending: true })
        .limit(10000)

    if (error) {
        throw new Error(error.message)
    }

    const rows = (data ?? []) as EstoqueDepositoSnapshotRow[]
    const mapa = new Map<string, OlistEstoqueDepositoResumo>()

    for (const row of rows) {
        const depositoNome = row.deposito_nome ?? 'Não informado'
        const atual = mapa.get(depositoNome) ?? {
            deposito_nome: depositoNome,
            total_produtos: 0,
            saldo_total: 0,
            reservado_total: 0,
            disponivel_total: 0,
            ultima_sincronizacao: null,
        }

        atual.total_produtos += 1
        atual.saldo_total += numeroSeguro(row.saldo_deposito)
        atual.reservado_total += numeroSeguro(row.reservado_deposito)
        atual.disponivel_total += numeroSeguro(row.disponivel_deposito)
        atual.ultima_sincronizacao = obterDataMaisRecente([
            atual.ultima_sincronizacao,
            row.sincronizado_em,
        ])

        mapa.set(depositoNome, atual)
    }

    return Array.from(mapa.values()).sort((a, b) =>
        a.deposito_nome.localeCompare(b.deposito_nome)
    )
}

async function buscarEstoqueDetalhadoOlist() {
    const { data, error } = await supabase
        .from('olist_estoque_depositos_snapshot')
        .select(
            'id_produto_olist, sku, produto_nome, unidade, deposito_nome, saldo_deposito, reservado_deposito, disponivel_deposito, localizacao, sincronizado_em'
        )
        .order('sku', { ascending: true, nullsFirst: false })
        .order('deposito_nome', { ascending: true, nullsFirst: false })
        .limit(10000)

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []) as OlistEstoqueDepositoDetalhado[]
}

async function buscarResumoPedidosOlist(): Promise<OlistResumoPedidos> {
    const { data, error } = await supabase
        .from('olist_pedidos_resumo_gerencial_view')
        .select(
            'status_processamento, total_pedidos, pedidos_pendentes, pedidos_processados, pedidos_com_erro, pedidos_ignorados, total_itens, itens_com_produto_vinculado, itens_sem_produto_vinculado, valor_total_pedidos, ultima_sincronizacao'
        )
        .limit(5000)

    if (error) {
        throw new Error(error.message)
    }

    const rows = (data ?? []) as PedidoResumoRow[]

    return rows.reduce<OlistResumoPedidos>(
        (resumo, row) => {
            resumo.totalPedidos += numeroSeguro(row.total_pedidos)
            resumo.pendentes += numeroSeguro(row.pedidos_pendentes)
            resumo.processados += numeroSeguro(row.pedidos_processados)
            resumo.comErro += numeroSeguro(row.pedidos_com_erro)
            resumo.ignorados += numeroSeguro(row.pedidos_ignorados)
            resumo.totalItens += numeroSeguro(row.total_itens)
            resumo.itensComProdutoVinculado += numeroSeguro(
                row.itens_com_produto_vinculado
            )
            resumo.itensSemProdutoVinculado += numeroSeguro(
                row.itens_sem_produto_vinculado
            )
            resumo.valorTotalPedidos += numeroSeguro(row.valor_total_pedidos)
            resumo.ultimaSincronizacao = obterDataMaisRecente([
                resumo.ultimaSincronizacao,
                row.ultima_sincronizacao,
            ])

            return resumo
        },
        {
            totalPedidos: 0,
            pendentes: 0,
            processados: 0,
            comErro: 0,
            ignorados: 0,
            totalItens: 0,
            itensComProdutoVinculado: 0,
            itensSemProdutoVinculado: 0,
            valorTotalPedidos: 0,
            ultimaSincronizacao: null,
        }
    )
}

type OlistPedidoGerencialViewRow = Omit<OlistPedidoGerencial, 'canal_gerencial'> & {
    canal_venda_olist: string | null
}

async function buscarPedidosRecentesOlist() {
    const { data, error } = await supabase
        .from('olist_pedidos_gerencial_view')
        .select(
            'id_pedido_olist, numero_pedido, numero_pedido_ecommerce, ecommerce_nome, canal_venda_olist, data_pedido, deposito_nome, local_estoque_conceitual, status_processamento_pedido, status_gerencial, sku_olist, descricao_olist, quantidade, valor_total_item, produto_vinculado, pedido_sincronizado_em'
        )
        .order('pedido_sincronizado_em', {
            ascending: false,
            nullsFirst: false,
        })
        .limit(200)

    if (error) {
        throw new Error(error.message)
    }

    return ((data ?? []) as OlistPedidoGerencialViewRow[]).map(
        (pedido): OlistPedidoGerencial => ({
            ...pedido,
            canal_gerencial:
                pedido.ecommerce_nome ?? pedido.canal_venda_olist ?? 'Não informado',
        })
    )
}

async function buscarResumoNotasEntradaOlist(): Promise<OlistResumoNotasEntrada> {
    const { data, error } = await supabase
        .from('olist_notas_entrada_resumo_gerencial_view')
        .select(
            'total_notas, notas_pendentes, notas_processadas, notas_com_erro, notas_ignoradas, valor_total, ultima_sincronizacao'
        )
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    const resumo = data as NotaEntradaResumoGerencialRow | null

    return {
        total: numeroSeguro(resumo?.total_notas),
        pendentes: numeroSeguro(resumo?.notas_pendentes),
        processadas: numeroSeguro(resumo?.notas_processadas),
        comErro: numeroSeguro(resumo?.notas_com_erro),
        ignoradas: numeroSeguro(resumo?.notas_ignoradas),
        valorTotal: numeroSeguro(resumo?.valor_total),
        ultimaSincronizacao: resumo?.ultima_sincronizacao ?? null,
    }
}

async function buscarNotasEntradaRecentesOlist() {
    const { data, error } = await supabase
        .from('olist_notas_entrada_recentes_gerencial_view')
        .select(
            'nota_snapshot_id, id_nota_olist, numero_nf, serie, chave_acesso, data_emissao, data_prevista, data_inclusao, fornecedor_nome, fornecedor_cpf_cnpj, valor_total_nf, valor_produtos_nf, valor_frete_nf, valor_ipi_nf, valor_icms_st_nf, status_processamento, mensagem_erro, compra_id, compra_vinculada, total_itens_nf, total_itens_com_produto, total_itens_sem_produto, total_itens_com_erro, sincronizado_em, updated_at'
        )
        .order('sincronizado_em', { ascending: false, nullsFirst: false })
        .limit(100)

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []) as OlistNotaEntradaGerencial[]
}

async function buscarLogsRecentesOlist() {
    const { data, error } = await supabase
        .from('olist_sync_logs_gerencial_view')
        .select(
            'origem, status, data_inicio, data_fim, lidos, inseridos, atualizados, erros, mensagem'
        )
        .order('data_inicio', { ascending: false, nullsFirst: false })
        .limit(10)

    if (error) {
        throw new Error(error.message)
    }

    return ((data ?? []) as OlistSyncLogGerencialRow[]).map(
        (log): OlistSyncLogResumo => ({
            origem: log.origem,
            status: log.status,
            data_inicio: log.data_inicio,
            data_fim: log.data_fim,
            lidos: numeroSeguro(log.lidos),
            inseridos: numeroSeguro(log.inseridos),
            atualizados: numeroSeguro(log.atualizados),
            erros: numeroSeguro(log.erros),
            mensagem: log.mensagem,
        })
    )
}


export type OlistTipoSincronizacao =
    | 'produtos'
    | 'depositos'
    | 'estoque'
    | 'pedidos'
    | 'notas_entrada'

export type OlistSincronizacaoManualResultado = {
    tipo: OlistTipoSincronizacao
    rotulo: string
    ok: boolean
    service: string | null
    message: string | null
    status: string | null
    synchronizedAt: string | null
    resumo: string
    raw: Record<string, unknown>
}

type OlistSyncManualConfig = {
    tipo: OlistTipoSincronizacao
    rotulo: string
    functionName: string
    params?: Record<string, string | number | boolean>
}

type EdgeFunctionResponse = Record<string, unknown> & {
    ok?: boolean
    service?: string
    message?: string
    status?: string
    result?: Record<string, unknown>
}

const configsSincronizacaoManual: Record<
    OlistTipoSincronizacao,
    OlistSyncManualConfig
> = {
    produtos: {
        tipo: 'produtos',
        rotulo: 'Produtos',
        functionName: 'olist-produtos-sync',
        params: {
            limit: 100,
            offset: 0,
            maxPages: 1,
            situacao: 'A',
        },
    },
    depositos: {
        tipo: 'depositos',
        rotulo: 'Depósitos',
        functionName: 'olist-depositos-sync',
    },
    estoque: {
        tipo: 'estoque',
        rotulo: 'Estoque por depósito',
        functionName: 'olist-estoque-depositos-sync',
        params: {
            limit: 10,
            offset: 0,
            situacao: 'A',
        },
    },
    pedidos: {
        tipo: 'pedidos',
        rotulo: 'Pedidos',
        functionName: 'olist-pedidos-sync',
        params: {
            limit: 5,
            offset: 0,
            maxPages: 1,
            detalhar: true,
            processar: false,
            baixar_fifo: false,
            baixarFifo: false,
            processarLimit: 1,
        },
    },
    notas_entrada: {
        tipo: 'notas_entrada',
        rotulo: 'Notas de entrada',
        functionName: 'olist-notas-entrada-sync',
        params: {
            limit: 3,
            offset: 0,
            maxPages: 1,
            detalhar: true,
            detalharItens: true,
        },
    },
}

function montarFunctionNameComQuery(config: OlistSyncManualConfig) {
    const params = new URLSearchParams()

    for (const [chave, valor] of Object.entries(config.params ?? {})) {
        params.set(chave, String(valor))
    }

    const query = params.toString()

    return query ? `${config.functionName}?${query}` : config.functionName
}

function obterNumeroDeObjeto(
    objeto: Record<string, unknown> | undefined,
    chaves: string[]
) {
    if (!objeto) {
        return null
    }

    for (const chave of chaves) {
        const valor = objeto[chave]
        const numero = Number(valor)

        if (Number.isFinite(numero)) {
            return numero
        }
    }

    return null
}

function criarResumoSincronizacao(data: EdgeFunctionResponse) {
    const result =
        data.result && typeof data.result === 'object'
            ? (data.result as Record<string, unknown>)
            : data

    const partes: string[] = []

    const totalApi = obterNumeroDeObjeto(result, [
        'total_reported_by_api',
        'total_reported',
        'total',
    ])
    const recebidos = obterNumeroDeObjeto(result, ['received_count', 'received'])
    const salvos = obterNumeroDeObjeto(result, [
        'saved_count',
        'saved_orders_count',
        'rows_salvas',
        'saved_items_count',
    ])
    const inseridos = obterNumeroDeObjeto(result, [
        'inserted_count',
        'inserted',
        'pedidos_inseridos',
        'notas_inseridas',
    ])
    const atualizados = obterNumeroDeObjeto(result, [
        'updated_count',
        'updated',
        'pedidos_atualizados',
        'notas_atualizadas',
    ])
    const erros = obterNumeroDeObjeto(result, [
        'errors_count',
        'produtos_com_erro',
        'pedidos_com_erro',
        'notas_com_erro',
        'detail_errors_count',
    ])

    if (totalApi !== null) partes.push(`Total API: ${totalApi}`)
    if (recebidos !== null) partes.push(`Lidos: ${recebidos}`)
    if (salvos !== null) partes.push(`Salvos: ${salvos}`)
    if (inseridos !== null) partes.push(`Inseridos: ${inseridos}`)
    if (atualizados !== null) partes.push(`Atualizados: ${atualizados}`)
    if (erros !== null) partes.push(`Erros: ${erros}`)

    return partes.length > 0
        ? partes.join(' • ')
        : 'Sincronização concluída. Recarregue o painel para conferir os snapshots.'
}

export async function sincronizarSnapshotOlist(
    tipo: OlistTipoSincronizacao
): Promise<OlistSincronizacaoManualResultado> {
    const config = configsSincronizacaoManual[tipo]
    const functionName = montarFunctionNameComQuery(config)

    const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse>(
        functionName,
        {
            method: 'POST',
            body: {},
        }
    )

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('A sincronização Olist não retornou dados.')
    }

    if (data.ok === false) {
        throw new Error(data.message || `Erro ao sincronizar ${config.rotulo}.`)
    }

    const result =
        data.result && typeof data.result === 'object'
            ? (data.result as Record<string, unknown>)
            : null

    const synchronizedAt =
        typeof result?.synchronized_at === 'string'
            ? result.synchronized_at
            : new Date().toISOString()

    return {
        tipo,
        rotulo: config.rotulo,
        ok: true,
        service: data.service ?? null,
        message: data.message ?? null,
        status: data.status ?? null,
        synchronizedAt,
        resumo: criarResumoSincronizacao(data),
        raw: data,
    }
}

export async function buscarPainelIntegracoesOlist(): Promise<PainelIntegracoesOlist> {
    const [
        produtos,
        depositos,
        estoquePorDeposito,
        estoqueDetalhado,
        pedidos,
        pedidosRecentes,
        notasEntrada,
        notasEntradaRecentes,
        logsRecentes,
    ] = await Promise.all([
        buscarResumoProdutosOlist(),
        buscarDepositosOlist(),
        buscarEstoquePorDepositoOlist(),
        buscarEstoqueDetalhadoOlist(),
        buscarResumoPedidosOlist(),
        buscarPedidosRecentesOlist(),
        buscarResumoNotasEntradaOlist(),
        buscarNotasEntradaRecentesOlist(),
        buscarLogsRecentesOlist(),
    ])

    return {
        produtos,
        depositos,
        estoquePorDeposito,
        estoqueDetalhado,
        pedidos,
        pedidosRecentes,
        notasEntrada,
        notasEntradaRecentes,
        logsRecentes,
    }
}

export type OlistSaudeResultado = {
    ok: boolean
    message: string | null
    token_status: {
        provider: string | null
        status: string | null
        token_type: string | null
        expires_at: string | null
        refresh_expires_at: string | null
        expired: boolean
        refresh_token_present: boolean
    } | null
    api: {
        ok: boolean
        status: number | null
        account_preview: {
            razaoSocial: string | null
            fantasia: string | null
            cpfCnpj_masked: string | null
            email_masked: string | null
            regimeTributario: number | null
        } | null
    } | null
}

export async function buscarSaudeOlist(): Promise<OlistSaudeResultado> {
    const { data, error } = await supabase.functions.invoke('olist-health', {
        method: 'GET',
    })

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error('A verificação de saúde do Olist não retornou dados.')
    }

    // Filtro estrito de segurança: reconstrói o objeto sem NENHUM token (caso viesse por engano)
    const tokenStatus = data.token_status ? {
        provider: typeof data.token_status.provider === 'string' ? data.token_status.provider : null,
        status: typeof data.token_status.status === 'string' ? data.token_status.status : null,
        token_type: typeof data.token_status.token_type === 'string' ? data.token_status.token_type : null,
        expires_at: typeof data.token_status.expires_at === 'string' ? data.token_status.expires_at : null,
        refresh_expires_at: typeof data.token_status.refresh_expires_at === 'string' ? data.token_status.refresh_expires_at : null,
        expired: Boolean(data.token_status.expired),
        refresh_token_present: Boolean(data.token_status.refresh_token_present),
    } : null

    const apiResult = data.api ? {
        ok: Boolean(data.api.ok),
        status: typeof data.api.status === 'number' ? data.api.status : null,
        account_preview: data.api.account_preview ? {
            razaoSocial: typeof data.api.account_preview.razaoSocial === 'string' ? data.api.account_preview.razaoSocial : null,
            fantasia: typeof data.api.account_preview.fantasia === 'string' ? data.api.account_preview.fantasia : null,
            cpfCnpj_masked: typeof data.api.account_preview.cpfCnpj_masked === 'string' ? data.api.account_preview.cpfCnpj_masked : null,
            email_masked: typeof data.api.account_preview.email_masked === 'string' ? data.api.account_preview.email_masked : null,
            regimeTributario: typeof data.api.account_preview.regimeTributario === 'number' ? data.api.account_preview.regimeTributario : null,
        } : null
    } : null

    return {
        ok: Boolean(data.ok),
        message: typeof data.message === 'string' ? data.message : null,
        token_status: tokenStatus,
        api: apiResult
    }
}

