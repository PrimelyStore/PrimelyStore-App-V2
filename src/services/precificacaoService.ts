import { supabase } from '../lib/supabase'

// ─── MÓDULO 5: TIPOS TYPESCRIPT GERENCIAIS V5 ─────────────────────────────────

export type ProdutoPrecificacaoV5Item = {
    sku: string
    produto_id: string // UUID da tabela public.produtos (chave estrangeira para precificação)
    produto_nome: string
    gtin: string | null
    unidade: string | null
    
    // Dados da tabela produtos_precificacao (se houver cadastro)
    id_precificacao: string | null
    canal_venda_id: string | null
    preco_venda: number | null
    custo_produto: number | null
    custo_prep_center: number | null
    custo_embalagem: number | null
    custo_frete_inbound: number | null
    taxa_marketplace: number | null
    taxa_logistica: number | null
    taxa_ads_estimada: number | null
    imposto_estimado: number | null
    outros_custos: number | null
    margem_desejada_percentual: number | null
    roi_desejado_percentual: number | null
    
    possui_custos_salvos: boolean
    
    // Metadados / Sugestões originais do ERP Olist
    preco_erp_sugerido: number | null
    custo_erp_sugerido: number | null
}

export type ConfiguracaoOperacaoV5 = {
    id: string
    nome_operacao: string
    regime_tributario: string
    aliquota_imposto_padrao_percentual: number
    prep_center_padrao_id: string | null
    canal_venda_padrao_id: string | null
    moeda_padrao: string
    observacoes: string | null
    status: string
}

export type CustoPrepCenterV5 = {
    id: string
    local_estoque_id: string
    nome_regra: string
    tipo_operacao: string
    quantidade_minima: number | null
    quantidade_maxima: number | null
    custo_unitario: number
    custo_fixo: number
    custo_embalagem: number
    custo_extra: number
    observacoes: string | null
    status: string
    data_inicio_vigencia: string
    data_fim_vigencia: string | null
}

export type CanalVendaV5 = {
    id: string
    nome: string
    tipo: string
    modalidade_logistica: string
    codigo_externo: string
    marketplace_id: string | null
    observacoes: string | null
    status: string
    comissao_padrao_sugerida: number // Sugestão gerencial injetada no frontend
}

export type RegraFiscalCompraV5 = {
    id: string
    codigo_regra: string
    descricao: string
    entra_no_custo: boolean
    origem_valor: string
    cfops_aplicaveis: string[] | null
    ativo: boolean
    observacoes: string | null
}

export type SugestaoCustoMedioV5 = {
    sku: string
    custo_medio_unitario: number | null
    total_notas_entrada: number
}

export type ParamentrosSimulacaoV5 = {
    preco_venda: number
    custo_produto: number
    custo_prep_center: number
    custo_embalagem: number
    custo_frete_inbound: number
    taxa_marketplace: number
    taxa_marketplace_percentual?: number
    taxa_logistica: number
    taxa_ads_estimada: number
    taxa_ads_percentual?: number
    imposto_estimado: number
    imposto_aliquota_percentual?: number
    outros_custos: number
}

export type SimulacaoMargemV5Resultado = {
    preco_venda: number
    custo_total_aquisicao: number // custo_produto + prep_center + embalagem + frete_inbound
    taxa_marketplace_calculada: number
    taxa_ads_calculada: number
    imposto_calculado: number
    custos_totais: number
    lucro_liquido: number
    margem_liquida_percentual: number
    roi_percentual: number
}

// ─── MÓDULO 5: FUNÇÕES SOMENTE LEITURA E SIMULAÇÃO ────────────────────────────

/**
 * Busca os produtos gerenciais cruzados com as precificações cadastradas na tabela produtos_precificacao.
 * Permite filtrar por um canal_venda_id específico.
 */
