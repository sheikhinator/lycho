'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bot, MessageSquare,
  Store, CreditCard, Settings,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard' },
  { icon: Bot,             label: 'Agents',         href: '/agents' },
  { icon: MessageSquare,   label: 'Conversations',  href: '/conversations' },
  { icon: Store,           label: 'Marketplace',    href: '/marketplace' },
  { icon: CreditCard,      label: 'Billing',        href: '/billing' },
  { icon: Settings,        label: 'Settings',       href: '/settings' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col z-40"
      style={{ background: '#141414', borderRight: '1px solid #2a2a2a' }}
    >
      {/* Logo */}
      <div className="px-6 py-6 shrink-0">
        <Logo size="md" />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#2a2a2a', margin: '0 24px' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors"
              style={{
                color:      active ? '#C9A84C' : '#6b6b6b',
                background: active ? 'rgba(201,168,76,0.05)' : 'transparent',
                borderLeft: active ? '2px solid #C9A84C' : '2px solid transparent',
                paddingLeft: '10px',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#C9A84C' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#6b6b6b' }}
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Version */}
      <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid #2a2a2a' }}>
        <p className="text-xs font-mono" style={{ color: '#6b6b6b' }}>v1.0.0 · Beta</p>
      </div>
    </aside>
  )
}
