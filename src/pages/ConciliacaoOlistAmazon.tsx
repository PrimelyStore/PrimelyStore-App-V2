import { useEffect, useMemo, useState } from 'react'
import {
    buscarConciliacaoOlistAmazonFBA,
    type OlistAmazonFBAConciliacao,
    type StatusConciliacaoOlistAmazon,
} from '../services/olistAmazonService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FiltrosConciliacao = {
    busca: string
    status: string
    somenteAlertas: boolean
    ordenacao: string
}

const filtrosIniciais: FiltrosConciliacao = {
    busca: '',
    status: 'todos',
    somenteAlertas: false,
    ordenacao: 'prioridade',
}

function formatarNumero(valor?: number | null) {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0))
}

function formatarMoeda(valor?: number | null) {
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

function normalizarTexto(valor?: string | null) {
    return (valor ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}

function obterTextoStatus(status: StatusConciliacaoOlistAmazon) {
    const textos: Record<StatusConciliacaoOlistAmazon, string> = {
        match_olist_amazon: 'Olist + Amazon',
        somente_olist: 'Somente Olist',
        somente_amazon: 'Somente Amazon',
        indefinido: 'Indefinido',
    }

    return textos[status] ?? status
}

function obterClasseStatus(status: StatusConciliacaoOlistAmazon) {
    const classes: Record<StatusConciliacaoOlistAmazon, string> = {
        match_olist_amazon:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        somente_olist:
            'border-blue-500/30 bg-blue-500/10 text-blue-300',
        somente_amazon:
            'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
        indefinido:
            'border-slate-700 bg-slate-800 text-slate-300',
    }

    return classes[status] ?? classes.indefinido
}

function obterProdutoPrincipal(item: OlistAmazonFBAConciliacao) {
    return item.produto_olist || item.produto_amazon || '-'
}

function obterSkuPrincipal(item: OlistAmazonFBAConciliacao) {
    return item.sku_conciliacao || item.sku_olist || item.sku_amazon || '-'
}

export function ConciliacaoOlistAmazon() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState(
        'Carregando conciliação Olist x Amazon FBA...'
    )
    const [itens, setItens] = useState<OlistAmazonFBAConciliacao[]>([])
    const [filtros, setFiltros] =
        useState<FiltrosConciliacao>(filtrosIniciais)

    async function carregarConciliacao() {
        try {
            setStatus('carregando')
            setMensagem('Carregando conciliação Olist x Amazon FBA...')

            const dados = await buscarConciliacaoOlistAmazonFBA()

            setItens(dados)
            setStatus('sucesso')
            setMensagem(`${dados.length} registro(s) encontrados na conciliação.`)
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar conciliação.')
            }
        }
    }

    useEffect(() => {
        carregarConciliacao()
    }, [])

    function atualizarFiltro(
        campo: keyof FiltrosConciliacao,
        valor: string | boolean
    ) {
        setFiltros((filtrosAtuais) => ({
            ...filtrosAtuais,
            [campo]: valor,
        }))
    }

    function limparFiltros() {
        setFiltros(filtrosIniciais)
    }

    const itensFiltrados = useMemo(() => {
        const buscaNormalizada = normalizarTexto(filtros.busca)

        const filtrados = itens.filter((item) => {
            const textoBusca = normalizarTexto(
                [
                    item.sku_conciliacao,
                    item.sku_olist,
                    item.sku_amazon,
                    item.produto_olist,
                    item.produto_amazon,
                    item.asin,
                    item.gtin_olist,
                    item.status_conciliacao,
                ]
                    .filter(Boolean)
                    .join(' ')
            )

            const atendeBusca =
                !buscaNormalizada || textoBusca.includes(buscaNormalizada)

            const atendeStatus =
                filtros.status === 'todos' ||
                item.status_conciliacao === filtros.status

            const atendeAlerta =
                !filtros.somenteAlertas ||
                item.alerta_amazon_com_estoque_sem_olist

            return atendeBusca && atendeStatus && atendeAlerta
        })

        return filtrados.sort((a, b) => {
            if (filtros.ordenacao === 'sku') {
                return obterSkuPrincipal(a).localeCompare(obterSkuPrincipal(b))
            }

            if (filtros.ordenacao === 'produto') {
                return obterProdutoPrincipal(a).localeCompare(
                    obterProdutoPrincipal(b)
                )
            }

            if (filtros.ordenacao === 'amazon_total') {
                return Number(b.amazon_total ?? 0) - Number(a.amazon_total ?? 0)
            }

            if (filtros.ordenacao === 'amazon_disponivel') {
                return (
                    Number(b.amazon_disponivel ?? 0) -
                    Number(a.amazon_disponivel ?? 0)
                )
            }

            return (
                Number(a.ordem_prioridade ?? 999) -
                    Number(b.ordem_prioridade ?? 999) ||
                Number(b.amazon_total ?? 0) - Number(a.amazon_total ?? 0)
            )
        })
    }, [filtros, itens])

    const resumo = useMemo(() => {
        return itensFiltrados.reduce(
            (total, item) => {
                total.total += 1
                total.amazonTotal += Number(item.amazon_total ?? 0)
                total.amazonDisponivel += Number(item.amazon_disponivel ?? 0)
                total.amazonReservado += Number(item.amazon_reservado ?? 0)
                total.amazonPesquisa += Number(item.amazon_em_pesquisa ?? 0)

                if (item.status_conciliacao === 'match_olist_amazon') {
                    total.matches += 1
                }

                if (item.status_conciliacao === 'somente_olist') {
                    total.somenteOlist += 1
                }

                if (item.status_conciliacao === 'somente_amazon') {
                    total.somenteAmazon += 1
                }

                if (item.alerta_amazon_com_estoque_sem_olist) {
                    total.alertas += 1
                }

                return total
            },
            {
                total: 0,
                matches: 0,
                somenteOlist: 0,
                somenteAmazon: 0,
                alertas: 0,
                amazonTotal: 0,
                amazonDisponivel: 0,
                amazonReservado: 0,
                amazonPesquisa: 0,
            }
        )
    }, [itensFiltrados])

    const carregando = status === 'carregando'

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Integrações
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Conciliação Olist x Amazon FBA
                </h1>

                <p className="mt-4 max-w-5xl text-slate-300">
                    Esta tela compara o snapshot de produtos do Olist com o snapshot
                    de estoque Amazon FBA. Ela é apenas uma auditoria: não altera
                    produtos, estoque, lotes ou movimentações.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={carregarConciliacao}
                        disabled={carregando}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {carregando ? 'Atualizando...' : 'Atualizar tela'}
                    </button>

                    <button
                        type="button"
                        onClick={limparFiltros}
                        className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                        Limpar filtros
                    </button>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Registros filtrados</p>
                    <p className="mt-4 text-3xl font-bold">
                        {formatarNumero(resumo.total)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Base: view olist_amazon_fba_conciliacao
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Matches</p>
                    <p className="mt-4 text-3xl font-bold text-emerald-300">
                        {formatarNumero(resumo.matches)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        SKU encontrado no Olist e na Amazon
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Pendências</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-slate-500">Só Amazon</p>
                            <p className="text-2xl font-bold text-yellow-300">
                                {formatarNumero(resumo.somenteAmazon)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500">Só Olist</p>
                            <p className="text-2xl font-bold text-blue-300">
                                {formatarNumero(resumo.somenteOlist)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Alertas críticos</p>
                    <p className="mt-4 text-3xl font-bold text-red-300">
                        {formatarNumero(resumo.alertas)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Amazon com estoque e sem SKU no Olist
                    </p>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Amazon total</p>
                    <p className="mt-4 text-3xl font-bold text-cyan-300">
                        {formatarNumero(resumo.amazonTotal)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Amazon disponível</p>
                    <p className="mt-4 text-3xl font-bold text-emerald-300">
                        {formatarNumero(resumo.amazonDisponivel)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Amazon reservado</p>
                    <p className="mt-4 text-3xl font-bold text-yellow-300">
                        {formatarNumero(resumo.amazonReservado)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Amazon em pesquisa</p>
                    <p className="mt-4 text-3xl font-bold text-purple-300">
                        {formatarNumero(resumo.amazonPesquisa)}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Filtros</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Pesquise por SKU, produto, ASIN ou GTIN.
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
                            placeholder="SKU, produto, ASIN ou GTIN"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
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
                            <option value="todos">Todos</option>
                            <option value="match_olist_amazon">
                                Olist + Amazon
                            </option>
                            <option value="somente_amazon">Somente Amazon</option>
                            <option value="somente_olist">Somente Olist</option>
                            <option value="indefinido">Indefinido</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Ordenação
                        </label>
                        <select
                            value={filtros.ordenacao}
                            onChange={(event) =>
                                atualizarFiltro('ordenacao', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="prioridade">Prioridade</option>
                            <option value="amazon_total">Maior total Amazon</option>
                            <option value="amazon_disponivel">
                                Maior disponível Amazon
                            </option>
                            <option value="sku">SKU A-Z</option>
                            <option value="produto">Produto A-Z</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <label className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={filtros.somenteAlertas}
                                onChange={(event) =>
                                    atualizarFiltro(
                                        'somenteAlertas',
                                        event.target.checked
                                    )
                                }
                                className="h-4 w-4 accent-cyan-400"
                            />
                            Somente alertas
                        </label>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Resultado da conciliação
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            A coluna alerta destaca SKUs que existem na Amazon com
                            estoque, mas não foram encontrados no Olist.
                        </p>
                    </div>

                    <span className="w-fit rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
                        Total filtrado: {itensFiltrados.length}
                    </span>
                </div>

                {itensFiltrados.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 text-slate-300">
                        Nenhum item encontrado com os filtros atuais.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="min-w-[1700px] w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">Produto Olist</th>
                                    <th className="px-4 py-3">Produto Amazon</th>
                                    <th className="px-4 py-3">ASIN / GTIN</th>
                                    <th className="px-4 py-3">Custo Olist</th>
                                    <th className="px-4 py-3">Disponível</th>
                                    <th className="px-4 py-3">Reservado</th>
                                    <th className="px-4 py-3">Pesquisa</th>
                                    <th className="px-4 py-3">Indisp.</th>
                                    <th className="px-4 py-3">Total Amazon</th>
                                    <th className="px-4 py-3">Alerta</th>
                                    <th className="px-4 py-3">Sync Olist</th>
                                    <th className="px-4 py-3">Sync Amazon</th>
                                </tr>
                            </thead>

                            <tbody>
                                {itensFiltrados.map((item) => (
                                    <tr
                                        key={`${item.status_conciliacao}-${obterSkuPrincipal(
                                            item
                                        )}`}
                                        className={
                                            item.alerta_amazon_com_estoque_sem_olist
                                                ? 'border-t border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                                                : 'border-t border-slate-800 hover:bg-slate-800/40'
                                        }
                                    >
                                        <td className="px-4 py-4 align-top">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseStatus(
                                                    item.status_conciliacao
                                                )}`}
                                            >
                                                {obterTextoStatus(
                                                    item.status_conciliacao
                                                )}
                                            </span>
                                            <p className="mt-2 max-w-[220px] text-xs text-slate-500">
                                                {item.descricao_status ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-cyan-300">
                                                {obterSkuPrincipal(item)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Olist: {item.sku_olist ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Amazon: {item.sku_amazon ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="max-w-[260px] font-semibold text-slate-100">
                                                {item.produto_olist ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Situação: {item.situacao_olist ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="max-w-[260px] text-slate-100">
                                                {item.produto_amazon ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Condição: {item.condicao_amazon ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-slate-200">
                                                ASIN: {item.asin ?? '-'}
                                            </p>
                                            <p className="mt-1 font-mono text-xs text-slate-500">
                                                GTIN: {item.gtin_olist ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-semibold text-slate-100">
                                                {formatarMoeda(item.preco_custo_olist)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Médio:{' '}
                                                {formatarMoeda(
                                                    item.preco_custo_medio_olist
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-emerald-300">
                                            {formatarNumero(item.amazon_disponivel)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-yellow-300">
                                            {formatarNumero(item.amazon_reservado)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-purple-300">
                                            {formatarNumero(item.amazon_em_pesquisa)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-red-300">
                                            {formatarNumero(item.amazon_indisponivel)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-cyan-300">
                                            {formatarNumero(item.amazon_total)}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {item.alerta_amazon_com_estoque_sem_olist ? (
                                                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                                                    Crítico
                                                </span>
                                            ) : (
                                                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                                                    Normal
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-slate-300">
                                            {formatarDataHora(
                                                item.olist_sincronizado_em
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-slate-300">
                                            {formatarDataHora(
                                                item.amazon_sincronizado_em
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm text-slate-400">Status da consulta:</p>

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

                <p className="mt-4 text-slate-100">{mensagem}</p>
            </section>
        </div>
    )
}
