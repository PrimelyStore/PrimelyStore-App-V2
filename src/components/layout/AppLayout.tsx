import { NavLink, Outlet } from 'react-router'

const menuItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Fornecedores', path: '/fornecedores' },
    { label: 'Compras', path: '/compras' },
    { label: 'Vendas', path: '/vendas' },
    { label: 'Estoque', path: '/estoque' },
    { label: 'Alertas', path: '/alertas' },
]

export function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="flex min-h-screen">
                <aside className="hidden w-72 border-r border-slate-800 bg-slate-900 p-6 md:block">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
                            Primely Store
                        </p>

                        <h1 className="mt-3 text-xl font-bold">
                            Agentes Primely Store
                        </h1>
                    </div>

                    <nav className="mt-10 space-y-2">
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
                </aside>

                <main className="flex-1">
                    <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-5">
                        <p className="text-sm text-slate-400">
                            Sistema de gestão para operação Amazon FBA / FBM
                        </p>

                        <h2 className="mt-1 text-2xl font-bold">
                            Painel principal
                        </h2>
                    </header>

                    <section className="p-6">
                        <Outlet />
                    </section>
                </main>
            </div>
        </div>
    )
}