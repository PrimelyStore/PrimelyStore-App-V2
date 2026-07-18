import type {
    MercadoLivreSimulacaoInput,
    MercadoLivreSimulacaoResultado
} from './types'

export interface MercadoLivreFeesProvider {
    readonly id: string
    simularTaxas(
        input: MercadoLivreSimulacaoInput
    ): Promise<MercadoLivreSimulacaoResultado>
}