export async function buscarProdutosBasePrecificacaoV5(
    canalVendaId?: string
): Promise<ProdutoPrecificacaoV5Item[]> {
    // 1. Buscar mapeamento de produtos internos (id -> sku) para relacionar com a tabela de precificação
    const { data: produtosInternos, error: errorInternos } = await supabase
        .from('produtos')
        .select('id, sku')

    if (errorInternos) {
        throw new Error(`Erro ao buscar produtos internos para precificação: ${errorInternos.message}`)
    }

    const mapaSkuParaId = new Map<string, string>()
    for (const p of produtosInternos || []) {
        if (p.sku) mapaSkuParaId.set(p.sku, p.id)
    }

    // 2. Buscar base de produtos gerenciais a partir do snapshot oficial da Olist
    const { data: snapshots, error: errorSnapshots } = await supabase
        .from('olist_produtos_snapshot')
        .select('sku, descricao, gtin, unidade, preco, preco_custo')

    if (errorSnapshots) {
        throw new Error(`Erro ao buscar snapshots de produtos Olist: ${errorSnapshots.message}`)
    }

    // 3. Buscar precificações gerenciais salvas
    let queryPrecificacao = supabase.from('produtos_precificacao').select('*')
    if (canalVendaId) {
        queryPrecificacao = queryPrecificacao.eq('canal_venda_id', canalVendaId)
    }
    const { data: precificacoes, error: errorPrecificacao } = await queryPrecificacao

    if (errorPrecificacao) {
        throw new Error(`Erro ao buscar precificações de produtos: ${errorPrecificacao.message}`)
    }

    // Mapear precificações para cruzamento performático
    const mapaPrecificacao = new Map<string, any>()
    for (const prec of precificacoes || []) {
        const chave = canalVendaId ? prec.produto_id : `${prec.produto_id}_${prec.canal_venda_id}`
        mapaPrecificacao.set(chave, prec)
    }

    const resultado: ProdutoPrecificacaoV5Item[] = []

    for (const snap of snapshots || []) {
        const sku = snap.sku
        if (!sku) continue

        const idInterno = mapaSkuParaId.get(sku) ?? ''

        if (canalVendaId) {
            const prec = idInterno ? mapaPrecificacao.get(idInterno) : null

            resultado.push({
                sku,
                produto_id: idInterno,
                produto_nome: snap.descricao || 'Produto sem nome',
                gtin: snap.gtin || null,
                unidade: snap.unidade || null,
                
                id_precificacao: prec?.id || null,
                canal_venda_id: canalVendaId,
                preco_venda: prec?.preco_venda != null ? Number(prec.preco_venda) : null,
                custo_produto: prec?.custo_produto != null ? Number(prec.custo_produto) : null,
                custo_prep_center: prec?.custo_prep_center != null ? Number(prec.custo_prep_center) : null,
                custo_embalagem: prec?.custo_embalagem != null ? Number(prec.custo_embalagem) : null,
                custo_frete_inbound: prec?.custo_frete_inbound != null ? Number(prec.custo_frete_inbound) : null,
                taxa_marketplace: prec?.taxa_marketplace != null ? Number(prec.taxa_marketplace) : null,
                taxa_logistica: prec?.taxa_logistica != null ? Number(prec.taxa_logistica) : null,
                taxa_ads_estimada: prec?.taxa_ads_estimada != null ? Number(prec.taxa_ads_estimada) : null,
                imposto_estimado: prec?.imposto_estimado != null ? Number(prec.imposto_estimado) : null,
                outros_custos: prec?.outros_custos != null ? Number(prec.outros_custos) : null,
                margem_desejada_percentual: prec?.margem_desejada_percentual != null ? Number(prec.margem_desejada_percentual) : null,
                roi_desejado_percentual: prec?.roi_desejado_percentual != null ? Number(prec.roi_desejado_percentual) : null,
                
                possui_custos_salvos: prec != null,
                preco_erp_sugerido: snap.preco != null ? Number(snap.preco) : null,
                custo_erp_sugerido: snap.preco_custo != null ? Number(snap.preco_custo) : null
            })
        } else {
            const precsDoProduto = (precificacoes || []).filter(p => p.produto_id === idInterno)

            if (precsDoProduto.length === 0) {
                resultado.push({
                    sku,
                    produto_id: idInterno,
                    produto_nome: snap.descricao || 'Produto sem nome',
                    gtin: snap.gtin || null,
                    unidade: snap.unidade || null,
                    
                    id_precificacao: null,
                    canal_venda_id: null,
                    preco_venda: null,
                    custo_produto: null,
                    custo_prep_center: null,
                    custo_embalagem: null,
                    custo_frete_inbound: null,
                    taxa_marketplace: null,
                    taxa_logistica: null,
                    taxa_ads_estimada: null,
                    imposto_estimado: null,
                    outros_custos: null,
                    margem_desejada_percentual: null,
                    roi_desejado_percentual: null,
                    
                    possui_custos_salvos: false,
                    preco_erp_sugerido: snap.preco != null ? Number(snap.preco) : null,
                    custo_erp_sugerido: snap.preco_custo != null ? Number(snap.preco_custo) : null
                })
            } else {
                for (const prec of precsDoProduto) {
                    resultado.push({
                        sku,
                        produto_id: idInterno,
                        produto_nome: snap.descricao || 'Produto sem nome',
                        gtin: snap.gtin || null,
                        unidade: snap.unidade || null,
                        
                        id_precificacao: prec.id,
                        canal_venda_id: prec.canal_venda_id,
                        preco_venda: prec.preco_venda != null ? Number(prec.preco_venda) : null,
                        custo_produto: prec.custo_produto != null ? Number(prec.custo_produto) : null,
                        custo_prep_center: prec.custo_prep_center != null ? Number(prec.custo_prep_center) : null,
                        custo_embalagem: prec.custo_embalagem != null ? Number(prec.custo_embalagem) : null,
                        custo_frete_inbound: prec.custo_frete_inbound != null ? Number(prec.custo_frete_inbound) : null,
                        taxa_marketplace: prec.taxa_marketplace != null ? Number(prec.taxa_marketplace) : null,
                        taxa_logistica: prec.taxa_logistica != null ? Number(prec.taxa_logistica) : null,
                        taxa_ads_estimada: prec.taxa_ads_estimada != null ? Number(prec.taxa_ads_estimada) : null,
                        imposto_estimado: prec.imposto_estimado != null ? Number(prec.imposto_estimado) : null,
                        outros_custos: prec.outros_custos != null ? Number(prec.outros_custos) : null,
                        margem_desejada_percentual: prec.margem_desejada_percentual != null ? Number(prec.margem_desejada_percentual) : null,
                        roi_desejado_percentual: prec.roi_desejado_percentual != null ? Number(prec.roi_desejado_percentual) : null,
                        
                        possui_custos_salvos: true,
                        preco_erp_sugerido: snap.preco != null ? Number(snap.preco) : null,
                        custo_erp_sugerido: snap.preco_custo != null ? Number(snap.preco_custo) : null
                    })
                }
            }
        }
    }

    return resultado.sort((a, b) => a.sku.localeCompare(b.sku))
}

