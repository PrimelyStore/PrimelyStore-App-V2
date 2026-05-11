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

export async function buscarProdutos() {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as Produto[]
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