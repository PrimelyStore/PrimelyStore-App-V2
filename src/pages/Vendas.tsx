import { useEffect, useState, type FormEvent } from 'react'
import {
    baixarEstoqueVendaFIFO,
    buscarCanaisVendaAtivos,
    buscarItensVendas,
    buscarVendasResumo,
    cadastrarItemVenda,
    cadastrarVenda,
    type CanalVenda,
    type NovaVenda,
    type NovoVendaItem,
    type VendaItemDetalhado,
    type VendaResumo,
} from '../services/vendasService'
import {
    buscarLocaisEstoqueAtivos,
    type LocalEstoque,
} from '../services/locaisEstoqueService'
import { buscarProdutos, type Produto } from '../services/produtosService'
import { buscarEstoque, type EstoqueSaldo } from '../services/estoqueService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FormularioVenda = {
    canal_venda_id: string
    local_saida_id: string
    numero_pedido: string
    numero_pedido_marketplace: string
    data_venda: string
    data_pagamento: string
    data_envio: string
    data_entrega: string
    status: string
    valor_produtos: string
    valor_frete_cobrado: string
    valor_desconto: string
    valor_taxas_marketplace: string
    valor_taxas_logistica: string
    valor_impostos: string
    outros_custos: string
    valor_total: string
    observacoes: string
}

type FormularioItemVenda = {
    venda_id: string
    produto_id: string
    sku_vendido: string
    asin_vendido: string
    quantidade: string
    valor_unitario: string
    valor_desconto_item: string
    valor_taxa_marketplace_item: string
    valor_taxa_logistica_item: string
    valor_imposto_item: string
    outros_custos_item: string
    custo_unitario_estimado: string
    status: string
    observacoes: string
}

function obterDataHoje() {
    return new Date().toISOString().slice(0, 10)
}

const formularioVendaInicial: FormularioVenda = {
    canal_venda_id: '',
    local_saida_id: '',
    numero_pedido: '',
    numero_pedido_marketplace: '',
    data_venda: obterDataHoje(),
    data_pagamento: '',
    data_envio: '',
    data_entrega: '',
    status: 'aprovado',
    valor_produtos: '0',
    valor_frete_cobrado: '0',
    valor_desconto: '0',
    valor_taxas_marketplace: '0',
    valor_taxas_logistica: '0',
    valor_impostos: '0',
    outros_custos: '0',
    valor_total: '0',
    observacoes: '',
}

