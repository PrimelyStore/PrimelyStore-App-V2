import { useEffect, useState, type FormEvent } from 'react'
import {
    atualizarProduto,
    buscarProdutos,
    cadastrarProduto,
    type NovoProduto,
    type Produto,
} from '../services/produtosService'

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
    }

    function iniciarEdicao(produto: Produto) {
        setProdutoEditandoId(produto.id)
        setFormulario(produtoParaFormulario(produto))
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
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Produtos
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Cadastro, edição e listagem dos produtos vendidos na operação.
                </p>
            </div>

            <form
                onSubmit={enviarFormulario}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {estaEditando ? 'Editar produto' : 'Cadastrar novo produto'}
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Campos obrigatórios: nome, SKU e status. O ASIN é opcional, mas se for preenchido precisa ter exatamente 10 caracteres.
                        </p>
                    </div>

                    {estaEditando && (
                        <button
                            type="button"
                            onClick={limparFormulario}
                            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                        >
                            Cancelar edição
                        </button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={salvando}
                        className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {salvando
                            ? estaEditando
                                ? 'Atualizando...'
                                : 'Cadastrando...'
                            : estaEditando
                                ? 'Atualizar produto'
                                : 'Cadastrar produto'}
                    </button>
                </div>
            </form>

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
                        Produtos encontrados
                    </h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
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
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Nome</th>
                                    <th className="px-4 py-3 font-medium">SKU</th>
                                    <th className="px-4 py-3 font-medium">ASIN</th>
                                    <th className="px-4 py-3 font-medium">EAN</th>
                                    <th className="px-4 py-3 font-medium">Marca</th>
                                    <th className="px-4 py-3 font-medium">Categoria</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {produtos.map((produto) => (
                                    <tr key={produto.id} className="hover:bg-slate-800/60">
                                        <td className="px-4 py-3 text-slate-100">
                                            {produto.nome}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {produto.sku}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {produto.asin ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {produto.ean ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {produto.marca ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {produto.categoria ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {produto.status}
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => iniciarEdicao(produto)}
                                                className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/10"
                                            >
                                                Editar
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
                        {JSON.stringify(produtos, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}