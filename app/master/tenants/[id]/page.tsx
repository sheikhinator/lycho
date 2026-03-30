import Link from 'next/link'
import TenantActions from './TenantActions'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Agent {
  id: string
  agent_type: string
  display_name: string
  status: string
  interactions_count: number
  created_at: string
}
interface TeamMember {
  id: string
  full_name: string | null
  role: string
  email_verified: boolean
  last_login_at: string | null
  created_at: string
}
interface Tenant {
  id: string
  business_name: string
  business_email: string
  plan: string
  plan_status: string
  trial_ends_at: string | null
  health_score: number
  churn_risk_score: number
  sector: string | null
  country: string
  created_at: string
}

function StatusBadge({ s }: { s: string }) {
  const colors: Record<string, [string, string]> = {
    active:    ['rgba(16,185,129,0.15)', '#10b981'],
    trialing:  ['rgba(245,158,11,0.15)', '#f59e0b'],
    suspended: ['rgba(239,68,68,0.15)',  '#ef4444'],
    paused:    ['rgba(239,68,68,0.15)',  '#ef4444'],
  }
  const [bg, color] = colors[s] ?? ['#222', '#888']
  return (
    <span style={{ background: bg, color, padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
      {s}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', padding: '10px 0' }}>
      <span style={{ width: 180, color: '#555', fontSize: 12, letterSpacing: 0.5 }}>{label}</span>
      <span style={{ color: '#ddd', fontSize: 13 }}>{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const masterSecret = process.env.MASTER_SECRET ?? ''
  const baseUrl      = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const res  = await fetch(`${baseUrl}/api/master/tenants/${id}`, {
    headers: { 'x-master-secret': masterSecret },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({ data: null }))

  if (!json.data?.tenant) {
    return (
      <div style={{ padding: 40, color: '#ef4444', fontFamily: 'Inter, sans-serif' }}>
        Tenant not found or access denied.{' '}
        <Link href="/master" style={{ color: '#C9A84C' }}>Back</Link>
      </div>
    )
  }

  const { tenant, agents, team }: { tenant: Tenant; agents: Agent[]; team: TeamMember[] } = json.data

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1100, fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, fontSize: 13, color: '#555' }}>
        <Link href="/master" style={{ color: '#C9A84C', textDecoration: 'none' }}>Master</Link>
        {' / '}
        <Link href="/master/tenants" style={{ color: '#C9A84C', textDecoration: 'none' }}>Tenants</Link>
        {' / '}
        <span style={{ color: '#aaa' }}>{tenant.business_name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 36,
            color: '#C9A84C',
            letterSpacing: 4,
            margin: 0,
          }}>
            {tenant.business_name}
          </h1>
          <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge s={tenant.plan_status} />
            <span style={{ color: '#555', fontSize: 12 }}>{tenant.business_email}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>

        {/* Tenant Info */}
        <section style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, padding: '20px 24px' }}>
          <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: '#fff', letterSpacing: 2, margin: '0 0 16px' }}>
            PROFILE
          </h2>
          <InfoRow label="Plan"          value={<span style={{ color: '#C9A84C', fontWeight: 600 }}>{tenant.plan?.toUpperCase()}</span>} />
          <InfoRow label="Status"        value={<StatusBadge s={tenant.plan_status} />} />
          <InfoRow label="Trial Ends"    value={tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString('en-GB') : '—'} />
          <InfoRow label="Health Score"  value={tenant.health_score} />
          <InfoRow label="Churn Risk"    value={tenant.churn_risk_score} />
          <InfoRow label="Sector"        value={tenant.sector ?? '—'} />
          <InfoRow label="Country"       value={tenant.country} />
          <InfoRow label="Joined"        value={new Date(tenant.created_at).toLocaleDateString('en-GB')} />
        </section>

        {/* Actions panel — client component */}
        <TenantActions tenantId={tenant.id} currentPlan={tenant.plan} planStatus={tenant.plan_status} />
      </div>

      {/* Agents Table */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: '#fff', letterSpacing: 3, marginBottom: 14 }}>
          AGENTS ({agents.length})
        </h2>
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Name', 'Type', 'Status', 'Interactions', 'Created'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', color: '#555', textAlign: 'left', fontSize: 11, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#444' }}>No agents</td></tr>
              )}
              {agents.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < agents.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <td style={{ padding: '11px 16px', color: '#e5e5e5' }}>{a.display_name ?? '—'}</td>
                  <td style={{ padding: '11px 16px', color: '#888' }}>{a.agent_type}</td>
                  <td style={{ padding: '11px 16px' }}><StatusBadge s={a.status} /></td>
                  <td style={{ padding: '11px 16px', color: '#aaa' }}>{a.interactions_count.toLocaleString()}</td>
                  <td style={{ padding: '11px 16px', color: '#555', fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Team Table */}
      <section>
        <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, color: '#fff', letterSpacing: 3, marginBottom: 14 }}>
          TEAM MEMBERS ({team.length})
        </h2>
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Name', 'Role', 'Verified', 'Last Login', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', color: '#555', textAlign: 'left', fontSize: 11, letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#444' }}>No team members</td></tr>
              )}
              {team.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < team.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <td style={{ padding: '11px 16px', color: '#e5e5e5' }}>{m.full_name ?? '—'}</td>
                  <td style={{ padding: '11px 16px', color: '#888' }}>{m.role}</td>
                  <td style={{ padding: '11px 16px', color: m.email_verified ? '#10b981' : '#ef4444', fontSize: 12 }}>
                    {m.email_verified ? 'Yes' : 'No'}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#555', fontSize: 12 }}>
                    {m.last_login_at ? new Date(m.last_login_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#555', fontSize: 12 }}>
                    {new Date(m.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
