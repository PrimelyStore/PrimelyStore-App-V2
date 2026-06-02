import { useEffect, useMemo, useState } from 'react'
import {
    AppButton,
    AppCard,
    DataTableContainer,
    PageHeader,
    StatCard,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'
import {
    buscarPainelIntegracoesOlist,
    type PainelIntegracoesOlist,
} from '../services/olistIntegracoesService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type StatusBadgeTone =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'muted'

function formatarNumero(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR').format(Number(valor ?? 0))
}

function formatarMoeda(valor?: number | string | null) {
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

function formatarOrigemLog(origem: string) {
    const nomes: Record<string, string> = {
        pedidos: 'Pedidos',
        notas_entrada: 'Notas de entrada',
    }

    return nomes[origem] ?? origem
}

function obterTomStatus(status?: string | null): StatusBadgeTone {
    if (status === 'sucesso' || status === 'processado' || status === 'ativo') {
        return 'success'
    }

    if (status === 'parcial' || status === 'pendente' || status === 'pronto_para_analise') {
        return 'warning'
    }

    if (status === 'erro' || status === 'pedido_com_erro') {
        return 'danger'
    }

    if (status === 'ignorado') {
        return 'muted'
    }

    return 'default'
}

export function IntegracoesOlist() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState(
        'Carregando painel gerencial do Olist...'
    )
    const [painel, setPainel] = useState<PainelIntegracoesOlist | null>(null)

    async function carregarPainel() {
        try {
            setStatus('carregando')
            setMensagem('Carregando painel gerencial do Olist...')

            const dados = await buscarPainelIntegracoesOlist()

            setPainel(dados)
            setStatus('sucesso')
            setMensagem('Dados gerenciais do Olist carregados com sucesso.')
        } catch (error) {
            setStatus('erro')
            setPainel(null)

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar dados do Olist.')
            }
        }
    }

    useEffect(() => {
        carregarPainel()
    }, [])

    const ultimaSincronizacaoGeral = useMemo(() => {
        if (!painel) {
            return null
        }

        const datas = [
            painel.produtos.ultimaSincronizacao,
            painel.pedidos.ultimaSincronizacao,
            painel.notasEntrada.ultimaSincronizacao,
            ...painel.estoquePorDeposito.map((item) => item.ultima_sincronizacao),
            ...painel.depositos.map((item) => item.sincronizado_em),
        ]
            .filter((data): data is string => Boolean(data))
            .map((data) => new Date(data).getTime())
            .filter((timestamp) => Number.isFinite(timestamp))

        if (datas.length === 0) {
            return null
        }

        return new Date(Math.max(...datas)).toISOString()
    }, [painel])

    return (
        <div className="space-y-6">
            <PageHeader
                tag="INTEGRAÇÕES"
                title="Integrações Olist"
                description="Painel somente leitura para acompanhar snapshots vindos do Olist/Tiny. Esta tela é gerencial: não processa pedidos, não cria vendas oficiais e não executa baixa FIFO."
            />

            <AppCard className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-200">
                        Status do carregamento
                    </p>

                    <p className="mt-2 text-sm text-slate-400">{mensagem}</p>

                    <p className="mt-2 text-xs text-slate-500">
                        Última sincronização geral identificada:{' '}
                        <span className="text-slate-300">
                            {formatarDataHora(ultimaSincronizacaoGeral)}
                        </span>
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <StatusBadge
                        tone={
                            status === 'sucesso'
                                ? 'success'
                                : status === 'erro'
                                  ? 'danger'
                                  : 'warning'
                        }
                    >
                        {status === 'sucesso'
                            ? 'Carregado'
                            : status === 'erro'
                              ? 'Erro'
                              : 'Carregando'}
                    </StatusBadge>

                    <AppButton
                        variant="secondary"
                        onClick={carregarPainel}
                        disabled={status === 'carregando'}
                    >
                        Recarregar dados
                    </AppButton>
                </div>
            </AppCard>

            {painel ? (
                <>
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Produtos Olist"
                            value={formatarNumero(painel.produtos.total)}
                            description={`Ativos: ${formatarNumero(
                                painel.produtos.ativos
                            )} • Sem SKU: ${formatarNumero(
                                painel.produtos.semSku
                            )}`}
                            tone="info"
                        />

                        <StatCard
                            label="Pedidos importados"
                            value={formatarNumero(painel.pedidos.totalPedidos)}
                            description={`Pendentes: ${formatarNumero(
                                painel.pedidos.pendentes
                            )} • Processados: ${formatarNumero(
                                painel.pedidos.processados
                            )}`}
                            tone="purple"
                        />

                        <StatCard
                            label="Faturamento Olist snapshot"
                            value={formatarMoeda(painel.pedidos.valorTotalPedidos)}
                            description="Soma dos pedidos já importados para snapshots gerenciais."
                            tone="success"
                        />

                        <StatCard
                            label="Notas de entrada"
                            value={formatarNumero(painel.notasEntrada.total)}
                            description={`Pendentes: ${formatarNumero(
                                painel.notasEntrada.pendentes
                            )} • Erros: ${formatarNumero(
                                painel.notasEntrada.comErro
                            )}`}
                            tone="warning"
                        />
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <AppCard>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-100">
                                        Estoque Olist por depósito
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Saldos vindos do snapshot de estoque por depósito.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {painel.estoquePorDeposito.map((deposito) => (
                                    <div
                                        key={deposito.deposito_nome}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-200">
                                                    {deposito.deposito_nome}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatarNumero(deposito.total_produtos)} produto(s)
                                                </p>
                                            </div>

                                            <StatusBadge tone="info">Snapshot</StatusBadge>
                                        </div>

                                        <dl className="mt-4 grid gap-3 text-sm">
                                            <div className="flex justify-between gap-3">
                                                <dt className="text-slate-500">Saldo total</dt>
                                                <dd className="font-semibold text-slate-100">
                                                    {formatarNumero(deposito.saldo_total)}
                                                </dd>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <dt className="text-slate-500">Reservado</dt>
                                                <dd className="font-semibold text-yellow-300">
                                                    {formatarNumero(deposito.reservado_total)}
                                                </dd>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <dt className="text-slate-500">Disponível</dt>
                                                <dd className="font-semibold text-emerald-300">
                                                    {formatarNumero(deposito.disponivel_total)}
                                                </dd>
                                            </div>
                                        </dl>

                                        <p className="mt-4 text-xs text-slate-500">
                                            Atualizado em:{' '}
                                            {formatarDataHora(deposito.ultima_sincronizacao)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </AppCard>

                        <AppCard>
                            <h2 className="text-lg font-bold text-slate-100">
                                Depósitos cadastrados no Olist
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                No conceito atual, Geral representa o Prep Center e FBA representa o estoque relacionado à Amazon FBA no Olist.
                            </p>

                            <div className="mt-5 space-y-3">
                                {painel.depositos.map((deposito) => (
                                    <div
                                        key={deposito.id_deposito_olist}
                                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-100">
                                                    {deposito.descricao ?? 'Depósito sem nome'}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    ID Olist: {deposito.id_deposito_olist} • Tipo: {deposito.tipo ?? '-'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {deposito.padrao ? (
                                                    <StatusBadge tone="success">Padrão</StatusBadge>
                                                ) : null}

                                                {deposito.possui_reserva ? (
                                                    <StatusBadge tone="purple">Reserva</StatusBadge>
                                                ) : null}
                                            </div>
                                        </div>

                                        <p className="mt-3 text-xs text-slate-500">
                                            Sincronizado em: {formatarDataHora(deposito.sincronizado_em)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </AppCard>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <AppCard>
                            <h2 className="text-lg font-bold text-slate-100">
                                Saúde dos pedidos Olist
                            </h2>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Itens vinculados</p>
                                    <p className="mt-2 text-2xl font-bold text-emerald-300">
                                        {formatarNumero(
                                            painel.pedidos.itensComProdutoVinculado
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Itens sem produto</p>
                                    <p className="mt-2 text-2xl font-bold text-red-300">
                                        {formatarNumero(
                                            painel.pedidos.itensSemProdutoVinculado
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Pedidos com erro</p>
                                    <p className="mt-2 text-2xl font-bold text-red-300">
                                        {formatarNumero(painel.pedidos.comErro)}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                                    <p className="text-xs text-slate-500">Pedidos ignorados</p>
                                    <p className="mt-2 text-2xl font-bold text-slate-300">
                                        {formatarNumero(painel.pedidos.ignorados)}
                                    </p>
                                </div>
                            </div>
                        </AppCard>

                        <AppCard>
                            <h2 className="text-lg font-bold text-slate-100">
                                Regra operacional aplicada
                            </h2>

                            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                                <p>
                                    Esta página lê snapshots do Olist e views gerenciais do Supabase.
                                </p>

                                <p>
                                    Ela não chama RPCs de processamento, não cria vendas oficiais e não executa baixa FIFO.
                                </p>

                                <p>
                                    A próxima evolução natural é adicionar filtros, botões controlados de sincronização e relatórios gerenciais, sempre mantendo o Olist como ERP operacional oficial.
                                </p>
                            </div>
                        </AppCard>
                    </section>

                    <AppCard>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">
                                    Pedidos Olist recentes
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Últimos itens importados na view gerencial de pedidos Olist.
                                </p>
                            </div>
                        </div>

                        <DataTableContainer className="mt-5" maxHeightClassName="max-h-[520px]">
                            <table className="min-w-[1100px] divide-y divide-slate-800 text-left text-sm">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Pedido</th>
                                        <th className="px-4 py-3 font-semibold">Marketplace</th>
                                        <th className="px-4 py-3 font-semibold">Canal</th>
                                        <th className="px-4 py-3 font-semibold">Depósito</th>
                                        <th className="px-4 py-3 font-semibold">SKU</th>
                                        <th className="px-4 py-3 font-semibold">Produto</th>
                                        <th className="px-4 py-3 font-semibold">Qtd.</th>
                                        <th className="px-4 py-3 font-semibold">Valor item</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Produto vinculado</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {painel.pedidosRecentes.map((pedido, index) => (
                                        <tr
                                            key={`${pedido.id_pedido_olist}-${pedido.sku_olist}-${index}`}
                                            className="hover:bg-slate-800/40"
                                        >
                                            <td className="px-4 py-3 text-slate-200">
                                                {pedido.numero_pedido ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {pedido.numero_pedido_ecommerce ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {pedido.ecommerce_nome ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {pedido.deposito_nome ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-cyan-300">
                                                {pedido.sku_olist ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {pedido.descricao_olist ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarNumero(pedido.quantidade)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarMoeda(pedido.valor_total_item)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    tone={obterTomStatus(
                                                        pedido.status_gerencial
                                                    )}
                                                >
                                                    {pedido.status_gerencial ?? '-'}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    tone={
                                                        pedido.produto_vinculado
                                                            ? 'success'
                                                            : 'danger'
                                                    }
                                                >
                                                    {pedido.produto_vinculado
                                                        ? 'Sim'
                                                        : 'Não'}
                                                </StatusBadge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>

                    <AppCard>
                        <h2 className="text-lg font-bold text-slate-100">
                            Últimos logs de sincronização
                        </h2>

                        <DataTableContainer className="mt-5" maxHeightClassName="max-h-[420px]">
                            <table className="min-w-[900px] divide-y divide-slate-800 text-left text-sm">
                                <thead className={stickyTableHeadClassName}>
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Origem</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Início</th>
                                        <th className="px-4 py-3 font-semibold">Fim</th>
                                        <th className="px-4 py-3 font-semibold">Lidos</th>
                                        <th className="px-4 py-3 font-semibold">Inseridos</th>
                                        <th className="px-4 py-3 font-semibold">Atualizados</th>
                                        <th className="px-4 py-3 font-semibold">Erros</th>
                                        <th className="px-4 py-3 font-semibold">Mensagem</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-800">
                                    {painel.logsRecentes.map((log, index) => (
                                        <tr
                                            key={`${log.origem}-${log.data_inicio}-${index}`}
                                            className="hover:bg-slate-800/40"
                                        >
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarOrigemLog(log.origem)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge tone={obterTomStatus(log.status)}>
                                                    {log.status ?? '-'}
                                                </StatusBadge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarDataHora(log.data_inicio)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarDataHora(log.data_fim)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarNumero(log.lidos)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarNumero(log.inseridos)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarNumero(log.atualizados)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarNumero(log.erros)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">
                                                {log.mensagem ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>
                </>
            ) : status === 'carregando' ? (
                <AppCard>
                    <p className="text-sm text-slate-400">
                        Carregando dados do Olist...
                    </p>
                </AppCard>
            ) : null}
        </div>
    )
}
