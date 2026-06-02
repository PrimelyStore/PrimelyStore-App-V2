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
    buscarSaudeOlist,
    type OlistSincronizacaoManualResultado,
    type OlistTipoSincronizacao,
    type PainelIntegracoesOlist,
    type OlistSaudeResultado,
} from '../services/olistIntegracoesService'
import {
    buscarSaudeAmazon,
    sincronizarAmazonFBAEstoqueSnapshot,
    buscarResumoAmazonFBAEstoqueSnapshot,
    type AmazonSaudeResultado,
    type ResumoAmazonFBAEstoqueSnapshot,
} from '../services/amazonService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type StatusBadgeTone =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'muted'

type TipoSincronizacaoCompleta = OlistTipoSincronizacao | 'amazon_fba'

type OpcaoSincronizacao = {
    tipo: TipoSincronizacaoCompleta
    titulo: string
    descricao: string
    aviso: string
}

const opcoesSincronizacao: OpcaoSincronizacao[] = [
    {
        tipo: 'produtos',
        titulo: 'Produtos Olist',
        descricao: 'Atualiza o snapshot de produtos ativos do Olist.',
        aviso: 'Sincronizar produtos do Olist? Esta ação apenas atualiza snapshots no Supabase.',
    },
    {
        tipo: 'depositos',
        titulo: 'Depósitos Olist',
        descricao: 'Atualiza a lista de depósitos cadastrados no Olist.',
        aviso: 'Sincronizar depósitos do Olist? Esta ação apenas atualiza snapshots no Supabase.',
    },
    {
        tipo: 'estoque',
        titulo: 'Estoque Olist',
        descricao: 'Atualiza um lote seguro do estoque por depósito para evitar limite da API.',
        aviso: 'Sincronizar estoque por depósito do Olist? Esta ação lê um lote seguro de produtos e não altera estoque operacional.',
    },
    {
        tipo: 'pedidos',
        titulo: 'Pedidos Olist',
        descricao: 'Atualiza um lote pequeno de pedidos e itens em snapshots gerenciais.',
        aviso: 'Sincronizar pedidos do Olist? Esta ação usa processar=false e baixar_fifo=false. Não cria vendas oficiais e não baixa estoque.',
    },
    {
        tipo: 'notas_entrada',
        titulo: 'Notas de entrada Olist',
        descricao: 'Atualiza um lote pequeno de notas de entrada para conferência gerencial.',
        aviso: 'Sincronizar notas de entrada do Olist? Esta ação apenas atualiza snapshots e não gera estoque, lote ou recebimento automático.',
    },
    {
        tipo: 'amazon_fba',
        titulo: 'Estoque FBA Amazon',
        descricao: 'Atualiza o snapshot de estoque e inventário Amazon FBA diretamente da SP-API.',
        aviso: 'Sincronizar estoque Amazon FBA? Esta ação apenas atualiza snapshots no Supabase.',
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

function obterDataReferenciaNota(
    nota: PainelIntegracoesOlist['notasEntradaRecentes'][number]
) {
    return nota.data_emissao ?? nota.data_inclusao ?? nota.sincronizado_em ?? null
}

function obterPercentual(valor: number, total: number) {
    if (total <= 0) {
        return 0
    }

    return Math.round((valor / total) * 100)
}

function obterLabelStatus(status?: string | null) {
    return status ? status.replaceAll('_', ' ') : 'Não informado'
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
        'Carregando painel gerencial e saúde das integrações...'
    )
    const [painel, setPainel] = useState<PainelIntegracoesOlist | null>(null)
    const [saudeOlist, setSaudeOlist] = useState<OlistSaudeResultado | null>(null)
    const [saudeAmazon, setSaudeAmazon] = useState<AmazonSaudeResultado | null>(null)
    const [resumoAmazon, setResumoAmazon] = useState<ResumoAmazonFBAEstoqueSnapshot | null>(null)
    const [carregandoSaude, setCarregandoSaude] = useState(false)
    const [abaAtiva, setAbaAtiva] = useState<'conexoes' | 'auditoria' | 'logs'>('conexoes')

    const [sincronizandoTipo, setSincronizandoTipo] =
        useState<TipoSincronizacaoCompleta | null>(null)
    const [ultimoResultadoSincronizacao, setUltimoResultadoSincronizacao] =
        useState<OlistSincronizacaoManualResultado | null>(null)
    const [resultadosSincronizacaoPorTipo, setResultadosSincronizacaoPorTipo] =
        useState<Partial<Record<TipoSincronizacaoCompleta, OlistSincronizacaoManualResultado>>>(
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

    const [filtroNotasBusca, setFiltroNotasBusca] = useState('')
    const [filtroNotasStatus, setFiltroNotasStatus] = useState('')
    const [filtroNotasCompraVinculada, setFiltroNotasCompraVinculada] = useState<
        'todos' | 'vinculadas' | 'sem_vinculo'
    >('todos')
    const [filtroNotasProdutoVinculado, setFiltroNotasProdutoVinculado] = useState<
        'todos' | 'com_produto' | 'sem_produto'
    >('todos')
    const [filtroNotasDataInicio, setFiltroNotasDataInicio] = useState('')
    const [filtroNotasDataFim, setFiltroNotasDataFim] = useState('')

    async function carregarPainel() {
        try {
            setStatus('carregando')
            setMensagem('Carregando painel gerencial e saúde das integrações...')
            setCarregandoSaude(true)

            const [dados, saudeOlistRes, saudeAmazonRes, resumoAmazonRes] = await Promise.all([
                buscarPainelIntegracoesOlist(),
                buscarSaudeOlist().catch(() => null),
                buscarSaudeAmazon().catch(() => null),
                buscarResumoAmazonFBAEstoqueSnapshot().catch(() => null)
            ])

            setPainel(dados)
            setSaudeOlist(saudeOlistRes)
            setSaudeAmazon(saudeAmazonRes)
            setResumoAmazon(resumoAmazonRes)
            
            setStatus('sucesso')
            setMensagem('Dados gerenciais e saúde das integrações carregados com sucesso.')
        } catch (error) {
            setStatus('erro')
            setPainel(null)

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar dados do painel.')
            }
        } finally {
            setCarregandoSaude(false)
        }
    }


    async function executarSincronizacaoManual(opcao: OpcaoSincronizacao) {
        const confirmarSincronizacao = window.confirm(
            `${opcao.aviso}

Regra de segurança: esta ação apenas atualiza snapshots no Supabase. Não cria vendas oficiais, não altera estoque operacional e não realiza operações destrutivas.`
        )

        if (!confirmarSincronizacao) {
            return
        }

        try {
            setSincronizandoTipo(opcao.tipo)
            setUltimoResultadoSincronizacao(null)
            setStatus('carregando')
            setMensagem(`Sincronizando ${opcao.titulo.toLowerCase()}...`)

            if (opcao.tipo === 'amazon_fba') {
                const resultado = await sincronizarAmazonFBAEstoqueSnapshot()
                const resumoAmazonRes = await buscarResumoAmazonFBAEstoqueSnapshot()
                setResumoAmazon(resumoAmazonRes)
                
                const resultadoManual: OlistSincronizacaoManualResultado = {
                    tipo: 'estoque', // compatível com os tipos do olist para uso na tela
                    rotulo: 'Amazon FBA',
                    ok: resultado.ok,
                    service: resultado.service,
                    message: resultado.message,
                    status: 'sucesso',
                    synchronizedAt: resultado.result?.synchronized_at ?? new Date().toISOString(),
                    resumo: `Total recebido: ${resultado.result?.received_count ?? 0} • Salvo: ${resultado.result?.saved_count ?? 0}`,
                    raw: resultado as unknown as Record<string, unknown>
                }
                
                setUltimoResultadoSincronizacao(resultadoManual)
                setResultadosSincronizacaoPorTipo((resultadosAtuais) => ({
                    ...resultadosAtuais,
                    [opcao.tipo]: resultadoManual,
                }))
            } else {
                const resultado = await sincronizarSnapshotOlist(opcao.tipo)
                const dadosAtualizados = await buscarPainelIntegracoesOlist()
                setPainel(dadosAtualizados)
                setUltimoResultadoSincronizacao(resultado)
                setResultadosSincronizacaoPorTipo((resultadosAtuais) => ({
                    ...resultadosAtuais,
                    [opcao.tipo]: resultado,
                }))
            }

            // Recarregar os status de conexão pós-sync
            const [saudeOlistRes, saudeAmazonRes] = await Promise.all([
                buscarSaudeOlist().catch(() => null),
                buscarSaudeAmazon().catch(() => null)
            ])
            setSaudeOlist(saudeOlistRes)
            setSaudeAmazon(saudeAmazonRes)

            setStatus('sucesso')
            setMensagem(`${opcao.titulo} sincronizado com sucesso.`)
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao sincronizar dados.')
            }
        } finally {
            setSincronizandoTipo(null)
        }
    }

    useEffect(() => {
        carregarPainel()
    }, [])

    const ultimaSincronizacaoPorTipo = useMemo<
        Partial<Record<TipoSincronizacaoCompleta, string | null>>
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
            amazon_fba: resumoAmazon?.ultima_sincronizacao ?? null,
        }
    }, [painel, resumoAmazon])

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

    const opcoesStatusNotas = useMemo(() => {
        if (!painel) {
            return []
        }

        return Array.from(
            new Set(
                painel.notasEntradaRecentes.map(
                    (nota) => nota.status_processamento ?? 'Não informado'
                )
            )
        ).sort(ordenarTexto)
    }, [painel])

    const notasEntradaFiltradas = useMemo(() => {
        if (!painel) {
            return []
        }

        const buscaNormalizada = normalizarTexto(filtroNotasBusca)

        return painel.notasEntradaRecentes.filter((nota) => {
            const statusNota = nota.status_processamento ?? 'Não informado'
            const dataReferenciaInput = obterDataInput(obterDataReferenciaNota(nota))
            const totalItens = obterNumeroSeguro(nota.total_itens_nf)
            const totalItensComProduto = obterNumeroSeguro(nota.total_itens_com_produto)
            const temProdutoVinculado = totalItens > 0 && totalItensComProduto >= totalItens
            const temItemSemProduto = totalItens > 0 && totalItensComProduto < totalItens

            if (filtroNotasStatus && statusNota !== filtroNotasStatus) {
                return false
            }

            if (
                filtroNotasCompraVinculada === 'vinculadas' &&
                nota.compra_vinculada !== true
            ) {
                return false
            }

            if (
                filtroNotasCompraVinculada === 'sem_vinculo' &&
                nota.compra_vinculada === true
            ) {
                return false
            }

            if (
                filtroNotasProdutoVinculado === 'com_produto' &&
                !temProdutoVinculado
            ) {
                return false
            }

            if (
                filtroNotasProdutoVinculado === 'sem_produto' &&
                !temItemSemProduto
            ) {
                return false
            }

            if (filtroNotasDataInicio && dataReferenciaInput < filtroNotasDataInicio) {
                return false
            }

            if (filtroNotasDataFim && dataReferenciaInput > filtroNotasDataFim) {
                return false
            }

            if (buscaNormalizada) {
                const conteudoBusca = normalizarTexto([
                    nota.numero_nf,
                    nota.serie,
                    nota.chave_acesso,
                    nota.fornecedor_nome,
                    nota.fornecedor_cpf_cnpj,
                    statusNota,
                    nota.mensagem_erro,
                ].join(' '))

                if (!conteudoBusca.includes(buscaNormalizada)) {
                    return false
                }
            }

            return true
        })
    }, [
        filtroNotasBusca,
        filtroNotasCompraVinculada,
        filtroNotasDataFim,
        filtroNotasDataInicio,
        filtroNotasProdutoVinculado,
        filtroNotasStatus,
        painel,
    ])

    const resumoNotasFiltradas = useMemo(() => {
        return notasEntradaFiltradas.reduce(
            (acc, nota) => {
                acc.valorTotal += obterNumeroSeguro(nota.valor_total_nf)
                acc.totalItens += obterNumeroSeguro(nota.total_itens_nf)
                acc.itensComProduto += obterNumeroSeguro(nota.total_itens_com_produto)

                if (nota.compra_vinculada) {
                    acc.comCompra += 1
                } else {
                    acc.semCompra += 1
                }

                if (nota.status_processamento === 'erro') {
                    acc.comErro += 1
                }

                return acc
            },
            {
                valorTotal: 0,
                totalItens: 0,
                itensComProduto: 0,
                comCompra: 0,
                semCompra: 0,
                comErro: 0,
            }
        )
    }, [notasEntradaFiltradas])

    const existemFiltrosNotas = Boolean(
        filtroNotasBusca ||
        filtroNotasStatus ||
        filtroNotasCompraVinculada !== 'todos' ||
        filtroNotasProdutoVinculado !== 'todos' ||
        filtroNotasDataInicio ||
        filtroNotasDataFim
    )

    function limparFiltrosNotas() {
        setFiltroNotasBusca('')
        setFiltroNotasStatus('')
        setFiltroNotasCompraVinculada('todos')
        setFiltroNotasProdutoVinculado('todos')
        setFiltroNotasDataInicio('')
        setFiltroNotasDataFim('')
    }


    return (
        <div className="space-y-6">
            <PageHeader
                tag="INTEGRAÇÕES"
                title="Saúde dos Dados e Integrações"
                description="Painel gerencial somente leitura para acompanhar a saúde e sincronizar os snapshots de dados da Olist/Tiny e Amazon FBA."
            />

            {/* Abas de Navegação */}
            <div className="flex border-b border-slate-800 gap-6">
                <button
                    onClick={() => setAbaAtiva('conexoes')}
                    className={`pb-3 text-sm font-semibold transition border-b-2 px-1 ${
                        abaAtiva === 'conexoes'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Painel de Conexões
                </button>
                <button
                    onClick={() => setAbaAtiva('auditoria')}
                    className={`pb-3 text-sm font-semibold transition border-b-2 px-1 ${
                        abaAtiva === 'auditoria'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Auditoria de Dados
                </button>
                <button
                    onClick={() => setAbaAtiva('logs')}
                    className={`pb-3 text-sm font-semibold transition border-b-2 px-1 ${
                        abaAtiva === 'logs'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Logs de Sincronização
                </button>
            </div>

            {/* Status do Carregamento Geral */}
            <AppCard className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between py-4">
                <div>
                    <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        Status do Painel
                        {carregandoSaude && <span className="text-xs text-slate-500 font-normal animate-pulse">(verificando conexões...)</span>}
                    </p>
                    <div className="mt-1 flex flex-col gap-1">
                        <p className="text-xs text-slate-400">{mensagem}</p>
                        {ultimaSincronizacaoGeral && (
                            <p className="text-[11px] text-slate-500">
                                Última sincronização de dados detectada: <span className="font-semibold text-cyan-400">{formatarDataHora(ultimaSincronizacaoGeral)}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
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
                            ? 'Atualizado'
                            : status === 'erro'
                                ? 'Erro'
                                : 'Carregando'}
                    </StatusBadge>
                    <AppButton
                        variant="secondary"
                        onClick={carregarPainel}
                        disabled={status === 'carregando' || sincronizandoTipo !== null}
                    >
                        Atualizar Status
                    </AppButton>
                </div>
            </AppCard>

            {abaAtiva === 'conexoes' && (
                <>
                    {/* Saúde das Conexões (Cards Premium) */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Card Olist */}
                        <AppCard className="flex flex-col justify-between min-h-36">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Conexão Olist/Tiny</p>
                                    <StatusBadge tone={saudeOlist?.ok ? 'success' : 'danger'}>
                                        {saudeOlist?.ok ? 'Conectado' : 'Desconectado'}
                                    </StatusBadge>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-200">
                                    {saudeOlist?.api?.account_preview?.fantasia ?? saudeOlist?.api?.account_preview?.razaoSocial ?? 'Conta Olist/Tiny'}
                                </p>
                                {saudeOlist?.api?.account_preview?.cpfCnpj_masked && (
                                    <p className="mt-1 text-xs text-slate-400 font-mono">
                                        CNPJ: {saudeOlist.api.account_preview.cpfCnpj_masked}
                                    </p>
                                )}
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                                {saudeOlist?.token_status?.expires_at ? (
                                    <span>Token expira: {formatarDataHora(saudeOlist.token_status.expires_at)}</span>
                                ) : (
                                    <span>Sem info de expiração</span>
                                )}
                            </div>
                        </AppCard>

                        {/* Card Amazon */}
                        <AppCard className="flex flex-col justify-between min-h-36">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Conexão Amazon SP-API</p>
                                    <StatusBadge tone={saudeAmazon?.ok ? 'success' : 'danger'}>
                                        {saudeAmazon?.ok ? 'Conectado' : 'Indisponível'}
                                    </StatusBadge>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-200">
                                    Amazon Brasil (BR)
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Token LWA: <span className="font-semibold text-emerald-400">{saudeAmazon?.lwa_token_ok ? 'Operacional' : 'Erro'}</span>
                                </p>
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                                <span>Segredos ativos: {saudeAmazon?.configured_secrets_count ?? 0}/{saudeAmazon?.total_expected_secrets ?? 9}</span>
                            </div>
                        </AppCard>

                        {/* Card Keepa */}
                        <AppCard className="flex flex-col justify-between opacity-60 min-h-36">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Keepa API</p>
                                    <StatusBadge tone="muted">Futuro</StatusBadge>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-300">
                                    Mineração de Produtos
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Integração pendente de ativação
                                </p>
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                                <span>Aguardando etapa do Roadmap</span>
                            </div>
                        </AppCard>

                        {/* Card Mercado Livre */}
                        <AppCard className="flex flex-col justify-between opacity-60 min-h-36">
                            <div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Mercado Livre API</p>
                                    <StatusBadge tone="muted">Futuro</StatusBadge>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-300">
                                    Saldos Full / Flex
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Integração em planejamento
                                </p>
                            </div>
                            <div className="mt-4 pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                                <span>Aguardando etapa do Roadmap</span>
                            </div>
                        </AppCard>
                    </div>

                    {/* Sincronizações Manuais */}
                    <AppCard>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">
                                    Sincronizações manuais controladas
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Estes botões chamam somente Edge Functions de snapshot. Eles não criam vendas oficiais e não alteram o estoque operacional.
                                </p>
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

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                            {opcoesSincronizacao.map((opcao) => {
                                const estaSincronizando = sincronizandoTipo === opcao.tipo
                                const existeSincronizacaoEmAndamento = sincronizandoTipo !== null
                                const ultimoResultadoOpcao =
                                    resultadosSincronizacaoPorTipo[opcao.tipo]
                                const ultimaSincronizacaoBanco =
                                    ultimaSincronizacaoPorTipo[opcao.tipo] ?? null

                                return (
                                    <div
                                        key={opcao.tipo}
                                        className="flex min-h-52 flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm font-bold text-slate-100 leading-tight">
                                                    {opcao.titulo}
                                                </p>

                                                <StatusBadge
                                                    tone={estaSincronizando ? 'warning' : 'info'}
                                                >
                                                    {estaSincronizando ? 'Rodando' : 'Snapshot'}
                                                </StatusBadge>
                                            </div>

                                            <p className="mt-2 text-[11px] leading-relaxed text-slate-400 min-h-12">
                                                {opcao.descricao}
                                            </p>

                                            <div className="mt-3 space-y-2 text-[10px] leading-relaxed">
                                                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-100">
                                                    <p className="font-semibold text-slate-300">Última no banco</p>
                                                    <p className="mt-0.5 text-cyan-100/85 font-mono">
                                                        {ultimaSincronizacaoBanco
                                                            ? formatarDataHora(ultimaSincronizacaoBanco)
                                                            : 'Não encontrada'}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-slate-450">
                                                    {ultimoResultadoOpcao ? (
                                                        <>
                                                            <p className="font-semibold text-slate-200">Nesta sessão</p>
                                                            <p className="mt-0.5 font-mono">
                                                                {formatarDataHora(
                                                                    ultimoResultadoOpcao.synchronizedAt
                                                                )}
                                                            </p>
                                                            <p className="mt-0.5 line-clamp-2 text-emerald-250/80">
                                                                {ultimoResultadoOpcao.resumo}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-semibold text-slate-350">Nesta sessão</p>
                                                            <p className="mt-0.5">Sem execução</p>
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
                                                ? 'Sync...'
                                                : existeSincronizacaoEmAndamento
                                                    ? 'Aguarde'
                                                    : 'Sincronizar'}
                                        </AppButton>
                                    </div>
                                )
                            })}
                        </div>
                    </AppCard>
                </>
            )}

            {abaAtiva === 'auditoria' && painel && (
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">
                                    Notas de entrada Olist recentes
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Últimas notas de entrada importadas para conferência gerencial. Esta tabela é somente leitura e não gera compra, estoque, lote ou recebimento automático.
                                </p>

                                <p className="mt-2 text-xs text-slate-500">
                                    Exibindo {formatarNumero(notasEntradaFiltradas.length)} de{' '}
                                    {formatarNumero(painel.notasEntradaRecentes.length)} nota(s) carregada(s).
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:items-end">
                                <StatusBadge tone="info">Snapshot</StatusBadge>

                                <AppButton
                                    variant="secondary"
                                    onClick={limparFiltrosNotas}
                                    disabled={!existemFiltrosNotas}
                                >
                                    Limpar filtros
                                </AppButton>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Buscar nota, fornecedor ou CPF/CNPJ
                                    <input
                                        type="search"
                                        value={filtroNotasBusca}
                                        onChange={(event) =>
                                            setFiltroNotasBusca(event.target.value)
                                        }
                                        placeholder="Ex.: 1690, Amazon, 15.436"
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                                    />
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Status
                                    <select
                                        value={filtroNotasStatus}
                                        onChange={(event) =>
                                            setFiltroNotasStatus(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="">Todos os status</option>
                                        {opcoesStatusNotas.map((statusNota) => (
                                            <option key={statusNota} value={statusNota}>
                                                {obterLabelStatus(statusNota)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Vínculo com compra
                                    <select
                                        value={filtroNotasCompraVinculada}
                                        onChange={(event) =>
                                            setFiltroNotasCompraVinculada(
                                                event.target.value as
                                                | 'todos'
                                                | 'vinculadas'
                                                | 'sem_vinculo'
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="todos">Todas</option>
                                        <option value="vinculadas">Com compra vinculada</option>
                                        <option value="sem_vinculo">Sem vínculo com compra</option>
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Vínculo dos itens
                                    <select
                                        value={filtroNotasProdutoVinculado}
                                        onChange={(event) =>
                                            setFiltroNotasProdutoVinculado(
                                                event.target.value as
                                                | 'todos'
                                                | 'com_produto'
                                                | 'sem_produto'
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="com_produto">Todos os itens vinculados</option>
                                        <option value="sem_produto">Com item sem produto</option>
                                    </select>
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Emissão inicial
                                    <input
                                        type="date"
                                        value={filtroNotasDataInicio}
                                        onChange={(event) =>
                                            setFiltroNotasDataInicio(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    />
                                </label>

                                <label className="space-y-1 text-xs font-semibold text-slate-400">
                                    Emissão final
                                    <input
                                        type="date"
                                        value={filtroNotasDataFim}
                                        onChange={(event) =>
                                            setFiltroNotasDataFim(event.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition focus:border-cyan-500"
                                    />
                                </label>
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Valor filtrado</p>
                                    <p className="mt-1 text-lg font-bold text-emerald-200">{formatarMoeda(resumoNotasFiltradas.valorTotal)}</p>
                                </div>

                                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">Itens vinculados</p>
                                    <p className="mt-1 text-lg font-bold text-cyan-200">
                                        {formatarNumero(resumoNotasFiltradas.itensComProduto)} / {formatarNumero(resumoNotasFiltradas.totalItens)}
                                        <span className="ml-2 text-xs font-semibold text-cyan-200/70">
                                            {obterPercentual(
                                                resumoNotasFiltradas.itensComProduto,
                                                resumoNotasFiltradas.totalItens
                                            )}%
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-300">Compra vinculada</p>
                                    <p className="mt-1 text-lg font-bold text-purple-200">
                                        {formatarNumero(resumoNotasFiltradas.comCompra)}
                                        <span className="ml-2 text-xs font-semibold text-purple-200/70">
                                            Sem vínculo: {formatarNumero(resumoNotasFiltradas.semCompra)}
                                        </span>
                                    </p>
                                </div>

                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300">Erros</p>
                                    <p className="mt-1 text-lg font-bold text-red-200">{formatarNumero(resumoNotasFiltradas.comErro)}</p>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Os filtros são apenas visuais e atuam sobre as notas já carregadas nesta tela. Eles não consultam a API do Olist novamente e não alteram compras, estoque ou lotes.
                            </p>
                        </div>

                        <DataTableContainer className="mt-5" maxHeightClassName="max-h-[420px]">
                            <table className="min-w-[1120px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-3 py-2.5 font-semibold">Nota</th>
                                        <th className="px-3 py-2.5 font-semibold">Emissão</th>
                                        <th className="px-3 py-2.5 font-semibold">Fornecedor</th>
                                        <th className="px-3 py-2.5 font-semibold">CPF/CNPJ</th>
                                        <th className="px-3 py-2.5 font-semibold">Valor NF</th>
                                        <th className="px-3 py-2.5 font-semibold">Itens</th>
                                        <th className="px-3 py-2.5 font-semibold">Itens vinculados</th>
                                        <th className="px-3 py-2.5 font-semibold">Status</th>
                                        <th className="px-3 py-2.5 font-semibold">Compra</th>
                                        <th className="px-3 py-2.5 font-semibold">Sincronizado em</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {notasEntradaFiltradas.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={10}
                                                className="px-3 py-8 text-center text-sm text-slate-500"
                                            >
                                                Nenhuma nota de entrada encontrada com os filtros atuais.
                                            </td>
                                        </tr>
                                    ) : null}

                                    {notasEntradaFiltradas.map((nota) => (
                                        <tr
                                            key={nota.nota_snapshot_id}
                                            className="hover:bg-slate-800/40"
                                        >
                                            <td className="px-3 py-2.5 text-slate-200">
                                                <div className="font-semibold">
                                                    {nota.numero_nf ?? '-'}
                                                </div>
                                                <div className="mt-1 text-[11px] text-slate-500">
                                                    Série: {nota.serie ?? '-'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarDataHora(nota.data_emissao)}
                                            </td>
                                            <td className="max-w-[260px] whitespace-normal px-3 py-2.5 leading-5 text-slate-300">
                                                {nota.fornecedor_nome ?? '-'}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-[11px] text-slate-300">
                                                {nota.fornecedor_cpf_cnpj ?? '-'}
                                            </td>
                                            <td className="px-3 py-2.5 font-semibold text-emerald-300">
                                                {formatarMoeda(nota.valor_total_nf)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(nota.total_itens_nf)}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarNumero(nota.total_itens_com_produto)} / {formatarNumero(nota.total_itens_nf)}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge
                                                    tone={obterTomStatus(
                                                        nota.status_processamento
                                                    )}
                                                >
                                                    {obterLabelStatus(nota.status_processamento)}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <StatusBadge
                                                    tone={
                                                        nota.compra_vinculada
                                                            ? 'success'
                                                            : 'muted'
                                                    }
                                                >
                                                    {nota.compra_vinculada
                                                        ? 'Vinculada'
                                                        : 'Sem vínculo'}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-300">
                                                {formatarDataHora(nota.sincronizado_em)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>
                </>
            )}

            {abaAtiva === 'logs' && painel && (
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
            )}

            {!painel && status === 'carregando' ? (
                <AppCard>
                    <p className="text-sm text-slate-400">
                        Carregando dados do Olist...
                    </p>
                </AppCard>
            ) : null}
        </div>
    )
}
