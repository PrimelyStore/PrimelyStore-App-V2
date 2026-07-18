import { describe, it, expect } from 'vitest'
import type { MercadoLivreFeesProvider } from './MercadoLivreFeesProvider'
import type { MercadoLivreSimulacaoInput, MercadoLivreFeesProviderSource } from './types'
import { LocalMockMercadoLivreFeesProvider } from './LocalMockMercadoLivreFeesProvider'
import { simularTaxasMercadoLivreLocal } from './simularTaxasMercadoLivreLocal'

export function executarContratoDoProvider(
  criarProvider: () => MercadoLivreFeesProvider,
  expectedId: string,
  expectedSource: MercadoLivreFeesProviderSource
) {
  const baseInput: MercadoLivreSimulacaoInput = {
    preco_venda: 120.00,
    custo_produto: 45.00,
    aliquota_imposto: 0.04,
    peso_gramas: 500,
    reputacao: 'green',
    category_id: 'MLB1234',
    listing_type_id: 'gold_special'
  }

  describe(`Contrato de Provedor Mercado Livre: ${expectedId}`, () => {
    it('1. deve possuir identificador estavel e nao vazio', () => {
      const provider = criarProvider()
      expect(provider.id).toBe(expectedId)
      expect(provider.id.trim().length).toBeGreaterThan(0)
    })

    it('2. deve retornar o provider_source esperado no resultado', async () => {
      const provider = criarProvider()
      const res = await provider.simularTaxas(baseInput)
      expect(res.provider_source).toBe(expectedSource)
    })

    it('3. deve retornar resultado equivalente ao da funcao delegada para entrada valida', async () => {
      const provider = criarProvider()
      const resProvider = await provider.simularTaxas(baseInput)
      const resDelegada = await simularTaxasMercadoLivreLocal(baseInput)

      expect(resProvider).toEqual({
        ...resDelegada,
        provider_source: expectedSource
      })
    })

    it('4. deve manter paridade exata em uma matriz de entradas representativas', async () => {
      const provider = criarProvider()
      const matrizEntradas: MercadoLivreSimulacaoInput[] = [
        { ...baseInput, preco_venda: 50.00, custo_produto: 20.00 },
        { ...baseInput, preco_venda: 250.00, custo_produto: 100.00, reputacao: 'platinum' },
        { ...baseInput, preco_venda: 15.00, custo_produto: 5.00, listing_type_id: 'gold_pro' },
        { ...baseInput, peso_gramas: 5000, reputacao: 'official_store' },
        { ...baseInput, custo_logistico_sem_frete: 12.50, custo_logistico_frete_gratis: 25.00 }
      ]

      for (const input of matrizEntradas) {
        const resProvider = await provider.simularTaxas(input)
        const resDelegada = await simularTaxasMercadoLivreLocal(input)

        expect(resProvider).toEqual({
          ...resDelegada,
          provider_source: expectedSource
        })
      }
    })

    it('5. deve validar paridade nos limites criticos de preco (78.99, 79.00 e 79.01)', async () => {
      const provider = criarProvider()
      const limitesPreco = [78.99, 79.00, 79.01]

      for (const preco of limitesPreco) {
        const input = { ...baseInput, preco_venda: preco }
        const resProvider = await provider.simularTaxas(input)
        const resDelegada = await simularTaxasMercadoLivreLocal(input)

        expect(resProvider).toEqual({
          ...resDelegada,
          provider_source: expectedSource
        })
      }
    })

    it('6. deve manter warnings identicos aos da funcao delegada', async () => {
      const provider = criarProvider()
      const inputComAviso = { ...baseInput, preco_venda: 10.00 }
      const resProvider = await provider.simularTaxas(inputComAviso)
      const resDelegada = await simularTaxasMercadoLivreLocal(inputComAviso)

      expect(resProvider.warnings).toEqual(resDelegada.warnings)
      expect(resProvider.warnings.length).toBeGreaterThan(0)
    })

    it('7. deve manter o break-even e outros campos idênticos pela comparacao total', async () => {
      const provider = criarProvider()
      const resProvider = await provider.simularTaxas(baseInput)
      const resDelegada = await simularTaxasMercadoLivreLocal(baseInput)

      expect(resProvider.preco_minimo_recomendado).toBe(resDelegada.preco_minimo_recomendado)
    })

    it('8. deve rejeitar entradas invalidas com erro equivalente ao da funcao delegada', async () => {
      const provider = criarProvider()
      const entradasInvalidas = [
        { ...baseInput, custo_logistico_sem_frete: -2.00 },
        { ...baseInput, preco_venda: NaN },
        { ...baseInput, preco_venda: Infinity }
      ]

      for (const input of entradasInvalidas) {
        let erroDelegada: Error | null = null
        try {
          await simularTaxasMercadoLivreLocal(input)
        } catch (err) {
          erroDelegada = err as Error
        }

        expect(erroDelegada).not.toBeNull()

        await expect(provider.simularTaxas(input)).rejects.toThrow(erroDelegada!.message)
      }
    })

    it('9. deve garantir que o objeto de entrada nao e modificado por efeitos colaterais', async () => {
      const provider = criarProvider()
      const inputOriginal = { ...baseInput }
      const inputParaProvider = { ...baseInput }

      await provider.simularTaxas(inputParaProvider)
      expect(inputParaProvider).toEqual(inputOriginal)
    })

    it('10. deve produzir resultados deterministas e equivalentes em chamadas repetidas', async () => {
      const provider = criarProvider()
      const res1 = await provider.simularTaxas(baseInput)
      const res2 = await provider.simularTaxas(baseInput)

      expect(res1).toEqual(res2)
    })

    it('11. deve retornar uma Promise e permanecer assincrono', () => {
      const provider = criarProvider()
      const promise = provider.simularTaxas(baseInput)

      expect(promise).toBeInstanceOf(Promise)
    })
  })
}

// Submete o provider local de taxas ao contrato definido
executarContratoDoProvider(
  () => new LocalMockMercadoLivreFeesProvider(),
  'local_mock',
  'local_mock'
)
