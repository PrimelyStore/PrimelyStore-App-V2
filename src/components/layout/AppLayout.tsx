import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

type MenuItem = { label: string; shortLabel: string; path: string }
type MenuSection = { section: string; items: MenuItem[] }

const menuSections: MenuSection[] = [
    {
        section: 'Gerencial',
        items: [
            { label: 'Dashboard', shortLabel: 'DB', path: '/' },
            { label: 'Produtos', shortLabel: 'PR', path: '/produtos' },
            { label: 'Estoque Consolidado', shortLabel: 'ES', path: '/estoque' },
            { label: 'Vendas Analíticas', shortLabel: 'VD', path: '/vendas' },
            { label: 'Curva ABC', shortLabel: 'ABC', path: '/curva-abc' },
            { label: 'Custos & Margens', shortLabel: 'CM', path: '/custos-margem' },
        ],
    },
    {
        section: 'Integrações',
        items: [
            { label: 'Saúde dos Dados', shortLabel: 'SD', path: '/integracoes-olist' },
            { label: 'Amazon FBA', shortLabel: 'FBA', path: '/amazon-fba' },
        ],
    },
    {
        section: 'Análises',
        items: [
            { label: 'Conciliação Olist × Amazon', shortLabel: 'OA', path: '/conciliacao-olist-amazon' },
            { label: 'Conciliação Olist × Primely', shortLabel: 'OP', path: '/conciliacao-olist-primely-estoque' },
            { label: 'Conciliação FBA 3 Pontas', shortLabel: '3P', path: '/conciliacao-amazon-olist-primely-fba' },
            { label: 'Alertas', shortLabel: 'AL', path: '/alertas' },
        ],
    },
]

// Lista plana para navegação mobile
const menuItems = menuSections.flatMap((s) => s.items)

function obterClasseLink(isActive: boolean, compacto = false) {
    const base = compacto
        ? 'flex shrink-0 items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition'
        : 'block rounded-xl px-4 py-3 text-sm font-semibold transition'

    if (isActive) {
        return `${base} border-cyan-500/40 bg-cyan-500/10 text-cyan-300`
    }

    return `${base} border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800`
}

export function AppLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [menuRecolhido, setMenuRecolhido] = useState(() => {
        if (typeof window === 'undefined') {
            return false
        }

        return window.localStorage.getItem('primely.sidebar.recolhida') === 'true'
    })

    useEffect(() => {
        window.localStorage.setItem(
            'primely.sidebar.recolhida',
            String(menuRecolhido),
        )
    }, [menuRecolhido])

    async function sair() {
        await logout()
        navigate('/login', { replace: true })
    }

    return (
        <div className="min-h-dvh overflow-x-hidden bg-slate-950 text-slate-100">
            <div className="flex min-h-dvh w-full">
                <aside
                    className={`sticky top-0 hidden h-dvh shrink-0 border-r border-slate-800 bg-slate-900/95 transition-all duration-300 lg:flex lg:flex-col ${
                        menuRecolhido ? 'w-20 p-3' : 'w-64 p-5'
                    }`}
                >
                    <div
                        className={`flex items-start gap-3 ${
                            menuRecolhido ? 'justify-center' : 'justify-between'
                        }`}
                    >
                        {!menuRecolhido ? (
                            <div className="min-w-0">
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
                        ) : (
                            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-300">
                                PS
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setMenuRecolhido((valor) => !valor)}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
                            title={menuRecolhido ? 'Expandir menu' : 'Recolher menu'}
                            aria-label={menuRecolhido ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                        >
                            {menuRecolhido ? '»' : '«'}
                        </button>
                    </div>

                    <nav className="mt-8 flex-1 overflow-y-auto pr-1">
                        {menuSections.map((section, sectionIndex) => (
                            <div key={section.section} className={sectionIndex > 0 ? 'mt-5' : ''}>
                                {!menuRecolhido && (
                                    <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                        {section.section}
                                    </p>
                                )}

                                {menuRecolhido && sectionIndex > 0 && (
                                    <div className="mx-auto mb-2 w-8 border-t border-slate-700" />
                                )}

                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.path === '/'}
                                            title={menuRecolhido ? item.label : undefined}
                                            className={({ isActive }) =>
                                                obterClasseLink(isActive, menuRecolhido)
                                            }
                                        >
                                            {menuRecolhido ? item.shortLabel : item.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {!menuRecolhido ? (
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
                    ) : (
                        <button
                            type="button"
                            onClick={sair}
                            className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-2 py-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
                            title={user?.email ?? 'Sair'}
                        >
                            Sair
                        </button>
                    )}
                </aside>

                <main className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-hidden">
                    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 px-3 py-4 shadow-lg shadow-black/10 backdrop-blur sm:px-5 lg:px-6 xl:px-8">
                        <div className="flex w-full flex-col gap-4">
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

                    <section className="w-full min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
                        <Outlet />
                    </section>
                </main>
            </div>
        </div>
    )
}
