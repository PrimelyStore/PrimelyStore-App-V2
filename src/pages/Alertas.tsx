import { useEffect, useState } from 'react'
import {
    buscarAlertasOperacionais,
    buscarResumoAlertas,
    buscarResumoVendasPendentesBaixa,
    buscarVendasPendentesBaixaFIFO,
    type AlertaOperacional,
    type AlertasResumo,
    type AlertasVendasPendentesBaixa,
    type AlertaVendaPendenteBaixaFIFO,
} from '../services/alertasService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'
type ValorNumerico = number | string | null | undefined

function normalizarNumero(valor?: ValorNumerico) {
    if (typeof valor === 'number') {
        return valor
    }

    if (typeof valor === 'string') {
        const numero = Number(valor.replace(',', '.'))

        if (!Number.isNaN(numero)) {
            return numero
        }
    }

    return null
}

function formatarNumero(valor?: ValorNumerico) {
    return normalizarNumero(valor) ?? 0
}

function formatarQuantidade(valor?: ValorNumerico) {
    const numero = normalizarNumero(valor) ?? 0

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numero)
}

function formatarMoeda(valor?: ValorNumerico) {
    const numero = normalizarNumero(valor)

    if (numero === null) {
        return '-'
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numero)
}

function formatarPercentual(valor?: ValorNumerico) {
    const numero = normalizarNumero(valor)

    if (numero === null) {
        return '-'
    }

    return `${numero.toFixed(2).replace('.', ',')}%`
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

function obterClasseSeveridade(severidade?: string | null) {
    const valor = severidade?.toLowerCase() ?? ''

    if (valor.includes('alto') || valor.includes('critico') || valor.includes('crítico')) {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    if (valor.includes('medio') || valor.includes('médio')) {
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
    }

    if (valor.includes('baixo')) {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    return 'bg-slate-800 text-slate-300 border-slate-700'
}

function obterClasseDecisao(decisao?: string | null) {
    if (decisao === 'nao_pode_baixar_estoque_insuficiente') {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    if (decisao === 'pode_baixar') {
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
    }

    if (decisao === 'nao_precisa_baixar') {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    return 'bg-slate-800 text-slate-300 border-slate-700'
}

function formatarDecisao(decisao?: string | null) {
    if (decisao === 'nao_pode_baixar_estoque_insuficiente') {
        return 'Estoque insuficiente'
    }

    if (decisao === 'pode_baixar') {
        return 'Apta para baixa'
    }

    if (decisao === 'nao_precisa_baixar') {
        return 'Já baixada'
    }

    return decisao ?? '-'
}

export function Alertas() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando alertas...')
    const [resumo, setResumo] = useState<AlertasResumo | null>(null)
    const [resumoVendasPendentes, setResumoVendasPendentes] = useState<AlertasVendasPendentesBaixa | null>(null)
    const [alertas, setAlertas] = useState<AlertaOperacional[]>([])
    const [vendasPendentes, setVendasPendentes] = useState<AlertaVendaPendenteBaixaFIFO[]>([])

    useEffect(() => {
        async function carregarAlertas() {
            try {
                const [dadosResumo, dadosAlertas, dadosResumoVendas, dadosVendasPendentes] = await Promise.all([
                    buscarResumoAlertas(),
                    buscarAlertasOperacionais(),
                    buscarResumoVendasPendentesBaixa(),
                    buscarVendasPendentesBaixaFIFO(),
                ])

                setResumo(dadosResumo)
                setAlertas(dadosAlertas)
                setResumoVendasPendentes(dadosResumoVendas)
                setVendasPendentes(dadosVendasPendentes)
                setStatus('sucesso')

                const totalAlertasOperacionais = formatarNumero(dadosResumo?.total_alertas ?? dadosAlertas.length)
                const totalVendasPendentes = formatarNumero(dadosResumoVendas?.total_pendencias ?? dadosVendasPendentes.length)

                if (totalAlertasOperacionais === 0 && totalVendasPendentes === 0) {
                    setMensagem('Consulta realizada com sucesso. Nenhum alerta ativo no momento.')
                } else {
                    setMensagem(
                        `${totalAlertasOperacionais} alerta(s) operacional(is) e ${totalVendasPendentes} pendência(s) de baixa FIFO encontrada(s).`
                    )
                }
            } catch (error) {
                setStatus('erro')

                if (error instanceof Error) {
                    setMensagem(error.message)
                } else {
                    setMensagem('Erro desconhecido ao buscar alertas.')
                }
            }
        }

        carregarAlertas()
    }, [])

    const totalAlertas = formatarNumero(resumo?.total_alertas)
    const alertasAltos = formatarNumero(resumo?.alertas_altos)
    const alertasMedios = formatarNumero(resumo?.alertas_medios)
    const alertasBaixos = formatarNumero(resumo?.alertas_baixos)

    const totalPendenciasFIFO = formatarNumero(resumoVendasPendentes?.total_pendencias)
    const pendenciasEstoqueInsuficiente = formatarNumero(resumoVendasPendentes?.total_estoque_insuficiente)
    const pendenciasAptasParaBaixa = formatarNumero(resumoVendasPendentes?.total_aptas_para_baixa)
    const unidadesPendentesFIFO = formatarQuantidade(resumoVendasPendentes?.total_unidades_pendentes)

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Alertas
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Painel de alertas inteligentes da operação, incluindo estoque, produtos, custo real,
                    divergências entre movimentações e lotes, revisão de lucro e vendas importadas com baixa FIFO pendente.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Total de alertas</p>
                    <p className="mt-3 text-3xl font-bold">{totalAlertas}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Alertas altos</p>
                    <p className="mt-3 text-3xl font-bold text-red-300">{alertasAltos}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Alertas médios</p>
                    <p className="mt-3 text-3xl font-bold text-yellow-300">{alertasMedios}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Alertas baixos</p>
                    <p className="mt-3 text-3xl font-bold text-emerald-300">{alertasBaixos}</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Vendas pendentes FIFO</p>
                    <p className={`mt-3 text-3xl font-bold ${totalPendenciasFIFO > 0 ? 'text-yellow-300' : 'text-emerald-300'}`}>
                        {totalPendenciasFIFO}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Vendas importadas sem baixa completa</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Estoque insuficiente</p>
                    <p className={`mt-3 text-3xl font-bold ${pendenciasEstoqueInsuficiente > 0 ? 'text-red-300' : 'text-slate-100'}`}>
                        {pendenciasEstoqueInsuficiente}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Bloqueadas por falta de saldo</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Aptas para baixa</p>
                    <p className={`mt-3 text-3xl font-bold ${pendenciasAptasParaBaixa > 0 ? 'text-yellow-300' : 'text-slate-100'}`}>
                        {pendenciasAptasParaBaixa}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Já têm saldo para baixar FIFO</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Unidades pendentes</p>
                    <p className="mt-3 text-3xl font-bold text-slate-100">{unidadesPendentesFIFO}</p>
                    <p className="mt-3 text-xs text-slate-500">
                        {formatarNumero(resumoVendasPendentes?.total_pedidos_afetados)} pedido(s) afetado(s)
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Alertas de estoque</p>
                    <p className="mt-3 text-3xl font-bold">{formatarNumero(resumo?.alertas_estoque)}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Alertas de produto</p>
                    <p className="mt-3 text-3xl font-bold">{formatarNumero(resumo?.alertas_produto)}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                    <p className="text-sm text-slate-400">Alertas de custo real</p>
                    <p className="mt-3 text-3xl font-bold">{formatarNumero(resumo?.alertas_custo_real)}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                <p className="text-sm text-slate-400">
                    Status da consulta:
                </p>

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

                <p className="mt-3 text-slate-300">
                    {mensagem}
                </p>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Status geral dos alertas:</p>
                        <p className="mt-2 font-semibold text-slate-100">
                            {resumo?.status_geral_alertas ?? '-'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Atualizado em:</p>
                        <p className="mt-2 font-semibold text-slate-100">
                            {formatarDataHora(resumo?.atualizado_em)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Vendas pendentes de baixa FIFO
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Pedidos importados que ainda precisam baixar estoque ou que ficaram bloqueados por falta de saldo.
                        </p>
                    </div>

                    <span className="w-fit inline-flex whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {vendasPendentes.length}
                    </span>
                </div>

                {vendasPendentes.length === 0 ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <p className="font-semibold text-emerald-300">
                            Nenhuma venda pendente de baixa FIFO no momento.
                        </p>
                        <p className="mt-2 text-sm text-slate-200">
                            As vendas importadas estão com estoque regularizado ou já foram baixadas.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[70vh] max-w-full overflow-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[980px] border-collapse text-left text-xs sm:text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">Pedido</th>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">Severidade</th>
                                    <th className="w-[220px] px-3 py-3 font-medium sm:px-4">Produto</th>
                                    <th className="w-[180px] px-3 py-3 font-medium sm:px-4">Canal / Local</th>
                                    <th className="w-[90px] px-3 py-3 font-medium sm:px-4">Pendente</th>
                                    <th className="w-[80px] px-3 py-3 font-medium sm:px-4">Saldo</th>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">Decisão</th>
                                    <th className="w-[240px] px-3 py-3 font-medium sm:px-4">Descrição</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {vendasPendentes.map((venda) => (
                                    <tr
                                        key={`${venda.venda_id}-${venda.produto_id ?? venda.sku_vendido}`}
                                        className="hover:bg-slate-800/60"
                                    >
                                        <td className="px-3 py-3 text-slate-100 sm:px-4">
                                            <div className="font-semibold">{venda.numero_pedido ?? '-'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Marketplace: {venda.numero_pedido_marketplace ?? '-'}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Origem: {venda.origem_integracao ?? '-'}
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 sm:px-4">
                                            <span
                                                className={`inline-flex w-max whitespace-nowrap items-center rounded-full border px-3 py-1 text-xs font-medium ${obterClasseSeveridade(
                                                    venda.severidade
                                                )}`}
                                            >
                                                {venda.severidade ?? '-'}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 text-slate-100 sm:px-4">
                                            <div className="max-w-[220px]">{venda.produto_nome ?? '-'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                SKU: {venda.sku_vendido ?? '-'}
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            <div className="max-w-[180px]">{venda.canal_venda_nome ?? '-'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Local: {venda.local_saida_nome ?? '-'}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Olist: {venda.ecommerce_nome ?? '-'}
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {formatarQuantidade(venda.quantidade_pendente_baixa)}
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {formatarQuantidade(venda.saldo_atual)}
                                        </td>

                                        <td className="px-3 py-3 sm:px-4">
                                            <span
                                                className={`inline-flex w-max whitespace-nowrap items-center rounded-full border px-3 py-1 text-xs font-medium ${obterClasseDecisao(
                                                    venda.decisao
                                                )}`}
                                            >
                                                {formatarDecisao(venda.decisao)}
                                            </span>
                                        </td>

                                        <td className="max-w-[260px] px-3 py-3 text-slate-300 sm:px-4">
                                            {venda.descricao_alerta ?? venda.olist_mensagem_erro ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                <h2 className="text-xl font-semibold">
                    Resumo por tipo de alerta
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Divergência estoque/lotes</p>
                        <p className="mt-2 text-2xl font-bold">
                            {formatarNumero(resumo?.alertas_divergencia_estoque_lotes)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Prioritário sem FBA</p>
                        <p className="mt-2 text-2xl font-bold">
                            {formatarNumero(resumo?.alertas_produto_prioritario_sem_fba)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Revisar lucro</p>
                        <p className="mt-2 text-2xl font-bold">
                            {formatarNumero(resumo?.alertas_produto_prioritario_revisar_lucro)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                        <p className="text-sm text-slate-400">Problema custo real</p>
                        <p className="mt-2 text-2xl font-bold">
                            {formatarNumero(resumo?.alertas_problema_custo_real)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold">
                        Alertas operacionais
                    </h2>

                    <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {alertas.length}
                    </span>
                </div>

                {alertas.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum alerta operacional para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[70vh] max-w-full overflow-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[980px] border-collapse text-left text-xs sm:text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">Categoria</th>
                                    <th className="w-[170px] px-3 py-3 font-medium sm:px-4">Tipo</th>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">Severidade</th>
                                    <th className="w-[240px] px-3 py-3 font-medium sm:px-4">Produto</th>
                                    <th className="w-[160px] px-3 py-3 font-medium sm:px-4">Local</th>
                                    <th className="w-[100px] px-3 py-3 font-medium sm:px-4">Lucro</th>
                                    <th className="w-[100px] px-3 py-3 font-medium sm:px-4">Margem</th>
                                    <th className="w-[260px] px-3 py-3 font-medium sm:px-4">Descrição</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {alertas.map((alerta, index) => (
                                    <tr
                                        key={`${alerta.tipo_alerta ?? 'alerta'}-${index}`}
                                        className="hover:bg-slate-800/60"
                                    >
                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {alerta.categoria_alerta ?? '-'}
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {alerta.tipo_alerta ?? '-'}
                                        </td>

                                        <td className="px-3 py-3 sm:px-4">
                                            <span
                                                className={`inline-flex w-max whitespace-nowrap items-center rounded-full border px-3 py-1 text-xs font-medium ${obterClasseSeveridade(
                                                    alerta.severidade
                                                )}`}
                                            >
                                                {alerta.severidade ?? '-'}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3 text-slate-100 sm:px-4">
                                            <div className="max-w-[240px]">{alerta.produto_nome ?? alerta.produto_id ?? '-'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                SKU: {alerta.produto_sku ?? '-'} | ASIN: {alerta.produto_asin ?? '-'}
                                            </div>
                                        </td>

                                        <td className="max-w-[160px] px-3 py-3 text-slate-300 sm:px-4">
                                            {alerta.local_estoque_nome ?? alerta.canal_venda_nome ?? '-'}
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {formatarMoeda(alerta.lucro_real)}
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {formatarPercentual(alerta.margem_real_percentual)}
                                        </td>

                                        <td className="max-w-[260px] px-3 py-3 text-slate-300 sm:px-4">
                                            {alerta.descricao_alerta ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </div>
    )
}
