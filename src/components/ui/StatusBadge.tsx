import type { ReactNode } from 'react'

type StatusBadgeTone =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'muted'

const toneClass: Record<StatusBadgeTone, string> = {
    default: 'border-slate-600 bg-slate-700/30 text-slate-200',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
    danger: 'border-red-500/40 bg-red-500/10 text-red-300',
    info: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
    purple: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    muted: 'border-slate-700 bg-slate-800 text-slate-400',
}

type StatusBadgeProps = {
    children: ReactNode
    tone?: StatusBadgeTone
    className?: string
}

export function StatusBadge({
    children,
    tone = 'default',
    className = '',
}: StatusBadgeProps) {
    return (
        <span
            className={[
                'inline-flex w-max items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold',
                toneClass[tone],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </span>
    )
}
