import type {
    SimulacaoMercadoLivreInput,
    SimulacaoMercadoLivreWarning,
    SimulacaoMercadoLivreResultado
} from '../precificacaoService'

export type MercadoLivreFeesProviderSource = 'local_mock' | 'edge_function' | 'official_api'

export type MercadoLivreSimulacaoInput = SimulacaoMercadoLivreInput

export type MercadoLivreSimulacaoResultado = SimulacaoMercadoLivreResultado & {
    provider_source: MercadoLivreFeesProviderSource
}

export type MercadoLivreSimulacaoWarning = SimulacaoMercadoLivreWarning
