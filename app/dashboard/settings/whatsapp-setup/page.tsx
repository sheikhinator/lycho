'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, CheckCircle, Send } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    title: 'Create a Meta Business Account',
    description: 'Go to Meta Business Suite and create or log in to your business account. This is required to access the WhatsApp Business API.',
    actions: [
      { label: 'Open Meta Business Suite', href: 'https://business.facebook.com' },
    ],
  },
  {
    n: '02',
    title: 'Add a WhatsApp Business Number',
    description: 'In your Meta Business Manager, add a dedicated phone number for WhatsApp. This should be a number not already registered with personal WhatsApp.',
    actions: [],
  },
  {
    n: '03',
    title: 'Apply for WhatsApp Cloud API Access',
    description: 'Create a Meta Developer app with Business type, then add the WhatsApp product. Complete your business verification to get API access.',
    actions: [
      { label: 'Meta Developer Portal', href: 'https://developers.facebook.com/apps/' },
    ],
  },
  {
    n: '04',
    title: 'Enter Your Credentials in LYCHO',
    description: 'After approval, copy your Access Token, Phone Number ID, and Business Account ID from the Meta Developer Portal and enter them below.',
    actions: [],
    isForm: true,
  },
  {
    n: '05',
    title: 'Test Your Connection',
    description: 'Send a test message to verify your WhatsApp integration is working correctly.',
    actions: [],
    isTest: true,
  },
]

export default function WhatsAppSetupPage() {
  const [form, setForm] = useState({ access_token: '', phone_number_id: '', business_account_id: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.access_token || !form.phone_number_id || !form.business_account_id) return
    setSaving(true)
    try {
      await fetch('/api/channel-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'whatsapp', credentials: form }),
      })
      setSaved(true)
    } catch {}
    setSaving(false)
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testPhone) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/webhooks/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      })
      setTestResult(res.ok ? 'success' : 'error')
    } catch {
      setTestResult('error')
    }
    setTesting(false)
  }

  const inputStyle: React.CSSProperties = {
    background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1',
    borderRadius: 8, padding: '10px 14px', width: '100%', fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
  }

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm font-sans mb-8"
        style={{ color: '#6b6b6b', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} />
        Back to Settings
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h1 className="font-bebas tracking-wider" style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', color: '#F0EBE1', letterSpacing: '0.05em' }}>
            WhatsApp Cloud API Setup
          </h1>
        </div>
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
          Connect WhatsApp Business API via Meta Developer Portal to enable automated messaging for your AI agents.
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-6">
        {STEPS.map((step, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
            {/* Step header */}
            <div className="flex items-start gap-4 p-5">
              <span className="font-bebas text-2xl shrink-0 mt-0.5" style={{ color: '#C9A84C', letterSpacing: '0.05em', lineHeight: 1 }}>
                {step.n}
              </span>
              <div className="flex-1">
                <p className="text-sm font-sans font-semibold mb-1" style={{ color: '#F0EBE1' }}>{step.title}</p>
                <p className="text-sm font-sans leading-relaxed" style={{ color: '#6b6b6b' }}>{step.description}</p>
                {step.actions.length > 0 && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    {step.actions.map(a => (
                      <a
                        key={a.label}
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)', textDecoration: 'none' }}
                      >
                        {a.label}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 04 — credentials form */}
            {step.isForm && (
              <div className="px-5 pb-5" style={{ borderTop: '1px solid #2a2a2a', paddingTop: 16 }}>
                <form onSubmit={handleSave} className="space-y-3">
                  {[
                    { label: 'Access Token', key: 'access_token', placeholder: 'EAAxxxxxxxxxxxxxxx...' },
                    { label: 'Phone Number ID', key: 'phone_number_id', placeholder: '1234567890123' },
                    { label: 'Business Account ID', key: 'business_account_id', placeholder: '9876543210987' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-sans uppercase tracking-widest mb-1.5" style={{ color: '#6b6b6b' }}>{f.label}</label>
                      <input
                        type={f.key === 'access_token' ? 'password' : 'text'}
                        style={inputStyle}
                        placeholder={f.placeholder}
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                      />
                    </div>
                  ))}

                  {saved && (
                    <div className="flex items-center gap-2 text-xs font-sans" style={{ color: '#4ade80' }}>
                      <CheckCircle size={13} />
                      Credentials saved successfully
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving || !form.access_token || !form.phone_number_id || !form.business_account_id}
                    className="px-5 py-2.5 rounded-lg text-sm font-sans font-semibold transition-all"
                    style={{
                      background: saving || !form.access_token ? '#2a2a2a' : '#C9A84C',
                      color: saving || !form.access_token ? '#6b6b6b' : '#070707',
                      cursor: saving || !form.access_token ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving ? 'Saving…' : 'Save Credentials'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 05 — test */}
            {step.isTest && (
              <div className="px-5 pb-5" style={{ borderTop: '1px solid #2a2a2a', paddingTop: 16 }}>
                <form onSubmit={handleTest} className="flex gap-3">
                  <input
                    type="tel"
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="+92 300 0000000"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                  />
                  <button
                    type="submit"
                    disabled={testing || !testPhone}
                    className="px-4 py-2.5 rounded-lg text-sm font-sans font-semibold flex items-center gap-2 shrink-0"
                    style={{ background: '#C9A84C', color: '#070707', opacity: testing || !testPhone ? 0.5 : 1, cursor: testing || !testPhone ? 'not-allowed' : 'pointer' }}
                  >
                    <Send size={14} />
                    {testing ? 'Sending…' : 'Send Test'}
                  </button>
                </form>
                {testResult === 'success' && (
                  <p className="text-xs font-sans mt-2" style={{ color: '#4ade80' }}>✓ Test message sent successfully!</p>
                )}
                {testResult === 'error' && (
                  <p className="text-xs font-sans mt-2" style={{ color: '#f87171' }}>✗ Test failed — check your credentials</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Timeline note */}
      <div className="mt-8 p-5 rounded-xl" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}>
        <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>Expected Timeline</p>
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
          Meta API access review typically takes <strong style={{ color: '#F0EBE1' }}>1–7 business days</strong> after business verification is complete.
        </p>
      </div>
    </div>
  )
}
