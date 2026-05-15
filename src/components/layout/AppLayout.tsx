import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

const menuItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Fornecedores', path: '/fornecedores' },
    { label: 'Compras', path: '/compras' },
    { label: 'Vendas', path: '/vendas' },
    { label: 'Estoque', path: '/estoque' },
    { label: 'Amazon FBA', path: '/amazon-fba' },
    {
        label: 'Conciliação Olist x Amazon',
        path: '/conciliacao-olist-amazon',
    },
    {
        label: 'Conciliação Olist x Primely',
        path: '/conciliacao-olist-primely-estoque',
    },
    {
        label: 'Conciliação FBA 3 Pontas',
        path: '/conciliacao-amazon-olist-primely-fba',
    },
    { label: 'Lotes', path: '/lotes' },
    { label: 'Movimentações', path: '/movimentacoes' },
    { label: 'Alertas', path: '/alertas' },
]

export function AppLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    async function sair() {
        await logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="flex min-h-screen">
                <aside className="hidden w-72 border-r border-slate-800 bg-slate-900 p-6 md:flex md:flex-col">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                            Primely Store
                        </p>

                        <h1 className="mt-3 text-xl font-bold">
                            Agentes Primely Store
                        </h1>
                    </div>

                    <nav className="mt-10 flex-1 space-y-2 overflow-y-auto pr-1">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    isActive
                                        ? 'block rounded-xl bg-cyan-500/10 px-4 py-3 text-cyan-300'
                                        : 'block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800'
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                            Usuário logado
                        </p>

                        <p className="mt-2 break-words text-sm text-slate-200">
                            {user?.email ?? 'Usuário autenticado'}
                        </p>

                        <button
                            type="button"
                            onClick={sair}
                            className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                        >
                            Sair
                        </button>
                    </div>
                </aside>

                <main className="flex-1">
                    <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm text-slate-400">
                                    Sistema de gestão para operação Amazon FBA / FBM
                                </p>

                                <h2 className="mt-1 text-2xl font-bold">
                                    Painel principal
                                </h2>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 md:hidden">
                                <p className="break-words">
                                    {user?.email ?? 'Usuário autenticado'}
                                </p>

                                <button
                                    type="button"
                                    onClick={sair}
                                    className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
                                >
                                    Sair
                                </button>
                            </div>
                        </div>
                    </header>

                    <section className="p-6">
                        <Outlet />
                    </section>
                </main>
            </div>
        </div>
    )
}
