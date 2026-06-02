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
    ecommerce_nome: string | null
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
    pedidos: OlistResumoPedidos
    pedidosRecentes: OlistPedidoGerencial[]
    notasEntrada: OlistResumoNotasEntrada
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

type NotaEntradaSnapshotRow = {
    id: string
    status_processamento: string | null
    valor: NumeroBanco
    sincronizado_em: string | null
}

type PedidoSyncLogRow = {
    status: string | null
    data_inicio: string | null
    data_fim: string | null
    pedidos_lidos: number | null
    pedidos_inseridos: number | null
    pedidos_atualizados: number | null
    pedidos_com_erro: number | null
    mensagem: string | null
}

type NotaEntradaSyncLogRow = {
    status: string | null
    data_inicio: string | null
    data_fim: string | null
    notas_lidas: number | null
    notas_inseridas: number | null
    notas_atualizadas: number | null
    notas_com_erro: number | null
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

async function buscarPedidosRecentesOlist() {
    const { data, error } = await supabase
        .from('olist_pedidos_gerencial_view')
        .select(
            'id_pedido_olist, numero_pedido, numero_pedido_ecommerce, ecommerce_nome, deposito_nome, local_estoque_conceitual, status_processamento_pedido, status_gerencial, sku_olist, descricao_olist, quantidade, valor_total_item, produto_vinculado, pedido_sincronizado_em'
        )
        .order('pedido_sincronizado_em', {
            ascending: false,
            nullsFirst: false,
        })
        .limit(20)

    if (error) {
        throw new Error(error.message)
    }

    return (data ?? []) as OlistPedidoGerencial[]
}

async function buscarResumoNotasEntradaOlist(): Promise<OlistResumoNotasEntrada> {
    const { data, error } = await supabase
        .from('olist_notas_entrada_snapshot')
        .select('id, status_processamento, valor, sincronizado_em')
        .order('sincronizado_em', { ascending: false })
        .limit(5000)

    if (error) {
        throw new Error(error.message)
    }

    const notas = (data ?? []) as NotaEntradaSnapshotRow[]

    return notas.reduce<OlistResumoNotasEntrada>(
        (resumo, nota) => {
            resumo.total += 1
            resumo.valorTotal += numeroSeguro(nota.valor)
            resumo.ultimaSincronizacao = obterDataMaisRecente([
                resumo.ultimaSincronizacao,
                nota.sincronizado_em,
            ])

            if (nota.status_processamento === 'pendente') {
                resumo.pendentes += 1
            }

            if (nota.status_processamento === 'processado') {
                resumo.processadas += 1
            }

            if (nota.status_processamento === 'erro') {
                resumo.comErro += 1
            }

            if (nota.status_processamento === 'ignorado') {
                resumo.ignoradas += 1
            }

            return resumo
        },
        {
            total: 0,
            pendentes: 0,
            processadas: 0,
            comErro: 0,
            ignoradas: 0,
            valorTotal: 0,
            ultimaSincronizacao: null,
        }
    )
}

async function buscarLogsRecentesOlist() {
    const { data: logsPedidos, error: erroPedidos } = await supabase
        .from('olist_pedidos_sync_log')
        .select(
            'status, data_inicio, data_fim, pedidos_lidos, pedidos_inseridos, pedidos_atualizados, pedidos_com_erro, mensagem'
        )
        .order('data_inicio', { ascending: false })
        .limit(5)

    if (erroPedidos) {
        throw new Error(erroPedidos.message)
    }

    const { data: logsNotas, error: erroNotas } = await supabase
        .from('olist_notas_entrada_sync_log')
        .select(
            'status, data_inicio, data_fim, notas_lidas, notas_inseridas, notas_atualizadas, notas_com_erro, mensagem'
        )
        .order('data_inicio', { ascending: false })
        .limit(5)

    if (erroNotas) {
        throw new Error(erroNotas.message)
    }

    const pedidos = ((logsPedidos ?? []) as PedidoSyncLogRow[]).map(
        (log): OlistSyncLogResumo => ({
            origem: 'pedidos',
            status: log.status,
            data_inicio: log.data_inicio,
            data_fim: log.data_fim,
            lidos: Number(log.pedidos_lidos ?? 0),
            inseridos: Number(log.pedidos_inseridos ?? 0),
            atualizados: Number(log.pedidos_atualizados ?? 0),
            erros: Number(log.pedidos_com_erro ?? 0),
            mensagem: log.mensagem,
        })
    )

    const notas = ((logsNotas ?? []) as NotaEntradaSyncLogRow[]).map(
        (log): OlistSyncLogResumo => ({
            origem: 'notas_entrada',
            status: log.status,
            data_inicio: log.data_inicio,
            data_fim: log.data_fim,
            lidos: Number(log.notas_lidas ?? 0),
            inseridos: Number(log.notas_inseridas ?? 0),
            atualizados: Number(log.notas_atualizadas ?? 0),
            erros: Number(log.notas_com_erro ?? 0),
            mensagem: log.mensagem,
        })
    )

    return [...pedidos, ...notas]
        .sort((a, b) => {
            const dataA = new Date(a.data_inicio ?? 0).getTime()
            const dataB = new Date(b.data_inicio ?? 0).getTime()

            return dataB - dataA
        })
        .slice(0, 10)
}

export async function buscarPainelIntegracoesOlist(): Promise<PainelIntegracoesOlist> {
    const [
        produtos,
        depositos,
        estoquePorDeposito,
        pedidos,
        pedidosRecentes,
        notasEntrada,
        logsRecentes,
    ] = await Promise.all([
        buscarResumoProdutosOlist(),
        buscarDepositosOlist(),
        buscarEstoquePorDepositoOlist(),
        buscarResumoPedidosOlist(),
        buscarPedidosRecentesOlist(),
        buscarResumoNotasEntradaOlist(),
        buscarLogsRecentesOlist(),
    ])

    return {
        produtos,
        depositos,
        estoquePorDeposito,
        pedidos,
        pedidosRecentes,
        notasEntrada,
        logsRecentes,
    }
}
