import { useEffect, useState, useMemo } from 'react'
import {
    buscarKpisGerenciaisV3,
    buscarFaturamentoPorCanalV3,
    buscarTendenciaFaturamentoV3,
    buscarPedidosRecentesOlistV3,
    buscarNotasEntradaRecentesV3,
    buscarEstoqueConsolidadoV3,
    buscarAlertasGerenciaisV3,
    type DashboardKpisV3,
    type FaturamentoPorCanalV3,
    type TendenciaFaturamentoV3,
    type PedidoRecenteOlistV3,
    type NotaEntradaRecenteV3,
    type EstoqueConsolidadoV3,
    type AlertaGerencialV3,
} from '../services/dashboardService'
import {
    AppCard,
    AppButton,
    DataTableContainer,
    PageHeader,
    StatCard,
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

function formatarMoeda(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(valor ?? 0))
}

function formatarNumero(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0))
}

function formatarPercentual(valor?: number | string | null) {
    return `${Number(valor ?? 0).toFixed(2)}%`
}

function formatarData(data?: string | null) {
    if (!data) return '-'
    const dataConvertida = new Date(data)
    if (Number.isNaN(dataConvertida.getTime())) return data
    return new Intl.DateTimeFormat('pt-BR').format(dataConvertida)
}

function formatarDataHora(data?: string | null) {
    if (!data) return '-'
    const dataConvertida = new Date(data)
    if (Number.isNaN(dataConvertida.getTime())) return data
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(dataConvertida)
}

