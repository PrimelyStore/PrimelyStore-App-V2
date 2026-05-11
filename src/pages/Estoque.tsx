import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
    buscarEstoque,
    buscarMovimentacoesEstoque,
    transferirEstoqueFIFO,
    type EstoqueSaldo,
    type MovimentacaoEstoqueDetalhada,
    type NovaTransferenciaEstoque,
} from '../services/estoqueService'
import {
    buscarLocaisEstoqueAtivos,
    type LocalEstoque,
} from '../services/locaisEstoqueService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FormularioTransferencia = {
    produto_id: string
    local_origem_id: string
    local_destino_id: string
    quantidade: string
    documento_origem: string
    observacoes: string
}

function gerarDocumentoTransferencia() {
    const agora = new Date()
    const ano = agora.getFullYear()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')
    const hora = String(agora.getHours()).padStart(2, '0')
    const minuto = String(agora.getMinutes()).padStart(2, '0')
    const segundo = String(agora.getSeconds()).padStart(2, '0')

    return `TRANSF-APP-${ano}${mes}${dia}-${hora}${minuto}${segundo}`
}

function criarFormularioInicial(): FormularioTransferencia {
    return {
        produto_id: '',
        local_origem_id: '',
        local_destino_id: '',
        quantidade: '1',
        documento_origem: gerarDocumentoTransferencia(),
        observacoes: '',
    }
}

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

function transformarTextoEmNull(valor: string) {
    const texto = valor.trim()

    if (!texto) {
        return null
    }

    return texto
}

function converterInteiro(valor: string) {
    const texto = valor.trim().replace(',', '.')

    if (!texto) {
        return 0
    }

    const numero = Number(texto)

    if (Number.isNaN(numero)) {
        return NaN
    }

    return numero
}

