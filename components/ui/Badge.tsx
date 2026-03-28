import { ReactNode } from 'react'

type BadgeVariant = 'gold' | 'green' | 'red' | 'grey'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
}

const badgeClasses: Record<BadgeVariant, string> = {
  gold:  'bg-gold/15 text-gold border border-gold/30',
  green: 'bg-green-500/15 text-green-400 border border-green-500/30',
  red:   'bg-red-500/15 text-red-400 border border-red-500/30',
  grey:  'bg-white/5 text-muted border border-border',
}

export function Badge({ variant = 'grey', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide ${badgeClasses[variant]}`}
    >
      {children}
    </span>
  )
}
