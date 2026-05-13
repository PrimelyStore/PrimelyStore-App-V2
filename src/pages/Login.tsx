import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export function Login() {
    const { autenticado, carregando, login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [enviando, setEnviando] = useState(false)

    const estadoRota = location.state as
        | {
            from?: {
                pathname?: string
            }
        }
        | null

    const caminhoDepoisDoLogin = estadoRota?.from?.pathname ?? '/'

    useEffect(() => {
        if (autenticado) {
            navigate(caminhoDepoisDoLogin, { replace: true })
        }
    }, [autenticado, caminhoDepoisDoLogin, navigate])

    async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const emailTratado = email.trim()

        if (!emailTratado) {
            setMensagem('Informe o e-mail.')
            return
        }

        if (!password) {
            setMensagem('Informe a senha.')
            return
        }

        try {
            setEnviando(true)
            setMensagem('Entrando...')

            await login(emailTratado, password)

            setMensagem('Login realizado com sucesso.')
        } catch (error) {
            if (error instanceof Error) {
                setMensagem(error.message)
            } else {
                setMensagem('Erro desconhecido ao fazer login.')
            }
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                            Primely Store
                        </p>

                        <h1 className="mt-4 text-4xl font-bold">
                            Agentes Primely Store
                        </h1>

                        <p className="mt-5 max-w-2xl text-slate-300">
                            Sistema de gestão operacional para compras, estoque,
                            lotes, movimentações, vendas e baixa FIFO.
                        </p>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                                <p className="font-semibold text-cyan-300">
                                    Estoque com FIFO
                                </p>
                                <p className="mt-2 text-sm text-slate-400">
                                    Controle por lote, local e movimentação.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                                <p className="font-semibold text-cyan-300">
                                    Operação Amazon
                                </p>
                                <p className="mt-2 text-sm text-slate-400">
                                    Base para FBA, FBM/DBA e futuras integrações.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
                        <h2 className="text-2xl font-bold">
                            Entrar no sistema
                        </h2>

                        <p className="mt-3 text-sm text-slate-400">
                            Use o usuário criado no Supabase Authentication.
                        </p>

                        <form onSubmit={enviarFormulario} className="mt-8 space-y-5">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    E-mail
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="seu@email.com"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Senha
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    placeholder="Digite sua senha"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={enviando || carregando}
                                className="w-full rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {enviando || carregando ? 'Aguarde...' : 'Entrar'}
                            </button>
                        </form>

                        {mensagem ? (
                            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-200">
                                {mensagem}
                            </div>
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    )
}
