import { useEffect, useState, type FormEvent } from 'react'
import {
    atualizarFornecedor,
    buscarFornecedores,
    cadastrarFornecedor,
    type Fornecedor,
    type NovoFornecedor,
} from '../services/fornecedoresService'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

type FormularioFornecedor = {
    nome: string
    nome_fantasia: string
    tipo_pessoa: string
    documento: string
    contato_nome: string
    email: string
    telefone: string
    whatsapp: string
    site: string
    endereco: string
    cidade: string
    estado: string
    pais: string
    observacoes: string
    status: string
}

const formularioInicial: FormularioFornecedor = {
    nome: '',
    nome_fantasia: '',
    tipo_pessoa: 'nao_informado',
    documento: '',
    contato_nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    site: '',
    endereco: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    observacoes: '',
    status: 'ativo',
}

function transformarTextoEmNull(valor: string) {
    const texto = valor.trim()

    if (!texto) {
        return null
    }

    return texto
}

function validarFormularioFornecedor(formulario: FormularioFornecedor) {
    if (!formulario.nome.trim()) {
        return 'O nome do fornecedor é obrigatório.'
    }

    if (!formulario.tipo_pessoa.trim()) {
        return 'O tipo de pessoa é obrigatório.'
    }

    if (!['nao_informado', 'fisica', 'juridica'].includes(formulario.tipo_pessoa)) {
        return 'Tipo de pessoa inválido.'
    }

    if (!formulario.status.trim()) {
        return 'O status é obrigatório.'
    }

    if (!['ativo', 'inativo'].includes(formulario.status)) {
        return 'Status inválido.'
    }

    return null
}

function fornecedorParaFormulario(
    fornecedor: Fornecedor
): FormularioFornecedor {
    return {
        nome: fornecedor.nome ?? '',
        nome_fantasia: fornecedor.nome_fantasia ?? '',
        tipo_pessoa: fornecedor.tipo_pessoa ?? 'nao_informado',
        documento: fornecedor.documento ?? '',
        contato_nome: fornecedor.contato_nome ?? '',
        email: fornecedor.email ?? '',
        telefone: fornecedor.telefone ?? '',
        whatsapp: fornecedor.whatsapp ?? '',
        site: fornecedor.site ?? '',
        endereco: fornecedor.endereco ?? '',
        cidade: fornecedor.cidade ?? '',
        estado: fornecedor.estado ?? '',
        pais: fornecedor.pais ?? 'Brasil',
        observacoes: fornecedor.observacoes ?? '',
        status: fornecedor.status ?? 'ativo',
    }
}

