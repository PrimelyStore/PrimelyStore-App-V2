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

function obterClasseLink(isActive: boolean, compacto = false) {
    const base = compacto
        ? 'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition'
        : 'block rounded-xl px-4 py-3 text-sm font-semibold transition'

    if (isActive) {
        return `${base} border-cyan-500/40 bg-cyan-500/10 text-cyan-300`
    }

    return `${base} border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800`
}

export function AppLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    async function sair() {
        await logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-dvh overflow-x-hidden bg-slate-950 text-slate-100">
            <div className="flex min-h-dvh w-full">
                <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-slate-800 bg-slate-900/95 p-5 lg:flex lg:flex-col">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                            Primely Store
                        </p>

                        <h1 className="mt-3 text-lg font-bold leading-tight">
                            Agentes Primely Store
                        </h1>

                        <p className="mt-2 text-xs text-slate-500">
                            Operação Amazon FBA / FBM
                        </p>
                    </div>

                    <nav className="mt-8 flex-1 space-y-1 overflow-y-auto pr-1">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => obterClasseLink(isActive)}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
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

                <main className="flex min-h-dvh min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-3 py-4 shadow-lg shadow-black/10 backdrop-blur sm:px-5 lg:px-6 xl:px-8">
                        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-400 sm:text-sm">
                                        Sistema de gestão para operação Amazon FBA / FBM
                                    </p>

                                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                                        Painel principal
                                    </h2>
                                </div>

                                <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300 lg:hidden">
                                    <p className="break-words">
                                        {user?.email ?? 'Usuário autenticado'}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={sair}
                                        className="w-fit rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
                                    >
                                        Sair
                                    </button>
                                </div>
                            </div>

                            <nav className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:hidden">
                                {menuItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/'}
                                        className={({ isActive }) => obterClasseLink(isActive, true)}
                                    >
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </div>
                    </header>

                    <section className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 xl:px-8">
                        <Outlet />
                    </section>
                </main>
            </div>
        </div>
    )
}
