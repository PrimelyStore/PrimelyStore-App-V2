import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export type CredenciaisLogin = {
    email: string
    password: string
}

export async function entrarComEmailSenha(credenciais: CredenciaisLogin) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: credenciais.email,
        password: credenciais.password,
    })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function sairDaConta() {
    const { error } = await supabase.auth.signOut()

    if (error) {
        throw new Error(error.message)
    }
}

export async function buscarSessaoAtual() {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
        throw new Error(error.message)
    }

    return data.session
}

export function observarMudancasDeAutenticacao(
    callback: (session: Session | null) => void
) {
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session)
    })

    return () => {
        subscription.unsubscribe()
    }
}
