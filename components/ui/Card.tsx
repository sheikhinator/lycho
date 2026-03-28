import { HTMLAttributes } from 'react'

type CardVariant = 'default' | 'highlighted'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

export function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-surface border border-border rounded-lg p-5',
        variant === 'highlighted' ? 'border-l-4 border-l-gold' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