/**
 * Busca as configurações operacionais da conta (regime tributário, imposto base).
 */
export async function buscarConfiguracaoOperacaoV5(): Promise<ConfiguracaoOperacaoV5 | null> {
    const { data, error } = await supabase
        .from('configuracoes_operacao')
        .select('*')
        .eq('status', 'ativo')
        .limit(1)
        .maybeSingle()

    if (error) {
        throw new Error(`Erro ao buscar configurações da operação: ${error.message}`)
    }

    if (!data) return null

    return {
        id: data.id,
        nome_operacao: data.nome_operacao,
        regime_tributario: data.regime_tributario,
        aliquota_imposto_padrao_percentual: Number(data.aliquota_imposto_padrao_percentual || 0),
        prep_center_padrao_id: data.prep_center_padrao_id,
        canal_venda_padrao_id: data.canal_venda_padrao_id,
        moeda_padrao: data.moeda_padrao,
        observacoes: data.observacoes,
        status: data.status
    }
}

/**
 * Busca as tabelas de custos de Prep Center cadastrados e ativos.
 */
export async function buscarCustosPrepCenterV5(): Promise<CustoPrepCenterV5[]> {
    const { data, error } = await supabase
        .from('custos_prep_center')
        .select('*')
        .eq('status', 'ativo')

    if (error) {
        throw new Error(`Erro ao buscar custos de Prep Center: ${error.message}`)
    }

    return (data || []).map((row) => ({
        id: row.id,
        local_estoque_id: row.local_estoque_id,
        nome_regra: row.nome_regra,
        tipo_operacao: row.tipo_operacao,
        quantidade_minima: row.quantidade_minima != null ? Number(row.quantidade_minima) : null,
        quantidade_maxima: row.quantidade_maxima != null ? Number(row.quantidade_maxima) : null,
        custo_unitario: Number(row.custo_unitario || 0),
        custo_fixo: Number(row.custo_fixo || 0),
        custo_embalagem: Number(row.custo_embalagem || 0),
        custo_extra: Number(row.custo_extra || 0),
        observacoes: row.observacoes,
        status: row.status,
        data_inicio_vigencia: row.data_inicio_vigencia,
        data_fim_vigencia: row.data_fim_vigencia
    }))
}

