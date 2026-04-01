'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Check, ArrowRight } from 'lucide-react'

const PLANS = [
  { id: 'starter',  name: 'Starter',  price: 9900,  annual: 7920,  desc: '1 agent · 1,000 interactions/mo' },
  { id: 'growth',   name: 'Growth',   price: 24900, annual: 19920, desc: '3 agents · 10,000 interactions/mo' },
  { id: 'business', name: 'Business', price: 59900, annual: 47920, desc: '7 agents · unlimited interactions' },
]

const PAYMENT_METHODS = [
  { id: 'jazzcash',  label: 'JazzCash',       envKey: 'NEXT_PUBLIC_JAZZCASH_NUMBER' },
  { id: 'easypaisa', label: 'EasyPaisa',      envKey: 'NEXT_PUBLIC_EASYPAISA_NUMBER' },
  { id: 'sadapay',   label: 'SadaPay',        envKey: 'NEXT_PUBLIC_SADAPAY_NUMBER' },
  { id: 'nayapay',   label: 'NayaPay',        envKey: 'NEXT_PUBLIC_NAYAPAY_NUMBER' },
  { id: 'bank',      label: 'Bank Transfer',  envKey: 'NEXT_PUBLIC_BANK_IBAN' },
  { id: 'crypto',    label: 'Crypto (USDT TRC20)', envKey: 'NEXT_PUBLIC_CRYPTO_WALLET' },
  { id: 'wire',      label: 'International Wire',  envKey: 'NEXT_PUBLIC_SWIFT_DETAILS' },
]

const FEATURES = [
  '7 AI agents during trial',
  'All channels: WhatsApp, Email, Web, SMS',
  'Unlimited interactions during trial',
  'Full platform access',
  'Lead scoring & analytics',
  'Hot lead alerts & escalation',
]

