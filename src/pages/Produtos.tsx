import { useEffect, useState, type FormEvent } from 'react'
import {
    atualizarProduto,
    buscarProdutos,
    cadastrarProduto,
    type NovoProduto,
    type Produto,
} from '../services/produtosService'
import {
    AppButton,
    AppCard,
    DataTableContainer,
    PageHeader,
    StatusBadge,
    stickyTableHeadClassName,
} from '../components/ui'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FormularioProduto = {
    nome: string
    sku: string
    asin: string
    ean: string
    marca: string
    categoria: string
    status: string
}

const formularioInicial: FormularioProduto = {
    nome: '',
    sku: '',
    asin: '',
    ean: '',
    marca: '',
    categoria: '',
    status: 'ativo',
}

function transformarTextoEmNull(valor: string) {
    const texto = valor.trim()

    if (!texto) {
        return null
    }

    return texto
}

function validarFormularioProduto(formulario: FormularioProduto) {
    if (!formulario.nome.trim()) {
        return 'O nome do produto é obrigatório.'
    }

    if (!formulario.sku.trim()) {
        return 'O SKU do produto é obrigatório.'
    }

    const asin = formulario.asin.trim().toUpperCase()

    if (asin && asin.length !== 10) {
        return 'O ASIN deve ter exatamente 10 caracteres.'
    }

    if (asin && !/^[A-Z0-9]{10}$/.test(asin)) {
        return 'O ASIN deve conter apenas letras e números.'
    }

    if (!formulario.status.trim()) {
        return 'O status é obrigatório.'
    }

    return null
}

function produtoParaFormulario(produto: Produto): FormularioProduto {
    return {
        nome: produto.nome ?? '',
        sku: produto.sku ?? '',
        asin: produto.asin ?? '',
        ean: produto.ean ?? '',
        marca: produto.marca ?? '',
        categoria: produto.categoria ?? '',
        status: produto.status ?? 'ativo',
    }
}