/**
 * Busca os canais de venda de marketplaces ativos e injeta a comissão padrão sugerida.
 */
export async function buscarCanaisVendaV5(): Promise<CanalVendaV5[]> {
    const { data, error } = await supabase
        .from('canais_venda')
        .select('*')
        .eq('status', 'ativo')

    if (error) {
        throw new Error(`Erro ao buscar canais de venda: ${error.message}`)
    }

    return (data || []).map((row) => {
        // Regra padrão gerencial de comissão sugerida (em %)
        let comissao = 0
        const tipo = (row.tipo || '').toLowerCase()
        if (tipo === 'amazon') {
            comissao = 15.0
        } else if (tipo === 'mercado_livre') {
            comissao = 16.5
        } else if (tipo === 'shopee') {
            comissao = 18.0
        }

        return {
            id: row.id,
            nome: row.nome,
            tipo: row.tipo,
            modalidade_logistica: row.modalidade_logistica,
            codigo_externo: row.codigo_externo,
            marketplace_id: row.marketplace_id,
            observacoes: row.observacoes,
            status: row.status,
            comissao_padrao_sugerida: comissao
        }
    })
}

/**
 * Busca as regras fiscais de compra e rateios fiscais cadastrados.
 */
export async function buscarRegrasFiscaisCompraV5(): Promise<RegraFiscalCompraV5[]> {
    const { data, error } = await supabase
        .from('config_custo_fiscal_compra')
        .select('*')
        .eq('ativo', true)

    if (error) {
        throw new Error(`Erro ao buscar regras fiscais de compra: ${error.message}`)
    }

    return (data || []).map((row) => ({
        id: row.id,
        codigo_regra: row.codigo_regra,
        descricao: row.descricao,
        entra_no_custo: row.entra_no_custo,
        origem_valor: row.origem_valor,
        cfops_aplicaveis: row.cfops_aplicaveis,
        ativo: row.ativo,
        observacoes: row.observacoes
    }))
}

/**
 * Busca o custo médio ponderado da nota fiscal de entrada Olist para sugestões na tabela.
 */
export async function buscarSugestoesCustoMedioV5(): Promise<SugestaoCustoMedioV5[]> {
    // A view olist_curva_abc_view já consolida o custo médio ponderado de notas de entrada
    const { data, error } = await supabase
        .from('olist_curva_abc_view')
        .select('sku, custo_medio_unitario, total_notas_entrada')

    if (error) {
        throw new Error(`Erro ao buscar sugestões de custo médio: ${error.message}`)
    }

    return (data || []).map((row) => ({
        sku: row.sku || '',
        custo_medio_unitario: row.custo_medio_unitario != null ? Number(row.custo_medio_unitario) : null,
        total_notas_entrada: row.total_notas_entrada != null ? Number(row.total_notas_entrada) : 0
    }))
}

