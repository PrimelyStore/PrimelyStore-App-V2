import { useEffect, useState, useMemo } from 'react'
import {
    buscarProdutosBasePrecificacaoV5,
    buscarConfiguracaoOperacaoV5,
    buscarCustosPrepCenterV5,
    buscarCanaisVendaV5,
    buscarRegrasFiscaisCompraV5,
    buscarSugestoesCustoMedioV5,
    calcularSimulacaoMargemV5,
    type ProdutoPrecificacaoV5Item,
    type ConfiguracaoOperacaoV5,
    type CustoPrepCenterV5,
    type CanalVendaV5,
    type RegraFiscalCompraV5,
    type SugestaoCustoMedioV5,
    type ParamentrosSimulacaoV5
} from '../services/precificacaoService'
import {
    listarMapeamentosMarketplace,
    type MarketplaceMapeamento,
    type MarketplaceMapeamentoStatus,
    type MarketplaceMapeamentoTipo
} from '../services/produtoCanalMarketplaceService'
import {
    AppCard,
    DataTableContainer,
    PageHeader,
    StatusBadge,
    stickyTableHeadClassName
} from '../components/ui'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'
type AbaCustosMargem = 'custos' | 'simulador' | 'canais' | 'mapeamento' | 'parametros'

function formatarMoeda(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(valor ?? 0))
}

function formatarDataHora(valor?: string | null) {
    if (!valor) return '-'
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(valor))
}

function formatarPercentual(valor?: number | string | null) {
    return `${Number(valor ?? 0).toFixed(2)}%`
}