function obterClasseSaldo(saldo?: number | null) {
    const valor = saldo ?? 0

    if (valor > 0) {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    return 'bg-red-500/10 text-red-300 border-red-500/30'
}

function obterClasseTipoMovimentacao(tipo?: string) {
    const valor = tipo?.toLowerCase() ?? ''

    if (valor === 'compra_entrada') {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    if (valor === 'transferencia') {
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    }

    if (valor === 'venda_saida') {
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30'
    }

    if (valor === 'ajuste_entrada') {
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30'
    }

    if (valor === 'ajuste_saida') {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    return 'bg-slate-800 text-slate-300 border-slate-700'
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
    const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([])
    const [transferindo, setTransferindo] = useState(false)

    const [formulario, setFormulario] =
        useState<FormularioTransferencia>(criarFormularioInicial)

    async function recarregarEstoqueEMovimentacoes() {
        const [dadosEstoque, dadosMovimentacoes] = await Promise.all([
            buscarEstoque(),
            buscarMovimentacoesEstoque(),
        ])

        setEstoque(dadosEstoque)
        setMovimentacoes(dadosMovimentacoes)

        if (dadosEstoque.length === 0) {
            setMensagem('Consulta realizada com sucesso, mas nenhum item de estoque foi encontrado.')
        } else {
            setMensagem(`${dadosEstoque.length} item(ns) de estoque encontrado(s).`)
        }
    }

    async function carregarDadosIniciais() {
        try {
            const [dadosEstoque, dadosMovimentacoes, dadosLocais] =
                await Promise.all([
                    buscarEstoque(),
                    buscarMovimentacoesEstoque(),
                    buscarLocaisEstoqueAtivos(),
                ])

            setEstoque(dadosEstoque)
            setMovimentacoes(dadosMovimentacoes)
            setLocaisEstoque(dadosLocais)
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

    const produtosComEstoque = useMemo(() => {
        const mapa = new Map<
            string,
            {
                produto_id: string
                produto_nome: string
                produto_sku: string | null
                produto_asin: string | null
            }
        >()

        estoque.forEach((item) => {
            if (formatarNumero(item.saldo_atual) > 0) {
                mapa.set(item.produto_id, {
                    produto_id: item.produto_id,
                    produto_nome: item.produto_nome,
                    produto_sku: item.produto_sku,
                    produto_asin: item.produto_asin,
                })
            }
        })

        return Array.from(mapa.values()).sort((a, b) =>
            a.produto_nome.localeCompare(b.produto_nome)
        )
    }, [estoque])

    const locaisOrigemDisponiveis = useMemo(() => {
        if (!formulario.produto_id) {
            return []
        }

        return estoque.filter((item) => {
            return (
                item.produto_id === formulario.produto_id &&
                formatarNumero(item.saldo_atual) > 0
            )
        })
    }, [estoque, formulario.produto_id])

    const saldoOrigemSelecionada = useMemo(() => {
        const item = estoque.find((saldo) => {
            return (
                saldo.produto_id === formulario.produto_id &&
                saldo.local_estoque_id === formulario.local_origem_id
            )
        })

        return formatarNumero(item?.saldo_atual)
    }, [estoque, formulario.produto_id, formulario.local_origem_id])

    const locaisDestinoDisponiveis = locaisEstoque.filter((local) => {
        return local.id !== formulario.local_origem_id
    })

    function atualizarCampo(campo: keyof FormularioTransferencia, valor: string) {
        setFormulario((formularioAtual) => {
            const novoFormulario = {
                ...formularioAtual,
                [campo]: valor,
            }

            if (campo === 'produto_id') {
                novoFormulario.local_origem_id = ''
            }

            if (campo === 'local_origem_id') {
                novoFormulario.local_destino_id =
                    formularioAtual.local_destino_id === valor
                        ? ''
                        : formularioAtual.local_destino_id
            }

            return novoFormulario
        })
    }

    function limparFormulario() {
        setFormulario(criarFormularioInicial())
    }

    function validarFormularioTransferencia() {
        if (!formulario.produto_id) {
            return 'Selecione o produto que será transferido.'
        }

        if (!formulario.local_origem_id) {
            return 'Selecione o local de origem.'
        }

        if (!formulario.local_destino_id) {
            return 'Selecione o local de destino.'
        }

        if (formulario.local_origem_id === formulario.local_destino_id) {
            return 'O local de origem e o local de destino não podem ser iguais.'
        }

        const quantidade = converterInteiro(formulario.quantidade)

        if (Number.isNaN(quantidade) || quantidade <= 0) {
            return 'A quantidade precisa ser maior que zero.'
        }

        if (!Number.isInteger(quantidade)) {
            return 'A quantidade precisa ser um número inteiro.'
        }

        if (quantidade > saldoOrigemSelecionada) {
            return `A quantidade não pode ser maior que o saldo disponível na origem (${saldoOrigemSelecionada}).`
        }

        return null
    }

    async function enviarTransferencia(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarFormularioTransferencia()

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const novaTransferencia: NovaTransferenciaEstoque = {
            produto_id: formulario.produto_id,
            local_origem_id: formulario.local_origem_id,
            local_destino_id: formulario.local_destino_id,
            quantidade: converterInteiro(formulario.quantidade),
            documento_origem: transformarTextoEmNull(formulario.documento_origem),
            observacoes: transformarTextoEmNull(formulario.observacoes),
        }

        try {
            setTransferindo(true)
            setMensagem('Transferindo estoque via FIFO...')

            await transferirEstoqueFIFO(novaTransferencia)

            limparFormulario()
            await recarregarEstoqueEMovimentacoes()

            setStatus('sucesso')
            setMensagem('Transferência FIFO realizada com sucesso. Estoque e histórico atualizados.')
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao transferir estoque.')
            }
        } finally {
            setTransferindo(false)
        }
    }

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
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Estoque
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Saldos atuais, transferência FIFO entre locais e histórico detalhado de movimentações.
                </p>
            </div>

            <form
                onSubmit={enviarTransferencia}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Transferir estoque FIFO
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Use esta área para transferir produtos entre locais, como Prep Center North para Amazon FBA.
                        A função do banco preserva a lógica FIFO e os custos dos lotes.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Produto *
                        </label>

                        <select
                            value={formulario.produto_id}
                            onChange={(event) =>
                                atualizarCampo('produto_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione o produto</option>

                            {produtosComEstoque.map((produto) => (
                                <option key={produto.produto_id} value={produto.produto_id}>
                                    {produto.produto_nome} — SKU: {produto.produto_sku ?? '-'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Local de origem *
                        </label>

                        <select
                            value={formulario.local_origem_id}
                            onChange={(event) =>
                                atualizarCampo('local_origem_id', event.target.value)
                            }
                            disabled={!formulario.produto_id}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">Selecione a origem</option>

                            {locaisOrigemDisponiveis.map((item) => (
                                <option
                                    key={item.local_estoque_id}
                                    value={item.local_estoque_id}
                                >
                                    {item.local_estoque_nome} — saldo: {formatarNumero(item.saldo_atual)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Local de destino *
                        </label>

                        <select
                            value={formulario.local_destino_id}
                            onChange={(event) =>
                                atualizarCampo('local_destino_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione o destino</option>

                            {locaisDestinoDisponiveis.map((local) => (
                                <option key={local.id} value={local.id}>
                                    {local.nome} — {local.tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Quantidade *
                        </label>

                        <input
                            value={formulario.quantidade}
                            onChange={(event) =>
                                atualizarCampo('quantidade', event.target.value)
                            }
                            placeholder="Ex: 1"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />

                        {formulario.local_origem_id && (
                            <p className="mt-2 text-xs text-slate-500">
                                Saldo disponível na origem: {saldoOrigemSelecionada}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Documento de origem
                        </label>

                        <input
                            value={formulario.documento_origem}
                            onChange={(event) =>
                                atualizarCampo('documento_origem', event.target.value)
                            }
                            placeholder="Ex: TRANSF-APP-001"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Observações
                        </label>

                        <textarea
                            value={formulario.observacoes}
                            onChange={(event) =>
                                atualizarCampo('observacoes', event.target.value)
                            }
                            rows={3}
                            placeholder="Observações sobre a transferência"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={transferindo}
                        className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {transferindo ? 'Transferindo...' : 'Transferir estoque'}
                    </button>
                </div>
            </form>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Itens retornados
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {estoque.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Quantidade total
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {quantidadeTotal}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Locais com saldo
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                        {locaisComSaldo}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Locais sem saldo
                    </p>

                    <p className="mt-3 text-3xl font-bold text-red-300">
                        {locaisSemSaldo}
                    </p>
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
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Saldos de estoque encontrados
                    </h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
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
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">ASIN</th>
                                    <th className="px-4 py-3 font-medium">Local</th>
                                    <th className="px-4 py-3 font-medium">Tipo do local</th>
                                    <th className="px-4 py-3 font-medium">Saldo atual</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
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
                                            <td className="px-4 py-3 text-slate-100">
                                                {item.produto_nome}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.produto_sku ?? '-'}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.produto_asin ?? '-'}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.local_estoque_nome}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.local_estoque_tipo}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-slate-100">
                                                {saldo}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${obterClasseSaldo(
                                                        item.saldo_atual
                                                    )}`}
                                                >
                                                    {saldo > 0 ? 'com saldo' : 'sem saldo'}
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

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Movimentações listadas
                    </p>

                    <p className="mt-3 text-3xl font-bold">
                        {movimentacoes.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Entradas
                    </p>

                    <p className="mt-3 text-3xl font-bold text-emerald-300">
                        {totalEntradas}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Transferências
                    </p>

                    <p className="mt-3 text-3xl font-bold text-cyan-300">
                        {totalTransferencias}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">
                        Saídas
                    </p>

                    <p className="mt-3 text-3xl font-bold text-orange-300">
                        {totalSaidas}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        Histórico de movimentações
                    </h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
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
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1400px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Data</th>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Origem</th>
                                    <th className="px-4 py-3 font-medium">Destino</th>
                                    <th className="px-4 py-3 font-medium">Qtd.</th>
                                    <th className="px-4 py-3 font-medium">Documento</th>
                                    <th className="px-4 py-3 font-medium">Observações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {movimentacoes.map((movimento) => (
                                    <tr
                                        key={movimento.movimentacao_id}
                                        className="hover:bg-slate-800/60"
                                    >
                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarDataHora(
                                                movimento.data_movimentacao ?? movimento.created_at
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-slate-100">
                                            {movimento.produto_nome}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {movimento.produto_sku ?? '-'}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${obterClasseTipoMovimentacao(
                                                    movimento.tipo
                                                )}`}
                                            >
                                                {traduzirTipoMovimentacao(movimento.tipo)}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {movimento.local_origem_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {movimento.local_destino_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            {movimento.quantidade}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {movimento.documento_origem ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {movimento.observacoes ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-5">
                    <p className="mb-3 text-sm text-slate-400">
                        Retorno bruto das movimentações:
                    </p>

                    <pre className="max-h-80 overflow-auto rounded-lg bg-black p-4 text-xs text-slate-200">
                        {JSON.stringify(movimentacoes, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}