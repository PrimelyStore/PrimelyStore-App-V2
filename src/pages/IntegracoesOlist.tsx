import { useEffect, useMemo, useState } from 'react'
import {
    AppButton,
    AppCard,
    DataTableContainer,
    PageHeader,
    StatCard,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'
import {
    buscarPainelIntegracoesOlist,
    sincronizarSnapshotOlist,
    type OlistSincronizacaoManualResultado,
    type OlistTipoSincronizacao,
    type PainelIntegracoesOlist,
} from '../services/olistIntegracoesService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type StatusBadgeTone =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'muted'

type OpcaoSincronizacaoOlist = {
    tipo: OlistTipoSincronizacao
    titulo: string
    descricao: string
    aviso: string
}

const opcoesSincronizacaoOlist: OpcaoSincronizacaoOlist[] = [
    {
        tipo: 'produtos',
        titulo: 'Produtos',
        descricao: 'Atualiza o snapshot de produtos ativos do Olist.',
        aviso: 'Sincronizar produtos do Olist? Esta ação apenas atualiza snapshots no Supabase.',
    },
    {
        tipo: 'depositos',
        titulo: 'Depósitos',
        descricao: 'Atualiza a lista de depósitos cadastrados no Olist.',
        aviso: 'Sincronizar depósitos do Olist? Esta ação apenas atualiza snapshots no Supabase.',
    },
    {
        tipo: 'estoque',
        titulo: 'Estoque',
        descricao: 'Atualiza um lote seguro do estoque por depósito para evitar limite da API.',
        aviso: 'Sincronizar estoque por depósito do Olist? Esta ação lê um lote seguro de produtos e não altera estoque operacional.',
    },
    {
        tipo: 'pedidos',
        titulo: 'Pedidos',
        descricao: 'Atualiza um lote pequeno de pedidos e itens em snapshots gerenciais.',
        aviso: 'Sincronizar pedidos do Olist? Esta ação usa processar=false e baixar_fifo=false. Não cria vendas oficiais e não baixa estoque.',
    },
    {
        tipo: 'notas_entrada',
        titulo: 'Notas de entrada',
        descricao: 'Atualiza um lote pequeno de notas de entrada para conferência gerencial.',
        aviso: 'Sincronizar notas de entrada do Olist? Esta ação apenas atualiza snapshots e não gera estoque, lote ou recebimento automático.',
    },
]


function formatarNumero(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0))
}

