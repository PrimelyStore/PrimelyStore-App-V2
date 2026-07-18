import type { ReactNode } from 'react'

type DataTableContainerProps = {
    children: ReactNode
    className?: string
    maxHeightClassName?: string
}

export function DataTableContainer({
    children,
    className = '',
    maxHeightClassName = 'max-h-[70vh]',
}: DataTableContainerProps) {
    return (
        <div
            className={[
                maxHeightClassName,
                'max-w-full overflow-auto rounded-xl border border-slate-700',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </div>
    )
}

export const stickyTableHeadClassName =
    'sticky top-0 z-10 bg-slate-950 text-slate-300'