export function Dashboard() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando dashboard gerencial...')

    // Filtros Temporais
    const [filtroDataInicio, setFiltroDataInicio] = useState('')
    const [filtroDataFim, setFiltroDataFim] = useState('')

    // Dados Gerenciais V3
    const [kpis, setKpis] = useState<DashboardKpisV3 | null>(null)
    const [faturamentoCanais, setFaturamentoCanais] = useState<FaturamentoPorCanalV3[]>([])
    const [tendencia, setTendencia] = useState<TendenciaFaturamentoV3[]>([])
    const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecenteOlistV3[]>([])
    const [notasRecentes, setNotasRecentes] = useState<NotaEntradaRecenteV3[]>([])
    const [estoqueConsolidado, setEstoqueConsolidado] = useState<EstoqueConsolidadoV3[]>([])
    const [alertas, setAlertas] = useState<AlertaGerencialV3[]>([])

    // Filtros Locais para listagens
    const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'notas' | 'estoque'>('pedidos')
    const [buscaEstoque, setBuscaEstoque] = useState('')

    async function carregarDashboard(dataInicio?: string, dataFim?: string) {
        try {
            setStatus('carregando')
            setMensagem('Carregando dashboard gerencial e saúde das integrações...')

            const [
                dadosKpis,
                dadosCanais,
                dadosTendencia,
                dadosPedidos,
                dadosNotas,
                dadosEstoque,
                dadosAlertas,
            ] = await Promise.all([
                buscarKpisGerenciaisV3(dataInicio, dataFim),
                buscarFaturamentoPorCanalV3(dataInicio, dataFim),
                buscarTendenciaFaturamentoV3(dataInicio, dataFim),
                buscarPedidosRecentesOlistV3(15),
                buscarNotasEntradaRecentesV3(10).catch(() => []),
                buscarEstoqueConsolidadoV3(),
                buscarAlertasGerenciaisV3(),
            ])

            setKpis(dadosKpis)
            setFaturamentoCanais(dadosCanais)
            setTendencia(dadosTendencia)
            setPedidosRecentes(dadosPedidos)
            setNotasRecentes(dadosNotas)
            setEstoqueConsolidado(dadosEstoque)
            setAlertas(dadosAlertas)

            setStatus('sucesso')
            setMensagem('Dashboard gerencial carregado com sucesso.')
        } catch (error) {
            setStatus('erro')
            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar dashboard.')
            }
        }
    }

    useEffect(() => {
        carregarDashboard()
    }, [])

    const handleFiltrar = () => {
        carregarDashboard(filtroDataInicio, filtroDataFim)
    }

    const handleLimparFiltros = () => {
        setFiltroDataInicio('')
        setFiltroDataFim('')
        carregarDashboard()
    }

    // Calcula faturamento máximo da tendência para escalonar as barras verticais do gráfico
    const faturamentoMaximo = useMemo(() => {
        if (tendencia.length === 0) return 0
        return Math.max(...tendencia.map((t) => t.faturamento))
    }, [tendencia])

    // Filtra o estoque consolidado localmente
    const estoqueFiltrado = useMemo(() => {
        if (!buscaEstoque.trim()) return estoqueConsolidado
        const termo = buscaEstoque.trim().toLowerCase()
        return estoqueConsolidado.filter(
            (item) =>
                item.sku?.toLowerCase().includes(termo) ||
                item.produto_nome?.toLowerCase().includes(termo) ||
                item.deposito_nome?.toLowerCase().includes(termo)
        )
    }, [buscaEstoque, estoqueConsolidado])

    return (
        <div className="space-y-6">
            <PageHeader
                tag="INTELIGÊNCIA EXECUTIVA"
                title="Dashboard Gerencial V3"
                description="Visão analítica de performance consolidando faturamento, margens gerenciais, estoques físicos do Prep Center e Amazon FBA."
            />

            {/* Painel de Filtros e Saúde */}
            <AppCard className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between py-4">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-400">
                        Data inicial
                        <input
                            type="date"
                            value={filtroDataInicio}
                            onChange={(e) => setFiltroDataInicio(e.target.value)}
                            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none transition focus:border-cyan-500"
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-[11px] font-semibold text-slate-400">
                        Data final
                        <input
                            type="date"
                            value={filtroDataFim}
                            onChange={(e) => setFiltroDataFim(e.target.value)}
                            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 outline-none transition focus:border-cyan-500"
                        />
                    </label>
                    <div className="flex items-end gap-2 pt-5">
                        <AppButton size="sm" onClick={handleFiltrar} disabled={status === 'carregando'}>
                            Filtrar
                        </AppButton>
                        {(filtroDataInicio || filtroDataFim) && (
                            <AppButton size="sm" variant="secondary" onClick={handleLimparFiltros}>
                                Limpar
                            </AppButton>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end lg:self-auto text-xs text-slate-400">
                    <div className="text-right">
                        <p className="font-semibold text-slate-300">Atualizado em (snapshot)</p>
                        <p className="text-[11px] text-slate-500">{formatarDataHora(kpis?.atualizado_em)}</p>
                    </div>
                    <StatusBadge tone={status === 'sucesso' ? 'success' : status === 'erro' ? 'danger' : 'warning'}>
                        {status === 'sucesso' ? 'Online' : status === 'erro' ? 'Erro' : 'Carregando'}
                    </StatusBadge>
                </div>
            </AppCard>

            {/* Avisos & Mensagem de Erro */}
            {status === 'erro' && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    <p className="font-semibold">Erro ao processar dados gerenciais:</p>
                    <p className="mt-1 text-xs text-red-200/80">{mensagem}</p>
                </div>
            )}

            {/* Alertas Gerenciais Inteligentes */}
            {alertas.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Alertas Gerenciais Ativos</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {alertas.map((alerta, idx) => (
                            <AppCard key={idx} className="border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-300">{alerta.titulo}</p>
                                        <StatusBadge tone={obterTomStatus(alerta.severidade)}>
                                            {alerta.severidade.toUpperCase()}
                                        </StatusBadge>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">{alerta.descricao}</p>
                                </div>
                                {alerta.detalhes && (
                                    <p className="mt-3 text-[10px] font-mono text-slate-500 bg-slate-900/60 p-1.5 rounded-lg line-clamp-1">
                                        {alerta.detalhes}
                                    </p>
                                )}
                            </AppCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Seção 1: KPIs Principais */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard
                    label="Faturamento Olist"
                    value={formatarMoeda(kpis?.faturamento_total)}
                    description="Bruto gerencial (sem cancelados)"
                    tone="success"
                />
                <StatCard
                    label="Pedidos Importados"
                    value={formatarNumero(kpis?.total_pedidos)}
                    description={`${formatarNumero(kpis?.total_itens_vendidos)} unidade(s) vendida(s)`}
                    tone="purple"
                />
                <StatCard
                    label="Ticket Médio"
                    value={formatarMoeda(kpis?.ticket_medio)}
                    description="Valor médio por faturamento"
                    tone="info"
                />
                <StatCard
                    label="Lucro Estimado"
                    value={formatarMoeda(kpis?.lucro_estimado_total)}
                    description={`Margem média: ${formatarPercentual(kpis?.margem_media_estimada)}`}
                    tone="success"
                />
                <StatCard
                    label="Estoque Consolidado"
                    value={formatarNumero((kpis?.estoque_total_prep_center ?? 0) + (kpis?.estoque_total_amazon_fba ?? 0))}
                    description={`Prep Center: ${formatarNumero(kpis?.estoque_total_prep_center)} • FBA: ${formatarNumero(kpis?.estoque_total_amazon_fba)}`}
                    tone="info"
                />
                <StatCard
                    label="Saúde de Custos"
                    value={formatarNumero(kpis?.total_produtos_sem_custo)}
                    description="SKUs ativos vendidos sem custo"
                    tone={Number(kpis?.total_produtos_sem_custo ?? 0) > 0 ? 'warning' : 'default'}
                />
            </div>

            {/* Seção 2: Gráficos de Canais e Tendência */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Gráfico de Canais de Venda */}
                <AppCard className="lg:col-span-5 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-200">Participação por Canal (Marketplace)</h3>
                        <p className="mt-1 text-xs text-slate-400">Distribuição do faturamento por marketplace de origem</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {faturamentoCanais.length === 0 ? (
                            <p className="text-center py-12 text-xs text-slate-500">Nenhuma venda registrada no período.</p>
                        ) : (
                            faturamentoCanais.map((c) => (
                                <div key={c.canal} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                                        <span>{c.canal}</span>
                                        <span className="font-mono">{formatarMoeda(c.faturamento)} ({c.participacao_percentual.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-900">
                                        <div
                                            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                                            style={{ width: `${c.participacao_percentual}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-900/50 text-[10px] text-slate-500">
                        * Representa a consolidação gerencial de pedidos ativos.
                    </div>
                </AppCard>

                {/* Tendência Diária */}
                <AppCard className="lg:col-span-7 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-200">Tendência Diária de Vendas</h3>
                        <p className="mt-1 text-xs text-slate-400">Evolução do faturamento diário gerencial</p>
                    </div>

                    <div className="mt-6">
                        {tendencia.length === 0 ? (
                            <p className="text-center py-20 text-xs text-slate-500">Nenhum dado temporal disponível.</p>
                        ) : (
                            <div className="flex h-48 items-end gap-2 border-b border-slate-800 pb-2 overflow-x-auto min-w-full">
                                {tendencia.map((t, idx) => {
                                    const altura = faturamentoMaximo > 0 ? (t.faturamento / faturamentoMaximo) * 100 : 0
                                    return (
                                        <div key={t.data || idx} className="group relative flex flex-1 flex-col items-center min-w-[20px]">
                                            <div
                                                className="w-full rounded-t bg-cyan-500/80 transition hover:bg-cyan-400"
                                                style={{ height: `${Math.max(altura, 4)}%` }}
                                            />
                                            <span className="mt-2 text-[9px] text-slate-500 font-mono rotate-45 origin-left whitespace-nowrap">
                                                {t.data ? t.data.slice(8, 10) + '/' + t.data.slice(5, 7) : '-'}
                                            </span>

                                            {/* Tooltip */}
                                            <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-[10px] text-slate-200 group-hover:block z-10 min-w-[130px] shadow-2xl">
                                                <p className="font-bold border-b border-slate-800 pb-1 mb-1">{formatarData(t.data)}</p>
                                                <p className="text-cyan-400">Fat: <span className="font-mono">{formatarMoeda(t.faturamento)}</span></p>
                                                <p className="text-slate-400">Pedidos: <span className="font-mono">{t.pedidos}</span></p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-900/50 text-[10px] text-slate-500 flex justify-between">
                        <span>Eixo X: Dia do Mês</span>
                        <span>Faturamento total ativo</span>
                    </div>
                </AppCard>
            </div>

            {/* Seção 3: Abas e Listagens Detalhadas de Apoio */}
            <AppCard>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
                    {/* Botões das Abas */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setAbaAtiva('pedidos')}
                            className={`pb-2 text-sm font-semibold transition border-b-2 px-1 ${
                                abaAtiva === 'pedidos'
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Pedidos Recentes Olist ({pedidosRecentes.length})
                        </button>
                        <button
                            onClick={() => setAbaAtiva('notas')}
                            className={`pb-2 text-sm font-semibold transition border-b-2 px-1 ${
                                abaAtiva === 'notas'
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Notas Fiscais de Entrada ({notasRecentes.length})
                        </button>
                        <button
                            onClick={() => setAbaAtiva('estoque')}
                            className={`pb-2 text-sm font-semibold transition border-b-2 px-1 ${
                                abaAtiva === 'estoque'
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Estoque Consolidado ({estoqueConsolidado.length})
                        </button>
                    </div>

                    {/* Filtro de Busca na Tabela de Estoque */}
                    {abaAtiva === 'estoque' && (
                        <input
                            type="search"
                            placeholder="Buscar por SKU ou Produto..."
                            value={buscaEstoque}
                            onChange={(e) => setBuscaEstoque(e.target.value)}
                            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-cyan-500 w-full sm:w-60"
                        />
                    )}
                </div>

                <div className="mt-4">
                    {/* Aba: Pedidos Recentes */}
                    {abaAtiva === 'pedidos' && (
                        <DataTableContainer maxHeightClassName="max-h-[380px]">
                            <table className="w-full min-w-[960px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-4 py-2.5 font-semibold">Código Olist</th>
                                        <th className="px-4 py-2.5 font-semibold">Pedido</th>
                                        <th className="px-4 py-2.5 font-semibold">Canal</th>
                                        <th className="px-4 py-2.5 font-semibold">Data Pedido</th>
                                        <th className="px-4 py-2.5 font-semibold">Valor Total</th>
                                        <th className="px-4 py-2.5 font-semibold">Situação</th>
                                        <th className="px-4 py-2.5 font-semibold">Sincronizado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                                    {pedidosRecentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                Nenhum pedido recente encontrado no snapshot.
                                            </td>
                                        </tr>
                                    ) : (
                                        pedidosRecentes.map((ped, idx) => (
                                            <tr key={idx} className="hover:bg-slate-850/40">
                                                <td className="px-4 py-2.5 font-mono text-cyan-400">{ped.id_pedido_olist}</td>
                                                <td className="px-4 py-2.5 text-slate-200 font-semibold">{ped.numero_pedido || ped.numero_pedido_ecommerce || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-300">{ped.canal_gerencial}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{formatarData(ped.data_pedido)}</td>
                                                <td className="px-4 py-2.5 font-mono text-slate-200 font-semibold">{formatarMoeda(ped.valor_total)}</td>
                                                <td className="px-4 py-2.5">
                                                    <StatusBadge tone={obterTomStatusGerencial(ped.status_gerencial)}>
                                                        {ped.status_gerencial ? ped.status_gerencial.replace(/_/g, ' ') : '-'}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-400">{formatarDataHora(ped.sincronizado_em)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    )}

                    {/* Aba: Notas Recentes */}
                    {abaAtiva === 'notas' && (
                        <DataTableContainer maxHeightClassName="max-h-[380px]">
                            <table className="w-full min-w-[960px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-4 py-2.5 font-semibold">Código NF Olist</th>
                                        <th className="px-4 py-2.5 font-semibold">Número NF</th>
                                        <th className="px-4 py-2.5 font-semibold">Fornecedor</th>
                                        <th className="px-4 py-2.5 font-semibold">Data Emissão</th>
                                        <th className="px-4 py-2.5 font-semibold">Valor Total</th>
                                        <th className="px-4 py-2.5 font-semibold">Itens</th>
                                        <th className="px-4 py-2.5 font-semibold">Processamento</th>
                                        <th className="px-4 py-2.5 font-semibold">Sincronizado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                                    {notasRecentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                                Nenhuma nota fiscal encontrada no snapshot.
                                            </td>
                                        </tr>
                                    ) : (
                                        notasRecentes.map((nota, idx) => (
                                            <tr key={idx} className="hover:bg-slate-850/40">
                                                <td className="px-4 py-2.5 font-mono text-cyan-400">{nota.id_nota_olist}</td>
                                                <td className="px-4 py-2.5 text-slate-200 font-semibold">{nota.numero_nf || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-300">{nota.fornecedor_nome || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{formatarData(nota.data_emissao)}</td>
                                                <td className="px-4 py-2.5 font-mono text-slate-200 font-semibold">{formatarMoeda(nota.valor_total_nf)}</td>
                                                <td className="px-4 py-2.5 text-slate-300">{nota.total_itens_nf} item(ns)</td>
                                                <td className="px-4 py-2.5">
                                                    <StatusBadge tone={obterTomStatusProcessamento(nota.status_processamento)}>
                                                        {nota.status_processamento || 'Desconhecido'}
                                                    </StatusBadge>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-400">{formatarDataHora(nota.sincronizado_em)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    )}

                    {/* Aba: Estoque Consolidado */}
                    {abaAtiva === 'estoque' && (
                        <DataTableContainer maxHeightClassName="max-h-[380px]">
                            <table className="w-full min-w-[960px] divide-y divide-slate-800 text-left text-xs">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-4 py-2.5 font-semibold">SKU</th>
                                        <th className="px-4 py-2.5 font-semibold">Produto</th>
                                        <th className="px-4 py-2.5 font-semibold">Local de Estoque</th>
                                        <th className="px-4 py-2.5 font-semibold">Depósito de Origem</th>
                                        <th className="px-4 py-2.5 font-semibold">Disponível</th>
                                        <th className="px-4 py-2.5 font-semibold">Reservado</th>
                                        <th className="px-4 py-2.5 font-semibold">Saldo Total</th>
                                        <th className="px-4 py-2.5 font-semibold">Atualização</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                                    {estoqueFiltrado.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                                Nenhum saldo de estoque consolidado corresponde à busca.
                                            </td>
                                        </tr>
                                    ) : (
                                        estoqueFiltrado.map((est, idx) => (
                                            <tr key={idx} className="hover:bg-slate-850/40">
                                                <td className="px-4 py-2.5 font-mono text-cyan-400 font-bold">{est.sku || '-'}</td>
                                                <td className="px-4 py-2.5 text-slate-200 leading-relaxed max-w-[320px] whitespace-normal">{est.produto_nome || '-'}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 ${
                                                        est.local_estoque === 'Amazon FBA' 
                                                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                                                            : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                                    }`}>
                                                        {est.local_estoque}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-300">{est.deposito_nome || '-'}</td>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-emerald-400">{formatarNumero(est.saldo_disponivel)}</td>
                                                <td className="px-4 py-2.5 font-mono text-amber-400">{formatarNumero(est.saldo_reservado)}</td>
                                                <td className="px-4 py-2.5 font-mono font-semibold text-slate-200">{formatarNumero(est.saldo_total)}</td>
                                                <td className="px-4 py-2.5 text-slate-400">{formatarDataHora(est.sincronizado_em)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    )}
                </div>
            </AppCard>

            {/* Metodologia de Cálculo Discreta */}
            <AppCard className="bg-slate-950/40 border-slate-900/60 p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nota Metodológica & Governança</h4>
                <p className="mt-2 text-xs text-slate-550 leading-relaxed">
                    <strong>Margem e Lucros Estimados:</strong> Os lucros e as margens exibidos neste painel são 
                    estimados gerencialmente a partir do custo médio ponderado das Notas Fiscais de Entrada e dos snapshots 
                    de vendas no Olist. Estes valores servem exclusivamente para o apoio à tomada de decisão estratégica (como no controle de precificação e Curva ABC) 
                    e <strong>não substituem os relatórios fiscais e contábeis oficiais</strong> providos pelo ERP Olist/Tiny.
                </p>
                <p className="mt-2 text-xs text-slate-550 leading-relaxed">
                    <strong>Governança de Estoque:</strong> Em total conformidade com as regras conceituais da V3, este painel é <strong>estritamente somente leitura</strong> 
                    e não realiza movimentações físicas de estoque, reprocessamentos, baixas FIFO ou recebimentos. Toda a operação diária 
                    está centralizada no ERP operacional.
                </p>
            </AppCard>
        </div>
    )
}

// ─── Auxiliares Locais de Estilização ───────────────────────────────────────

function obterTomStatus(sev: AlertaGerencialV3['severidade']): StatusBadgeTone {
    if (sev === 'alto') return 'danger'
    if (sev === 'medio') return 'warning'
    return 'info'
}

function obterTomStatusGerencial(status?: string | null): StatusBadgeTone {
    const s = status?.toLowerCase() || ''
    if (s.includes('processado') || s.includes('sucesso')) return 'success'
    if (s.includes('erro') || s.includes('falha')) return 'danger'
    if (s.includes('pendente') || s.includes('analise')) return 'warning'
    return 'muted'
}

function obterTomStatusProcessamento(status?: string | null): StatusBadgeTone {
    const s = status?.toLowerCase() || ''
    if (s === 'processado' || s === 'sucesso') return 'success'
    if (s === 'erro') return 'danger'
    if (s === 'pendente') return 'warning'
    return 'muted'
}
