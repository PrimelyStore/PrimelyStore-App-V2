import type { MercadoLivreFeesProvider } from './MercadoLivreFeesProvider'
import type { MercadoLivreSimulacaoInput, MercadoLivreSimulacaoResultado } from './types'
import { simularTaxasMercadoLivreLocal } from './simularTaxasMercadoLivreLocal'

export class LocalMockMercadoLivreFeesProvider
  implements MercadoLivreFeesProvider {
  readonly id = 'local_mock'

  async simularTaxas(
    input: MercadoLivreSimulacaoInput
  ): Promise<MercadoLivreSimulacaoResultado> {
    const resultado = await simularTaxasMercadoLivreLocal(input)

    return {
      ...resultado,
      provider_source: 'local_mock'
    }
  }
}
