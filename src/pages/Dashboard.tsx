import { useEffect, useState } from 'react'
import {
    buscarDashboardAlertasOperacionais,
    buscarDashboardAlertasResumo,
    buscarDashboardAlertasVendasPendentesBaixa,
    buscarDashboardComprasRecentes,
    buscarDashboardKpisGerais,
    buscarDashboardSaldosEstoque,
    buscarDashboardVendasPendentesBaixaFIFO,
    buscarDashboardVendasRecentes,
    type DashboardAlertaOperacional,
    type DashboardAlertasResumo,
    type DashboardAlertasVendasPendentesBaixa,
    type DashboardCompraRecente,
    type DashboardKpisGerais,
    type DashboardSaldoEstoque,
    type DashboardVendaPendenteBaixaFifo,
    type DashboardVendaRecente,
} from '../services/dashboardService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

function numero(valor: number | string | null | undefined) {
    if (typeof valor === 'number') {
        return valor
    }

    if (typeof valor === 'string') {
        const convertido = Number(valor)

        if (!Number.isNaN(convertido)) {
            return convertido
        }
    }

    return 0
}

function formatarMoeda(valor: number | string | null | undefined) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numero(valor))
}

function formatarNumero(valor: number | string | null | undefined) {
    return new Intl.NumberFormat('pt-BR').format(numero(valor))
}

function formatarPercentual(valor: number | string | null | undefined) {
    return `${numero(valor).toFixed(2)}%`
}

