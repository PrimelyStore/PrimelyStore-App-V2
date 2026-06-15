import { describe, it, expect } from 'vitest'
import { LocalMockMercadoLivreFeesProvider } from './LocalMockMercadoLivreFeesProvider'
import { simularTaxasMercadoLivreLocal } from '../precificacaoService'
import type { MercadoLivreSimulacaoInput } from './types'

describe('LocalMockMercadoLivreFeesProvider', () => {
    const baseInput: MercadoLivreSimulacaoInput = {
        preco_venda: 120.00,
        custo_produto: 45.00,
        aliquota_imposto: 0.04,
        peso_gramas: 500,
        reputacao: 'green',
        category_id: 'MLB1234',
        listing_type_id: 'gold_special'
    }

    it('1. deve confirmar que o provider possui id igual a local_mock', () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        expect(provider.id).toBe('local_mock')
    })

    it('2. deve confirmar que o resultado possui provider_source igual a local_mock', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const res = await provider.simularTaxas(baseInput)
        expect(res.provider_source).toBe('local_mock')
    })

    it('3. deve devolver os mesmos valores financeiros da funcao existente para um caso valido', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const resProvider = await provider.simularTaxas(baseInput)
        const resFuncao = await simularTaxasMercadoLivreLocal(baseInput)

        expect(resProvider.preco_venda).toBe(resFuncao.preco_venda)
        expect(resProvider.custo_produto).toBe(resFuncao.custo_produto)
        expect(resProvider.comissao).toBe(resFuncao.comissao)
        expect(resProvider.tarifa_fixa).toBe(resFuncao.tarifa_fixa)
        expect(resProvider.total_comissao).toBe(resFuncao.total_comissao)
        expect(resProvider.custo_logistico_aplicado).toBe(resFuncao.custo_logistico_aplicado)
        expect(resProvider.imposto_calculado).toBe(resFuncao.imposto_calculado)
        expect(resProvider.lucro_liquido).toBe(resFuncao.lucro_liquido)
        expect(resProvider.margem_liquida).toBe(resFuncao.margem_liquida)
        expect(resProvider.roi).toBe(resFuncao.roi)
    })

    it('4. deve confirmar que os warnings da funcao existente sao preservados', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const inputComPrejuizo = {
            ...baseInput,
            preco_venda: 10.00
        }
        const resProvider = await provider.simularTaxas(inputComPrejuizo)
        const resFuncao = await simularTaxasMercadoLivreLocal(inputComPrejuizo)

        expect(resProvider.warnings).toEqual(resFuncao.warnings)
        expect(resProvider.warnings.length).toBeGreaterThan(0)
    })

    it('5. deve confirmar que o break-even e preservado', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const resProvider = await provider.simularTaxas(baseInput)
        const resFuncao = await simularTaxasMercadoLivreLocal(baseInput)

        expect(resProvider.preco_minimo_recomendado).toBe(resFuncao.preco_minimo_recomendado)
    })

    it('6. deve confirmar que uma entrada invalida rejeitada pela funcao existente tambem e rejeitada pelo provider', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const inputInvalido = {
            ...baseInput,
            custo_logistico_sem_frete: -5.00
        }
        await expect(provider.simularTaxas(inputInvalido)).rejects.toThrow('Custo logistico sem frete nao pode ser negativo.')
    })

    it('7. deve confirmar que NaN continua sendo rejeitado', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const inputNaN = {
            ...baseInput,
            preco_venda: NaN
        }
        await expect(provider.simularTaxas(inputNaN)).rejects.toThrow('Preco de venda deve ser um numero finito.')
    })

    it('8. deve confirmar que Infinity continua sendo rejeitado', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const inputInfinity = {
            ...baseInput,
            preco_venda: Infinity
        }
        await expect(provider.simularTaxas(inputInfinity)).rejects.toThrow('Preco de venda deve ser um numero finito.')
    })

    it('9. deve confirmar que o provider nao altera o objeto de entrada', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const inputOriginal = { ...baseInput }
        const inputParaSimulacao = { ...baseInput }

        await provider.simularTaxas(inputParaSimulacao)
        expect(inputParaSimulacao).toEqual(inputOriginal)
    })

    it('10. deve confirmar que duas execucoes com a mesma entrada produzem resultados equivalentes', async () => {
        const provider = new LocalMockMercadoLivreFeesProvider()
        const res1 = await provider.simularTaxas(baseInput)
        const res2 = await provider.simularTaxas(baseInput)

        expect(res1).toEqual(res2)
    })
})