const formularioItemInicial: FormularioItemVenda = {
    venda_id: '',
    produto_id: '',
    sku_vendido: '',
    asin_vendido: '',
    quantidade: '1',
    valor_unitario: '0',
    valor_desconto_item: '0',
    valor_taxa_marketplace_item: '0',
    valor_taxa_logistica_item: '0',
    valor_imposto_item: '0',
    outros_custos_item: '0',
    custo_unitario_estimado: '0',
    status: 'ativo',
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

    const dataConvertida = new Date(data)

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

function formatarNumeroParaFormulario(valor: number) {
    if (!Number.isFinite(valor)) {
        return '0'
    }

    return valor.toFixed(2).replace('.', ',')
}

function calcularValorTotalVenda(formulario: FormularioVenda) {
    const valorProdutos = converterNumero(formulario.valor_produtos)
    const valorFreteCobrado = converterNumero(formulario.valor_frete_cobrado)
    const valorDesconto = converterNumero(formulario.valor_desconto)

    if (
        Number.isNaN(valorProdutos) ||
        Number.isNaN(valorFreteCobrado) ||
        Number.isNaN(valorDesconto)
    ) {
        return formulario.valor_total
    }

    const total = Math.max(valorProdutos + valorFreteCobrado - valorDesconto, 0)

    return formatarNumeroParaFormulario(total)
}

function calcularValorBrutoItem(formulario: FormularioItemVenda) {
    const quantidade = converterNumero(formulario.quantidade)
    const valorUnitario = converterNumero(formulario.valor_unitario)

    if (Number.isNaN(quantidade) || Number.isNaN(valorUnitario)) {
        return 0
    }

    return quantidade * valorUnitario
}

function obterSaldoDisponivel(
    saldosEstoque: EstoqueSaldo[],
    produtoId: string,
    localEstoqueId?: string | null
) {
    if (!produtoId || !localEstoqueId) {
        return null
    }

    const saldoEncontrado = saldosEstoque.find((saldo) => {
        return (
            saldo.produto_id === produtoId &&
            saldo.local_estoque_id === localEstoqueId
        )
    })

    return Number(saldoEncontrado?.saldo_atual ?? 0)
}

function calcularQuantidadePendenteReservada(
    itensVendas: VendaItemDetalhado[],
    vendas: VendaResumo[],
    produtoId: string,
    localEstoqueId?: string | null
) {
    if (!produtoId || !localEstoqueId) {
        return 0
    }

    return itensVendas.reduce((total, item) => {
        if (item.produto_id !== produtoId || item.status !== 'ativo') {
            return total
        }

        const vendaDoItem = vendas.find((venda) => venda.venda_id === item.venda_id)

        if (vendaDoItem?.local_saida_id !== localEstoqueId) {
            return total
        }

        const quantidadeConsumida = calcularQuantidadeConsumida(item)
        const quantidadePendente = Math.max(
            Number(item.quantidade ?? 0) - quantidadeConsumida,
            0
        )

        return total + quantidadePendente
    }, 0)
}

const camposVendaQueRecalculamTotal: Array<keyof FormularioVenda> = [
    'valor_produtos',
    'valor_frete_cobrado',
    'valor_desconto',
]

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

function validarVenda(formulario: FormularioVenda) {
    if (!formulario.canal_venda_id) {
        return 'Selecione o canal de venda.'
    }

    if (!formulario.local_saida_id) {
        return 'Selecione o local de saída.'
    }

    if (!formulario.data_venda) {
        return 'Informe a data da venda.'
    }

    const camposNumericos = [
        formulario.valor_produtos,
        formulario.valor_frete_cobrado,
        formulario.valor_desconto,
        formulario.valor_taxas_marketplace,
        formulario.valor_taxas_logistica,
        formulario.valor_impostos,
        formulario.outros_custos,
        formulario.valor_total,
    ]

    for (const campo of camposNumericos) {
        const numero = converterNumero(campo)

        if (Number.isNaN(numero) || numero < 0) {
            return 'Todos os valores da venda precisam ser números maiores ou iguais a zero.'
        }
    }

    return null
}

function validarItemVenda(
    formulario: FormularioItemVenda,
    vendaSelecionada: VendaResumo | undefined,
    saldoDisponivelParaNovoItem: number | null
) {
    if (!formulario.venda_id) {
        return 'Selecione a venda.'
    }

    if (!vendaSelecionada) {
        return 'A venda selecionada não foi encontrada na lista carregada.'
    }

    if (!vendaSelecionada.local_saida_id) {
        return 'A venda selecionada não possui local de saída informado.'
    }

    if (!formulario.produto_id) {
        return 'Selecione o produto vendido.'
    }

    const quantidade = converterNumero(formulario.quantidade)

    if (Number.isNaN(quantidade) || quantidade <= 0 || !Number.isInteger(quantidade)) {
        return 'A quantidade precisa ser um número inteiro maior que zero.'
    }

    if (saldoDisponivelParaNovoItem === null) {
        return 'Não foi possível consultar o saldo disponível para este produto e local de saída.'
    }

    if (quantidade > saldoDisponivelParaNovoItem) {
        return `Estoque insuficiente. Disponível para novo item: ${saldoDisponivelParaNovoItem} unidade(s).`
    }

    const camposNumericos = [
        formulario.valor_unitario,
        formulario.valor_desconto_item,
        formulario.valor_taxa_marketplace_item,
        formulario.valor_taxa_logistica_item,
        formulario.valor_imposto_item,
        formulario.outros_custos_item,
        formulario.custo_unitario_estimado,
    ]

    for (const campo of camposNumericos) {
        const numero = converterNumero(campo)

        if (Number.isNaN(numero) || numero < 0) {
            return 'Todos os valores do item precisam ser números maiores ou iguais a zero.'
        }
    }

    return null
}

export function Vendas() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando vendas...')
    const [vendas, setVendas] = useState<VendaResumo[]>([])
    const [itensVendas, setItensVendas] = useState<VendaItemDetalhado[]>([])
    const [canaisVenda, setCanaisVenda] = useState<CanalVenda[]>([])
    const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([])
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [saldosEstoque, setSaldosEstoque] = useState<EstoqueSaldo[]>([])
    const [salvandoVenda, setSalvandoVenda] = useState(false)
    const [salvandoItem, setSalvandoItem] = useState(false)
    const [baixandoVendaId, setBaixandoVendaId] = useState<string | null>(null)

    const [formularioVenda, setFormularioVenda] =
        useState<FormularioVenda>(formularioVendaInicial)

    const [formularioItem, setFormularioItem] =
        useState<FormularioItemVenda>(formularioItemInicial)

    async function recarregarVendasEItens() {
        const [vendasResumo, itensDados, saldosDados] = await Promise.all([
            buscarVendasResumo(),
            buscarItensVendas(),
            buscarEstoque(),
        ])

        setVendas(vendasResumo)
        setItensVendas(itensDados)
        setSaldosEstoque(saldosDados)

        if (vendasResumo.length === 0) {
            setMensagem('Consulta realizada com sucesso, mas nenhuma venda foi encontrada.')
        } else {
            setMensagem(`${vendasResumo.length} venda(s) encontrada(s).`)
        }
    }

    async function carregarDadosIniciais() {
        try {
            const [
                vendasResumo,
                itensDados,
                canaisDados,
                locaisDados,
                produtosDados,
                saldosDados,
            ] = await Promise.all([
                buscarVendasResumo(),
                buscarItensVendas(),
                buscarCanaisVendaAtivos(),
                buscarLocaisEstoqueAtivos(),
                buscarProdutos(),
                buscarEstoque(),
            ])

            setVendas(vendasResumo)
            setItensVendas(itensDados)
            setCanaisVenda(canaisDados)
            setLocaisEstoque(locaisDados)
            setProdutos(produtosDados)
            setSaldosEstoque(saldosDados)
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

    function atualizarCampoVenda(campo: keyof FormularioVenda, valor: string) {
        setFormularioVenda((formularioAtual) => {
            const novoFormulario = {
                ...formularioAtual,
                [campo]: valor,
            }

            if (camposVendaQueRecalculamTotal.includes(campo)) {
                novoFormulario.valor_total = calcularValorTotalVenda(novoFormulario)
            }

            return novoFormulario
        })
    }

    function atualizarCampoItem(campo: keyof FormularioItemVenda, valor: string) {
        setFormularioItem((formularioAtual) => {
            const novoFormulario = {
                ...formularioAtual,
                [campo]: valor,
            }

            if (campo === 'produto_id') {
                const produtoSelecionado = produtos.find((produto) => produto.id === valor)

                novoFormulario.sku_vendido = produtoSelecionado?.sku ?? ''
                novoFormulario.asin_vendido = produtoSelecionado?.asin ?? ''
            }

            return novoFormulario
        })
    }

    function limparFormularioVenda() {
        setFormularioVenda({
            ...formularioVendaInicial,
            data_venda: obterDataHoje(),
        })
    }

    function limparFormularioItem() {
        setFormularioItem(formularioItemInicial)
    }

    function limparFormularioItemMantendoVenda(vendaId: string) {
        setFormularioItem({
            ...formularioItemInicial,
            venda_id: vendaId,
        })
    }

    function selecionarVendaParaItem(vendaId: string) {
        const vendaSelecionada = vendas.find((venda) => venda.venda_id === vendaId)

        setFormularioItem({
            ...formularioItemInicial,
            venda_id: vendaId,
        })

        setStatus('sucesso')
        setMensagem(
            `Venda ${vendaSelecionada?.numero_pedido ?? 'selecionada'} pronta para receber itens.`
        )
    }

    async function enviarVenda(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarVenda(formularioVenda)

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const valorTotalCalculado = calcularValorTotalVenda(formularioVenda)

        const novaVenda: NovaVenda = {
            canal_venda_id: formularioVenda.canal_venda_id,
            local_saida_id: formularioVenda.local_saida_id,
            numero_pedido: transformarTextoEmNull(formularioVenda.numero_pedido),
            numero_pedido_marketplace: transformarTextoEmNull(
                formularioVenda.numero_pedido_marketplace
            ),
            data_venda: `${formularioVenda.data_venda}T00:00:00`,
            data_pagamento: transformarDataEmNull(formularioVenda.data_pagamento),
            data_envio: transformarDataEmNull(formularioVenda.data_envio),
            data_entrega: transformarDataEmNull(formularioVenda.data_entrega),
            status: formularioVenda.status,
            valor_produtos: converterNumero(formularioVenda.valor_produtos),
            valor_frete_cobrado: converterNumero(formularioVenda.valor_frete_cobrado),
            valor_desconto: converterNumero(formularioVenda.valor_desconto),
            valor_taxas_marketplace: converterNumero(
                formularioVenda.valor_taxas_marketplace
            ),
            valor_taxas_logistica: converterNumero(
                formularioVenda.valor_taxas_logistica
            ),
            valor_impostos: converterNumero(formularioVenda.valor_impostos),
            outros_custos: converterNumero(formularioVenda.outros_custos),
            valor_total: converterNumero(valorTotalCalculado),
            observacoes: transformarTextoEmNull(formularioVenda.observacoes),
        }

        try {
            setSalvandoVenda(true)
            setMensagem('Cadastrando venda...')

            const vendaCadastrada = await cadastrarVenda(novaVenda)

            limparFormularioVenda()
            limparFormularioItemMantendoVenda(vendaCadastrada.id)
            await recarregarVendasEItens()

            setStatus('sucesso')
            setMensagem(
                'Venda cadastrada com sucesso. Agora selecione o produto vendido no formulário de item.'
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao cadastrar venda.')
            }
        } finally {
            setSalvandoVenda(false)
        }
    }

    async function enviarItemVenda(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const vendaSelecionada = vendas.find((venda) => {
            return venda.venda_id === formularioItem.venda_id
        })

        const saldoBrutoNoLocal = obterSaldoDisponivel(
            saldosEstoque,
            formularioItem.produto_id,
            vendaSelecionada?.local_saida_id
        )
        const quantidadePendenteReservada = calcularQuantidadePendenteReservada(
            itensVendas,
            vendas,
            formularioItem.produto_id,
            vendaSelecionada?.local_saida_id
        )
        const saldoDisponivelParaNovoItem =
            saldoBrutoNoLocal === null
                ? null
                : Math.max(saldoBrutoNoLocal - quantidadePendenteReservada, 0)

        const erroValidacao = validarItemVenda(
            formularioItem,
            vendaSelecionada,
            saldoDisponivelParaNovoItem
        )

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const vendaIdSelecionada = formularioItem.venda_id

        const novoItem: NovoVendaItem = {
            venda_id: formularioItem.venda_id,
            produto_id: formularioItem.produto_id,
            sku_vendido: transformarTextoEmNull(formularioItem.sku_vendido),
            asin_vendido: transformarTextoEmNull(formularioItem.asin_vendido),
            quantidade: converterNumero(formularioItem.quantidade),
            valor_unitario: converterNumero(formularioItem.valor_unitario),
            valor_desconto_item: converterNumero(formularioItem.valor_desconto_item),
            valor_taxa_marketplace_item: converterNumero(
                formularioItem.valor_taxa_marketplace_item
            ),
            valor_taxa_logistica_item: converterNumero(
                formularioItem.valor_taxa_logistica_item
            ),
            valor_imposto_item: converterNumero(formularioItem.valor_imposto_item),
            outros_custos_item: converterNumero(formularioItem.outros_custos_item),
            custo_unitario_estimado: converterNumero(
                formularioItem.custo_unitario_estimado
            ),
            status: formularioItem.status,
            observacoes: transformarTextoEmNull(formularioItem.observacoes),
        }

        try {
            setSalvandoItem(true)
            setMensagem('Adicionando item à venda...')

            await cadastrarItemVenda(novoItem)

            limparFormularioItemMantendoVenda(vendaIdSelecionada)
            await recarregarVendasEItens()

            setStatus('sucesso')
            setMensagem(
                'Item de venda cadastrado com sucesso. A venda foi mantida selecionada para facilitar o próximo item.'
            )
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao cadastrar item da venda.')
            }
        } finally {
            setSalvandoItem(false)
        }
    }

    async function baixarVendaFIFO(vendaId: string) {
        try {
            setBaixandoVendaId(vendaId)
            setMensagem('Baixando estoque da venda via FIFO...')

            await baixarEstoqueVendaFIFO(vendaId)

            await recarregarVendasEItens()

            setStatus('sucesso')
            setMensagem('Baixa FIFO da venda realizada com sucesso. Estoque atualizado.')
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao baixar estoque da venda.')
            }
        } finally {
            setBaixandoVendaId(null)
        }
    }

    const quantidadeTotalVendida = vendas.reduce((total, venda) => {
        return total + Number(venda.quantidade_total_unidades ?? 0)
    }, 0)

    const receitaLiquida = vendas.reduce((total, venda) => {
        return total + Number(venda.receita_liquida_calculada ?? 0)
    }, 0)

    const lucroEstimado = vendas.reduce((total, venda) => {
        return total + Number(venda.lucro_estimado ?? 0)
    }, 0)

    const valorBrutoItemPreview = calcularValorBrutoItem(formularioItem)
    const vendaSelecionadaParaItem = vendas.find((venda) => {
        return venda.venda_id === formularioItem.venda_id
    })
    const produtoSelecionadoParaItem = produtos.find((produto) => {
        return produto.id === formularioItem.produto_id
    })
    const localSaidaSelecionadoParaItem = locaisEstoque.find((local) => {
        return local.id === vendaSelecionadaParaItem?.local_saida_id
    })
    const saldoBrutoNoLocalParaItem = obterSaldoDisponivel(
        saldosEstoque,
        formularioItem.produto_id,
        vendaSelecionadaParaItem?.local_saida_id
    )
    const quantidadePendenteReservadaParaItem = calcularQuantidadePendenteReservada(
        itensVendas,
        vendas,
        formularioItem.produto_id,
        vendaSelecionadaParaItem?.local_saida_id
    )
    const saldoDisponivelParaItem =
        saldoBrutoNoLocalParaItem === null
            ? null
            : Math.max(saldoBrutoNoLocalParaItem - quantidadePendenteReservadaParaItem, 0)
    const quantidadeItemPreview = converterNumero(formularioItem.quantidade)
    const quantidadeItemValida =
        !Number.isNaN(quantidadeItemPreview) &&
        Number.isInteger(quantidadeItemPreview) &&
        quantidadeItemPreview > 0
    const saldoInsuficiente =
        saldoDisponivelParaItem !== null &&
        quantidadeItemValida &&
        quantidadeItemPreview > saldoDisponivelParaItem
    const saldoPodeSerExibido =
        !!formularioItem.venda_id &&
        !!formularioItem.produto_id &&
        saldoDisponivelParaItem !== null
    const cadastroItemBloqueado =
        salvandoItem ||
        !formularioItem.venda_id ||
        !formularioItem.produto_id ||
        !quantidadeItemValida ||
        saldoDisponivelParaItem === null ||
        saldoInsuficiente

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
                    Cadastro de vendas, itens vendidos, baixa FIFO de estoque e listagem consolidada pela view vendas_resumo.
                </p>
            </div>

            <form
                onSubmit={enviarVenda}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Cadastrar cabeçalho da venda
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Primeiro cadastre a venda. Depois adicione os produtos vendidos no formulário abaixo.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Canal de venda *
                        </label>

                        <select
                            value={formularioVenda.canal_venda_id}
                            onChange={(event) =>
                                atualizarCampoVenda('canal_venda_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione o canal</option>

                            {canaisVenda.map((canal) => (
                                <option key={canal.id} value={canal.id}>
                                    {canal.nome} — {canal.modalidade_logistica}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Local de saída *
                        </label>

                        <select
                            value={formularioVenda.local_saida_id}
                            onChange={(event) =>
                                atualizarCampoVenda('local_saida_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione o local de saída</option>

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
                            value={formularioVenda.numero_pedido}
                            onChange={(event) =>
                                atualizarCampoVenda('numero_pedido', event.target.value)
                            }
                            placeholder="Ex: VENDA-APP-001"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Pedido marketplace
                        </label>

                        <input
                            value={formularioVenda.numero_pedido_marketplace}
                            onChange={(event) =>
                                atualizarCampoVenda(
                                    'numero_pedido_marketplace',
                                    event.target.value
                                )
                            }
                            placeholder="Ex: AMZ-123"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Data da venda *
                        </label>

                        <input
                            type="date"
                            value={formularioVenda.data_venda}
                            onChange={(event) =>
                                atualizarCampoVenda('data_venda', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Status *
                        </label>

                        <select
                            value={formularioVenda.status}
                            onChange={(event) =>
                                atualizarCampoVenda('status', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="rascunho">rascunho</option>
                            <option value="aprovado">aprovado</option>
                            <option value="enviado">enviado</option>
                            <option value="entregue">entregue</option>
                            <option value="cancelado">cancelado</option>
                            <option value="devolvido">devolvido</option>
                            <option value="reembolsado">reembolsado</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Valor produtos
                        </label>

                        <input
                            value={formularioVenda.valor_produtos}
                            onChange={(event) =>
                                atualizarCampoVenda('valor_produtos', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Frete cobrado
                        </label>

                        <input
                            value={formularioVenda.valor_frete_cobrado}
                            onChange={(event) =>
                                atualizarCampoVenda('valor_frete_cobrado', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Desconto da venda
                        </label>

                        <input
                            value={formularioVenda.valor_desconto}
                            onChange={(event) =>
                                atualizarCampoVenda('valor_desconto', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Taxa marketplace
                        </label>

                        <input
                            value={formularioVenda.valor_taxas_marketplace}
                            onChange={(event) =>
                                atualizarCampoVenda(
                                    'valor_taxas_marketplace',
                                    event.target.value
                                )
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Taxa logística
                        </label>

                        <input
                            value={formularioVenda.valor_taxas_logistica}
                            onChange={(event) =>
                                atualizarCampoVenda(
                                    'valor_taxas_logistica',
                                    event.target.value
                                )
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Impostos
                        </label>

                        <input
                            value={formularioVenda.valor_impostos}
                            onChange={(event) =>
                                atualizarCampoVenda('valor_impostos', event.target.value)
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
                            value={formularioVenda.outros_custos}
                            onChange={(event) =>
                                atualizarCampoVenda('outros_custos', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Valor total
                        </label>

                        <input
                            value={formularioVenda.valor_total}
                            readOnly
                            placeholder="0,00"
                            className="w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 outline-none"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Calculado automaticamente: valor dos produtos + frete cobrado - desconto.
                        </p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Observações
                        </label>

                        <textarea
                            value={formularioVenda.observacoes}
                            onChange={(event) =>
                                atualizarCampoVenda('observacoes', event.target.value)
                            }
                            rows={3}
                            placeholder="Observações sobre a venda"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={salvandoVenda}
                        className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {salvandoVenda ? 'Cadastrando...' : 'Cadastrar venda'}
                    </button>
                </div>
            </form>

            <form
                onSubmit={enviarItemVenda}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">
                        Adicionar item à venda
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Depois de cadastrar a venda, adicione o produto vendido. A baixa no estoque será feita pelo botão Baixar FIFO.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Venda *
                        </label>

                        <select
                            value={formularioItem.venda_id}
                            onChange={(event) =>
                                atualizarCampoItem('venda_id', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="">Selecione a venda</option>

                            {vendas.map((venda) => (
                                <option key={venda.venda_id} value={venda.venda_id}>
                                    {venda.numero_pedido ?? 'Venda sem número'} — {venda.canal_venda_nome ?? '-'}
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

                    {vendaSelecionadaParaItem && (
                        <div className="md:col-span-2 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">
                                        Venda selecionada para adicionar itens
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                        {vendaSelecionadaParaItem.numero_pedido ?? 'Venda sem número'} — {vendaSelecionadaParaItem.canal_venda_nome ?? 'Canal não informado'}
                                    </p>
                                </div>

                                <div className="grid gap-2 text-sm md:grid-cols-3">
                                    <div className="rounded-lg bg-slate-900 px-3 py-2">
                                        <p className="text-slate-500">Local de saída</p>
                                        <p className="text-slate-200">
                                            {vendaSelecionadaParaItem.local_saida_nome ?? '-'}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-slate-900 px-3 py-2">
                                        <p className="text-slate-500">Status</p>
                                        <p className="text-slate-200">
                                            {vendaSelecionadaParaItem.status ?? '-'}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-slate-900 px-3 py-2">
                                        <p className="text-slate-500">Data</p>
                                        <p className="text-slate-200">
                                            {formatarData(vendaSelecionadaParaItem.data_venda)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-cyan-200">
                                    Saldo disponível para novo item
                                </p>

                                <p className="mt-1 text-xs text-cyan-100/70">
                                    O sistema considera o saldo real do local e também desconta itens já cadastrados que ainda estão pendentes de baixa FIFO.
                                </p>
                            </div>

                            <div className="rounded-xl border border-cyan-400/30 bg-slate-950 px-4 py-3 text-right">
                                <p className="text-xs text-slate-400">Disponível para lançar</p>

                                <p className={`mt-1 text-2xl font-bold ${saldoInsuficiente ? 'text-red-300' : 'text-cyan-300'}`}>
                                    {saldoPodeSerExibido ? saldoDisponivelParaItem : '-'}
                                </p>
                            </div>
                        </div>

                        {saldoPodeSerExibido ? (
                            <div className="mt-4 grid gap-3 text-sm md:grid-cols-5">
                                <div className="rounded-lg bg-slate-950/70 p-3">
                                    <p className="text-slate-500">Produto</p>
                                    <p className="mt-1 text-slate-200">
                                        {produtoSelecionadoParaItem?.nome ?? 'Produto selecionado'}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-slate-950/70 p-3">
                                    <p className="text-slate-500">Local de saída</p>
                                    <p className="mt-1 text-slate-200">
                                        {vendaSelecionadaParaItem?.local_saida_nome ?? localSaidaSelecionadoParaItem?.nome ?? '-'}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-slate-950/70 p-3">
                                    <p className="text-slate-500">Saldo real no local</p>
                                    <p className="mt-1 text-slate-200">
                                        {saldoBrutoNoLocalParaItem ?? '-'}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-slate-950/70 p-3">
                                    <p className="text-slate-500">Pendente já lançado</p>
                                    <p className="mt-1 text-slate-200">
                                        {quantidadePendenteReservadaParaItem}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-slate-950/70 p-3">
                                    <p className="text-slate-500">Quantidade informada</p>
                                    <p className="mt-1 text-slate-200">
                                        {quantidadeItemValida ? quantidadeItemPreview : '-'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-cyan-100/70">
                                Selecione uma venda e um produto para visualizar o saldo disponível.
                            </p>
                        )}

                        {saldoInsuficiente && (
                            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                                Estoque insuficiente para cadastrar este item. Reduza a quantidade, baixe o FIFO dos itens pendentes ou escolha uma venda com outro local de saída.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            SKU vendido
                        </label>

                        <input
                            value={formularioItem.sku_vendido}
                            onChange={(event) =>
                                atualizarCampoItem('sku_vendido', event.target.value)
                            }
                            placeholder="SKU vendido"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            ASIN vendido
                        </label>

                        <input
                            value={formularioItem.asin_vendido}
                            onChange={(event) =>
                                atualizarCampoItem('asin_vendido', event.target.value)
                            }
                            placeholder="ASIN, se houver"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
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
                            placeholder="Ex: 1"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Valor unitário *
                        </label>

                        <input
                            value={formularioItem.valor_unitario}
                            onChange={(event) =>
                                atualizarCampoItem('valor_unitario', event.target.value)
                            }
                            placeholder="Ex: 29,90"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Desconto item
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
                            Taxa marketplace item
                        </label>

                        <input
                            value={formularioItem.valor_taxa_marketplace_item}
                            onChange={(event) =>
                                atualizarCampoItem(
                                    'valor_taxa_marketplace_item',
                                    event.target.value
                                )
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Taxa logística item
                        </label>

                        <input
                            value={formularioItem.valor_taxa_logistica_item}
                            onChange={(event) =>
                                atualizarCampoItem(
                                    'valor_taxa_logistica_item',
                                    event.target.value
                                )
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Imposto item
                        </label>

                        <input
                            value={formularioItem.valor_imposto_item}
                            onChange={(event) =>
                                atualizarCampoItem('valor_imposto_item', event.target.value)
                            }
                            placeholder="0,00"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Outros custos item
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
                            Custo unitário estimado
                        </label>

                        <input
                            value={formularioItem.custo_unitario_estimado}
                            onChange={(event) =>
                                atualizarCampoItem(
                                    'custo_unitario_estimado',
                                    event.target.value
                                )
                            }
                            placeholder="Ex: 13,18"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div className="md:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <p className="text-sm text-emerald-200">
                            Valor bruto do item
                        </p>

                        <p className="mt-2 text-2xl font-bold text-emerald-300">
                            {formatarMoeda(valorBrutoItemPreview)}
                        </p>

                        <p className="mt-2 text-xs text-emerald-100/70">
                            Cálculo visual: quantidade × valor unitário.
                        </p>
                    </div>

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
                            placeholder="Observações sobre o item vendido"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={cadastroItemBloqueado}
                        className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {salvandoItem
                            ? 'Adicionando...'
                            : saldoInsuficiente
                                ? 'Estoque insuficiente'
                                : !formularioItem.venda_id || !formularioItem.produto_id
                                    ? 'Selecione venda e produto'
                                    : !quantidadeItemValida
                                        ? 'Informe uma quantidade válida'
                                        : saldoDisponivelParaItem === null
                                            ? 'Saldo não localizado'
                                            : 'Adicionar item à venda'}
                    </button>
                </div>
            </form>

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
                            Nenhum item de venda encontrado. Cadastre uma venda e adicione o produto vendido no formulário acima.
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
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {itensVendas.map((item) => {
                                    const quantidadeConsumida = calcularQuantidadeConsumida(item)
                                    const pendente = item.quantidade - quantidadeConsumida
                                    const podeBaixar =
                                        pendente > 0 &&
                                        item.status === 'ativo' &&
                                        !!item.venda_id

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

                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    disabled={!podeBaixar || baixandoVendaId === item.venda_id}
                                                    onClick={() => baixarVendaFIFO(item.venda_id)}
                                                    className="rounded-lg border border-orange-500/40 px-3 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                                                >
                                                    {baixandoVendaId === item.venda_id
                                                        ? 'Baixando...'
                                                        : podeBaixar
                                                            ? 'Baixar FIFO'
                                                            : 'Baixado'}
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
                                    <th className="px-4 py-3 font-medium">Ações</th>
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

                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => selecionarVendaParaItem(venda.venda_id)}
                                                className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10"
                                            >
                                                Usar venda
                                            </button>
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