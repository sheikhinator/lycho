import { redirect } from 'next/navigation'
import {
  Globe, Bell,
  TrendingUp, TrendingDown,
  Activity, Zap,
  MessageSquare, Mail, Globe2,
} from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Button } from '@/components/ui'
import type { Tenant } from '@/lib/database.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function healthColor(score: number): string {
  if (score >= 70) return '#4ade80'   // green
  if (score >= 40) return '#fbbf24'   // amber
  return '#f87171'                     // red
}

function churnLabel(score: number): { label: string; color: string } {
  if (score <= 20) return { label: 'Low',    color: '#4ade80' }
  if (score <= 50) return { label: 'Medium', color: '#fbbf24' }
  return                  { label: 'High',   color: '#f87171' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, valueColor,
}: {
  label: string; value: string; sub: string; valueColor?: string
}) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
    >
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
        {label}
      </p>
      <p
        className="font-bebas text-4xl tracking-wider leading-none mb-2"
        style={{ color: valueColor ?? '#F0EBE1' }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: '#6b6b6b' }}>{sub}</p>
    </div>
  )
}

function AgentDashCard({
  number, name, description, channels, tag,
}: {
  number: string; name: string; description: string
  channels: Array<'whatsapp' | 'email' | 'web'>
  tag: string
}) {
  const channelIcons: Record<string, React.ReactNode> = {
    whatsapp: <MessageSquare size={13} />,
    email:    <Mail size={13} />,
    web:      <Globe2 size={13} />,
  }

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-3 hover:border-gold/40 transition-colors"
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>{number}</p>
          <h3 className="font-bebas text-2xl tracking-wider" style={{ color: '#F0EBE1' }}>{name}</h3>
        </div>
        {/* Pulsing configuring badge */}
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs"
          style={{
            background: 'rgba(107,107,107,0.15)',
            border: '1px solid rgba(107,107,107,0.3)',
            color: '#6b6b6b',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#6b6b6b' }}
          />
          configuring
        </span>
      </div>

      <p className="text-xs leading-relaxed flex-1" style={{ color: '#6b6b6b' }}>
        {description}
      </p>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="flex gap-2" style={{ color: '#6b6b6b' }}>
          {channels.map(ch => (
            <span key={ch} title={ch} className="hover:text-gold transition-colors">
              {channelIcons[ch]}
            </span>
          ))}
        </div>
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.28)', padding: '2px 8px' }}
        >
          {tag}
        </span>
      </div>

      <Button variant="secondary" size="sm" className="w-full mt-1">
        Deploy Agent
      </Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userRow } = await admin
    .from('users')
    .select('*, tenants(*)')
    .eq('id', session.user.id)
    .single() as { data: { tenants: Tenant | null } | null }

  const tenant = userRow?.tenants ?? null
  const businessName = tenant?.business_name ?? 'Your Business'
  const initials = businessName.charAt(0).toUpperCase()
  const trialing = tenant?.plan_status === 'trialing'
  const trialDays = daysRemaining(tenant?.trial_ends_at ?? null)
  const hColor = healthColor(tenant?.health_score ?? 50)
  const churn  = churnLabel(tenant?.churn_risk_score ?? 0)

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <DashboardSidebar />

      {/* ── Main ── */}
      <div className="flex flex-col flex-1" style={{ marginLeft: '240px', minHeight: '100vh' }}>

        {/* ── TopBar ── */}
        <header
          className="sticky top-0 z-30 flex items-center px-6 gap-4 shrink-0"
          style={{ height: '60px', background: '#141414', borderBottom: '1px solid #2a2a2a' }}
        >
          {/* Left: Logo sm */}
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="46" stroke="#C9A84C" strokeWidth="0.5" opacity="0.35"/>
              <circle cx="50" cy="50" r="4"  fill="#C9A84C"   opacity="0.9"/>
              <line x1="50" y1="46" x2="50" y2="8"  stroke="#C9A84C" strokeWidth="1"/>
              <line x1="53" y1="48" x2="83" y2="27" stroke="#C9A84C" strokeWidth="1"/>
              <line x1="53" y1="52" x2="83" y2="73" stroke="#C9A84C" strokeWidth="1"/>
              <line x1="50" y1="54" x2="50" y2="92" stroke="#C9A84C" strokeWidth="1"/>
              <line x1="47" y1="52" x2="17" y2="73" stroke="#C9A84C" strokeWidth="1"/>
              <line x1="47" y1="48" x2="17" y2="27" stroke="#C9A84C" strokeWidth="1"/>
            </svg>
          </div>

          {/* Center: Business name */}
          <div className="flex-1 flex justify-center">
            <span className="font-sans text-sm tracking-wide" style={{ color: '#F0EBE1' }}>
              {businessName}
            </span>
          </div>

          {/* Right: Globe + Bell + Avatar */}
          <div className="flex items-center gap-4">
            <button
              className="transition-colors"
              style={{ color: '#6b6b6b' }}
              title="Language — EN"
            >
              <Globe size={18} />
            </button>
            <button
              className="transition-colors"
              style={{ color: '#6b6b6b' }}
              title="Notifications"
            >
              <Bell size={18} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.3)',
                color: '#C9A84C',
              }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* ── Trial Banner ── */}
        {trialing && (
          <div
            className="flex items-center justify-between px-6 py-3 shrink-0"
            style={{
              background: 'rgba(201,168,76,0.08)',
              borderBottom: '1px solid #C9A84C',
            }}
          >
            <p className="text-sm" style={{ color: '#F0EBE1' }}>
              <span style={{ color: '#C9A84C' }}>Free trial</span>
              {' — '}
              <strong>{trialDays} day{trialDays !== 1 ? 's' : ''} remaining.</strong>
              {' '}Upgrade to keep your agents running.
            </p>
            <Button variant="secondary" size="sm">Upgrade</Button>
          </div>
        )}

        {/* ── Scrollable Content ── */}
        <main className="flex-1 overflow-y-auto p-10 space-y-8">

          {/* Page heading */}
          <div>
            <p className="text-xs uppercase tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>
              Command Center
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>
              Dashboard
            </h1>
          </div>

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Monthly Revenue"     value="PKR 0" sub="This Month" />
            <KpiCard label="Total Interactions"  value="0"     sub="All Time" />
            <KpiCard label="Active Agents"       value="0"     sub="Deployed" />
            <KpiCard
              label="Health Score"
              value={String(tenant?.health_score ?? 50)}
              sub="Platform Health"
              valueColor={hColor}
            />
          </div>

          {/* ── Churn Risk ── */}
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-lg w-fit"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: churn.color }} />
            <p className="text-sm" style={{ color: '#6b6b6b' }}>
              Churn Risk:{' '}
              <span className="font-medium" style={{ color: churn.color }}>
                {churn.label}
              </span>
              <span className="ml-2 text-xs" style={{ color: '#6b6b6b' }}>
                Score: {tenant?.churn_risk_score ?? 0}
              </span>
            </p>
          </div>

          {/* ── Agent Cards ── */}
          <section>
            <h2
              className="font-bebas text-2xl tracking-[0.2em] mb-5"
              style={{ color: '#C9A84C' }}
            >
              Your Agents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AgentDashCard
                number="INTAKE AGENT"
                name="Intake"
                description="The front door of your business. Receives every message across every channel. Responds instantly. Routes intelligently."
                channels={['whatsapp', 'email', 'web']}
                tag="All Sectors"
              />
              <AgentDashCard
                number="RESEARCH AGENT"
                name="Research"
                description="Your intelligence engine. Monitors competitors, regulations, and markets in real time. Delivers daily briefs."
                channels={['web']}
                tag="Finance · Legal"
              />
              <AgentDashCard
                number="OPERATIONS AGENT"
                name="Operations"
                description="The workhorse. Automates every repeatable workflow end-to-end. Scheduling, reporting, follow-ups — handled autonomously."
                channels={['email']}
                tag="All Sectors"
              />
            </div>
          </section>

          {/* ── Activity Feed ── */}
          <section>
            <h2
              className="font-bebas text-2xl tracking-[0.2em] mb-4"
              style={{ color: '#C9A84C' }}
            >
              Recent Activity
            </h2>
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center text-center"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', minHeight: '160px' }}
            >
              <Activity size={32} className="mb-3 opacity-30" style={{ color: '#6b6b6b' }} />
              <p className="text-sm mb-1" style={{ color: 'rgba(240,235,225,0.6)' }}>
                No activity yet.
              </p>
              <p className="text-xs" style={{ color: '#6b6b6b' }}>
                Deploy your first agent to get started.
              </p>
            </div>
          </section>

          {/* ── ROI Panel ── */}
          <div
            className="rounded-lg p-6 flex items-center justify-between gap-6"
            style={{
              background: 'rgba(201,168,76,0.04)',
              borderLeft: '3px solid #C9A84C',
              border: '1px solid rgba(201,168,76,0.15)',
              borderLeftWidth: '3px',
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#6b6b6b' }}>
                LYCHO has delivered
              </p>
              <p
                className="font-bebas tracking-wider leading-none"
                style={{ fontSize: '3.5rem', color: '#C9A84C' }}
              >
                PKR 0
              </p>
              <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
                in value this month
              </p>
            </div>
            <div className="flex items-center gap-2 text-right max-w-[220px]">
              <Zap size={16} className="shrink-0" style={{ color: '#C9A84C', opacity: 0.5 }} />
              <p className="text-xs leading-relaxed" style={{ color: '#6b6b6b' }}>
                Deploy your first agent to start tracking ROI
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
