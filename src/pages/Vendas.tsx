import { useEffect, useState } from 'react'
import {
    buscarItensVendas,
    buscarVendasResumo,
    type VendaItemDetalhado,
    type VendaResumo,
} from '../services/vendasService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

function formatarMoeda(valor?: number | null) {
    if (typeof valor !== 'number') {
        return '-'
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor)
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

function obterClasseStatus(status?: string | null) {
    const valor = status?.toLowerCase() ?? ''

    if (valor === 'aprovado' || valor === 'entregue') {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    if (valor === 'enviado') {
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    }

    if (valor === 'rascunho' || valor === 'ativo') {
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }

    if (valor === 'cancelado' || valor === 'devolvido' || valor === 'reembolsado') {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
}

function calcularQuantidadeConsumida(item: VendaItemDetalhado) {
    return (item.vendas_itens_lotes ?? []).reduce((total, lote) => {
        return total + Number(lote.quantidade_consumida ?? 0)
    }, 0)
}

export function Vendas() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando vendas...')
    const [vendas, setVendas] = useState<VendaResumo[]>([])
    const [itensVendas, setItensVendas] = useState<VendaItemDetalhado[]>([])


    async function carregarDadosIniciais() {
        try {
            const [
                vendasResumo,
                itensDados,
            ] = await Promise.all([
                buscarVendasResumo(),
                buscarItensVendas(),
            ])

            setVendas(vendasResumo)
            setItensVendas(itensDados)
            setStatus('sucesso')

            if (vendasResumo.length === 0) {
                setMensagem('Consulta realizada com sucesso, mas nenhuma venda foi encontrada.')
            } else {
                setMensagem(`${vendasResumo.length} venda(s) encontrada(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar vendas.')
            }
        }
    }

    useEffect(() => {
        carregarDadosIniciais()
    }, [])

    const quantidadeTotalVendida = vendas.reduce((total, venda) => {
        return total + Number(venda.quantidade_total_unidades ?? 0)
    }, 0)

    const receitaLiquida = vendas.reduce((total, venda) => {
        return total + Number(venda.receita_liquida_calculada ?? 0)
    }, 0)

    const lucroEstimado = vendas.reduce((total, venda) => {
        return total + Number(venda.lucro_estimado ?? 0)
    }, 0)

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Vendas
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Painel gerencial de acompanhamento de vendas consolidadas e auditoria de margens. Esta tela exibe o histórico de faturamento, custos variáveis calculados e lucro estimado gerencial.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Vendas encontradas</p>
                    <p className="mt-3 text-3xl font-bold">{vendas.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Unidades vendidas</p>
                    <p className="mt-3 text-3xl font-bold">{quantidadeTotalVendida}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Receita líquida</p>
                    <p className="mt-3 text-3xl font-bold">{formatarMoeda(receitaLiquida)}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Lucro estimado</p>
                    <p className="mt-3 text-3xl font-bold">{formatarMoeda(lucroEstimado)}</p>
                </div>
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
                    <h2 className="text-xl font-semibold">Itens das vendas</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {itensVendas.length}
                    </span>
                </div>

                {itensVendas.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum item de venda encontrado.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Venda</th>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Qtd.</th>
                                    <th className="px-4 py-3 font-medium">Baixado</th>
                                    <th className="px-4 py-3 font-medium">Pendente</th>
                                    <th className="px-4 py-3 font-medium">Valor unit.</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {itensVendas.map((item) => {
                                    const quantidadeConsumida = calcularQuantidadeConsumida(item)
                                    const pendente = item.quantidade - quantidadeConsumida

                                    return (
                                        <tr
                                            key={item.id}
                                            className={
                                                pendente > 0
                                                    ? 'border-l-4 border-orange-500/50 hover:bg-slate-800/60'
                                                    : 'border-l-4 border-emerald-500/50 hover:bg-slate-800/60'
                                            }
                                        >
                                            <td className="px-4 py-3 text-slate-100">
                                                {item.vendas?.numero_pedido ?? '-'}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.produtos?.nome ?? item.produto_id}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.sku_vendido ?? item.produtos?.sku ?? '-'}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.quantidade}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {quantidadeConsumida}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {pendente}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarMoeda(item.valor_unitario)}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${obterClasseStatus(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Vendas encontradas</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {vendas.length}
                    </span>
                </div>

                {vendas.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhuma venda para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1400px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Pedido</th>
                                    <th className="px-4 py-3 font-medium">Marketplace</th>
                                    <th className="px-4 py-3 font-medium">Canal</th>
                                    <th className="px-4 py-3 font-medium">Local saída</th>
                                    <th className="px-4 py-3 font-medium">Data venda</th>
                                    <th className="px-4 py-3 font-medium">Unidades</th>
                                    <th className="px-4 py-3 font-medium">Receita líquida</th>
                                    <th className="px-4 py-3 font-medium">Custos variáveis</th>
                                    <th className="px-4 py-3 font-medium">Lucro</th>
                                    <th className="px-4 py-3 font-medium">Margem</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {vendas.map((venda) => (
                                    <tr key={venda.venda_id} className="hover:bg-slate-800/60">
                                        <td className="px-4 py-3 text-slate-100">
                                            {venda.numero_pedido ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {venda.numero_pedido_marketplace ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {venda.canal_venda_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {venda.local_saida_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(venda.data_venda)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {venda.quantidade_total_unidades ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(venda.receita_liquida_calculada)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(venda.custos_variaveis_calculados)}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            {formatarMoeda(venda.lucro_estimado)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {typeof venda.margem_percentual_estimada === 'number'
                                                ? `${venda.margem_percentual_estimada.toFixed(2)}%`
                                                : '-'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${obterClasseStatus(
                                                    venda.status
                                                )}`}
                                            >
                                                {venda.status ?? '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <details className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-5">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-300">
                        Ver retorno bruto do Supabase
                    </summary>

                    <p className="mt-3 text-xs text-slate-500">
                        Área técnica para conferência durante o desenvolvimento. Em produção, este bloco pode ser removido.
                    </p>

                    <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-black p-4 text-xs text-slate-200">
                        {JSON.stringify({ vendas, itensVendas }, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    )
}