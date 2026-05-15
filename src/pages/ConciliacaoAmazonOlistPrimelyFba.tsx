import { useEffect, useMemo, useState } from 'react'
import {
    buscarConciliacaoAmazonOlistPrimelyFba,
    type AmazonOlistPrimelyFbaConciliacao,
    type StatusConciliacaoFbaTresPontas,
} from '../services/amazonOlistPrimelyFbaService'

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

function obterTextoStatus(status: StatusConciliacaoFbaTresPontas) {
    const textos: Record<StatusConciliacaoFbaTresPontas, string> = {
        conciliado_tres: 'Conciliado nos 3',
        divergente_tres: 'Divergente nos 3',
        saldo_negativo_olist: 'Saldo negativo no Olist',
        amazon_olist_sem_primely: 'Amazon + Olist sem Primely',
        amazon_primely_sem_olist: 'Amazon + Primely sem Olist',
        olist_primely_sem_amazon: 'Olist + Primely sem Amazon',
        somente_amazon: 'Somente Amazon',
        somente_olist_saldo_zero: 'Somente Olist saldo zero',
        somente_olist_com_saldo: 'Somente Olist com saldo',
        somente_primely: 'Somente Primely',
        indefinido: 'Indefinido',
    }

    return textos[status] ?? status
}

function obterClasseStatus(status: StatusConciliacaoFbaTresPontas) {
    const classes: Record<StatusConciliacaoFbaTresPontas, string> = {
        conciliado_tres:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        divergente_tres:
            'border-red-500/30 bg-red-500/10 text-red-300',
        saldo_negativo_olist:
            'border-red-500/40 bg-red-500/15 text-red-200',
        amazon_olist_sem_primely:
            'border-orange-500/30 bg-orange-500/10 text-orange-300',
        amazon_primely_sem_olist:
            'border-orange-500/30 bg-orange-500/10 text-orange-300',
        olist_primely_sem_amazon:
            'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
        somente_amazon:
            'border-purple-500/30 bg-purple-500/10 text-purple-300',
        somente_olist_saldo_zero:
            'border-slate-600 bg-slate-800 text-slate-300',
        somente_olist_com_saldo:
            'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
        somente_primely:
            'border-blue-500/30 bg-blue-500/10 text-blue-300',
        indefinido:
            'border-slate-700 bg-slate-800 text-slate-300',
    }

    return classes[status] ?? classes.indefinido
}

function obterProdutoPrincipal(item: AmazonOlistPrimelyFbaConciliacao) {
    return (
        item.produto_nome ||
        item.produto_amazon ||
        item.produto_olist ||
        item.produto_primely ||
        '-'
    )
}

function obterSkuPrincipal(item: AmazonOlistPrimelyFbaConciliacao) {
    return item.sku || '-'
}

function maiorDiferenca(item: AmazonOlistPrimelyFbaConciliacao) {
    return Math.max(
        Number(item.diferenca_abs_amazon_olist ?? 0),
        Number(item.diferenca_abs_amazon_primely ?? 0),
        Number(item.diferenca_abs_olist_primely ?? 0)
    )
}

