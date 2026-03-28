'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bot, MessageSquare,
  Store, CreditCard, Settings, Lock,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useToast } from '@/components/providers/ToastProvider'
import { useSidebar } from '@/components/providers/SidebarContext'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard',        routed: true  },
  { icon: Bot,             label: 'Agents',        href: '/dashboard/agents', routed: true  },
  { icon: MessageSquare,   label: 'Conversations', href: '#',                 routed: false },
  { icon: Store,           label: 'Marketplace',   href: '#',                 routed: false },
  { icon: CreditCard,      label: 'Billing',       href: '#',                 routed: false },
  { icon: Settings,        label: 'Settings',      href: '#',                 routed: false },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { toast } = useToast()
  const { isOpen, close } = useSidebar()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-screen w-60 flex flex-col z-40 transition-transform duration-300',
          // Mobile: slide in/out. Desktop: always visible.
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{ background: '#141414', borderRight: '1px solid #2a2a2a' }}
      >
        {/* Logo */}
        <div className="px-6 py-6 shrink-0">
          <Logo size="md" />
        </div>

        <div style={{ height: '1px', background: '#2a2a2a', margin: '0 24px' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {NAV.map(({ icon: Icon, label, href, routed }) => {
            const active = routed && isActive(href)

            const itemStyle = {
              color:       active ? '#C9A84C' : routed ? '#6b6b6b' : 'rgba(107,107,107,0.5)',
              background:  active ? 'rgba(201,168,76,0.05)' : 'transparent',
              borderLeft:  active ? '2px solid #C9A84C' : '2px solid transparent',
              paddingLeft: '10px',
            }

            const itemClass =
              'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-sans transition-colors w-full text-left'

            if (!routed) {
              return (
                <button
                  key={label}
                  className={itemClass}
                  style={itemStyle}
                  onClick={() => { toast('Coming soon — this feature is being built.', 'info'); close() }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.5)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(107,107,107,0.5)')}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  <Lock size={11} style={{ opacity: 0.4 }} className="shrink-0" />
                </button>
              )
            }

            return (
              <Link
                key={href}
                href={href}
                className={itemClass}
                style={itemStyle}
                onClick={close}
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
    </>
  )
}
