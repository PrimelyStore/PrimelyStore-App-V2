import { useEffect, useState, type FormEvent } from 'react'
import {
    buscarComprasResumo,
    buscarItensCompras,
    cadastrarCompra,
    cadastrarItemCompra,
    receberItemCompra,
    type CompraItemDetalhado,
    type CompraResumo,
    type NovaCompra,
    type NovoCompraItem,
} from '../services/comprasService'
import {
    buscarFornecedores,
    type Fornecedor,
} from '../services/fornecedoresService'
import {
    buscarLocaisEstoqueAtivos,
    type LocalEstoque,
} from '../services/locaisEstoqueService'
import { buscarProdutos, type Produto } from '../services/produtosService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FormularioCompra = {
    fornecedor_id: string
    local_destino_id: string
    numero_pedido: string
    numero_nota_fiscal: string
    data_compra: string
    data_prevista_entrega: string
    data_recebimento: string
    status: string
    valor_frete: string
    valor_desconto: string
    outros_custos: string
    observacoes: string
}

type FormularioItemCompra = {
    compra_id: string
    produto_id: string
    quantidade: string
    quantidade_recebida: string
    custo_unitario: string
    valor_desconto_item: string
    valor_impostos_item: string
    outros_custos_item: string
    codigo_produto_fornecedor: string
    lote: string
    validade: string
    status: string
    observacoes: string
}

function obterDataHoje() {
    return new Date().toISOString().slice(0, 10)
}

const formularioInicial: FormularioCompra = {
    fornecedor_id: '',
    local_destino_id: '',
    numero_pedido: '',
    numero_nota_fiscal: '',
    data_compra: obterDataHoje(),
    data_prevista_entrega: '',
    data_recebimento: '',
    status: 'rascunho',
    valor_frete: '0',
    valor_desconto: '0',
    outros_custos: '0',
    observacoes: '',
}

const formularioItemInicial: FormularioItemCompra = {
    compra_id: '',
    produto_id: '',
    quantidade: '1',
    quantidade_recebida: '0',
    custo_unitario: '0',
    valor_desconto_item: '0',
    valor_impostos_item: '0',
    outros_custos_item: '0',
    codigo_produto_fornecedor: '',
    lote: '',
    validade: '',
    status: 'pendente',
    observacoes: '',
}

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

    const dataConvertida = new Date(`${data}T00:00:00`)

    if (Number.isNaN(dataConvertida.getTime())) {
        return data
    }

    return new Intl.DateTimeFormat('pt-BR').format(dataConvertida)
}

function transformarTextoEmNull(valor: string) {
    const texto = valor.trim()

    if (!texto) {
        return null
    }

    return texto
}

function transformarDataEmNull(valor: string) {
    const texto = valor.trim()

    if (!texto) {
        return null
    }

    return texto
}