export default function ActivatePage() {
  const [selected, setSelected]         = useState('growth')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  // Manual payment state
  const [manualMethod, setManualMethod]   = useState('')
  const [manualTxId, setManualTxId]       = useState('')
  const [manualNotes, setManualNotes]     = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualMsg, setManualMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const selectedPlan = PLANS.find(p => p.id === selected)!
  const amount = billingCycle === 'annual' ? selectedPlan.annual : selectedPlan.price

  const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.id === manualMethod)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentDetail = selectedPaymentMethod ? (process.env as any)[selectedPaymentMethod.envKey] || 'Contact support' : ''

  async function handleManualSubmit() {
    if (!manualMethod) { setManualMsg({ type: 'error', text: 'Please select a payment method.' }); return }
    setManualLoading(true)
    setManualMsg(null)
    try {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selected,
          billing_cycle: billingCycle,
          amount_pkr: amount,
          payment_method: manualMethod,
          transaction_id: manualTxId || undefined,
          notes: manualNotes || undefined,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setManualMsg({ type: 'success', text: json.message || 'Payment request submitted! You will be activated within 24 hours.' })
        setManualTxId('')
        setManualNotes('')
      } else {
        setManualMsg({ type: 'error', text: json.error || 'Failed to submit. Please try again.' })
      }
    } catch {
      setManualMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setManualLoading(false)
    }
  }

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: selected, billing_cycle: 'monthly', provider: 'safepay', trial: true }),
      })
      const json = await res.json()
      if (json.data?.mock) {
        setError(json.data.message ?? 'Payment coming soon. Email hello@lycho.app to activate.')
        return
      }
      if (json.data?.checkout_url) {
        window.location.href = json.data.checkout_url
      } else {
        setError('Could not initiate checkout. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Logo size="md" />
      </div>

      <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#F0EBE1', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px' }}>
        WELCOME TO LYCHO
      </h1>
      <p style={{ color: '#6b6b6b', fontSize: '14px', fontFamily: 'sans-serif', textAlign: 'center', marginBottom: '40px', maxWidth: '480px' }}>
        Start your 7-day trial for PKR 999 — full refund if cancelled within 7 days.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', width: '100%', maxWidth: '860px' }}>
        {/* Features */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px' }}>
          <p style={{ color: '#C9A84C', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            What&apos;s included
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color="#C9A84C" />
                </div>
                <span style={{ color: '#F0EBE1', fontSize: '13px', fontFamily: 'sans-serif' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector + CTA */}
        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: '#C9A84C', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Choose your plan (after trial)
          </p>

          {PLANS.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                border: selected === plan.id ? '1px solid rgba(201,168,76,0.6)' : '1px solid #2a2a2a',
                background: selected === plan.id ? 'rgba(201,168,76,0.06)' : '#1a1a1a',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ color: '#F0EBE1', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 600, margin: 0 }}>{plan.name}</p>
                <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', margin: '2px 0 0' }}>{plan.desc}</p>
              </div>
              <p style={{ color: '#C9A84C', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
                PKR {plan.price.toLocaleString('en-PK')}/mo
              </p>
            </button>
          ))}

          <div style={{ marginTop: '8px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', textAlign: 'center' }}>
            <p style={{ color: '#C9A84C', fontSize: '13px', fontFamily: 'sans-serif', margin: '0 0 4px', fontWeight: 600 }}>Trial: PKR 999</p>
            <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', margin: 0 }}>7 days full access · full refund if cancelled</p>
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: '12px', fontFamily: 'sans-serif', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: '#C9A84C',
              color: '#070707',
              fontFamily: 'sans-serif',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
          >
            {loading ? 'Processing…' : <><ArrowRight size={16} />Start Trial — PKR 999</>}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <Link href="/demo" style={{ color: '#6b6b6b', fontSize: '12px', fontFamily: 'sans-serif', textDecoration: 'none' }}>
              Not ready? Book a free demo
            </Link>
            <Link href="/login" style={{ color: '#4a4a4a', fontSize: '11px', fontFamily: 'sans-serif', textDecoration: 'none' }}>
              Use a different account
            </Link>
          </div>
        </div>
      </div>

      {/* OR PAY MANUALLY */}
      <div style={{ width: '100%', maxWidth: '860px', marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
          <span style={{ color: '#4a4a4a', fontSize: '12px', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>OR PAY MANUALLY</span>
          <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
        </div>

        <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px' }}>
          <p style={{ color: '#C9A84C', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>
            Manual Payment
          </p>

          {/* Billing cycle + plan selector row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ display: 'block', color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '6px' }}>Plan</label>
              <select value={selected} onChange={e => setSelected(e.target.value)}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#F0EBE1', fontSize: '13px', fontFamily: 'sans-serif' }}>
                {PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '6px' }}>Billing</label>
              <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as 'monthly' | 'annual')}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#F0EBE1', fontSize: '13px', fontFamily: 'sans-serif' }}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual (save 20%)</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <label style={{ display: 'block', color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '6px' }}>Amount (PKR)</label>
              <div style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#C9A84C', fontSize: '13px', fontFamily: 'sans-serif', fontWeight: 600 }}>
                {amount.toLocaleString('en-PK')}
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '6px' }}>Payment Method</label>
            <select value={manualMethod} onChange={e => setManualMethod(e.target.value)}
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: manualMethod ? '#F0EBE1' : '#4a4a4a', fontSize: '13px', fontFamily: 'sans-serif' }}>
              <option value="">Select payment method…</option>
              {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          {/* Payment details */}
          {paymentDetail && (
            <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', margin: '0 0 4px' }}>Send PKR {amount.toLocaleString('en-PK')} to:</p>
              <p style={{ color: '#C9A84C', fontSize: '14px', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>{paymentDetail}</p>
            </div>
          )}

          {/* Transaction ID */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '6px' }}>Transaction ID / Reference</label>
            <input type="text" value={manualTxId} onChange={e => setManualTxId(e.target.value)} placeholder="e.g. TXN123456789"
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#F0EBE1', fontSize: '13px', fontFamily: 'sans-serif', boxSizing: 'border-box' }} />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', marginBottom: '6px' }}>Notes (optional)</label>
            <textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="Any additional details…" rows={2}
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', color: '#F0EBE1', fontSize: '13px', fontFamily: 'sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {manualMsg && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '12px',
              background: manualMsg.type === 'success' ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${manualMsg.type === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: manualMsg.type === 'success' ? '#34d399' : '#f87171', fontSize: '12px', fontFamily: 'sans-serif' }}>
              {manualMsg.text}
            </div>
          )}

          <button onClick={handleManualSubmit} disabled={manualLoading}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#1a1a1a', color: '#C9A84C', fontFamily: 'sans-serif', fontWeight: 700, fontSize: '14px', border: '1px solid rgba(201,168,76,0.3)', cursor: manualLoading ? 'default' : 'pointer', opacity: manualLoading ? 0.7 : 1 }}>
            {manualLoading ? 'Submitting…' : 'Submit Payment Request'}
          </button>
          <p style={{ color: '#4a4a4a', fontSize: '11px', fontFamily: 'sans-serif', textAlign: 'center', margin: '8px 0 0' }}>
            Your account will be activated within 24 hours after payment verification.
          </p>
        </div>
      </div>
    </div>
  )
}
