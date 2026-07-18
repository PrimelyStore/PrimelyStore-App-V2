import type {
  SimulacaoMercadoLivreInput,
  SimulacaoMercadoLivreResultado,
  SimulacaoMercadoLivreWarning
} from './types'

export async function simularTaxasMercadoLivreLocal(
  input: SimulacaoMercadoLivreInput
): Promise<SimulacaoMercadoLivreResultado> {
  // 1. Validacoes locais de seguranca e formato com Number.isFinite
  if (typeof input.preco_venda !== 'number' || !Number.isFinite(input.preco_venda)) {
    throw new Error("Preco de venda deve ser um numero finito.")
  }
  if (input.preco_venda <= 0) {
    throw new Error("Preco de venda deve ser maior que zero.")
  }

  if (typeof input.custo_produto !== 'number' || !Number.isFinite(input.custo_produto)) {
    throw new Error("Custo do produto deve ser um numero finito.")
  }
  if (input.custo_produto < 0) {
    throw new Error("Custo do produto nao pode ser negativo.")
  }

  if (typeof input.aliquota_imposto !== 'number' || !Number.isFinite(input.aliquota_imposto)) {
    throw new Error("Aliquota de imposto deve ser um numero finito.")
  }
  if (input.aliquota_imposto < 0 || input.aliquota_imposto > 1) {
    throw new Error("Aliquota de imposto deve estar entre 0% e 100%.")
  }

  if (input.peso_gramas !== undefined && input.peso_gramas !== null) {
    if (typeof input.peso_gramas !== 'number' || !Number.isFinite(input.peso_gramas)) {
      throw new Error("Peso em gramas deve ser um numero finito.")
    }
    if (input.peso_gramas < 0) {
      throw new Error("Peso nao pode ser negativo.")
    }
  }

  if (input.custo_logistico_sem_frete !== undefined && input.custo_logistico_sem_frete !== null) {
    if (typeof input.custo_logistico_sem_frete !== 'number' || !Number.isFinite(input.custo_logistico_sem_frete)) {
      throw new Error("Custo logistico sem frete deve ser um numero finito.")
    }
    if (input.custo_logistico_sem_frete < 0) {
      throw new Error("Custo logistico sem frete nao pode ser negativo.")
    }
  }

  if (input.custo_logistico_frete_gratis !== undefined && input.custo_logistico_frete_gratis !== null) {
    if (typeof input.custo_logistico_frete_gratis !== 'number' || !Number.isFinite(input.custo_logistico_frete_gratis)) {
      throw new Error("Custo logistico de frete gratis deve ser um numero finito.")
    }
    if (input.custo_logistico_frete_gratis < 0) {
      throw new Error("Custo logistico de frete gratis nao pode ser negativo.")
    }
  }

  // 2. Definicao de Fixtures ficticias locais de taxas e frete
  const limiteTarifaFixa = 79.00
  const tarifaFixaValor = 6.00

  // Comissao padrao
  const comissaoPadrao = {
    gold_special: 0.12, // 12%
    gold_pro: 0.17, // 17%
  }

  // Comissoes por categoria
  const comissaoEspecialPorCategoria: Record<string, { gold_special: number; gold_pro: number }> = {
    "MLB12345": { gold_special: 0.10, gold_pro: 0.15 },
    "MLB67890": { gold_special: 0.14, gold_pro: 0.19 },
  }

  // Matriz de Fretes
  const matrizFrete = [
    { maxGramas: 500, valorBase: 18.00 },
    { maxGramas: 1000, valorBase: 22.00 },
    { maxGramas: 2000, valorBase: 26.00 },
    { maxGramas: 5000, valorBase: 32.00 },
    { maxGramas: Infinity, valorBase: 45.00 },
  ]

  // Descontos por reputacao
  const descontosReputacao = {
    "official_store": 0.50,
    "platinum": 0.50,
    "gold": 0.40,
    "green": 0.30,
    "none": 0.00,
  }

  // 3. Calculo da comissao
  const catId = input.category_id || "MLB"
  const regrasCat = comissaoEspecialPorCategoria[catId]
  const taxaComissaoPercentual = regrasCat
    ? (input.listing_type_id === "gold_pro" ? regrasCat.gold_pro : regrasCat.gold_special)
    : (input.listing_type_id === "gold_pro" ? comissaoPadrao.gold_pro : comissaoPadrao.gold_special)

  const comissaoVal = Number((input.preco_venda * taxaComissaoPercentual).toFixed(2))
  const tarifaFixa = input.preco_venda < limiteTarifaFixa ? tarifaFixaValor : 0
  const totalComissao = Number((comissaoVal + tarifaFixa).toFixed(2))

  // 4. Calculo de frete gratis base (logistica)
  const pesoEfetivo = input.peso_gramas ?? 0
  const faixaFrete = matrizFrete.find((f) => pesoEfetivo <= f.maxGramas) || matrizFrete[matrizFrete.length - 1]
  const descontoRep = descontosReputacao[input.reputacao] || 0
  const freteGratisCalculado = Number((faixaFrete.valorBase * (1 - descontoRep)).toFixed(2))

  // 5. Custo logistico aplicado
  const custoLogisticoAplicado: number = input.preco_venda >= limiteTarifaFixa
    ? (input.custo_logistico_frete_gratis && input.custo_logistico_frete_gratis > 0
      ? input.custo_logistico_frete_gratis
      : freteGratisCalculado)
    : (input.custo_logistico_sem_frete && input.custo_logistico_sem_frete > 0
      ? input.custo_logistico_sem_frete
      : 0)

  // 6. Imposto
  const impostoCalculado = Number((input.preco_venda * input.aliquota_imposto).toFixed(2))

  // 7. Lucro Liquido, Margem e ROI
  const lucroLiquido = Number((input.preco_venda - input.custo_produto - impostoCalculado - totalComissao - custoLogisticoAplicado).toFixed(2))
  const margemLiquida = input.preco_venda > 0 ? Number((lucroLiquido / input.preco_venda).toFixed(4)) : 0
  const roi = input.custo_produto > 0 ? Number((lucroLiquido / input.custo_produto).toFixed(4)) : 0

  // 8. Calculo de Preco Minimo Recomendado (Break-even)
  const divisor = 1 - input.aliquota_imposto - taxaComissaoPercentual
  let precoMinimoRecomendado = 0
  if (divisor > 0) {
    const custoLogSemFrete = input.custo_logistico_sem_frete && input.custo_logistico_sem_frete > 0
      ? input.custo_logistico_sem_frete
      : 0
    const custoLogFreteGratis = input.custo_logistico_frete_gratis && input.custo_logistico_frete_gratis > 0
      ? input.custo_logistico_frete_gratis
      : freteGratisCalculado

    const precoBaixoCusto = (input.custo_produto + tarifaFixaValor + custoLogSemFrete) / divisor
    const precoAltoCusto = (input.custo_produto + custoLogFreteGratis) / divisor

    const eValidoBaixoCusto = precoBaixoCusto < limiteTarifaFixa
    const eValidoAltoCusto = precoAltoCusto >= limiteTarifaFixa

    if (eValidoBaixoCusto && !eValidoAltoCusto) {
      precoMinimoRecomendado = Number(precoBaixoCusto.toFixed(2))
    } else if (!eValidoBaixoCusto && eValidoAltoCusto) {
      precoMinimoRecomendado = Number(precoAltoCusto.toFixed(2))
    } else if (eValidoBaixoCusto && eValidoAltoCusto) {
      precoMinimoRecomendado = Number(Math.min(precoBaixoCusto, precoAltoCusto).toFixed(2))
    } else {
      // Zona de descontinuidade em R$ 79.00
      const comissaoNoLimite = limiteTarifaFixa * taxaComissaoPercentual
      const impostoNoLimite = limiteTarifaFixa * input.aliquota_imposto
      const lucroNoLimite = limiteTarifaFixa - input.custo_produto - impostoNoLimite - comissaoNoLimite - custoLogFreteGratis
      if (lucroNoLimite >= 0) {
        precoMinimoRecomendado = limiteTarifaFixa
      } else {
        precoMinimoRecomendado = Number(precoAltoCusto.toFixed(2))
      }
    }
  }

  // 9. Warnings
  const warnings: SimulacaoMercadoLivreWarning[] = []
  if (lucroLiquido < 0) {
    warnings.push({
      codigo: "lucro_negativo",
      mensagem: "Lucro liquido estimado esta negativo. Revise o preco de venda ou custos."
    })
  }
  if (input.preco_venda < precoMinimoRecomendado) {
    warnings.push({
      codigo: "preco_abaixo_break_even",
      mensagem: `Preco de venda esta abaixo do preco minimo recomendado de R$ ${precoMinimoRecomendado.toFixed(2)}.`
    })
  }

  return {
    preco_venda: input.preco_venda,
    custo_produto: input.custo_produto,
    comissao: comissaoVal,
    taxa_comissao_percentual: taxaComissaoPercentual,
    tarifa_fixa: tarifaFixa,
    total_comissao: totalComissao,
    custo_logistico_aplicado: custoLogisticoAplicado,
    imposto_calculado: impostoCalculado,
    lucro_liquido: lucroLiquido,
    margem_liquida: margemLiquida,
    roi: roi,
    preco_minimo_recomendado: precoMinimoRecomendado,
    warnings: warnings,
    is_mocked: true
  }
}