export function ConciliacaoAmazonOlistPrimelyFba() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState(
        'Carregando conciliação Amazon x Olist x Primely FBA...'
    )
    const [itens, setItens] = useState<AmazonOlistPrimelyFbaConciliacao[]>([])
    const [filtros, setFiltros] =
        useState<FiltrosConciliacao>(filtrosIniciais)

    async function carregarConciliacao() {
        try {
            setStatus('carregando')
            setMensagem('Carregando conciliação Amazon x Olist x Primely FBA...')

            const dados = await buscarConciliacaoAmazonOlistPrimelyFba()

            setItens(dados)
            setStatus('sucesso')
            setMensagem(`${dados.length} SKU(s) encontrados na conciliação FBA.`)
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar conciliação FBA.')
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
                    item.sku,
                    item.asin,
                    item.produto_nome,
                    item.produto_amazon,
                    item.produto_olist,
                    item.produto_primely,
                    item.status_presenca,
                    item.status_conciliacao,
                    item.descricao_status,
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
                !filtros.somenteAlertas || item.alerta_operacional

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

            if (filtros.ordenacao === 'olist_fba') {
                return (
                    Number(b.olist_fba_saldo ?? 0) -
                    Number(a.olist_fba_saldo ?? 0)
                )
            }

            if (filtros.ordenacao === 'primely_fba') {
                return (
                    Number(b.primely_fba_saldo ?? 0) -
                    Number(a.primely_fba_saldo ?? 0)
                )
            }

            if (filtros.ordenacao === 'maior_diferenca') {
                return maiorDiferenca(b) - maiorDiferenca(a)
            }

            return (
                Number(a.ordem_prioridade ?? 999) -
                    Number(b.ordem_prioridade ?? 999) ||
                maiorDiferenca(b) - maiorDiferenca(a)
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

                total.amazonTotal += Number(item.amazon_total ?? 0)
                total.amazonDisponivel += Number(item.amazon_disponivel ?? 0)
                total.amazonReservado += Number(item.amazon_reservado ?? 0)
                total.amazonPesquisa += Number(item.amazon_em_pesquisa ?? 0)

                total.olistTotal += Number(item.olist_fba_saldo ?? 0)
                total.primelyTotal += Number(item.primely_fba_saldo ?? 0)

                total.diferencaAmazonOlist += Number(
                    item.diferenca_amazon_olist ?? 0
                )
                total.diferencaAmazonPrimely += Number(
                    item.diferenca_amazon_primely ?? 0
                )
                total.diferencaOlistPrimely += Number(
                    item.diferenca_olist_primely ?? 0
                )

                if (item.status_conciliacao === 'conciliado_tres') {
                    total.conciliadosTres += 1
                }

                if (item.status_conciliacao === 'divergente_tres') {
                    total.divergentesTres += 1
                }

                if (item.status_conciliacao === 'saldo_negativo_olist') {
                    total.saldoNegativoOlist += 1
                }

                if (item.status_conciliacao === 'somente_amazon') {
                    total.somenteAmazon += 1
                }

                if (item.status_conciliacao === 'somente_olist_com_saldo') {
                    total.somenteOlistComSaldo += 1
                }

                if (item.status_conciliacao === 'somente_olist_saldo_zero') {
                    total.somenteOlistSaldoZero += 1
                }

                if (item.status_conciliacao === 'somente_primely') {
                    total.somentePrimely += 1
                }

                if (item.alerta_operacional) {
                    total.alertas += 1
                }

                return total
            },
            {
                totalLinhas: 0,
                totalSkus: 0,

                conciliadosTres: 0,
                divergentesTres: 0,
                saldoNegativoOlist: 0,
                somenteAmazon: 0,
                somenteOlistComSaldo: 0,
                somenteOlistSaldoZero: 0,
                somentePrimely: 0,
                alertas: 0,

                amazonTotal: 0,
                amazonDisponivel: 0,
                amazonReservado: 0,
                amazonPesquisa: 0,

                olistTotal: 0,
                primelyTotal: 0,

                diferencaAmazonOlist: 0,
                diferencaAmazonPrimely: 0,
                diferencaOlistPrimely: 0,
            }
        )
    }, [itensFiltrados])

    const carregando = status === 'carregando'

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Amazon FBA
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Conciliação Amazon x Olist x Primely FBA
                </h1>

                <p className="mt-4 max-w-5xl text-slate-300">
                    Esta tela compara o estoque FBA em três fontes: Amazon
                    SP-API, depósito FBA do Olist e local Amazon FBA do Primely.
                    Ela é apenas uma auditoria e não altera lotes, movimentações
                    ou saldos.
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
                    <p className="text-sm text-slate-400">SKUs filtrados</p>
                    <p className="mt-4 text-3xl font-bold">
                        {formatarNumero(resumo.totalSkus)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Linhas: {formatarNumero(resumo.totalLinhas)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Amazon FBA total</p>
                    <p className="mt-4 text-3xl font-bold text-purple-300">
                        {formatarQuantidade(resumo.amazonTotal)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Disponível: {formatarQuantidade(resumo.amazonDisponivel)} ·
                        Reservado: {formatarQuantidade(resumo.amazonReservado)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Olist FBA</p>
                    <p className="mt-4 text-3xl font-bold text-yellow-300">
                        {formatarQuantidade(resumo.olistTotal)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Depósito FBA do Olist
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Primely Amazon FBA</p>
                    <p className="mt-4 text-3xl font-bold text-cyan-300">
                        {formatarQuantidade(resumo.primelyTotal)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Estoque interno do Primely
                    </p>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Conciliados nos 3</p>
                    <p className="mt-4 text-3xl font-bold text-emerald-300">
                        {formatarNumero(resumo.conciliadosTres)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Divergentes nos 3</p>
                    <p className="mt-4 text-3xl font-bold text-red-300">
                        {formatarNumero(resumo.divergentesTres)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Saldo negativo no Olist
                    </p>
                    <p className="mt-4 text-3xl font-bold text-red-300">
                        {formatarNumero(resumo.saldoNegativoOlist)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">Alertas</p>
                    <p className="mt-4 text-3xl font-bold text-orange-300">
                        {formatarNumero(resumo.alertas)}
                    </p>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Diferença Amazon x Olist
                    </p>
                    <p className="mt-4 text-3xl font-bold text-purple-300">
                        {formatarQuantidade(resumo.diferencaAmazonOlist)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Diferença Amazon x Primely
                    </p>
                    <p className="mt-4 text-3xl font-bold text-cyan-300">
                        {formatarQuantidade(resumo.diferencaAmazonPrimely)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                    <p className="text-sm text-slate-400">
                        Diferença Olist x Primely
                    </p>
                    <p className="mt-4 text-3xl font-bold text-yellow-300">
                        {formatarQuantidade(resumo.diferencaOlistPrimely)}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Filtros</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Pesquise por SKU, ASIN, produto ou status.
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
                            placeholder="SKU, ASIN, produto ou status"
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
                            <option value="conciliado_tres">
                                Conciliado nos 3
                            </option>
                            <option value="divergente_tres">
                                Divergente nos 3
                            </option>
                            <option value="saldo_negativo_olist">
                                Saldo negativo no Olist
                            </option>
                            <option value="somente_amazon">
                                Somente Amazon
                            </option>
                            <option value="amazon_olist_sem_primely">
                                Amazon + Olist sem Primely
                            </option>
                            <option value="amazon_primely_sem_olist">
                                Amazon + Primely sem Olist
                            </option>
                            <option value="olist_primely_sem_amazon">
                                Olist + Primely sem Amazon
                            </option>
                            <option value="somente_olist_com_saldo">
                                Somente Olist com saldo
                            </option>
                            <option value="somente_olist_saldo_zero">
                                Somente Olist saldo zero
                            </option>
                            <option value="somente_primely">
                                Somente Primely
                            </option>
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
                            <option value="maior_diferenca">
                                Maior diferença
                            </option>
                            <option value="amazon_total">
                                Maior saldo Amazon
                            </option>
                            <option value="olist_fba">Maior saldo Olist</option>
                            <option value="primely_fba">
                                Maior saldo Primely
                            </option>
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
                    Somente alertas operacionais
                </label>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Resultado da conciliação FBA
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Compare os saldos da Amazon real, do Olist FBA e do
                            Primely Amazon FBA. Dê prioridade às linhas com alerta.
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
                        <table className="min-w-[1900px] w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-300">
                                <tr>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">SKU / ASIN</th>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3">Amazon total</th>
                                    <th className="px-4 py-3">Amazon disp.</th>
                                    <th className="px-4 py-3">Amazon res.</th>
                                    <th className="px-4 py-3">Amazon pesquisa</th>
                                    <th className="px-4 py-3">Olist FBA</th>
                                    <th className="px-4 py-3">Primely FBA</th>
                                    <th className="px-4 py-3">Dif. Amz x Olist</th>
                                    <th className="px-4 py-3">Dif. Amz x Primely</th>
                                    <th className="px-4 py-3">Dif. Olist x Primely</th>
                                    <th className="px-4 py-3">Alerta</th>
                                    <th className="px-4 py-3">Sincronizações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {itensFiltrados.map((item, index) => (
                                    <tr
                                        key={`${item.sku}-${item.asin}-${index}`}
                                        className={
                                            item.alerta_operacional
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

                                            <p className="mt-2 max-w-[280px] text-xs text-slate-500">
                                                {item.descricao_status ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="font-mono text-xs text-cyan-300">
                                                {obterSkuPrincipal(item)}
                                            </p>
                                            <p className="mt-2 font-mono text-xs text-slate-500">
                                                ASIN: {item.asin ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            <p className="max-w-[320px] font-semibold text-slate-100">
                                                {obterProdutoPrincipal(item)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Amazon: {item.produto_amazon ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Olist: {item.produto_olist ?? '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Primely:{' '}
                                                {item.produto_primely ?? '-'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-purple-300">
                                            {formatarQuantidade(
                                                item.amazon_total
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-emerald-300">
                                            {formatarQuantidade(
                                                item.amazon_disponivel
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-yellow-300">
                                            {formatarQuantidade(
                                                item.amazon_reservado
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-orange-300">
                                            {formatarQuantidade(
                                                item.amazon_em_pesquisa
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-yellow-300">
                                            {formatarQuantidade(
                                                item.olist_fba_saldo
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-cyan-300">
                                            {formatarQuantidade(
                                                item.primely_fba_saldo
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-red-300">
                                            {formatarQuantidade(
                                                item.diferenca_amazon_olist
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-red-300">
                                            {formatarQuantidade(
                                                item.diferenca_amazon_primely
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-lg font-bold text-red-300">
                                            {formatarQuantidade(
                                                item.diferenca_olist_primely
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                            {item.alerta_operacional ? (
                                                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                                                    Alerta
                                                </span>
                                            ) : (
                                                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                                                    Normal
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 align-top text-xs text-slate-300">
                                            <p>
                                                Amazon:{' '}
                                                {formatarDataHora(
                                                    item.amazon_sincronizado_em
                                                )}
                                            </p>
                                            <p className="mt-1">
                                                Olist:{' '}
                                                {formatarDataHora(
                                                    item.olist_sincronizado_em
                                                )}
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
