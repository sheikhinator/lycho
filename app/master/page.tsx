import { headers } from 'next/headers'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  total_tenants: number
  active_trials: number
  paying_clients: number
  total_mrr_pkr: number
  interactions_today: number
  agents_deployed: number
  recent_signups: Array<{ id: string; business_name: string; plan: string; created_at: string }>
}

interface Tenant {
  id: string
  business_name: string
  plan: string
  plan_status: string
  trial_ends_at: string | null
  health_score: number
  created_at: string
  agent_count: number
  conversation_count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function trialDaysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function planBadgeColor(status: string) {
  if (status === 'active')    return { bg: 'rgba(16,185,129,0.15)', color: '#10b981' }
  if (status === 'trialing')  return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' }
  if (status === 'suspended') return { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' }
  return { bg: '#222', color: '#888' }
}

function pkrFormat(n: number) {
  return 'Rs ' + n.toLocaleString('en-PK', { maximumFractionDigits: 0 })
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: '#141414',
      border: '1px solid #222',
      borderRadius: 10,
      padding: '20px 24px',
    }}>
      <div style={{ color: '#666', fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>{label}</div>
      <div style={{ color: '#C9A84C', fontSize: 28, fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 1 }}>
        {value}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function MasterDashboardPage() {
  const masterSecret = process.env.MASTER_SECRET ?? ''
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  // Fetch stats + tenants in parallel
  const [statsRes, tenantsRes] = await Promise.all([
    fetch(`${baseUrl}/api/master/stats`, {
      headers: { 'x-master-secret': masterSecret },
      cache: 'no-store',
    }),
    fetch(`${baseUrl}/api/master/tenants`, {
      headers: { 'x-master-secret': masterSecret },
      cache: 'no-store',
    }),
  ])

  const statsJson   = await statsRes.json().catch(() => ({ data: null }))
  const tenantsJson = await tenantsRes.json().catch(() => ({ data: [] }))

  const stats: Stats   = statsJson.data   ?? {}
  const tenants: Tenant[] = tenantsJson.data ?? []

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1200 }}>

      {/* Title */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 42,
          color: '#C9A84C',
          letterSpacing: 5,
          margin: 0,
        }}>
          MASTER COMMAND CENTER
        </h1>
        <p style={{ color: '#555', fontSize: 13, margin: '6px 0 0' }}>
          Live snapshot — refreshes on each page load
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        <KpiCard label="TOTAL TENANTS"      value={stats.total_tenants ?? 0} />
        <KpiCard label="ACTIVE TRIALS"      value={stats.active_trials ?? 0} />
        <KpiCard label="PAYING CLIENTS"     value={stats.paying_clients ?? 0} />
        <KpiCard label="TOTAL MRR (PKR)"    value={pkrFormat(stats.total_mrr_pkr ?? 0)} />
        <KpiCard label="INTERACTIONS TODAY" value={stats.interactions_today ?? 0} />
        <KpiCard label="AGENTS DEPLOYED"    value={stats.agents_deployed ?? 0} />
      </div>

      {/* Tenants Table */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22,
          color: '#fff',
          letterSpacing: 3,
          marginBottom: 16,
        }}>
          ALL TENANTS
        </h2>
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                {['Business', 'Plan', 'Status', 'Trial Left', 'Health', 'Joined', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', color: '#555', fontWeight: 600, textAlign: 'left', fontSize: 11, letterSpacing: 1 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#444' }}>No tenants yet</td>
                </tr>
              )}
              {tenants.map((t, i) => {
                const badge = planBadgeColor(t.plan_status)
                const daysLeft = trialDaysLeft(t.trial_ends_at)
                return (
                  <tr key={t.id} style={{ borderBottom: i < tenants.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#e5e5e5', fontWeight: 500 }}>{t.business_name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#222', color: '#C9A84C', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>
                        {t.plan?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {t.plan_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#aaa' }}>
                      {daysLeft !== null ? `${daysLeft}d` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {/* Health score bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${t.health_score ?? 0}%`,
                            background: (t.health_score ?? 0) >= 70 ? '#10b981' : (t.health_score ?? 0) >= 40 ? '#f59e0b' : '#ef4444',
                            borderRadius: 2,
                          }} />
                        </div>
                        <span style={{ color: '#666', fontSize: 11, width: 28 }}>{t.health_score ?? 0}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#555', fontSize: 12 }}>
                      {new Date(t.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/master/tenants/${t.id}`} style={{
                        color: '#C9A84C',
                        fontSize: 12,
                        textDecoration: 'none',
                        border: '1px solid #C9A84C44',
                        padding: '4px 10px',
                        borderRadius: 5,
                      }}>
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Signups */}
      <section>
        <h2 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 22,
          color: '#fff',
          letterSpacing: 3,
          marginBottom: 16,
        }}>
          RECENT SIGNUPS
        </h2>
        <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, padding: '8px 0' }}>
          {(stats.recent_signups ?? []).length === 0 && (
            <p style={{ padding: '16px 24px', color: '#444', fontSize: 13 }}>No signups yet</p>
          )}
          {(stats.recent_signups ?? []).map((s, i) => (
            <div key={s.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: i < (stats.recent_signups?.length ?? 0) - 1 ? '1px solid #1a1a1a' : 'none',
            }}>
              <span style={{ color: '#e5e5e5', fontSize: 13 }}>{s.business_name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#C9A84C', fontSize: 11, fontWeight: 600 }}>{s.plan?.toUpperCase()}</span>
                <span style={{ color: '#555', fontSize: 11 }}>{new Date(s.created_at).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
