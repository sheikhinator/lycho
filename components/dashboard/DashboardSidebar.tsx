'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bot, MessageSquare, Zap,
  Store, CreditCard, Settings, Code2, Wand2, BarChart2, Network, MessagesSquare, BookOpen, Eye, TrendingUp, Cpu, Wrench, Terminal, Palette, Shield, Brain, Activity, Key, Sparkles, GraduationCap, Users, Workflow, Globe, Webhook, FlaskConical, Database,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useSidebar } from '@/components/providers/SidebarContext'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',    href: '/dashboard'                },
  { icon: Bot,             label: 'Agents',        href: '/dashboard/agents'         },
  { icon: Wand2,           label: 'Build Agent',   href: '/dashboard/agents/builder' },
  { icon: MessagesSquare,  label: 'Chat',          href: '/dashboard/chat'           },
  { icon: MessageSquare,   label: 'Conversations', href: '/dashboard/conversations'  },
  { icon: Zap,             label: 'Nexus',         href: '/dashboard/nexus'          },
  { icon: Network,         label: 'Syndicate',     href: '/dashboard/syndicate'      },
  { icon: BarChart2,       label: 'Analytics',     href: '/dashboard/analytics'      },
  { icon: Eye,             label: 'Observe',       href: '/dashboard/observe'        },
  { icon: Sparkles,        label: 'Oracle',        href: '/dashboard/oracle'         },
  { icon: TrendingUp,      label: 'Compete',       href: '/dashboard/compete'        },
  { icon: Brain,           label: 'Swarm',         href: '/dashboard/swarm'          },
  { icon: Cpu,             label: 'Simulate',      href: '/dashboard/simulate'       },
  { icon: Activity,        label: 'Heal',          href: '/dashboard/heal'           },
  { icon: GraduationCap,   label: 'Training',      href: '/dashboard/training'       },
  { icon: Users,           label: 'Collab',        href: '/dashboard/collab'         },
  { icon: Workflow,        label: 'Workflows',     href: '/dashboard/workflows'      },
  { icon: Globe,           label: 'Portal',        href: '/dashboard/portal'         },
  { icon: Palette,         label: 'Studio',        href: '/dashboard/studio'         },
  { icon: Wrench,          label: 'Skills',        href: '/dashboard/skills'         },
  { icon: Terminal,        label: 'Dev',           href: '/dashboard/dev'            },
  { icon: Key,             label: 'Gateway',       href: '/dashboard/gateway'        },
  { icon: Webhook,         label: 'Webhooks',      href: '/dashboard/webhooks'       },
  { icon: FlaskConical,    label: 'A/B Tests',     href: '/dashboard/abtesting'      },
  { icon: Database,        label: 'Backup',        href: '/dashboard/backup'         },
  { icon: Store,           label: 'Marketplace',   href: '/dashboard/marketplace'    },
  { icon: BookOpen,        label: 'Knowledge',     href: '/dashboard/knowledge'      },
  { icon: CreditCard,      label: 'Billing',       href: '/dashboard/billing'        },
  { icon: Shield,          label: 'Audit Log',     href: '/dashboard/audit'          },
  { icon: Settings,        label: 'Settings',      href: '/dashboard/settings'       },
  { icon: Code2,           label: 'API',           href: '/developers'               },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isOpen, close } = useSidebar()

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href)

  const worldActive = pathname.startsWith('/dashboard/world')

  return (
    <>
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

        {/* LYCHO WORLD — featured entry */}
        <div className="px-3 pb-2 shrink-0">
          <Link
            href="/dashboard/world"
            onClick={close}
            className="flex items-center gap-3 rounded text-sm font-sans w-full"
            style={{
              color: '#C9A84C',
              background: worldActive ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.05)',
              borderLeft: worldActive ? '2px solid #C9A84C' : '2px solid rgba(201,168,76,0.3)',
              padding: '10px 10px',
              fontWeight: 700,
              letterSpacing: 1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.12)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = worldActive ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.05)' }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
            <span>WORLD</span>
          </Link>
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
