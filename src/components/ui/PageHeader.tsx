type PageHeaderProps = {
    tag?: string
    title: string
    description?: string
    className?: string
}

export function PageHeader({
    tag = 'MÓDULO',
    title,
    description,
    className = '',
}: PageHeaderProps) {
    return (
        <section
            className={[
                'rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
                {tag}
            </p>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                {title}
            </h1>

            {description ? (
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300 sm:text-base">
                    {description}
                </p>
            ) : null}
        </section>
    )
}
