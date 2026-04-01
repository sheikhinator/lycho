'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = [
  'Retail & E-commerce', 'Real Estate', 'Healthcare & Clinics',
  'Education & Training', 'Food & Restaurants', 'Legal Services',
  'Finance & Banking', 'Travel & Tourism', 'Automotive', 'Manufacturing',
  'Technology & IT', 'Construction', 'Logistics & Delivery',
  'Beauty & Wellness', 'Hotels & Hospitality', 'Recruitment & HR',
  'Insurance', 'Media & Marketing', 'Events & Entertainment',
  'Government & Non-profit',
]

const CHANNELS = ['whatsapp', 'email', 'web', 'sms', 'instagram', 'facebook']

const CURSOR_STYLE = `
  * { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3' fill='%23C9A84C' opacity='0.8'/%3E%3C/svg%3E") 8 8, auto !important; }
  button, a, select { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='3' fill='%23C9A84C'/%3E%3C/svg%3E") 8 8, pointer !important; }
`

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantData {
  id: string
  business_name: string
  business_email: string
  business_phone: string | null
  sector: string | null
  country: string
  onboarding_step: number
  onboarding_completed: boolean
}

interface Summary {
  agentDeployed: boolean
  whatsappConnected: boolean
  teamCount: number
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
          Step {step} of {total}
        </span>
        <span className="text-xs font-sans" style={{ color: '#C9A84C' }}>{pct}%</span>
      </div>
      <div className="h-0.5 rounded-full w-full" style={{ background: '#2a2a2a' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7a6130, #C9A84C)' }}
        />
      </div>
    </div>
  )
}

const BASE_INPUT: React.CSSProperties = {
  background: '#1c1c1c',
  border: '1px solid #2a2a2a',
  color: '#F0EBE1',
  borderRadius: '8px',
  padding: '10px 14px',
  width: '100%',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1.5 font-sans" style={{ color: '#6b6b6b' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function StepWrap({ children, step, total }: { children: React.ReactNode; step?: number; total?: number }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#070707' }}
    >
      <div className="w-full max-w-lg">
        {step !== undefined && total !== undefined && <ProgressBar step={step} total={total} />}
        {children}
      </div>
    </div>
  )
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────

function WelcomeStep({ businessName, onNext }: { businessName: string; onNext: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#070707' }}
    >
      <Logo size="lg" className="mb-12" />

      <h1
        className="font-bebas text-5xl lg:text-6xl tracking-[0.1em] mb-4"
        style={{ color: '#C9A84C', lineHeight: 1.1 }}
      >
        Welcome to LYCHO
        {businessName && (
          <>
            ,&nbsp;
            <span style={{ color: '#F0EBE1' }}>{businessName}.</span>
          </>
        )}
      </h1>

      <p className="font-sans text-base mb-2" style={{ color: '#F0EBE1' }}>
        Your AI workforce is ready to deploy.
      </p>
      <p className="font-sans text-sm mb-10" style={{ color: '#6b6b6b' }}>
        Let&apos;s get you set up in 5 steps.
      </p>

      <div
        className="flex items-center gap-2 mb-10 px-5 py-2.5 rounded-full"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}
      >
        <span style={{ color: '#C9A84C' }}>⏱</span>
        <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Takes about 5 minutes</span>
      </div>

      <Button variant="primary" size="lg" className="w-full max-w-xs" onClick={onNext}>
        Let&apos;s Go
      </Button>
    </div>
  )
}

// ─── Step 1: Business Profile ─────────────────────────────────────────────────

