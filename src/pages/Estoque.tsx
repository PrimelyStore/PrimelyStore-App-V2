import { useEffect, useState, useMemo } from 'react'
import {
    buscarEstoqueConsolidadoV4,
    calcularResumoEstoqueConsolidadoV4,
    type EstoqueConsolidadoV4Item,
    type ResumoEstoqueConsolidadoV4,
} from '../services/estoqueService'
import {
    AppCard,
    DataTableContainer,
    PageHeader,
    StatCard,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

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

export function Estoque() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando estoque consolidado...')
    const [itens, setItens] = useState<EstoqueConsolidadoV4Item[]>([])
    const [resumo, setResumo] = useState<ResumoEstoqueConsolidadoV4 | null>(null)
    const [abaAtiva, setAbaAtiva] = useState<'consolidado' | 'conciliacao' | 'alertas'>('consolidado')
    const [busca, setBusca] = useState('')

    async function carregarDados() {
        try {
            setStatus('carregando')
            setMensagem('Consultando dados de snapshots de estoque e curva ABC...')
            const dados = await buscarEstoqueConsolidadoV4()
            const calculoResumo = calcularResumoEstoqueConsolidadoV4(dados)
            setItens(dados)
            setResumo(calculoResumo)
            setStatus('sucesso')
            setMensagem(`${dados.length} SKU(s) carregado(s) com sucesso.`)
        } catch (error) {
            setStatus('erro')
            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar o estoque consolidado.')
            }
        }
    }

    useEffect(() => {
        carregarDados()
    }, [])

    const itensFiltrados = useMemo(() => {
        if (!busca.trim()) return itens
        const termo = busca.toLowerCase()
        return itens.filter(
            (item) =>
                item.sku.toLowerCase().includes(termo) ||
                item.produto_nome.toLowerCase().includes(termo)
        )
    }, [itens, busca])

    const itensComDivergencia = useMemo(() => {
        return itensFiltrados.filter((item) => item.status_divergencia !== 'Sem divergência')
    }, [itensFiltrados])

    const itensRuptura = useMemo(() => {
        return itensFiltrados.filter((item) => item.alerta_ruptura_fba)
    }, [itensFiltrados])

    const itensExcesso = useMemo(() => {
        return itensFiltrados.filter((item) => item.alerta_excesso_fba)
    }, [itensFiltrados])

    if (status === 'carregando') {
        return (
            <div className="mx-auto w-full max-w-full space-y-6">
                <PageHeader
                    tag="MÓDULO"
                    title="Estoque Consolidado"
                    description="Painel gerencial de consolidação e auditoria de estoque (Prep Center, Olist FBA e Amazon SP-API)."
                />
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-4 text-slate-300 font-medium">{mensagem}</p>
                </div>
            </div>
        )
    }

    if (status === 'erro') {
        return (
            <div className="mx-auto w-full max-w-full space-y-6">
                <PageHeader
                    tag="MÓDULO"
                    title="Estoque Consolidado"
                    description="Painel gerencial de consolidação e auditoria de estoque (Prep Center, Olist FBA e Amazon SP-API)."
                />
                <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-center">
                    <p className="text-lg font-semibold text-red-400">⚠️ Erro ao carregar estoque consolidado</p>
                    <p className="mt-2 text-slate-300 text-sm">{mensagem}</p>
                    <button
                        onClick={carregarDados}
                        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <PageHeader
                tag="MÓDULO"
                title="Estoque Consolidado"
                description="Painel gerencial de consolidação e auditoria de estoque (Prep Center, Olist FBA e Amazon SP-API)."
            />

            {/* Banner de Aviso Somente Leitura */}
            <div className="rounded-xl border border-indigo-950 bg-indigo-950/30 p-3 text-xs text-indigo-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span>🛡️</span>
                    <strong>Painel Gerencial Somente Leitura:</strong> Esta página não realiza movimentação física de estoque ou alteração no ERP.
                </span>
                <button
                    onClick={carregarDados}
                    className="text-indigo-400 hover:text-indigo-200 transition-colors font-medium cursor-pointer"
                >
                    🔄 Recarregar dados
                </button>
            </div>

            {/* KPIs Globais */}
            {resumo && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        label="SKUs Monitorados"
                        value={resumo.total_skus}
                        tone="default"
                        description="Total de SKUs únicos mapeados"
                    />
                    <StatCard
                        label="Saldo Prep Center"
                        value={resumo.total_prep_center}
                        tone="info"
                        description="Estoque físico Olist Geral"
                    />
                    <StatCard
                        label="FBA Lógico Olist"
                        value={resumo.total_fba_olist}
                        tone="purple"
                        description="Saldo FBA declarado no ERP"
                    />
                    <StatCard
                        label="FBA Físico Amazon"
                        value={resumo.total_fba_amazon}
                        tone="success"
                        description="Saldo físico real na SP-API"
                    />
                    <StatCard
                        label="SKUs Divergentes"
                        value={resumo.skus_com_divergencia}
                        tone={resumo.skus_com_divergencia > 0 ? 'warning' : 'success'}
                        description="Olist FBA vs Amazon"
                    />
                </div>
            )}

            {/* Abas de Navegação */}
            <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-px">
                <button
                    onClick={() => setAbaAtiva('consolidado')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'consolidado'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Visão Consolidada
                </button>
                <button
                    onClick={() => setAbaAtiva('conciliacao')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                        abaAtiva === 'conciliacao'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    <span>Conciliação FBA</span>
                    {resumo && resumo.skus_com_divergencia > 0 && (
                        <span className="bg-yellow-900/50 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {resumo.skus_com_divergencia}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setAbaAtiva('alertas')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                        abaAtiva === 'alertas'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    <span>Alertas de Inventário</span>
                    {resumo && (resumo.skus_com_ruptura + resumo.skus_com_excesso) > 0 && (
                        <span className="bg-red-950 text-red-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {resumo.skus_com_ruptura + resumo.skus_com_excesso}
                        </span>
                    )}
                </button>
            </div>

            {/* Conteúdo das Abas */}
            {abaAtiva === 'consolidado' && (
                <AppCard>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Buscar SKU ou Produto..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                            />
                            {busca && (
                                <button
                                    onClick={() => setBusca('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {resumo?.atualizado_em && (
                            <span className="text-xs text-slate-500">
                                Sincronizado em: {formatarDataHora(resumo.atualizado_em)}
                            </span>
                        )}
                    </div>

                    <DataTableContainer>
                        <table className="w-full min-w-[1000px] border-collapse text-left text-xs sm:text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="px-3 py-3 font-medium sm:px-4">SKU</th>
                                    <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                    <th className="px-3 py-3 font-medium sm:px-4 text-center">ASIN</th>
                                    <th className="px-3 py-3 font-medium sm:px-4 text-right">Prep Center (Olist Geral)</th>
                                    <th className="px-3 py-3 font-medium sm:px-4 text-right">FBA Lógico (Olist FBA)</th>
                                    <th className="px-3 py-3 font-medium sm:px-4 text-right">FBA Físico (Amazon)</th>
                                    <th className="px-3 py-3 font-medium sm:px-4 text-right">Divergência FBA</th>
                                    <th className="px-3 py-3 font-medium sm:px-4 text-center">Status Conciliação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {itensFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                            Nenhum item correspondente aos filtros foi encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    itensFiltrados.map((item) => {
                                        const div = item.divergencia_fba
                                        const divColorClass =
                                            div > 0
                                                ? 'text-yellow-300 font-medium'
                                                : div < 0
                                                    ? 'text-cyan-300 font-medium'
                                                    : 'text-slate-400'

                                        const badgeTone =
                                            item.status_divergencia === 'Olist sobrando'
                                                ? 'warning'
                                                : item.status_divergencia === 'Amazon sobrando'
                                                    ? 'info'
                                                    : 'success'

                                        return (
                                            <tr key={item.sku} className="hover:bg-slate-800/40">
                                                <td className="px-3 py-3 font-mono text-slate-300 sm:px-4 select-all">
                                                    {item.sku}
                                                </td>
                                                <td className="px-3 py-3 font-medium text-slate-100 sm:px-4 max-w-[300px] truncate" title={item.produto_nome}>
                                                    {item.produto_nome}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono text-slate-400 sm:px-4">
                                                    {item.asin ?? '-'}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-slate-200 sm:px-4">
                                                    {item.saldo_prep_center}
                                                    {item.reservado_prep_center > 0 && (
                                                        <span className="text-[10px] text-slate-500 block font-normal">
                                                            ({item.disponivel_prep_center} disp / {item.reservado_prep_center} res)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-slate-200 sm:px-4">
                                                    {item.saldo_fba_olist}
                                                    {item.reservado_fba_olist > 0 && (
                                                        <span className="text-[10px] text-slate-500 block font-normal">
                                                            ({item.disponivel_fba_olist} disp / {item.reservado_fba_olist} res)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-slate-200 sm:px-4">
                                                    {item.saldo_fba_amazon}
                                                    {(item.reservado_fba_amazon > 0 || item.indisponivel_fba_amazon > 0) && (
                                                        <span className="text-[10px] text-slate-500 block font-normal">
                                                            ({item.disponivel_fba_amazon} disp / {item.reservado_fba_amazon} res / {item.indisponivel_fba_amazon} ind)
                                                        </span>
                                                    )}
                                                </td>
                                                <td className={`px-3 py-3 text-right sm:px-4 ${divColorClass}`}>
                                                    {div > 0 ? `+${div}` : div}
                                                </td>
                                                <td className="px-3 py-3 text-center sm:px-4">
                                                    <StatusBadge tone={badgeTone}>
                                                        {item.status_divergencia}
                                                    </StatusBadge>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </DataTableContainer>
                </AppCard>
            )}

            {abaAtiva === 'conciliacao' && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-yellow-900/40 bg-yellow-950/20 p-4 text-sm text-yellow-200">
                        <p className="font-semibold flex items-center gap-2">
                            ⚠️ Auditoria de Saldos FBA Lógico vs Físico
                        </p>
                        <p className="mt-1 text-xs text-yellow-300/80 leading-relaxed">
                            A divergência é calculada como <strong>Saldo Olist FBA (Lógico) - Saldo Amazon FBA (Físico SP-API)</strong>. 
                            Divergências positivas (Olist sobrando) indicam que o ERP registra um saldo superior ao reportado pela Amazon. 
                            Divergências negativas (Amazon sobrando) sugerem que a Amazon possui mais estoque do que o registrado no ERP.
                        </p>
                    </div>

                    <AppCard>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-semibold">SKUs com Discrepâncias de Estoque FBA</h3>
                            <span className="text-xs text-slate-400">
                                Mostrando apenas divergências diferentes de zero
                            </span>
                        </div>

                        <DataTableContainer>
                            <table className="w-full min-w-[1000px] border-collapse text-left text-xs sm:text-sm">
                                <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                    <tr>
                                        <th className="px-3 py-3 font-medium sm:px-4">SKU</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">ASIN</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Olist FBA (Lógico)</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Amazon FBA (Físico)</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Divergência FBA</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">Classificação</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Ação Recomendada</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {itensComDivergencia.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-emerald-400 font-medium">
                                                ✓ Excelente! Nenhum SKU com divergência de saldo entre Olist FBA e Amazon FBA.
                                            </td>
                                        </tr>
                                    ) : (
                                        itensComDivergencia.map((item) => {
                                            const div = item.divergencia_fba
                                            const isOlistSobrando = item.status_divergencia === 'Olist sobrando'
                                            const divColorClass = isOlistSobrando ? 'text-yellow-300 font-medium' : 'text-cyan-300 font-medium'

                                            return (
                                                <tr key={item.sku} className="hover:bg-slate-800/40">
                                                    <td className="px-3 py-3 font-mono text-slate-300 sm:px-4 select-all">
                                                        {item.sku}
                                                    </td>
                                                    <td className="px-3 py-3 font-medium text-slate-100 sm:px-4 max-w-[280px] truncate" title={item.produto_nome}>
                                                        {item.produto_nome}
                                                    </td>
                                                    <td className="px-3 py-3 text-center font-mono text-slate-400 sm:px-4">
                                                        {item.asin ?? '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-semibold text-slate-200 sm:px-4">
                                                        {item.saldo_fba_olist}
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-semibold text-slate-200 sm:px-4">
                                                        {item.saldo_fba_amazon}
                                                    </td>
                                                    <td className={`px-3 py-3 text-right sm:px-4 ${divColorClass}`}>
                                                        {div > 0 ? `+${div}` : div}
                                                    </td>
                                                    <td className="px-3 py-3 text-center sm:px-4">
                                                        <StatusBadge tone={isOlistSobrando ? 'warning' : 'info'}>
                                                            {item.status_divergencia}
                                                        </StatusBadge>
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-300 sm:px-4 text-xs leading-relaxed">
                                                        {isOlistSobrando 
                                                            ? 'Ajustar saldo no Olist para refletir o físico real ou verificar devoluções.'
                                                            : 'Aguardar entrada física na Amazon ou solicitar conciliação de remessa.'}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>
                </div>
            )}

            {abaAtiva === 'alertas' && (
                <div className="space-y-6">
                    {/* Bloco Ruptura */}
                    <AppCard>
                        <div className="mb-4 font-sans">
                            <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                                <span>🚨</span> Ruptura FBA — Oportunidade de Remessa para a Amazon
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                SKUs de alta performance (Curva A ou B) que estão esgotados no FBA da Amazon, porém possuem estoque disponível no Prep Center (Olist Geral) pronto para ser enviado.
                            </p>
                        </div>

                        <DataTableContainer>
                            <table className="w-full min-w-[900px] border-collapse text-left text-xs sm:text-sm">
                                <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                    <tr>
                                        <th className="px-3 py-3 font-medium sm:px-4">SKU</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">Curva ABC</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Disponível Prep Center</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Disponível FBA Amazon</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">Giro (Vendas 30d)</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Oportunidade Gerencial</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {itensRuptura.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-emerald-400 font-medium">
                                                ✓ Nenhuma ruptura crítica de SKUs Curva A/B detectada. O FBA está abastecido ou o Prep Center não possui saldo para envio.
                                            </td>
                                        </tr>
                                    ) : (
                                        itensRuptura.map((item) => (
                                            <tr key={item.sku} className="hover:bg-slate-800/40">
                                                <td className="px-3 py-3 font-mono text-slate-300 sm:px-4 select-all">
                                                    {item.sku}
                                                </td>
                                                <td className="px-3 py-3 font-medium text-slate-100 sm:px-4 max-w-[280px] truncate" title={item.produto_nome}>
                                                    {item.produto_nome}
                                                </td>
                                                <td className="px-3 py-3 text-center sm:px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                                        item.curva_faturamento === 'A' 
                                                            ? 'bg-violet-950 text-violet-300' 
                                                            : 'bg-indigo-950 text-indigo-300'
                                                    }`}>
                                                        Curva {item.curva_faturamento}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-emerald-300 sm:px-4">
                                                    {item.disponivel_prep_center}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-red-300 sm:px-4">
                                                    {item.disponivel_fba_amazon}
                                                </td>
                                                <td className="px-3 py-3 text-center font-semibold text-slate-300 sm:px-4">
                                                    {item.quantidade_vendida_curva} un
                                                </td>
                                                <td className="px-3 py-3 text-emerald-400 sm:px-4 text-xs font-medium leading-relaxed">
                                                    Enviar até {item.disponivel_prep_center} unidades para a Amazon.
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>

                    {/* Bloco Excesso */}
                    <AppCard>
                        <div className="mb-4 font-sans">
                            <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                                <span>📦</span> Alerta de Excesso FBA — Estoque Parado com Risco de Taxas
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                SKUs com volume de estoque elevado no FBA da Amazon (&gt; 100 unidades) que apresentaram baixa saída (menos de 5 vendas nas últimas semanas), gerando risco de taxas de armazenamento de longo prazo.
                            </p>
                        </div>

                        <DataTableContainer>
                            <table className="w-full min-w-[900px] border-collapse text-left text-xs sm:text-sm">
                                <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                    <tr>
                                        <th className="px-3 py-3 font-medium sm:px-4">SKU</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">Curva ABC</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Disponível Amazon FBA</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">Giro (Vendas 30d)</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Recomendação Gerencial</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {itensExcesso.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-emerald-400 font-medium">
                                                ✓ Nenhum SKU com excesso de estoque e baixo giro no FBA Amazon.
                                            </td>
                                        </tr>
                                    ) : (
                                        itensExcesso.map((item) => (
                                            <tr key={item.sku} className="hover:bg-slate-800/40">
                                                <td className="px-3 py-3 font-mono text-slate-300 sm:px-4 select-all">
                                                    {item.sku}
                                                </td>
                                                <td className="px-3 py-3 font-medium text-slate-100 sm:px-4 max-w-[280px] truncate" title={item.produto_nome}>
                                                    {item.produto_nome}
                                                </td>
                                                <td className="px-3 py-3 text-center sm:px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                                        item.curva_faturamento === 'C' 
                                                            ? 'bg-slate-800 text-slate-300' 
                                                            : 'bg-yellow-950 text-yellow-300'
                                                    }`}>
                                                        Curva {item.curva_faturamento ?? 'C'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-yellow-300 sm:px-4">
                                                    {item.disponivel_fba_amazon}
                                                </td>
                                                <td className="px-3 py-3 text-center font-semibold text-red-300 sm:px-4">
                                                    {item.quantidade_vendida_curva} un
                                                </td>
                                                <td className="px-3 py-3 text-slate-300 sm:px-4 text-xs leading-relaxed">
                                                    Avaliar campanhas de cupons, redução temporária de preço ou publicidade de sponsoring.
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>
                </div>
            )}

            {/* Banner de Governança */}
            <footer className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
                <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">ℹ️</span>
                    <div>
                        <h4 className="font-semibold text-slate-300">Nota de Governança & Metodologia Gerencial</h4>
                        <p className="mt-1 leading-relaxed">
                            Esta tela atua estritamente como um <strong>painel de visualização e análise de estoque consolidado (somente leitura)</strong>. 
                            Ela não realiza movimentações físicas de mercadoria, não faz transferências de depósitos, não executa baixas FIFO automáticas e não substitui o ERP oficial (Olist/Tiny), que permanece como a única fonte da verdade operacional.
                        </p>
                        <p className="mt-1 leading-relaxed">
                            Os saldos exibidos são capturados a partir dos últimos snapshots gerados das integrações com o Olist e com a Amazon SP-API.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
