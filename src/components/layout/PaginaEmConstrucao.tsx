type PaginaEmConstrucaoProps = {
    titulo: string
    descricao: string
}

export function PaginaEmConstrucao({
    titulo,
    descricao,
}: PaginaEmConstrucaoProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <p className="text-sm uppercase tracking-widest text-cyan-400">
                Módulo
            </p>

            <h1 className="mt-3 text-3xl font-bold">
                {titulo}
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
                {descricao}
            </p>

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <p className="text-sm text-slate-400">
                    Status: estrutura de rota criada. Nas próximas etapas vamos conectar este módulo com as tabelas do Supabase.
                </p>
            </div>
        </div>
    )
}