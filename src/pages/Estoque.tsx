import { useEffect, useState } from 'react'
import {
    buscarEstoque,
    buscarMovimentacoesEstoque,
    type EstoqueSaldo,
    type MovimentacaoEstoqueDetalhada,
} from '../services/estoqueService'
import {
    AppCard,
    DataTableContainer,
    PageHeader,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'
type StatusBadgeTone =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'muted'

function formatarNumero(valor?: number | null) {
    if (typeof valor !== 'number') {
        return 0
    }

    return valor
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

function obterTomSaldo(saldo?: number | null): StatusBadgeTone {
    const valor = saldo ?? 0

    if (valor > 0) {
        return 'success'
    }

    return 'danger'
}

function obterTomTipoMovimentacao(tipo?: string): StatusBadgeTone {
    const valor = tipo?.toLowerCase() ?? ''

    if (valor === 'compra_entrada') {
        return 'success'
    }

    if (valor === 'transferencia') {
        return 'info'
    }

    if (valor === 'venda_saida') {
        return 'warning'
    }

    if (valor === 'ajuste_entrada') {
        return 'info'
    }

    if (valor === 'ajuste_saida') {
        return 'danger'
    }

    return 'muted'
}

function traduzirTipoMovimentacao(tipo?: string) {
    if (tipo === 'compra_entrada') {
        return 'entrada compra'
    }

    if (tipo === 'transferencia') {
        return 'transferência'
    }

    if (tipo === 'venda_saida') {
        return 'saída venda'
    }

    if (tipo === 'ajuste_entrada') {
        return 'ajuste entrada'
    }

    if (tipo === 'ajuste_saida') {
        return 'ajuste saída'
    }

    return tipo ?? '-'
}

export function Estoque() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando estoque...')
    const [estoque, setEstoque] = useState<EstoqueSaldo[]>([])
    const [movimentacoes, setMovimentacoes] = useState<
        MovimentacaoEstoqueDetalhada[]
    >([])

    async function carregarDadosIniciais() {
        try {
            const [dadosEstoque, dadosMovimentacoes] =
                await Promise.all([
                    buscarEstoque(),
                    buscarMovimentacoesEstoque(),
                ])

            setEstoque(dadosEstoque)
            setMovimentacoes(dadosMovimentacoes)
            setStatus('sucesso')

            if (dadosEstoque.length === 0) {
                setMensagem('Consulta realizada com sucesso, mas nenhum item de estoque foi encontrado.')
            } else {
                setMensagem(`${dadosEstoque.length} item(ns) de estoque encontrado(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao buscar estoque.')
            }
        }
    }

    useEffect(() => {
        carregarDadosIniciais()
    }, [])

    const quantidadeTotal = estoque.reduce((total, item) => {
        return total + formatarNumero(item.saldo_atual)
    }, 0)

    const locaisComSaldo = estoque.filter((item) => {
        return formatarNumero(item.saldo_atual) > 0
    }).length

    const locaisSemSaldo = estoque.filter((item) => {
        return formatarNumero(item.saldo_atual) <= 0
    }).length

    const totalEntradas = movimentacoes.filter((movimento) => {
        return movimento.tipo === 'compra_entrada' || movimento.tipo === 'ajuste_entrada'
    }).length

    const totalTransferencias = movimentacoes.filter((movimento) => {
        return movimento.tipo === 'transferencia'
    }).length

    const totalSaidas = movimentacoes.filter((movimento) => {
        return movimento.tipo === 'venda_saida' || movimento.tipo === 'ajuste_saida'
    }).length

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <PageHeader
                tag="MÓDULO"
                title="Estoque"
                description="Saldos atuais e histórico detalhado de movimentações de estoque consolidadas."
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AppCard>
                    <p className="text-sm text-slate-400">
                        Itens retornados
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {estoque.length}
                    </p>
                </AppCard>

                <AppCard>
                    <p className="text-sm text-slate-400">
                        Quantidade total
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {quantidadeTotal}
                    </p>
                </AppCard>

                <AppCard>
                    <p className="text-sm text-slate-400">
                        Locais com saldo
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                        {locaisComSaldo}
                    </p>
                </AppCard>

                <AppCard>
                    <p className="text-sm text-slate-400">
                        Locais sem saldo
                    </p>

                    <p className="mt-3 text-3xl font-bold text-red-300">
                        {locaisSemSaldo}
                    </p>
                </AppCard>
            </div>

            <AppCard>
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
            </AppCard>

            <AppCard>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Saldos de estoque encontrados
                    </h2>

                    <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {estoque.length}
                    </span>
                </div>

                {estoque.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum saldo de estoque para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[860px] border-collapse text-left text-xs sm:text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="w-[240px] px-3 py-3 font-medium sm:px-4">Produto</th>
                                    <th className="w-[160px] px-3 py-3 font-medium sm:px-4">SKU</th>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">ASIN</th>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">Local</th>
                                    <th className="w-[130px] px-3 py-3 font-medium sm:px-4">Tipo do local</th>
                                    <th className="w-[100px] px-3 py-3 font-medium sm:px-4">Saldo atual</th>
                                    <th className="w-[110px] px-3 py-3 font-medium sm:px-4">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {estoque.map((item) => {
                                    const saldo = formatarNumero(item.saldo_atual)

                                    return (
                                        <tr
                                            key={`${item.produto_id}-${item.local_estoque_id}`}
                                            className="hover:bg-slate-800/60"
                                        >
                                            <td className="max-w-[240px] px-3 py-3 font-medium text-slate-100 sm:px-4">
                                                {item.produto_nome}
                                            </td>

                                            <td className="max-w-[160px] px-3 py-3 text-slate-300 sm:px-4">
                                                <span className="break-words">{item.produto_sku ?? '-'}</span>
                                            </td>

                                            <td className="px-3 py-3 text-slate-300 sm:px-4">
                                                {item.produto_asin ?? '-'}
                                            </td>

                                            <td className="max-w-[150px] px-3 py-3 text-slate-300 sm:px-4">
                                                {item.local_estoque_nome}
                                            </td>

                                            <td className="px-3 py-3 text-slate-300 sm:px-4">
                                                {item.local_estoque_tipo}
                                            </td>

                                            <td className="px-3 py-3 font-semibold text-slate-100 sm:px-4">
                                                {saldo}
                                            </td>

                                            <td className="px-3 py-3 sm:px-4">
                                                <StatusBadge tone={obterTomSaldo(item.saldo_atual)}>
                                                    {saldo > 0 ? 'com saldo' : 'sem saldo'}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </DataTableContainer>
                )}
            </AppCard>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AppCard>
                    <p className="text-sm text-slate-400">
                        Movimentações listadas
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {movimentacoes.length}
                    </p>
                </AppCard>

                <AppCard>
                    <p className="text-sm text-slate-400">
                        Entradas
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                        {totalEntradas}
                    </p>
                </AppCard>

                <AppCard>
                    <p className="text-sm text-slate-400">
                        Transferências
                    </p>

                    <p className="mt-3 text-3xl font-bold text-cyan-300">
                        {totalTransferencias}
                    </p>
                </AppCard>

                <AppCard>
                    <p className="text-sm text-slate-400">
                        Saídas
                    </p>

                    <p className="mt-3 text-3xl font-bold text-orange-300">
                        {totalSaidas}
                    </p>
                </AppCard>
            </div>

            <AppCard>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Histórico de movimentações
                    </h2>

                    <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Últimas {movimentacoes.length}
                    </span>
                </div>

                {movimentacoes.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhuma movimentação de estoque encontrada.
                        </p>
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[1160px] border-collapse text-left text-xs sm:text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="w-[130px] px-3 py-3 font-medium sm:px-4">Data</th>
                                    <th className="w-[230px] px-3 py-3 font-medium sm:px-4">Produto</th>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">SKU</th>
                                    <th className="w-[140px] px-3 py-3 font-medium sm:px-4">Tipo</th>
                                    <th className="w-[140px] px-3 py-3 font-medium sm:px-4">Origem</th>
                                    <th className="w-[140px] px-3 py-3 font-medium sm:px-4">Destino</th>
                                    <th className="w-[80px] px-3 py-3 font-medium sm:px-4">Qtd.</th>
                                    <th className="w-[140px] px-3 py-3 font-medium sm:px-4">Documento</th>
                                    <th className="w-[230px] px-3 py-3 font-medium sm:px-4">Observações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {movimentacoes.map((movimento) => (
                                    <tr
                                        key={movimento.movimentacao_id}
                                        className="hover:bg-slate-800/60"
                                    >
                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {formatarDataHora(
                                                movimento.data_movimentacao ?? movimento.created_at
                                            )}
                                        </td>

                                        <td className="max-w-[230px] px-3 py-3 font-medium text-slate-100 sm:px-4">
                                            {movimento.produto_nome}
                                        </td>

                                        <td className="max-w-[150px] px-3 py-3 text-slate-300 sm:px-4">
                                            <span className="break-words">{movimento.produto_sku ?? '-'}</span>
                                        </td>

                                        <td className="px-3 py-3 sm:px-4">
                                            <StatusBadge
                                                tone={obterTomTipoMovimentacao(
                                                    movimento.tipo
                                                )}
                                            >
                                                {traduzirTipoMovimentacao(movimento.tipo)}
                                            </StatusBadge>
                                        </td>

                                        <td className="max-w-[140px] px-3 py-3 text-slate-300 sm:px-4">
                                            {movimento.local_origem_nome ?? '-'}
                                        </td>

                                        <td className="max-w-[140px] px-3 py-3 text-slate-300 sm:px-4">
                                            {movimento.local_destino_nome ?? '-'}
                                        </td>

                                        <td className="px-3 py-3 font-semibold text-slate-100 sm:px-4">
                                            {movimento.quantidade}
                                        </td>

                                        <td className="max-w-[140px] px-3 py-3 text-slate-300 sm:px-4">
                                            <span className="break-words">{movimento.documento_origem ?? '-'}</span>
                                        </td>

                                        <td className="max-w-[230px] px-3 py-3 text-slate-300 sm:px-4">
                                            {movimento.observacoes ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataTableContainer>
                )}
            </AppCard>
        </div>
    )
}
