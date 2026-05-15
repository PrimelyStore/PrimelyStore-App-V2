import { useEffect, useMemo, useState } from 'react'
import {
    buscarConciliacaoOlistPrimelyEstoque,
    type OlistPrimelyEstoqueConciliacao,
    type StatusConciliacaoOlistPrimely,
} from '../services/olistPrimelyEstoqueService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FiltrosConciliacao = {
    busca: string
    status: string
    local: string
    somenteAlertas: boolean
    ordenacao: string
}

const filtrosIniciais: FiltrosConciliacao = {
    busca: '',
    status: 'todos',
    local: 'todos',
    somenteAlertas: false,
    ordenacao: 'prioridade',
}

function formatarNumero(valor?: number | null) {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0))
}

function formatarQuantidade(valor?: number | null) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
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

function obterTextoStatus(status: StatusConciliacaoOlistPrimely) {
    const textos: Record<StatusConciliacaoOlistPrimely, string> = {
        conciliado: 'Conciliado',
        divergente: 'Divergente',
        somente_olist: 'Somente Olist',
        somente_primely: 'Somente Primely',
        indefinido: 'Indefinido',
    }

    return textos[status] ?? status
}

function obterClasseStatus(status: StatusConciliacaoOlistPrimely) {
    const classes: Record<StatusConciliacaoOlistPrimely, string> = {
        conciliado:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        divergente:
            'border-red-500/30 bg-red-500/10 text-red-300',
        somente_olist:
            'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
        somente_primely:
            'border-blue-500/30 bg-blue-500/10 text-blue-300',
        indefinido:
            'border-slate-700 bg-slate-800 text-slate-300',
    }

    return classes[status] ?? classes.indefinido
}

function obterProdutoPrincipal(item: OlistPrimelyEstoqueConciliacao) {
    return (
        item.produto_nome ||
        item.produto_nome_olist ||
        item.produto_nome_primely ||
        '-'
    )
}

function obterSkuPrincipal(item: OlistPrimelyEstoqueConciliacao) {
    return item.sku || '-'
}

function obterLocalPrincipal(item: OlistPrimelyEstoqueConciliacao) {
    return item.local_estoque_nome || '-'
}

