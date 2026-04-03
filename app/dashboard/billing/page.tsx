'use client'

import { useEffect, useState } from 'react'
import { Check, FileText, Download, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { createClientSupabase } from '@/lib/supabase'

async function postCheckout(plan: string, billing_cycle: string): Promise<{ mock?: boolean; checkout_url?: string; message?: string } | null> {
  try {
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billing_cycle, provider: 'safepay', currency: 'PKR' }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    return null
  }
}

interface Plan {
  id: string
  name: string
  priceMonthly: number
  priceAnnual: number
  currency: string
  description: string
  features: string[]
  highlight?: boolean
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 9900,
    priceAnnual: 7920,
    currency: 'PKR',
    description: 'For small businesses getting started with AI agents.',
    features: [
      '3 active agents',
      '1,000 conversations / month',
      'WhatsApp + Email channels',
      'Basic analytics',
      'Community support',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 24900,
    priceAnnual: 19920,
    currency: 'PKR',
    description: 'For growing teams that need more agents and channels.',
    features: [
      '10 active agents',
      '10,000 conversations / month',
      'All channels',
      'Advanced analytics',
      'Priority email support',
      'Agent version history',
    ],
    highlight: true,
    cta: 'Upgrade to Growth',
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 59900,
    priceAnnual: 47920,
    currency: 'PKR',
    description: 'For businesses that need full automation at scale.',
    features: [
      'Unlimited agents',
      '100,000 conversations / month',
      'All channels',
      'Full audit log',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Upgrade to Business',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 120000,
    priceAnnual: 96000,
    currency: 'PKR',
    description: 'Custom deployment for large organisations.',
    features: [
      'Everything in Business',
      'On-premise deployment option',
      'Custom model fine-tuning',
      'Dedicated account manager',
      'Custom SLA',
      'Multi-tenant support',
    ],
    cta: 'Contact Sales',
  },
]

const INVOICES = [
  { id: 'INV-2026-003', date: 'Mar 1, 2026',  amount: 'PKR 9,900', status: 'Paid' },
  { id: 'INV-2026-002', date: 'Feb 1, 2026',  amount: 'PKR 9,900', status: 'Paid' },
  { id: 'INV-2026-001', date: 'Jan 1, 2026',  amount: 'PKR 9,900', status: 'Paid' },
  { id: 'INV-2025-012', date: 'Dec 1, 2025',  amount: 'PKR 9,900', status: 'Paid' },
]

function fmt(n: number) {
  return n.toLocaleString('en-PK')
}

export default function BillingPage() {
  const [annual, setAnnual] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const { toast } = useToast()
  const [currentPlan, setCurrentPlan] = useState('starter')
  const [invoices, setInvoices] = useState<{ id: string; date: string; amount: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const billing_cycle = annual ? 'annual' : 'monthly'

  useEffect(() => {
    loadBillingData()
  }, [])

  async function loadBillingData() {
    try {
      const sb = createClientSupabase()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return

      const { data: userRow } = await sb.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userRow?.tenant_id) return

      const { data: tenant } = await sb.from('tenants').select('plan_status').eq('id', userRow.tenant_id).single()
      if (tenant?.plan_status) setCurrentPlan(tenant.plan_status === 'trialing' ? 'starter' : tenant.plan_status)

      const { data: subs } = await sb
        .from('subscriptions')
        .select('amount_pkr, currency, current_period_end, payment_provider')
        .eq('tenant_id', userRow.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (subs && subs.length > 0) {
        setInvoices(subs.map((s, i) => ({
          id: `INV-${new Date().getFullYear()}-${String(subs.length - i).padStart(3, '0')}`,
          date: new Date(s.current_period_end ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          amount: `${s.currency ?? 'PKR'} ${(s.amount_pkr ?? 0).toLocaleString('en-PK')}`,
          status: s.payment_provider ? 'Paid' : 'Pending',
        })))
      }
    } catch {
      // fall back to empty state
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planId: string) {
    if (planId === currentPlan || planId === 'enterprise') return
    setUpgrading(planId)
    try {
      const result = await postCheckout(planId, billing_cycle)
      if (!result) {
        toast('Something went wrong. Please try again.', 'error')
        return
      }
      if (result.mock) {
        toast('Payment coming soon. Email hello@lycho.app to upgrade early.', 'info')
        return
      }
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      }
    } finally {
      setUpgrading(null)
    }
  }

  function handlePlanAction(plan: Plan) {
    if (plan.id === currentPlan) return
    if (plan.id === 'enterprise') {
      toast('Redirecting to sales — our team will be in touch.', 'info')
      return
    }
    handleUpgrade(plan.id)
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-bebas tracking-wider mb-1"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}
        >
          Billing
        </h1>
        <p className="text-sm" style={{ color: '#6b6b6b' }}>
          Manage your plan, billing cycle, and invoices.
        </p>
      </div>

      {/* Current plan banner */}
      <div
        className="rounded-xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <div>
          <p className="text-xs uppercase tracking-widest mb-1 font-sans" style={{ color: '#C9A84C' }}>Current Plan</p>
          <p className="text-xl font-semibold font-sans" style={{ color: '#F0EBE1' }}>Starter — PKR 9,900 / month</p>
          <p className="text-xs mt-1 font-sans" style={{ color: '#6b6b6b' }}>Next renewal: April 1, 2026</p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
          style={{ background: '#C9A84C', color: '#070707' }}
          onClick={() => toast('Manage subscription coming soon.', 'info')}
        >
          Manage Subscription
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Annual toggle */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-sans" style={{ color: annual ? '#6b6b6b' : '#F0EBE1' }}>Monthly</span>
        <button
          className="relative w-11 h-6 rounded-full transition-colors"
          style={{ background: annual ? '#C9A84C' : '#2a2a2a' }}
          onClick={() => setAnnual(v => !v)}
          aria-label="Toggle annual billing"
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full transition-transform"
            style={{
              background: annual ? '#070707' : '#6b6b6b',
              left: annual ? 'calc(100% - 20px)' : '4px',
            }}
          />
        </button>
        <span className="text-sm font-sans" style={{ color: annual ? '#F0EBE1' : '#6b6b6b' }}>
          Annual
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-full font-sans"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
          >
            Save 20%
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan
          const price = annual ? plan.priceAnnual : plan.priceMonthly

          return (
            <div
              key={plan.id}
              className="rounded-xl p-5 flex flex-col"
              style={{
                background: plan.highlight ? 'rgba(201,168,76,0.06)' : '#141414',
                border: plan.highlight
                  ? '1px solid rgba(201,168,76,0.35)'
                  : isCurrent
                    ? '1px solid rgba(201,168,76,0.2)'
                    : '1px solid #2a2a2a',
                position: 'relative',
              }}
            >
              {plan.highlight && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-sans font-medium"
                  style={{ background: '#C9A84C', color: '#070707' }}
                >
                  Most Popular
                </span>
              )}

              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest font-sans mb-1" style={{ color: '#C9A84C' }}>{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-bebas text-3xl" style={{ color: '#F0EBE1', letterSpacing: '0.02em' }}>
                    {plan.id === 'enterprise' ? 'Custom' : `${plan.currency} ${fmt(price)}`}
                  </span>
                  {plan.id !== 'enterprise' && (
                    <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>/ {annual ? 'mo, billed annually' : 'mo'}</span>
                  )}
                </div>
                <p className="text-xs mt-2 font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: '#C9A84C' }} />
                    <span className="text-xs font-sans" style={{ color: '#F0EBE1', opacity: 0.85 }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className="w-full py-2.5 rounded-lg text-xs font-sans font-medium transition-opacity disabled:opacity-50"
                style={
                  isCurrent
                    ? { background: 'rgba(201,168,76,0.1)', color: '#C9A84C', cursor: 'default' }
                    : plan.highlight
                      ? { background: '#C9A84C', color: '#070707' }
                      : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }
                }
                onClick={() => handlePlanAction(plan)}
                disabled={isCurrent || upgrading === plan.id}
              >
                {isCurrent ? 'Current Plan' : upgrading === plan.id ? 'Loading…' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Invoice history */}
      <div>
        <h2
          className="font-bebas tracking-wider mb-4"
          style={{ fontSize: '1.4rem', color: '#F0EBE1', letterSpacing: '0.05em' }}
        >
          Invoice History
        </h2>

        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid #2a2a2a', background: '#141414' }}
        >
          <table className="w-full text-sm font-sans">
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                {['Invoice', 'Date', 'Amount', 'Status', ''].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs uppercase tracking-widest font-sans"
                    style={{ color: '#6b6b6b' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-4 text-center" style={{ color: '#6b6b6b' }}>Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-4 text-center" style={{ color: '#6b6b6b' }}>No invoices yet</td></tr>
              ) : invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  style={{ borderBottom: i < invoices.length - 1 ? '1px solid #2a2a2a' : 'none' }}
                >
                  <td className="px-5 py-4 font-sans" style={{ color: '#F0EBE1' }}>
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: '#6b6b6b' }} />
                      {inv.id}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-sans" style={{ color: '#6b6b6b' }}>{inv.date}</td>
                  <td className="px-5 py-4 font-sans" style={{ color: '#F0EBE1' }}>{inv.amount}</td>
                  <td className="px-5 py-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-sans"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      className="flex items-center gap-1 text-xs font-sans transition-opacity hover:opacity-70 ml-auto"
                      style={{ color: '#C9A84C' }}
                      onClick={() => toast('Invoice download coming soon.', 'info')}
                    >
                      <Download size={12} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
