import {
    createContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
    buscarSessaoAtual,
    entrarComEmailSenha,
    observarMudancasDeAutenticacao,
    sairDaConta,
} from '../services/authService'

type AuthContextValue = {
    session: Session | null
    user: User | null
    carregando: boolean
    autenticado: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
)

type AuthProviderProps = {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSession] = useState<Session | null>(null)
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        let componenteAtivo = true

        async function carregarSessaoInicial() {
            try {
                const sessaoAtual = await buscarSessaoAtual()

                if (componenteAtivo) {
                    setSession(sessaoAtual)
                }
            } finally {
                if (componenteAtivo) {
                    setCarregando(false)
                }
            }
        }

        carregarSessaoInicial()

        const pararObservacao = observarMudancasDeAutenticacao((novaSessao) => {
            if (componenteAtivo) {
                setSession(novaSessao)
                setCarregando(false)
            }
        })

        return () => {
            componenteAtivo = false
            pararObservacao()
        }
    }, [])

    async function login(email: string, password: string) {
        setCarregando(true)

        try {
            const data = await entrarComEmailSenha({
                email,
                password,
            })

            setSession(data.session ?? null)
        } finally {
            setCarregando(false)
        }
    }

    async function logout() {
        setCarregando(true)

        try {
            await sairDaConta()
            setSession(null)
        } finally {
            setCarregando(false)
        }
    }

    const valor = useMemo<AuthContextValue>(
        () => ({
            session,
            user: session?.user ?? null,
            carregando,
            autenticado: Boolean(session?.user),
            login,
            logout,
        }),
        [carregando, session]
    )

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
