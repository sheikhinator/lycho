import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Activity, Zap, MessageSquare, Mail, Globe2 } from 'lucide-react'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Button } from '@/components/ui'
import type { Tenant } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Command Center — LYCHO' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysRemaining(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function healthColor(score: number): string {
  if (score >= 70) return '#4ade80'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

function churnLabel(score: number): { label: string; color: string } {
  if (score <= 20) return { label: 'Low',    color: '#4ade80' }
  if (score <= 50) return { label: 'Medium', color: '#fbbf24' }
  return                  { label: 'High',   color: '#f87171' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, valueColor }: {
  label: string; value: string; sub: string; valueColor?: string
}) {
  return (
    <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>{label}</p>
      <p className="font-bebas text-4xl tracking-wider leading-none mb-2" style={{ color: valueColor ?? '#F0EBE1' }}>
        {value}
      </p>
      <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{sub}</p>
    </div>
  )
}

function AgentDashCard({ number, name, description, channels, tag }: {
  number: string; name: string; description: string
  channels: Array<'whatsapp' | 'email' | 'web'>; tag: string
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
          <p className="text-xs font-sans tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>{number}</p>
          <h3 className="font-bebas text-2xl tracking-wider" style={{ color: '#F0EBE1' }}>{name}</h3>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-sans"
          style={{ background: 'rgba(107,107,107,0.15)', border: '1px solid rgba(107,107,107,0.3)', color: '#6b6b6b' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6b6b6b' }} />
          configuring
        </span>
      </div>

      <p className="text-xs font-sans leading-relaxed flex-1" style={{ color: '#6b6b6b' }}>{description}</p>

      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="flex gap-2" style={{ color: '#6b6b6b' }}>
          {channels.map(ch => (
            <span key={ch} title={ch} className="hover:text-gold transition-colors">{channelIcons[ch]}</span>
          ))}
        </div>
        <span
          className="text-xs font-sans tracking-widest uppercase"
          style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.28)', padding: '2px 8px' }}
        >
          {tag}
        </span>
      </div>

      <Button variant="secondary" size="sm" className="w-full mt-1">Deploy Agent</Button>
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

  const tenant      = userRow?.tenants ?? null
  const businessName = tenant?.business_name ?? 'Your Business'
  const initials    = businessName.charAt(0).toUpperCase()
  const trialing    = tenant?.plan_status === 'trialing'
  const trialDays   = daysRemaining(tenant?.trial_ends_at ?? null)
  const tenantId    = tenant?.id ?? null

  const [interactionsRes, activeAgentsRes, revenueRes, recentActivityRes] = tenantId
    ? await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
        supabase.from('subscriptions').select('amount_pkr').eq('tenant_id', tenantId)
          .gte('current_period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lte('current_period_end', new Date().toISOString()),
        supabase.from('conversations').select('id, channel, status, contact_identifier, created_at')
          .eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
      ])
    : [{ count: 0 }, { count: 0 }, { data: [] }, { data: [] }]

  const totalInteractions = interactionsRes.count ?? 0
  const activeAgentsCount = activeAgentsRes.count ?? 0
  const monthlyRevenue    = (revenueRes.data ?? []).reduce((sum: number, s: { amount_pkr: number | null }) => sum + (s.amount_pkr ?? 0), 0)
  const recentActivity    = recentActivityRes.data ?? []
  const hColor            = healthColor(tenant?.health_score ?? 50)
  const churn             = churnLabel(tenant?.churn_risk_score ?? 0)

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar
          businessName={businessName}
          initials={initials}
          planStatus={tenant?.plan_status ?? null}
          trialDays={trialDays}
        />

        {/* Trial Banner */}
        {trialing && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6 py-3 shrink-0"
            style={{ background: 'rgba(201,168,76,0.08)', borderBottom: '1px solid #C9A84C' }}
          >
            <p className="text-sm font-sans" style={{ color: '#F0EBE1' }}>
              <span style={{ color: '#C9A84C' }}>Free trial</span>
              {' — '}
              <strong>{trialDays} day{trialDays !== 1 ? 's' : ''} remaining.</strong>
              {' '}Upgrade to keep your agents running.
            </p>
            <Button variant="secondary" size="sm">Upgrade</Button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8">
          {/* Heading */}
          <div>
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>
              Command Center
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>Dashboard</h1>
          </div>

          {/* KPI Row — 1 col mobile, 2 tablet, 4 desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Monthly Revenue"    value={`PKR ${monthlyRevenue.toLocaleString()}`} sub="This Month" />
            <KpiCard label="Total Interactions" value={String(totalInteractions)} sub="All Time" />
            <KpiCard label="Active Agents"      value={String(activeAgentsCount)} sub="Deployed" />
            <KpiCard label="Health Score"       value={String(tenant?.health_score ?? 50)} sub="Platform Health" valueColor={hColor} />
          </div>

          {/* Churn Risk */}
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-lg w-fit"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: churn.color }} />
            <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
              Churn Risk:{' '}
              <span className="font-medium" style={{ color: churn.color }}>{churn.label}</span>
              <span className="ml-2 text-xs" style={{ color: '#6b6b6b' }}>Score: {tenant?.churn_risk_score ?? 0}</span>
            </p>
          </div>

          {/* Agent Cards */}
          <section>
            <h2 className="font-bebas text-2xl tracking-[0.2em] mb-5" style={{ color: '#C9A84C' }}>Your Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AgentDashCard number="INTAKE AGENT" name="Intake" description="The front door of your business. Receives every message across every channel. Responds instantly. Routes intelligently." channels={['whatsapp', 'email', 'web']} tag="All Sectors" />
              <AgentDashCard number="RESEARCH AGENT" name="Research" description="Your intelligence engine. Monitors competitors, regulations, and markets in real time. Delivers daily briefs." channels={['web']} tag="Finance · Legal" />
              <AgentDashCard number="OPERATIONS AGENT" name="Operations" description="The workhorse. Automates every repeatable workflow end-to-end. Scheduling, reporting, follow-ups — handled autonomously." channels={['email']} tag="All Sectors" />
            </div>
          </section>

          {/* Activity Feed */}
          <section>
            <h2 className="font-bebas text-2xl tracking-[0.2em] mb-4" style={{ color: '#C9A84C' }}>Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div
                className="rounded-lg p-8 flex flex-col items-center justify-center text-center"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', minHeight: '160px' }}
              >
                <Activity size={32} className="mb-3 opacity-30" style={{ color: '#6b6b6b' }} />
                <p className="text-sm font-sans mb-1" style={{ color: 'rgba(240,235,225,0.6)' }}>No activity yet.</p>
                <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Deploy your first agent to get started.</p>
              </div>
            ) : (
              <div className="rounded-lg" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                {recentActivity.map((conv: {
                  id: string; channel: string | null; status: string
                  contact_identifier: string | null; created_at: string
                }) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid #2a2a2a' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-sans uppercase tracking-widest shrink-0" style={{ color: '#6b6b6b' }}>
                        {conv.channel ?? 'unknown'}
                      </span>
                      <span className="text-sm font-sans truncate" style={{ color: '#F0EBE1' }}>
                        {conv.contact_identifier ?? 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="text-xs font-sans px-2 py-0.5 rounded"
                        style={{
                          background: conv.status === 'open' ? 'rgba(74,222,128,0.1)' : 'rgba(107,107,107,0.12)',
                          color: conv.status === 'open' ? '#4ade80' : '#6b6b6b',
                          border: `1px solid ${conv.status === 'open' ? 'rgba(74,222,128,0.25)' : 'rgba(107,107,107,0.25)'}`,
                        }}
                      >
                        {conv.status}
                      </span>
                      <span className="text-xs font-sans hidden sm:block" style={{ color: '#6b6b6b' }}>
                        {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ROI Panel */}
          <div
            className="rounded-lg p-6 flex flex-wrap items-center justify-between gap-4"
            style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderLeft: '3px solid #C9A84C' }}
          >
            <div>
              <p className="text-xs font-sans uppercase tracking-widest mb-1" style={{ color: '#6b6b6b' }}>LYCHO has delivered</p>
              <p className="font-bebas tracking-wider leading-none" style={{ fontSize: '3.5rem', color: '#C9A84C' }}>PKR 0</p>
              <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>in value this month</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={16} className="shrink-0" style={{ color: '#C9A84C', opacity: 0.5 }} />
              <p className="text-xs font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>
                Deploy your first agent to start tracking ROI
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
