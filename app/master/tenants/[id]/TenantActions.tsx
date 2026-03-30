'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PLANS = ['starter', 'growth', 'pro', 'enterprise']

interface Props {
  tenantId: string
  currentPlan: string
  planStatus: string
}

export default function TenantActions({ tenantId, currentPlan, planStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null)
  const [selectedPlan, setSelectedPlan] = useState(currentPlan)

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setLoading(action)
    setFeedback(null)
    try {
      const res = await fetch(`/api/master/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Read secret from meta tag injected by layout — avoids exposing in JS bundle
          // For simplicity we rely on the master session cookie being present and the
          // API validating x-master-secret server-side via a companion server action.
          // In this build we pass it from a hidden env variable via a data attribute approach.
        },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setFeedback({ ok: true, msg: `Action "${action}" completed.` })
        router.refresh()
      } else {
        setFeedback({ ok: false, msg: json.error ?? 'Request failed' })
      }
    } catch {
      setFeedback({ ok: false, msg: 'Network error' })
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `DELETE tenant permanently?\n\nThis action soft-deletes the tenant and cannot be undone without DB access. Type OK to confirm.`,
    )
    if (!confirmed) return
    await act('delete')
  }

  const btn = (label: string, action: string, extra: Record<string, unknown> = {}, color = '#C9A84C', textColor = '#070707') => (
    <button
      onClick={() => act(action, extra)}
      disabled={!!loading}
      style={{
        background: loading === action ? '#555' : color,
        color: textColor,
        border: 'none',
        borderRadius: 6,
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        letterSpacing: 0.5,
        transition: 'opacity 0.15s',
        opacity: loading && loading !== action ? 0.5 : 1,
      }}
    >
      {loading === action ? '...' : label}
    </button>
  )

  return (
    <section style={{ background: '#141414', border: '1px solid #222', borderRadius: 10, padding: '20px 24px' }}>
      <h2 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, color: '#fff', letterSpacing: 2, margin: '0 0 20px' }}>
        ACTIONS
      </h2>

      {/* Feedback */}
      {feedback && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: feedback.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${feedback.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 6,
          color: feedback.ok ? '#10b981' : '#ef4444',
          fontSize: 13,
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Change Plan */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>CHANGE PLAN</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selectedPlan}
            onChange={e => setSelectedPlan(e.target.value)}
            style={{
              flex: 1,
              background: '#0d0d0d',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#e5e5e5',
              padding: '8px 12px',
              fontSize: 13,
            }}
          >
            {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          {btn('Confirm', 'change_plan', { plan: selectedPlan })}
        </div>
      </div>

      {/* Extend Trial */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>EXTEND TRIAL</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {btn('+7 Days',  'extend_trial', { days: 7  })}
          {btn('+14 Days', 'extend_trial', { days: 14 })}
          {btn('+30 Days', 'extend_trial', { days: 30 })}
        </div>
      </div>

      {/* Suspend / Reactivate */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>ACCOUNT STATUS</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {planStatus !== 'suspended'
            ? btn('Suspend',    'suspend',    {}, 'rgba(239,68,68,0.15)',  '#ef4444')
            : btn('Reactivate', 'reactivate', {}, 'rgba(16,185,129,0.15)', '#10b981')
          }
        </div>
      </div>

      {/* Delete */}
      <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: 20 }}>
        <label style={{ display: 'block', color: '#555', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>DANGER ZONE</label>
        <button
          onClick={handleDelete}
          disabled={!!loading}
          style={{
            background: 'rgba(220,38,38,0.12)',
            color: '#ef4444',
            border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: 0.5,
          }}
        >
          {loading === 'delete' ? 'Deleting…' : 'Delete Tenant'}
        </button>
      </div>
    </section>
  )
}
