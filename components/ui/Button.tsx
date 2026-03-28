import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-gold text-void font-semibold hover:bg-pulse',
  secondary: 'border border-gold text-gold bg-transparent hover:bg-gold/10',
  ghost:     'text-ivory bg-transparent hover:bg-surface',
  danger:    'bg-red-600 text-white hover:bg-red-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded transition-colors duration-150',
        'font-sans font-medium disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      style={{ fontSize: '14px', letterSpacing: '0.3px', ...props.style }}
      {...props}
    />
  )
}