export function ConciliacaoOlistPrimelyEstoque() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState(
        'Carregando conciliação Olist x Primely por local...'
    )
    const [itens, setItens] = useState<OlistPrimelyEstoqueConciliacao[]>([])
    const [filtros, setFiltros] =
        useState<FiltrosConciliacao>(filtrosIniciais)

    async function carregarConciliacao() {
        try {
            setStatus('carregando')
            setMensagem('Carregando conciliação Olist x Primely por local...')

            const dados = await buscarConciliacaoOlistPrimelyEstoque()

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

    const locaisDisponiveis = useMemo(() => {
        const locais = new Set<string>()

        for (const item of itens) {
            if (item.local_estoque_nome) {
                locais.add(item.local_estoque_nome)
            }
        }

        return Array.from(locais).sort((a, b) => a.localeCompare(b))
    }, [itens])

    const itensFiltrados = useMemo(() => {
        const buscaNormalizada = normalizarTexto(filtros.busca)

        const filtrados = itens.filter((item) => {
            const textoBusca = normalizarTexto(
                [
                    item.sku,
                    item.produto_nome,
                    item.produto_nome_olist,
                    item.produto_nome_primely,
                    item.deposito_olist,
                    item.local_estoque_nome,
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

            const atendeLocal =
                filtros.local === 'todos' ||
                item.local_estoque_nome === filtros.local

            const atendeAlerta =
                !filtros.somenteAlertas || item.alerta_divergencia

            return atendeBusca && atendeStatus && atendeLocal && atendeAlerta
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

            if (filtros.ordenacao === 'local') {
                return obterLocalPrincipal(a).localeCompare(
                    obterLocalPrincipal(b)
                )
            }

            if (filtros.ordenacao === 'saldo_olist') {
                return Number(b.saldo_olist ?? 0) - Number(a.saldo_olist ?? 0)
            }

            if (filtros.ordenacao === 'diferenca') {
                return (
                    Number(b.diferenca_absoluta ?? 0) -
                    Number(a.diferenca_absoluta ?? 0)
                )
            }

            return (
                Number(a.ordem_prioridade ?? 999) -
                Number(b.ordem_prioridade ?? 999) ||
                Number(b.diferenca_absoluta ?? 0) -
                Number(a.diferenca_absoluta ?? 0)
            )
        })
    }, [filtros, itens])

    const resumo = useMemo(() => {
        const skus = new Set<string>()

        return itensFiltrados.reduce(
            (total, item) => {
                total.totalLinhas += 1

                if (item.sku) {
                    skus.add(item.sku)
                    total.totalSkus = skus.size
                }

                total.saldoOlist += Number(item.saldo_olist ?? 0)
                total.saldoPrimely += Number(item.saldo_primely ?? 0)
                total.diferenca += Number(item.diferenca_saldo ?? 0)
                total.diferencaAbsoluta += Number(
                    item.diferenca_absoluta ?? 0
                )

                if (item.status_conciliacao === 'conciliado') {
                    total.conciliados += 1
                }

                if (item.status_conciliacao === 'divergente') {
                    total.divergentes += 1
                }

                if (item.status_conciliacao === 'somente_olist') {
                    total.somenteOlist += 1
                }

                if (item.status_conciliacao === 'somente_primely') {
                    total.somentePrimely += 1
                }

                if (item.alerta_divergencia) {
                    total.alertas += 1
                }

                return total
            },
            {
                totalLinhas: 0,
                totalSkus: 0,
                conciliados: 0,
                divergentes: 0,
                somenteOlist: 0,
                somentePrimely: 0,
                alertas: 0,
                saldoOlist: 0,
                saldoPrimely: 0,
                diferenca: 0,
                diferencaAbsoluta: 0,
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
                    Conciliação Olist x Primely por Local
                </h1>

                <p className="mt-4 max-w-5xl text-slate-300">
                    Esta tela compara o estoque por depósito do Olist com o saldo
                    interno do Primely Store por local. Ela é apenas uma auditoria:
                    não altera lotes, movimentações, compras, vendas ou saldos.
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
                        {formatarNumero(resumo.totalLinhas)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        SKUs únicos: {formatarNumero(resumo.totalSkus)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Saldo Olist</p>
                    <p className="mt-4 text-3xl font-bold text-yellow-300">
                        {formatarQuantidade(resumo.saldoOlist)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Soma do estoque nos depósitos Olist
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Saldo Primely</p>
                    <p className="mt-4 text-3xl font-bold text-cyan-300">
                        {formatarQuantidade(resumo.saldoPrimely)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Soma do saldo interno por local
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Alertas</p>
                    <p className="mt-4 text-3xl font-bold text-red-300">
                        {formatarNumero(resumo.alertas)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Linhas com divergência operacional
                    </p>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Somente Olist</p>
                    <p className="mt-4 text-3xl font-bold text-yellow-300">
                        {formatarNumero(resumo.somenteOlist)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Divergentes</p>
                    <p className="mt-4 text-3xl font-bold text-red-300">
                        {formatarNumero(resumo.divergentes)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Conciliados</p>
                    <p className="mt-4 text-3xl font-bold text-emerald-300">
                        {formatarNumero(resumo.conciliados)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Diferença total</p>
                    <p className="mt-4 text-3xl font-bold text-purple-300">
                        {formatarQuantidade(resumo.diferenca)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Diferença absoluta:{' '}
                        {formatarQuantidade(resumo.diferencaAbsoluta)}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Filtros</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Pesquise por SKU, produto, depósito Olist ou local interno.
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
                            placeholder="SKU, produto, depósito ou local"
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
                            <option value="somente_olist">Somente Olist</option>
                            <option value="somente_primely">
                                Somente Primely
                            </option>
                            <option value="divergente">Divergentes</option>
                            <option value="conciliado">Conciliados</option>
                            <option value="indefinido">Indefinido</option>
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
                            <option value="todos">Todos</option>
                            {locaisDisponiveis.map((local) => (
                                <option key={local} value={local}>
                                    {local}
                                </option>
                            ))}
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
                            <option value="diferenca">Maior diferença</option>
                            <option value="saldo_olist">Maior saldo Olist</option>
                            <option value="local">Local A-Z</option>
                            <option value="sku">SKU A-Z</option>
                            <option value="produto">Produto A-Z</option>
                        </select>
                    </div>
                </div>

                <label className="mt-4 flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                    <input
                        type="checkbox"
                        checked={filtros.somenteAlertas}
                        onChange={(event) =>
                            atualizarFiltro('somenteAlertas', event.target.checked)
                        }
                        className="h-4 w-4 accent-cyan-400"
                    />
                    Somente alertas
                </label>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Resultado da conciliação
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Nesta fase, é esperado aparecer “Somente Olist”, porque
                            ainda não criamos os lotes internos reais no Primely.
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
                        <table className="min-w-[1600px] w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">Depósito Olist</th>
                                    <th className="px-4 py-3">Local Primely</th>
                                    <th className="px-4 py-3">Saldo Olist</th>
                                    <th className="px-4 py-3">Reservado Olist</th>
                                    <th className="px-4 py-3">Disponível Olist</th>
                                    <th className="px-4 py-3">Saldo Primely</th>
                                    <th className="px-4 py-3">Diferença</th>
                                    <th className="px-4 py-3">Alerta</th>
                                    <th className="px-4 py-3">Sincronizado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {itensFiltrados.map((item, index) => (
                                    <tr
                                        key={`${item.sku}-${item.local_estoque_id}-${item.id_deposito_olist}-${index}`}
                                        className={
                                            item.alerta_divergencia
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

                                            <p className="mt-2 max-w-[260px] text-xs text-slate-500">
                                                {item.descricao_conciliacao ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-cyan-300">
                                                {obterSkuPrincipal(item)}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="max-w-[300px] font-semibold text-slate-100">
                                                {obterProdutoPrincipal(item)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Olist:{' '}
                                                {item.produto_nome_olist ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Primely:{' '}
                                                {item.produto_nome_primely ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-semibold text-slate-100">
                                                {item.deposito_olist ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                ID Olist:{' '}
                                                {item.id_deposito_olist ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-semibold text-slate-100">
                                                {item.local_estoque_nome ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Tipo:{' '}
                                                {item.local_estoque_tipo ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-yellow-300">
                                            {formatarQuantidade(item.saldo_olist)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-purple-300">
                                            {formatarQuantidade(
                                                item.reservado_olist
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-emerald-300">
                                            {formatarQuantidade(
                                                item.disponivel_olist
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-cyan-300">
                                            {item.saldo_primely === null
                                                ? '-'
                                                : formatarQuantidade(
                                                    item.saldo_primely
                                                )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-red-300">
                                            {formatarQuantidade(
                                                item.diferenca_saldo
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {item.alerta_divergencia ? (
                                                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                                                    Alerta
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