/**
 * Realiza a simulação gerencial de lucros, margens e ROI em memória (sem salvar no banco de dados).
 */
export function calcularSimulacaoMargemV5(
    params: ParamentrosSimulacaoV5
): SimulacaoMargemV5Resultado {
    const precoVenda = Number(params.preco_venda || 0)
    const custoProduto = Number(params.custo_produto || 0)
    const custoPrepCenter = Number(params.custo_prep_center || 0)
    const custoEmbalagem = Number(params.custo_embalagem || 0)
    const custoFreteInbound = Number(params.custo_frete_inbound || 0)
    const outrosCustos = Number(params.outros_custos || 0)
    const taxaLogistica = Number(params.taxa_logistica || 0)

    // Custo Físico Total de Aquisição (Base para cálculo de ROI)
    const custoTotalAquisicao = custoProduto + custoPrepCenter + custoEmbalagem + custoFreteInbound

    // Comissão do Marketplace (Valor fixo ou Percentual)
    let taxaMarketplaceCalculada = Number(params.taxa_marketplace || 0)
    if (params.taxa_marketplace_percentual != null && params.taxa_marketplace_percentual > 0) {
        taxaMarketplaceCalculada = precoVenda * (params.taxa_marketplace_percentual / 100)
    }

    // Ads Estimado (Valor fixo ou Percentual)
    let taxaAdsCalculada = Number(params.taxa_ads_estimada || 0)
    if (params.taxa_ads_percentual != null && params.taxa_ads_percentual > 0) {
        taxaAdsCalculada = precoVenda * (params.taxa_ads_percentual / 100)
    }

    // Imposto Estimado (Valor fixo ou Alíquota)
    let impostoCalculado = Number(params.imposto_estimado || 0)
    if (params.imposto_aliquota_percentual != null && params.imposto_aliquota_percentual > 0) {
        impostoCalculado = precoVenda * (params.imposto_aliquota_percentual / 100)
    }

    // Custos Totais da Venda
    const custosTotais = 
        custoTotalAquisicao + 
        taxaMarketplaceCalculada + 
        taxaLogistica + 
        taxaAdsCalculada + 
        impostoCalculado + 
        outrosCustos

    // Lucro Líquido
    const lucroLiquido = precoVenda - custosTotais

    // Margem Líquida %
    const margemLiquidaPercentual = precoVenda > 0 
        ? (lucroLiquido / precoVenda) * 100 
        : 0

    // ROI % (Lucro Líquido / Custo Total do Produto/Aquisição/Prep/Frete Inbound)
    const roiPercentual = custoTotalAquisicao > 0 
        ? (lucroLiquido / custoTotalAquisicao) * 100 
        : 0

    return {
        preco_venda: precoVenda,
        custo_total_aquisicao: Number(custoTotalAquisicao.toFixed(4)),
        taxa_marketplace_calculada: Number(taxaMarketplaceCalculada.toFixed(4)),
        taxa_ads_calculada: Number(taxaAdsCalculada.toFixed(4)),
        imposto_calculado: Number(impostoCalculado.toFixed(4)),
        custos_totais: Number(custosTotais.toFixed(4)),
        lucro_liquido: Number(lucroLiquido.toFixed(4)),
        margem_liquida_percentual: Number(margemLiquidaPercentual.toFixed(2)),
        roi_percentual: Number(roiPercentual.toFixed(2))
    }
}

export type SalvarProdutoPrecificacaoV5Input = {
    id_precificacao?: string | null
    produto_id: string
    canal_venda_id: string
    preco_venda: number
    custo_produto: number
    custo_prep_center: number
    custo_embalagem: number
    custo_frete_inbound: number
    taxa_marketplace: number
    taxa_logistica: number
    taxa_ads_estimada: number
    imposto_estimado: number
    outros_custos: number
    margem_desejada_percentual?: number | null
    roi_desejado_percentual?: number | null
    observacoes?: string | null
    status?: string
}

/**
 * Salva ou atualiza a precificação gerencial de um produto para um canal específico no Supabase.
 */