export function CustosMargem() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando dados de custos e precificação...')
    
    const [abaAtiva, setAbaAtiva] = useState<AbaCustosMargem>('custos')
    
    // Estados do Banco (Somente Leitura)
    const [produtosPrecificados, setProdutosPrecificados] = useState<ProdutoPrecificacaoV5Item[]>([])
    const [configuracao, setConfiguracao] = useState<ConfiguracaoOperacaoV5 | null>(null)
    const [custosPrep, setCustosPrep] = useState<CustoPrepCenterV5[]>([])
    const [canais, setCanais] = useState<CanalVendaV5[]>([])
    const [regrasFiscais, setRegrasFiscais] = useState<RegraFiscalCompraV5[]>([])
    const [sugestoesCusto, setSugestoesCusto] = useState<Map<string, SugestaoCustoMedioV5>>(new Map())
    const [mapeamentos, setMapeamentos] = useState<MarketplaceMapeamento[]>([])
    const [statusMapeamentos, setStatusMapeamentos] = useState<StatusCarregamento>('carregando')
    const [mensagemMapeamentos, setMensagemMapeamentos] = useState('Carregando mapeamentos marketplace...')

    // Filtros
    const [busca, setBusca] = useState('')
    const [canalFiltro, setCanalFiltro] = useState<string>('todos')
    const [buscaMapeamento, setBuscaMapeamento] = useState('')
    const [marketplaceFiltro, setMarketplaceFiltro] = useState<MarketplaceMapeamentoTipo | 'todos'>('todos')
    const [statusMapeamentoFiltro, setStatusMapeamentoFiltro] = useState<MarketplaceMapeamentoStatus | 'todos'>('ativo')

    // Aviso temporário de Edição
    const [showEditNotice, setShowEditNotice] = useState(false)

    // Estados do Simulador local
    const [simPrecoVenda, setSimPrecoVenda] = useState<string>('120.00')
    const [simCustoProduto, setSimCustoProduto] = useState<string>('45.00')
    const [simCustoPrep, setSimCustoPrep] = useState<string>('2.50')
    const [simCustoEmbalagem, setSimCustoEmbalagem] = useState<string>('1.00')
    const [simFreteInbound, setSimFreteInbound] = useState<string>('3.00')
    const [simComissaoPercentual, setSimComissaoPercentual] = useState<string>('15.00')
    const [simComissaoFixa, setSimComissaoFixa] = useState<string>('0.00')
    const [simTaxaLogistica, setSimTaxaLogistica] = useState<string>('19.50')
    const [simImpostoPercentual, setSimImpostoPercentual] = useState<string>('4.00')
    const [simAdsPercentual, setSimAdsPercentual] = useState<string>('8.00')
    const [simOutrosCustos, setSimOutrosCustos] = useState<string>('0.00')

    async function carregarDados() {
        try {
            setStatus('carregando')
            setMensagem('Carregando tabelas de configurações e snapshots gerenciais...')
            
            const [
                dadosConfig,
                dadosPrep,
                dadosCanais,
                dadosRegras,
                dadosSugestoes,
                dadosProdutos
            ] = await Promise.all([
                buscarConfiguracaoOperacaoV5(),
                buscarCustosPrepCenterV5(),
                buscarCanaisVendaV5(),
                buscarRegrasFiscaisCompraV5(),
                buscarSugestoesCustoMedioV5(),
                buscarProdutosBasePrecificacaoV5()
            ])

            setConfiguracao(dadosConfig)
            setCustosPrep(dadosPrep)
            setCanais(dadosCanais)
            setRegrasFiscais(dadosRegras)
            setProdutosPrecificados(dadosProdutos)

            // Criar mapa de sugestões de custo médio
            const mapaSugestoes = new Map<string, SugestaoCustoMedioV5>()
            for (const sug of dadosSugestoes) {
                mapaSugestoes.set(sug.sku, sug)
            }
            setSugestoesCusto(mapaSugestoes)

            // Configurar a alíquota padrão no simulador
            if (dadosConfig) {
                setSimImpostoPercentual(dadosConfig.aliquota_imposto_padrao_percentual.toString())
            }

            setStatus('sucesso')
            setMensagem('Dados gerenciais carregados com sucesso.')
        } catch (error) {
            setStatus('erro')
            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao carregar as configurações de custos.')
            }
        }
    }

    async function carregarMapeamentos() {
        try {
            setStatusMapeamentos('carregando')
            setMensagemMapeamentos('Carregando mapeamentos marketplace...')

            const dados = await listarMapeamentosMarketplace({
                marketplace: marketplaceFiltro === 'todos' ? undefined : marketplaceFiltro,
                status: statusMapeamentoFiltro,
                busca: buscaMapeamento
            })

            setMapeamentos(dados)
            setStatusMapeamentos('sucesso')
            setMensagemMapeamentos('Mapeamentos carregados com sucesso.')
        } catch (error) {
            setStatusMapeamentos('erro')
            setMapeamentos([])
            if (error instanceof Error) {
                setMensagemMapeamentos(`Erro ao carregar mapeamentos. Verifique permissoes/RLS: ${error.message}`)
            } else {
                setMensagemMapeamentos('Erro desconhecido ao carregar mapeamentos marketplace.')
            }
        }
    }

    useEffect(() => {
        carregarDados()
    }, [])

    useEffect(() => {
        if (abaAtiva === 'mapeamento') {
            carregarMapeamentos()
        }
    }, [abaAtiva, marketplaceFiltro, statusMapeamentoFiltro])

    // Filtragem reativa na Aba 1
    const produtosFiltrados = useMemo(() => {
        let lista = produtosPrecificados

        // Filtro por Canal de Venda
        if (canalFiltro !== 'todos') {
            lista = lista.filter((p) => p.canal_venda_id === canalFiltro)
        }

        // Filtro de busca textual
        if (busca.trim()) {
            const termo = busca.toLowerCase()
            lista = lista.filter(
                (p) =>
                    p.sku.toLowerCase().includes(termo) ||
                    p.produto_nome.toLowerCase().includes(termo)
            )
        }

        return lista
    }, [produtosPrecificados, canalFiltro, busca])

    const produtosPorId = useMemo(() => {
        const mapa = new Map<string, ProdutoPrecificacaoV5Item>()
        for (const produto of produtosPrecificados) {
            if (produto.produto_id && !mapa.has(produto.produto_id)) {
                mapa.set(produto.produto_id, produto)
            }
        }
        return mapa
    }, [produtosPrecificados])

    const canaisPorId = useMemo(() => {
        const mapa = new Map<string, CanalVendaV5>()
        for (const canal of canais) {
            mapa.set(canal.id, canal)
        }
        return mapa
    }, [canais])

    // Cálculo reativo do simulador em memória
    const simulacaoResultado = useMemo(() => {
        const params: ParamentrosSimulacaoV5 = {
            preco_venda: Number(simPrecoVenda || 0),
            custo_produto: Number(simCustoProduto || 0),
            custo_prep_center: Number(simCustoPrep || 0),
            custo_embalagem: Number(simCustoEmbalagem || 0),
            custo_frete_inbound: Number(simFreteInbound || 0),
            taxa_marketplace: Number(simComissaoFixa || 0),
            taxa_marketplace_percentual: Number(simComissaoPercentual || 0),
            taxa_logistica: Number(simTaxaLogistica || 0),
            taxa_ads_estimada: 0,
            taxa_ads_percentual: Number(simAdsPercentual || 0),
            imposto_estimado: 0,
            imposto_aliquota_percentual: Number(simImpostoPercentual || 0),
            outros_custos: Number(simOutrosCustos || 0)
        }

        return calcularSimulacaoMargemV5(params)
    }, [
        simPrecoVenda,
        simCustoProduto,
        simCustoPrep,
        simCustoEmbalagem,
        simFreteInbound,
        simComissaoPercentual,
        simComissaoFixa,
        simTaxaLogistica,
        simImpostoPercentual,
        simAdsPercentual,
        simOutrosCustos
    ])

    // Cores dos badges do simulador baseados na performance
    const corClasseResultado = useMemo(() => {
        const margem = simulacaoResultado.margem_liquida_percentual
        if (margem >= 20) return { texto: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900/40', tone: 'success' as const }
        if (margem >= 10) return { texto: 'text-yellow-400', bg: 'bg-yellow-950/20 border-yellow-900/40', tone: 'warning' as const }
        if (margem > 0) return { texto: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/40', tone: 'info' as const }
        return { texto: 'text-red-400', bg: 'bg-red-950/20 border-red-900/40', tone: 'danger' as const }
    }, [simulacaoResultado.margem_liquida_percentual])

    if (status === 'carregando') {
        return (
            <div className="mx-auto w-full max-w-full space-y-6">
                <PageHeader
                    tag="MÓDULO"
                    title="Custos & Margens"
                    description="Painel de análise de precificação gerencial, custos operacionais e margem líquida estimada."
                />
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-4 text-slate-300 font-medium">{mensagem}</p>
                </div>
            </div>
        )
    }

    if (status === 'erro') {
        return (
            <div className="mx-auto w-full max-w-full space-y-6">
                <PageHeader
                    tag="MÓDULO"
                    title="Custos & Margens"
                    description="Painel de análise de precificação gerencial, custos operacionais e margem líquida estimada."
                />
                <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-center">
                    <p className="text-lg font-semibold text-red-400">⚠️ Erro ao carregar precificação</p>
                    <p className="mt-2 text-slate-300 text-sm">{mensagem}</p>
                    <button
                        onClick={carregarDados}
                        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-full space-y-6">
            <PageHeader
                tag="MÓDULO"
                title="Custos & Margens"
                description="Painel de análise de precificação gerencial, custos operacionais e margem líquida estimada."
            />

            {/* Banner de Aviso Somente Leitura da Fase 5.2 */}
            <div className="rounded-xl border border-yellow-950 bg-yellow-950/20 p-3 text-xs text-yellow-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span>🛡️</span>
                    <strong>Modo Consulta & Simulação:</strong> Nesta fase, a tela exibe dados de custos cadastrados e permite simular margens sem gravação no banco de dados.
                </span>
                <button
                    onClick={carregarDados}
                    className="text-yellow-400 hover:text-yellow-200 transition-colors font-medium cursor-pointer bg-transparent border-0"
                >
                    🔄 Sincronizar
                </button>
            </div>

            {/* Abas de Navegação */}
            <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-px">
                <button
                    onClick={() => setAbaAtiva('custos')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'custos'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Custos por Produto
                </button>
                <button
                    onClick={() => setAbaAtiva('simulador')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'simulador'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Simulador de Precificação
                </button>
                <button
                    onClick={() => setAbaAtiva('canais')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'canais'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Custos por Canal
                </button>
                <button
                    onClick={() => setAbaAtiva('mapeamento')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'mapeamento'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Mapeamento Marketplace
                </button>
                <button
                    onClick={() => setAbaAtiva('parametros')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'parametros'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Regras Gerais
                </button>
            </div>

            {/* Conteúdo das Abas */}
            {abaAtiva === 'custos' && (
                <div className="space-y-4">
                    {showEditNotice && (
                        <div className="rounded-lg bg-indigo-950/60 border border-indigo-800 p-3 text-xs text-indigo-200 flex items-center justify-between transition-all duration-300">
                            <span>💡 A edição e o salvamento dos custos no banco de dados Supabase serão ativados na próxima fase (Fase 5.3).</span>
                            <button onClick={() => setShowEditNotice(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer ml-4">×</button>
                        </div>
                    )}

                    <AppCard>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-2xl">
                                <input
                                    type="text"
                                    placeholder="Buscar SKU ou Nome..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                                />
                                <select
                                    value={canalFiltro}
                                    onChange={(e) => setCanalFiltro(e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none min-w-[200px]"
                                >
                                    <option value="todos">Todos os canais de venda</option>
                                    {canais.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-xs text-slate-500 self-end md:self-center font-mono">
                                Total exibido: {produtosFiltrados.length} produto(s)
                            </span>
                        </div>

                        <DataTableContainer>
                            <table className="w-full min-w-[1200px] border-collapse text-left text-xs sm:text-sm">
                                <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                    <tr>
                                        <th className="px-3 py-3 font-medium sm:px-4">SKU</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                        <th className="px-3 py-3 font-medium sm:px-4">Canal de Venda</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Preço ERP</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Custo ERP</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Custo Médio NF</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Preço Praticado</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Comissões/Taxas</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Logística/Ads/Prep</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Lucro Est.</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-right">Margem Est.</th>
                                        <th className="px-3 py-3 font-medium sm:px-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900">
                                    {produtosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                                                Nenhum produto correspondente aos critérios de busca foi localizado.
                                            </td>
                                        </tr>
                                    ) : (
                                        produtosFiltrados.map((item) => {
                                            const canalObj = canais.find(c => c.id === item.canal_venda_id)
                                            const canalNome = canalObj?.nome ?? '-'
                                            
                                            // Pega a sugestão de custo médio das notas se disponível
                                            const sugInfo = sugestoesCusto.get(item.sku)
                                            const custoNF = sugInfo?.custo_medio_unitario

                                            // Lucro e margem estimados com base no preço de venda cadastrado ou fallback do preço ERP
                                            const precoPraticado = item.preco_venda ?? item.preco_erp_sugerido ?? 0
                                            const custoPraticado = item.custo_produto ?? item.custo_erp_sugerido ?? custoNF ?? 0

                                            // Soma de outras taxas gerenciais se houver precificação salva
                                            const comissao = item.taxa_marketplace ?? 0
                                            const outrosCustosLog = (item.taxa_logistica ?? 0) + (item.custo_prep_center ?? 0) + (item.custo_embalagem ?? 0) + (item.custo_frete_inbound ?? 0) + (item.taxa_ads_estimada ?? 0) + (item.imposto_estimado ?? 0) + (item.outros_custos ?? 0)

                                            const lucro = precoPraticado > 0 ? (precoPraticado - custoPraticado - comissao - outrosCustosLog) : 0
                                            const margem = precoPraticado > 0 ? (lucro / precoPraticado * 100) : 0

                                            const margemColorClass = 
                                                margem >= 20 
                                                    ? 'text-emerald-300 font-semibold' 
                                                    : margem >= 10 
                                                        ? 'text-yellow-300 font-semibold' 
                                                        : margem > 0 
                                                            ? 'text-orange-300' 
                                                            : 'text-red-400 font-semibold'

                                            return (
                                                <tr key={`${item.sku}-${item.canal_venda_id ?? 'sem_canal'}`} className="hover:bg-slate-800/40">
                                                    <td className="px-3 py-3 font-mono text-slate-300 sm:px-4 select-all">
                                                        {item.sku}
                                                    </td>
                                                    <td className="px-3 py-3 font-medium text-slate-100 sm:px-4 max-w-[240px] truncate" title={item.produto_nome}>
                                                        {item.produto_nome}
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-300 sm:px-4 font-medium">
                                                        {canalNome}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-slate-400 sm:px-4 font-mono">
                                                        {formatarMoeda(item.preco_erp_sugerido)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-slate-400 sm:px-4 font-mono">
                                                        {formatarMoeda(item.custo_erp_sugerido)}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-indigo-300 sm:px-4 font-mono" title={custoNF ? `Calculado de ${sugInfo?.total_notas_entrada} NFs` : 'Sem NFs de entrada vinculadas'}>
                                                        {custoNF ? formatarMoeda(custoNF) : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-slate-200 sm:px-4 font-semibold font-mono">
                                                        {item.preco_venda != null ? formatarMoeda(item.preco_venda) : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-slate-300 sm:px-4 font-mono">
                                                        {item.taxa_marketplace != null ? formatarMoeda(item.taxa_marketplace) : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-slate-300 sm:px-4 font-mono">
                                                        {item.possui_custos_salvos ? formatarMoeda(outrosCustosLog) : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-right text-slate-200 sm:px-4 font-semibold font-mono">
                                                        {item.possui_custos_salvos ? formatarMoeda(lucro) : '-'}
                                                    </td>
                                                    <td className={`px-3 py-3 text-right sm:px-4 font-mono ${item.possui_custos_salvos ? margemColorClass : 'text-slate-500'}`}>
                                                        {item.possui_custos_salvos ? formatarPercentual(margem) : '-'}
                                                    </td>
                                                    <td className="px-3 py-3 text-center sm:px-4">
                                                        <button
                                                            onClick={() => setShowEditNotice(true)}
                                                            className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer font-medium"
                                                        >
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>
                </div>
            )}

            {abaAtiva === 'simulador' && (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Painel de Parâmetros / Inputs */}
                    <div className="lg:col-span-2 space-y-4">
                        <AppCard>
                            <h3 className="text-base font-semibold mb-4 text-indigo-400">Custos Físicos de Aquisição</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Preço de Venda Gerencial (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simPrecoVenda}
                                        onChange={(e) => setSimPrecoVenda(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Custo de Aquisição do Produto (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simCustoProduto}
                                        onChange={(e) => setSimCustoProduto(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Custo Prep Center (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simCustoPrep}
                                        onChange={(e) => setSimCustoPrep(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Custo de Embalagem (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simCustoEmbalagem}
                                        onChange={(e) => setSimCustoEmbalagem(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Custo Frete Inbound / Envio FBA (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simFreteInbound}
                                        onChange={(e) => setSimFreteInbound(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Outros Custos Extras (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simOutrosCustos}
                                        onChange={(e) => setSimOutrosCustos(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </AppCard>

                        <AppCard>
                            <h3 className="text-base font-semibold mb-4 text-indigo-400">Custos do Canal, Impostos e Ads</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Comissão do Marketplace (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={simComissaoPercentual}
                                        onChange={(e) => setSimComissaoPercentual(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Taxa Fixa do Canal (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simComissaoFixa}
                                        onChange={(e) => setSimComissaoFixa(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Frete de Saída / Logística FBA (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={simTaxaLogistica}
                                        onChange={(e) => setSimTaxaLogistica(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Alíquota de Imposto Estimado (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={simImpostoPercentual}
                                        onChange={(e) => setSimImpostoPercentual(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Taxa de Ads Estimada (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={simAdsPercentual}
                                        onChange={(e) => setSimAdsPercentual(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </AppCard>
                    </div>

                    {/* Painel de Resultados do Simulador */}
                    <div className="space-y-4">
                        <section className={`rounded-2xl border p-5 shadow-lg ${corClasseResultado.bg} flex flex-col justify-between h-full min-h-[300px]`}>
                            <div>
                                <h3 className="text-base font-semibold text-slate-300 mb-4">Métricas de Performance Simula</h3>
                                
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-xs text-slate-400">Lucro Líquido Unitário</p>
                                        <p className={`text-3xl font-bold mt-1 ${corClasseResultado.texto}`}>
                                            {formatarMoeda(simulacaoResultado.lucro_liquido)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-400">Margem Líquida</p>
                                            <p className="text-lg font-semibold text-slate-200 mt-1">
                                                {formatarPercentual(simulacaoResultado.margem_liquida_percentual)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400">ROI Estimado</p>
                                            <p className="text-lg font-semibold text-slate-200 mt-1">
                                                {formatarPercentual(simulacaoResultado.roi_percentual)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-800/60 text-[10px] text-slate-500 leading-relaxed">
                                * O ROI é calculado dividindo o lucro líquido gerencial pelo Custo Físico Total de Aquisição (Produto + Embalagem + Prep + Frete Inbound).
                            </div>
                        </section>

                        <AppCard>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Resumo dos Custos da Venda</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Preço de Venda</span>
                                    <span className="text-slate-200 font-semibold font-mono">{formatarMoeda(simulacaoResultado.preco_venda)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Custo de Aquisição (Físico)</span>
                                    <span className="text-slate-300 font-mono">{formatarMoeda(simulacaoResultado.custo_total_aquisicao)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Comissão Marketplace</span>
                                    <span className="text-slate-300 font-mono">{formatarMoeda(simulacaoResultado.taxa_marketplace_calculada)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Frete/Taxa Logística</span>
                                    <span className="text-slate-300 font-mono">{formatarMoeda(Number(simTaxaLogistica))}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Imposto ({simImpostoPercentual}%)</span>
                                    <span className="text-slate-300 font-mono">{formatarMoeda(simulacaoResultado.imposto_calculado)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Ads ({simAdsPercentual}%)</span>
                                    <span className="text-slate-300 font-mono">{formatarMoeda(simulacaoResultado.taxa_ads_calculada)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-800/40">
                                    <span className="text-slate-400">Outros Custos</span>
                                    <span className="text-slate-300 font-mono">{formatarMoeda(Number(simOutrosCustos))}</span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-100 font-semibold pt-2">
                                    <span>Custo Total de Operação</span>
                                    <span className="font-mono">{formatarMoeda(simulacaoResultado.custos_totais)}</span>
                                </div>
                            </div>
                        </AppCard>
                    </div>
                </div>
            )}

            {abaAtiva === 'canais' && (
                <div className="space-y-6">
                    {/* Alerta de Governança Gerencial */}
                    <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4 text-xs sm:text-sm text-blue-300">
                        <h4 className="font-semibold flex items-center gap-2 mb-1 text-blue-200">
                            <span>ℹ️</span> Área de Referência e Estrutura Gerencial de Custos
                        </h4>
                        <p className="leading-relaxed text-slate-300">
                            Esta área reúne os parâmetros e estimativas de tarifas e comissões por canal de venda. Em fases futuras, as tarifas de comissão e logística da <strong>Amazon</strong> e do <strong>Mercado Livre</strong> serão calculadas automaticamente via APIs oficiais (Amazon SP-API Product Fees e API Mercado Livre Fees).
                        </p>
                        <p className="mt-2 leading-relaxed text-yellow-400 font-medium">
                            ⚠️ Nesta fase (Fase 5.3B-2), nenhuma gravação está ativada e os valores aqui contidos são puramente referenciais e demonstrativos.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* CARD Prep Center */}
                        <AppCard>
                            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                                <h3 className="text-base font-semibold text-indigo-400">Logística & Prep Center</h3>
                                <StatusBadge tone="success">Referência Ativa</StatusBadge>
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b border-slate-800/40 py-1.5">
                                        <span className="text-slate-400">Modalidade FBA (Amazon)</span>
                                        <span className="text-slate-200 font-semibold font-mono">R$ 2,00 / unidade</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1.5">
                                        <span className="text-slate-400">Modalidade DBA / FBM / Kits</span>
                                        <span className="text-slate-200 font-semibold font-mono">R$ 3,00 / unidade</span>
                                    </div>
                                </div>
                                <div className="bg-slate-950/40 border border-slate-800/50 p-3 rounded-lg text-xs space-y-2">
                                    <div>
                                        <strong className="text-slate-400">Origem:</strong>{' '}
                                        <span className="text-slate-300">Configuração interna da conta Primely Store</span>
                                    </div>
                                    <div>
                                        <strong className="text-slate-400">Observação:</strong>{' '}
                                        <span className="text-slate-400 italic">Valores sugeridos com base nos custos operacionais informados pelo gestor, sujeitos a alteração futura nas tabelas locais.</span>
                                    </div>
                                </div>
                            </div>
                        </AppCard>

                        {/* CARD Amazon */}
                        <AppCard>
                            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                                <h3 className="text-base font-semibold text-indigo-400">Amazon SP-API</h3>
                                <StatusBadge tone="warning">Integração Futura</StatusBadge>
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Comissão por Categoria</span>
                                        <span className="text-slate-300 italic">Dinâmica (8% a 15%)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Logística FBA</span>
                                        <span className="text-slate-300 italic">Por Peso / Faixa de Peso</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Tarifa de Coleta</span>
                                        <span className="text-slate-300 italic">Aplicável por envio</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Taxa de Parcelamento Sem Juros</span>
                                        <span className="text-slate-300 font-semibold font-mono">1,50%</span>
                                    </div>
                                </div>
                                <div className="bg-slate-950/40 border border-slate-800/50 p-3 rounded-lg text-xs space-y-2">
                                    <div>
                                        <strong className="text-slate-400">Origem Futura Preferencial:</strong>{' '}
                                        <span className="text-indigo-300 font-medium">Amazon SP-API Product Fees API</span>
                                    </div>
                                    <div>
                                        <strong className="text-slate-400">Origem Atual:</strong>{' '}
                                        <span className="text-slate-400">Estimativas manuais planas por SKU/canal na precificação gerencial</span>
                                    </div>
                                </div>
                            </div>
                        </AppCard>

                        {/* CARD Mercado Livre */}
                        <AppCard>
                            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                                <h3 className="text-base font-semibold text-indigo-400">Mercado Livre</h3>
                                <StatusBadge tone="warning">Integração Futura</StatusBadge>
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Logística Full ML</span>
                                        <span className="text-slate-300 italic">Varia por peso, cubagem e reputação</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Logística Flex / Envio Rápido</span>
                                        <span className="text-slate-300 italic">Taxa de entrega local</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Faixa de Frete Grátis</span>
                                        <span className="text-slate-300 italic">Obrigatório a partir de R$ 79,00</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Comissão (Clássico / Premium)</span>
                                        <span className="text-slate-300 italic">10% a 16.5% + Taxa fixa R$ 5,50</span>
                                    </div>
                                </div>
                                <div className="bg-slate-950/40 border border-slate-800/50 p-3 rounded-lg text-xs space-y-2">
                                    <div>
                                        <strong className="text-slate-400">Origem Futura Preferencial:</strong>{' '}
                                        <span className="text-indigo-300 font-medium">API Mercado Livre fees/listing prices</span>
                                    </div>
                                    <div>
                                        <strong className="text-slate-400">Origem Atual:</strong>{' '}
                                        <span className="text-slate-400">Estimativas manuais planas por SKU/canal na precificação gerencial</span>
                                    </div>
                                </div>
                            </div>
                        </AppCard>

                        {/* CARD Outros Canais */}
                        <AppCard>
                            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                                <h3 className="text-base font-semibold text-indigo-400">Outros Canais & Manual</h3>
                                <StatusBadge tone="muted">Parametrização Futura</StatusBadge>
                            </div>
                            <div className="space-y-4 text-xs sm:text-sm">
                                <div className="space-y-2">
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Shopee</span>
                                        <span className="text-slate-400 italic">Comissão fixa 18%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Venda Manual / Canal Físico</span>
                                        <span className="text-slate-400 italic">Sem comissões de terceiros</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800/40 py-1">
                                        <span className="text-slate-400">Novos Marketplaces</span>
                                        <span className="text-slate-400 italic">Mapeamento dinâmico futuro</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 italic mt-2 leading-relaxed">
                                    O Primely Store prevê flexibilidade para expansão de novos marketplaces sob a mesma base analítica de conciliação de custos fiscais e operacionais.
                                </p>
                            </div>
                        </AppCard>
                    </div>
                </div>
            )}

            {abaAtiva === 'mapeamento' && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4 text-xs sm:text-sm text-blue-300">
                        <h4 className="font-semibold mb-1 text-blue-200">Mapeamento gerencial para cotações futuras</h4>
                        <p className="leading-relaxed">
                            Esta aba lista os vínculos entre produto, canal, marketplace e contexto logístico que serão usados futuramente para consultar taxas por API. Nesta fase, não há criação, edição, inativação, consulta de API ou atualização de precificação.
                        </p>
                    </div>

                    <AppCard>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="flex flex-col gap-1.5 text-xs text-slate-400">
                                    Marketplace
                                    <select
                                        value={marketplaceFiltro}
                                        onChange={(event) => setMarketplaceFiltro(event.target.value as MarketplaceMapeamentoTipo | 'todos')}
                                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="todos">Todos</option>
                                        <option value="amazon">Amazon</option>
                                        <option value="mercado_livre">Mercado Livre</option>
                                        <option value="shopee">Shopee</option>
                                        <option value="venda_manual">Venda Manual</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5 text-xs text-slate-400">
                                    Status
                                    <select
                                        value={statusMapeamentoFiltro}
                                        onChange={(event) => setStatusMapeamentoFiltro(event.target.value as MarketplaceMapeamentoStatus | 'todos')}
                                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                                    >
                                        <option value="ativo">Ativos</option>
                                        <option value="inativo">Inativos</option>
                                        <option value="todos">Todos</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5 text-xs text-slate-400 sm:col-span-2">
                                    Busca
                                    <input
                                        type="text"
                                        value={buscaMapeamento}
                                        onChange={(event) => setBuscaMapeamento(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') carregarMapeamentos()
                                        }}
                                        placeholder="Buscar por seller_sku, ASIN, item_id ou observações"
                                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                                <button
                                    onClick={carregarMapeamentos}
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-indigo-500 hover:text-white"
                                >
                                    Buscar
                                </button>
                                <button
                                    disabled
                                    title="Criação de mapeamentos será habilitada em fase futura."
                                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-500 opacity-70"
                                >
                                    Novo mapeamento
                                </button>
                            </div>
                        </div>
                    </AppCard>

                    {statusMapeamentos === 'carregando' && (
                        <AppCard>
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                                <p className="mt-4 text-sm font-medium text-slate-300">{mensagemMapeamentos}</p>
                            </div>
                        </AppCard>
                    )}

                    {statusMapeamentos === 'erro' && (
                        <AppCard>
                            <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
                                <p className="font-semibold">Erro ao carregar mapeamentos</p>
                                <p className="mt-2 text-xs leading-relaxed text-red-100/80">{mensagemMapeamentos}</p>
                            </div>
                        </AppCard>
                    )}

                    {statusMapeamentos === 'sucesso' && (
                        <AppCard>
                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-indigo-400">Mapeamentos cadastrados</h3>
                                    <p className="mt-1 text-xs text-slate-500">Fonte: tabela produto_canal_marketplace_mapeamento.</p>
                                </div>
                                <span className="w-fit rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                    {mapeamentos.length} registro(s)
                                </span>
                            </div>

                            {mapeamentos.length === 0 ? (
                                <div className="rounded-lg border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-400">
                                    Nenhum mapeamento encontrado para os filtros selecionados.
                                </div>
                            ) : (
                                <DataTableContainer>
                                    <table className="w-full min-w-[1500px] border-collapse text-left text-xs sm:text-sm">
                                        <thead className={`${stickyTableHeadClassName} text-slate-400`}>
                                            <tr>
                                                <th className="px-3 py-3 font-medium sm:px-4">Produto</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Canal</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Marketplace</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Seller SKU</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">ASIN</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Item ID</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Listing</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Logística</th>
                                                <th className="px-3 py-3 font-medium sm:px-4 text-center">Override</th>
                                                <th className="px-3 py-3 font-medium sm:px-4 text-right">Cache</th>
                                                <th className="px-3 py-3 font-medium sm:px-4 text-center">Status</th>
                                                <th className="px-3 py-3 font-medium sm:px-4">Atualizado em</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 bg-slate-900">
                                            {mapeamentos.map((item) => {
                                                const produto = produtosPorId.get(item.produto_id)
                                                const canal = canaisPorId.get(item.canal_venda_id)
                                                const produtoLabel = produto
                                                    ? `${produto.sku} - ${produto.produto_nome}`
                                                    : item.produto_id
                                                const canalLabel = canal
                                                    ? `${canal.nome} (${canal.tipo})`
                                                    : item.canal_venda_id

                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-800/60">
                                                        <td className="px-3 py-3 sm:px-4">
                                                            <span className="line-clamp-2 text-slate-100">{produtoLabel}</span>
                                                        </td>
                                                        <td className="px-3 py-3 sm:px-4 text-slate-300">{canalLabel}</td>
                                                        <td className="px-3 py-3 sm:px-4 font-mono text-slate-200">{item.marketplace}</td>
                                                        <td className="px-3 py-3 sm:px-4 font-mono text-slate-300">{item.seller_sku ?? '-'}</td>
                                                        <td className="px-3 py-3 sm:px-4 font-mono text-slate-300">{item.asin ?? '-'}</td>
                                                        <td className="px-3 py-3 sm:px-4 font-mono text-slate-300">{item.item_id ?? '-'}</td>
                                                        <td className="px-3 py-3 sm:px-4 font-mono text-slate-300">{item.listing_type_id ?? '-'}</td>
                                                        <td className="px-3 py-3 sm:px-4 text-slate-300">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span>{item.logistic_type ?? '-'}</span>
                                                                <span className="text-[11px] text-slate-500">{item.shipping_mode ?? '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 sm:px-4 text-center">
                                                            <StatusBadge tone={item.manual_override ? 'warning' : 'muted'}>
                                                                {item.manual_override ? 'Manual' : 'Não'}
                                                            </StatusBadge>
                                                        </td>
                                                        <td className="px-3 py-3 sm:px-4 text-right font-mono text-slate-300">
                                                            {item.validade_cache_horas}h
                                                        </td>
                                                        <td className="px-3 py-3 sm:px-4 text-center">
                                                            <StatusBadge tone={item.status === 'ativo' ? 'success' : 'muted'}>
                                                                {item.status}
                                                            </StatusBadge>
                                                        </td>
                                                        <td className="px-3 py-3 sm:px-4 text-slate-400">
                                                            {formatarDataHora(item.updated_at)}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </DataTableContainer>
                            )}
                        </AppCard>
                    )}
                </div>
            )}

            {abaAtiva === 'parametros' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Regras Operacionais */}
                    <AppCard>
                        <h3 className="text-base font-semibold mb-4 text-indigo-400">Configurações da Operação</h3>
                        {configuracao ? (
                            <div className="space-y-4 text-xs sm:text-sm">
                                <div>
                                    <p className="text-slate-400 text-xs">Nome da Operação</p>
                                    <p className="text-slate-200 mt-1 font-medium">{configuracao.nome_operacao}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-400 text-xs">Regime Tributário</p>
                                        <p className="text-slate-200 mt-1 font-semibold font-mono uppercase">{configuracao.regime_tributario.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs">Alíquota Base de Imposto</p>
                                        <p className="text-emerald-300 mt-1 font-semibold">{formatarPercentual(configuracao.aliquota_imposto_padrao_percentual)}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs">Descrição da Configuração</p>
                                    <p className="text-slate-300 mt-1 leading-relaxed text-xs italic">{configuracao.observacoes ?? 'Sem observações cadastradas'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm">Nenhuma configuração de operação encontrada.</p>
                        )}
                    </AppCard>

                    {/* Canais de Venda e Taxas Recomendadas */}
                    <AppCard>
                        <h3 className="text-base font-semibold mb-4 text-indigo-400 font-sans">Canais de Venda Ativos</h3>
                        <DataTableContainer>
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-800">
                                        <th className="py-2">Canal</th>
                                        <th className="py-2">Logística</th>
                                        <th className="py-2 text-right">Comissão Padrão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40 text-slate-300 font-sans">
                                    {canais.map((c) => (
                                        <tr key={c.id}>
                                            <td className="py-2 font-medium text-slate-100">{c.nome}</td>
                                            <td className="py-2">{c.modalidade_logistica.replace('_', ' ')}</td>
                                            <td className="py-2 text-right font-semibold text-slate-200">{formatarPercentual(c.comissao_padrao_sugerida)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </DataTableContainer>
                    </AppCard>

                    {/* Regras Fiscais de Compra */}
                    <AppCard>
                        <h3 className="text-base font-semibold mb-4 text-indigo-400">Regras Fiscais de Entrada (CMV)</h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {regrasFiscais.map((r) => (
                                <div key={r.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-200">{r.descricao}</span>
                                        <StatusBadge tone={r.entra_no_custo ? 'success' : 'muted'}>
                                            {r.entra_no_custo ? 'Soma ao CMV' : 'Isento no custo'}
                                        </StatusBadge>
                                    </div>
                                    <p className="text-slate-400 mt-2 leading-relaxed italic">{r.observacoes}</p>
                                    {r.cfops_aplicaveis && r.cfops_aplicaveis.length > 0 && (
                                        <div className="mt-2 text-[10px] text-slate-500 font-mono">
                                            CFOPs: {r.cfops_aplicaveis.join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </AppCard>

                    {/* Custos de Prep Center */}
                    <AppCard>
                        <h3 className="text-base font-semibold mb-4 text-indigo-400">Tabela de Taxas do Prep Center</h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {custosPrep.map((cp) => (
                                <div key={cp.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-slate-200">{cp.nome_regra}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">LOGÍSTICA: {cp.tipo_operacao}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono mt-2">
                                        <div>Unitário: <strong className="text-slate-100">{formatarMoeda(cp.custo_unitario)}</strong></div>
                                        <div>Fixo: <strong className="text-slate-100">{formatarMoeda(cp.custo_fixo)}</strong></div>
                                        <div>Embalagem: <strong className="text-slate-100">{formatarMoeda(cp.custo_embalagem)}</strong></div>
                                        <div>Extra: <strong className="text-slate-100">{formatarMoeda(cp.custo_extra)}</strong></div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-normal italic mt-2">{cp.observacoes}</p>
                                </div>
                            ))}
                        </div>
                    </AppCard>
                </div>
            )}

            {/* Banner de Governança e Metodologia de Margem */}
            <footer className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
                <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">ℹ️</span>
                    <div>
                        <h4 className="font-semibold text-slate-300">Nota de Governança & Metodologia Gerencial</h4>
                        <p className="mt-1 leading-relaxed">
                            Esta tela atua estritamente como um <strong>painel de visualização e simulação gerencial de custos e comissões por canal (somente consulta)</strong>. 
                            Os cálculos de margem líquida e lucro estimados servem para fins estratégicos e apoios de compra e venda. Eles não substituem a apuração fiscal oficial, notas fiscais registradas na contabilidade ou relatórios contábeis oficiais do ERP (Olist/Tiny).
                        </p>
                        <p className="mt-1 leading-relaxed font-semibold text-yellow-400">
                            Nesta fase (Fase 5.3B-2 - Replanejamento), nenhuma modificação física ou gravação no banco de dados de precificação está habilitada.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
