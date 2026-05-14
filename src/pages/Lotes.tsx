import { useEffect, useMemo, useState } from 'react'
import {
    buscarLotesEstoqueDetalhados,
    type EstoqueLoteDetalhado,
} from '../services/estoqueService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FiltrosLotes = {
    busca: string
    local: string
    status: string
    tipo: string
    saldo: string
}

const filtrosIniciais: FiltrosLotes = {
    busca: '',
    local: '',
    status: '',
    tipo: '',
    saldo: 'todos',
}

function formatarMoeda(valor?: number | null) {
    if (typeof valor !== 'number') {
        return '-'
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor)
}

function formatarNumero(valor?: number | null) {
    if (typeof valor !== 'number') {
        return '0'
    }

    return new Intl.NumberFormat('pt-BR').format(valor)
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

function obterClasseStatus(status?: string | null) {
    const valor = status?.toLowerCase() ?? ''

    if (valor === 'ativo') {
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    }

    if (valor === 'consumido') {
        return 'border-slate-700 bg-slate-800 text-slate-300'
    }

    if (valor === 'cancelado') {
        return 'border-red-500/30 bg-red-500/10 text-red-300'
    }

    return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
}

function obterClasseTipo(tipo?: string | null) {
    const valor = tipo?.toLowerCase() ?? ''

    if (valor === 'compra') {
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
    }

    if (valor === 'transferencia') {
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    }

    return 'border-slate-700 bg-slate-800 text-slate-300'
}

function normalizarTexto(valor?: string | null) {
    return (valor ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

function calcularPercentualDisponivel(lote: EstoqueLoteDetalhado) {
    if (typeof lote.percentual_disponivel === 'number') {
        return lote.percentual_disponivel
    }

    if (!lote.quantidade_inicial || lote.quantidade_inicial <= 0) {
        return 0
    }

    return (lote.quantidade_disponivel / lote.quantidade_inicial) * 100
}

export function Lotes() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando lotes de estoque...')
    const [lotes, setLotes] = useState<EstoqueLoteDetalhado[]>([])
    const [filtros, setFiltros] = useState<FiltrosLotes>(filtrosIniciais)

    async function carregarLotes() {
        try {
            setStatus('carregando')
            setMensagem('Carregando lotes de estoque...')

            const dados = await buscarLotesEstoqueDetalhados()

            setLotes(dados)
            setStatus('sucesso')

            if (dados.length === 0) {
                setMensagem('Consulta realizada com sucesso, mas nenhum lote foi encontrado.')
            } else {
                setMensagem(`${dados.length} lote(s) encontrado(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar lotes de estoque.')
            }
        }
    }

    useEffect(() => {
        carregarLotes()
    }, [])

    function atualizarFiltro(campo: keyof FiltrosLotes, valor: string) {
        setFiltros((filtrosAtuais) => ({
            ...filtrosAtuais,
            [campo]: valor,
        }))
    }

    function limparFiltros() {
        setFiltros(filtrosIniciais)
    }

    const locaisDisponiveis = useMemo(() => {
        const nomes = lotes
            .map((lote) => lote.local_estoque_nome)
            .filter((nome): nome is string => Boolean(nome))

        return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b))
    }, [lotes])

    const statusDisponiveis = useMemo(() => {
        const statusDosLotes = lotes
            .map((lote) => lote.status)
            .filter((statusLote): statusLote is string => Boolean(statusLote))

        return Array.from(new Set(statusDosLotes)).sort((a, b) =>
            a.localeCompare(b)
        )
    }, [lotes])

    const tiposDisponiveis = useMemo(() => {
        const tipos = lotes
            .map((lote) => lote.tipo_lote)
            .filter((tipo): tipo is string => Boolean(tipo))

        return Array.from(new Set(tipos)).sort((a, b) => a.localeCompare(b))
    }, [lotes])

    const lotesFiltrados = useMemo(() => {
        const buscaNormalizada = normalizarTexto(filtros.busca)

        return lotes.filter((lote) => {
            const textoBusca = normalizarTexto(
                [
                    lote.produto_nome,
                    lote.produto_sku,
                    lote.produto_asin,
                    lote.codigo_lote,
                    lote.documento_origem,
                    lote.compra_numero_pedido,
                    lote.fornecedor_nome,
                    lote.local_estoque_nome,
                ]
                    .filter(Boolean)
                    .join(' ')
            )

            const atendeBusca =
                !buscaNormalizada || textoBusca.includes(buscaNormalizada)

            const atendeLocal =
                !filtros.local || lote.local_estoque_nome === filtros.local

            const atendeStatus = !filtros.status || lote.status === filtros.status

            const atendeTipo = !filtros.tipo || lote.tipo_lote === filtros.tipo

            const quantidadeDisponivel = Number(lote.quantidade_disponivel ?? 0)

            const atendeSaldo =
                filtros.saldo === 'todos' ||
                (filtros.saldo === 'com_saldo' && quantidadeDisponivel > 0) ||
                (filtros.saldo === 'sem_saldo' && quantidadeDisponivel <= 0)

            return (
                atendeBusca &&
                atendeLocal &&
                atendeStatus &&
                atendeTipo &&
                atendeSaldo
            )
        })
    }, [filtros, lotes])

    const resumo = useMemo(() => {
        const totalLotes = lotesFiltrados.length

        const lotesAtivos = lotesFiltrados.filter(
            (lote) => lote.status === 'ativo'
        ).length

        const lotesConsumidos = lotesFiltrados.filter(
            (lote) => lote.status === 'consumido'
        ).length

        const quantidadeDisponivel = lotesFiltrados.reduce((total, lote) => {
            return total + Number(lote.quantidade_disponivel ?? 0)
        }, 0)

        const quantidadeInicial = lotesFiltrados.reduce((total, lote) => {
            return total + Number(lote.quantidade_inicial ?? 0)
        }, 0)

        const valorTotalDisponivel = lotesFiltrados.reduce((total, lote) => {
            return total + Number(lote.valor_total_disponivel ?? 0)
        }, 0)

        const lotesCompra = lotesFiltrados.filter(
            (lote) => lote.tipo_lote === 'compra'
        ).length

        const lotesTransferencia = lotesFiltrados.filter(
            (lote) => lote.tipo_lote === 'transferencia'
        ).length

        return {
            totalLotes,
            lotesAtivos,
            lotesConsumidos,
            quantidadeDisponivel,
            quantidadeInicial,
            valorTotalDisponivel,
            lotesCompra,
            lotesTransferencia,
        }
    }, [lotesFiltrados])

    const carregando = status === 'carregando'

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Estoque
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Lotes detalhados
                </h1>

                <p className="mt-4 max-w-4xl text-slate-300">
                    Visualização dos lotes gerados por compras e transferências FIFO.
                    Use esta tela para conferir saldo por lote, custo, origem, local
                    e status do estoque.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={carregarLotes}
                        disabled={carregando}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {carregando ? 'Atualizando...' : 'Atualizar lotes'}
                    </button>

                    <button
                        type="button"
                        onClick={limparFiltros}
                        className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                        Limpar filtros
                    </button>
                </div>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Lotes encontrados
                    </p>

                    <p className="mt-4 text-3xl font-bold">
                        {resumo.totalLotes}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Unidades disponíveis
                    </p>

                    <p className="mt-4 text-3xl font-bold text-emerald-300">
                        {formatarNumero(resumo.quantidadeDisponivel)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Inicial: {formatarNumero(resumo.quantidadeInicial)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Valor disponível
                    </p>

                    <p className="mt-4 text-3xl font-bold text-cyan-300">
                        {formatarMoeda(resumo.valorTotalDisponivel)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Status dos lotes
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-slate-500">Ativos</p>
                            <p className="text-xl font-bold text-emerald-300">
                                {resumo.lotesAtivos}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Consumidos</p>
                            <p className="text-xl font-bold text-slate-300">
                                {resumo.lotesConsumidos}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Compra</p>
                            <p className="text-xl font-bold text-cyan-300">
                                {resumo.lotesCompra}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Transferência</p>
                            <p className="text-xl font-bold text-purple-300">
                                {resumo.lotesTransferencia}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Filtros
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Filtre os lotes por produto, SKU, local, status, tipo ou saldo.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="xl:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Buscar
                        </label>

                        <input
                            value={filtros.busca}
                            onChange={(event) =>
                                atualizarFiltro('busca', event.target.value)
                            }
                            placeholder="Produto, SKU, lote, pedido ou fornecedor"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Local
                        </label>

                        <select
                            value={filtros.local}
                            onChange={(event) =>
                                atualizarFiltro('local', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Todos</option>

                            {locaisDisponiveis.map((local) => (
                                <option key={local} value={local}>
                                    {local}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Status
                        </label>

                        <select
                            value={filtros.status}
                            onChange={(event) =>
                                atualizarFiltro('status', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Todos</option>

                            {statusDisponiveis.map((statusLote) => (
                                <option key={statusLote} value={statusLote}>
                                    {statusLote}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Tipo
                        </label>

                        <select
                            value={filtros.tipo}
                            onChange={(event) =>
                                atualizarFiltro('tipo', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Todos</option>

                            {tiposDisponiveis.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Saldo
                        </label>

                        <select
                            value={filtros.saldo}
                            onChange={(event) =>
                                atualizarFiltro('saldo', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="todos">Todos</option>
                            <option value="com_saldo">Somente com saldo</option>
                            <option value="sem_saldo">Sem saldo</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Lotes de estoque
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            A coluna disponível mostra o saldo restante de cada lote.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                        Total filtrado: {lotesFiltrados.length}
                    </span>
                </div>

                {lotesFiltrados.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 text-slate-300">
                        Nenhum lote encontrado com os filtros atuais.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="min-w-[1500px] w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">Local</th>
                                    <th className="px-4 py-3">Lote</th>
                                    <th className="px-4 py-3">Inicial</th>
                                    <th className="px-4 py-3">Disponível</th>
                                    <th className="px-4 py-3">Consumido</th>
                                    <th className="px-4 py-3">Progresso</th>
                                    <th className="px-4 py-3">Custo final</th>
                                    <th className="px-4 py-3">Valor disp.</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Origem</th>
                                    <th className="px-4 py-3">Entrada</th>
                                    <th className="px-4 py-3">Fornecedor</th>
                                </tr>
                            </thead>

                            <tbody>
                                {lotesFiltrados.map((lote) => {
                                    const percentual = calcularPercentualDisponivel(lote)
                                    const percentualLimitado = Math.max(
                                        0,
                                        Math.min(100, percentual)
                                    )

                                    return (
                                        <tr
                                            key={lote.lote_id}
                                            className="border-t border-slate-800 hover:bg-slate-800/40"
                                        >
                                            <td className="px-4 py-4 align-top">
                                                <p className="font-semibold text-slate-100">
                                                    {lote.produto_nome}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    SKU: {lote.produto_sku ?? '-'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    ASIN: {lote.produto_asin ?? '-'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <p className="text-slate-100">
                                                    {lote.local_estoque_nome}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {lote.local_estoque_tipo}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <p className="font-mono text-xs text-cyan-300">
                                                    {lote.codigo_lote ?? '-'}
                                                </p>
                                                {lote.lote_origem_codigo ? (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Origem: {lote.lote_origem_codigo}
                                                    </p>
                                                ) : null}
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                {formatarNumero(lote.quantidade_inicial)}
                                            </td>

                                            <td className="px-4 py-4 align-top font-semibold text-emerald-300">
                                                {formatarNumero(lote.quantidade_disponivel)}
                                            </td>

                                            <td className="px-4 py-4 align-top text-slate-300">
                                                {formatarNumero(lote.quantidade_consumida)}
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full bg-cyan-400"
                                                        style={{
                                                            width: `${percentualLimitado}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    {percentualLimitado.toFixed(2)}%
                                                    disponível
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                {formatarMoeda(lote.custo_unitario_final)}
                                            </td>

                                            <td className="px-4 py-4 align-top font-semibold text-cyan-300">
                                                {formatarMoeda(lote.valor_total_disponivel)}
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseTipo(
                                                        lote.tipo_lote
                                                    )}`}
                                                >
                                                    {lote.tipo_lote ?? '-'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseStatus(
                                                        lote.status
                                                    )}`}
                                                >
                                                    {lote.status ?? '-'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                <p className="text-slate-100">
                                                    {lote.documento_origem ?? '-'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Compra: {lote.compra_numero_pedido ?? '-'}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                {formatarData(lote.data_entrada)}
                                            </td>

                                            <td className="px-4 py-4 align-top">
                                                {lote.fornecedor_nome ?? '-'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm text-slate-400">
                    Status da consulta:
                </p>

                <p
                    className={
                        status === 'erro'
                            ? 'mt-3 text-xl font-bold text-red-400'
                            : status === 'carregando'
                                ? 'mt-3 text-xl font-bold text-yellow-300'
                                : 'mt-3 text-xl font-bold text-emerald-300'
                    }
                >
                    {status}
                </p>

                <p className="mt-4 text-slate-100">
                    {mensagem}
                </p>
            </section>
        </div>
    )
}
