import { useEffect, useMemo, useState } from 'react'
import {
    buscarMovimentacoesEstoque,
    type MovimentacaoEstoqueDetalhada,
} from '../services/estoqueService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FiltrosMovimentacoes = {
    busca: string
    tipo: string
    direcao: string
    local: string
    dataInicial: string
    dataFinal: string
}

const filtrosIniciais: FiltrosMovimentacoes = {
    busca: '',
    tipo: '',
    direcao: '',
    local: '',
    dataInicial: '',
    dataFinal: '',
}

function formatarNumero(valor?: number | null) {
    if (typeof valor !== 'number') {
        return '0'
    }

    return new Intl.NumberFormat('pt-BR').format(valor)
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

function normalizarTexto(valor?: string | null) {
    return (valor ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

function obterClasseDirecao(direcao?: string | null) {
    const valor = direcao?.toLowerCase() ?? ''

    if (valor === 'entrada') {
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    }

    if (valor === 'saida') {
        return 'border-red-500/30 bg-red-500/10 text-red-300'
    }

    if (valor === 'transferencia') {
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    }

    return 'border-slate-700 bg-slate-800 text-slate-300'
}

function obterClasseTipo(tipo?: string | null) {
    const valor = tipo?.toLowerCase() ?? ''

    if (valor === 'compra_entrada') {
        return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
    }

    if (valor === 'venda_saida') {
        return 'border-orange-500/30 bg-orange-500/10 text-orange-300'
    }

    if (valor === 'transferencia') {
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    }

    return 'border-slate-700 bg-slate-800 text-slate-300'
}

function obterLabelTipo(tipo?: string | null) {
    if (tipo === 'compra_entrada') {
        return 'Compra / Entrada'
    }

    if (tipo === 'venda_saida') {
        return 'Venda / Saída'
    }

    if (tipo === 'transferencia') {
        return 'Transferência'
    }

    return tipo ?? '-'
}

function obterLabelDirecao(direcao?: string | null) {
    if (direcao === 'entrada') {
        return 'Entrada'
    }

    if (direcao === 'saida') {
        return 'Saída'
    }

    if (direcao === 'transferencia') {
        return 'Transferência'
    }

    return direcao ?? '-'
}

function movimentoEstaNoPeriodo(
    movimentacao: MovimentacaoEstoqueDetalhada,
    dataInicial: string,
    dataFinal: string
) {
    const dataBase = movimentacao.data_movimentacao ?? movimentacao.created_at

    if (!dataBase) {
        return !dataInicial && !dataFinal
    }

    const dataMovimento = new Date(dataBase)

    if (Number.isNaN(dataMovimento.getTime())) {
        return true
    }

    if (dataInicial) {
        const inicio = new Date(`${dataInicial}T00:00:00`)

        if (dataMovimento < inicio) {
            return false
        }
    }

    if (dataFinal) {
        const fim = new Date(`${dataFinal}T23:59:59`)

        if (dataMovimento > fim) {
            return false
        }
    }

    return true
}

export function Movimentacoes() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando movimentações de estoque...')
    const [movimentacoes, setMovimentacoes] = useState<
        MovimentacaoEstoqueDetalhada[]
    >([])
    const [filtros, setFiltros] =
        useState<FiltrosMovimentacoes>(filtrosIniciais)

    async function carregarMovimentacoes() {
        try {
            setStatus('carregando')
            setMensagem('Carregando movimentações de estoque...')

            const dados = await buscarMovimentacoesEstoque()

            setMovimentacoes(dados)
            setStatus('sucesso')

            if (dados.length === 0) {
                setMensagem(
                    'Consulta realizada com sucesso, mas nenhuma movimentação foi encontrada.'
                )
            } else {
                setMensagem(`${dados.length} movimentação(ões) encontrada(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar movimentações.')
            }
        }
    }

    useEffect(() => {
        carregarMovimentacoes()
    }, [])

    function atualizarFiltro(campo: keyof FiltrosMovimentacoes, valor: string) {
        setFiltros((filtrosAtuais) => ({
            ...filtrosAtuais,
            [campo]: valor,
        }))
    }

    function limparFiltros() {
        setFiltros(filtrosIniciais)
    }

    const tiposDisponiveis = useMemo(() => {
        const tipos = movimentacoes
            .map((movimentacao) => movimentacao.tipo)
            .filter((tipo): tipo is string => Boolean(tipo))

        return Array.from(new Set(tipos)).sort((a, b) => a.localeCompare(b))
    }, [movimentacoes])

    const direcoesDisponiveis = useMemo(() => {
        const direcoes = movimentacoes
            .map((movimentacao) => movimentacao.direcao_movimento)
            .filter((direcao): direcao is string => Boolean(direcao))

        return Array.from(new Set(direcoes)).sort((a, b) => a.localeCompare(b))
    }, [movimentacoes])

    const locaisDisponiveis = useMemo(() => {
        const locais = movimentacoes.flatMap((movimentacao) => [
            movimentacao.local_origem_nome,
            movimentacao.local_destino_nome,
        ])

        const locaisValidos = locais.filter(
            (local): local is string => Boolean(local)
        )

        return Array.from(new Set(locaisValidos)).sort((a, b) =>
            a.localeCompare(b)
        )
    }, [movimentacoes])

    const movimentacoesFiltradas = useMemo(() => {
        const buscaNormalizada = normalizarTexto(filtros.busca)

        return movimentacoes.filter((movimentacao) => {
            const textoBusca = normalizarTexto(
                [
                    movimentacao.produto_nome,
                    movimentacao.produto_sku,
                    movimentacao.produto_asin,
                    movimentacao.produto_marca,
                    movimentacao.produto_categoria,
                    movimentacao.local_origem_nome,
                    movimentacao.local_destino_nome,
                    movimentacao.tipo,
                    movimentacao.direcao_movimento,
                    movimentacao.documento_origem,
                    movimentacao.observacoes,
                ]
                    .filter(Boolean)
                    .join(' ')
            )

            const atendeBusca =
                !buscaNormalizada || textoBusca.includes(buscaNormalizada)

            const atendeTipo =
                !filtros.tipo || movimentacao.tipo === filtros.tipo

            const atendeDirecao =
                !filtros.direcao ||
                movimentacao.direcao_movimento === filtros.direcao

            const atendeLocal =
                !filtros.local ||
                movimentacao.local_origem_nome === filtros.local ||
                movimentacao.local_destino_nome === filtros.local

            const atendePeriodo = movimentoEstaNoPeriodo(
                movimentacao,
                filtros.dataInicial,
                filtros.dataFinal
            )

            return (
                atendeBusca &&
                atendeTipo &&
                atendeDirecao &&
                atendeLocal &&
                atendePeriodo
            )
        })
    }, [filtros, movimentacoes])

    const resumo = useMemo(() => {
        const totalMovimentacoes = movimentacoesFiltradas.length

        const totalUnidades = movimentacoesFiltradas.reduce(
            (total, movimentacao) => total + Number(movimentacao.quantidade ?? 0),
            0
        )

        const entradas = movimentacoesFiltradas.filter(
            (movimentacao) => movimentacao.direcao_movimento === 'entrada'
        )

        const saidas = movimentacoesFiltradas.filter(
            (movimentacao) => movimentacao.direcao_movimento === 'saida'
        )

        const transferencias = movimentacoesFiltradas.filter(
            (movimentacao) =>
                movimentacao.direcao_movimento === 'transferencia'
        )

        const unidadesEntrada = entradas.reduce(
            (total, movimentacao) => total + Number(movimentacao.quantidade ?? 0),
            0
        )

        const unidadesSaida = saidas.reduce(
            (total, movimentacao) => total + Number(movimentacao.quantidade ?? 0),
            0
        )

        const unidadesTransferencia = transferencias.reduce(
            (total, movimentacao) => total + Number(movimentacao.quantidade ?? 0),
            0
        )

        return {
            totalMovimentacoes,
            totalUnidades,
            entradas: entradas.length,
            saidas: saidas.length,
            transferencias: transferencias.length,
            unidadesEntrada,
            unidadesSaida,
            unidadesTransferencia,
        }
    }, [movimentacoesFiltradas])

    const carregando = status === 'carregando'

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Auditoria
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Movimentações de estoque
                </h1>

                <p className="mt-4 max-w-4xl text-slate-300">
                    Tela própria para consultar entradas, saídas e transferências
                    de estoque. Use esta visão para auditoria do FIFO, compras,
                    vendas e movimentações entre locais.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={carregarMovimentacoes}
                        disabled={carregando}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {carregando ? 'Atualizando...' : 'Atualizar movimentações'}
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
                        Movimentações
                    </p>

                    <p className="mt-4 text-3xl font-bold">
                        {resumo.totalMovimentacoes}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Unidades movimentadas: {formatarNumero(resumo.totalUnidades)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Entradas
                    </p>

                    <p className="mt-4 text-3xl font-bold text-emerald-300">
                        {resumo.entradas}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Unidades: {formatarNumero(resumo.unidadesEntrada)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Saídas
                    </p>

                    <p className="mt-4 text-3xl font-bold text-red-300">
                        {resumo.saidas}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Unidades: {formatarNumero(resumo.unidadesSaida)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Transferências
                    </p>

                    <p className="mt-4 text-3xl font-bold text-purple-300">
                        {resumo.transferencias}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Unidades: {formatarNumero(resumo.unidadesTransferencia)}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Filtros
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Filtre por produto, SKU, documento, tipo, direção, local ou período.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div className="xl:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Buscar
                        </label>

                        <input
                            value={filtros.busca}
                            onChange={(event) =>
                                atualizarFiltro('busca', event.target.value)
                            }
                            placeholder="Produto, SKU, documento ou observação"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
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
                                    {obterLabelTipo(tipo)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Direção
                        </label>

                        <select
                            value={filtros.direcao}
                            onChange={(event) =>
                                atualizarFiltro('direcao', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Todas</option>

                            {direcoesDisponiveis.map((direcao) => (
                                <option key={direcao} value={direcao}>
                                    {obterLabelDirecao(direcao)}
                                </option>
                            ))}
                        </select>
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
                            Data inicial
                        </label>

                        <input
                            type="date"
                            value={filtros.dataInicial}
                            onChange={(event) =>
                                atualizarFiltro('dataInicial', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Data final
                        </label>

                        <input
                            type="date"
                            value={filtros.dataFinal}
                            onChange={(event) =>
                                atualizarFiltro('dataFinal', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Histórico de movimentações
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Esta tabela mostra os registros da view movimentacoes_estoque_detalhado.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                        Total filtrado: {movimentacoesFiltradas.length}
                    </span>
                </div>

                {movimentacoesFiltradas.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 text-slate-300">
                        Nenhuma movimentação encontrada com os filtros atuais.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="min-w-[1450px] w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Direção</th>
                                    <th className="px-4 py-3">Origem</th>
                                    <th className="px-4 py-3">Destino</th>
                                    <th className="px-4 py-3">Qtd.</th>
                                    <th className="px-4 py-3">Documento</th>
                                    <th className="px-4 py-3">Observações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {movimentacoesFiltradas.map((movimentacao) => (
                                    <tr
                                        key={movimentacao.movimentacao_id}
                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-4 align-top text-slate-300">
                                            {formatarDataHora(
                                                movimentacao.data_movimentacao ??
                                                movimentacao.created_at
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-semibold text-slate-100">
                                                {movimentacao.produto_nome}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                SKU: {movimentacao.produto_sku ?? '-'}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                ASIN: {movimentacao.produto_asin ?? '-'}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Marca: {movimentacao.produto_marca ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseTipo(
                                                    movimentacao.tipo
                                                )}`}
                                            >
                                                {obterLabelTipo(movimentacao.tipo)}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseDirecao(
                                                    movimentacao.direcao_movimento
                                                )}`}
                                            >
                                                {obterLabelDirecao(
                                                    movimentacao.direcao_movimento
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="text-slate-100">
                                                {movimentacao.local_origem_nome ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {movimentacao.local_origem_tipo ?? ''}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="text-slate-100">
                                                {movimentacao.local_destino_nome ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {movimentacao.local_destino_tipo ?? ''}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-cyan-300">
                                            {formatarNumero(movimentacao.quantidade)}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-slate-200">
                                                {movimentacao.documento_origem ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="max-w-md text-slate-300">
                                                {movimentacao.observacoes ?? '-'}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
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
