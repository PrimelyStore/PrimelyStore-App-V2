import { supabase } from '../lib/supabase'

export type StatusConciliacaoFbaTresPontas =
    | 'conciliado_tres'
    | 'divergente_tres'
    | 'saldo_negativo_olist'
    | 'amazon_olist_sem_primely'
    | 'amazon_primely_sem_olist'
    | 'olist_primely_sem_amazon'
    | 'somente_amazon'
    | 'somente_olist_saldo_zero'
    | 'somente_olist_com_saldo'
    | 'somente_primely'
    | 'indefinido'

export type StatusPresencaFbaTresPontas =
    | 'existe_nos_tres'
    | 'amazon_olist_sem_primely'
    | 'amazon_primely_sem_olist'
    | 'olist_primely_sem_amazon'
    | 'somente_amazon'
    | 'somente_olist'
    | 'somente_primely'
    | 'indefinido'

export type AmazonOlistPrimelyFbaConciliacao = {
    sku: string | null

    produto_amazon: string | null
    produto_olist: string | null
    produto_primely: string | null
    produto_nome: string | null

    asin: string | null

    amazon_total: number | null
    amazon_disponivel: number | null
    amazon_reservado: number | null
    amazon_em_pesquisa: number | null
    amazon_indisponivel: number | null

    id_deposito_olist: number | null
    deposito_olist: string | null
    olist_local_estoque_id: string | null
    olist_local_estoque_nome: string | null

    olist_fba_saldo: number | null
    olist_fba_reservado: number | null
    olist_fba_disponivel: number | null

    produto_id_primely: string | null
    primely_local_estoque_id: string | null
    primely_local_estoque_nome: string | null
    primely_fba_saldo: number | null

    diferenca_amazon_olist: number | null
    diferenca_amazon_primely: number | null
    diferenca_olist_primely: number | null

    diferenca_abs_amazon_olist: number | null
    diferenca_abs_amazon_primely: number | null
    diferenca_abs_olist_primely: number | null

    amazon_sincronizado_em: string | null
    olist_sincronizado_em: string | null

    status_presenca: StatusPresencaFbaTresPontas
    status_conciliacao: StatusConciliacaoFbaTresPontas

    alerta_operacional: boolean
    descricao_status: string | null
    ordem_prioridade: number | null
}

export type ResumoAmazonOlistPrimelyFbaConciliacao = {
    total_linhas: number
    total_skus: number

    total_conciliado_tres: number
    total_divergente_tres: number
    total_saldo_negativo_olist: number
    total_somente_amazon: number
    total_somente_olist_com_saldo: number
    total_somente_olist_saldo_zero: number
    total_somente_primely: number
    total_alertas: number

    amazon_total: number
    amazon_disponivel: number
    amazon_reservado: number
    amazon_em_pesquisa: number
    amazon_indisponivel: number

    olist_fba_total: number
    primely_fba_total: number

    diferenca_amazon_olist_total: number
    diferenca_amazon_primely_total: number
    diferenca_olist_primely_total: number
}

function numeroSeguro(valor: number | null | undefined) {
    return Number(valor ?? 0)
}

export async function buscarConciliacaoAmazonOlistPrimelyFba() {
    const { data, error } = await supabase
        .from('amazon_olist_primely_fba_conciliacao')
        .select('*')
        .order('ordem_prioridade', { ascending: true, nullsFirst: false })
        .order('diferenca_abs_amazon_olist', {
            ascending: false,
            nullsFirst: false,
        })
        .order('sku', { ascending: true, nullsFirst: false })

    if (error) {
        throw new Error(error.message)
    }

    return data as AmazonOlistPrimelyFbaConciliacao[]
}

export async function buscarResumoAmazonOlistPrimelyFbaConciliacao() {
    const dados = await buscarConciliacaoAmazonOlistPrimelyFba()
    const skus = new Set<string>()

    return dados.reduce<ResumoAmazonOlistPrimelyFbaConciliacao>(
        (resumo, item) => {
            resumo.total_linhas += 1

            if (item.sku) {
                skus.add(item.sku)
                resumo.total_skus = skus.size
            }

            if (item.status_conciliacao === 'conciliado_tres') {
                resumo.total_conciliado_tres += 1
            }

            if (item.status_conciliacao === 'divergente_tres') {
                resumo.total_divergente_tres += 1
            }

            if (item.status_conciliacao === 'saldo_negativo_olist') {
                resumo.total_saldo_negativo_olist += 1
            }

            if (item.status_conciliacao === 'somente_amazon') {
                resumo.total_somente_amazon += 1
            }

            if (item.status_conciliacao === 'somente_olist_com_saldo') {
                resumo.total_somente_olist_com_saldo += 1
            }

            if (item.status_conciliacao === 'somente_olist_saldo_zero') {
                resumo.total_somente_olist_saldo_zero += 1
            }

            if (item.status_conciliacao === 'somente_primely') {
                resumo.total_somente_primely += 1
            }

            if (item.alerta_operacional) {
                resumo.total_alertas += 1
            }

            resumo.amazon_total += numeroSeguro(item.amazon_total)
            resumo.amazon_disponivel += numeroSeguro(item.amazon_disponivel)
            resumo.amazon_reservado += numeroSeguro(item.amazon_reservado)
            resumo.amazon_em_pesquisa += numeroSeguro(item.amazon_em_pesquisa)
            resumo.amazon_indisponivel += numeroSeguro(item.amazon_indisponivel)

            resumo.olist_fba_total += numeroSeguro(item.olist_fba_saldo)
            resumo.primely_fba_total += numeroSeguro(item.primely_fba_saldo)

            resumo.diferenca_amazon_olist_total += numeroSeguro(
                item.diferenca_amazon_olist
            )
            resumo.diferenca_amazon_primely_total += numeroSeguro(
                item.diferenca_amazon_primely
            )
            resumo.diferenca_olist_primely_total += numeroSeguro(
                item.diferenca_olist_primely
            )

            return resumo
        },
        {
            total_linhas: 0,
            total_skus: 0,

            total_conciliado_tres: 0,
            total_divergente_tres: 0,
            total_saldo_negativo_olist: 0,
            total_somente_amazon: 0,
            total_somente_olist_com_saldo: 0,
            total_somente_olist_saldo_zero: 0,
            total_somente_primely: 0,
            total_alertas: 0,

            amazon_total: 0,
            amazon_disponivel: 0,
            amazon_reservado: 0,
            amazon_em_pesquisa: 0,
            amazon_indisponivel: 0,

            olist_fba_total: 0,
            primely_fba_total: 0,

            diferenca_amazon_olist_total: 0,
            diferenca_amazon_primely_total: 0,
            diferenca_olist_primely_total: 0,
        }
    )
}
