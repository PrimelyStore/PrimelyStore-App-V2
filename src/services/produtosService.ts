import { supabase } from '../lib/supabase'

export type Produto = {
    id: string
    nome: string
    sku: string
    asin: string | null
    ean: string | null
    marca: string | null
    categoria: string | null
    status: string
    created_at: string
    updated_at: string
}

export type NovoProduto = {
    nome: string
    sku: string
    asin: string | null
    ean: string | null
    marca: string | null
    categoria: string | null
    status: string
}

export type OlistProdutoSnapshot = {
    id_produto_olist: number
    sku: string | null
    descricao: string | null
    situacao: string | null
    gtin: string | null
    preco_custo: number | null
    preco_custo_medio: number | null
    estoque_quantidade: number | null
    sincronizado_em: string
}

export async function buscarProdutos() {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000)

    if (error) {
        throw new Error(error.message)
    }

    return data as Produto[]
}

export async function buscarSnapshotProdutosOlist() {
    const { data, error } = await supabase
        .from('olist_produtos_snapshot')
        .select('id_produto_olist, sku, descricao, situacao, gtin, preco_custo, preco_custo_medio, estoque_quantidade, sincronizado_em')
        .order('descricao', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as OlistProdutoSnapshot[]
}

export async function cadastrarProduto(produto: NovoProduto) {
    const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Produto
}

export async function atualizarProduto(id: string, produto: NovoProduto) {
    const { data, error } = await supabase
        .from('produtos')
        .update(produto)
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Produto
}

export async function enriquecerProduto(sku: string, dados: Omit<NovoProduto, 'sku'>) {
    const { data: existente, error: findError } = await supabase
        .from('produtos')
        .select('id')
        .eq('sku', sku)
        .maybeSingle()

    if (findError) {
        throw new Error(findError.message)
    }

    if (existente) {
        const { data, error } = await supabase
            .from('produtos')
            .update({
                nome: dados.nome,
                asin: dados.asin,
                ean: dados.ean,
                marca: dados.marca,
                categoria: dados.categoria,
                status: dados.status,
            })
            .eq('id', existente.id)
            .select('*')
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data as Produto
    } else {
        const { data, error } = await supabase
            .from('produtos')
            .insert({
                sku,
                nome: dados.nome,
                asin: dados.asin,
                ean: dados.ean,
                marca: dados.marca,
                categoria: dados.categoria,
                status: dados.status,
            })
            .select('*')
            .single()

        if (error) {
            throw new Error(error.message)
        }

        return data as Produto
    }
}