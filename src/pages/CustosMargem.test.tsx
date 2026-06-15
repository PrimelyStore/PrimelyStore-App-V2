import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustosMargem } from './CustosMargem'
import * as precificacaoService from '../services/precificacaoService'

// Mocking precificacaoService
vi.mock('../services/precificacaoService', async (importOriginal) => {
    const original = await importOriginal<typeof import('../services/precificacaoService')>()
    return {
        ...original,
        buscarProdutosBasePrecificacaoV5: vi.fn().mockResolvedValue([]),
        buscarConfiguracaoOperacaoV5: vi.fn().mockResolvedValue({ aliquota_imposto_padrao_percentual: 4.0 }),
        buscarCustosPrepCenterV5: vi.fn().mockResolvedValue([]),
        buscarCanaisVendaV5: vi.fn().mockResolvedValue([]),
        buscarRegrasFiscaisCompraV5: vi.fn().mockResolvedValue([]),
        buscarSugestoesCustoMedioV5: vi.fn().mockResolvedValue([]),
        calcularSimulacaoMargemV5: vi.fn().mockReturnValue({
            preco_venda: 120.00,
            custo_total_aquisicao: 70.00,
            taxa_marketplace_calculada: 12.00,
            taxa_ads_calculada: 8.00,
            imposto_calculado: 4.80,
            custos_totais: 94.80,
            lucro_liquido: 25.20,
            margem_liquida_percentual: 21.00,
            roi_percentual: 36.00
        })
    }
})

// Mocking produtoCanalMarketplaceService
vi.mock('../services/produtoCanalMarketplaceService', () => {
    return {
        atualizarMapeamentoMarketplace: vi.fn(),
        criarMapeamentoMarketplace: vi.fn(),
        inativarMapeamentoMarketplace: vi.fn(),
        listarOpcoesCanaisVenda: vi.fn().mockResolvedValue([]),
        listarOpcoesProdutos: vi.fn().mockResolvedValue([]),
        listarMapeamentosMarketplace: vi.fn().mockResolvedValue([])
    }
})

