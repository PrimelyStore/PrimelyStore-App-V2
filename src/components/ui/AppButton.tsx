import type { ButtonHTMLAttributes, ReactNode } from 'react'

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
type AppButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<AppButtonVariant, string> = {
    primary: 'border-cyan-500 bg-cyan-500 text-slate-950 hover:bg-cyan-400',
    secondary:
        'border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300',
    danger:
        'border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
    success:
        'border-emerald-500 bg-emerald-500 text-slate-950 hover:bg-emerald-400',
    ghost:
        'border-transparent bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100',
}

const sizeClass: Record<AppButtonSize, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base',
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode
    variant?: AppButtonVariant
    size?: AppButtonSize
}

export function AppButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    type = 'button',
    ...props
}: AppButtonProps) {
    return (
        <button
            type={type}
            className={[
                'inline-flex w-max items-center justify-center whitespace-nowrap rounded-xl border font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                variantClass[variant],
                sizeClass[size],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            {children}
        </button>
    )
}