export function Fornecedores() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando fornecedores...')
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
    const [salvando, setSalvando] = useState(false)
    const [fornecedorEditandoId, setFornecedorEditandoId] = useState<string | null>(
        null
    )

    const [formulario, setFormulario] =
        useState<FormularioFornecedor>(formularioInicial)

    async function carregarFornecedores() {
        try {
            const dados = await buscarFornecedores()

            setFornecedores(dados)
            setStatus('sucesso')

            if (dados.length === 0) {
                setMensagem(
                    'Consulta realizada com sucesso, mas nenhum fornecedor foi encontrado.'
                )
            } else {
                setMensagem(`${dados.length} fornecedor(es) encontrado(s).`)
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao buscar fornecedores.')
            }
        }
    }

    useEffect(() => {
        carregarFornecedores()
    }, [])

    function atualizarCampo(campo: keyof FormularioFornecedor, valor: string) {
        setFormulario((formularioAtual) => ({
            ...formularioAtual,
            [campo]: valor,
        }))
    }

    function limparFormulario() {
        setFormulario(formularioInicial)
        setFornecedorEditandoId(null)
    }

    function iniciarEdicao(fornecedor: Fornecedor) {
        setFornecedorEditandoId(fornecedor.id)
        setFormulario(fornecedorParaFormulario(fornecedor))
        setStatus('sucesso')
        setMensagem(`Editando o fornecedor: ${fornecedor.nome}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarFormularioFornecedor(formulario)

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        const dadosFornecedor: NovoFornecedor = {
            nome: formulario.nome.trim(),
            nome_fantasia: transformarTextoEmNull(formulario.nome_fantasia),
            tipo_pessoa: formulario.tipo_pessoa,
            documento: transformarTextoEmNull(formulario.documento),
            contato_nome: transformarTextoEmNull(formulario.contato_nome),
            email: transformarTextoEmNull(formulario.email),
            telefone: transformarTextoEmNull(formulario.telefone),
            whatsapp: transformarTextoEmNull(formulario.whatsapp),
            site: transformarTextoEmNull(formulario.site),
            endereco: transformarTextoEmNull(formulario.endereco),
            cidade: transformarTextoEmNull(formulario.cidade),
            estado: transformarTextoEmNull(formulario.estado),
            pais: transformarTextoEmNull(formulario.pais) ?? 'Brasil',
            observacoes: transformarTextoEmNull(formulario.observacoes),
            status: formulario.status,
        }

        try {
            setSalvando(true)

            if (fornecedorEditandoId) {
                setMensagem('Atualizando fornecedor...')

                await atualizarFornecedor(fornecedorEditandoId, dadosFornecedor)

                limparFormulario()
                await carregarFornecedores()

                setStatus('sucesso')
                setMensagem('Fornecedor atualizado com sucesso.')
            } else {
                setMensagem('Cadastrando fornecedor...')

                await cadastrarFornecedor(dadosFornecedor)

                limparFormulario()
                await carregarFornecedores()

                setStatus('sucesso')
                setMensagem('Fornecedor cadastrado com sucesso.')
            }
        } catch (error) {
            setStatus('erro')

            if (error instanceof Error) {
                if (
                    error.message.toLowerCase().includes('duplicate') ||
                    error.message.toLowerCase().includes('unique')
                ) {
                    setMensagem(
                        'Já existe um fornecedor cadastrado com este documento.'
                    )
                } else {
                    setMensagem(error.message)
                }
            } else {
                setMensagem('Erro desconhecido ao salvar fornecedor.')
            }
        } finally {
            setSalvando(false)
        }
    }

    const estaEditando = fornecedorEditandoId !== null

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
                <p className="text-sm uppercase tracking-widest text-cyan-400">
                    Módulo
                </p>

                <h1 className="mt-3 text-3xl font-bold">
                    Fornecedores
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                    Cadastro, edição e listagem dos fornecedores da operação.
                </p>
            </div>

            <form
                onSubmit={enviarFormulario}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            >
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {estaEditando ? 'Editar fornecedor' : 'Cadastrar novo fornecedor'}
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Campos obrigatórios: nome, tipo de pessoa e status. O documento é opcional,
                            mas se preenchido não pode se repetir.
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
                            Nome / Razão social *
                        </label>

                        <input
                            value={formulario.nome}
                            onChange={(event) => atualizarCampo('nome', event.target.value)}
                            placeholder="Ex: Distribuidora ABC Ltda"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Nome fantasia
                        </label>

                        <input
                            value={formulario.nome_fantasia}
                            onChange={(event) =>
                                atualizarCampo('nome_fantasia', event.target.value)
                            }
                            placeholder="Ex: ABC Distribuidora"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Tipo de pessoa *
                        </label>

                        <select
                            value={formulario.tipo_pessoa}
                            onChange={(event) =>
                                atualizarCampo('tipo_pessoa', event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        >
                            <option value="nao_informado">não informado</option>
                            <option value="fisica">física</option>
                            <option value="juridica">jurídica</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Documento
                        </label>

                        <input
                            value={formulario.documento}
                            onChange={(event) =>
                                atualizarCampo('documento', event.target.value)
                            }
                            placeholder="CPF ou CNPJ"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Nome do contato
                        </label>

                        <input
                            value={formulario.contato_nome}
                            onChange={(event) =>
                                atualizarCampo('contato_nome', event.target.value)
                            }
                            placeholder="Ex: João"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            E-mail
                        </label>

                        <input
                            value={formulario.email}
                            onChange={(event) => atualizarCampo('email', event.target.value)}
                            placeholder="Ex: contato@fornecedor.com"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Telefone
                        </label>

                        <input
                            value={formulario.telefone}
                            onChange={(event) =>
                                atualizarCampo('telefone', event.target.value)
                            }
                            placeholder="Ex: (11) 3333-4444"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            WhatsApp
                        </label>

                        <input
                            value={formulario.whatsapp}
                            onChange={(event) =>
                                atualizarCampo('whatsapp', event.target.value)
                            }
                            placeholder="Ex: (11) 99999-9999"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Site
                        </label>

                        <input
                            value={formulario.site}
                            onChange={(event) => atualizarCampo('site', event.target.value)}
                            placeholder="Ex: https://www.fornecedor.com.br"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Endereço
                        </label>

                        <input
                            value={formulario.endereco}
                            onChange={(event) =>
                                atualizarCampo('endereco', event.target.value)
                            }
                            placeholder="Rua, número, bairro"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Cidade
                        </label>

                        <input
                            value={formulario.cidade}
                            onChange={(event) => atualizarCampo('cidade', event.target.value)}
                            placeholder="Ex: São Paulo"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Estado
                        </label>

                        <input
                            value={formulario.estado}
                            onChange={(event) => atualizarCampo('estado', event.target.value)}
                            placeholder="Ex: SP"
                            maxLength={2}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 uppercase text-slate-100 outline-none focus:border-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            País
                        </label>

                        <input
                            value={formulario.pais}
                            onChange={(event) => atualizarCampo('pais', event.target.value)}
                            placeholder="Brasil"
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

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Observações
                        </label>

                        <textarea
                            value={formulario.observacoes}
                            onChange={(event) =>
                                atualizarCampo('observacoes', event.target.value)
                            }
                            placeholder="Observações gerais sobre o fornecedor"
                            rows={4}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                        />
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
                                ? 'Atualizar fornecedor'
                                : 'Cadastrar fornecedor'}
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
                        Fornecedores encontrados
                    </h2>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Total: {fornecedores.length}
                    </span>
                </div>

                {fornecedores.length === 0 ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
                        <p className="text-slate-300">
                            Nenhum fornecedor para exibir no momento.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                            <thead className="bg-slate-950 text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Nome</th>
                                    <th className="px-4 py-3 font-medium">Fantasia</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Documento</th>
                                    <th className="px-4 py-3 font-medium">Contato</th>
                                    <th className="px-4 py-3 font-medium">E-mail</th>
                                    <th className="px-4 py-3 font-medium">Telefone</th>
                                    <th className="px-4 py-3 font-medium">Cidade/UF</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {fornecedores.map((fornecedor) => (
                                    <tr key={fornecedor.id} className="hover:bg-slate-800/60">
                                        <td className="px-4 py-3 text-slate-100">
                                            {fornecedor.nome}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.nome_fantasia ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.tipo_pessoa}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.documento ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.contato_nome ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.email ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.telefone ?? fornecedor.whatsapp ?? '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.cidade || fornecedor.estado
                                                ? `${fornecedor.cidade ?? '-'} / ${fornecedor.estado ?? '-'}`
                                                : '-'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {fornecedor.status}
                                        </td>

                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => iniciarEdicao(fornecedor)}
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
                        {JSON.stringify(fornecedores, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}