export function Produtos() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando produtos...')
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [salvando, setSalvando] = useState(false)
    const [produtoEditandoId, setProdutoEditandoId] = useState<string | null>(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)

    const [formulario, setFormulario] =
        useState<FormularioProduto>(formularioInicial)

    async function carregarProdutos() {
        try {
            const dados = await buscarProdutos()

            setProdutos(dados)
            setStatus('sucesso')

            if (dados.length === 0) {
                setMensagem('Consulta realizada com sucesso, mas nenhum produto foi encontrado.')
            } else {
                setMensagem(`${dados.length} produto(s) encontrado(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao buscar produtos.')
            }
        }
    }

    useEffect(() => {
        carregarProdutos()
    }, [])

    function atualizarCampo(campo: keyof FormularioProduto, valor: string) {
        setFormulario((formularioAtual) => ({
            ...formularioAtual,
            [campo]: valor,
        }))
    }

    function limparFormulario() {
        setFormulario(formularioInicial)
        setProdutoEditandoId(null)
        setMostrarFormulario(false)
    }

    function abrirFormularioCadastro() {
        setFormulario(formularioInicial)
        setProdutoEditandoId(null)
        setMostrarFormulario(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function iniciarEdicao(produto: Produto) {
        setProdutoEditandoId(produto.id)
        setFormulario(produtoParaFormulario(produto))
        setMostrarFormulario(true)
        setStatus('sucesso')
        setMensagem(`Editando o produto: ${produto.nome}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarFormularioProduto(formulario)

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const dadosProduto: NovoProduto = {
            nome: formulario.nome.trim(),
            sku: formulario.sku.trim(),
            asin: transformarTextoEmNull(formulario.asin.toUpperCase()),
            ean: transformarTextoEmNull(formulario.ean),
            marca: transformarTextoEmNull(formulario.marca),
            categoria: transformarTextoEmNull(formulario.categoria),
            status: formulario.status.trim() || 'ativo',
        }

        try {
            setSalvando(true)

            if (produtoEditandoId) {
                setMensagem('Atualizando produto...')

                await atualizarProduto(produtoEditandoId, dadosProduto)

                limparFormulario()
                await carregarProdutos()

                setStatus('sucesso')
                setMensagem('Produto atualizado com sucesso.')
            } else {
                setMensagem('Cadastrando produto...')

                await cadastrarProduto(dadosProduto)

                limparFormulario()
                await carregarProdutos()

                setStatus('sucesso')
                setMensagem('Produto cadastrado com sucesso.')
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                if (
                    error.message.toLowerCase().includes('duplicate') ||
                    error.message.toLowerCase().includes('unique')
                ) {
                    setMensagem('Já existe um produto cadastrado com este SKU.')
                } else {
                    setMensagem(error.message)
                }
            } else {
                setMensagem('Erro desconhecido ao salvar produto.')
            }
        } finally {
            setSalvando(false)
        }
    }

    const estaEditando = produtoEditandoId !== null

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <PageHeader
                tag="MÓDULO"
                title="Produtos"
                description="Cadastro, edição e listagem dos produtos vendidos na operação."
            />

            {mostrarFormulario ? (
                <AppCard>
                    <form onSubmit={enviarFormulario}>
                        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {estaEditando ? 'Editar produto' : 'Cadastrar novo produto'}
                                </h2>

                                <p className="mt-2 text-sm text-slate-400">
                                    Campos obrigatórios: nome, SKU e status. O ASIN é opcional, mas se for preenchido precisa ter exatamente 10 caracteres.
                                </p>
                            </div>

                            <AppButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={limparFormulario}
                            >
                                {estaEditando ? 'Cancelar edição' : 'Cancelar cadastro'}
                            </AppButton>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Nome do produto *
                                </label>

                                <input
                                    value={formulario.nome}
                                    onChange={(event) => atualizarCampo('nome', event.target.value)}
                                    placeholder="Ex: Vidro Novo Luxcar 100ml"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    SKU *
                                </label>

                                <input
                                    value={formulario.sku}
                                    onChange={(event) => atualizarCampo('sku', event.target.value)}
                                    placeholder="Ex: LUX-VIDRO-NOVO-100ML"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    ASIN
                                </label>

                                <input
                                    value={formulario.asin}
                                    onChange={(event) =>
                                        atualizarCampo('asin', event.target.value.toUpperCase())
                                    }
                                    placeholder="Ex: B08TDQWBR3"
                                    maxLength={10}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    EAN
                                </label>

                                <input
                                    value={formulario.ean}
                                    onChange={(event) => atualizarCampo('ean', event.target.value)}
                                    placeholder="Código de barras, se houver"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Marca
                                </label>

                                <input
                                    value={formulario.marca}
                                    onChange={(event) => atualizarCampo('marca', event.target.value)}
                                    placeholder="Ex: Luxcar"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Categoria
                                </label>

                                <input
                                    value={formulario.categoria}
                                    onChange={(event) =>
                                        atualizarCampo('categoria', event.target.value)
                                    }
                                    placeholder="Ex: Automotivo"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Status *
                                </label>

                                <select
                                    value={formulario.status}
                                    onChange={(event) => atualizarCampo('status', event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                >
                                    <option value="ativo">ativo</option>
                                    <option value="inativo">inativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                            <AppButton
                                type="submit"
                                variant="primary"
                                disabled={salvando}
                            >
                                {salvando
                                    ? estaEditando
                                        ? 'Atualizando...'
                                        : 'Cadastrando...'
                                    : estaEditando
                                        ? 'Atualizar produto'
                                        : 'Cadastrar produto'}
                            </AppButton>
                        </div>
                    </form>
                </AppCard>
            ) : (
                <AppCard>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">
                                Produtos
                            </h2>

                            <p className="mt-2 text-sm text-slate-400">
                                O formulário fica fechado para manter a tela mais limpa. Clique no botão para cadastrar um novo produto.
                            </p>
                        </div>

                        <AppButton
                            type="button"
                            variant="primary"
                            onClick={abrirFormularioCadastro}
                            className="w-full md:w-auto"
                        >
                            Cadastrar novo produto
                        </AppButton>
                    </div>
                </AppCard>
            )}

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
                        Produtos encontrados
                    </h2>

                    <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {produtos.length}
                    </span>
                </div>

                {produtos.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum produto para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[880px] border-collapse text-left text-xs sm:text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="w-[260px] px-3 py-3 font-medium sm:px-4">Nome</th>
                                    <th className="w-[170px] px-3 py-3 font-medium sm:px-4">SKU</th>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">ASIN</th>
                                    <th className="w-[140px] px-3 py-3 font-medium sm:px-4">EAN</th>
                                    <th className="w-[130px] px-3 py-3 font-medium sm:px-4">Marca</th>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">Categoria</th>
                                    <th className="w-[100px] px-3 py-3 font-medium sm:px-4">Status</th>
                                    <th className="w-[100px] px-3 py-3 font-medium sm:px-4">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {produtos.map((produto) => (
                                    <tr key={produto.id} className="hover:bg-slate-800/60">
                                        <td className="max-w-[260px] px-3 py-3 font-medium text-slate-100 sm:px-4">
                                            {produto.nome}
                                        </td>

                                        <td className="max-w-[170px] px-3 py-3 text-slate-300 sm:px-4">
                                            <span className="break-words">{produto.sku}</span>
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {produto.asin ?? '-'}
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            {produto.ean ?? '-'}
                                        </td>

                                        <td className="max-w-[130px] px-3 py-3 text-slate-300 sm:px-4">
                                            {produto.marca ?? '-'}
                                        </td>

                                        <td className="max-w-[150px] px-3 py-3 text-slate-300 sm:px-4">
                                            {produto.categoria ?? '-'}
                                        </td>

                                        <td className="px-3 py-3 text-slate-300 sm:px-4">
                                            <StatusBadge
                                                tone={produto.status === 'ativo' ? 'success' : 'muted'}
                                            >
                                                {produto.status}
                                            </StatusBadge>
                                        </td>

                                        <td className="px-3 py-3 sm:px-4">
                                            <AppButton
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => iniciarEdicao(produto)}
                                            >
                                                Editar
                                            </AppButton>
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
