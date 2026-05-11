import { useEffect, useState } from 'react'
import {
    buscarAlertasOperacionais,
    buscarResumoAlertas,
    type AlertaOperacional,
    type AlertasResumo,
} from '../services/alertasService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

function formatarNumero(valor?: number) {
    if (typeof valor !== 'number') {
        return 0
    }

    return valor
}

function formatarMoeda(valor?: number) {
    if (typeof valor !== 'number') {
        return '-'
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor)
}

function formatarPercentual(valor?: number) {
    if (typeof valor !== 'number') {
        return '-'
    }

    return `${valor.toFixed(2).replace('.', ',')}%`
}

function formatarDataHora(data?: string) {
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

function obterClasseSeveridade(severidade?: string) {
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

export function Alertas() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando alertas...')
    const [resumo, setResumo] = useState<AlertasResumo | null>(null)
    const [alertas, setAlertas] = useState<AlertaOperacional[]>([])

    useEffect(() => {
        async function carregarAlertas() {
            try {
                const [dadosResumo, dadosAlertas] = await Promise.all([
                    buscarResumoAlertas(),
                    buscarAlertasOperacionais(),
                ])

                setResumo(dadosResumo)
                setAlertas(dadosAlertas)
                setStatus('sucesso')

                if ((dadosResumo?.total_alertas ?? 0) === 0 && dadosAlertas.length === 0) {
                    setMensagem('Consulta realizada com sucesso. Nenhum alerta ativo no momento.')
                } else {
                    setMensagem(`${dadosResumo?.total_alertas ?? dadosAlertas.length} alerta(s) encontrado(s).`)
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

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Alertas
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Painel de alertas inteligentes da operação, incluindo estoque, produtos, custo real,
                    divergências entre movimentações e lotes, além de revisão de lucro.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Total de alertas</p>
                    <p className="mt-3 text-3xl font-bold">{totalAlertas}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Alertas altos</p>
                    <p className="mt-3 text-3xl font-bold text-red-300">{alertasAltos}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Alertas médios</p>
                    <p className="mt-3 text-3xl font-bold text-yellow-300">{alertasMedios}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Alertas baixos</p>
                    <p className="mt-3 text-3xl font-bold text-emerald-300">{alertasBaixos}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Alertas de estoque</p>
                    <p className="mt-3 text-3xl font-bold">{formatarNumero(resumo?.alertas_estoque)}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Alertas de produto</p>
                    <p className="mt-3 text-3xl font-bold">{formatarNumero(resumo?.alertas_produto)}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Alertas de custo real</p>
                    <p className="mt-3 text-3xl font-bold">{formatarNumero(resumo?.alertas_custo_real)}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
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

                <div className="mt-4 grid gap-4 md:grid-cols-2">
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

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
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

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Alertas operacionais
                    </h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
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
                    <div className="overflow-hidden rounded-xl border border-slate-700">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Categoria</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Severidade</th>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">Local</th>
                                    <th className="px-4 py-3 font-medium">Lucro</th>
                                    <th className="px-4 py-3 font-medium">Margem</th>
                                    <th className="px-4 py-3 font-medium">Descrição</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {alertas.map((alerta, index) => (
                                    <tr
                                        key={`${alerta.tipo_alerta ?? 'alerta'}-${index}`}
                                        className="hover:bg-slate-800/60"
                                    >
                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.categoria_alerta ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.tipo_alerta ?? '-'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${obterClasseSeveridade(
                                                    alerta.severidade
                                                )}`}
                                            >
                                                {alerta.severidade ?? '-'}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-slate-100">
                                            <div>{alerta.produto_nome ?? alerta.produto_id ?? '-'}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                SKU: {alerta.produto_sku ?? '-'} | ASIN: {alerta.produto_asin ?? '-'}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {alerta.local_estoque_nome ?? alerta.canal_venda_nome ?? '-'}
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-5">
                    <p className="mb-3 text-sm text-slate-400">
                        Retorno bruto do Supabase:
                    </p>

                    <pre className="max-h-80 overflow-auto rounded-lg bg-black p-4 text-xs text-slate-200">
                        {JSON.stringify({ resumo, alertas }, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}