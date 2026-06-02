import { supabase } from '../lib/supabase'

type NumeroBanco = number | string | null

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type CurvaAbcItem = {
  produto_id: string | null
  sku: string | null
  produto_nome: string | null
  marca: string | null
  categoria: string | null
  asin: string | null

  // Faturamento
  faturamento_total: NumeroBanco
  quantidade_total: NumeroBanco
  total_pedidos: NumeroBanco
  ticket_medio: NumeroBanco
  percentual_faturamento: NumeroBanco
  percentual_acumulado: NumeroBanco
  ranking_faturamento: NumeroBanco

  // Custo e margem (fonte: NFs de entrada Olist)
  custo_medio_unitario: NumeroBanco
  custo_total_estimado: NumeroBanco
  lucro_estimado: NumeroBanco
  margem_estimada_percentual: NumeroBanco
  total_notas_entrada: NumeroBanco
  ranking_margem: NumeroBanco

  // Classificações
  curva_faturamento: 'A' | 'B' | 'C' | string | null
  curva_margem: 'A' | 'B' | 'C' | 'sem_custo' | string | null
}

export type CurvaAbcResumo = {
  // Totais gerais
  total_produtos: number
  quantidade_total_geral: number
  faturamento_total_geral: number

  // Por curva de faturamento
  total_curva_fat_a: number
  total_curva_fat_b: number
  total_curva_fat_c: number
  faturamento_curva_a: number
  faturamento_curva_b: number
  faturamento_curva_c: number
  percentual_produtos_curva_a: number

  // Por curva de margem
  total_curva_margem_a: number
  total_curva_margem_b: number
  total_curva_margem_c: number
  total_sem_custo: number
  lucro_estimado_total: number
  margem_media_geral: number
}

// ─── Tipos de ordenação ──────────────────────────────────────────────────────

export type OrdenacaoCurvaAbc = 'faturamento' | 'margem'

export type FiltrosCurvaAbc = {
  curvaFaturamento?: 'A' | 'B' | 'C' | 'todas'
  curvaMargem?: 'A' | 'B' | 'C' | 'sem_custo' | 'todas'
  busca?: string
  ordenacao?: OrdenacaoCurvaAbc
}

// ─── Funções de serviço ──────────────────────────────────────────────────────

/**
 * Busca todos os produtos classificados na Curva ABC.
 * Somente leitura. Baseado em snapshots do Olist.
 */
export async function buscarCurvaAbc(): Promise<CurvaAbcItem[]> {
  const { data, error } = await supabase
    .from('olist_curva_abc_view')
    .select('*')
    .order('ranking_faturamento', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar Curva ABC: ${error.message}`)
  }

  return (data ?? []) as CurvaAbcItem[]
}

// ─── Cálculo do resumo (feito no frontend a partir dos dados já carregados) ──

/**
 * Calcula os KPIs de resumo da Curva ABC a partir dos itens já carregados.
 */
export function calcularResumoCurvaAbc(itens: CurvaAbcItem[]): CurvaAbcResumo {
  const toNum = (v: NumeroBanco): number => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = Number(v)
      return Number.isNaN(n) ? 0 : n
    }
    return 0
  }

  const toNumNullable = (v: NumeroBanco): number | null => {
    if (v === null || v === undefined) return null
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = Number(v)
      return Number.isNaN(n) ? null : n
    }
    return null
  }

  // Curva por faturamento
  const fatA = itens.filter((i) => i.curva_faturamento === 'A')
  const fatB = itens.filter((i) => i.curva_faturamento === 'B')
  const fatC = itens.filter((i) => i.curva_faturamento === 'C')

  // Curva por margem
  const margemA = itens.filter((i) => i.curva_margem === 'A')
  const margemB = itens.filter((i) => i.curva_margem === 'B')
  const margemC = itens.filter((i) => i.curva_margem === 'C')
  const semCusto = itens.filter((i) => i.curva_margem === 'sem_custo')

  const faturamentoTotal = itens.reduce((acc, i) => acc + toNum(i.faturamento_total), 0)
  const quantidadeTotal = itens.reduce((acc, i) => acc + toNum(i.quantidade_total), 0)
  const lucroTotal = itens.reduce((acc, i) => acc + toNum(i.lucro_estimado), 0)

  // Margem média geral (só de produtos com custo)
  const itensComMargem = itens.filter((i) => toNumNullable(i.margem_estimada_percentual) !== null)
  const margemMedia =
    itensComMargem.length > 0
      ? itensComMargem.reduce((acc, i) => acc + toNum(i.margem_estimada_percentual), 0) /
        itensComMargem.length
      : 0

  return {
    total_produtos: itens.length,
    quantidade_total_geral: quantidadeTotal,
    faturamento_total_geral: faturamentoTotal,

    total_curva_fat_a: fatA.length,
    total_curva_fat_b: fatB.length,
    total_curva_fat_c: fatC.length,
    faturamento_curva_a: fatA.reduce((acc, i) => acc + toNum(i.faturamento_total), 0),
    faturamento_curva_b: fatB.reduce((acc, i) => acc + toNum(i.faturamento_total), 0),
    faturamento_curva_c: fatC.reduce((acc, i) => acc + toNum(i.faturamento_total), 0),
    percentual_produtos_curva_a:
      itens.length > 0 ? Math.round((fatA.length / itens.length) * 10000) / 100 : 0,

    total_curva_margem_a: margemA.length,
    total_curva_margem_b: margemB.length,
    total_curva_margem_c: margemC.length,
    total_sem_custo: semCusto.length,
    lucro_estimado_total: lucroTotal,
    margem_media_geral: Math.round(margemMedia * 100) / 100,
  }
}

// ─── Filtro e ordenação local ────────────────────────────────────────────────

/**
 * Aplica filtros e ordenação nos itens já carregados (sem nova consulta ao banco).
 */
export function filtrarEOrdenarCurvaAbc(
  itens: CurvaAbcItem[],
  filtros: FiltrosCurvaAbc
): CurvaAbcItem[] {
  let lista = [...itens]

  // Filtro por curva de faturamento
  if (filtros.curvaFaturamento && filtros.curvaFaturamento !== 'todas') {
    lista = lista.filter((i) => i.curva_faturamento === filtros.curvaFaturamento)
  }

  // Filtro por curva de margem
  if (filtros.curvaMargem && filtros.curvaMargem !== 'todas') {
    lista = lista.filter((i) => i.curva_margem === filtros.curvaMargem)
  }

  // Filtro de busca
  if (filtros.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim().toLowerCase()
    lista = lista.filter(
      (i) =>
        i.sku?.toLowerCase().includes(termo) ||
        i.produto_nome?.toLowerCase().includes(termo) ||
        i.asin?.toLowerCase().includes(termo) ||
        i.marca?.toLowerCase().includes(termo) ||
        i.categoria?.toLowerCase().includes(termo)
    )
  }

  // Ordenação
  if (filtros.ordenacao === 'margem') {
    const toNum = (v: NumeroBanco) => {
      if (typeof v === 'number') return v
      if (typeof v === 'string') return Number(v) || 0
      return -Infinity
    }
    lista.sort((a, b) => {
      const ma = a.margem_estimada_percentual !== null ? toNum(a.margem_estimada_percentual) : -Infinity
      const mb = b.margem_estimada_percentual !== null ? toNum(b.margem_estimada_percentual) : -Infinity
      return mb - ma
    })
  }
  // Ordenação por faturamento (padrão): já vem ordenada do banco pelo ranking_faturamento

  return lista
}
