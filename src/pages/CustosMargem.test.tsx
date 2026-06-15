import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustosMargem } from './CustosMargem'
import type { MercadoLivreFeesProvider } from '../services/mercadoLivreFees/MercadoLivreFeesProvider'
import type { MercadoLivreSimulacaoResultado } from '../services/mercadoLivreFees/types'

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
        // simularTaxasMercadoLivreLocal NAO e mockada no topo para permitir testar o provider padrao real offline.
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

describe('CustosMargem - Simulador Mercado Livre (Fase 5.5L-6G.4)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('1. deve chamar o provider injetado quando o modo Mercado Livre esta ativo', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockResolvedValue({
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
                warnings: [],
                provider_source: 'local_mock'
            })
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        // Ir para simulador
        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        await waitFor(() => {
            expect(mockProvider.simularTaxas).toHaveBeenCalled()
        })
    })

    it('2. deve garantir que o payload enviado ao provider contem os valores informados na tela', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockResolvedValue({
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
                warnings: [],
                provider_source: 'local_mock'
            })
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        await waitFor(() => {
            expect(mockProvider.simularTaxas).toHaveBeenCalledWith(expect.objectContaining({
                preco_venda: 120,
                custo_produto: 45,
                aliquota_imposto: 0.04,
                peso_gramas: 500,
                reputacao: 'green',
                category_id: 'MLB1234',
                listing_type_id: 'gold_special',
                custo_logistico_sem_frete: 0,
                custo_logistico_frete_gratis: 0
            }))
        })
    })

    it('3. deve garantir que o resultado retornado pelo provider e exibido nos cards', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockResolvedValue({
                preco_venda: 150.00,
                custo_produto: 60.00,
                comissao: 18.00,
                taxa_comissao_percentual: 0.12,
                tarifa_fixa: 0.00,
                total_comissao: 18.00,
                custo_logistico_aplicado: 15.00,
                imposto_calculado: 6.00,
                lucro_liquido: 51.00,
                margem_liquida: 0.34,
                roi: 0.85,
                preco_minimo_recomendado: 95.00,
                warnings: [],
                provider_source: 'local_mock'
            })
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        await screen.findByText('Metricas Mercado Livre')

        expect(screen.getByText(/R\$\s*51[.,]00/)).toBeInTheDocument() // Lucro Liquido Unitario
        expect(screen.getByText(/34[.,]00%/)).toBeInTheDocument() // Margem Liquida
        expect(screen.getByText(/85[.,]00%/)).toBeInTheDocument() // ROI
    })

    it('4. deve garantir que warnings retornados pelo provider sao exibidos na tela', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockResolvedValue({
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
                warnings: [
                    { codigo: 'WARN_TEST_A', mensagem: 'Primeiro warning mockado' },
                    { codigo: 'WARN_TEST_B', mensagem: 'Segundo warning mockado' }
                ],
                provider_source: 'local_mock'
            })
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        await screen.findByText('Metricas Mercado Livre')

        expect(screen.getByText('Primeiro warning mockado')).toBeInTheDocument()
        expect(screen.getByText('Segundo warning mockado')).toBeInTheDocument()
    })

    it('5. deve exibir o estado de loading enquanto a Promise esta pendente', async () => {
        let resolvePromise!: (val: MercadoLivreSimulacaoResultado) => void
        const promisePendente = new Promise<MercadoLivreSimulacaoResultado>((resolve) => {
            resolvePromise = resolve
        })

        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockReturnValue(promisePendente)
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Deve exibir loading
        expect(screen.getByText('Simulando taxas...')).toBeInTheDocument()

        resolvePromise({
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
            warnings: [],
            provider_source: 'local_mock'
        })

        await waitFor(() => {
            expect(screen.queryByText('Simulando taxas...')).not.toBeInTheDocument()
        })
    })

    it('6. deve exibir mensagem local amigavel quando o provider rejeita a simulacao', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockRejectedValue(new Error('Alguma falha interna de rede ou calculo'))
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        expect(await screen.findByText('Erro na Simulacao')).toBeInTheDocument()
        expect(await screen.findByText('Nao foi possivel concluir a simulacao local. Revise os valores informados.')).toBeInTheDocument()
    })

    it('7. deve garantir que o banner de simulacao mockada/local permanece visivel', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockResolvedValue({
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
                warnings: [],
                provider_source: 'local_mock'
            })
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        await screen.findByText('Metricas Mercado Livre')

        expect(screen.getByText('Simulacao Local Mockada')).toBeInTheDocument()
        expect(screen.getByText(/Calculos baseados em simulacao mockada\/local/i)).toBeInTheDocument()
    })

    it('8. deve garantir que o simulador padrao continua funcionando', async () => {
        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))

        expect(screen.getByText(/Custos.*de Aquisi/i)).toBeInTheDocument()
        expect(screen.getByText(/Custos do Canal/i)).toBeInTheDocument()
        expect(screen.getByText(/Performance Simula/i)).toBeInTheDocument()
        expect(screen.getByText(/Lucro L.quido Unit.rio/i)).toBeInTheDocument()
    })

    it('9. deve validar o fallback do provider padrao quando nenhum provider e injetado', async () => {
        render(<CustosMargem />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // O fallback padrao chama LocalMockMercadoLivreFeesProvider (teste de integracao local offline).
        // Validamos a renderizacao das metricas e do banner de simulacao mockada, sem acoplamento a valores de calculo especificos.
        await screen.findByText('Metricas Mercado Livre')
        expect(screen.getByText('Simulacao Local Mockada')).toBeInTheDocument()
        expect(screen.queryByText('Erro na Simulacao')).not.toBeInTheDocument()
    })

    it('10. deve recalcular valores interativamente ao alterar inputs do Mercado Livre usando provider injetado', async () => {
        const mockProvider: MercadoLivreFeesProvider = {
            id: 'mock_test_provider',
            simularTaxas: vi.fn().mockImplementation((input) => {
                if (input.preco_venda === 150) {
                    return Promise.resolve({
                        preco_venda: 150.00,
                        custo_produto: 60.00,
                        comissao: 18.00,
                        taxa_comissao_percentual: 0.12,
                        tarifa_fixa: 0.00,
                        total_comissao: 18.00,
                        custo_logistico_aplicado: 15.00,
                        imposto_calculado: 6.00,
                        lucro_liquido: 51.00,
                        margem_liquida: 0.34,
                        roi: 0.85,
                        preco_minimo_recomendado: 95.00,
                        warnings: [],
                        provider_source: 'local_mock'
                    })
                }
                return Promise.resolve({
                    preco_venda: 120.00,
                    custo_produto: 45.00,
                    comissao: 14.40,
                    taxa_comissao_percentual: 0.12,
                    tarifa_fixa: 0.00,
                    total_comissao: 14.40,
                    custo_logistico_aplicado: 12.60,
                    imposto_calculado: 4.80,
                    lucro_liquido: 43.20,
                    margem_liquida: 0.36,
                    roi: 0.96,
                    preco_minimo_recomendado: 75.00,
                    warnings: [],
                    provider_source: 'local_mock'
                })
            })
        }

        render(<CustosMargem mercadoLivreFeesProvider={mockProvider} />)

        await waitFor(() => {
            expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument()
        })

        fireEvent.click(screen.getByText(/Simulador de Precifica/i))
        fireEvent.click(screen.getByRole('button', { name: 'Mercado Livre' }))

        // Aguarda carregar valores padrao
        await screen.findByText('Metricas Mercado Livre')
        expect(screen.getByText(/R\$\s*43[.,]20/)).toBeInTheDocument()

        // Alterar o preco de venda para 150.00
        const precoInput = screen.getByLabelText('Preco de Venda Gerencial (R$)')
        fireEvent.change(precoInput, { target: { value: '150.00' } })

        // Alterar o custo para 60.00
        const custoInput = screen.getByLabelText('Custo do Produto - COGS (R$)')
        fireEvent.change(custoInput, { target: { value: '60.00' } })

        // Deve recalcular usando o mock e exibir os novos valores de lucro 51.00
        await waitFor(() => {
            expect(screen.getByText(/R\$\s*51[.,]00/)).toBeInTheDocument()
            expect(screen.getByText(/34[.,]00%/)).toBeInTheDocument()
            expect(screen.getByText(/85[.,]00%/)).toBeInTheDocument()
        })
    })
})
