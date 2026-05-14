import { useEffect, useMemo, useState } from 'react'
import {
    buscarAmazonFBAEstoqueSnapshot,
    sincronizarAmazonFBAEstoqueSnapshot,
    type AmazonFBAEstoqueSnapshot,
    type SincronizacaoAmazonFBAResultado,
} from '../services/amazonService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FiltrosAmazonFBA = {
    busca: string
    situacaoEstoque: string
    ordenacao: string
}

const filtrosIniciais: FiltrosAmazonFBA = {
    busca: '',
    situacaoEstoque: 'todos',
    ordenacao: 'total_desc',
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

function obterClasseTotal(total: number) {
    if (total <= 0) {
        return 'text-slate-400'
    }

    return 'text-emerald-300'
}

function obterClasseSituacao(item: AmazonFBAEstoqueSnapshot) {
    if (item.total_quantity <= 0) {
        return 'border-slate-700 bg-slate-800 text-slate-300'
    }

    if (item.unfulfillable_total_quantity > 0) {
        return 'border-red-500/30 bg-red-500/10 text-red-300'
    }

    if (item.reserved_total_quantity > 0) {
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
    }

    if (item.researching_total_quantity > 0) {
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    }

    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
}

function obterTextoSituacao(item: AmazonFBAEstoqueSnapshot) {
    if (item.total_quantity <= 0) {
        return 'Zerado'
    }

    if (item.unfulfillable_total_quantity > 0) {
        return 'Com indisponível'
    }

    if (item.reserved_total_quantity > 0) {
        return 'Com reservado'
    }

    if (item.researching_total_quantity > 0) {
        return 'Em pesquisa'
    }

    return 'Disponível'
}

function montarMensagemSincronizacao(resultado: SincronizacaoAmazonFBAResultado) {
    const received = resultado.result?.received_count ?? 0
    const saved = resultado.result?.saved_count ?? 0
    const skipped = resultado.result?.skipped_without_seller_sku ?? 0

    return `Sincronização concluída. Recebidos: ${received}. Salvos: ${saved}. Ignorados sem SKU: ${skipped}.`
}

export function AmazonFBA() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState(
        'Carregando snapshot de estoque FBA...'
    )
    const [itens, setItens] = useState<AmazonFBAEstoqueSnapshot[]>([])
    const [filtros, setFiltros] =
        useState<FiltrosAmazonFBA>(filtrosIniciais)
    const [sincronizando, setSincronizando] = useState(false)

    async function carregarSnapshot() {
        try {
            setStatus('carregando')
            setMensagem('Carregando snapshot de estoque FBA...')

            const dados = await buscarAmazonFBAEstoqueSnapshot()

            setItens(dados)
            setStatus('sucesso')

            if (dados.length === 0) {
                setMensagem(
                    'Consulta realizada com sucesso, mas nenhum snapshot FBA foi encontrado.'
                )
            } else {
                setMensagem(`${dados.length} SKU(s) encontrados no snapshot FBA.`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar snapshot FBA.')
            }
        }
    }

    async function sincronizarAmazonFBA() {
        try {
            setSincronizando(true)
            setStatus('carregando')
            setMensagem('Sincronizando estoque Amazon FBA pela SP-API...')

            const resultado = await sincronizarAmazonFBAEstoqueSnapshot()

            await carregarSnapshot()

            setStatus('sucesso')
            setMensagem(montarMensagemSincronizacao(resultado))
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao sincronizar Amazon FBA.')
            }
        } finally {
            setSincronizando(false)
        }
    }

    useEffect(() => {
        carregarSnapshot()
    }, [])

    function atualizarFiltro(campo: keyof FiltrosAmazonFBA, valor: string) {
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
                    item.seller_sku,
                    item.asin,
                    item.fn_sku,
                    item.product_name,
                    item.condition,
                ]
                    .filter(Boolean)
                    .join(' ')
            )

            const atendeBusca =
                !buscaNormalizada || textoBusca.includes(buscaNormalizada)

            const atendeSituacao =
                filtros.situacaoEstoque === 'todos' ||
                (filtros.situacaoEstoque === 'com_estoque' &&
                    item.total_quantity > 0) ||
                (filtros.situacaoEstoque === 'zerado' &&
                    item.total_quantity <= 0) ||
                (filtros.situacaoEstoque === 'com_reserva' &&
                    item.reserved_total_quantity > 0) ||
                (filtros.situacaoEstoque === 'em_pesquisa' &&
                    item.researching_total_quantity > 0) ||
                (filtros.situacaoEstoque === 'indisponivel' &&
                    item.unfulfillable_total_quantity > 0)

            return atendeBusca && atendeSituacao
        })

        return filtrados.sort((a, b) => {
            if (filtros.ordenacao === 'sku_asc') {
                return a.seller_sku.localeCompare(b.seller_sku)
            }

            if (filtros.ordenacao === 'disponivel_desc') {
                return b.fulfillable_quantity - a.fulfillable_quantity
            }

            if (filtros.ordenacao === 'reservado_desc') {
                return b.reserved_total_quantity - a.reserved_total_quantity
            }

            if (filtros.ordenacao === 'pesquisa_desc') {
                return b.researching_total_quantity - a.researching_total_quantity
            }

            return b.total_quantity - a.total_quantity
        })
    }, [filtros, itens])

    const resumo = useMemo(() => {
        return itensFiltrados.reduce(
            (total, item) => {
                total.totalSkus += 1
                total.totalUnidades += Number(item.total_quantity ?? 0)
                total.disponivel += Number(item.fulfillable_quantity ?? 0)
                total.reservado += Number(item.reserved_total_quantity ?? 0)
                total.emPesquisa += Number(item.researching_total_quantity ?? 0)
                total.indisponivel += Number(
                    item.unfulfillable_total_quantity ?? 0
                )

                if (item.total_quantity > 0) {
                    total.skusComEstoque += 1
                } else {
                    total.skusZerados += 1
                }

                if (
                    item.sincronizado_em &&
                    (!total.ultimaSincronizacao ||
                        new Date(item.sincronizado_em).getTime() >
                        new Date(total.ultimaSincronizacao).getTime())
                ) {
                    total.ultimaSincronizacao = item.sincronizado_em
                }

                return total
            },
            {
                totalSkus: 0,
                totalUnidades: 0,
                disponivel: 0,
                reservado: 0,
                emPesquisa: 0,
                indisponivel: 0,
                skusComEstoque: 0,
                skusZerados: 0,
                ultimaSincronizacao: null as string | null,
            }
        )
    }, [itensFiltrados])

    const carregando = status === 'carregando'

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Amazon SP-API
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Estoque Amazon FBA
                </h1>

                <p className="mt-4 max-w-4xl text-slate-300">
                    Visualização do snapshot importado da Amazon FBA Inventory API.
                    Esta tela mostra o espelho da Amazon e não altera o estoque FIFO interno.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={sincronizarAmazonFBA}
                        disabled={carregando || sincronizando}
                        className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {sincronizando
                            ? 'Sincronizando...'
                            : 'Sincronizar Amazon FBA'}
                    </button>

                    <button
                        type="button"
                        onClick={carregarSnapshot}
                        disabled={carregando || sincronizando}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {carregando && !sincronizando
                            ? 'Atualizando...'
                            : 'Atualizar tela'}
                    </button>

                    <button
                        type="button"
                        onClick={limparFiltros}
                        disabled={sincronizando}
                        className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Limpar filtros
                    </button>
                </div>
            </div>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        SKUs no snapshot
                    </p>

                    <p className="mt-4 text-3xl font-bold">
                        {formatarNumero(resumo.totalSkus)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Com estoque: {formatarNumero(resumo.skusComEstoque)} |
                        Zerados: {formatarNumero(resumo.skusZerados)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Total FBA
                    </p>

                    <p className="mt-4 text-3xl font-bold text-cyan-300">
                        {formatarNumero(resumo.totalUnidades)}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                        Soma de total_quantity
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Disponível / Reservado
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-slate-500">Disponível</p>
                            <p className="text-2xl font-bold text-emerald-300">
                                {formatarNumero(resumo.disponivel)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Reservado</p>
                            <p className="text-2xl font-bold text-yellow-300">
                                {formatarNumero(resumo.reservado)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Pesquisa / Indisponível
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-slate-500">Pesquisa</p>
                            <p className="text-2xl font-bold text-purple-300">
                                {formatarNumero(resumo.emPesquisa)}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">Indisp.</p>
                            <p className="text-2xl font-bold text-red-300">
                                {formatarNumero(resumo.indisponivel)}
                            </p>
                        </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        Sync: {formatarDataHora(resumo.ultimaSincronizacao)}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Filtros
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Pesquise por SKU, ASIN, FNSKU ou nome do produto.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="xl:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Buscar
                        </label>

                        <input
                            value={filtros.busca}
                            onChange={(event) =>
                                atualizarFiltro('busca', event.target.value)
                            }
                            placeholder="SKU, ASIN, FNSKU ou produto"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Situação
                        </label>

                        <select
                            value={filtros.situacaoEstoque}
                            onChange={(event) =>
                                atualizarFiltro(
                                    'situacaoEstoque',
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="todos">Todos</option>
                            <option value="com_estoque">Somente com estoque</option>
                            <option value="zerado">Somente zerados</option>
                            <option value="com_reserva">Com reservado</option>
                            <option value="em_pesquisa">Em pesquisa</option>
                            <option value="indisponivel">Com indisponível</option>
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
                            <option value="total_desc">Maior total</option>
                            <option value="disponivel_desc">Maior disponível</option>
                            <option value="reservado_desc">Maior reservado</option>
                            <option value="pesquisa_desc">Maior em pesquisa</option>
                            <option value="sku_asc">SKU A-Z</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Snapshot FBA
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Dados salvos na tabela amazon_fba_estoque_snapshot.
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
                        <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">ASIN / FNSKU</th>
                                    <th className="px-4 py-3">Disponível</th>
                                    <th className="px-4 py-3">Reservado</th>
                                    <th className="px-4 py-3">Pesquisa</th>
                                    <th className="px-4 py-3">Indisp.</th>
                                    <th className="px-4 py-3">Total</th>
                                    <th className="px-4 py-3">Situação</th>
                                    <th className="px-4 py-3">Atualização Amazon</th>
                                    <th className="px-4 py-3">Sincronização</th>
                                </tr>
                            </thead>

                            <tbody>
                                {itensFiltrados.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-t border-slate-800 hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-4 align-top">
                                            <p className="font-semibold text-slate-100">
                                                {item.product_name ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Condição: {item.condition ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-cyan-300">
                                                {item.seller_sku}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-slate-200">
                                                ASIN: {item.asin ?? '-'}
                                            </p>
                                            <p className="mt-1 font-mono text-xs text-slate-500">
                                                FNSKU: {item.fn_sku ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-emerald-300">
                                            {formatarNumero(item.fulfillable_quantity)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-yellow-300">
                                            {formatarNumero(item.reserved_total_quantity)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-purple-300">
                                            {formatarNumero(
                                                item.researching_total_quantity
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-red-300">
                                            {formatarNumero(
                                                item.unfulfillable_total_quantity
                                            )}
                                        </td>

                                        <td
                                            className={`px-4 py-4 align-top text-lg font-bold ${obterClasseTotal(
                                                item.total_quantity
                                            )}`}
                                        >
                                            {formatarNumero(item.total_quantity)}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseSituacao(
                                                    item
                                                )}`}
                                            >
                                                {obterTextoSituacao(item)}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 align-top text-slate-300">
                                            {formatarDataHora(item.last_updated_time)}
                                        </td>

                                        <td className="px-4 py-4 align-top text-slate-300">
                                            {formatarDataHora(item.sincronizado_em)}
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
