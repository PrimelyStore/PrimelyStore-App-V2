import { supabase } from '../lib/supabase'

export type VersaoBanco = {
    id?: string
    versao?: string
    descricao?: string
    criado_em?: string
    created_at?: string
}

export async function buscarVersaoBanco() {
    const { data, error } = await supabase
        .from('sistema_versoes_banco')
        .select('*')
        .limit(1)

    if (error) {
        throw new Error(error.message)
    }

    return data as VersaoBanco[]
}