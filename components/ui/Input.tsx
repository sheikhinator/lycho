import { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs text-muted uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'bg-deep border rounded px-3 py-2 text-sm text-ivory placeholder-muted outline-none transition-all',
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
            : 'border-border focus:border-gold focus:ring-2 focus:ring-gold/20',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
