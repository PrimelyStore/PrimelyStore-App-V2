export type MercadoLivreFeesProviderSource = 'local_mock' | 'edge_function' | 'official_api'

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

export type MercadoLivreSimulacaoInput = SimulacaoMercadoLivreInput

export type MercadoLivreSimulacaoResultado = SimulacaoMercadoLivreResultado & {
    provider_source: MercadoLivreFeesProviderSource
}

export type MercadoLivreSimulacaoWarning = SimulacaoMercadoLivreWarning