function converterNumero(valor: string) {
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

function converterNumeroSeguro(valor: string) {
    const numero = converterNumero(valor)

    if (Number.isNaN(numero)) {
        return 0
    }

    return numero
}

function obterClasseStatus(status?: string) {
    const valor = status?.toLowerCase() ?? ''

    if (valor === 'recebido') {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    if (valor === 'pedido_realizado') {
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    }

    if (valor === 'rascunho' || valor === 'pendente') {
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }

    if (valor === 'cancelado') {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
}

function obterStatusRecebimentoItem(item: CompraItemDetalhado) {
    const quantidade = Number(item.quantidade ?? 0)
    const quantidadeRecebida = Number(item.quantidade_recebida ?? 0)
    const pendente = quantidade - quantidadeRecebida

    if (item.status === 'cancelado') {
        return 'cancelado'
    }

    if (pendente <= 0 && quantidade > 0) {
        return 'recebido'
    }

    if (quantidadeRecebida > 0 && pendente > 0) {
        return 'parcialmente_recebido'
    }

    return 'pendente'
}

function obterRotuloStatusRecebimento(status: string) {
    const rotulos: Record<string, string> = {
        pendente: 'Pendente',
        parcialmente_recebido: 'Parcial',
        recebido: 'Recebido',
        cancelado: 'Cancelado',
    }

    return rotulos[status] ?? status
}

function obterClasseStatusRecebimento(status: string) {
    if (status === 'recebido') {
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }

    if (status === 'parcialmente_recebido') {
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
    }

    if (status === 'pendente') {
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
    }

    if (status === 'cancelado') {
        return 'bg-red-500/10 text-red-300 border-red-500/30'
    }

    return 'bg-slate-800 text-slate-300 border-slate-700'
}

function obterClasseLinhaItemCompra(statusRecebimento: string, selecionado: boolean) {
    if (selecionado) {
        return 'bg-emerald-500/10 hover:bg-emerald-500/20'
    }

    if (statusRecebimento === 'recebido') {
        return 'bg-emerald-500/5 hover:bg-emerald-500/10'
    }

    if (statusRecebimento === 'parcialmente_recebido') {
        return 'bg-cyan-500/5 hover:bg-cyan-500/10'
    }

    if (statusRecebimento === 'pendente') {
        return 'bg-yellow-500/5 hover:bg-yellow-500/10'
    }

    if (statusRecebimento === 'cancelado') {
        return 'bg-red-500/5 hover:bg-red-500/10'
    }

    return 'hover:bg-slate-800/60'
}

function calcularPercentualRecebido(item: CompraItemDetalhado) {
    const quantidade = Number(item.quantidade ?? 0)
    const quantidadeRecebida = Number(item.quantidade_recebida ?? 0)

    if (quantidade <= 0) {
        return 0
    }

    return Math.min(100, Math.max(0, (quantidadeRecebida / quantidade) * 100))
}

function validarFormularioCompra(formulario: FormularioCompra) {
    if (!formulario.fornecedor_id) {
        return 'Selecione um fornecedor.'
    }

    if (!formulario.local_destino_id) {
        return 'Selecione o local de destino.'
    }

    if (!formulario.data_compra) {
        return 'Informe a data da compra.'
    }

    if (!formulario.status) {
        return 'Informe o status da compra.'
    }

    const statusPermitidos = [
        'rascunho',
        'pedido_realizado',
        'recebido',
        'cancelado',
    ]

    if (!statusPermitidos.includes(formulario.status)) {
        return 'Status da compra inválido.'
    }

    const valorFrete = converterNumero(formulario.valor_frete)
    const valorDesconto = converterNumero(formulario.valor_desconto)
    const outrosCustos = converterNumero(formulario.outros_custos)

    if (Number.isNaN(valorFrete) || valorFrete < 0) {
        return 'O valor do frete precisa ser um número maior ou igual a zero.'
    }

    if (Number.isNaN(valorDesconto) || valorDesconto < 0) {
        return 'O valor do desconto precisa ser um número maior ou igual a zero.'
    }

    if (Number.isNaN(outrosCustos) || outrosCustos < 0) {
        return 'O valor de outros custos precisa ser um número maior ou igual a zero.'
    }

    return null
}

function validarFormularioItem(formulario: FormularioItemCompra) {
    if (!formulario.compra_id) {
        return 'Selecione a compra para adicionar o item.'
    }

    if (!formulario.produto_id) {
        return 'Selecione o produto da compra.'
    }

    const quantidade = converterNumero(formulario.quantidade)
    const quantidadeRecebida = converterNumero(formulario.quantidade_recebida)
    const custoUnitario = converterNumero(formulario.custo_unitario)
    const descontoItem = converterNumero(formulario.valor_desconto_item)
    const impostosItem = converterNumero(formulario.valor_impostos_item)
    const outrosCustosItem = converterNumero(formulario.outros_custos_item)

    if (Number.isNaN(quantidade) || quantidade <= 0) {
        return 'A quantidade precisa ser maior que zero.'
    }

    if (
        Number.isNaN(quantidadeRecebida) ||
        quantidadeRecebida < 0 ||
        quantidadeRecebida > quantidade
    ) {
        return 'A quantidade recebida precisa ser entre 0 e a quantidade comprada.'
    }

    if (Number.isNaN(custoUnitario) || custoUnitario < 0) {
        return 'O custo unitário precisa ser maior ou igual a zero.'
    }

    if (Number.isNaN(descontoItem) || descontoItem < 0) {
        return 'O desconto do item precisa ser maior ou igual a zero.'
    }

    if (Number.isNaN(impostosItem) || impostosItem < 0) {
        return 'O imposto do item precisa ser maior ou igual a zero.'
    }

    if (Number.isNaN(outrosCustosItem) || outrosCustosItem < 0) {
        return 'Outros custos do item precisa ser maior ou igual a zero.'
    }

    const statusPermitidos = [
        'pendente',
        'parcialmente_recebido',
        'recebido',
        'cancelado',
    ]

    if (!statusPermitidos.includes(formulario.status)) {
        return 'Status do item inválido.'
    }

    return null
}

export function Compras() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando compras...')
    const [compras, setCompras] = useState<CompraResumo[]>([])
    const [itensCompras, setItensCompras] = useState<CompraItemDetalhado[]>([])
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
    const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([])
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [salvandoCompra, setSalvandoCompra] = useState(false)
    const [salvandoItem, setSalvandoItem] = useState(false)
    const [recebendoItemId, setRecebendoItemId] = useState<string | null>(null)
    const [itemSelecionadoParaReceber, setItemSelecionadoParaReceber] =
        useState<CompraItemDetalhado | null>(null)

    const [formularioCompra, setFormularioCompra] =
        useState<FormularioCompra>(formularioInicial)

    const [formularioItem, setFormularioItem] =
        useState<FormularioItemCompra>(formularioItemInicial)

    async function recarregarComprasEItens() {
        const [comprasResumo, itensDados] = await Promise.all([
            buscarComprasResumo(),
            buscarItensCompras(),
        ])

        setCompras(comprasResumo)
        setItensCompras(itensDados)

        if (comprasResumo.length === 0) {
            setMensagem('Consulta realizada com sucesso, mas nenhuma compra foi encontrada.')
        } else {
            setMensagem(`${comprasResumo.length} compra(s) encontrada(s).`)
        }
    }

    async function carregarDadosIniciais() {
        try {
            const [
                comprasResumo,
                itensDados,
                fornecedoresDados,
                locaisDados,
                produtosDados,
            ] = await Promise.all([
                buscarComprasResumo(),
                buscarItensCompras(),
                buscarFornecedores(),
                buscarLocaisEstoqueAtivos(),
                buscarProdutos(),
            ])

            setCompras(comprasResumo)
            setItensCompras(itensDados)
            setFornecedores(fornecedoresDados)
            setLocaisEstoque(locaisDados)
            setProdutos(produtosDados)
            setStatus('sucesso')

            if (comprasResumo.length === 0) {
                setMensagem('Consulta realizada com sucesso, mas nenhuma compra foi encontrada.')
            } else {
                setMensagem(`${comprasResumo.length} compra(s) encontrada(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar dados de compras.')
            }
        }
    }

    useEffect(() => {
        carregarDadosIniciais()
    }, [])

    function atualizarCampoCompra(campo: keyof FormularioCompra, valor: string) {
        setFormularioCompra((formularioAtual) => ({
            ...formularioAtual,
            [campo]: valor,
        }))
    }

    function atualizarCampoItem(campo: keyof FormularioItemCompra, valor: string) {
        setFormularioItem((formularioAtual) => ({
            ...formularioAtual,
            [campo]: valor,
        }))
    }

    function limparFormularioCompra() {
        setFormularioCompra({
            ...formularioInicial,
            data_compra: obterDataHoje(),
        })
    }

    function limparFormularioItem(compraIdParaManter = '') {
        setFormularioItem({
            ...formularioItemInicial,
            compra_id: compraIdParaManter,
        })
    }

    function selecionarCompraParaItem(compra: CompraResumo) {
        setFormularioItem((formularioAtual) => ({
            ...formularioAtual,
            compra_id: compra.compra_id,
        }))

        setStatus('sucesso')
        setMensagem(
            `Compra ${compra.numero_pedido ?? 'sem número'} selecionada para adicionar itens.`
        )
    }

    function selecionarItemParaRecebimento(item: CompraItemDetalhado) {
        const quantidadePendente = item.quantidade - item.quantidade_recebida

        if (quantidadePendente <= 0 || item.status === 'cancelado') {
            setStatus('erro')
            setMensagem('Este item não possui quantidade pendente para receber.')
            return
        }

        setItemSelecionadoParaReceber(item)
        setStatus('sucesso')
        setMensagem(
            `Item ${item.produtos?.nome ?? item.produto_id} selecionado para conferência antes do recebimento.`
        )
    }

    async function enviarFormularioCompra(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarFormularioCompra(formularioCompra)

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const novaCompra: NovaCompra = {
            fornecedor_id: formularioCompra.fornecedor_id,
            local_destino_id: formularioCompra.local_destino_id,
            numero_pedido: transformarTextoEmNull(formularioCompra.numero_pedido),
            numero_nota_fiscal: transformarTextoEmNull(
                formularioCompra.numero_nota_fiscal
            ),
            data_compra: formularioCompra.data_compra,
            data_prevista_entrega: transformarDataEmNull(
                formularioCompra.data_prevista_entrega
            ),
            data_recebimento: transformarDataEmNull(
                formularioCompra.data_recebimento
            ),
            status: formularioCompra.status,
            valor_frete: converterNumero(formularioCompra.valor_frete),
            valor_desconto: converterNumero(formularioCompra.valor_desconto),
            outros_custos: converterNumero(formularioCompra.outros_custos),
            observacoes: transformarTextoEmNull(formularioCompra.observacoes),
        }

        try {
            setSalvandoCompra(true)
            setMensagem('Cadastrando compra...')

            const compraCadastrada = await cadastrarCompra(novaCompra)

            limparFormularioCompra()
            await recarregarComprasEItens()

            setFormularioItem((formularioAtual) => ({
                ...formularioAtual,
                compra_id: compraCadastrada.id,
            }))

            setStatus('sucesso')
            setMensagem(
                'Compra cadastrada com sucesso. Ela já foi selecionada para receber itens.'
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao cadastrar compra.')
            }
        } finally {
            setSalvandoCompra(false)
        }
    }

    async function enviarFormularioItem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarFormularioItem(formularioItem)

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const compraSelecionadaParaManter = formularioItem.compra_id

        const novoItem: NovoCompraItem = {
            compra_id: formularioItem.compra_id,
            produto_id: formularioItem.produto_id,
            quantidade: converterNumero(formularioItem.quantidade),
            quantidade_recebida: converterNumero(formularioItem.quantidade_recebida),
            custo_unitario: converterNumero(formularioItem.custo_unitario),
            valor_desconto_item: converterNumero(
                formularioItem.valor_desconto_item
            ),
            valor_impostos_item: converterNumero(
                formularioItem.valor_impostos_item
            ),
            outros_custos_item: converterNumero(formularioItem.outros_custos_item),
            codigo_produto_fornecedor: transformarTextoEmNull(
                formularioItem.codigo_produto_fornecedor
            ),
            lote: transformarTextoEmNull(formularioItem.lote),
            validade: transformarDataEmNull(formularioItem.validade),
            status: formularioItem.status,
            observacoes: transformarTextoEmNull(formularioItem.observacoes),
        }

        try {
            setSalvandoItem(true)
            setMensagem('Adicionando item à compra...')

            await cadastrarItemCompra(novoItem)

            limparFormularioItem(compraSelecionadaParaManter)
            await recarregarComprasEItens()

            setStatus('sucesso')
            setMensagem(
                'Item adicionado à compra com sucesso. A compra continua selecionada para adicionar novos itens.'
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao adicionar item da compra.')
            }
        } finally {
            setSalvandoItem(false)
        }
    }

    async function receberItemPendente(item: CompraItemDetalhado) {
        const quantidadePendente = item.quantidade - item.quantidade_recebida

        if (quantidadePendente <= 0) {
            setStatus('erro')
            setMensagem('Este item não possui quantidade pendente para receber.')
            return
        }

        try {
            setRecebendoItemId(item.id)
            setMensagem('Recebendo item da compra...')

            await receberItemCompra(item.id, quantidadePendente)

            await recarregarComprasEItens()
            setItemSelecionadoParaReceber(null)

            setStatus('sucesso')
            setMensagem('Item recebido com sucesso. Estoque e lote atualizados pelo Supabase.')
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao receber item da compra.')
            }
        } finally {
            setRecebendoItemId(null)
        }
    }

    const quantidadeTotalUnidades = compras.reduce((total, compra) => {
        return total + Number(compra.quantidade_total_unidades ?? 0)
    }, 0)

    const valorTotalEstimado = compras.reduce((total, compra) => {
        return total + Number(compra.valor_total_estimado ?? 0)
    }, 0)

    const comprasRecebidas = compras.filter(
        (compra) => compra.status === 'recebido'
    ).length

    const resumoStatusItensCompra = itensCompras.reduce(
        (resumo, item) => {
            const statusRecebimento = obterStatusRecebimentoItem(item)
            const pendente = Math.max(
                0,
                Number(item.quantidade ?? 0) - Number(item.quantidade_recebida ?? 0)
            )

            resumo.total += 1
            resumo.quantidadeComprada += Number(item.quantidade ?? 0)
            resumo.quantidadeRecebida += Number(item.quantidade_recebida ?? 0)
            resumo.quantidadePendente += pendente

            if (statusRecebimento === 'pendente') {
                resumo.pendentes += 1
            }

            if (statusRecebimento === 'parcialmente_recebido') {
                resumo.parciais += 1
            }

            if (statusRecebimento === 'recebido') {
                resumo.recebidos += 1
            }

            if (statusRecebimento === 'cancelado') {
                resumo.cancelados += 1
            }

            return resumo
        },
        {
            total: 0,
            pendentes: 0,
            parciais: 0,
            recebidos: 0,
            cancelados: 0,
            quantidadeComprada: 0,
            quantidadeRecebida: 0,
            quantidadePendente: 0,
        }
    )

    const valorFreteFormulario = converterNumeroSeguro(formularioCompra.valor_frete)
    const valorDescontoFormulario = converterNumeroSeguro(formularioCompra.valor_desconto)
    const outrosCustosFormulario = converterNumeroSeguro(formularioCompra.outros_custos)
    const valorAjustesCabecalho =
        valorFreteFormulario + outrosCustosFormulario - valorDescontoFormulario

    const compraSelecionada =
        compras.find((compra) => compra.compra_id === formularioItem.compra_id) ?? null

    const produtoSelecionado =
        produtos.find((produto) => produto.id === formularioItem.produto_id) ?? null

    const compraDoItemSelecionadoParaReceber = itemSelecionadoParaReceber
        ? compras.find(
            (compra) => compra.compra_id === itemSelecionadoParaReceber.compra_id
        ) ?? null
        : null

    const quantidadePendenteItemSelecionado = itemSelecionadoParaReceber
        ? itemSelecionadoParaReceber.quantidade - itemSelecionadoParaReceber.quantidade_recebida
        : 0

    const valorEstoqueAReceber = itemSelecionadoParaReceber
        ? quantidadePendenteItemSelecionado * itemSelecionadoParaReceber.custo_unitario
        : 0

    const quantidadeItemFormulario = converterNumeroSeguro(formularioItem.quantidade)
    const custoUnitarioFormulario = converterNumeroSeguro(formularioItem.custo_unitario)
    const descontoItemFormulario = converterNumeroSeguro(
        formularioItem.valor_desconto_item
    )
    const impostosItemFormulario = converterNumeroSeguro(
        formularioItem.valor_impostos_item
    )
    const outrosCustosItemFormulario = converterNumeroSeguro(
        formularioItem.outros_custos_item
    )

    const valorBrutoItemFormulario = quantidadeItemFormulario * custoUnitarioFormulario
    const valorTotalItemFormulario =
        valorBrutoItemFormulario -
        descontoItemFormulario +
        impostosItemFormulario +
        outrosCustosItemFormulario

    const valorTotalAtualCompraSelecionada = Number(
        compraSelecionada?.valor_total_estimado ?? 0
    )
    const valorTotalSimuladoCompraSelecionada =
        valorTotalAtualCompraSelecionada + valorTotalItemFormulario

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Compras
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Cadastro do cabeçalho da compra, inclusão de itens, recebimento e listagem consolidada.
                </p>
            </div>

            <form
                onSubmit={enviarFormularioCompra}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Cadastrar cabeçalho da compra
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Primeiro cadastre os dados principais da compra. Depois adicione os produtos no formulário abaixo.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Fornecedor *
                        </label>

                        <select
                            value={formularioCompra.fornecedor_id}
                            onChange={(event) =>
                                atualizarCampoCompra('fornecedor_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione um fornecedor</option>

                            {fornecedores.map((fornecedor) => (
                                <option key={fornecedor.id} value={fornecedor.id}>
                                    {fornecedor.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Local de destino *
                        </label>

                        <select
                            value={formularioCompra.local_destino_id}
                            onChange={(event) =>
                                atualizarCampoCompra('local_destino_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione o local de destino</option>

                            {locaisEstoque.map((local) => (
                                <option key={local.id} value={local.id}>
                                    {local.nome} — {local.tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Número do pedido
                        </label>

                        <input
                            value={formularioCompra.numero_pedido}
                            onChange={(event) =>
                                atualizarCampoCompra('numero_pedido', event.target.value)
                            }
                            placeholder="Ex: COMPRA-001"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Número da nota fiscal
                        </label>

                        <input
                            value={formularioCompra.numero_nota_fiscal}
                            onChange={(event) =>
                                atualizarCampoCompra('numero_nota_fiscal', event.target.value)
                            }
                            placeholder="Ex: NF-12345"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Data da compra *
                        </label>

                        <input
                            type="date"
                            value={formularioCompra.data_compra}
                            onChange={(event) =>
                                atualizarCampoCompra('data_compra', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Data prevista de entrega
                        </label>

                        <input
                            type="date"
                            value={formularioCompra.data_prevista_entrega}
                            onChange={(event) =>
                                atualizarCampoCompra(
                                    'data_prevista_entrega',
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Data de recebimento
                        </label>

                        <input
                            type="date"
                            value={formularioCompra.data_recebimento}
                            onChange={(event) =>
                                atualizarCampoCompra('data_recebimento', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Status *
                        </label>

                        <select
                            value={formularioCompra.status}
                            onChange={(event) =>
                                atualizarCampoCompra('status', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="rascunho">rascunho</option>
                            <option value="pedido_realizado">pedido realizado</option>
                            <option value="recebido">recebido</option>
                            <option value="cancelado">cancelado</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Valor do frete
                        </label>

                        <input
                            value={formularioCompra.valor_frete}
                            onChange={(event) =>
                                atualizarCampoCompra('valor_frete', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Valor de desconto
                        </label>

                        <input
                            value={formularioCompra.valor_desconto}
                            onChange={(event) =>
                                atualizarCampoCompra('valor_desconto', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Outros custos
                        </label>

                        <input
                            value={formularioCompra.outros_custos}
                            onChange={(event) =>
                                atualizarCampoCompra('outros_custos', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div className="md:col-span-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-cyan-200">
                                    Resumo financeiro do cabeçalho
                                </p>

                                <p className="mt-2 text-sm text-cyan-100/80">
                                    Estes valores serão somados ao total dos itens da compra pela view de resumo do Supabase.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-right">
                                <p className="text-xs text-slate-400">
                                    Ajuste do cabeçalho
                                </p>

                                <p className="mt-1 text-2xl font-bold text-cyan-300">
                                    {formatarMoeda(valorAjustesCabecalho)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Frete</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(valorFreteFormulario)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Desconto da compra</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    - {formatarMoeda(valorDescontoFormulario)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Outros custos</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(outrosCustosFormulario)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Observações
                        </label>

                        <textarea
                            value={formularioCompra.observacoes}
                            onChange={(event) =>
                                atualizarCampoCompra('observacoes', event.target.value)
                            }
                            rows={4}
                            placeholder="Observações sobre a compra"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={salvandoCompra}
                        className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {salvandoCompra ? 'Cadastrando...' : 'Cadastrar compra'}
                    </button>
                </div>
            </form>

            <form
                onSubmit={enviarFormularioItem}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Adicionar item à compra
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Adicione produtos a uma compra já cadastrada. Para entrada no estoque, use o botão Receber pendente na lista de itens.
                    </p>
                </div>

                {compraSelecionada ? (
                    <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-cyan-200">
                                    Compra selecionada para adicionar itens
                                </p>

                                <p className="mt-2 text-lg font-bold text-slate-100">
                                    {compraSelecionada.numero_pedido ?? 'Compra sem número'}
                                </p>

                                <p className="mt-1 text-sm text-cyan-100/80">
                                    Fornecedor: {compraSelecionada.fornecedor_nome ?? 'não informado'} · Local: {compraSelecionada.local_destino_nome ?? 'não informado'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-right">
                                    <p className="text-xs text-slate-400">Total atual</p>
                                    <p className="mt-1 text-xl font-bold text-cyan-300">
                                        {formatarMoeda(valorTotalAtualCompraSelecionada)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => limparFormularioItem()}
                                    className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                                >
                                    Limpar seleção
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-sm font-semibold text-slate-200">
                            Nenhuma compra selecionada
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                            Selecione uma compra no campo abaixo ou clique em Usar compra na tabela de compras encontradas.
                        </p>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Compra *
                        </label>

                        <select
                            value={formularioItem.compra_id}
                            onChange={(event) =>
                                atualizarCampoItem('compra_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione a compra</option>

                            {compras.map((compra) => (
                                <option key={compra.compra_id} value={compra.compra_id}>
                                    {compra.numero_pedido ?? 'Compra sem número'} —{' '}
                                    {compra.fornecedor_nome ?? 'Fornecedor não informado'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Produto *
                        </label>

                        <select
                            value={formularioItem.produto_id}
                            onChange={(event) =>
                                atualizarCampoItem('produto_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione o produto</option>

                            {produtos.map((produto) => (
                                <option key={produto.id} value={produto.id}>
                                    {produto.nome} — SKU: {produto.sku}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Quantidade *
                        </label>

                        <input
                            value={formularioItem.quantidade}
                            onChange={(event) =>
                                atualizarCampoItem('quantidade', event.target.value)
                            }
                            placeholder="Ex: 10"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Quantidade recebida *
                        </label>

                        <input
                            value={formularioItem.quantidade_recebida}
                            onChange={(event) =>
                                atualizarCampoItem('quantidade_recebida', event.target.value)
                            }
                            placeholder="Ex: 0"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Custo unitário *
                        </label>

                        <input
                            value={formularioItem.custo_unitario}
                            onChange={(event) =>
                                atualizarCampoItem('custo_unitario', event.target.value)
                            }
                            placeholder="Ex: 13,18"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Código do produto no fornecedor
                        </label>

                        <input
                            value={formularioItem.codigo_produto_fornecedor}
                            onChange={(event) =>
                                atualizarCampoItem(
                                    'codigo_produto_fornecedor',
                                    event.target.value
                                )
                            }
                            placeholder="Código usado pelo fornecedor"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Desconto do item
                        </label>

                        <input
                            value={formularioItem.valor_desconto_item}
                            onChange={(event) =>
                                atualizarCampoItem('valor_desconto_item', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Impostos do item
                        </label>

                        <input
                            value={formularioItem.valor_impostos_item}
                            onChange={(event) =>
                                atualizarCampoItem('valor_impostos_item', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Outros custos do item
                        </label>

                        <input
                            value={formularioItem.outros_custos_item}
                            onChange={(event) =>
                                atualizarCampoItem('outros_custos_item', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Lote
                        </label>

                        <input
                            value={formularioItem.lote}
                            onChange={(event) =>
                                atualizarCampoItem('lote', event.target.value)
                            }
                            placeholder="Ex: LOTE-001"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Validade
                        </label>

                        <input
                            type="date"
                            value={formularioItem.validade}
                            onChange={(event) =>
                                atualizarCampoItem('validade', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Status do item *
                        </label>

                        <select
                            value={formularioItem.status}
                            onChange={(event) =>
                                atualizarCampoItem('status', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="pendente">pendente</option>
                            <option value="parcialmente_recebido">
                                parcialmente recebido
                            </option>
                            <option value="recebido">recebido</option>
                            <option value="cancelado">cancelado</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-emerald-200">
                                    Cálculo automático do item
                                </p>

                                <p className="mt-2 text-sm text-emerald-100/80">
                                    O sistema calcula o valor do item usando quantidade, custo unitário, desconto, impostos e outros custos.
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-right">
                                <p className="text-xs text-slate-400">
                                    Total estimado do item
                                </p>

                                <p className="mt-1 text-2xl font-bold text-emerald-300">
                                    {formatarMoeda(valorTotalItemFormulario)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-5">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Produto</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {produtoSelecionado?.nome ?? 'Selecione um produto'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Valor bruto</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(valorBrutoItemFormulario)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Desconto</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    - {formatarMoeda(descontoItemFormulario)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Impostos</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(impostosItemFormulario)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Outros custos</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(outrosCustosItemFormulario)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {compraSelecionada && (
                        <div className="md:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-100">
                                        Simulação da compra selecionada
                                    </p>

                                    <p className="mt-2 text-sm text-slate-400">
                                        Este resumo mostra o total atual da compra e como ficaria depois de adicionar o item preenchido acima.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-right">
                                        <p className="text-xs text-slate-400">Total atual</p>
                                        <p className="mt-1 text-xl font-bold text-slate-100">
                                            {formatarMoeda(valorTotalAtualCompraSelecionada)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-right">
                                        <p className="text-xs text-emerald-100/80">Com este item</p>
                                        <p className="mt-1 text-xl font-bold text-emerald-300">
                                            {formatarMoeda(valorTotalSimuladoCompraSelecionada)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Observações do item
                        </label>

                        <textarea
                            value={formularioItem.observacoes}
                            onChange={(event) =>
                                atualizarCampoItem('observacoes', event.target.value)
                            }
                            rows={3}
                            placeholder="Observações sobre este item da compra"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={salvandoItem}
                        className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {salvandoItem ? 'Adicionando...' : 'Adicionar item à compra'}
                    </button>
                </div>
            </form>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Compras encontradas</p>
                    <p className="mt-3 text-3xl font-bold">{compras.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Compras recebidas</p>
                    <p className="mt-3 text-3xl font-bold">{comprasRecebidas}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Unidades compradas</p>
                    <p className="mt-3 text-3xl font-bold">{quantidadeTotalUnidades}</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                    <p className="text-sm text-slate-400">Valor total estimado</p>
                    <p className="mt-3 text-3xl font-bold">
                        {formatarMoeda(valorTotalEstimado)}
                    </p>
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
                    <h2 className="text-xl font-semibold">Itens das compras</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {itensCompras.length}
                    </span>
                </div>

                <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Itens pendentes</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-300">
                            {resumoStatusItensCompra.pendentes}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Parciais</p>
                        <p className="mt-2 text-2xl font-bold text-cyan-300">
                            {resumoStatusItensCompra.parciais}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Recebidos</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-300">
                            {resumoStatusItensCompra.recebidos}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Cancelados</p>
                        <p className="mt-2 text-2xl font-bold text-red-300">
                            {resumoStatusItensCompra.cancelados}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Unidades recebidas</p>
                        <p className="mt-2 text-2xl font-bold text-slate-100">
                            {resumoStatusItensCompra.quantidadeRecebida}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs text-slate-400">Unidades pendentes</p>
                        <p className="mt-2 text-2xl font-bold text-yellow-300">
                            {resumoStatusItensCompra.quantidadePendente}
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm font-semibold text-slate-200">
                        Legenda dos itens de compra
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-yellow-300">
                            Pendente: nada recebido
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-300">
                            Parcial: parte recebida
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                            Recebido: pendência zerada
                        </span>
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-300">
                            Cancelado: item não deve ser recebido
                        </span>
                    </div>
                </div>

                {itemSelecionadoParaReceber && (
                    <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-emerald-200">
                                    Conferência antes de receber o item
                                </p>

                                <p className="mt-2 text-sm text-emerald-100/80">
                                    Confira produto, compra, local de destino, quantidade pendente e lote antes de lançar a entrada no estoque.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setItemSelecionadoParaReceber(null)}
                                    className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    disabled={recebendoItemId === itemSelecionadoParaReceber.id}
                                    onClick={() => receberItemPendente(itemSelecionadoParaReceber)}
                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {recebendoItemId === itemSelecionadoParaReceber.id
                                        ? 'Recebendo...'
                                        : 'Confirmar recebimento'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Compra</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.compras?.numero_pedido ?? '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4 lg:col-span-2">
                                <p className="text-xs text-slate-400">Produto</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.produtos?.nome ?? itemSelecionadoParaReceber.produto_id}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Local de destino</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {compraDoItemSelecionadoParaReceber?.local_destino_nome ?? '-'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Pendente</p>
                                <p className="mt-1 font-semibold text-emerald-300">
                                    {quantidadePendenteItemSelecionado}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Valor a receber</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {formatarMoeda(valorEstoqueAReceber)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Quantidade comprada</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.quantidade}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Já recebida</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.quantidade_recebida}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-950 p-4">
                                <p className="text-xs text-slate-400">Lote</p>
                                <p className="mt-1 font-semibold text-slate-100">
                                    {itemSelecionadoParaReceber.lote ?? 'Sem lote informado'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {itensCompras.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum item de compra para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1350px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Compra</th>
                                    <th className="px-4 py-3 font-medium">Produto</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">Qtd.</th>
                                    <th className="px-4 py-3 font-medium">Recebida</th>
                                    <th className="px-4 py-3 font-medium">Pendente</th>
                                    <th className="px-4 py-3 font-medium">Progresso</th>
                                    <th className="px-4 py-3 font-medium">Custo unit.</th>
                                    <th className="px-4 py-3 font-medium">Lote</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {itensCompras.map((item) => {
                                    const pendente = Math.max(
                                        0,
                                        Number(item.quantidade ?? 0) - Number(item.quantidade_recebida ?? 0)
                                    )
                                    const statusRecebimento = obterStatusRecebimentoItem(item)
                                    const percentualRecebido = calcularPercentualRecebido(item)
                                    const podeReceber =
                                        pendente > 0 && statusRecebimento !== 'cancelado'

                                    return (
                                        <tr
                                            key={item.id}
                                            className={obterClasseLinhaItemCompra(
                                                statusRecebimento,
                                                itemSelecionadoParaReceber?.id === item.id
                                            )}
                                        >
                                            <td className="px-4 py-3 text-slate-100">
                                                {item.compras?.numero_pedido ?? '-'}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.produtos?.nome ?? item.produto_id}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.produtos?.sku ?? '-'}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-slate-100">
                                                {item.quantidade}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-emerald-300">
                                                {item.quantidade_recebida}
                                            </td>

                                            <td
                                                className={
                                                    pendente > 0
                                                        ? 'px-4 py-3 font-semibold text-yellow-300'
                                                        : 'px-4 py-3 font-semibold text-emerald-300'
                                                }
                                            >
                                                {pendente}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="w-28">
                                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                                        <span>{Math.round(percentualRecebido)}%</span>
                                                        <span>
                                                            {item.quantidade_recebida}/{item.quantidade}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-400"
                                                            style={{ width: `${percentualRecebido}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {formatarMoeda(item.custo_unitario)}
                                            </td>

                                            <td className="px-4 py-3 text-slate-300">
                                                {item.lote ?? '-'}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-2">
                                                    <span
                                                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${obterClasseStatusRecebimento(
                                                            statusRecebimento
                                                        )}`}
                                                    >
                                                        {obterRotuloStatusRecebimento(statusRecebimento)}
                                                    </span>

                                                    {item.status !== statusRecebimento && (
                                                        <span className="text-xs text-slate-500">
                                                            Status original: {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    disabled={!podeReceber || recebendoItemId === item.id}
                                                    onClick={() => selecionarItemParaRecebimento(item)}
                                                    className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                                                >
                                                    {recebendoItemId === item.id
                                                        ? 'Recebendo...'
                                                        : podeReceber
                                                            ? 'Conferir recebimento'
                                                            : statusRecebimento === 'cancelado'
                                                                ? 'Cancelado'
                                                                : 'Recebido'}
                                                </button>
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
                    <h2 className="text-xl font-semibold">Compras encontradas</h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {compras.length}
                    </span>
                </div>

                {compras.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhuma compra para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1400px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Pedido</th>
                                    <th className="px-4 py-3 font-medium">Nota fiscal</th>
                                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                                    <th className="px-4 py-3 font-medium">Local destino</th>
                                    <th className="px-4 py-3 font-medium">Data compra</th>
                                    <th className="px-4 py-3 font-medium">Prev. entrega</th>
                                    <th className="px-4 py-3 font-medium">Recebimento</th>
                                    <th className="px-4 py-3 font-medium">Itens</th>
                                    <th className="px-4 py-3 font-medium">Unidades</th>
                                    <th className="px-4 py-3 font-medium">Valor produtos</th>
                                    <th className="px-4 py-3 font-medium">Frete</th>
                                    <th className="px-4 py-3 font-medium">Total estimado</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {compras.map((compra) => (
                                    <tr
                                        key={compra.compra_id}
                                        className={
                                            compraSelecionada?.compra_id === compra.compra_id
                                                ? 'bg-cyan-500/10 hover:bg-cyan-500/20'
                                                : 'hover:bg-slate-800/60'
                                        }
                                    >
                                        <td className="px-4 py-3 text-slate-100">
                                            {compra.numero_pedido ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.numero_nota_fiscal ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.fornecedor_nome ?? compra.fornecedor_id ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.local_destino_nome ??
                                                compra.local_destino_id ??
                                                '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(compra.data_compra)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(compra.data_prevista_entrega)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarData(compra.data_recebimento)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.quantidade_itens_distintos ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {compra.quantidade_total_unidades ?? 0}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(compra.valor_bruto_produtos)}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {formatarMoeda(compra.valor_frete)}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-100">
                                            {formatarMoeda(compra.valor_total_estimado)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${obterClasseStatus(
                                                    compra.status
                                                )}`}
                                            >
                                                {compra.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => selecionarCompraParaItem(compra)}
                                                className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10"
                                            >
                                                Usar compra
                                            </button>
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
                        {JSON.stringify({ compras, itensCompras }, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}