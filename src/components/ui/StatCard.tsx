import type { ReactNode } from 'react'

type StatCardTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const valueToneClass: Record<StatCardTone, string> = {
    default: 'text-slate-100',
    success: 'text-emerald-300',
    warning: 'text-yellow-300',
    danger: 'text-red-300',
    info: 'text-cyan-300',
    purple: 'text-violet-300',
}

type StatCardProps = {
    label: string
    value: ReactNode
    description?: ReactNode
    tone?: StatCardTone
    className?: string
}

export function StatCard({
    label,
    value,
    description,
    tone = 'default',
    className = '',
}: StatCardProps) {
    return (
        <section
            className={[
                'rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-6',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <p className="text-sm text-slate-400">{label}</p>

            <div
                className={[
                    'mt-3 text-2xl font-bold tracking-tight sm:text-3xl',
                    valueToneClass[tone],
                ].join(' ')}
            >
                {value}
            </div>

            {description ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                    {description}
                </p>
            ) : null}
        </section>
    )
}
