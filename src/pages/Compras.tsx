import { Fragment, useEffect, useState } from 'react'
import {
    buscarComprasResumo,
    buscarItensCompras,
    buscarConferenciaNotasEntradaOlistCompras,
    buscarTodasNotasEntradaOlistCompras,
    definirControleRecebimentoCompra,
    receberItemCompra,
    type CompraItemDetalhado,
    type CompraResumo,
    type NotaEntradaOlistConferencia,
    type ProgressoSincronizacaoNotasEntradaOlist,
    type ResultadoSincronizacaoNotasEntradaOlist,
    type ResumoSincronizacaoNotasEntradaOlist,
} from '../services/comprasService'
import {
    AppButton,
    AppCard,
    DataTableContainer,
    PageHeader,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'
type StatusBadgeTone =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'muted'



function formatarMoeda(valor?: number | null) {
    if (typeof valor !== 'number') {
        return '-'
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor)
}

function formatarData(data?: string | null) {
    if (!data) {
        return '-'
    }

    const dataConvertida = new Date(`${data}T00:00:00`)

    if (Number.isNaN(dataConvertida.getTime())) {
        return data
    }

    return new Intl.DateTimeFormat('pt-BR').format(dataConvertida)
}



function obterTomStatus(status?: string): StatusBadgeTone {
    const valor = status?.toLowerCase() ?? ''

    if (valor === 'recebido') {
        return 'success'
    }

    if (valor === 'pedido_realizado') {
        return 'info'
    }

    if (valor === 'rascunho' || valor === 'pendente') {
        return 'muted'
    }

    if (valor === 'cancelado') {
        return 'danger'
    }

    return 'warning'
}


function obterRotuloStatusProcessamentoOlist(status?: string | null) {
    const rotulos: Record<string, string> = {
        pendente: 'Pendente',
        processado: 'Processada',
        erro: 'Com erro',
        ignorado: 'Ignorada',
    }

    return rotulos[status ?? ''] ?? status ?? '-'
}

function obterTomStatusProcessamentoOlist(status?: string | null): StatusBadgeTone {
    if (status === 'processado') {
        return 'success'
    }

    if (status === 'erro') {
        return 'danger'
    }

    if (status === 'ignorado') {
        return 'muted'
    }

    if (status === 'pendente') {
        return 'warning'
    }

    return 'muted'
}

function obterRotuloStatusConferenciaOlist(status?: string | null) {
    const rotulos: Record<string, string> = {
        pronta_para_converter: 'Pronta para converter',
        pendente_conversao_unidade: 'Pendente conversão',
        itens_com_erro: 'Itens com erro',
        sem_itens: 'Sem itens',
        nota_ignorada: 'Ignorada',
        ja_processada: 'Já processada',
    }

    return rotulos[status ?? ''] ?? status ?? '-'
}

function obterTomStatusConferenciaOlist(status?: string | null): StatusBadgeTone {
    if (status === 'pronta_para_converter' || status === 'ja_processada') {
        return 'success'
    }

    if (status === 'pendente_conversao_unidade') {
        return 'warning'
    }

    if (status === 'itens_com_erro') {
        return 'danger'
    }

    if (status === 'nota_ignorada' || status === 'sem_itens') {
        return 'muted'
    }

    return 'info'
}

function obterStatusRecebimentoItem(item: CompraItemDetalhado) {
    const quantidade = Number(item.quantidade ?? 0)
    const quantidadeRecebida = Number(item.quantidade_recebida ?? 0)
    const pendente = quantidade - quantidadeRecebida

    if (item.status === 'cancelado') {
        return 'cancelado'
    }

    if (pendente <= 0 && quantidade > 0) {
        return 'recebido'
    }

    if (quantidadeRecebida > 0 && pendente > 0) {
        return 'parcialmente_recebido'
    }

    return 'pendente'
}

function obterRotuloStatusRecebimento(status: string) {
    const rotulos: Record<string, string> = {
        pendente: 'Pendente',
        parcialmente_recebido: 'Parcial',
        recebido: 'Recebido',
        cancelado: 'Cancelado',
    }

    return rotulos[status] ?? status
}

function obterTomStatusRecebimento(status: string): StatusBadgeTone {
    if (status === 'recebido') {
        return 'success'
    }

    if (status === 'parcialmente_recebido') {
        return 'info'
    }

    if (status === 'pendente') {
        return 'warning'
    }

    if (status === 'cancelado') {
        return 'danger'
    }

    return 'muted'
}


function obterRotuloClassificacaoOperacional(classificacao?: string | null) {
    if (classificacao === 'historico_fiscal_sem_entrada_estoque') {
        return 'Histórico fiscal sem entrada estoque'
    }

    if (classificacao === 'pendente_conferencia_operacional') {
        return 'Pendente de conferência operacional'
    }

    if (classificacao === 'recebimento_real') {
        return 'Recebimento real liberado'
    }

    return null
}

function obterTomClassificacaoOperacional(
    classificacao?: string | null
): StatusBadgeTone {
    if (classificacao === 'historico_fiscal_sem_entrada_estoque') {
        return 'danger'
    }

    if (classificacao === 'pendente_conferencia_operacional') {
        return 'warning'
    }

    if (classificacao === 'recebimento_real') {
        return 'success'
    }

    return 'muted'
}

function obterRotuloBloqueioRecebimento(bloqueiaRecebimento?: boolean) {
    return bloqueiaRecebimento
        ? 'Recebimento bloqueado'
        : 'Recebimento liberado'
}


function obterRotuloClassificacaoOperacionalCompacto(classificacao?: string | null) {
    if (classificacao === 'historico_fiscal_sem_entrada_estoque') {
        return 'Histórico fiscal'
    }

    if (classificacao === 'pendente_conferencia_operacional') {
        return 'Pendente conferência'
    }

    if (classificacao === 'recebimento_real') {
        return 'Recebimento real'
    }

    return null
}

function obterRotuloBloqueioRecebimentoCompacto(bloqueiaRecebimento?: boolean | null) {
    if (typeof bloqueiaRecebimento !== 'boolean') {
        return null
    }

    return bloqueiaRecebimento ? 'Bloqueado' : 'Liberado'
}

type ControleRecebimentoResumoProps = {
    classificacao?: string | null
    bloqueiaRecebimento?: boolean | null
    motivo?: string | null
    origem?: string | null
    compacto?: boolean
}

function ControleRecebimentoResumo({
    classificacao,
    bloqueiaRecebimento,
    motivo,
    origem,
    compacto = true,
}: ControleRecebimentoResumoProps) {
    const temControle = Boolean(
        classificacao || typeof bloqueiaRecebimento === 'boolean' || motivo || origem
    )

    if (!temControle) {
        return null
    }

    const rotuloClassificacao = compacto
        ? obterRotuloClassificacaoOperacionalCompacto(classificacao)
        : obterRotuloClassificacaoOperacional(classificacao)
    const rotuloBloqueio = compacto
        ? obterRotuloBloqueioRecebimentoCompacto(bloqueiaRecebimento)
        : obterRotuloBloqueioRecebimento(bloqueiaRecebimento === true)
    const bloqueado = bloqueiaRecebimento === true
    const temDetalhes = Boolean(motivo || origem)

    return (
        <div className={compacto ? 'flex max-w-[220px] flex-col gap-1.5' : 'flex flex-col gap-2'}>
            {classificacao && (
                <StatusBadge tone={obterTomClassificacaoOperacional(classificacao)}>
                    {rotuloClassificacao ?? 'Controle operacional'}
                </StatusBadge>
            )}

            {rotuloBloqueio && (
                <span
                    className={
                        bloqueado
                            ? 'inline-flex w-max whitespace-nowrap rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-200'
                            : 'inline-flex w-max whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200'
                    }
                >
                    {rotuloBloqueio}
                </span>
            )}

            {temDetalhes && (
                <details className="group max-w-[220px]">
                    <summary className="cursor-pointer select-none text-[11px] font-medium text-slate-400 outline-none transition hover:text-slate-200">
                        Ver detalhes
                    </summary>

                    <div className="mt-1 space-y-1 rounded-lg border border-slate-700 bg-slate-950/80 p-2">
                        {motivo && (
                            <p className="text-[11px] leading-relaxed text-slate-300" title={motivo}>
                                <span className="font-semibold text-slate-200">Motivo: </span>
                                {motivo}
                            </p>
                        )}

                        {origem && (
                            <p className="text-[10px] leading-relaxed text-slate-500">
                                Origem: {origem}
                            </p>
                        )}
                    </div>
                </details>
            )}
        </div>
    )
}



function itemBloqueadoParaRecebimento(
    item?: Pick<CompraItemDetalhado, 'bloqueia_recebimento'> | null
) {
    return item?.bloqueia_recebimento === true
}

function compraEhNotaOlist(compra: Pick<CompraResumo, 'numero_pedido'>) {
    return (compra.numero_pedido ?? '').startsWith('OLIST-NF-')
}

function compraCandidataLiberacaoRecebimentoReal(
    compra: Pick<
        CompraResumo,
        'numero_pedido' | 'classificacao_operacional_recebimento'
    >
) {
    return (
        compraEhNotaOlist(compra) &&
        compra.classificacao_operacional_recebimento ===
            'pendente_conferencia_operacional'
    )
}

function obterMotivoImpedimentoLiberacaoRecebimentoReal(
    compra: CompraResumo,
    itensDaCompra: CompraItemDetalhado[]
) {
    const classificacao = compra.classificacao_operacional_recebimento
    const statusCompra = (compra.status ?? '').toLowerCase()
    const totalItensResumo = Number(compra.quantidade_itens_distintos ?? 0)
    const possuiItens = totalItensResumo > 0 || itensDaCompra.length > 0
    const possuiItemRecebido = itensDaCompra.some(
        (item) => Number(item.quantidade_recebida ?? 0) > 0
    )

    if (!compraEhNotaOlist(compra)) {
        return 'A liberação automática é restrita a compras importadas do Olist.'
    }

    if (classificacao === 'historico_fiscal_sem_entrada_estoque') {
        return 'Esta NF está classificada como histórico fiscal e não deve gerar entrada de estoque.'
    }

    if (classificacao === 'recebimento_real') {
        return 'Esta compra já está liberada para recebimento real.'
    }

    if (classificacao !== 'pendente_conferencia_operacional') {
        return 'A compra ainda não está pendente de conferência operacional.'
    }

    if (compra.bloqueia_recebimento !== true) {
        return 'A compra não está bloqueada para conferência. Revise o controle operacional antes de liberar.'
    }

    if (!compra.local_destino_id) {
        return 'Informe o local de destino antes de liberar o recebimento real.'
    }

    if (statusCompra === 'recebido') {
        return 'A compra já está marcada como recebida.'
    }

    if (statusCompra === 'cancelado') {
        return 'A compra está cancelada.'
    }

    if (!possuiItens) {
        return 'A compra ainda não possui itens.'
    }

    if (possuiItemRecebido) {
        return 'A compra já possui item recebido. Não é seguro alterar a classificação por este botão.'
    }

    return null
}

function obterClasseLinhaItemCompra(statusRecebimento: string, selecionado: boolean) {
    if (selecionado) {
        return 'bg-emerald-500/10 hover:bg-emerald-500/20'
    }

    if (statusRecebimento === 'recebido') {
        return 'bg-emerald-500/5 hover:bg-emerald-500/10'
    }

    if (statusRecebimento === 'parcialmente_recebido') {
        return 'bg-cyan-500/5 hover:bg-cyan-500/10'
    }

    if (statusRecebimento === 'pendente') {
        return 'bg-yellow-500/5 hover:bg-yellow-500/10'
    }

    if (statusRecebimento === 'cancelado') {
        return 'bg-red-500/5 hover:bg-red-500/10'
    }

    return 'hover:bg-slate-800/60'
}

function calcularPercentualRecebido(item: CompraItemDetalhado) {
    const quantidade = Number(item.quantidade ?? 0)
    const quantidadeRecebida = Number(item.quantidade_recebida ?? 0)

    if (quantidade <= 0) {
        return 0
    }

    return Math.min(100, Math.max(0, (quantidadeRecebida / quantidade) * 100))
}

function obterStatusRecebimentoGrupo(itens: CompraItemDetalhado[]) {
    if (itens.length === 0) {
        return 'pendente'
    }

    const statusDosItens = itens.map((item) => obterStatusRecebimentoItem(item))

    if (statusDosItens.every((status) => status === 'cancelado')) {
        return 'cancelado'
    }

    if (statusDosItens.every((status) => status === 'recebido')) {
        return 'recebido'
    }

    if (
        statusDosItens.some(
            (status) => status === 'recebido' || status === 'parcialmente_recebido'
        )
    ) {
        return 'parcialmente_recebido'
    }

    return 'pendente'
}

function calcularPercentualRecebidoGrupo(
    quantidadeTotal: number,
    quantidadeRecebida: number
) {
    if (quantidadeTotal <= 0) {
        return 0
    }

    return Math.min(100, Math.max(0, (quantidadeRecebida / quantidadeTotal) * 100))
}



export function Compras() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando compras...')
    const [compras, setCompras] = useState<CompraResumo[]>([])
    const [itensCompras, setItensCompras] = useState<CompraItemDetalhado[]>([])
    const [notasConferenciaOlist, setNotasConferenciaOlist] = useState<NotaEntradaOlistConferencia[]>([])
    const [recebendoItemId, setRecebendoItemId] = useState<string | null>(null)
    const [liberandoRecebimentoCompraId, setLiberandoRecebimentoCompraId] =
        useState<string | null>(null)
    const [itemSelecionadoParaReceber, setItemSelecionadoParaReceber] =
        useState<CompraItemDetalhado | null>(null)
    const [sincronizandoNotasOlist, setSincronizandoNotasOlist] = useState(false)
    const [comprasItensExpandidas, setComprasItensExpandidas] = useState<string[]>([])
    const [
        ultimoResultadoSincronizacaoOlist,
        setUltimoResultadoSincronizacaoOlist,
    ] = useState<ResultadoSincronizacaoNotasEntradaOlist | null>(null)
    const [
        progressoSincronizacaoOlist,
        setProgressoSincronizacaoOlist,
    ] = useState<ProgressoSincronizacaoNotasEntradaOlist | null>(null)
    const [
        resumoSincronizacaoOlist,
        setResumoSincronizacaoOlist,
    ] = useState<ResumoSincronizacaoNotasEntradaOlist | null>(null)

    async function recarregarComprasEItens() {
        const [comprasResumo, itensDados, notasConferenciaDados] = await Promise.all([
            buscarComprasResumo(),
            buscarItensCompras(),
            buscarConferenciaNotasEntradaOlistCompras(),
        ])

        setCompras(comprasResumo)
        setItensCompras(itensDados)
        setNotasConferenciaOlist(notasConferenciaDados)

        if (comprasResumo.length === 0) {
            setMensagem('Consulta realizada com sucesso, mas nenhuma compra foi encontrada.')
        } else {
            setMensagem(`${comprasResumo.length} compra(s) encontrada(s).`)
        }
    }

    async function carregarDadosIniciais() {
        try {
            const [
                comprasResumo,
                itensDados,
                notasConferenciaDados,
            ] = await Promise.all([
                buscarComprasResumo(),
                buscarItensCompras(),
                buscarConferenciaNotasEntradaOlistCompras(),
            ])

            setCompras(comprasResumo)
            setItensCompras(itensDados)
            setNotasConferenciaOlist(notasConferenciaDados)
            setStatus('sucesso')

            if (comprasResumo.length === 0) {
                setMensagem('Consulta realizada com sucesso, mas nenhuma compra foi encontrada.')
            } else {
                setMensagem(`${comprasResumo.length} compra(s) encontrada(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar dados de compras.')
            }
        }
    }

    useEffect(() => {
        carregarDadosIniciais()
    }, [])

    async function buscarNotasOlistCompras() {
        const confirmarBusca = window.confirm(
            'Buscar NFs de compra no Olist?\n\nO sistema vai consultar as notas em chamadas pequenas, uma por vez, para evitar limite da Edge Function.\nEsta ação apenas sincroniza as NFs e itens para conferência. Ela não gera estoque, não cria lote e não confirma recebimento automaticamente.'
        )

        if (!confirmarBusca) {
            return
        }

        try {
            setSincronizandoNotasOlist(true)
            setStatus('carregando')
            setMensagem('Iniciando busca progressiva de NFs de compra no Olist...')
            setUltimoResultadoSincronizacaoOlist(null)
            setProgressoSincronizacaoOlist(null)
            setResumoSincronizacaoOlist(null)

            const resumoFinal = await buscarTodasNotasEntradaOlistCompras({
                offsetInicial: 0,
                maxNotas: 30,
                itemDelayMs: 2000,
                intervaloEntreChamadasMs: 1200,
                onProgresso: (progresso, resultadoParcial) => {
                    setProgressoSincronizacaoOlist(progresso)
                    setUltimoResultadoSincronizacaoOlist(resultadoParcial)

                    const totalTexto =
                        typeof progresso.totalReportado === 'number'
                            ? progresso.totalReportado
                            : '?'

                    setMensagem(
                        [
                            'Buscando NFs Olist...',
                            `Chamada ${progresso.chamadasRealizadas}.`,
                            `Offset atual: ${progresso.offsetAtual}.`,
                            `Próximo offset: ${progresso.proximoOffset}.`,
                            `Total Olist: ${totalTexto}.`,
                            progresso.ultimaNotaNumero
                                ? `Última NF: ${progresso.ultimaNotaNumero}.`
                                : '',
                        ]
                            .filter(Boolean)
                            .join(' ')
                    )
                },
            })

            setResumoSincronizacaoOlist(resumoFinal)
            await recarregarComprasEItens()

            setStatus('sucesso')
            setMensagem(
                [
                    'Busca progressiva de NFs Olist concluída.',
                    `Total informado pela Olist: ${resumoFinal.totalReportado ?? '?'}.`,
                    `Chamadas realizadas: ${resumoFinal.chamadasRealizadas}.`,
                    `Notas lidas: ${resumoFinal.notasLidas}.`,
                    `Notas inseridas: ${resumoFinal.notasInseridas}.`,
                    `Notas atualizadas: ${resumoFinal.notasAtualizadas}.`,
                    `Itens inseridos: ${resumoFinal.itensInseridos}.`,
                    `Itens atualizados: ${resumoFinal.itensAtualizados}.`,
                    `Erros em notas: ${resumoFinal.errosNotas}.`,
                    `Erros em itens: ${resumoFinal.errosItens}.`,
                    resumoFinal.limiteAtingido
                        ? 'Limite de segurança atingido; rode novamente para continuar.'
                        : 'Varredura concluída dentro do total informado pela Olist.',
                ].join(' ')
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao buscar NFs de compra no Olist.')
            }
        } finally {
            setSincronizandoNotasOlist(false)
        }
    }



    function selecionarItemParaRecebimento(item: CompraItemDetalhado) {
        if (itemBloqueadoParaRecebimento(item)) {
            setStatus('erro')
            setMensagem(
                item.motivo_bloqueio_recebimento ??
                'Este item pertence a uma compra bloqueada para recebimento.'
            )
            return
        }

        const quantidadePendente = item.quantidade - item.quantidade_recebida

        if (quantidadePendente <= 0 || item.status === 'cancelado') {
            setStatus('erro')
            setMensagem('Este item não possui quantidade pendente para receber.')
            return
        }

        setItemSelecionadoParaReceber(item)
        setStatus('sucesso')
        setMensagem(
            `Item ${item.produtos?.nome ?? item.produto_id} selecionado para conferência antes do recebimento.`
        )
    }



    function obterItensDaCompra(compraId: string) {
        return itensCompras.filter((item) => item.compra_id === compraId)
    }

    function alternarItensDaCompra(compraId: string) {
        setComprasItensExpandidas((comprasExpandidasAtuais) => {
            if (comprasExpandidasAtuais.includes(compraId)) {
                return comprasExpandidasAtuais.filter((id) => id !== compraId)
            }

            return [...comprasExpandidasAtuais, compraId]
        })
    }

    async function liberarRecebimentoRealCompra(compra: CompraResumo) {
        const itensDaCompra = obterItensDaCompra(compra.compra_id)
        const motivoImpedimento =
            obterMotivoImpedimentoLiberacaoRecebimentoReal(compra, itensDaCompra)

        if (motivoImpedimento) {
            setStatus('erro')
            setMensagem(motivoImpedimento)
            return
        }

        const confirmarLiberacao = window.confirm(
            `Você está prestes a liberar a NF ${
                compra.numero_nota_fiscal ?? compra.numero_pedido ?? ''
            } para recebimento real.\n\nDepois disso, os itens poderão ser recebidos e poderão gerar lote e entrada de estoque.\n\nConfirme somente se:\n- a mercadoria ainda não entrou no estoque Primely;\n- a NF não é apenas histórico fiscal;\n- os produtos, quantidades e custos foram conferidos.\n\nDeseja continuar?`
        )

        if (!confirmarLiberacao) {
            return
        }

        try {
            setLiberandoRecebimentoCompraId(compra.compra_id)
            setMensagem('Liberando compra para recebimento real...')

            await definirControleRecebimentoCompra(
                compra.compra_id,
                'recebimento_real',
                'NF conferida operacionalmente e liberada para recebimento real. Mercadoria ainda não entrou no estoque Primely.',
                'app_compras_liberacao_recebimento_real'
            )

            await recarregarComprasEItens()

            setStatus('sucesso')
            setMensagem(
                'Compra liberada para recebimento real. Nenhum item foi recebido automaticamente.'
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao liberar recebimento real.')
            }
        } finally {
            setLiberandoRecebimentoCompraId(null)
        }
    }

    async function receberItemPendente(item: CompraItemDetalhado) {
        if (itemBloqueadoParaRecebimento(item)) {
            setStatus('erro')
            setMensagem(
                item.motivo_bloqueio_recebimento ??
                'Este item pertence a uma compra bloqueada para recebimento.'
            )
            return
        }

        const quantidadePendente = item.quantidade - item.quantidade_recebida

        if (quantidadePendente <= 0) {
            setStatus('erro')
            setMensagem('Este item não possui quantidade pendente para receber.')
            return
        }

        try {
            setRecebendoItemId(item.id)
            setMensagem('Recebendo item da compra...')

            await receberItemCompra(item.id, quantidadePendente)

            await recarregarComprasEItens()
            setItemSelecionadoParaReceber(null)

            setStatus('sucesso')
            setMensagem('Item recebido com sucesso. Estoque e lote atualizados pelo Supabase.')
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao receber item da compra.')
            }
        } finally {
            setRecebendoItemId(null)
        }
    }

    const quantidadeTotalUnidades = compras.reduce((total, compra) => {
        return total + Number(compra.quantidade_total_unidades ?? 0)
    }, 0)

    const valorTotalEstimado = compras.reduce((total, compra) => {
        return total + Number(compra.valor_total_estimado ?? 0)
    }, 0)

    const comprasRecebidas = compras.filter(
        (compra) => compra.status === 'recebido'
    ).length

    const resumoStatusItensCompra = itensCompras.reduce(
        (resumo, item) => {
            const statusRecebimento = obterStatusRecebimentoItem(item)
            const pendente = Math.max(
                0,
                Number(item.quantidade ?? 0) - Number(item.quantidade_recebida ?? 0)
            )

            resumo.total += 1
            resumo.quantidadeComprada += Number(item.quantidade ?? 0)
            resumo.quantidadeRecebida += Number(item.quantidade_recebida ?? 0)
            resumo.quantidadePendente += pendente

            if (statusRecebimento === 'pendente') {
                resumo.pendentes += 1
            }

            if (statusRecebimento === 'parcialmente_recebido') {
                resumo.parciais += 1
            }

            if (statusRecebimento === 'recebido') {
                resumo.recebidos += 1
            }

            if (statusRecebimento === 'cancelado') {
                resumo.cancelados += 1
            }

            return resumo
        },
        {
            total: 0,
            pendentes: 0,
            parciais: 0,
            recebidos: 0,
            cancelados: 0,
            quantidadeComprada: 0,
            quantidadeRecebida: 0,
            quantidadePendente: 0,
        }
    )

    const comprasPorId = new Map<string, CompraResumo>(
        compras.map((compra) => [compra.compra_id, compra])
    )

    const gruposItensCompras = Array.from(
        itensCompras
            .reduce((grupos, item) => {
                const itensDoGrupo = grupos.get(item.compra_id) ?? []

                itensDoGrupo.push(item)
                grupos.set(item.compra_id, itensDoGrupo)

                return grupos
            }, new Map<string, CompraItemDetalhado[]>())
            .entries()
    ).map(([compraId, itens]) => {
        const quantidadeTotal = itens.reduce(
            (total, item) => total + Number(item.quantidade ?? 0),
            0
        )
        const quantidadeRecebida = itens.reduce(
            (total, item) => total + Number(item.quantidade_recebida ?? 0),
            0
        )
        const quantidadePendente = Math.max(
            0,
            quantidadeTotal - quantidadeRecebida
        )
        const statusRecebimento = obterStatusRecebimentoGrupo(itens)
        const percentualRecebido = calcularPercentualRecebidoGrupo(
            quantidadeTotal,
            quantidadeRecebida
        )

        return {
            compraId,
            compra: comprasPorId.get(compraId) ?? null,
            itens,
            quantidadeTotal,
            quantidadeRecebida,
            quantidadePendente,
            statusRecebimento,
            percentualRecebido,
        }
    })


    const resumoConferenciaOlist = notasConferenciaOlist.reduce(
        (resumo, nota) => {
            resumo.total += 1

            if (nota.status_processamento === 'processado') {
                resumo.processadas += 1
            }

            if (nota.status_processamento === 'pendente') {
                resumo.pendentes += 1
            }

            if (nota.status_processamento === 'erro') {
                resumo.comErro += 1
            }

            if (nota.status_processamento === 'ignorado') {
                resumo.ignoradas += 1
            }

            if (nota.status_conferencia === 'pronta_para_converter') {
                resumo.prontasParaConverter += 1
            }

            if (nota.status_conferencia === 'pendente_conversao_unidade') {
                resumo.pendentesConversao += 1
            }

            resumo.itens += Number(nota.total_itens ?? 0)
            resumo.itensComErro += Number(nota.total_itens_com_erro ?? 0)
            resumo.itensVinculados += Number(nota.total_itens_vinculados ?? 0)

            return resumo
        },
        {
            total: 0,
            processadas: 0,
            pendentes: 0,
            comErro: 0,
            ignoradas: 0,
            prontasParaConverter: 0,
            pendentesConversao: 0,
            itens: 0,
            itensComErro: 0,
            itensVinculados: 0,
        }
    )

    const compraDoItemSelecionadoParaReceber = itemSelecionadoParaReceber
        ? compras.find(
            (compra) => compra.compra_id === itemSelecionadoParaReceber.compra_id
        ) ?? null
        : null

    const quantidadePendenteItemSelecionado = itemSelecionadoParaReceber
        ? itemSelecionadoParaReceber.quantidade - itemSelecionadoParaReceber.quantidade_recebida
        : 0

    const valorEstoqueAReceber = itemSelecionadoParaReceber
        ? quantidadePendenteItemSelecionado * itemSelecionadoParaReceber.custo_unitario
        : 0

    return (
        <div className="w-full min-w-0 space-y-5">
            <PageHeader
                tag="Módulo"
                title="Compras"
                description="Painel de conferência e liberação gerencial de Notas Fiscais de Entrada importadas do Olist. Esta tela realiza a conferência física e liberação de recebimento gerencial dos lotes de compra."
            />

            <AppCard className="sm:p-5 lg:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">
                            Ações rápidas de compras
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Utilize o botão ao lado para sincronizar e atualizar as Notas Fiscais diretamente do Olist.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                        <AppButton
                            type="button"
                            variant="primary"
                            disabled={sincronizandoNotasOlist}
                            onClick={buscarNotasOlistCompras}
                        >
                            {sincronizandoNotasOlist
                                ? 'Buscando NFs...'
                                : 'Buscar NFs Olist'}
                        </AppButton>
                    </div>
                </div>
            </AppCard>



            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AppCard className="sm:p-5 lg:p-6">
                    <p className="text-sm text-slate-400">Compras encontradas</p>
                    <p className="mt-3 text-3xl font-bold">{compras.length}</p>
                </AppCard>

                <AppCard className="sm:p-5 lg:p-6">
                    <p className="text-sm text-slate-400">Compras recebidas</p>
                    <p className="mt-3 text-3xl font-bold">{comprasRecebidas}</p>
                </AppCard>

                <AppCard className="sm:p-5 lg:p-6">
                    <p className="text-sm text-slate-400">Unidades compradas</p>
                    <p className="mt-3 text-3xl font-bold">{quantidadeTotalUnidades}</p>
                </AppCard>

                <AppCard className="sm:p-5 lg:p-6">
                    <p className="text-sm text-slate-400">Valor total estimado</p>
                    <p className="mt-3 text-3xl font-bold">
                        {formatarMoeda(valorTotalEstimado)}
                    </p>
                </AppCard>
            </div>

            <AppCard className="sm:p-5 lg:p-6">
                <p className="text-sm text-slate-400">Status da consulta:</p>

                <p
                    className={
                        status === 'sucesso'
                            ? 'mt-2 text-xl font-semibold text-emerald-400'
                            : status === 'erro'
                                ? 'mt-2 text-xl font-semibold text-red-400'
                                : 'mt-2 text-xl font-semibold text-yellow-400'
                    }
                >
                    {status}
                </p>

                <p className="mt-3 text-slate-300">{mensagem}</p>

                {progressoSincronizacaoOlist && (
                    <div className="mt-4 rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-4">
                        <p className="text-sm font-semibold text-cyan-200">
                            Progresso da busca Olist
                        </p>

                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
                            <div>
                                <p className="text-slate-500">Total Olist</p>
                                <p className="font-semibold text-slate-100">
                                    {progressoSincronizacaoOlist.totalReportado ?? '?'}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Chamadas</p>
                                <p className="font-semibold text-slate-100">
                                    {progressoSincronizacaoOlist.chamadasRealizadas}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Offset atual</p>
                                <p className="font-semibold text-cyan-300">
                                    {progressoSincronizacaoOlist.offsetAtual}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Próximo offset</p>
                                <p className="font-semibold text-cyan-300">
                                    {progressoSincronizacaoOlist.proximoOffset}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Última NF</p>
                                <p className="font-semibold text-slate-100">
                                    {progressoSincronizacaoOlist.ultimaNotaNumero ?? '-'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <p className="text-slate-500">Notas lidas acumuladas</p>
                                <p className="font-semibold text-slate-100">
                                    {progressoSincronizacaoOlist.notasLidas}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Notas inseridas</p>
                                <p className="font-semibold text-emerald-300">
                                    {progressoSincronizacaoOlist.notasInseridas}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Notas atualizadas</p>
                                <p className="font-semibold text-cyan-300">
                                    {progressoSincronizacaoOlist.notasAtualizadas}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Erros acumulados</p>
                                <p className="font-semibold text-red-300">
                                    {progressoSincronizacaoOlist.errosNotas +
                                        progressoSincronizacaoOlist.errosItens}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {resumoSincronizacaoOlist && (
                    <div className="mt-4 rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-4">
                        <p className="text-sm font-semibold text-emerald-200">
                            Resumo final da busca Olist
                        </p>

                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <p className="text-slate-500">Total informado</p>
                                <p className="font-semibold text-slate-100">
                                    {resumoSincronizacaoOlist.totalReportado ?? '?'}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Chamadas realizadas</p>
                                <p className="font-semibold text-slate-100">
                                    {resumoSincronizacaoOlist.chamadasRealizadas}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Notas inseridas</p>
                                <p className="font-semibold text-emerald-300">
                                    {resumoSincronizacaoOlist.notasInseridas}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Notas atualizadas</p>
                                <p className="font-semibold text-cyan-300">
                                    {resumoSincronizacaoOlist.notasAtualizadas}
                                </p>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                            A busca importa/atualiza snapshots da Olist em chamadas pequenas. Estoque, lotes e recebimentos não são criados automaticamente.
                        </p>
                    </div>
                )}

                {ultimoResultadoSincronizacaoOlist?.result && (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-sm font-semibold text-slate-200">
                            Última chamada Olist
                        </p>

                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <p className="text-slate-500">Notas lidas</p>
                                <p className="font-semibold text-slate-100">
                                    {ultimoResultadoSincronizacaoOlist.result.received_count ?? 0}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Notas inseridas</p>
                                <p className="font-semibold text-emerald-300">
                                    {ultimoResultadoSincronizacaoOlist.result.inserted_notas_count ?? 0}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Notas atualizadas</p>
                                <p className="font-semibold text-cyan-300">
                                    {ultimoResultadoSincronizacaoOlist.result.updated_notas_count ?? 0}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Erros</p>
                                <p className="font-semibold text-red-300">
                                    {(ultimoResultadoSincronizacaoOlist.result.notas_errors_count ?? 0) +
                                        (ultimoResultadoSincronizacaoOlist.result.items_errors_count ?? 0)}
                                </p>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                            Esta é apenas a última chamada individual feita durante a busca progressiva.
                        </p>
                    </div>
                )}
            </AppCard>

            <AppCard className="sm:p-5 lg:p-6">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Conferência dos snapshots Olist</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Acompanhamento dos snapshots salvos no Supabase. Este painel não representa necessariamente o total atual filtrado na Olist; ele mostra o que já foi importado para conferência antes de virar compra.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            Snapshots: {resumoConferenciaOlist.total}
                        </span>
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            Itens: {resumoConferenciaOlist.itens}
                        </span>
                    </div>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Snapshots no banco</p>
                        <p className="mt-2 text-2xl font-bold text-slate-100">{resumoConferenciaOlist.total}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Viraram compra</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-300">{resumoConferenciaOlist.processadas}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Pendentes no snapshot</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-300">{resumoConferenciaOlist.pendentes}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Com erro</p>
                        <p className="mt-2 text-2xl font-bold text-red-300">{resumoConferenciaOlist.comErro}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Ignoradas</p>
                        <p className="mt-2 text-2xl font-bold text-slate-300">{resumoConferenciaOlist.ignoradas}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Prontas para compra</p>
                        <p className="mt-2 text-2xl font-bold text-cyan-300">{resumoConferenciaOlist.prontasParaConverter}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Pend. conversão/produto</p>
                        <p className="mt-2 text-2xl font-bold text-orange-300">{resumoConferenciaOlist.pendentesConversao}</p>
                    </div>
                </div>

                <div className="mb-5 rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-4 text-sm text-cyan-100">
                    <p className="font-semibold">Como ler este painel</p>
                    <p className="mt-2 text-cyan-100/80">
                        O número de snapshots pode ser diferente do total exibido na Olist, porque aqui aparecem registros já salvos no Supabase, inclusive notas ignoradas ou importadas em testes anteriores. Para saber o total atual informado pela Olist, use o resumo final exibido logo após clicar em “Buscar NFs Olist”.
                    </p>
                </div>

                {notasConferenciaOlist.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                        Nenhum snapshot Olist importado para conferência no momento.
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="px-4 py-3 font-medium">NF</th>
                                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                                    <th className="px-4 py-3 font-medium">Processamento</th>
                                    <th className="px-4 py-3 font-medium">Conferência</th>
                                    <th className="px-4 py-3 font-medium">Itens</th>
                                    <th className="px-4 py-3 font-medium">Vinculados</th>
                                    <th className="px-4 py-3 font-medium">Erros</th>
                                    <th className="px-4 py-3 font-medium">Compra</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {notasConferenciaOlist.map((nota) => (
                                    <tr key={`${nota.numero}-${nota.compra_id ?? 'sem-compra'}`} className="hover:bg-slate-800/70">
                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            {nota.numero ?? '-'}
                                        </td>
                                        <td className="max-w-[320px] px-4 py-3 text-slate-300">
                                            <span className="line-clamp-2 break-words">
                                                {nota.fornecedor_nome ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge tone={obterTomStatusProcessamentoOlist(nota.status_processamento)}>
                                                {obterRotuloStatusProcessamentoOlist(nota.status_processamento)}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge tone={obterTomStatusConferenciaOlist(nota.status_conferencia)}>
                                                {obterRotuloStatusConferenciaOlist(nota.status_conferencia)}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            {nota.total_itens ?? 0}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-emerald-300">
                                            {nota.total_itens_vinculados ?? 0}
                                        </td>
                                        <td className={(nota.total_itens_com_erro ?? 0) > 0 ? 'px-4 py-3 font-semibold text-red-300' : 'px-4 py-3 font-semibold text-slate-400'}>
                                            {nota.total_itens_com_erro ?? 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge tone={nota.compra_id ? 'success' : 'muted'}>
                                                {nota.compra_id ? 'Vinculada' : 'Aguardando'}
                                            </StatusBadge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataTableContainer>
                )}

                <p className="mt-3 text-xs text-slate-500">
                    Este painel é apenas de conferência. Ele não cria estoque, lote ou recebimento automático.
                </p>
            </AppCard>

            <AppCard className="sm:p-5 lg:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold">Itens das compras</h2>

                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            NFs: {gruposItensCompras.length}
                        </span>
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            Itens: {itensCompras.length}
                        </span>
                    </div>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Itens pendentes</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-300">
                            {resumoStatusItensCompra.pendentes}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Parciais</p>
                        <p className="mt-2 text-2xl font-bold text-cyan-300">
                            {resumoStatusItensCompra.parciais}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Recebidos</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-300">
                            {resumoStatusItensCompra.recebidos}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Cancelados</p>
                        <p className="mt-2 text-2xl font-bold text-red-300">
                            {resumoStatusItensCompra.cancelados}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Unidades recebidas</p>
                        <p className="mt-2 text-2xl font-bold text-slate-100">
                            {resumoStatusItensCompra.quantidadeRecebida}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Unidades pendentes</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-300">
                            {resumoStatusItensCompra.quantidadePendente}
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm font-semibold text-slate-200">
                        Legenda dos itens de compra
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-yellow-300">
                            Pendente: nada recebido
                        </span>
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                            Parcial: parte recebida
                        </span>
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                            Recebido: pendência zerada
                        </span>
                        <span className="inline-flex w-max whitespace-nowrap items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-300">
                            Cancelado: item não deve ser recebido
                        </span>
                    </div>
                </div>

                {itemSelecionadoParaReceber && (
                    <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-emerald-200">
                                    Conferência antes de receber o item
                                </p>

                                <p className="mt-2 text-sm text-emerald-100/80">
                                    Confira produto, compra, local de destino, quantidade pendente e lote antes de lançar a entrada no estoque.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <AppButton
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setItemSelecionadoParaReceber(null)}
                                >
                                    Cancelar
                                </AppButton>

                                <AppButton
                                    type="button"
                                    variant="success"
                                    disabled={
                                        recebendoItemId === itemSelecionadoParaReceber.id ||
                                        itemBloqueadoParaRecebimento(itemSelecionadoParaReceber)
                                    }
                                    onClick={() => receberItemPendente(itemSelecionadoParaReceber)}
                                >
                                    {recebendoItemId === itemSelecionadoParaReceber.id
                                        ? 'Recebendo...'
                                        : 'Confirmar recebimento'}
                                </AppButton>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Compra</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.compras?.numero_pedido ?? '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4 lg:col-span-2">
                                <p className="text-xs text-slate-400">Produto</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.produtos?.nome ?? itemSelecionadoParaReceber.produto_id}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Local de destino</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {compraDoItemSelecionadoParaReceber?.local_destino_nome ?? '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Pendente</p>
                                <p className="mt-1 font-semibold text-emerald-300">
                                    {quantidadePendenteItemSelecionado}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Valor a receber</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(valorEstoqueAReceber)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Quantidade comprada</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.quantidade}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Já recebida</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.quantidade_recebida}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Lote</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.lote ?? 'Sem lote informado'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {gruposItensCompras.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum item de compra para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="px-4 py-3 font-medium">Compra / NF</th>
                                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                                    <th className="px-4 py-3 font-medium">Itens</th>
                                    <th className="px-4 py-3 font-medium">Unidades</th>
                                    <th className="px-4 py-3 font-medium">Recebidas</th>
                                    <th className="px-4 py-3 font-medium">Pendentes</th>
                                    <th className="px-4 py-3 font-medium">Progresso</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {gruposItensCompras.map((grupo) => {
                                    const compra = grupo.compra
                                    const expandido = comprasItensExpandidas.includes(
                                        grupo.compraId
                                    )
                                    const bloqueadaParaRecebimento =
                                        compra?.bloqueia_recebimento ??
                                        grupo.itens.some((item) => item.bloqueia_recebimento)
                                    const numeroCompra =
                                        compra?.numero_pedido ??
                                        grupo.itens[0]?.compras?.numero_pedido ??
                                        '-'
                                    const numeroNotaFiscal =
                                        compra?.numero_nota_fiscal ?? '-'

                                    return (
                                        <Fragment key={grupo.compraId}>
                                            <tr
                                                className={
                                                    expandido
                                                        ? 'bg-cyan-500/10 hover:bg-cyan-500/20'
                                                        : 'hover:bg-slate-800/60'
                                                }
                                            >
                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex min-w-[150px] flex-col gap-1">
                                                        <span className="font-semibold text-slate-100">
                                                            {numeroCompra}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            NF: {numeroNotaFiscal}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 align-top text-slate-300">
                                                    <span className="line-clamp-3 max-w-[260px] break-words">
                                                        {compra?.fornecedor_nome ?? '-'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 align-top font-semibold text-slate-100">
                                                    {grupo.itens.length}
                                                </td>

                                                <td className="px-4 py-3 align-top font-semibold text-slate-100">
                                                    {grupo.quantidadeTotal}
                                                </td>

                                                <td className="px-4 py-3 align-top font-semibold text-emerald-300">
                                                    {grupo.quantidadeRecebida}
                                                </td>

                                                <td
                                                    className={
                                                        grupo.quantidadePendente > 0
                                                            ? 'px-4 py-3 align-top font-semibold text-yellow-300'
                                                            : 'px-4 py-3 align-top font-semibold text-emerald-300'
                                                    }
                                                >
                                                    {grupo.quantidadePendente}
                                                </td>

                                                <td className="px-4 py-3 align-top">
                                                    <div className="w-32">
                                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                                            <span>
                                                                {Math.round(grupo.percentualRecebido)}%
                                                            </span>
                                                            <span>
                                                                {grupo.quantidadeRecebida}/{grupo.quantidadeTotal}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-400"
                                                                style={{
                                                                    width: `${grupo.percentualRecebido}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex max-w-[220px] flex-col gap-2">
                                                        <StatusBadge
                                                            tone={obterTomStatusRecebimento(
                                                                grupo.statusRecebimento
                                                            )}
                                                        >
                                                            {obterRotuloStatusRecebimento(
                                                                grupo.statusRecebimento
                                                            )}
                                                        </StatusBadge>

                                                        {compra ? (
                                                            <ControleRecebimentoResumo
                                                                classificacao={
                                                                    compra.classificacao_operacional_recebimento
                                                                }
                                                                bloqueiaRecebimento={
                                                                    compra.bloqueia_recebimento
                                                                }
                                                                motivo={
                                                                    compra.motivo_bloqueio_recebimento
                                                                }
                                                                origem={
                                                                    compra.origem_controle_recebimento
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="text-[11px] text-slate-500">
                                                                Resumo da compra indisponível.
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 align-top">
                                                    <div className="flex max-w-[180px] flex-col gap-2">
                                                        <AppButton
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() =>
                                                                alternarItensDaCompra(grupo.compraId)
                                                            }
                                                        >
                                                            {expandido ? 'Ocultar itens' : 'Ver itens'}
                                                        </AppButton>

                                                        {bloqueadaParaRecebimento && (
                                                            <span className="text-[11px] font-semibold text-red-200">
                                                                Recebimento bloqueado
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {expandido && (
                                                <tr className="bg-slate-950/70">
                                                    <td colSpan={9} className="px-4 py-4">
                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
                                                            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-100">
                                                                        Itens da {numeroCompra}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        Lista detalhada dos produtos desta NF/compra.
                                                                    </p>
                                                                </div>

                                                                <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                                                    {grupo.itens.length} item(ns)
                                                                </span>
                                                            </div>

                                                            <div className="overflow-x-auto">
                                                                <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
                                                                    <thead className="text-slate-500">
                                                                        <tr>
                                                                            <th className="px-3 py-2 font-medium">Produto</th>
                                                                            <th className="px-3 py-2 font-medium">SKU</th>
                                                                            <th className="px-3 py-2 font-medium">Qtd.</th>
                                                                            <th className="px-3 py-2 font-medium">Recebida</th>
                                                                            <th className="px-3 py-2 font-medium">Pendente</th>
                                                                            <th className="px-3 py-2 font-medium">Progresso</th>
                                                                            <th className="px-3 py-2 font-medium">Custo unit.</th>
                                                                            <th className="px-3 py-2 font-medium">Lote</th>
                                                                            <th className="px-3 py-2 font-medium">Status</th>
                                                                            <th className="px-3 py-2 font-medium">Ações</th>
                                                                        </tr>
                                                                    </thead>

                                                                    <tbody className="divide-y divide-slate-800">
                                                                        {grupo.itens.map((item) => {
                                                                            const pendente = Math.max(
                                                                                0,
                                                                                Number(item.quantidade ?? 0) -
                                                                                    Number(item.quantidade_recebida ?? 0)
                                                                            )
                                                                            const statusRecebimento =
                                                                                obterStatusRecebimentoItem(item)
                                                                            const percentualRecebido =
                                                                                calcularPercentualRecebido(item)
                                                                            const bloqueadoParaRecebimento =
                                                                                itemBloqueadoParaRecebimento(item)
                                                                            const podeReceber =
                                                                                !bloqueadoParaRecebimento &&
                                                                                pendente > 0 &&
                                                                                statusRecebimento !== 'cancelado'

                                                                            return (
                                                                                <tr
                                                                                    key={item.id}
                                                                                    className={obterClasseLinhaItemCompra(
                                                                                        statusRecebimento,
                                                                                        itemSelecionadoParaReceber?.id === item.id
                                                                                    )}
                                                                                >
                                                                                    <td className="max-w-[340px] px-3 py-3 text-slate-300">
                                                                                        <span className="line-clamp-2 break-words">
                                                                                            {item.produtos?.nome ?? item.produto_id}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-3 py-3 text-slate-300">
                                                                                        {item.produtos?.sku ?? '-'}
                                                                                    </td>

                                                                                    <td className="px-3 py-3 font-semibold text-slate-100">
                                                                                        {item.quantidade}
                                                                                    </td>

                                                                                    <td className="px-3 py-3 font-semibold text-emerald-300">
                                                                                        {item.quantidade_recebida}
                                                                                    </td>

                                                                                    <td
                                                                                        className={
                                                                                            pendente > 0
                                                                                                ? 'px-3 py-3 font-semibold text-yellow-300'
                                                                                                : 'px-3 py-3 font-semibold text-emerald-300'
                                                                                        }
                                                                                    >
                                                                                        {pendente}
                                                                                    </td>

                                                                                    <td className="px-3 py-3">
                                                                                        <div className="w-28">
                                                                                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                                                                <span>
                                                                                                    {Math.round(percentualRecebido)}%
                                                                                                </span>
                                                                                                <span>
                                                                                                    {item.quantidade_recebida}/{item.quantidade}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                                                                                <div
                                                                                                    className="h-full rounded-full bg-emerald-400"
                                                                                                    style={{
                                                                                                        width: `${percentualRecebido}%`,
                                                                                                    }}
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>

                                                                                    <td className="px-3 py-3 text-slate-300">
                                                                                        {formatarMoeda(item.custo_unitario)}
                                                                                    </td>

                                                                                    <td className="px-3 py-3 text-slate-300">
                                                                                        {item.lote ?? '-'}
                                                                                    </td>

                                                                                    <td className="px-3 py-3 align-top">
                                                                                        <div className="flex max-w-[200px] flex-col gap-2">
                                                                                            <StatusBadge
                                                                                                tone={obterTomStatusRecebimento(
                                                                                                    statusRecebimento
                                                                                                )}
                                                                                            >
                                                                                                {obterRotuloStatusRecebimento(
                                                                                                    statusRecebimento
                                                                                                )}
                                                                                            </StatusBadge>

                                                                                            {item.status !== statusRecebimento && (
                                                                                                <span className="text-[11px] text-slate-500">
                                                                                                    Original: {item.status}
                                                                                                </span>
                                                                                            )}

                                                                                            <ControleRecebimentoResumo
                                                                                                classificacao={
                                                                                                    item.classificacao_operacional_recebimento
                                                                                                }
                                                                                                bloqueiaRecebimento={
                                                                                                    item.bloqueia_recebimento
                                                                                                }
                                                                                                motivo={
                                                                                                    item.motivo_bloqueio_recebimento
                                                                                                }
                                                                                                origem={
                                                                                                    item.origem_controle_recebimento
                                                                                                }
                                                                                            />
                                                                                        </div>
                                                                                    </td>

                                                                                    <td className="px-3 py-3">
                                                                                        <AppButton
                                                                                            type="button"
                                                                                            variant="secondary"
                                                                                            size="sm"
                                                                                            disabled={
                                                                                                !podeReceber || recebendoItemId === item.id
                                                                                            }
                                                                                            onClick={() => selecionarItemParaRecebimento(item)}
                                                                                        >
                                                                                            {bloqueadoParaRecebimento
                                                                                                ? 'Bloqueado'
                                                                                                : recebendoItemId === item.id
                                                                                                    ? 'Recebendo...'
                                                                                                    : podeReceber
                                                                                                        ? 'Conferir recebimento'
                                                                                                        : statusRecebimento === 'cancelado'
                                                                                                            ? 'Cancelado'
                                                                                                            : 'Recebido'}
                                                                                        </AppButton>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </DataTableContainer>
                )}
            </AppCard>

            <AppCard className="sm:p-5 lg:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold">Compras encontradas</h2>

                    <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {compras.length}
                    </span>
                </div>

                {compras.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhuma compra para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="px-4 py-3 font-medium">Pedido</th>
                                    <th className="px-4 py-3 font-medium">Nota fiscal</th>
                                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                                    <th className="px-4 py-3 font-medium">Local destino</th>
                                    <th className="px-4 py-3 font-medium">Data compra</th>
                                    <th className="px-4 py-3 font-medium">Prev. entrega</th>
                                    <th className="px-4 py-3 font-medium">Recebimento</th>
                                    <th className="px-4 py-3 font-medium">Itens</th>
                                    <th className="px-4 py-3 font-medium">Unidades</th>
                                    <th className="px-4 py-3 font-medium">Valor produtos</th>
                                    <th className="px-4 py-3 font-medium">Frete</th>
                                    <th className="px-4 py-3 font-medium">Total estimado</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

<tbody className="divide-y divide-slate-800 bg-slate-900">
                                {compras.map((compra) => {
                                    const itensDaCompra = obterItensDaCompra(compra.compra_id)
                                    const candidataLiberacaoRecebimentoReal =
                                        compraCandidataLiberacaoRecebimentoReal(compra)
                                    const motivoImpedimentoLiberacao =
                                        obterMotivoImpedimentoLiberacaoRecebimentoReal(
                                            compra,
                                            itensDaCompra
                                        )
                                    const podeLiberarRecebimentoReal =
                                        candidataLiberacaoRecebimentoReal &&
                                        !motivoImpedimentoLiberacao
                                    const liberandoRecebimentoReal =
                                        liberandoRecebimentoCompraId === compra.compra_id

                                    return (
                                        <tr
                                            key={compra.compra_id}
                                            className="hover:bg-slate-800/60"
                                        >
                                        <td className="px-4 py-3 text-slate-100">
                                            {compra.numero_pedido ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.numero_nota_fiscal ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.fornecedor_nome ?? compra.fornecedor_id ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.local_destino_nome ??
                                                compra.local_destino_id ??
                                                '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(compra.data_compra)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(compra.data_prevista_entrega)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(compra.data_recebimento)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.quantidade_itens_distintos ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.quantidade_total_unidades ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(compra.valor_bruto_produtos)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(compra.valor_frete)}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            {formatarMoeda(compra.valor_total_estimado)}
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div className="flex max-w-[220px] flex-col gap-2">
                                                <StatusBadge tone={obterTomStatus(compra.status)}>
                                                    {compra.status}
                                                </StatusBadge>

                                                <ControleRecebimentoResumo
                                                    classificacao={compra.classificacao_operacional_recebimento}
                                                    bloqueiaRecebimento={compra.bloqueia_recebimento}
                                                    motivo={compra.motivo_bloqueio_recebimento}
                                                    origem={compra.origem_controle_recebimento}
                                                />
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 align-top">
                                            <div className="flex max-w-[180px] flex-col gap-2">
                                                {candidataLiberacaoRecebimentoReal ? (
                                                    <>
                                                        <AppButton
                                                            type="button"
                                                            variant={
                                                                podeLiberarRecebimentoReal
                                                                    ? 'primary'
                                                                    : 'secondary'
                                                            }
                                                            size="sm"
                                                            disabled={
                                                                !podeLiberarRecebimentoReal ||
                                                                liberandoRecebimentoReal
                                                            }
                                                            onClick={() =>
                                                                liberarRecebimentoRealCompra(compra)
                                                            }
                                                        >
                                                            {liberandoRecebimentoReal
                                                                ? 'Liberando...'
                                                                : 'Liberar recebimento real'}
                                                        </AppButton>

                                                        {motivoImpedimentoLiberacao && (
                                                            <span
                                                                className="text-[11px] leading-relaxed text-slate-500"
                                                                title={motivoImpedimentoLiberacao}
                                                            >
                                                                {motivoImpedimentoLiberacao}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-500">-</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </DataTableContainer>
                )}
            </AppCard>
        </div>
    )
}
