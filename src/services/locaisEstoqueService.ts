import { supabase } from '../lib/supabase'

export type LocalEstoque = {
    id: string
    nome: string
    tipo: string
    codigo_externo: string | null
    responsavel_nome: string | null
    email: string | null
    telefone: string | null
    whatsapp: string | null
    endereco: string | null
    cidade: string | null
    estado: string | null
    pais: string | null
    observacoes: string | null
    status: string
    created_at: string
    updated_at: string
}

export async function buscarLocaisEstoqueAtivos() {
    const { data, error } = await supabase
        .from('locais_estoque')
        .select('*')
        .eq('status', 'ativo')
        .order('nome', { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data as LocalEstoque[]
}