describe('CustosMargem - Simulador Mercado Livre (Fase 5.5L-6F)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.restoreAllMocks()
    })

    it('deve renderizar a aba de simulador e permitir alternar modos', async () => {
        vi.spyOn(precificacaoService, 'simularTaxasMercadoLivreLocal').mockResolvedValue({
            preco_venda: 120.00,
            custo_produto: 70.00,
            comissao: 14.40,
            taxa_comissao_percentual: 0.12,
            tarifa_fixa: 0.00,
            total_comissao: 14.40,
            custo_logistico_aplicado: 22.00,
            imposto_calculado: 4.80,
            lucro_liquido: 8.80,
            margem_liquida: 0.0733,
            roi: 0.1257,
            preco_minimo_recomendado: 79.00,
            warnings: []
        })

        render(<CustosMargem />)

        // Aguarda carregar os dados iniciais
        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        // Clicar na aba simulador
        const tabSimulador = screen.getByText('Simulador de Precificação')
        fireEvent.click(tabSimulador)

        // Deve exibir o seletor de modos
        expect(screen.getByText('Simulador Padrao')).toBeInTheDocument()
        const btnMl = screen.getByRole('button', { name: 'Mercado Livre' })
        expect(btnMl).toBeInTheDocument()

        // Alterna para o modo Mercado Livre
        fireEvent.click(btnMl)

        // Aguarda a simulacao terminar para evitar warnings de act()
        await waitFor(() => {
            expect(screen.queryByText(/Simulando taxas.../i)).not.toBeInTheDocument()
        })

        // Deve renderizar os inputs especificos
        expect(screen.getByText('Categoria Mercado Livre')).toBeInTheDocument()
        expect(screen.getByText('Tipo de Anuncio')).toBeInTheDocument()
        expect(screen.getByText('Peso Estimado (gramas)')).toBeInTheDocument()
        expect(screen.getByText('Reputacao da Conta')).toBeInTheDocument()
    })

    it('deve exibir o container de erro estruturado na simulacao Mercado Livre sem bloquear o formulario', async () => {
        vi.spyOn(precificacaoService, 'simularTaxasMercadoLivreLocal').mockRejectedValue(
            new Error('Nao foi possivel concluir a simulacao local. Revise os valores informados.')
        )

        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Simulador de Precificação'))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Deve renderizar a mensagem de erro estruturada
        expect(await screen.findByText('Erro na Simulacao')).toBeInTheDocument()
        expect(await screen.findByText('Nao foi possivel concluir a simulacao local. Revise os valores informados.')).toBeInTheDocument()

        // O formulario de inputs ainda deve estar visivel
        expect(screen.getByText('Dados Basicos da Venda')).toBeInTheDocument()
    })

    it('deve exibir tela de carregamento (loading mockado) enquanto a simulacao esta em andamento', async () => {
        let resolverPromise: (value: precificacaoService.SimulacaoMercadoLivreResultado) => void = () => {}
        const promisePendente = new Promise<precificacaoService.SimulacaoMercadoLivreResultado>((resolve) => {
            resolverPromise = resolve
        })
        vi.spyOn(precificacaoService, 'simularTaxasMercadoLivreLocal').mockReturnValue(promisePendente)

        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Simulador de Precificação'))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Deve exibir o indicador de loading
        expect(screen.getByText('Simulando taxas...')).toBeInTheDocument()

        // Resolve a promise para liberar recursos e limpar estado
        resolverPromise({
            preco_venda: 120.00,
            custo_produto: 70.00,
            comissao: 14.40,
            taxa_comissao_percentual: 0.12,
            tarifa_fixa: 0.00,
            total_comissao: 14.40,
            custo_logistico_aplicado: 22.00,
            imposto_calculado: 4.80,
            lucro_liquido: 8.80,
            margem_liquida: 0.0733,
            roi: 0.1257,
            preco_minimo_recomendado: 79.00,
            warnings: []
        })

        // Aguarda sumir o loading
        await waitFor(() => {
            expect(screen.queryByText('Simulando taxas...')).not.toBeInTheDocument()
        })
    })

    it('deve exibir o banner de governanca de simulacao local mockada quando a simulacao resolver com sucesso', async () => {
        vi.spyOn(precificacaoService, 'simularTaxasMercadoLivreLocal').mockResolvedValue({
            preco_venda: 120.00,
            custo_produto: 70.00,
            comissao: 14.40,
            taxa_comissao_percentual: 0.12,
            tarifa_fixa: 0.00,
            total_comissao: 14.40,
            custo_logistico_aplicado: 22.00,
            imposto_calculado: 4.80,
            lucro_liquido: 8.80,
            margem_liquida: 0.0733,
            roi: 0.1257,
            preco_minimo_recomendado: 79.00,
            warnings: []
        })

        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Simulador de Precificação'))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Aguarda carregar
        await screen.findByText('Metricas Mercado Livre')

        // Deve exibir o banner de governanca
        expect(screen.getByText('Simulacao Local Mockada')).toBeInTheDocument()
        expect(screen.getByText(/Calculos baseados em simulacao mockada\/local/i)).toBeInTheDocument()
    })

    it('deve exibir os resultados simulados com sucesso quando a API mockada resolver', async () => {
        vi.spyOn(precificacaoService, 'simularTaxasMercadoLivreLocal').mockResolvedValue({
            preco_venda: 120.00,
            custo_produto: 70.00,
            comissao: 14.40,
            taxa_comissao_percentual: 0.12,
            tarifa_fixa: 0.00,
            total_comissao: 14.40,
            custo_logistico_aplicado: 22.00,
            imposto_calculado: 4.80,
            lucro_liquido: 8.80,
            margem_liquida: 0.0733,
            roi: 0.1257,
            preco_minimo_recomendado: 79.00,
            warnings: []
        })

        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })
        fireEvent.click(screen.getByText('Simulador de Precificação'))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Deve renderizar os resultados mockados
        expect(await screen.findByText('Metricas Mercado Livre')).toBeInTheDocument()
        expect(await screen.findByText(/R\$\s*8[.,]80/)).toBeInTheDocument() // Lucro Liquido
        expect(await screen.findByText(/7[.,]33%/)).toBeInTheDocument() // Margem Liquida
        expect(await screen.findByText(/12[.,]57%/)).toBeInTheDocument() // ROI
    })

    it('deve recalcular valores interativamente ao alterar inputs do Mercado Livre', async () => {
        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText('Simulador de Precificação'))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Com o preco de venda inicial (120) e custo inicial (45)
        // Com aliquota = 4.0%, peso = 500, reputacao = green, category = MLB1234, listing_type = gold_special
        // Pela logica real em TS:
        // preco_venda = 120, custo = 45, imposto = 4.80, comissao = 14.40, frete = 12.60
        // Lucro = 120 - 45 - 4.80 - 14.40 - 12.60 = 43.20
        expect(await screen.findByText('Metricas Mercado Livre')).toBeInTheDocument()
        expect(await screen.findByText(/R\$\s*43[.,]20/)).toBeInTheDocument()

        // Localizar e alterar o preco de venda para R$ 150.00
        const precoInput = screen.getByLabelText('Preco de Venda Gerencial (R$)')
        fireEvent.change(precoInput, { target: { value: '150.00' } })

        // Localizar e alterar o custo do produto para R$ 60.00
        const custoInput = screen.getByLabelText('Custo do Produto - COGS (R$)')
        fireEvent.change(custoInput, { target: { value: '60.00' } })

        // Recalculo esperado:
        // preco_venda = 150, custo = 60, imposto = 6.00, comissao = 18.00, frete = 12.60
        // Lucro = 150 - 60 - 6.00 - 18.00 - 12.60 = 53.40
        await waitFor(() => {
            expect(screen.getByText(/R\$\s*53[.,]40/)).toBeInTheDocument()
        })

        // Confirmar que o banner aparece
        expect(screen.getByText('Simulacao Local Mockada')).toBeInTheDocument()
    })

    describe('CustosMargem - Simulador Padrao (Regressao)', () => {
        it('deve renderizar os inputs do simulador padrao e exibir resultados', async () => {
            render(<CustosMargem />)

            await waitFor(() => {
                expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
            })

            fireEvent.click(screen.getByText('Simulador de Precificação'))

            // Simulador Padrao deve estar ativo
            expect(screen.getByText('Custos Físicos de Aquisição')).toBeInTheDocument()
            expect(screen.getByText('Custos do Canal, Impostos e Ads')).toBeInTheDocument()
            expect(screen.getByText('Métricas de Performance Simulação')).toBeInTheDocument()

            // Campos especificos
            expect(screen.getByText('Preço de Venda Gerencial (R$)')).toBeInTheDocument()
            expect(screen.getByText('Custo de Aquisição do Produto (R$)')).toBeInTheDocument()
            expect(screen.getByText('Custo Prep Center (R$)')).toBeInTheDocument()
            expect(screen.getByText('Custo de Embalagem (R$)')).toBeInTheDocument()
            expect(screen.getByText('Custo Frete Inbound / Envio FBA (R$)')).toBeInTheDocument()
            expect(screen.getByText('Outros Custos Extras (R$)')).toBeInTheDocument()

            // Resultados calculados iniciais
            expect(screen.getByText('Lucro Líquido Unitário')).toBeInTheDocument()
            expect(screen.getByText('Margem Líquida')).toBeInTheDocument()
            expect(screen.getByText('ROI Estimado')).toBeInTheDocument()
        })
    })
})