function formatarData(data?: string | null) {
    if (!data) {
        return '-'
    }

    const dataConvertida = new Date(data)

    if (Number.isNaN(dataConvertida.getTime())) {
        return data
    }

    return new Intl.DateTimeFormat('pt-BR').format(dataConvertida)
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

function classeStatus(status?: string | null) {
    const valor = status?.toLowerCase() ?? ''

    if (
        valor.includes('sucesso') ||
        valor.includes('saudavel') ||
        valor.includes('sem_alertas') ||
        valor === 'recebido' ||
        valor === 'aprovado' ||
        valor === 'entregue'
    ) {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    if (
        valor.includes('medio') ||
        valor.includes('monitorar') ||
        valor.includes('atencao')
    ) {
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
    }

    if (
        valor.includes('alto') ||
        valor.includes('erro') ||
        valor.includes('problema') ||
        valor === 'cancelado'
    ) {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    return 'bg-slate-800 text-slate-300 border-slate-700'
}

function classeSeveridade(severidade?: string | null) {
    const valor = severidade?.toLowerCase() ?? ''

    if (valor === 'alto' || valor === 'alta') {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    if (valor === 'medio' || valor === 'médio' || valor === 'media') {
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
    }

    if (valor === 'baixo' || valor === 'baixa') {
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    }

    return 'bg-slate-800 text-slate-300 border-slate-700'
}

type CardProps = {
    titulo: string
    valor: string | number
    subtitulo?: string
    destaque?: 'normal' | 'verde' | 'azul' | 'amarelo' | 'vermelho'
}

function CardResumo({ titulo, valor, subtitulo, destaque = 'normal' }: CardProps) {
    const classeValor =
        destaque === 'verde'
            ? 'text-emerald-300'
            : destaque === 'azul'
                ? 'text-cyan-300'
                : destaque === 'amarelo'
                    ? 'text-yellow-300'
                    : destaque === 'vermelho'
                        ? 'text-red-300'
                        : 'text-slate-100'

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <p className="text-sm text-slate-400">{titulo}</p>

            <p className={`mt-3 text-3xl font-bold ${classeValor}`}>
                {valor}
            </p>

            {subtitulo && (
                <p className="mt-2 text-xs text-slate-500">{subtitulo}</p>
            )}
        </div>
    )
}

export function Dashboard() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando dashboard...')
    const [kpis, setKpis] = useState<DashboardKpisGerais | null>(null)
    const [alertasResumo, setAlertasResumo] =
        useState<DashboardAlertasResumo | null>(null)
    const [alertas, setAlertas] = useState<DashboardAlertaOperacional[]>([])
    const [alertasVendasPendentes, setAlertasVendasPendentes] =
        useState<DashboardAlertasVendasPendentesBaixa | null>(null)
    const [vendasPendentesBaixa, setVendasPendentesBaixa] =
        useState<DashboardVendaPendenteBaixaFifo[]>([])
    const [compras, setCompras] = useState<DashboardCompraRecente[]>([])
    const [vendas, setVendas] = useState<DashboardVendaRecente[]>([])
    const [estoque, setEstoque] = useState<DashboardSaldoEstoque[]>([])

    async function carregarDashboard() {
        try {
            const [
                dadosKpis,
                dadosAlertasResumo,
                dadosAlertas,
                dadosAlertasVendasPendentes,
                dadosVendasPendentesBaixa,
                dadosCompras,
                dadosVendas,
                dadosEstoque,
            ] = await Promise.all([
                buscarDashboardKpisGerais(),
                buscarDashboardAlertasResumo(),
                buscarDashboardAlertasOperacionais(),
                buscarDashboardAlertasVendasPendentesBaixa(),
                buscarDashboardVendasPendentesBaixaFIFO(),
                buscarDashboardComprasRecentes(),
                buscarDashboardVendasRecentes(),
                buscarDashboardSaldosEstoque(),
            ])

            setKpis(dadosKpis)
            setAlertasResumo(dadosAlertasResumo)
            setAlertas(dadosAlertas)
            setAlertasVendasPendentes(dadosAlertasVendasPendentes)
            setVendasPendentesBaixa(dadosVendasPendentesBaixa)
            setCompras(dadosCompras)
            setVendas(dadosVendas)
            setEstoque(dadosEstoque)
            setStatus('sucesso')
            setMensagem('Dashboard carregado com dados reais do Supabase.')
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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Painel principal
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Dashboard Operacional
                </h1>

                <p className="mt-4 max-w-4xl text-slate-300">
                    Visão geral da operação Primely Store com produtos, estoque, compras, vendas,
                    lucro estimado, alertas operacionais e saldos por local.
                </p>

                <p className="mt-3 text-xs text-slate-500">
                    Atualizado em: {formatarDataHora(kpis?.atualizado_em ?? alertasResumo?.atualizado_em)}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <CardResumo
                    titulo="Produtos cadastrados"
                    valor={formatarNumero(kpis?.total_produtos)}
                    subtitulo={`${formatarNumero(kpis?.total_produtos_ativos)} ativo(s)`}
                />

                <CardResumo
                    titulo="Produtos com estoque"
                    valor={formatarNumero(kpis?.produtos_com_estoque)}
                    subtitulo={`${formatarNumero(kpis?.produtos_sem_estoque)} sem estoque`}
                    destaque="verde"
                />

                <CardResumo
                    titulo="Estoque total"
                    valor={formatarNumero(kpis?.estoque_total_unidades)}
                    subtitulo="Unidades em todos os locais"
                    destaque="azul"
                />

                <CardResumo
                    titulo="Unidades vendidas"
                    valor={formatarNumero(kpis?.unidades_vendidas_total)}
                    subtitulo="Total consolidado"
                    destaque="amarelo"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <CardResumo
                    titulo="Receita bruta"
                    valor={formatarMoeda(kpis?.receita_bruta_total)}
                    subtitulo="Vendas consolidadas"
                    destaque="verde"
                />

                <CardResumo
                    titulo="Custo estimado"
                    valor={formatarMoeda(kpis?.custo_total_estimado)}
                    subtitulo="Custo estimado dos produtos"
                />

                <CardResumo
                    titulo="Lucro estimado"
                    valor={formatarMoeda(kpis?.lucro_estimado_total)}
                    subtitulo="Receita menos custos estimados"
                    destaque="verde"
                />

                <CardResumo
                    titulo="Margem real geral"
                    valor={formatarPercentual(kpis?.margem_real_geral_percentual)}
                    subtitulo="Baseada nas views de custo real"
                    destaque="azul"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <CardResumo
                    titulo="Prep Center"
                    valor={formatarNumero(kpis?.estoque_total_prep_center)}
                    subtitulo="Unidades no Prep Center"
                />

                <CardResumo
                    titulo="Amazon FBA"
                    valor={formatarNumero(kpis?.estoque_total_amazon_fba)}
                    subtitulo={`${formatarNumero(kpis?.produtos_com_estoque_fba)} produto(s) com FBA`}
                    destaque="azul"
                />

                <CardResumo
                    titulo="Mercado Livre Full"
                    valor={formatarNumero(kpis?.estoque_total_mercado_livre_full)}
                    subtitulo="Unidades no Full ML"
                />

                <CardResumo
                    titulo="Produtos sem FBA"
                    valor={formatarNumero(kpis?.produtos_sem_fba_com_estoque_outro_local)}
                    subtitulo="Têm estoque fora do FBA"
                    destaque="amarelo"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <CardResumo
                    titulo="Total de alertas"
                    valor={formatarNumero(alertasResumo?.total_alertas)}
                    subtitulo={alertasResumo?.status_geral_alertas ?? 'Sem status'}
                    destaque={numero(alertasResumo?.total_alertas) > 0 ? 'amarelo' : 'verde'}
                />

                <CardResumo
                    titulo="Alertas altos"
                    valor={formatarNumero(alertasResumo?.alertas_altos)}
                    destaque={numero(alertasResumo?.alertas_altos) > 0 ? 'vermelho' : 'normal'}
                />

                <CardResumo
                    titulo="Alertas médios"
                    valor={formatarNumero(alertasResumo?.alertas_medios)}
                    destaque={numero(alertasResumo?.alertas_medios) > 0 ? 'amarelo' : 'normal'}
                />

                <CardResumo
                    titulo="Alertas baixos"
                    valor={formatarNumero(alertasResumo?.alertas_baixos)}
                    destaque="azul"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <CardResumo
                    titulo="Vendas pendentes FIFO"
                    valor={formatarNumero(alertasVendasPendentes?.total_pendencias)}
                    subtitulo="Vendas importadas sem baixa completa"
                    destaque={numero(alertasVendasPendentes?.total_pendencias) > 0 ? 'vermelho' : 'verde'}
                />

                <CardResumo
                    titulo="Estoque insuficiente"
                    valor={formatarNumero(alertasVendasPendentes?.total_estoque_insuficiente)}
                    subtitulo="Bloqueadas por falta de saldo"
                    destaque={numero(alertasVendasPendentes?.total_estoque_insuficiente) > 0 ? 'vermelho' : 'normal'}
                />

                <CardResumo
                    titulo="Aptas para baixa"
                    valor={formatarNumero(alertasVendasPendentes?.total_aptas_para_baixa)}
                    subtitulo="Já têm saldo para baixar FIFO"
                    destaque={numero(alertasVendasPendentes?.total_aptas_para_baixa) > 0 ? 'amarelo' : 'normal'}
                />

                <CardResumo
                    titulo="Unidades pendentes"
                    valor={formatarNumero(alertasVendasPendentes?.total_unidades_pendentes)}
                    subtitulo={`${formatarNumero(alertasVendasPendentes?.total_pedidos_afetados)} pedido(s) afetado(s)`}
                    destaque={numero(alertasVendasPendentes?.total_unidades_pendentes) > 0 ? 'amarelo' : 'normal'}
                />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Vendas pendentes de baixa FIFO</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total exibido: {vendasPendentesBaixa.length}
                    </span>
                </div>

                {vendasPendentesBaixa.length === 0 ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <p className="font-semibold text-emerald-300">
                            Nenhuma venda pendente de baixa FIFO no momento.
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                            As vendas importadas até agora estão com estoque regularizado ou já foram baixadas.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Pedido</th>
                                    <th className="px-4 py-3 font-medium">Severidade</th>
                                    <th className="px-4 py-3 font-medium">Canal</th>
                                    <th className="px-4 py-3 font-medium">Local</th>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Pendente</th>
                                    <th className="px-4 py-3 font-medium">Saldo</th>
                                    <th className="px-4 py-3 font-medium">Decisão</th>
                                    <th className="px-4 py-3 font-medium">Descrição</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {vendasPendentesBaixa.map((item) => (
                                    <tr key={`${item.venda_id}-${item.produto_id}`} className="hover:bg-slate-800/60">
                                        <td className="px-4 py-3 text-slate-100">
                                            <div>{item.numero_pedido ?? '-'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Marketplace: {item.numero_pedido_marketplace ?? '-'}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${classeSeveridade(item.severidade)}`}>
                                                {item.severidade ?? '-'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.canal_venda_nome ?? item.ecommerce_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.local_saida_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-100">
                                            {item.produto_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.sku_vendido ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-yellow-300">
                                            {formatarNumero(item.quantidade_pendente_baixa)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarNumero(item.saldo_atual)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.decisao ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {item.descricao_alerta ?? item.olist_mensagem_erro ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm text-slate-400">Status da consulta:</p>

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

                <p className="mt-3 text-slate-300">{mensagem}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Alertas operacionais</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total exibido: {alertas.length}
                    </span>
                </div>

                {alertas.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum alerta operacional encontrado.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Severidade</th>
                                    <th className="px-4 py-3 font-medium">Categoria</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Lucro real</th>
                                    <th className="px-4 py-3 font-medium">Margem</th>
                                    <th className="px-4 py-3 font-medium">Descrição</th>
                                    <th className="px-4 py-3 font-medium">Gerado em</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {alertas.map((alerta, index) => (
                                    <tr key={`${alerta.tipo_alerta}-${alerta.produto_id}-${index}`} className="hover:bg-slate-800/60">
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${classeSeveridade(alerta.severidade)}`}>
                                                {alerta.severidade ?? '-'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.categoria_alerta ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.tipo_alerta ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-100">
                                            {alerta.produto_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.produto_sku ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(alerta.lucro_real)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarPercentual(alerta.margem_real_percentual)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.descricao_alerta ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarDataHora(alerta.gerado_em)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Compras recentes</h2>

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            Total: {compras.length}
                        </span>
                    </div>

                    {compras.length === 0 ? (
                        <p className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-slate-300">
                            Nenhuma compra recente encontrada.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                                <thead className="bg-slate-950 text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Pedido</th>
                                        <th className="px-4 py-3 font-medium">Fornecedor</th>
                                        <th className="px-4 py-3 font-medium">Data</th>
                                        <th className="px-4 py-3 font-medium">Unid.</th>
                                        <th className="px-4 py-3 font-medium">Total</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {compras.map((compra) => (
                                        <tr key={compra.compra_id} className="hover:bg-slate-800/60">
                                            <td className="px-4 py-3 text-slate-100">{compra.numero_pedido ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-300">{compra.fornecedor_nome ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-300">{formatarData(compra.data_compra)}</td>
                                            <td className="px-4 py-3 text-slate-300">{formatarNumero(compra.quantidade_total_unidades)}</td>
                                            <td className="px-4 py-3 text-slate-300">{formatarMoeda(compra.valor_total_estimado)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${classeStatus(compra.status)}`}>
                                                    {compra.status ?? '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Vendas recentes</h2>

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                            Total: {vendas.length}
                        </span>
                    </div>

                    {vendas.length === 0 ? (
                        <p className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-slate-300">
                            Nenhuma venda recente encontrada.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                                <thead className="bg-slate-950 text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Pedido</th>
                                        <th className="px-4 py-3 font-medium">Canal</th>
                                        <th className="px-4 py-3 font-medium">Data</th>
                                        <th className="px-4 py-3 font-medium">Unid.</th>
                                        <th className="px-4 py-3 font-medium">Receita</th>
                                        <th className="px-4 py-3 font-medium">Lucro</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {vendas.map((venda) => (
                                        <tr key={venda.venda_id} className="hover:bg-slate-800/60">
                                            <td className="px-4 py-3 text-slate-100">{venda.numero_pedido ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-300">{venda.canal_venda_nome ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-300">{formatarData(venda.data_venda)}</td>
                                            <td className="px-4 py-3 text-slate-300">{formatarNumero(venda.quantidade_total_unidades)}</td>
                                            <td className="px-4 py-3 text-slate-300">{formatarMoeda(venda.receita_liquida_calculada)}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-100">{formatarMoeda(venda.lucro_estimado)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${classeStatus(venda.status)}`}>
                                                    {venda.status ?? '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Saldos de estoque</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total exibido: {estoque.length}
                    </span>
                </div>

                {estoque.length === 0 ? (
                    <p className="rounded-xl border border-slate-700 bg-slate-950 p-5 text-slate-300">
                        Nenhum saldo de estoque encontrado.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Local</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Saldo</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {estoque.map((item) => (
                                    <tr key={`${item.produto_id}-${item.local_estoque_id}`} className="hover:bg-slate-800/60">
                                        <td className="px-4 py-3 text-slate-100">{item.produto_nome}</td>
                                        <td className="px-4 py-3 text-slate-300">{item.produto_sku ?? '-'}</td>
                                        <td className="px-4 py-3 text-slate-300">{item.local_estoque_nome}</td>
                                        <td className="px-4 py-3 text-slate-300">{item.local_estoque_tipo}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-100">{formatarNumero(item.saldo_atual)}</td>
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