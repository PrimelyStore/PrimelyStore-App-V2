import { supabase } from '../lib/supabase'

export type StatusConciliacaoOlistAmazon =
    | 'match_olist_amazon'
    | 'somente_olist'
    | 'somente_amazon'
    | 'indefinido'

export type OlistAmazonFBAConciliacao = {
    sku_conciliacao: string | null
    status_conciliacao: StatusConciliacaoOlistAmazon
    descricao_status: string | null

    olist_snapshot_id: string | null
    id_produto_olist: number | null
    sku_olist: string | null
    produto_olist: string | null
    situacao_olist: string | null
    tipo_olist: string | null
    gtin_olist: string | null
    preco_olist: number | null
    preco_custo_olist: number | null
    preco_custo_medio_olist: number | null
    estoque_quantidade_olist: number | null
    olist_sincronizado_em: string | null

    amazon_snapshot_id: string | null
    marketplace_id: string | null
    sku_amazon: string | null
    asin: string | null
    fn_sku: string | null
    produto_amazon: string | null
    condicao_amazon: string | null
    amazon_disponivel: number | null
    amazon_reservado: number | null
    amazon_em_pesquisa: number | null
    amazon_indisponivel: number | null
    amazon_total: number | null
    amazon_last_updated_time: string | null
    amazon_sincronizado_em: string | null

    amazon_tem_estoque: boolean | null
    alerta_amazon_com_estoque_sem_olist: boolean
    ordem_prioridade: number
}

export type ResumoConciliacaoOlistAmazon = {
    total_registros: number
    total_match: number
    total_somente_olist: number
    total_somente_amazon: number
    total_alertas: number
    total_amazon: number
    disponivel_amazon: number
    reservado_amazon: number
    pesquisa_amazon: number
    indisponivel_amazon: number
}

function numeroSeguro(valor: number | null | undefined) {
    return Number(valor ?? 0)
}

export async function buscarConciliacaoOlistAmazonFBA() {
    const { data, error } = await supabase
        .from('olist_amazon_fba_conciliacao')
        .select('*')
        .order('ordem_prioridade', { ascending: true })
        .order('amazon_total', { ascending: false, nullsFirst: false })
        .order('sku_conciliacao', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as OlistAmazonFBAConciliacao[]
}

export async function buscarResumoConciliacaoOlistAmazonFBA() {
    const dados = await buscarConciliacaoOlistAmazonFBA()

    return dados.reduce<ResumoConciliacaoOlistAmazon>(
        (resumo, item) => {
            resumo.total_registros += 1

            if (item.status_conciliacao === 'match_olist_amazon') {
                resumo.total_match += 1
            }

            if (item.status_conciliacao === 'somente_olist') {
                resumo.total_somente_olist += 1
            }

            if (item.status_conciliacao === 'somente_amazon') {
                resumo.total_somente_amazon += 1
            }

            if (item.alerta_amazon_com_estoque_sem_olist) {
                resumo.total_alertas += 1
            }

            resumo.total_amazon += numeroSeguro(item.amazon_total)
            resumo.disponivel_amazon += numeroSeguro(item.amazon_disponivel)
            resumo.reservado_amazon += numeroSeguro(item.amazon_reservado)
            resumo.pesquisa_amazon += numeroSeguro(item.amazon_em_pesquisa)
            resumo.indisponivel_amazon += numeroSeguro(item.amazon_indisponivel)

            return resumo
        },
        {
            total_registros: 0,
            total_match: 0,
            total_somente_olist: 0,
            total_somente_amazon: 0,
            total_alertas: 0,
            total_amazon: 0,
            disponivel_amazon: 0,
            reservado_amazon: 0,
            pesquisa_amazon: 0,
            indisponivel_amazon: 0,
        }
    )
}
