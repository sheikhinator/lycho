'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export interface NavItem {
  label: string
  href: string
  icon?: ReactNode
}

export interface SidebarProps {
  items: NavItem[]
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-deep border-r border-border flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-border">
        <span className="font-bebas text-2xl tracking-[0.2em] text-gold">LYCHO</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors',
                active
                  ? 'bg-gold/10 text-gold font-medium border-l-2 border-gold pl-[10px]'
                  : 'text-muted hover:text-ivory hover:bg-surface',
              ].join(' ')}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted font-mono">v1.0.0</p>
      </div>
    </aside>
  )
}
