'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Check, ArrowRight } from 'lucide-react'

const PLANS = [
  { id: 'starter',  name: 'Starter',  price: 9900,  desc: '1 agent · 1,000 interactions/mo' },
  { id: 'growth',   name: 'Growth',   price: 24900, desc: '3 agents · 10,000 interactions/mo' },
  { id: 'business', name: 'Business', price: 59900, desc: '7 agents · unlimited interactions' },
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
  const [selected, setSelected] = useState('growth')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

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
    </div>
  )
}
