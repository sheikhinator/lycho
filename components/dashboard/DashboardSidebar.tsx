'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bot, MessageSquare, Zap,
  Store, CreditCard, Settings, Code2, Wand2,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useSidebar } from '@/components/providers/SidebarContext'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'               },
  { icon: Bot,             label: 'Agents',        href: '/dashboard/agents'        },
  { icon: Wand2,           label: 'Build Agent',   href: '/dashboard/agents/builder' },
  { icon: MessageSquare,   label: 'Conversations', href: '/dashboard/conversations' },
  { icon: Zap,             label: 'Nexus',         href: '/dashboard/nexus'         },
  { icon: Store,           label: 'Marketplace',   href: '/dashboard/marketplace'   },
  { icon: CreditCard,      label: 'Billing',       href: '/dashboard/billing'       },
  { icon: Settings,        label: 'Settings',      href: '/dashboard/settings'      },
  { icon: Code2,           label: 'API',           href: '/developers'              },
]

export function DashboardSidebar() {
  const pathname = usePathname()
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
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = isActive(href)

            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-sans transition-colors w-full"
                style={{
                  color:       active ? '#C9A84C' : '#6b6b6b',
                  background:  active ? 'rgba(201,168,76,0.05)' : 'transparent',
                  borderLeft:  active ? '2px solid #C9A84C' : '2px solid transparent',
                  paddingLeft: '10px',
                }}
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
