import { supabase } from '../lib/supabase'

export type StatusConciliacaoOlistPrimely =
    | 'conciliado'
    | 'divergente'
    | 'somente_olist_com_saldo'
    | 'saldo_zero_olist'
    | 'saldo_negativo_olist'
    | 'somente_olist'
    | 'somente_primely'
    | 'indefinido'

export type OlistPrimelyEstoqueConciliacao = {
    sku: string | null

    id_produto_olist: number | null
    produto_nome_olist: string | null

    produto_id_primely: string | null
    produto_nome_primely: string | null

    produto_nome: string | null

    id_deposito_olist: number | null
    deposito_olist: string | null

    local_estoque_id: string | null
    local_estoque_nome: string | null
    local_estoque_tipo: string | null

    saldo_olist: number | null
    reservado_olist: number | null
    disponivel_olist: number | null

    saldo_primely: number | null

    diferenca_saldo: number | null
    diferenca_absoluta: number | null

    status_mapeamento: string | null
    status_operacional_olist: string | null
    descricao_status_operacional: string | null

    olist_sincronizado_em: string | null

    status_conciliacao: StatusConciliacaoOlistPrimely
    alerta_divergencia: boolean
    descricao_conciliacao: string | null
    ordem_prioridade: number | null
}

export type ResumoOlistPrimelyEstoqueConciliacao = {
    total_linhas: number
    total_skus: number
    total_conciliado: number
    total_divergente: number
    total_somente_olist_com_saldo: number
    total_saldo_zero_olist: number
    total_saldo_negativo_olist: number
    total_somente_olist: number
    total_somente_primely: number
    total_indefinido: number
    total_alertas: number
    saldo_olist_total: number
    saldo_primely_total: number
    diferenca_total: number
    diferenca_absoluta_total: number
}

function numeroSeguro(valor: number | null | undefined) {
    return Number(valor ?? 0)
}

export async function buscarConciliacaoOlistPrimelyEstoque() {
    const { data, error } = await supabase
        .from('olist_x_primely_estoque_local_conciliacao')
        .select('*')
        .order('ordem_prioridade', { ascending: true, nullsFirst: false })
        .order('diferenca_absoluta', {
            ascending: false,
            nullsFirst: false,
        })
        .order('produto_nome', { ascending: true, nullsFirst: false })

    if (error) {
        throw new Error(error.message)
    }

    return data as OlistPrimelyEstoqueConciliacao[]
}

export async function buscarResumoOlistPrimelyEstoqueConciliacao() {
    const dados = await buscarConciliacaoOlistPrimelyEstoque()

    const skus = new Set<string>()

    return dados.reduce<ResumoOlistPrimelyEstoqueConciliacao>(
        (resumo, item) => {
            resumo.total_linhas += 1

            if (item.sku) {
                skus.add(item.sku)
                resumo.total_skus = skus.size
            }

            if (item.status_conciliacao === 'conciliado') {
                resumo.total_conciliado += 1
            }

            if (item.status_conciliacao === 'divergente') {
                resumo.total_divergente += 1
            }

            if (item.status_conciliacao === 'somente_olist_com_saldo') {
                resumo.total_somente_olist_com_saldo += 1
            }

            if (item.status_conciliacao === 'saldo_zero_olist') {
                resumo.total_saldo_zero_olist += 1
            }

            if (item.status_conciliacao === 'saldo_negativo_olist') {
                resumo.total_saldo_negativo_olist += 1
            }

            if (item.status_conciliacao === 'somente_olist') {
                resumo.total_somente_olist += 1
            }

            if (item.status_conciliacao === 'somente_primely') {
                resumo.total_somente_primely += 1
            }

            if (item.status_conciliacao === 'indefinido') {
                resumo.total_indefinido += 1
            }

            if (item.alerta_divergencia) {
                resumo.total_alertas += 1
            }

            resumo.saldo_olist_total += numeroSeguro(item.saldo_olist)
            resumo.saldo_primely_total += numeroSeguro(item.saldo_primely)
            resumo.diferenca_total += numeroSeguro(item.diferenca_saldo)
            resumo.diferenca_absoluta_total += numeroSeguro(
                item.diferenca_absoluta
            )

            return resumo
        },
        {
            total_linhas: 0,
            total_skus: 0,
            total_conciliado: 0,
            total_divergente: 0,
            total_somente_olist_com_saldo: 0,
            total_saldo_zero_olist: 0,
            total_saldo_negativo_olist: 0,
            total_somente_olist: 0,
            total_somente_primely: 0,
            total_indefinido: 0,
            total_alertas: 0,
            saldo_olist_total: 0,
            saldo_primely_total: 0,
            diferenca_total: 0,
            diferenca_absoluta_total: 0,
        }
    )
}