function BusinessProfileStep({
  tenant,
  onNext,
}: {
  tenant: TenantData
  onNext: (data: Partial<TenantData>) => Promise<void>
}) {
  const [name, setName]         = useState(tenant.business_name ?? '')
  const [sector, setSector]     = useState(tenant.sector ?? '')
  const [phone, setPhone]       = useState(tenant.business_phone ?? '')
  const [country, setCountry]   = useState(tenant.country ?? 'Pakistan')
  const [language, setLanguage] = useState('English')
  const [teamSize, setTeamSize] = useState('1-5')
  const [enquiries, setEnquiries] = useState('Under 100')
  const [saving, setSaving]     = useState(false)

  async function handleContinue() {
    if (!name.trim() || !sector) return
    setSaving(true)
    await onNext({
      business_name: name.trim(),
      sector,
      business_phone: phone || null,
      country,
    })
  }

  return (
    <StepWrap step={1} total={4}>
      <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>
        Business Profile
      </p>
      <h1 className="font-bebas text-4xl tracking-[0.1em] mb-1" style={{ color: '#C9A84C' }}>
        Tell us about your business
      </h1>
      <p className="text-sm font-sans mb-7" style={{ color: '#6b6b6b' }}>
        We use this to personalise your agents for your industry.
      </p>

      <div className="space-y-4">
        <Field label="Business Name">
          <input
            style={BASE_INPUT}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Zara Boutique Lahore"
            onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          />
        </Field>

        <Field label="Sector">
          <select
            style={{ ...BASE_INPUT, cursor: 'pointer' }}
            value={sector}
            onChange={e => setSector(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            <option value="">Select your sector…</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Business Phone">
            <input
              style={BASE_INPUT}
              placeholder="+92 300 0000000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
          </Field>
          <Field label="Country">
            <select
              style={{ ...BASE_INPUT, cursor: 'pointer' }}
              value={country}
              onChange={e => setCountry(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              {['Pakistan', 'UAE', 'Saudi Arabia', 'UK', 'USA', 'Other'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Primary Language">
            <select
              style={{ ...BASE_INPUT, cursor: 'pointer' }}
              value={language}
              onChange={e => setLanguage(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              {['English', 'Urdu', 'Arabic', 'Other'].map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Team Size">
            <select
              style={{ ...BASE_INPUT, cursor: 'pointer' }}
              value={teamSize}
              onChange={e => setTeamSize(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              {['1-5', '6-20', '21-50', '50+'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Monthly Customer Enquiries">
          <select
            style={{ ...BASE_INPUT, cursor: 'pointer' }}
            value={enquiries}
            onChange={e => setEnquiries(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            {['Under 100', '100-500', '500-2000', '2000+'].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-6"
        disabled={!name.trim() || !sector || saving}
        onClick={handleContinue}
      >
        {saving ? 'Saving…' : 'Continue'}
      </Button>
    </StepWrap>
  )
}

// ─── Step 2: Deploy First Agent ───────────────────────────────────────────────

function DeployAgentStep({
  tenant,
  onNext,
  onAgentDeployed,
}: {
  tenant: TenantData
  onNext: () => Promise<void>
  onAgentDeployed: () => void
}) {
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState('Intake Agent')
  const [channels, setChannels]       = useState(['whatsapp', 'web'])
  const [deploying, setDeploying]     = useState(false)

  function toggleChannel(ch: string) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  async function handleDeploy() {
    setDeploying(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: 'intake_agent',
          display_name: displayName || 'Intake Agent',
          channels,
          status: 'active',
        }),
      })
      if (res.ok) {
        onAgentDeployed()
        toast('Intake Agent deployed successfully', 'success')
      } else {
        toast('Deploy failed — you can set this up from the Agents page', 'error')
      }
    } catch {
      toast('Network error — continuing anyway', 'error')
    }
    await onNext()
  }

  return (
    <StepWrap step={2} total={4}>
      <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>
        First Agent
      </p>
      <h1 className="font-bebas text-4xl tracking-[0.1em] mb-1" style={{ color: '#C9A84C' }}>
        Deploy your first agent
      </h1>
      <p className="text-sm font-sans mb-7" style={{ color: '#6b6b6b' }}>
        Your Intake Agent handles every inbound message — 24/7, in any language.
      </p>

      {/* Agent card */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.3)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.2)',
            }}
          >
            <Zap size={22} style={{ color: '#C9A84C' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-sans font-semibold text-sm" style={{ color: '#F0EBE1' }}>
                Intake Agent
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded font-sans"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                Recommended{tenant.sector ? ` for ${tenant.sector}` : ''}
              </span>
            </div>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
              Qualifies leads, captures contact info, and escalates hot prospects — automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Agent Display Name">
          <input
            style={BASE_INPUT}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          />
        </Field>

        <Field label="Active Channels">
          <div className="flex flex-wrap gap-2 mt-1">
            {CHANNELS.map(ch => {
              const active = channels.includes(ch)
              return (
                <button
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className="px-3 py-1.5 rounded-lg text-xs font-sans capitalize transition-all"
                  style={{
                    background: active ? 'rgba(201,168,76,0.1)' : '#1c1c1c',
                    border: `1px solid ${active ? '#C9A84C' : '#2a2a2a'}`,
                    color: active ? '#C9A84C' : '#6b6b6b',
                  }}
                >
                  {ch}
                </button>
              )
            })}
          </div>
        </Field>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-6"
        disabled={deploying}
        onClick={handleDeploy}
      >
        {deploying ? 'Deploying…' : 'Deploy Agent'}
      </Button>
    </StepWrap>
  )
}

// ─── Step 3: Connect WhatsApp ─────────────────────────────────────────────────

function ConnectWhatsAppStep({
  onNext,
  onSkip,
}: {
  onNext: () => Promise<void>
  onSkip: () => Promise<void>
}) {
  const { toast } = useToast()
  const [phone, setPhone]         = useState('+92 ')
  const [connecting, setConnecting] = useState(false)

  async function handleConnect() {
    setConnecting(true)
    toast("WhatsApp integration coming soon — we'll notify you when ready", 'info')
    await new Promise(resolve => setTimeout(resolve, 1200))
    await onNext()
  }

  return (
    <StepWrap step={3} total={4}>
      <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>
        WhatsApp
      </p>
      <h1 className="font-bebas text-4xl tracking-[0.1em] mb-1" style={{ color: '#C9A84C' }}>
        Connect your WhatsApp
      </h1>
      <p className="text-sm font-sans mb-7" style={{ color: '#6b6b6b' }}>
        Your agent will respond to every WhatsApp message automatically.
      </p>

      {/* Steps */}
      <div
        className="rounded-xl p-5 space-y-5 mb-5"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}
      >
        {[
          {
            n: '01',
            title: 'Download WhatsApp Business',
            sub: 'Free download on iOS and Android',
            extra: (
              <div className="flex gap-2 mt-2">
                {[
                  { label: 'App Store', href: 'https://apps.apple.com/app/whatsapp-business/id1386412985' },
                  { label: 'Play Store', href: 'https://play.google.com/store/apps/details?id=com.whatsapp.w4b' },
                ].map(btn => (
                  <a
                    key={btn.label}
                    href={btn.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-sans px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
                  >
                    {btn.label}
                  </a>
                ))}
              </div>
            ),
          },
          {
            n: '02',
            title: 'Register your business number',
            sub: 'Use a dedicated number for your business',
          },
          {
            n: '03',
            title: 'Enter your number below',
            sub: "We'll connect your agent to this number",
          },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-4">
            <span
              className="font-bebas text-2xl shrink-0"
              style={{ color: '#C9A84C', letterSpacing: '0.05em', lineHeight: 1 }}
            >
              {step.n}
            </span>
            <div>
              <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{step.title}</p>
              <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>{step.sub}</p>
              {step.extra}
            </div>
          </div>
        ))}
      </div>

      <Field label="WhatsApp Business Number">
        <input
          style={BASE_INPUT}
          placeholder="+92 300 0000000"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        />
      </Field>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-4"
        disabled={connecting}
        onClick={handleConnect}
      >
        {connecting ? 'Connecting…' : 'Connect WhatsApp'}
      </Button>

      <button
        className="w-full mt-3 text-sm font-sans transition-colors py-2"
        style={{ color: '#6b6b6b', background: 'none', border: 'none' }}
        onClick={() => onSkip()}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
      >
        Skip for now
      </button>
    </StepWrap>
  )
}

// ─── Step 4: Invite Team ──────────────────────────────────────────────────────

interface InviteRow {
  email: string
  role: string
}

function InviteTeamStep({
  onNext,
  onSkip,
}: {
  onNext: (count: number) => Promise<void>
  onSkip: () => Promise<void>
}) {
  const { toast } = useToast()
  const [invites, setInvites] = useState<InviteRow[]>([
    { email: '', role: 'member' },
    { email: '', role: 'member' },
    { email: '', role: 'member' },
  ])
  const [sending, setSending] = useState(false)

  function updateInvite(i: number, field: keyof InviteRow, value: string) {
    setInvites(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  async function handleSend() {
    const valid = invites.filter(i => i.email.trim())
    if (valid.length === 0) { await onSkip(); return }
    setSending(true)
    let count = 0
    for (const inv of valid) {
      try {
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inv.email.trim(), role: inv.role }),
        })
        if (res.ok) count++
      } catch {}
    }
    if (count > 0) toast(`${count} invitation${count > 1 ? 's' : ''} sent`, 'success')
    setSending(false)
    await onNext(count)
  }

  return (
    <StepWrap step={4} total={4}>
      <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>
        Team
      </p>
      <h1 className="font-bebas text-4xl tracking-[0.1em] mb-1" style={{ color: '#C9A84C' }}>
        Invite your team
      </h1>
      <p className="text-sm font-sans mb-7" style={{ color: '#6b6b6b' }}>
        Add team members so they can monitor and manage your agents.
      </p>

      <div className="space-y-3">
        {invites.map((inv, i) => (
          <div key={i} className="flex gap-2">
            <input
              style={{ ...BASE_INPUT, flex: 1 }}
              placeholder="colleague@yourbusiness.com"
              value={inv.email}
              onChange={e => updateInvite(i, 'email', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
            <select
              style={{ ...BASE_INPUT, width: '110px', cursor: 'pointer' }}
              value={inv.role}
              onChange={e => updateInvite(i, 'role', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-6"
        disabled={sending}
        onClick={handleSend}
      >
        {sending ? 'Sending…' : 'Send Invites'}
      </Button>

      <button
        className="w-full mt-3 text-sm font-sans transition-colors py-2"
        style={{ color: '#6b6b6b', background: 'none', border: 'none' }}
        onClick={() => onSkip()}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
      >
        Skip for now
      </button>
    </StepWrap>
  )
}

// ─── Step 5: Ready ────────────────────────────────────────────────────────────

function ReadyStep({
  businessName,
  summary,
  onFinish,
}: {
  businessName: string
  summary: Summary
  onFinish: () => void
}) {
  const items = [
    { label: 'Business profile complete', done: true },
    { label: summary.agentDeployed ? 'Intake Agent deployed' : 'Intake Agent (configure in Agents)', done: summary.agentDeployed },
    { label: summary.whatsappConnected ? 'WhatsApp connected' : 'WhatsApp pending connection', done: summary.whatsappConnected },
    {
      label: summary.teamCount > 0
        ? `${summary.teamCount} team member${summary.teamCount > 1 ? 's' : ''} invited`
        : 'Solo — just you for now',
      done: true,
    },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#070707' }}
    >
      <div className="w-full max-w-md">
        {/* Gold check ring */}
        <div className="flex items-center justify-center mb-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.3)',
              boxShadow: '0 0 60px rgba(201,168,76,0.12)',
            }}
          >
            <Check size={32} style={{ color: '#C9A84C' }} />
          </div>
        </div>

        <h1
          className="font-bebas text-5xl lg:text-6xl tracking-[0.1em] mb-3"
          style={{ color: '#C9A84C' }}
        >
          You&apos;re ready.
        </h1>
        <p className="font-sans text-sm mb-8" style={{ color: '#6b6b6b' }}>
          Here&apos;s what was set up for {businessName || 'your business'}.
        </p>

        {/* Summary list */}
        <div
          className="rounded-xl p-5 text-left space-y-3 mb-8"
          style={{ background: '#141414', border: '1px solid #2a2a2a' }}
        >
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: item.done ? 'rgba(74,222,128,0.1)' : 'rgba(107,107,107,0.08)',
                  border: `1px solid ${item.done ? 'rgba(74,222,128,0.3)' : '#2a2a2a'}`,
                }}
              >
                <Check size={10} style={{ color: item.done ? '#4ade80' : '#6b6b6b' }} />
              </div>
              <span
                className="text-sm font-sans"
                style={{ color: item.done ? '#F0EBE1' : '#6b6b6b' }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm font-sans mb-8" style={{ color: '#6b6b6b' }}>
          LYCHO has delivered{' '}
          <span style={{ color: '#C9A84C' }}>PKR 0</span> in value so far.{' '}
          Let&apos;s change that.
        </p>

        <Button variant="primary" size="lg" className="w-full" onClick={onFinish}>
          Go to Command Center
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [tenant, setTenant]               = useState<TenantData | null>(null)
  const [step, setStep]                   = useState(0)
  const [loading, setLoading]             = useState(true)
  const [agentDeployed, setAgentDeployed] = useState(false)
  const [whatsappConnected, setWhatsappConnected] = useState(false)
  const [teamCount, setTeamCount]         = useState(0)

  useEffect(() => {
    document.title = 'Getting Started — LYCHO'
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          if (j.data.onboarding_completed) {
            router.push('/dashboard')
            return
          }
          setTenant(j.data)
          setStep(j.data.onboarding_step ?? 0)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function saveAndAdvance(data?: Partial<TenantData>) {
    const newStep = step + 1
    try {
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_step: newStep, ...data }),
      })
      if (data && tenant) setTenant({ ...tenant, ...data } as TenantData)
    } catch {}
    setStep(newStep)
  }

  async function finish() {
    try {
      await Promise.all([
        fetch('/api/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboarding_completed: true }),
        }),
        fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ has_completed_onboarding: true }),
        }),
      ])
    } catch {}
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070707' }}
      >
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <span
              key={d}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#C9A84C',
                display: 'inline-block',
                animation: `ob-pulse 1.2s ease-in-out ${d}ms infinite`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes ob-pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070707' }}
      >
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
          Unable to load onboarding.{' '}
          <a href="/dashboard" style={{ color: '#C9A84C' }}>Go to dashboard →</a>
        </p>
      </div>
    )
  }

  const summary: Summary = { agentDeployed, whatsappConnected, teamCount }

  return (
    <>
      <style>{CURSOR_STYLE}</style>

      {step === 0 && (
        <WelcomeStep
          businessName={tenant.business_name}
          onNext={() => saveAndAdvance()}
        />
      )}

      {step === 1 && (
        <BusinessProfileStep
          tenant={tenant}
          onNext={(data) => saveAndAdvance(data)}
        />
      )}

      {step === 2 && (
        <DeployAgentStep
          tenant={tenant}
          onNext={() => saveAndAdvance()}
          onAgentDeployed={() => setAgentDeployed(true)}
        />
      )}

      {step === 3 && (
        <ConnectWhatsAppStep
          onNext={async () => { setWhatsappConnected(true); await saveAndAdvance() }}
          onSkip={() => saveAndAdvance()}
        />
      )}

      {step === 4 && (
        <InviteTeamStep
          onNext={async (count) => { setTeamCount(count); await saveAndAdvance() }}
          onSkip={() => saveAndAdvance()}
        />
      )}

      {step === 5 && (
        <ReadyStep
          businessName={tenant.business_name}
          summary={summary}
          onFinish={finish}
        />
      )}
    </>
  )
}
