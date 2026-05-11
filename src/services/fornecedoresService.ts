import { supabase } from '../lib/supabase'

export type Fornecedor = {
    id: string
    nome: string
    nome_fantasia: string | null
    tipo_pessoa: string
    documento: string | null
    contato_nome: string | null
    email: string | null
    telefone: string | null
    whatsapp: string | null
    site: string | null
    endereco: string | null
    cidade: string | null
    estado: string | null
    pais: string | null
    observacoes: string | null
    status: string
    created_at: string
    updated_at: string
}

export type NovoFornecedor = {
    nome: string
    nome_fantasia: string | null
    tipo_pessoa: string
    documento: string | null
    contato_nome: string | null
    email: string | null
    telefone: string | null
    whatsapp: string | null
    site: string | null
    endereco: string | null
    cidade: string | null
    estado: string | null
    pais: string | null
    observacoes: string | null
    status: string
}

export async function buscarFornecedores() {
    const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        throw new Error(error.message)
    }

    return data as Fornecedor[]
}

export async function cadastrarFornecedor(fornecedor: NovoFornecedor) {
    const { data, error } = await supabase
        .from('fornecedores')
        .insert(fornecedor)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Fornecedor
}

export async function atualizarFornecedor(
    id: string,
    fornecedor: NovoFornecedor
) {
    const { data, error } = await supabase
        .from('fornecedores')
        .update(fornecedor)
        .eq('id', id)
        .select('*')
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data as Fornecedor
}