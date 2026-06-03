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
    AppCard,
    DataTableContainer,
    PageHeader,
    StatusBadge,
    stickyTableHeadClassName
} from '../components/ui'

type StatusCarregamento = 'carregando' | 'sucesso' | 'erro'

function formatarMoeda(valor?: number | string | null) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(valor ?? 0))
}

function formatarPercentual(valor?: number | string | null) {
    return `${Number(valor ?? 0).toFixed(2)}%`
}

export function CustosMargem() {
    const [status, setStatus] = useState<StatusCarregamento>('carregando')
    const [mensagem, setMensagem] = useState('Carregando dados de custos e precificação...')
    
    // Abas: 'custos' | 'simulador' | 'parametros'
    const [abaAtiva, setAbaAtiva] = useState<'custos' | 'simulador' | 'parametros'>('custos')
    
    // Estados do Banco (Somente Leitura)
    const [produtosPrecificados, setProdutosPrecificados] = useState<ProdutoPrecificacaoV5Item[]>([])
    const [configuracao, setConfiguracao] = useState<ConfiguracaoOperacaoV5 | null>(null)
    const [custosPrep, setCustosPrep] = useState<CustoPrepCenterV5[]>([])
    const [canais, setCanais] = useState<CanalVendaV5[]>([])
    const [regrasFiscais, setRegrasFiscais] = useState<RegraFiscalCompraV5[]>([])
    const [sugestoesCusto, setSugestoesCusto] = useState<Map<string, SugestaoCustoMedioV5>>(new Map())

    // Filtros
    const [busca, setBusca] = useState('')
    const [canalFiltro, setCanalFiltro] = useState<string>('todos')

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

    useEffect(() => {
        carregarDados()
    }, [])

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
                    onClick={() => setAbaAtiva('parametros')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        abaAtiva === 'parametros'
                            ? 'border-indigo-500 text-indigo-400 font-semibold'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                >
                    Regras e Parâmetros
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
                            Esta tela atua estritamente como um <strong>painel de visualização e simulação gerencial de custos e markup (somente consulta)</strong>. 
                            Os cálculos de margem líquida e lucro estimados servem para fins estratégicos e apoios de compra e venda. Eles não substituem a apuração fiscal oficial, notas fiscais registradas na contabilidade ou relatórios contábeis oficiais do ERP (Olist/Tiny).
                        </p>
                        <p className="mt-1 leading-relaxed font-semibold text-yellow-400">
                            Nesta fase (Fase 5.2), nenhuma modificação física ou gravação no banco de dados de precificação está habilitada.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
