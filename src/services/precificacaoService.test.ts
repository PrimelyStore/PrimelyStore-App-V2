import { describe, it, expect } from 'vitest'
import { simularTaxasMercadoLivreLocal } from './precificacaoService'

describe('precificacaoService - simularTaxasMercadoLivreLocal', () => {
    const baseInput = {
        preco_venda: 120.00,
        custo_produto: 45.00,
        aliquota_imposto: 0.04, // 4%
        peso_gramas: 500,
        reputacao: 'green' as const,
        category_id: 'MLB1234',
        listing_type_id: 'gold_special' as const
    }

    it('deve confirmar que a resposta contem is_mocked igual a true', async () => {
        const res = await simularTaxasMercadoLivreLocal(baseInput)
        expect(res.is_mocked).toBe(true)
    })

    it('deve simular preco 78.99 aplicando a tarifa fixa da faixa inferior (R$ 6.00) e sem frete gratis obrigatorio', async () => {
        const input = {
            ...baseInput,
            preco_venda: 78.99
        }
        const res = await simularTaxasMercadoLivreLocal(input)
        expect(res.tarifa_fixa).toBe(6.00)
        expect(res.custo_logistico_aplicado).toBe(0.00) // sem frete gratis abaixo de R$ 79.00
    })

    it('deve simular preco 79.00 aplicando frete gratis e sem tarifa fixa (transicao da faixa)', async () => {
        const input = {
            ...baseInput,
            preco_venda: 79.00
        }
        const res = await simularTaxasMercadoLivreLocal(input)
        expect(res.tarifa_fixa).toBe(0.00)
        // Peso 500g e reputacao green -> valor base 18.00 com 30% de desconto = 12.60
        expect(res.custo_logistico_aplicado).toBe(12.60)
    })

    it('deve simular preco 79.01 aplicando frete gratis e sem tarifa fixa', async () => {
        const input = {
            ...baseInput,
            preco_venda: 79.01
        }
        const res = await simularTaxasMercadoLivreLocal(input)
        expect(res.tarifa_fixa).toBe(0.00)
        expect(res.custo_logistico_aplicado).toBe(12.60)
    })

    it('deve calcular preco minimo recomendado (break-even) em um caso valido', async () => {
        const res = await simularTaxasMercadoLivreLocal(baseInput)
        // Divisor = 1 - 0.04 - 0.12 = 0.84
        // Com preco < 79, tarifa fixa = 6.00 e sem frete gratis = (45.00 + 6.00) / 0.84 = 51.00 / 0.84 = 60.7142 -> 60.71
        expect(res.preco_minimo_recomendado).toBe(60.71)
    })

    it('deve gerar warning quando o preco de venda estiver abaixo do break-even', async () => {
        const input = {
            ...baseInput,
            preco_venda: 55.00 // Abaixo do break-even de 60.71
        }
        const res = await simularTaxasMercadoLivreLocal(input)
        const warning = res.warnings.find(w => w.codigo === 'preco_abaixo_break_even')
        expect(warning).toBeDefined()
        expect(warning?.mensagem).toContain('60.71')
    })

    it('deve gerar warning de lucro negativo quando o preco de venda for menor que o custo total', async () => {
        const input = {
            ...baseInput,
            preco_venda: 10.00 // Preco muito baixo, gerando prejuizo
        }
        const res = await simularTaxasMercadoLivreLocal(input)
        const warning = res.warnings.find(w => w.codigo === 'lucro_negativo')
        expect(warning).toBeDefined()
        expect(warning?.mensagem).toContain('Lucro liquido estimado esta negativo')
    })

    it('deve rejeitar preco_venda igual a NaN', async () => {
        const input = {
            ...baseInput,
            preco_venda: NaN
        }
        await expect(simularTaxasMercadoLivreLocal(input)).rejects.toThrow('Preco de venda deve ser um numero finito.')
    })

    it('deve rejeitar preco_venda igual a Infinity', async () => {
        const input = {
            ...baseInput,
            preco_venda: Infinity
        }
        await expect(simularTaxasMercadoLivreLocal(input)).rejects.toThrow('Preco de venda deve ser um numero finito.')
    })

    it('deve rejeitar custo_logistico_sem_frete negativo', async () => {
        const input = {
            ...baseInput,
            custo_logistico_sem_frete: -10
        }
        await expect(simularTaxasMercadoLivreLocal(input)).rejects.toThrow('Custo logistico sem frete nao pode ser negativo.')
    })

    it('deve rejeitar peso nao finito', async () => {
        const input = {
            ...baseInput,
            peso_gramas: NaN
        }
        await expect(simularTaxasMercadoLivreLocal(input)).rejects.toThrow('Peso em gramas deve ser um numero finito.')
    })
})
