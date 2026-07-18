import type { MercadoLivreFeesProvider } from './MercadoLivreFeesProvider'
import { LocalMockMercadoLivreFeesProvider } from './LocalMockMercadoLivreFeesProvider'

export const defaultMercadoLivreFeesProvider: MercadoLivreFeesProvider =
  new LocalMockMercadoLivreFeesProvider()