function formatarMoeda(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function formatarDataHora(data?: string | null) {
    if (!data) {
        return '-'
    }

    const dataConvertida = new Date(data)

    if (Number.isNaN(dataConvertida.getTime())) {
        return data
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(dataConvertida)
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

function normalizarTexto(valor?: string | number | null) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

function obterCanalPedido(pedido: PainelIntegracoesOlist['pedidosRecentes'][number]) {
    return pedido.canal_gerencial ?? pedido.ecommerce_nome ?? 'Não informado'
}

function obterDataReferenciaPedido(
    pedido: PainelIntegracoesOlist['pedidosRecentes'][number]
) {
    return pedido.data_pedido ?? pedido.pedido_sincronizado_em ?? null
}

function obterDataInput(data?: string | null) {
    if (!data) {
        return ''
    }

    const dataConvertida = new Date(data)

    if (Number.isNaN(dataConvertida.getTime())) {
        return ''
    }

    return dataConvertida.toISOString().slice(0, 10)
}


type StatusEstoqueOlist = 'ok' | 'baixo' | 'zerado' | 'com_reserva'

function obterNumeroSeguro(valor?: number | string | null) {
    const numero = Number(valor ?? 0)

    if (!Number.isFinite(numero)) {
        return 0
    }

    return numero
}

function obterStatusEstoqueOlist(item: PainelIntegracoesOlist['estoqueDetalhado'][number]) {
    const disponivel = obterNumeroSeguro(item.disponivel_deposito)
    const reservado = obterNumeroSeguro(item.reservado_deposito)

    if (disponivel <= 0) {
        return {
            valor: 'zerado' as StatusEstoqueOlist,
            label: 'Zerado',
            tone: 'danger' as StatusBadgeTone,
        }
    }

    if (reservado > 0) {
        return {
            valor: 'com_reserva' as StatusEstoqueOlist,
            label: 'Com reserva',
            tone: 'warning' as StatusBadgeTone,
        }
    }

    if (disponivel <= 5) {
        return {
            valor: 'baixo' as StatusEstoqueOlist,
            label: 'Baixo',
            tone: 'warning' as StatusBadgeTone,
        }
    }

    return {
        valor: 'ok' as StatusEstoqueOlist,
        label: 'OK',
        tone: 'success' as StatusBadgeTone,
    }
}

function ordenarTexto(a: string, b: string) {
    return a.localeCompare(b, 'pt-BR')
}

function formatarOrigemLog(origem: string) {
    const nomes: Record<string, string> = {
        pedidos: 'Pedidos',
        notas_entrada: 'Notas de entrada',
    }

    return nomes[origem] ?? origem
}

function obterTomStatus(status?: string | null): StatusBadgeTone {
    if (status === 'sucesso' || status === 'processado' || status === 'ativo') {
        return 'success'
    }

    if (status === 'parcial' || status === 'pendente' || status === 'pronto_para_analise') {
        return 'warning'
    }

    if (status === 'erro' || status === 'pedido_com_erro') {
        return 'danger'
    }

    if (status === 'ignorado') {
        return 'muted'
    }

    return 'default'
}

export function IntegracoesOlist() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState(
        'Carregando painel gerencial do Olist...'
    )
    const [painel, setPainel] = useState<PainelIntegracoesOlist | null>(null)
    const [sincronizandoTipo, setSincronizandoTipo] =
        useState<OlistTipoSincronizacao | null>(null)
    const [ultimoResultadoSincronizacao, setUltimoResultadoSincronizacao] =
        useState<OlistSincronizacaoManualResultado | null>(null)
    const [resultadosSincronizacaoPorTipo, setResultadosSincronizacaoPorTipo] =
        useState<Partial<Record<OlistTipoSincronizacao, OlistSincronizacaoManualResultado>>>(
            {}
        )

    const [filtroBusca, setFiltroBusca] = useState('')
    const [filtroCanal, setFiltroCanal] = useState('')
    const [filtroDeposito, setFiltroDeposito] = useState('')
    const [filtroStatusPedido, setFiltroStatusPedido] = useState('')
    const [filtroProdutoVinculado, setFiltroProdutoVinculado] = useState<
        'todos' | 'vinculados' | 'sem_vinculo'
    >('todos')
    const [filtroDataInicio, setFiltroDataInicio] = useState('')
    const [filtroDataFim, setFiltroDataFim] = useState('')

    const [filtroEstoqueBusca, setFiltroEstoqueBusca] = useState('')
    const [filtroEstoqueDeposito, setFiltroEstoqueDeposito] = useState('')
    const [filtroEstoqueStatus, setFiltroEstoqueStatus] = useState<
        'todos' | StatusEstoqueOlist
    >('todos')

    async function carregarPainel() {
        try {
            setStatus('carregando')
            setMensagem('Carregando painel gerencial do Olist...')

            const dados = await buscarPainelIntegracoesOlist()

            setPainel(dados)
            setStatus('sucesso')
            setMensagem('Dados gerenciais do Olist carregados com sucesso.')
        } catch (error) {
            setStatus('erro')
            setPainel(null)

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar dados do Olist.')
            }
        }
    }


    async function executarSincronizacaoManual(opcao: OpcaoSincronizacaoOlist) {
        const confirmarSincronizacao = window.confirm(
            `${opcao.aviso}

Regra de segurança: esta ação não processa pedidos como vendas oficiais, não executa baixa FIFO e não altera o estoque operacional do Olist.`
        )

        if (!confirmarSincronizacao) {
            return
        }

        try {
            setSincronizandoTipo(opcao.tipo)
            setUltimoResultadoSincronizacao(null)
            setStatus('carregando')
            setMensagem(`Sincronizando ${opcao.titulo.toLowerCase()} do Olist...`)

            const resultado = await sincronizarSnapshotOlist(opcao.tipo)
            const dadosAtualizados = await buscarPainelIntegracoesOlist()

            setPainel(dadosAtualizados)
            setUltimoResultadoSincronizacao(resultado)
            setResultadosSincronizacaoPorTipo((resultadosAtuais) => ({
                ...resultadosAtuais,
                [opcao.tipo]: resultado,
            }))
            setStatus('sucesso')
            setMensagem(
                `${resultado.rotulo} sincronizado com sucesso. ${resultado.resumo}`
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao sincronizar dados do Olist.')
            }
        } finally {
            setSincronizandoTipo(null)
        }
    }

    useEffect(() => {
        carregarPainel()
    }, [])

    const ultimaSincronizacaoPorTipo = useMemo<
        Partial<Record<OlistTipoSincronizacao, string | null>>
    >(() => {
        if (!painel) {
            return {}
        }

        const ultimaSincronizacaoPedidosPeloLog = obterDataMaisRecente(
            painel.logsRecentes
                .filter((log) => log.origem === 'pedidos')
                .flatMap((log) => [log.data_fim, log.data_inicio])
        )

        const ultimaSincronizacaoNotasPeloLog = obterDataMaisRecente(
            painel.logsRecentes
                .filter((log) => log.origem === 'notas_entrada')
                .flatMap((log) => [log.data_fim, log.data_inicio])
        )

        return {
            produtos: painel.produtos.ultimaSincronizacao,
            depositos: obterDataMaisRecente(
                painel.depositos.map((item) => item.sincronizado_em)
            ),
            estoque: obterDataMaisRecente(
                painel.estoquePorDeposito.map((item) => item.ultima_sincronizacao)
            ),
            pedidos: obterDataMaisRecente([
                painel.pedidos.ultimaSincronizacao,
                ultimaSincronizacaoPedidosPeloLog,
            ]),
            notas_entrada: obterDataMaisRecente([
                painel.notasEntrada.ultimaSincronizacao,
                ultimaSincronizacaoNotasPeloLog,
            ]),
        }
    }, [painel])

    const ultimaSincronizacaoGeral = useMemo(() => {
        if (!painel) {
            return null
        }

        return obterDataMaisRecente([
            painel.produtos.ultimaSincronizacao,
            painel.pedidos.ultimaSincronizacao,
            painel.notasEntrada.ultimaSincronizacao,
            ...painel.estoquePorDeposito.map((item) => item.ultima_sincronizacao),
            ...painel.depositos.map((item) => item.sincronizado_em),
        ])
    }, [painel])

    const opcoesCanaisPedidos = useMemo(() => {
        if (!painel) {
            return []
        }

        return Array.from(
            new Set(painel.pedidosRecentes.map((pedido) => obterCanalPedido(pedido)))
        ).sort(ordenarTexto)
    }, [painel])

    const opcoesDepositosPedidos = useMemo(() => {
        if (!painel) {
            return []
        }

        return Array.from(
            new Set(
                painel.pedidosRecentes.map(
                    (pedido) => pedido.deposito_nome ?? 'Não informado'
                )
            )
        ).sort(ordenarTexto)
    }, [painel])

    const opcoesStatusPedidos = useMemo(() => {
        if (!painel) {
            return []
        }

        return Array.from(
            new Set(
                painel.pedidosRecentes.map(
                    (pedido) => pedido.status_gerencial ?? 'Não informado'
                )
            )
        ).sort(ordenarTexto)
    }, [painel])

    const opcoesDepositosEstoque = useMemo(() => {
        if (!painel) {
            return []
        }

        return Array.from(
            new Set(
                painel.estoqueDetalhado.map(
                    (item) => item.deposito_nome ?? 'Não informado'
                )
            )
        ).sort(ordenarTexto)
    }, [painel])

    const estoqueFiltrado = useMemo(() => {
        if (!painel) {
            return []
        }

        const buscaNormalizada = normalizarTexto(filtroEstoqueBusca)

        return painel.estoqueDetalhado.filter((item) => {
            const deposito = item.deposito_nome ?? 'Não informado'
            const statusEstoque = obterStatusEstoqueOlist(item)

            if (filtroEstoqueDeposito && deposito !== filtroEstoqueDeposito) {
                return false
            }

            if (
                filtroEstoqueStatus !== 'todos' &&
                statusEstoque.valor !== filtroEstoqueStatus
            ) {
                return false
            }

            if (buscaNormalizada) {
                const conteudoBusca = normalizarTexto([
                    item.sku,
                    item.produto_nome,
                    item.unidade,
                    item.localizacao,
                    deposito,
                    statusEstoque.label,
                ].join(' '))

                if (!conteudoBusca.includes(buscaNormalizada)) {
                    return false
                }
            }

            return true
        })
    }, [filtroEstoqueBusca, filtroEstoqueDeposito, filtroEstoqueStatus, painel])

    const resumoEstoquePorSituacao = useMemo(() => {
        const base = painel?.estoqueDetalhado ?? []

        return base.reduce(
            (acc, item) => {
                const statusItem = obterStatusEstoqueOlist(item).valor
                acc[statusItem] += 1
                return acc
            },
            {
                ok: 0,
                baixo: 0,
                zerado: 0,
                com_reserva: 0,
            } as Record<StatusEstoqueOlist, number>
        )
    }, [painel])

    const existemFiltrosEstoque = Boolean(
        filtroEstoqueBusca || filtroEstoqueDeposito || filtroEstoqueStatus !== 'todos'
    )

    function limparFiltrosEstoque() {
        setFiltroEstoqueBusca('')
        setFiltroEstoqueDeposito('')
        setFiltroEstoqueStatus('todos')
    }

    const pedidosFiltrados = useMemo(() => {
        if (!painel) {
            return []
        }

        const buscaNormalizada = normalizarTexto(filtroBusca)

        return painel.pedidosRecentes.filter((pedido) => {
            const canal = obterCanalPedido(pedido)
            const deposito = pedido.deposito_nome ?? 'Não informado'
            const statusGerencial = pedido.status_gerencial ?? 'Não informado'
            const dataReferenciaInput = obterDataInput(obterDataReferenciaPedido(pedido))

            if (filtroCanal && canal !== filtroCanal) {
                return false
            }

            if (filtroDeposito && deposito !== filtroDeposito) {
                return false
            }

            if (filtroStatusPedido && statusGerencial !== filtroStatusPedido) {
                return false
            }

            if (
                filtroProdutoVinculado === 'vinculados' &&
                pedido.produto_vinculado !== true
            ) {
                return false
            }

            if (
                filtroProdutoVinculado === 'sem_vinculo' &&
                pedido.produto_vinculado === true
            ) {
                return false
            }

            if (filtroDataInicio && dataReferenciaInput < filtroDataInicio) {
                return false
            }

            if (filtroDataFim && dataReferenciaInput > filtroDataFim) {
                return false
            }

            if (buscaNormalizada) {
                const conteudoBusca = normalizarTexto([
                    pedido.numero_pedido,
                    pedido.numero_pedido_ecommerce,
                    pedido.sku_olist,
                    pedido.descricao_olist,
                    canal,
                    deposito,
                    statusGerencial,
                ].join(' '))

                if (!conteudoBusca.includes(buscaNormalizada)) {
                    return false
                }
            }

            return true
        })
    }, [
        filtroBusca,
        filtroCanal,
        filtroDataFim,
        filtroDataInicio,
        filtroDeposito,
        filtroProdutoVinculado,
        filtroStatusPedido,
        painel,
    ])

    const existemFiltrosPedidos = Boolean(
        filtroBusca ||
            filtroCanal ||
            filtroDeposito ||
            filtroStatusPedido ||
            filtroProdutoVinculado !== 'todos' ||
            filtroDataInicio ||
            filtroDataFim
    )

    function limparFiltrosPedidos() {
        setFiltroBusca('')
        setFiltroCanal('')
        setFiltroDeposito('')
        setFiltroStatusPedido('')
        setFiltroProdutoVinculado('todos')
        setFiltroDataInicio('')
        setFiltroDataFim('')
    }


    return (
        <div className="space-y-6">
            <PageHeader
                tag="INTEGRAÇÕES"
                title="Integrações Olist"
                description="Painel somente leitura para acompanhar snapshots vindos do Olist/Tiny. Esta tela é gerencial: não processa pedidos, não cria vendas oficiais e não executa baixa FIFO."
            />

            <AppCard className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-200">
                        Status do carregamento
                    </p>

                    <p className="mt-2 text-sm text-slate-400">{mensagem}</p>

                    <p className="mt-2 text-xs text-slate-500">
                        Última sincronização geral identificada:{' '}
                        <span className="text-slate-300">
                            {formatarDataHora(ultimaSincronizacaoGeral)}
                        </span>
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <StatusBadge
                        tone={
                            status === 'sucesso'
                                ? 'success'
                                : status === 'erro'
                                  ? 'danger'
                                  : 'warning'
                        }
                    >
                        {status === 'sucesso'
                            ? 'Carregado'
                            : status === 'erro'
                              ? 'Erro'
                              : 'Carregando'}
                    </StatusBadge>

                    <AppButton
                        variant="secondary"
                        onClick={carregarPainel}
                        disabled={status === 'carregando' || sincronizandoTipo !== null}
                    >
                        Recarregar dados
                    </AppButton>
                </div>
            </AppCard>

            <AppCard>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100">
                            Sincronizações manuais controladas
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Estes botões chamam somente Edge Functions de snapshot. Eles não
                            criam vendas oficiais, não processam pedidos e não executam baixa FIFO.
                        </p>

                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
                            <span className="font-semibold">Modo seguro:</span> as
                            sincronizações são manuais, bloqueiam duplo clique enquanto rodam,
                            exibem a última execução da sessão e também a última sincronização real gravada no banco.
                        </div>
                    </div>

                    {ultimoResultadoSincronizacao ? (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 lg:max-w-md">
                            <p className="font-semibold text-emerald-100">
                                Última sincronização: {ultimoResultadoSincronizacao.rotulo}
                            </p>
                            <p className="mt-1 text-emerald-200/80">
                                {ultimoResultadoSincronizacao.resumo}
                            </p>
                            <p className="mt-1 text-emerald-200/60">
                                {formatarDataHora(
                                    ultimoResultadoSincronizacao.synchronizedAt
                                )}
                            </p>
                        </div>
                    ) : null}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {opcoesSincronizacaoOlist.map((opcao) => {
                        const estaSincronizando = sincronizandoTipo === opcao.tipo
                        const existeSincronizacaoEmAndamento = sincronizandoTipo !== null
                        const ultimoResultadoOpcao =
                            resultadosSincronizacaoPorTipo[opcao.tipo]
                        const ultimaSincronizacaoBanco =
                            ultimaSincronizacaoPorTipo[opcao.tipo] ?? null

                        return (
                            <div
                                key={opcao.tipo}
                                className="flex min-h-48 flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-bold text-slate-100">
                                            {opcao.titulo}
                                        </p>

                                        <StatusBadge
                                            tone={estaSincronizando ? 'warning' : 'info'}
                                        >
                                            {estaSincronizando ? 'Em execução' : 'Snapshot'}
                                        </StatusBadge>
                                    </div>

                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                        {opcao.descricao}
                                    </p>

                                    <div className="mt-3 space-y-2 text-[11px] leading-relaxed">
                                        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-cyan-100">
                                            <p className="font-semibold">
                                                Última sincronização no banco
                                            </p>
                                            <p className="mt-1 text-cyan-100/80">
                                                {ultimaSincronizacaoBanco
                                                    ? formatarDataHora(ultimaSincronizacaoBanco)
                                                    : 'Sem registro identificado'}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-400">
                                            {ultimoResultadoOpcao ? (
                                                <>
                                                    <p className="font-semibold text-slate-200">
                                                        Última execução nesta sessão
                                                    </p>
                                                    <p className="mt-1 text-slate-400">
                                                        {formatarDataHora(
                                                            ultimoResultadoOpcao.synchronizedAt
                                                        )}
                                                    </p>
                                                    <p className="mt-1 line-clamp-2 text-emerald-200/80">
                                                        {ultimoResultadoOpcao.resumo}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-semibold text-slate-300">
                                                        Ainda não executado nesta sessão
                                                    </p>
                                                    <p className="mt-1">
                                                        Use somente quando precisar atualizar o snapshot.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <AppButton
                                    className="mt-4 w-full"
                                    size="sm"
                                    variant={estaSincronizando ? 'success' : 'secondary'}
                                    disabled={existeSincronizacaoEmAndamento}
                                    onClick={() => executarSincronizacaoManual(opcao)}
                                >
                                    {estaSincronizando
                                        ? 'Sincronizando...'
                                        : existeSincronizacaoEmAndamento
                                          ? 'Aguarde finalizar'
                                          : 'Sincronizar'}
                                </AppButton>
                            </div>
                        )
                    })}
                </div>
            </AppCard>

            {painel ? (
                <>
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Produtos Olist"
                            value={formatarNumero(painel.produtos.total)}
                            description={`Ativos: ${formatarNumero(
                                painel.produtos.ativos
                            )} • Sem SKU: ${formatarNumero(
                                painel.produtos.semSku
                            )}`}
                            tone="info"
                        />

                        <StatCard
                            label="Pedidos importados"
                            value={formatarNumero(painel.pedidos.totalPedidos)}
                            description={`Pendentes: ${formatarNumero(
                                painel.pedidos.pendentes
                            )} • Processados: ${formatarNumero(
                                painel.pedidos.processados
                            )}`}
                            tone="purple"
                        />

                        <StatCard
                            label="Faturamento Olist snapshot"
                            value={formatarMoeda(painel.pedidos.valorTotalPedidos)}
                            description="Soma dos pedidos já importados para snapshots gerenciais."
                            tone="success"
                        />

                        <StatCard
                            label="Notas de entrada"
                            value={formatarNumero(painel.notasEntrada.total)}
                            description={`Pendentes: ${formatarNumero(
                                painel.notasEntrada.pendentes
                            )} • Erros: ${formatarNumero(
                                painel.notasEntrada.comErro
                            )}`}
                            tone="warning"
                        />
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <AppCard>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100">
                                        Estoque Olist por depósito
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Saldos vindos do snapshot de estoque por depósito.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {painel.estoquePorDeposito.map((deposito) => (
                                    <div
                                        key={deposito.deposito_nome}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-200">
                                                    {deposito.deposito_nome}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatarNumero(deposito.total_produtos)} produto(s)
                                                </p>
                                            </div>

                                            <StatusBadge tone="info">Snapshot</StatusBadge>
                                        </div>

                                        <dl className="mt-4 grid gap-3 text-sm">
                                            <div className="flex justify-between gap-3">
                                                <dt className="text-slate-500">Saldo total</dt>
                                                <dd className="font-semibold text-slate-100">
                                                    {formatarNumero(deposito.saldo_total)}
                                                </dd>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <dt className="text-slate-500">Reservado</dt>
                                                <dd className="font-semibold text-yellow-300">
                                                    {formatarNumero(deposito.reservado_total)}
                                                </dd>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <dt className="text-slate-500">Disponível</dt>
                                                <dd className="font-semibold text-emerald-300">
                                                    {formatarNumero(deposito.disponivel_total)}
                                                </dd>
                                            </div>
                                        </dl>

                                        <p className="mt-4 text-xs text-slate-500">
                                            Atualizado em:{' '}
                                            {formatarDataHora(deposito.ultima_sincronizacao)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </AppCard>

                        <AppCard>
                            <h2 className="text-lg font-bold text-slate-100">
                                Depósitos cadastrados no Olist
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                No conceito atual, Geral representa o Prep Center e FBA representa o estoque relacionado à Amazon FBA no Olist.
                            </p>

                            <div className="mt-5 space-y-3">
                                {painel.depositos.map((deposito) => (
                                    <div
                                        key={deposito.id_deposito_olist}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-100">
                                                    {deposito.descricao ?? 'Depósito sem nome'}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    ID Olist: {deposito.id_deposito_olist} • Tipo: {deposito.tipo ?? '-'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {deposito.padrao ? (
                                                    <StatusBadge tone="success">Padrão</StatusBadge>
                                                ) : null}

                                                {deposito.possui_reserva ? (
                                                    <StatusBadge tone="purple">Reserva</StatusBadge>
                                                ) : null}
                                            </div>
                                        </div>

                                        <p className="mt-3 text-xs text-slate-500">
                                            Sincronizado em: {formatarDataHora(deposito.sincronizado_em)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </AppCard>
                    </section>


                    <AppCard>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">
                                    Estoque Olist detalhado por SKU e depósito
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Consulta somente leitura do snapshot de estoque do Olist. Use esta visão para conferir saldo por produto, depósito e situação operacional.
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                    Exibindo {formatarNumero(estoqueFiltrado.length)} de {formatarNumero(painel.estoqueDetalhado.length)} registro(s) carregado(s).
                                </p>
                            </div>

                            <AppButton
                                variant="secondary"
                                onClick={limparFiltrosEstoque}
                                disabled={!existemFiltrosEstoque}
                            >
                                Limpar filtros
                            </AppButton>
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Buscar SKU ou produto
                                    <input
                                        type="search"
                                        value={filtroEstoqueBusca}
                                        onChange={(event) =>
                                            setFiltroEstoqueBusca(event.target.value)
                                        }
                                        placeholder="Ex.: AUT-LUX, Lava Seco"
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                                    />
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Depósito
                                    <select
                                        value={filtroEstoqueDeposito}
                                        onChange={(event) =>
                                            setFiltroEstoqueDeposito(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="">Todos os depósitos</option>
                                        {opcoesDepositosEstoque.map((deposito) => (
                                            <option key={deposito} value={deposito}>
                                                {deposito}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Situação do saldo
                                    <select
                                        value={filtroEstoqueStatus}
                                        onChange={(event) =>
                                            setFiltroEstoqueStatus(
                                                event.target.value as 'todos' | StatusEstoqueOlist
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="todos">Todos os status</option>
                                        <option value="ok">OK</option>
                                        <option value="baixo">Baixo</option>
                                        <option value="zerado">Zerado</option>
                                        <option value="com_reserva">Com reserva</option>
                                    </select>
                                </label>
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Status calculado na tela: Zerado quando disponível ≤ 0, Com reserva quando há reserva, Baixo quando disponível entre 1 e 5, OK acima disso.
                            </p>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">OK</p>
                                    <p className="mt-1 text-lg font-bold text-emerald-200">{formatarNumero(resumoEstoquePorSituacao.ok)}</p>
                                </div>

                                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-yellow-300">Baixo</p>
                                    <p className="mt-1 text-lg font-bold text-yellow-200">{formatarNumero(resumoEstoquePorSituacao.baixo)}</p>
                                </div>

                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300">Zerado</p>
                                    <p className="mt-1 text-lg font-bold text-red-200">{formatarNumero(resumoEstoquePorSituacao.zerado)}</p>
                                </div>

                                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-300">Com reserva</p>
                                    <p className="mt-1 text-lg font-bold text-purple-200">{formatarNumero(resumoEstoquePorSituacao.com_reserva)}</p>
                                </div>
                            </div>
                        </div>

                        <DataTableContainer className="mt-5" maxHeightClassName="max-h-[460px]">
                            <table className="min-w-[980px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold">SKU</th>
                                        <th className="px-3 py-2.5 font-semibold">Produto</th>
                                        <th className="px-3 py-2.5 font-semibold">Depósito</th>
                                        <th className="px-3 py-2.5 font-semibold">Un.</th>
                                        <th className="px-3 py-2.5 font-semibold">Saldo</th>
                                        <th className="px-3 py-2.5 font-semibold">Reservado</th>
                                        <th className="px-3 py-2.5 font-semibold">Disponível</th>
                                        <th className="px-3 py-2.5 font-semibold">Situação</th>
                                        <th className="px-3 py-2.5 font-semibold">Localização</th>
                                        <th className="px-3 py-2.5 font-semibold">Sincronizado em</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {estoqueFiltrado.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={10}
                                                className="px-3 py-8 text-center text-sm text-slate-500"
                                            >
                                                Nenhum item de estoque encontrado com os filtros aplicados.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {estoqueFiltrado.map((item, index) => {
                                        const statusItem = obterStatusEstoqueOlist(item)

                                        return (
                                            <tr
                                                key={`${item.id_produto_olist}-${item.deposito_nome}-${index}`}
                                                className="hover:bg-slate-800/40"
                                            >
                                                <td className="px-3 py-2.5 font-mono text-[11px] leading-4 text-cyan-300">
                                                    {item.sku ?? '-'}
                                                </td>
                                                <td className="max-w-[240px] whitespace-normal px-3 py-2.5 leading-5 text-slate-300">
                                                    {item.produto_nome ?? '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-300">
                                                    {item.deposito_nome ?? '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-300">
                                                    {item.unidade ?? '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-300">
                                                    {formatarNumero(item.saldo_deposito)}
                                                </td>
                                                <td className="px-3 py-2.5 text-yellow-300">
                                                    {formatarNumero(item.reservado_deposito)}
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold text-emerald-300">
                                                    {formatarNumero(item.disponivel_deposito)}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <StatusBadge tone={statusItem.tone}>
                                                        {statusItem.label}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-300">
                                                    {item.localizacao ?? '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-300">
                                                    {formatarDataHora(item.sincronizado_em)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <AppCard>
                            <h2 className="text-lg font-bold text-slate-100">
                                Saúde dos pedidos Olist
                            </h2>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Itens vinculados</p>
                                    <p className="mt-2 text-2xl font-bold text-emerald-300">
                                        {formatarNumero(
                                            painel.pedidos.itensComProdutoVinculado
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Itens sem produto</p>
                                    <p className="mt-2 text-2xl font-bold text-red-300">
                                        {formatarNumero(
                                            painel.pedidos.itensSemProdutoVinculado
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Pedidos com erro</p>
                                    <p className="mt-2 text-2xl font-bold text-red-300">
                                        {formatarNumero(painel.pedidos.comErro)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Pedidos ignorados</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-300">
                                        {formatarNumero(painel.pedidos.ignorados)}
                                    </p>
                                </div>
                            </div>
                        </AppCard>

                        <AppCard>
                            <h2 className="text-lg font-bold text-slate-100">
                                Regra operacional aplicada
                            </h2>

                            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                                <p>
                                    Esta página lê snapshots do Olist e views gerenciais do Supabase.
                                </p>

                                <p>
                                    Ela não chama RPCs de processamento, não cria vendas oficiais e não executa baixa FIFO.
                                </p>

                                <p>
                                    A próxima evolução natural é transformar estes snapshots em relatórios gerenciais e alertas, sempre mantendo o Olist como ERP operacional oficial.
                                </p>
                            </div>
                        </AppCard>
                    </section>

                    <AppCard>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">
                                    Pedidos Olist recentes
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Últimos itens importados na view gerencial de pedidos Olist.
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                    Exibindo {formatarNumero(pedidosFiltrados.length)} de{' '}
                                    {formatarNumero(painel.pedidosRecentes.length)} item(ns) carregado(s).
                                </p>
                            </div>

                            <AppButton
                                variant="secondary"
                                onClick={limparFiltrosPedidos}
                                disabled={!existemFiltrosPedidos}
                            >
                                Limpar filtros
                            </AppButton>
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Buscar por pedido, SKU ou produto
                                    <input
                                        value={filtroBusca}
                                        onChange={(event) =>
                                            setFiltroBusca(event.target.value)
                                        }
                                        placeholder="Ex.: 751, AUT-LUX, Lava Seco"
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                                    />
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Canal
                                    <select
                                        value={filtroCanal}
                                        onChange={(event) =>
                                            setFiltroCanal(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="">Todos os canais</option>
                                        {opcoesCanaisPedidos.map((canal) => (
                                            <option key={canal} value={canal}>
                                                {canal}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Depósito
                                    <select
                                        value={filtroDeposito}
                                        onChange={(event) =>
                                            setFiltroDeposito(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="">Todos os depósitos</option>
                                        {opcoesDepositosPedidos.map((deposito) => (
                                            <option key={deposito} value={deposito}>
                                                {deposito}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Status gerencial
                                    <select
                                        value={filtroStatusPedido}
                                        onChange={(event) =>
                                            setFiltroStatusPedido(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="">Todos os status</option>
                                        {opcoesStatusPedidos.map((statusPedido) => (
                                            <option key={statusPedido} value={statusPedido}>
                                                {statusPedido}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Vínculo com produto
                                    <select
                                        value={filtroProdutoVinculado}
                                        onChange={(event) =>
                                            setFiltroProdutoVinculado(
                                                event.target.value as
                                                    | 'todos'
                                                    | 'vinculados'
                                                    | 'sem_vinculo'
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="vinculados">Somente vinculados</option>
                                        <option value="sem_vinculo">Somente sem vínculo</option>
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Data inicial
                                    <input
                                        type="date"
                                        value={filtroDataInicio}
                                        onChange={(event) =>
                                            setFiltroDataInicio(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    />
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Data final
                                    <input
                                        type="date"
                                        value={filtroDataFim}
                                        onChange={(event) =>
                                            setFiltroDataFim(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    />
                                </label>
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Os filtros são apenas de leitura e atuam sobre os pedidos carregados nesta tela.
                            </p>
                        </div>

                        <DataTableContainer className="mt-5" maxHeightClassName="max-h-[460px]">
                            <table className="min-w-[1060px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold">Pedido</th>
                                        <th className="px-3 py-2.5 font-semibold">Data</th>
                                        <th className="px-3 py-2.5 font-semibold">Marketplace</th>
                                        <th className="px-3 py-2.5 font-semibold">Canal</th>
                                        <th className="px-3 py-2.5 font-semibold">Depósito</th>
                                        <th className="px-3 py-2.5 font-semibold">SKU</th>
                                        <th className="px-3 py-2.5 font-semibold">Produto</th>
                                        <th className="px-3 py-2.5 font-semibold">Qtd.</th>
                                        <th className="px-3 py-2.5 font-semibold">Valor item</th>
                                        <th className="px-3 py-2.5 font-semibold">Status</th>
                                        <th className="px-3 py-2.5 font-semibold">Produto vinculado</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {pedidosFiltrados.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={11}
                                                className="px-3 py-8 text-center text-sm text-slate-500"
                                            >
                                                Nenhum pedido encontrado com os filtros aplicados.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {pedidosFiltrados.map((pedido, index) => (
                                        <tr
                                            key={`${pedido.id_pedido_olist}-${pedido.sku_olist}-${index}`}
                                            className="hover:bg-slate-800/40"
                                        >
                                            <td className="px-3 py-2.5 text-slate-200">
                                                {pedido.numero_pedido ?? '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarDataHora(obterDataReferenciaPedido(pedido))}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {pedido.numero_pedido_ecommerce ?? '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {obterCanalPedido(pedido)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {pedido.deposito_nome ?? '-'}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-[11px] leading-4 text-cyan-300">
                                                {pedido.sku_olist ?? '-'}
                                            </td>
                                            <td className="max-w-[250px] whitespace-normal px-3 py-2.5 leading-5 text-slate-300">
                                                {pedido.descricao_olist ?? '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(pedido.quantidade)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarMoeda(pedido.valor_total_item)}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge
                                                    tone={obterTomStatus(
                                                        pedido.status_gerencial
                                                    )}
                                                >
                                                    {pedido.status_gerencial ?? '-'}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge
                                                    tone={
                                                        pedido.produto_vinculado
                                                            ? 'success'
                                                            : 'danger'
                                                    }
                                                >
                                                    {pedido.produto_vinculado
                                                        ? 'Sim'
                                                        : 'Não'}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>

                    <AppCard>
                        <h2 className="text-lg font-bold text-slate-100">
                            Últimos logs de sincronização
                        </h2>

                        <DataTableContainer className="mt-5" maxHeightClassName="max-h-[360px]">
                            <table className="min-w-[760px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold">Origem</th>
                                        <th className="px-3 py-2.5 font-semibold">Status</th>
                                        <th className="px-3 py-2.5 font-semibold">Início</th>
                                        <th className="px-3 py-2.5 font-semibold">Fim</th>
                                        <th className="px-3 py-2.5 font-semibold">Lidos</th>
                                        <th className="px-3 py-2.5 font-semibold">Inseridos</th>
                                        <th className="px-3 py-2.5 font-semibold">Atualizados</th>
                                        <th className="px-3 py-2.5 font-semibold">Erros</th>
                                        <th className="px-3 py-2.5 font-semibold">Mensagem</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {painel.logsRecentes.map((log, index) => (
                                        <tr
                                            key={`${log.origem}-${log.data_inicio}-${index}`}
                                            className="hover:bg-slate-800/40"
                                        >
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarOrigemLog(log.origem)}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge tone={obterTomStatus(log.status)}>
                                                    {log.status ?? '-'}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarDataHora(log.data_inicio)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarDataHora(log.data_fim)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(log.lidos)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(log.inseridos)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(log.atualizados)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(log.erros)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-400">
                                                {log.mensagem ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>
                </>
            ) : status === 'carregando' ? (
                <AppCard>
                    <p className="text-sm text-slate-400">
                        Carregando dados do Olist...
                    </p>
                </AppCard>
            ) : null}
        </div>
    )
}
