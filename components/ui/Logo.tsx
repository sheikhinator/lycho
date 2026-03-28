type Size = 'sm' | 'md' | 'lg'

export interface LogoProps {
  size?: Size
  showWordmark?: boolean
  className?: string
}

const sizes: Record<Size, { px: number; text: string; gap: string }> = {
  sm: { px: 22,  text: 'text-xl',     gap: 'gap-2' },
  md: { px: 34,  text: 'text-[1.6rem]', gap: 'gap-2.5' },
  lg: { px: 72,  text: 'text-6xl',    gap: 'gap-4' },
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const { px, text, gap } = sizes[size]
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="LYCHO logo"
      >
        <circle cx="50" cy="50" r="46" stroke="#C9A84C" strokeWidth="0.5" opacity="0.35"/>
        <circle cx="50" cy="50" r="36" stroke="#C9A84C" strokeWidth="0.3" opacity="0.2"/>
        <circle cx="50" cy="50" r="4"  fill="#C9A84C"   opacity="0.9"/>
        <line x1="50" y1="46" x2="50" y2="8"  stroke="#C9A84C" strokeWidth="0.9"/>
        <line x1="53" y1="48" x2="83" y2="27" stroke="#C9A84C" strokeWidth="0.9"/>
        <line x1="53" y1="52" x2="83" y2="73" stroke="#C9A84C" strokeWidth="0.9"/>
        <line x1="50" y1="54" x2="50" y2="92" stroke="#C9A84C" strokeWidth="0.9"/>
        <line x1="47" y1="52" x2="17" y2="73" stroke="#C9A84C" strokeWidth="0.9"/>
        <line x1="47" y1="48" x2="17" y2="27" stroke="#C9A84C" strokeWidth="0.9"/>
        <circle cx="50" cy="8"  r="2.8" fill="#C9A84C"/>
        <circle cx="83" cy="27" r="2.5" fill="#C9A84C"/>
        <circle cx="83" cy="73" r="2.5" fill="#C9A84C"/>
        <circle cx="50" cy="92" r="2.8" fill="#C9A84C"/>
        <circle cx="17" cy="73" r="2.5" fill="#C9A84C"/>
        <circle cx="17" cy="27" r="2.5" fill="#C9A84C"/>
      </svg>
      {showWordmark && (
        <span className={`font-bebas ${text} tracking-[0.2em] text-gold leading-none`}>
          LYCHO
        </span>
      )}
    </div>
  )
}
