import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
    buscarProdutos,
    buscarSnapshotProdutosOlist,
    enriquecerProduto,
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

type ProdutoEnriquecido = {
    id_produto_olist: number
    sku: string
    descricao_olist: string | null
    situacao_olist: string | null
    gtin_olist: string | null
    preco_custo_olist: number | null
    preco_custo_medio_olist: number | null
    estoque_quantidade_olist: number | null
    sincronizado_em_olist: string
    id_local: string | null
    nome_local: string | null
    asin_local: string | null
    ean_local: string | null
    marca_local: string | null
    categoria_local: string | null
    status_local: string | null
    enriquecido: boolean
}

type FormularioEnriquecimento = {
    sku: string
    descricao_olist: string
    nome: string
    asin: string
    ean: string
    marca: string
    categoria: string
    status: string
}

const formularioInicial: FormularioEnriquecimento = {
    sku: '',
    descricao_olist: '',
    nome: '',
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

function validarFormularioEnriquecimento(formulario: FormularioEnriquecimento) {
    if (!formulario.nome.trim()) {
        return 'O nome gerencial do produto é obrigatório.'
    }

    const asin = formulario.asin.trim().toUpperCase()

    if (asin && asin.length !== 10) {
        return 'O ASIN deve ter exatamente 10 caracteres.'
    }

    if (asin && !/^[A-Z0-9]{10}$/.test(asin)) {
        return 'O ASIN deve conter apenas letras e números.'
    }

    return null
}

export function Produtos() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando produtos do Olist e dados locais...')
    const [produtos, setProdutos] = useState<ProdutoEnriquecido[]>([])
    const [salvando, setSalvando] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [skuSelecionado, setSkuSelecionado] = useState<string>('')

    const [formulario, setFormulario] =
        useState<FormularioEnriquecimento>(formularioInicial)

    // Estados de filtros
    const [filtroBusca, setFiltroBusca] = useState('')
    const [filtroEnriquecimento, setFiltroEnriquecimento] = useState<'todos' | 'enriquecidos' | 'pendentes'>('todos')
    const [filtroSituacaoOlist, setFiltroSituacaoOlist] = useState<'todos' | 'A' | 'I'>('A')

    async function carregarDados() {
        try {
            setStatus('carregando')
            setMensagem('Carregando produtos do Olist e dados locais...')

            const [snapProdutos, localProdutos] = await Promise.all([
                buscarSnapshotProdutosOlist(),
                buscarProdutos()
            ])

            const locaisPorSku = new Map<string, Produto>()
            localProdutos.forEach(p => {
                if (p.sku) {
                    locaisPorSku.set(p.sku.trim().toLowerCase(), p)
                }
            })

            const combinados: ProdutoEnriquecido[] = snapProdutos.map(sp => {
                const skuKey = sp.sku?.trim().toLowerCase() ?? ''
                const local = skuKey ? locaisPorSku.get(skuKey) : undefined

                return {
                    id_produto_olist: sp.id_produto_olist,
                    sku: sp.sku ?? '',
                    descricao_olist: sp.descricao,
                    situacao_olist: sp.situacao,
                    gtin_olist: sp.gtin,
                    preco_custo_olist: sp.preco_custo,
                    preco_custo_medio_olist: sp.preco_custo_medio,
                    estoque_quantidade_olist: sp.estoque_quantidade,
                    sincronizado_em_olist: sp.sincronizado_em,
                    id_local: local?.id ?? null,
                    nome_local: local?.nome ?? null,
                    asin_local: local?.asin ?? null,
                    ean_local: local?.ean ?? null,
                    marca_local: local?.marca ?? null,
                    categoria_local: local?.categoria ?? null,
                    status_local: local?.status ?? null,
                    enriquecido: Boolean(local?.asin),
                }
            })

            setProdutos(combinados)
            setStatus('sucesso')
            setMensagem(`${combinados.length} produto(s) sincronizado(s) do Olist carregado(s).`)
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
        carregarDados()
    }, [])

    const KPIs = useMemo(() => {
        const total = produtos.length
        const ativosOlist = produtos.filter(p => p.situacao_olist === 'A').length
        const enriquecidos = produtos.filter(p => p.enriquecido).length
        const pendentes = total - enriquecidos

        return { total, ativosOlist, enriquecidos, pendentes }
    }, [produtos])

    const produtosFiltrados = useMemo(() => {
        const buscaNorm = filtroBusca.trim().toLowerCase()

        return produtos.filter(p => {
            if (filtroSituacaoOlist !== 'todos' && p.situacao_olist !== filtroSituacaoOlist) {
                return false
            }

            if (filtroEnriquecimento === 'enriquecidos' && !p.enriquecido) {
                return false
            }
            if (filtroEnriquecimento === 'pendentes' && p.enriquecido) {
                return false
            }

            if (buscaNorm) {
                const matchSku = p.sku.toLowerCase().includes(buscaNorm)
                const matchDesc = (p.descricao_olist ?? '').toLowerCase().includes(buscaNorm)
                const matchNomeLoc = (p.nome_local ?? '').toLowerCase().includes(buscaNorm)
                const matchAsin = (p.asin_local ?? '').toLowerCase().includes(buscaNorm)
                const matchGtin = (p.gtin_olist ?? '').toLowerCase().includes(buscaNorm)

                return matchSku || matchDesc || matchNomeLoc || matchAsin || matchGtin
            }

            return true
        })
    }, [produtos, filtroBusca, filtroEnriquecimento, filtroSituacaoOlist])

    function atualizarCampo(campo: keyof FormularioEnriquecimento, valor: string) {
        setFormulario((formularioAtual) => ({
            ...formularioAtual,
            [campo]: valor,
        }))
    }

    function limparFormulario() {
        setFormulario(formularioInicial)
        setSkuSelecionado('')
        setMostrarFormulario(false)
    }

    function iniciarEnriquecimento(produto: ProdutoEnriquecido) {
        setSkuSelecionado(produto.sku)
        setFormulario({
            sku: produto.sku,
            descricao_olist: produto.descricao_olist ?? '',
            nome: produto.nome_local ?? produto.descricao_olist ?? '',
            asin: produto.asin_local ?? '',
            ean: produto.ean_local ?? produto.gtin_olist ?? '',
            marca: produto.marca_local ?? '',
            categoria: produto.categoria_local ?? '',
            status: produto.status_local ?? 'ativo',
        })
        setMostrarFormulario(true)
        setStatus('sucesso')
        setMensagem(`Enriquecendo dados gerenciais do produto com SKU: ${produto.sku}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const erroValidacao = validarFormularioEnriquecimento(formulario)

        if (erroValidacao) {
            setStatus('erro')
            setMensagem(erroValidacao)
            return
        }

        try {
            setSalvando(true)
            setMensagem('Salvando enriquecimento de produto...')

            await enriquecerProduto(skuSelecionado, {
                nome: formulario.nome.trim(),
                asin: transformarTextoEmNull(formulario.asin.toUpperCase()),
                ean: transformarTextoEmNull(formulario.ean),
                marca: transformarTextoEmNull(formulario.marca),
                categoria: transformarTextoEmNull(formulario.categoria),
                status: formulario.status.trim() || 'ativo',
            })

            limparFormulario()
            await carregarDados()

            setStatus('sucesso')
            setMensagem('Dados gerenciais enriquecidos com sucesso.')
        } catch (error) {
            setStatus('erro')
            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao salvar enriquecimento do produto.')
            }
        } finally {
            setSalvando(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <PageHeader
                tag="INTELIGÊNCIA GERENCIAL"
                title="Enriquecimento de Produtos Olist"
                description="Complemente os produtos sincronizados do Olist com dados gerenciais como ASIN da Amazon, marca e categoria."
            />

            {/* Painel KPI no Topo */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AppCard>
                    <p className="text-sm text-slate-400">Total Sincronizado Olist</p>
                    <p className="mt-3 text-3xl font-bold">{KPIs.total}</p>
                </AppCard>
                <AppCard>
                    <p className="text-sm text-slate-400">Ativos no Olist</p>
                    <p className="mt-3 text-3xl font-bold text-cyan-300">{KPIs.ativosOlist}</p>
                </AppCard>
                <AppCard>
                    <p className="text-sm text-slate-400">Dados Enriquecidos (ASIN)</p>
                    <p className="mt-3 text-3xl font-bold text-emerald-300">{KPIs.enriquecidos}</p>
                </AppCard>
                <AppCard>
                    <p className="text-sm text-slate-400">Pendentes de ASIN</p>
                    <p className="mt-3 text-3xl font-bold text-amber-400">{KPIs.pendentes}</p>
                </AppCard>
            </div>

            {/* Formulário de Enriquecimento */}
            {mostrarFormulario && (
                <AppCard>
                    <form onSubmit={enviarFormulario}>
                        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-cyan-300">
                                    Enriquecer Produto Gerencial
                                </h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    Complemente com o ASIN da Amazon (10 caracteres) e outras tags gerenciais. O SKU e a Descrição original do Olist são protegidos.
                                </p>
                            </div>

                            <AppButton
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={limparFormulario}
                            >
                                Cancelar Enriquecimento
                            </AppButton>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm text-slate-400 font-semibold">
                                    SKU (Olist)
                                </label>
                                <input
                                    value={formulario.sku}
                                    disabled
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-400 font-semibold">
                                    Descrição Original (Olist)
                                </label>
                                <input
                                    value={formulario.descricao_olist}
                                    disabled
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300 font-semibold">
                                    Nome Gerencial do Produto *
                                </label>
                                <input
                                    value={formulario.nome}
                                    onChange={(event) => atualizarCampo('nome', event.target.value)}
                                    placeholder="Nome amigável para relatórios"
                                    className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300 font-semibold">
                                    ASIN (Amazon FBA)
                                </label>
                                <input
                                    value={formulario.asin}
                                    onChange={(event) =>
                                        atualizarCampo('asin', event.target.value.toUpperCase())
                                    }
                                    placeholder="Ex: B08TDQWBR3"
                                    maxLength={10}
                                    className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300 font-semibold">
                                    EAN / GTIN
                                </label>
                                <input
                                    value={formulario.ean}
                                    onChange={(event) => atualizarCampo('ean', event.target.value)}
                                    placeholder="Código de barras"
                                    className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300 font-semibold">
                                    Marca
                                </label>
                                <input
                                    value={formulario.marca}
                                    onChange={(event) => atualizarCampo('marca', event.target.value)}
                                    placeholder="Ex: Luxcar"
                                    className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300 font-semibold">
                                    Categoria
                                </label>
                                <input
                                    value={formulario.categoria}
                                    onChange={(event) =>
                                        atualizarCampo('categoria', event.target.value)
                                    }
                                    placeholder="Ex: Automotivo"
                                    className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300 font-semibold">
                                    Status Local *
                                </label>
                                <select
                                    value={formulario.status}
                                    onChange={(event) => atualizarCampo('status', event.target.value)}
                                    className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                                >
                                    <option value="ativo">Ativo</option>
                                    <option value="inativo">Inativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                            <AppButton
                                type="submit"
                                variant="primary"
                                disabled={salvando}
                            >
                                {salvando ? 'Salvando...' : 'Salvar Enriquecimento'}
                            </AppButton>
                        </div>
                    </form>
                </AppCard>
            )}

            {/* Painel de Status */}
            <AppCard>
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Status do Carregamento
                    </p>
                    <div className="flex items-center gap-3">
                        <StatusBadge
                            tone={
                                status === 'sucesso'
                                    ? 'success'
                                    : status === 'erro'
                                        ? 'danger'
                                        : 'warning'
                            }
                        >
                            {status}
                        </StatusBadge>
                        <p className="text-sm text-slate-300">{mensagem}</p>
                    </div>
                </div>
            </AppCard>

            {/* Filtros da Listagem */}
            <AppCard>
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-200">
                        Filtros de Busca
                    </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-xs text-slate-400 font-semibold uppercase">
                            Pesquisar por texto
                        </label>
                        <input
                            value={filtroBusca}
                            onChange={(event) => setFiltroBusca(event.target.value)}
                            placeholder="SKU, Descrição, ASIN ou Nome"
                            className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs text-slate-400 font-semibold uppercase">
                            Status Enriquecimento
                        </label>
                        <select
                            value={filtroEnriquecimento}
                            onChange={(event) => setFiltroEnriquecimento(event.target.value as any)}
                            className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                        >
                            <option value="todos">Todos os produtos</option>
                            <option value="enriquecidos">Enriquecidos (Com ASIN)</option>
                            <option value="pendentes">Pendentes de ASIN</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs text-slate-400 font-semibold uppercase">
                            Situação no Olist
                        </label>
                        <select
                            value={filtroSituacaoOlist}
                            onChange={(event) => setFiltroSituacaoOlist(event.target.value as any)}
                            className="w-full rounded-xl border border-slate-750 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 transition"
                        >
                            <option value="A">Ativos no Olist</option>
                            <option value="I">Inativos no Olist</option>
                            <option value="todos">Todos</option>
                        </select>
                    </div>
                </div>
            </AppCard>

            {/* Listagem de Produtos */}
            <AppCard>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-200">
                        Produtos Sincronizados
                    </h2>

                    <span className="inline-flex w-max whitespace-nowrap items-center rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                        Filtrados: {produtosFiltrados.length}
                    </span>
                </div>

                {produtosFiltrados.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
                        <p className="text-slate-400">
                            Nenhum produto atende aos filtros selecionados.
                        </p>
                    </div>
                ) : (
                    <DataTableContainer>
                        <table className="w-full min-w-[1000px] border-collapse text-left text-xs sm:text-sm">
                            <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                <tr>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">Enriquecido</th>
                                    <th className="w-[100px] px-3 py-3 font-medium sm:px-4">Olist</th>
                                    <th className="w-[150px] px-3 py-3 font-medium sm:px-4">SKU</th>
                                    <th className="w-[300px] px-3 py-3 font-medium sm:px-4">Descrição Olist / Nome Local</th>
                                    <th className="w-[110px] px-3 py-3 font-medium sm:px-4">ASIN</th>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">EAN</th>
                                    <th className="w-[110px] px-3 py-3 font-medium sm:px-4">Marca</th>
                                    <th className="w-[120px] px-3 py-3 font-medium sm:px-4">Categoria</th>
                                    <th className="w-[90px] px-3 py-3 font-medium sm:px-4 text-center">Ação</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800 bg-slate-900">
                                {produtosFiltrados.map((produto) => (
                                    <tr key={produto.id_produto_olist} className="hover:bg-slate-800/40 transition">
                                        <td className="px-3 py-4 sm:px-4">
                                            <StatusBadge
                                                tone={produto.enriquecido ? 'success' : 'warning'}
                                            >
                                                {produto.enriquecido ? 'Enriquecido' : 'Pendente'}
                                            </StatusBadge>
                                        </td>

                                        <td className="px-3 py-4 sm:px-4">
                                            <StatusBadge
                                                tone={produto.situacao_olist === 'A' ? 'success' : 'muted'}
                                            >
                                                {produto.situacao_olist === 'A' ? 'Ativo' : 'Inativo'}
                                            </StatusBadge>
                                        </td>

                                        <td className="px-3 py-4 sm:px-4 font-mono text-cyan-300 font-semibold">
                                            {produto.sku}
                                        </td>

                                        <td className="px-3 py-4 sm:px-4">
                                            <p className="font-semibold text-slate-100">
                                                {produto.descricao_olist}
                                            </p>
                                            {produto.nome_local && produto.nome_local !== produto.descricao_olist && (
                                                <p className="mt-1 text-xs text-slate-400 italic">
                                                    Local: {produto.nome_local}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 sm:px-4 font-mono text-slate-200">
                                            {produto.asin_local ?? (
                                                <span className="text-slate-500 italic">sem ASIN</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 sm:px-4 text-slate-300 font-mono">
                                            {produto.ean_local ?? (
                                                <span className="text-slate-600">{produto.gtin_olist ?? '-'}</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-4 sm:px-4 text-slate-300">
                                            {produto.marca_local ?? '-'}
                                        </td>

                                        <td className="px-3 py-4 sm:px-4 text-slate-300">
                                            {produto.categoria_local ?? '-'}
                                        </td>

                                        <td className="px-3 py-4 sm:px-4 text-center">
                                            <AppButton
                                                type="button"
                                                variant={produto.enriquecido ? 'secondary' : 'primary'}
                                                size="sm"
                                                onClick={() => iniciarEnriquecimento(produto)}
                                            >
                                                {produto.enriquecido ? 'Editar' : 'Enriquecer'}
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