export async function salvarProdutoPrecificacaoV5(
    item: SalvarProdutoPrecificacaoV5Input
): Promise<any> {
    const payload: any = {
        produto_id: item.produto_id,
        canal_venda_id: item.canal_venda_id,
        preco_venda: item.preco_venda ?? 0,
        custo_produto: item.custo_produto ?? 0,
        custo_prep_center: item.custo_prep_center ?? 0,
        custo_embalagem: item.custo_embalagem ?? 0,
        custo_frete_inbound: item.custo_frete_inbound ?? 0,
        taxa_marketplace: item.taxa_marketplace ?? 0,
        taxa_logistica: item.taxa_logistica ?? 0,
        taxa_ads_estimada: item.taxa_ads_estimada ?? 0,
        imposto_estimado: item.imposto_estimado ?? 0,
        outros_custos: item.outros_custos ?? 0,
        margem_desejada_percentual: item.margem_desejada_percentual ?? null,
        roi_desejado_percentual: item.roi_desejado_percentual ?? null,
        observacoes: item.observacoes ?? null,
        status: item.status ?? 'ativo'
    }

    if (item.id_precificacao) {
        payload.id = item.id_precificacao
    }

    const { data, error } = await supabase
        .from('produtos_precificacao')
        .upsert(payload, { onConflict: 'produto_id,canal_venda_id' })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

// ─── MÓDULO 6: SIMULAÇÃO MOCKADA MERCADO LIVRE ──────────────────────────────

export type SimulacaoMercadoLivreInput = {
    preco_venda: number
    custo_produto: number // COGS
    aliquota_imposto: number // ex: 0.04 (4%)
    peso_gramas?: number
    reputacao: 'official_store' | 'platinum' | 'gold' | 'green' | 'none'
    category_id: string
    listing_type_id: 'gold_special' | 'gold_pro' // Classico ou Premium
    custo_logistico_sem_frete?: number
    custo_logistico_frete_gratis?: number
}

export type SimulacaoMercadoLivreWarning = {
    codigo: string
    mensagem: string
}

export type SimulacaoMercadoLivreResultado = {
    preco_venda: number
    custo_produto: number
    comissao: number
    taxa_comissao_percentual: number
    tarifa_fixa: number
    total_comissao: number
    custo_logistico_aplicado: number
    imposto_calculado: number
    lucro_liquido: number
    margem_liquida: number // decimal (e.g. 0.15)
    roi: number // decimal (e.g. 0.30)
    preco_minimo_recomendado: number // Break-even
    warnings: SimulacaoMercadoLivreWarning[]
    is_mocked?: boolean
}

export async function simularTaxasMercadoLivreLocal(
    input: SimulacaoMercadoLivreInput
): Promise<SimulacaoMercadoLivreResultado> {
    // 1. Validacoes locais de seguranca e formato com Number.isFinite
    if (typeof input.preco_venda !== 'number' || !Number.isFinite(input.preco_venda)) {
        throw new Error("Preco de venda deve ser um numero finito.")
    }
    if (input.preco_venda <= 0) {
        throw new Error("Preco de venda deve ser maior que zero.")
    }

    if (typeof input.custo_produto !== 'number' || !Number.isFinite(input.custo_produto)) {
        throw new Error("Custo do produto deve ser um numero finito.")
    }
    if (input.custo_produto < 0) {
        throw new Error("Custo do produto nao pode ser negativo.")
    }

    if (typeof input.aliquota_imposto !== 'number' || !Number.isFinite(input.aliquota_imposto)) {
        throw new Error("Aliquota de imposto deve ser um numero finito.")
    }
    if (input.aliquota_imposto < 0 || input.aliquota_imposto > 1) {
        throw new Error("Aliquota de imposto deve estar entre 0% e 100%.")
    }

    if (input.peso_gramas !== undefined && input.peso_gramas !== null) {
        if (typeof input.peso_gramas !== 'number' || !Number.isFinite(input.peso_gramas)) {
            throw new Error("Peso em gramas deve ser um numero finito.")
        }
        if (input.peso_gramas < 0) {
            throw new Error("Peso nao pode ser negativo.")
        }
    }

    if (input.custo_logistico_sem_frete !== undefined && input.custo_logistico_sem_frete !== null) {
        if (typeof input.custo_logistico_sem_frete !== 'number' || !Number.isFinite(input.custo_logistico_sem_frete)) {
            throw new Error("Custo logistico sem frete deve ser um numero finito.")
        }
        if (input.custo_logistico_sem_frete < 0) {
            throw new Error("Custo logistico sem frete nao pode ser negativo.")
        }
    }

    if (input.custo_logistico_frete_gratis !== undefined && input.custo_logistico_frete_gratis !== null) {
        if (typeof input.custo_logistico_frete_gratis !== 'number' || !Number.isFinite(input.custo_logistico_frete_gratis)) {
            throw new Error("Custo logistico de frete gratis deve ser um numero finito.")
        }
        if (input.custo_logistico_frete_gratis < 0) {
            throw new Error("Custo logistico de frete gratis nao pode ser negativo.")
        }
    }

    // 2. Definicao de Fixtures ficticias locais de taxas e frete
    const limiteTarifaFixa = 79.00
    const tarifaFixaValor = 6.00

    // Comissao padrao
    const comissaoPadrao = {
        gold_special: 0.12, // 12%
        gold_pro: 0.17, // 17%
    }

    // Comissoes por categoria
    const comissaoEspecialPorCategoria: Record<string, { gold_special: number; gold_pro: number }> = {
        "MLB12345": { gold_special: 0.10, gold_pro: 0.15 },
        "MLB67890": { gold_special: 0.14, gold_pro: 0.19 },
    }

    // Matriz de Fretes
    const matrizFrete = [
        { maxGramas: 500, valorBase: 18.00 },
        { maxGramas: 1000, valorBase: 22.00 },
        { maxGramas: 2000, valorBase: 26.00 },
        { maxGramas: 5000, valorBase: 32.00 },
        { maxGramas: Infinity, valorBase: 45.00 },
    ]

    // Descontos por reputacao
    const descontosReputacao = {
        "official_store": 0.50,
        "platinum": 0.50,
        "gold": 0.40,
        "green": 0.30,
        "none": 0.00,
    }

    // 3. Calculo da comissao
    const catId = input.category_id || "MLB"
    const regrasCat = comissaoEspecialPorCategoria[catId]
    const taxaComissaoPercentual = regrasCat
        ? (input.listing_type_id === "gold_pro" ? regrasCat.gold_pro : regrasCat.gold_special)
        : (input.listing_type_id === "gold_pro" ? comissaoPadrao.gold_pro : comissaoPadrao.gold_special)

    const comissaoVal = Number((input.preco_venda * taxaComissaoPercentual).toFixed(2))
    const tarifaFixa = input.preco_venda < limiteTarifaFixa ? tarifaFixaValor : 0
    const totalComissao = Number((comissaoVal + tarifaFixa).toFixed(2))

    // 4. Calculo de frete gratis base (logistica)
    const pesoEfetivo = input.peso_gramas ?? 0
    const faixaFrete = matrizFrete.find((f) => pesoEfetivo <= f.maxGramas) || matrizFrete[matrizFrete.length - 1]
    const descontoRep = descontosReputacao[input.reputacao] || 0
    const freteGratisCalculado = Number((faixaFrete.valorBase * (1 - descontoRep)).toFixed(2))

    // 5. Custo logistico aplicado
    let custoLogisticoAplicado = 0
    if (input.preco_venda >= limiteTarifaFixa) {
        // Frete gratis obrigatorio
        custoLogisticoAplicado = input.custo_logistico_frete_gratis && input.custo_logistico_frete_gratis > 0
            ? input.custo_logistico_frete_gratis
            : freteGratisCalculado
    } else {
        // Frete nao obrigatorio
        custoLogisticoAplicado = input.custo_logistico_sem_frete && input.custo_logistico_sem_frete > 0
            ? input.custo_logistico_sem_frete
            : 0
    }

    // 6. Imposto
    const impostoCalculado = Number((input.preco_venda * input.aliquota_imposto).toFixed(2))

    // 7. Lucro Liquido, Margem e ROI
    const lucroLiquido = Number((input.preco_venda - input.custo_produto - impostoCalculado - totalComissao - custoLogisticoAplicado).toFixed(2))
    const margemLiquida = input.preco_venda > 0 ? Number((lucroLiquido / input.preco_venda).toFixed(4)) : 0
    const roi = input.custo_produto > 0 ? Number((lucroLiquido / input.custo_produto).toFixed(4)) : 0

    // 8. Calculo de Preco Minimo Recomendado (Break-even)
    const divisor = 1 - input.aliquota_imposto - taxaComissaoPercentual
    let precoMinimoRecomendado = 0
    if (divisor > 0) {
        const custoLogSemFrete = input.custo_logistico_sem_frete && input.custo_logistico_sem_frete > 0
            ? input.custo_logistico_sem_frete
            : 0
        const custoLogFreteGratis = input.custo_logistico_frete_gratis && input.custo_logistico_frete_gratis > 0
            ? input.custo_logistico_frete_gratis
            : freteGratisCalculado

        const precoBaixoCusto = (input.custo_produto + tarifaFixaValor + custoLogSemFrete) / divisor
        const precoAltoCusto = (input.custo_produto + custoLogFreteGratis) / divisor

        const eValidoBaixoCusto = precoBaixoCusto < limiteTarifaFixa
        const eValidoAltoCusto = precoAltoCusto >= limiteTarifaFixa

        if (eValidoBaixoCusto && !eValidoAltoCusto) {
            precoMinimoRecomendado = Number(precoBaixoCusto.toFixed(2))
        } else if (!eValidoBaixoCusto && eValidoAltoCusto) {
            precoMinimoRecomendado = Number(precoAltoCusto.toFixed(2))
        } else if (eValidoBaixoCusto && eValidoAltoCusto) {
            precoMinimoRecomendado = Number(Math.min(precoBaixoCusto, precoAltoCusto).toFixed(2))
        } else {
            // Zona de descontinuidade em R$ 79.00
            const comissaoNoLimite = limiteTarifaFixa * taxaComissaoPercentual
            const impostoNoLimite = limiteTarifaFixa * input.aliquota_imposto
            const lucroNoLimite = limiteTarifaFixa - input.custo_produto - impostoNoLimite - comissaoNoLimite - custoLogFreteGratis
            if (lucroNoLimite >= 0) {
                precoMinimoRecomendado = limiteTarifaFixa
            } else {
                precoMinimoRecomendado = Number(precoAltoCusto.toFixed(2))
            }
        }
    }

    // 9. Warnings
    const warnings: SimulacaoMercadoLivreWarning[] = []
    if (lucroLiquido < 0) {
        warnings.push({
            codigo: "lucro_negativo",
            mensagem: "Lucro liquido estimado esta negativo. Revise o preco de venda ou custos."
        })
    }
    if (input.preco_venda < precoMinimoRecomendado) {
        warnings.push({
            codigo: "preco_abaixo_break_even",
            mensagem: `Preco de venda esta abaixo do preco minimo recomendado de R$ ${precoMinimoRecomendado.toFixed(2)}.`
        })
    }

    return {
        preco_venda: input.preco_venda,
        custo_produto: input.custo_produto,
        comissao: comissaoVal,
        taxa_comissao_percentual: taxaComissaoPercentual,
        tarifa_fixa: tarifaFixa,
        total_comissao: totalComissao,
        custo_logistico_aplicado: custoLogisticoAplicado,
        imposto_calculado: impostoCalculado,
        lucro_liquido: lucroLiquido,
        margem_liquida: margemLiquida,
        roi: roi,
        preco_minimo_recomendado: precoMinimoRecomendado,
        warnings: warnings,
        is_mocked: true
    }
}
