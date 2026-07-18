import type { ReactNode } from 'react'

type AppCardProps = {
    children: ReactNode
    className?: string
}

export function AppCard({ children, className = '' }: AppCardProps) {
    return (
        <section
            className={[
                'rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </section>
    )
}
