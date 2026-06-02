import { useEffect, useMemo, useState } from 'react'
import {
    buscarCurvaAbc,
    calcularResumoCurvaAbc,
    type CurvaAbcItem,
    type CurvaAbcResumo,
} from '../services/curvaAbcService'
import {
    AppCard,
    DataTableContainer,
    PageHeader,
    StatCard,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'

// ─── Helpers ─────────────────────────────────────────────────────────────────

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'
type NumeroBanco = number | string | null | undefined

function toNum(v: NumeroBanco): number {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
        const n = Number(v)
        return Number.isNaN(n) ? 0 : n
    }
    return 0
}

function toNumNullable(v: NumeroBanco): number | null {
    if (v === null || v === undefined) return null
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
        const n = Number(v)
        return Number.isNaN(n) ? null : n
    }
    return null
}

function formatarMoeda(v: NumeroBanco) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNum(v))
}

function formatarMoedaNullable(v: NumeroBanco) {
    const n = toNumNullable(v)
    if (n === null) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function formatarNumero(v: NumeroBanco) {
    return new Intl.NumberFormat('pt-BR').format(toNum(v))
}

function formatarPercentual(v: NumeroBanco, casas = 2) {
    const n = toNumNullable(v)
    if (n === null) return '-'
    return `${n.toFixed(casas).replace('.', ',')}%`
}

// ─── Classificação da curva por faturamento ────────────────────────────────

type CurvaTipo = string | null

function tomCurvaFat(curva: CurvaTipo): 'success' | 'warning' | 'info' | 'muted' {
    if (curva === 'A') return 'success'
    if (curva === 'B') return 'warning'
    if (curva === 'C') return 'info'
    return 'muted'
}

// ─── Cores de margem ──────────────────────────────────────────────────────

function tomCurvaMargem(curva: CurvaTipo): 'success' | 'warning' | 'danger' | 'muted' {
    if (curva === 'A') return 'success'
    if (curva === 'B') return 'warning'
    if (curva === 'C') return 'danger'
    return 'muted'
}

function labelCurvaMargem(curva: CurvaTipo): string {
    if (curva === 'A') return 'M-A ≥30%'
    if (curva === 'B') return 'M-B 10-30%'
    if (curva === 'C') return 'M-C <10%'
    if (curva === 'sem_custo') return 'Sem custo'
    return '-'
}

function classeMargem(v: NumeroBanco): string {
    const n = toNumNullable(v)
    if (n === null) return 'text-slate-500 italic'
    if (n >= 30) return 'font-semibold text-emerald-400'
    if (n >= 10) return 'font-semibold text-yellow-400'
    return 'font-semibold text-red-400'
}

function classeLucro(v: NumeroBanco): string {
    const n = toNumNullable(v)
    if (n === null) return 'text-slate-600'
    if (n > 0) return 'font-semibold text-emerald-300'
    if (n < 0) return 'font-semibold text-red-400'
    return 'text-slate-400'
}

// ─── Componente de cabeçalho de tabela reutilizável ───────────────────────

function TabelaHeader({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-3 flex items-center gap-2">
            {children}
        </div>
    )
}

// ─── Componente principal ─────────────────────────────────────────────────

export function CurvaABC() {
    const [statusCarga, setStatusCarga] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando Curva ABC...')
    const [itensBrutos, setItensBrutos] = useState<CurvaAbcItem[]>([])
    const [resumo, setResumo] = useState<CurvaAbcResumo | null>(null)

    // Filtro de busca global (aplicado a ambas as tabelas)
    const [filtroBusca, setFiltroBusca] = useState('')

    // ── Carga inicial ──
    useEffect(() => {
        async function carregar() {
            try {
                setStatusCarga('carregando')
                const itens = await buscarCurvaAbc()
                setItensBrutos(itens)
                setResumo(calcularResumoCurvaAbc(itens))
                setStatusCarga('sucesso')
                setMensagem(
                    itens.length > 0
                        ? `${itens.length} produto(s) classificado(s).`
                        : 'Nenhum produto encontrado. Sincronize os pedidos em Integrações Olist.'
                )
            } catch (error) {
                setStatusCarga('erro')
                setMensagem(
                    error instanceof Error ? error.message : 'Erro desconhecido ao carregar Curva ABC.'
                )
            }
        }
        carregar()
    }, [])

    // ── Tabela 1: ordenada por faturamento (já vem ordenada do banco) ──
    const itensPorFaturamento = useMemo(() => {
        let lista = [...itensBrutos]
        if (filtroBusca.trim()) {
            const t = filtroBusca.trim().toLowerCase()
            lista = lista.filter(
                (i) =>
                    i.sku?.toLowerCase().includes(t) ||
                    i.produto_nome?.toLowerCase().includes(t) ||
                    i.asin?.toLowerCase().includes(t) ||
                    i.marca?.toLowerCase().includes(t) ||
                    i.categoria?.toLowerCase().includes(t)
            )
        }
        return lista
    }, [itensBrutos, filtroBusca])

    // ── Tabela 2: ordenada por margem desc (apenas produtos com custo calculado) ──
    const itensPorMargem = useMemo(() => {
        let lista = itensBrutos
            .filter((i) => toNumNullable(i.margem_estimada_percentual) !== null)

        if (filtroBusca.trim()) {
            const t = filtroBusca.trim().toLowerCase()
            lista = lista.filter(
                (i) =>
                    i.sku?.toLowerCase().includes(t) ||
                    i.produto_nome?.toLowerCase().includes(t) ||
                    i.asin?.toLowerCase().includes(t) ||
                    i.marca?.toLowerCase().includes(t) ||
                    i.categoria?.toLowerCase().includes(t)
            )
        }

        return [...lista].sort(
            (a, b) => toNum(b.margem_estimada_percentual) - toNum(a.margem_estimada_percentual)
        )
    }, [itensBrutos, filtroBusca])

    // Produtos sem custo (sem NF de entrada)
    const itensSemCusto = useMemo(
        () => itensBrutos.filter((i) => toNumNullable(i.custo_medio_unitario) === null),
        [itensBrutos]
    )

    // Produtos âncoras (Faturamento A, Margem C)
    const produtosAncora = useMemo(
        () => itensBrutos.filter((i) => i.curva_faturamento === 'A' && i.curva_margem === 'C'),
        [itensBrutos]
    )

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <PageHeader
                tag="Análise Gerencial"
                title="Curva ABC — Olist"
                description="Classificação de produtos em dois eixos independentes: Ranking por Faturamento (quem mais vende) e Ranking por Margem de Contribuição (quem mais lucra). Fonte: pedidos e NFs de entrada do Olist."
            />

            {/* ── KPIs — Faturamento ── */}
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Curva por Faturamento
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Total de produtos"
                        value={formatarNumero(resumo?.total_produtos)}
                        description={`${formatarNumero(itensSemCusto.length)} sem custo NF`}
                    />
                    <StatCard
                        label="Curva A — Faturamento"
                        value={formatarNumero(resumo?.total_curva_fat_a)}
                        tone="success"
                        description={`${formatarPercentual(resumo?.percentual_produtos_curva_a)} dos produtos · ${formatarMoeda(resumo?.faturamento_curva_a)}`}
                    />
                    <StatCard
                        label="Curva B — Faturamento"
                        value={formatarNumero(resumo?.total_curva_fat_b)}
                        tone="warning"
                        description={formatarMoeda(resumo?.faturamento_curva_b)}
                    />
                    <StatCard
                        label="Curva C — Faturamento"
                        value={formatarNumero(resumo?.total_curva_fat_c)}
                        tone="info"
                        description={formatarMoeda(resumo?.faturamento_curva_c)}
                    />
                </div>
            </div>

            {/* ── KPIs — Margem ── */}
            <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Curva por Margem de Contribuição (custo médio NF Olist)
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Lucro estimado total"
                        value={formatarMoeda(resumo?.lucro_estimado_total)}
                        tone={toNum(resumo?.lucro_estimado_total) >= 0 ? 'success' : 'danger'}
                        description={`Margem média: ${formatarPercentual(resumo?.margem_media_geral)}`}
                    />
                    <StatCard
                        label="M-A ≥ 30% — Alta margem"
                        value={formatarNumero(resumo?.total_curva_margem_a)}
                        tone="success"
                        description="Produtos mais rentáveis"
                    />
                    <StatCard
                        label="M-B 10–30% — Média"
                        value={formatarNumero(resumo?.total_curva_margem_b)}
                        tone="warning"
                        description="Rentabilidade intermediária"
                    />
                    <StatCard
                        label="M-C < 10% / Sem custo"
                        value={`${formatarNumero(resumo?.total_curva_margem_c)} / ${formatarNumero(resumo?.total_sem_custo)}`}
                        tone="danger"
                        description="Atenção ou dados incompletos"
                    />
                </div>
            </div>

            {/* ── Banner de Alerta de Produtos Âncora ── */}
            {statusCarga === 'sucesso' && produtosAncora.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
                    <div className="flex gap-3">
                        <span className="text-xl">⚓</span>
                        <div>
                            <h3 className="text-sm font-semibold text-amber-300">
                                Alerta de Produtos Âncora Detectados ({produtosAncora.length})
                            </h3>
                            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                Estes produtos estão no topo de faturamento (Curva A), mas possuem baixa margem de contribuição (Curva C - abaixo de 10%).
                                Eles geram muito volume financeiro, mas trazem pouca rentabilidade líquida. Monitore de perto a precificação e os custos de aquisição deles.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Filtro de busca global ── */}
            <AppCard>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label
                            htmlFor="filtro-busca"
                            className="text-xs font-semibold uppercase tracking-widest text-slate-400"
                        >
                            Filtrar ambas as tabelas
                        </label>
                        <input
                            id="filtro-busca"
                            type="text"
                            value={filtroBusca}
                            onChange={(e) => setFiltroBusca(e.target.value)}
                            placeholder="SKU, nome, ASIN, marca ou categoria..."
                            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
                        />
                    </div>
                    {filtroBusca && (
                        <button
                            type="button"
                            onClick={() => setFiltroBusca('')}
                            className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </AppCard>

            {/* ── Status ── */}
            {statusCarga !== 'sucesso' && (
                <AppCard>
                    <p className="text-sm text-slate-400">Status:</p>
                    <p className={statusCarga === 'erro' ? 'mt-2 font-semibold text-red-400' : 'mt-2 font-semibold text-yellow-400'}>
                        {statusCarga}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">{mensagem}</p>
                </AppCard>
            )}

            {statusCarga === 'sucesso' && itensBrutos.length === 0 && (
                <AppCard>
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                        <p className="font-semibold text-yellow-300">Nenhum pedido Olist encontrado para classificação.</p>
                        <p className="mt-2 text-sm text-slate-300">
                            Execute a sincronização de pedidos em <strong>Integrações Olist</strong>.
                        </p>
                    </div>
                </AppCard>
            )}

            {/* ════════════════════════════════════════════════════════
                TABELA 1 — Ranking por Faturamento
            ════════════════════════════════════════════════════════ */}
            {itensBrutos.length > 0 && (
                <AppCard>
                    <TabelaHeader>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-lg">
                            💰
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">
                                Ranking por Faturamento
                            </h2>
                            <p className="text-sm text-slate-400">
                                Produtos ordenados do maior faturamento acumulado nos pedidos Olist. Curva A = top 80% do faturamento total.
                            </p>
                        </div>
                        <span className="ml-auto inline-flex whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            {itensPorFaturamento.length} produto(s)
                        </span>
                    </TabelaHeader>

                    {itensPorFaturamento.length === 0 ? (
                        <p className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
                            Nenhum produto com o filtro aplicado.
                        </p>
                    ) : (
                        <DataTableContainer>
                            <table className="w-full min-w-[900px] border-collapse text-left text-xs sm:text-sm">
                                <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                    <tr>
                                        <th className="w-12 px-3 py-3 font-medium sm:px-4">#</th>
                                        <th className="w-20 px-3 py-3 font-medium sm:px-4">Curva</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                        <th className="w-32 px-3 py-3 font-medium sm:px-4">SKU</th>
                                        <th className="w-32 px-3 py-3 text-right font-medium sm:px-4">Faturamento</th>
                                        <th className="w-24 px-3 py-3 text-right font-medium sm:px-4">Qtd. Vendida</th>
                                        <th className="w-28 px-3 py-3 text-right font-medium sm:px-4">Ticket Médio</th>
                                        <th className="w-22 px-3 py-3 text-right font-medium sm:px-4">% Fat.</th>
                                        <th className="w-24 px-3 py-3 text-right font-medium sm:px-4">% Acumulado</th>
                                        <th className="w-24 px-3 py-3 text-right font-medium sm:px-4">Margem Est.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {itensPorFaturamento.map((item, index) => (
                                        <tr
                                            key={item.produto_id ?? `fat-${index}`}
                                            className="hover:bg-slate-800/60"
                                        >
                                            {/* Ranking faturamento */}
                                            <td className="px-3 py-3 text-slate-500 sm:px-4">
                                                {formatarNumero(item.ranking_faturamento)}
                                            </td>

                                            {/* Curva faturamento */}
                                            <td className="px-3 py-3 sm:px-4">
                                                <StatusBadge tone={tomCurvaFat(item.curva_faturamento)}>
                                                    {item.curva_faturamento ?? '-'}
                                                </StatusBadge>
                                            </td>

                                            {/* Produto */}
                                            <td className="px-3 py-3 sm:px-4">
                                                <div className="flex items-center flex-wrap gap-1.5">
                                                    <div className="max-w-[260px] font-semibold text-slate-100">
                                                        {item.produto_nome ?? '-'}
                                                    </div>
                                                    {item.curva_faturamento === 'A' && item.curva_margem === 'C' && (
                                                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/20" title="Produto Âncora: Alto faturamento, mas baixa rentabilidade (margem < 10%)">
                                                            ⚓ Âncora
                                                        </span>
                                                    )}
                                                </div>
                                                {(item.marca || item.categoria) && (
                                                    <div className="mt-0.5 text-xs text-slate-500">
                                                        {[item.marca, item.categoria].filter(Boolean).join(' · ')}
                                                    </div>
                                                )}
                                            </td>

                                            {/* SKU */}
                                            <td className="px-3 py-3 sm:px-4">
                                                <span className="font-mono text-xs text-slate-300">
                                                    {item.sku ?? '-'}
                                                </span>
                                            </td>

                                            {/* Faturamento */}
                                            <td className="px-3 py-3 text-right font-semibold text-slate-100 sm:px-4">
                                                {formatarMoeda(item.faturamento_total)}
                                            </td>

                                            {/* Quantidade */}
                                            <td className="px-3 py-3 text-right text-slate-300 sm:px-4">
                                                {formatarNumero(item.quantidade_total)}
                                            </td>

                                            {/* Ticket médio */}
                                            <td className="px-3 py-3 text-right text-slate-300 sm:px-4">
                                                {formatarMoeda(item.ticket_medio)}
                                            </td>

                                            {/* % faturamento */}
                                            <td className="px-3 py-3 text-right text-slate-400 sm:px-4">
                                                {formatarPercentual(item.percentual_faturamento)}
                                            </td>

                                            {/* % acumulado — cor por curva */}
                                            <td className="px-3 py-3 text-right sm:px-4">
                                                <span className={
                                                    item.curva_faturamento === 'A'
                                                        ? 'font-semibold text-emerald-400'
                                                        : item.curva_faturamento === 'B'
                                                            ? 'font-semibold text-yellow-400'
                                                            : 'text-slate-400'
                                                }>
                                                    {formatarPercentual(item.percentual_acumulado)}
                                                </span>
                                            </td>

                                            {/* Margem estimada (referência) */}
                                            <td className={`px-3 py-3 text-right sm:px-4 ${classeMargem(item.margem_estimada_percentual)}`}>
                                                {formatarPercentual(item.margem_estimada_percentual)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    )}

                    {/* Legenda */}
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-800 pt-3">
                        {[
                            { cor: 'bg-emerald-500', label: 'A — Top 80% do faturamento' },
                            { cor: 'bg-yellow-500', label: 'B — Próximos 15%' },
                            { cor: 'bg-cyan-500', label: 'C — Últimos 5%' },
                        ].map(({ cor, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${cor}`} />
                                <span className="text-xs text-slate-400">{label}</span>
                            </div>
                        ))}
                        <span className="ml-auto text-xs text-slate-600">
                            Fonte: olist_pedidos_itens_snapshot
                        </span>
                    </div>
                </AppCard>
            )}

            {/* ════════════════════════════════════════════════════════
                TABELA 2 — Ranking por Margem de Contribuição
            ════════════════════════════════════════════════════════ */}
            {itensBrutos.length > 0 && (
                <AppCard>
                    <TabelaHeader>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-lg">
                            📊
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">
                                Ranking por Margem de Contribuição
                            </h2>
                            <p className="text-sm text-slate-400">
                                Produtos ordenados da maior margem estimada para a menor. Custo = média ponderada das NFs de entrada Olist.{' '}
                                {itensSemCusto.length > 0 && (
                                    <span className="text-yellow-400">
                                        {itensSemCusto.length} produto(s) sem NF de entrada não aparecem aqui.
                                    </span>
                                )}
                            </p>
                        </div>
                        <span className="ml-auto inline-flex whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            {itensPorMargem.length} produto(s)
                        </span>
                    </TabelaHeader>

                    {itensPorMargem.length === 0 ? (
                        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
                            <p className="font-semibold text-yellow-300">
                                Nenhum produto com custo calculado.
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                                Sincronize as NFs de entrada do Olist para que o custo médio seja calculado automaticamente.
                            </p>
                        </div>
                    ) : (
                        <DataTableContainer>
                            <table className="w-full min-w-[1050px] border-collapse text-left text-xs sm:text-sm">
                                <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                    <tr>
                                        <th className="w-12 px-3 py-3 font-medium sm:px-4">#</th>
                                        <th className="w-28 px-3 py-3 font-medium sm:px-4">Curva Mg.</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                        <th className="w-32 px-3 py-3 font-medium sm:px-4">SKU</th>
                                        <th className="w-28 px-3 py-3 text-right font-medium sm:px-4">Faturamento</th>
                                        <th className="w-28 px-3 py-3 text-right font-medium sm:px-4">Custo Médio Unit.</th>
                                        <th className="w-28 px-3 py-3 text-right font-medium sm:px-4">Custo Total Est.</th>
                                        <th className="w-28 px-3 py-3 text-right font-medium sm:px-4">Lucro Est.</th>
                                        <th className="w-26 px-3 py-3 text-right font-medium sm:px-4">Margem %</th>
                                        <th className="w-20 px-3 py-3 text-right font-medium sm:px-4">Curva Fat.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {itensPorMargem.map((item, index) => (
                                        <tr
                                            key={item.produto_id ?? `mg-${index}`}
                                            className="hover:bg-slate-800/60"
                                        >
                                            {/* Ranking margem */}
                                            <td className="px-3 py-3 text-slate-500 sm:px-4">
                                                {index + 1}
                                            </td>

                                            {/* Curva margem */}
                                            <td className="px-3 py-3 sm:px-4">
                                                <StatusBadge tone={tomCurvaMargem(item.curva_margem)}>
                                                    {labelCurvaMargem(item.curva_margem)}
                                                </StatusBadge>
                                            </td>

                                            {/* Produto */}
                                            <td className="px-3 py-3 sm:px-4">
                                                <div className="flex items-center flex-wrap gap-1.5">
                                                    <div className="max-w-[240px] font-semibold text-slate-100">
                                                        {item.produto_nome ?? '-'}
                                                    </div>
                                                    {item.curva_faturamento === 'A' && item.curva_margem === 'C' && (
                                                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/20" title="Produto Âncora: Alto faturamento, mas baixa rentabilidade (margem < 10%)">
                                                            ⚓ Âncora
                                                        </span>
                                                    )}
                                                </div>
                                                {(item.marca || item.categoria) && (
                                                    <div className="mt-0.5 text-xs text-slate-500">
                                                        {[item.marca, item.categoria].filter(Boolean).join(' · ')}
                                                    </div>
                                                )}
                                            </td>

                                            {/* SKU */}
                                            <td className="px-3 py-3 sm:px-4">
                                                <span className="font-mono text-xs text-slate-300">
                                                    {item.sku ?? '-'}
                                                </span>
                                            </td>

                                            {/* Faturamento */}
                                            <td className="px-3 py-3 text-right text-slate-300 sm:px-4">
                                                {formatarMoeda(item.faturamento_total)}
                                            </td>

                                            {/* Custo médio unitário */}
                                            <td className="px-3 py-3 text-right text-slate-300 sm:px-4">
                                                {formatarMoedaNullable(item.custo_medio_unitario)}
                                            </td>

                                            {/* Custo total estimado */}
                                            <td className="px-3 py-3 text-right text-slate-300 sm:px-4">
                                                {formatarMoedaNullable(item.custo_total_estimado)}
                                            </td>

                                            {/* Lucro estimado */}
                                            <td className={`px-3 py-3 text-right sm:px-4 ${classeLucro(item.lucro_estimado)}`}>
                                                {formatarMoedaNullable(item.lucro_estimado)}
                                            </td>

                                            {/* Margem % — destaque visual */}
                                            <td className={`px-3 py-3 text-right text-base sm:px-4 ${classeMargem(item.margem_estimada_percentual)}`}>
                                                {formatarPercentual(item.margem_estimada_percentual)}
                                            </td>

                                            {/* Curva faturamento (referência cruzada) */}
                                            <td className="px-3 py-3 text-right sm:px-4">
                                                <StatusBadge tone={tomCurvaFat(item.curva_faturamento)}>
                                                    {item.curva_faturamento ?? '-'}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    )}

                    {/* Legenda */}
                    <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-800 pt-3">
                        {[
                            { cor: 'bg-emerald-500', label: 'M-A ≥ 30% — Alta margem' },
                            { cor: 'bg-yellow-500', label: 'M-B 10–30% — Média' },
                            { cor: 'bg-red-500', label: 'M-C < 10% — Atenção' },
                        ].map(({ cor, label }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${cor}`} />
                                <span className="text-xs text-slate-400">{label}</span>
                            </div>
                        ))}
                        <span className="ml-auto text-xs text-slate-600">
                            Custo: olist_notas_entrada_itens_snapshot · Margem = (Fat − Custo) / Fat
                        </span>
                    </div>
                </AppCard>
            )}

            {/* Nota arquitetural */}
            <AppCard>
                <p className="text-xs text-slate-500">
                    ℹ️ <strong className="text-slate-400">Margem de Contribuição estimada</strong>: calculada com o custo médio ponderado das NFs de entrada Olist × quantidade vendida.
                    Não inclui custos fixos, taxas de marketplace, frete ou prep center — é uma aproximação do custo variável de produto.
                    O Olist é o ERP operacional oficial. Esta tela é somente leitura.
                </p>
            </AppCard>
        </div>
    )
}
