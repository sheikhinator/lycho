'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Users, Puzzle, Bell, Code2,
  UserPlus, Trash2, ChevronDown, Search,
  Send, MessageCircle, CheckCircle2, Copy,
} from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'
import { createClientSupabase } from '@/lib/supabase'
import {
  INTEGRATIONS_CATALOGUE, INTEGRATION_CATEGORIES,
  type IntegrationCategory,
} from '@/lib/integrations/integrations-catalogue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantProfile {
  id: string
  business_name: string
  business_email: string
  business_phone: string | null
  sector: string | null
  country: string
  currency: string
  plan_status: string | null
}

interface TeamMember {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
}

type Tab = 'profile' | 'team' | 'integrations' | 'notifications' | 'developer'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTORS = [
  'E-commerce', 'Healthcare', 'Education', 'Finance & Banking',
  'Real Estate', 'Food & Beverage', 'Logistics', 'IT Services',
  'Retail', 'Travel & Hospitality', 'Manufacturing', 'Other',
  'Legal', 'Construction', 'Insurance', 'Automotive',
  'Beauty & Wellness', 'Agriculture', 'Non-profit', 'Telecommunications',
]

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan' }, { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
]

const CURRENCIES = ['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR', 'INR', 'CAD', 'AUD']

const ROLES = ['admin', 'member', 'viewer']


const DEFAULT_NOTIF = {
  new_conversations: true,
  whatsapp_escalations: true,
  weekly_digest: false,
  monthly_roi: false,
  trial_expiry: true,
  agent_errors: true,
}

// ─── Small shared components ──────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-sans uppercase tracking-widest mb-1.5" style={{ color: '#6b6b6b' }}>
      {children}
    </label>
  )
}

function FieldInput({ value, onChange, type = 'text', placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded text-sm font-sans outline-none transition-all"
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
      onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
      onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
    />
  )
}

function FieldSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded text-sm font-sans outline-none transition-all appearance-none pr-8"
        style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
        onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6b6b6b' }} />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200"
      style={{ background: checked ? '#C9A84C' : '#2a2a2a' }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ left: checked ? '22px' : '4px' }}
      />
    </button>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    owner:  { bg: 'rgba(201,168,76,0.1)',  color: '#C9A84C', border: 'rgba(201,168,76,0.3)'  },
    admin:  { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
    member: { bg: 'rgba(107,107,107,0.1)', color: '#F0EBE1', border: 'rgba(107,107,107,0.3)' },
    viewer: { bg: 'rgba(107,107,107,0.1)', color: '#6b6b6b', border: 'rgba(107,107,107,0.2)' },
  }
  const s = colors[role] ?? colors.member
  return (
    <span className="px-2 py-0.5 rounded text-xs font-sans" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {role}
    </span>
  )
}

// ─── Tab: Business Profile ────────────────────────────────────────────────────

function ProfileTab({ tenantId }: { tenantId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    business_name: '', business_email: '', business_phone: '',
    sector: '', country: 'PK', currency: 'PKR',
  })

  useEffect(() => {
    const sb = createClientSupabase()
    sb.from('tenants').select('business_name,business_email,business_phone,sector,country,currency').eq('id', tenantId).single()
      .then(({ data }) => {
        if (data) setForm({
          business_name:  data.business_name  ?? '',
          business_email: data.business_email ?? '',
          business_phone: data.business_phone ?? '',
          sector:         data.sector         ?? '',
          country:        data.country        ?? 'PK',
          currency:       data.currency       ?? 'PKR',
        })
        setLoading(false)
      })
  }, [tenantId])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2MB', 'error'); return }
    setUploading(true)
    try {
      const sb = createClientSupabase()
      const ext = file.name.split('.').pop()
      const path = `logos/${tenantId}.${ext}`
      const { error: uploadError } = await sb.storage.from('tenant-assets').upload(path, file, { upsert: true })
      if (uploadError) { toast(uploadError.message, 'error'); return }
      const { data: { publicUrl } } = sb.storage.from('tenant-assets').getPublicUrl(path)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from('tenants') as any).update({ logo_url: publicUrl }).eq('id', tenantId)
      setLogoUrl(publicUrl)
      toast('Logo updated', 'success')
    } catch { toast('Upload failed', 'error') }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const sb = createClientSupabase()
      const { error } = await sb.from('tenants').update({
        business_name:  form.business_name,
        business_email: form.business_email,
        business_phone: form.business_phone || null,
        sector:         form.sector || null,
        country:        form.country,
        currency:       form.currency,
      }).eq('id', tenantId)

      if (error) { toast(error.message, 'error'); return }
      toast('Profile saved successfully', 'success')
    } finally {
      setSaving(false)
    }
  }

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }))
  const initials = form.business_name.charAt(0).toUpperCase() || '?'

  if (loading) return <div className="space-y-4"><Skeleton width="100%" height="48px" /><Skeleton width="100%" height="48px" /><Skeleton width="60%" height="48px" /></div>

  return (
    <div className="space-y-6 max-w-lg">
      {/* Logo upload */}
      <div className="flex items-center gap-4">
        <label className="cursor-pointer relative group">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bebas text-2xl tracking-wider flex-shrink-0 overflow-hidden"
            style={{ background: 'rgba(201,168,76,0.1)', border: '2px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
            {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : initials}
          </div>
          <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.6)', fontSize: 10, color: '#C9A84C' }}>
            {uploading ? '…' : 'Upload'}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
        </label>
        <div>
          <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{form.business_name || 'Your Business'}</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>Click logo to upload · Max 2MB</p>
        </div>
      </div>

      <div>
        <FieldLabel>Business Name</FieldLabel>
        <FieldInput value={form.business_name} onChange={f('business_name')} placeholder="Acme Corp" />
      </div>
      <div>
        <FieldLabel>Business Email</FieldLabel>
        <FieldInput value={form.business_email} onChange={f('business_email')} type="email" placeholder="hello@company.com" />
      </div>
      <div>
        <FieldLabel>Phone</FieldLabel>
        <FieldInput value={form.business_phone} onChange={f('business_phone')} type="tel" placeholder="+92 300 0000000" />
      </div>
      <div>
        <FieldLabel>Sector</FieldLabel>
        <FieldSelect value={form.sector} onChange={f('sector')} options={SECTORS.map(s => ({ value: s, label: s }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Country</FieldLabel>
          <FieldSelect value={form.country} onChange={f('country')} options={COUNTRIES.map(c => ({ value: c.code, label: c.name }))} />
        </div>
        <div>
          <FieldLabel>Currency</FieldLabel>
          <FieldSelect value={form.currency} onChange={f('currency')} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
        </div>
      </div>

      <Button variant="primary" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save Profile'}
      </Button>
    </div>
  )
}

// ─── Tab: Team ────────────────────────────────────────────────────────────────

function TeamTab() {
  const { toast } = useToast()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchTeam = useCallback(async () => {
    const res = await fetch('/api/team')
    const j = await res.json()
    if (res.ok) setMembers(j.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTeam()
    createClientSupabase().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [fetchTeam])

  async function handleInvite() {
    if (!inviteEmail) return
    setInviting(true)
    const res = await fetch('/api/team', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const j = await res.json()
    if (!res.ok) { toast(j.error ?? 'Failed to invite', 'error'); setInviting(false); return }
    toast('Invitation sent', 'success')
    setInviteOpen(false); setInviteEmail(''); setInviteRole('member')
    fetchTeam()
    setInviting(false)
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch(`/api/team/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const j = await res.json()
    if (!res.ok) { toast(j.error ?? 'Failed to update role', 'error'); return }
    toast('Role updated', 'success')
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m))
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
    const j = await res.json()
    if (!res.ok) { toast(j.error ?? 'Failed to remove member', 'error'); return }
    toast('Member removed', 'success')
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  if (loading) return <Skeleton width="100%" height="200px" />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus size={14} /> Invite Member
        </Button>
      </div>

      {/* Invite form */}
      {inviteOpen && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
          <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Invite Team Member</p>
          <FieldInput value={inviteEmail} onChange={setInviteEmail} type="email" placeholder="colleague@company.com" />
          <FieldSelect value={inviteRole} onChange={setInviteRole} options={ROLES.map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))} />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={inviting} onClick={handleInvite}>{inviting ? 'Sending…' : 'Send Invite'}</Button>
            <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {members.length <= 1 && !inviteOpen && (
        <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
          <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: '#6b6b6b' }} />
          <p className="text-sm font-sans mb-1" style={{ color: 'rgba(240,235,225,0.6)' }}>Just you for now</p>
          <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Invite team members to collaborate on LYCHO</p>
        </div>
      )}

      {members.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
          {members.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-4 py-3 gap-3"
              style={{
                background: i % 2 === 0 ? '#1c1c1c' : 'rgba(28,28,28,0.5)',
                borderBottom: i < members.length - 1 ? '1px solid #2a2a2a' : undefined,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
                >
                  {(m.full_name ?? m.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>
                    {m.full_name ?? m.email ?? 'Unknown'}
                  </p>
                  {m.email && m.full_name && (
                    <p className="text-xs font-sans truncate" style={{ color: '#6b6b6b' }}>{m.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <RoleBadge role={m.role} />
                {m.role !== 'owner' && m.id !== currentUserId && (
                  <>
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                      className="text-xs font-sans px-2 py-1 rounded outline-none"
                      style={{ background: '#2a2a2a', color: '#6b6b6b', border: '1px solid #3a3a3a' }}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: '#6b6b6b' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
                      title="Remove member"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Telegram Connect Card ────────────────────────────────────────────────────

function TelegramConnectCard({ tenantId }: { tenantId: string }) {
  const { toast } = useToast()
  const [open, setOpen]           = useState(false)
  const [botToken, setBotToken]   = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [botUsername, setBotUsername] = useState('')
  const sb = createClientSupabase()

  async function handleConnect() {
    if (!botToken.trim()) return
    setConnecting(true)
    try {
      // Get bot info from Telegram
      const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
      const me = await meRes.json()
      if (!me.ok) { toast('Invalid bot token — check and try again', 'error'); return }

      const username = me.result.username as string
      const botId    = me.result.id as number
      const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const webhookUrl = `${appUrl}/api/webhooks/telegram`

      // Register webhook with Telegram
      await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      })

      // Get or create default agent for this tenant
      const { data: agents } = await sb.from('agents').select('id').eq('tenant_id', tenantId).limit(1)
      const agentId = agents?.[0]?.id ?? null

      // Upsert channel_connections
      await sb.from('channel_connections').upsert({
        tenant_id:          tenantId,
        agent_id:           agentId,
        channel_type:       'telegram',
        channel_identifier: String(botId),
        status:             'active',
        credentials:        { bot_token: botToken, bot_username: username },
      }, { onConflict: 'tenant_id,channel_type' })

      setBotUsername(username)
      setConnected(true)
      toast(`Telegram bot @${username} connected!`, 'success')
    } catch {
      toast('Failed to connect bot — please try again', 'error')
    } finally {
      setConnecting(false)
    }
  }

  if (connected) {
    return (
      <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid rgba(0,136,204,0.3)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: 'rgba(0,136,204,0.1)', border: '1px solid rgba(0,136,204,0.2)' }}>
            ✈️
          </div>
          <div>
            <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Telegram</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} style={{ color: '#4ade80' }} />
              <span className="text-xs font-sans" style={{ color: '#4ade80' }}>Connected</span>
            </div>
          </div>
        </div>
        <p className="text-xs font-sans mb-3" style={{ color: '#6b6b6b' }}>
          Your bot is live. Share this link with customers:
        </p>
        <div
          className="flex items-center justify-between px-3 py-2 rounded"
          style={{ background: '#141414', border: '1px solid #2a2a2a' }}
        >
          <code className="text-sm font-mono" style={{ color: '#0088cc' }}>t.me/{botUsername}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(`https://t.me/${botUsername}`); toast('Link copied!', 'success') }}
            className="p-1 rounded transition-colors"
            style={{ color: '#6b6b6b' }}
            title="Copy link"
          >
            <Copy size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: 'rgba(0,136,204,0.1)', border: '1px solid rgba(0,136,204,0.2)' }}>
            ✈️
          </div>
          <div>
            <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Telegram</p>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Connect a Telegram bot</p>
          </div>
        </div>
        <span className="text-xs font-sans px-2 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>Live</span>
      </div>

      {!open ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="gap-2 w-full">
          <Send size={13} /> Connect Telegram Bot
        </Button>
      ) : (
        <div className="space-y-4">
          <div
            className="rounded-lg p-4 text-xs font-sans space-y-1.5"
            style={{ background: 'rgba(0,136,204,0.05)', border: '1px solid rgba(0,136,204,0.15)' }}
          >
            <p style={{ color: '#F0EBE1', fontWeight: 600, marginBottom: '8px' }}>How to get your bot token:</p>
            {[
              'Open Telegram and search for @BotFather',
              'Send /newbot and follow the instructions',
              'Copy the bot token provided',
              'Paste it below and click Connect Bot',
            ].map((step, i) => (
              <p key={i} style={{ color: '#6b6b6b' }}>
                <span style={{ color: '#0088cc' }}>{i + 1}.</span> {step}
              </p>
            ))}
          </div>

          <div>
            <FieldLabel>Bot Token</FieldLabel>
            <FieldInput
              value={botToken}
              onChange={setBotToken}
              placeholder="1234567890:ABCDefghIJKLmnopQRSTUVwxyz"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={connecting || !botToken} onClick={handleConnect}>
              {connecting ? 'Connecting…' : 'Connect Bot'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WhatsApp Connect Card ────────────────────────────────────────────────────

function WhatsAppConnectCard({ tenantId }: { tenantId: string }) {
  const { toast } = useToast()
  const [step, setStep]         = useState<0 | 1 | 2 | 3>(0)
  const [phone, setPhone]       = useState('')
  const [saving, setSaving]     = useState(false)
  const sb = createClientSupabase()

  async function handleSave() {
    if (!phone.trim()) return
    setSaving(true)
    try {
      await sb.from('channel_connections').upsert({
        tenant_id:          tenantId,
        channel_type:       'whatsapp',
        channel_identifier: phone,
        status:             'pending',
        credentials:        { phone_number: phone, access_token: 'pending', phone_number_id: 'pending' },
      }, { onConflict: 'tenant_id,channel_type' })

      setStep(3)
      toast('WhatsApp connection request saved. We\'ll be in touch.', 'success')
    } catch {
      toast('Failed to save — please try again', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (step === 3) {
    return (
      <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid rgba(37,211,102,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
            💬
          </div>
          <div>
            <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>WhatsApp</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#fbbf24' }} />
              <span className="text-xs font-sans" style={{ color: '#fbbf24' }}>Pending Meta approval</span>
            </div>
          </div>
        </div>
        <p className="text-xs font-sans mt-3" style={{ color: '#6b6b6b' }}>
          We&apos;ll notify you at {phone} when your WhatsApp Business connection is approved and live.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
            💬
          </div>
          <div>
            <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>WhatsApp Business</p>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>via Meta Business API</p>
          </div>
        </div>
        <span className="text-xs font-sans px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
          Requires Approval
        </span>
      </div>

      {step === 0 && (
        <Button variant="secondary" size="sm" onClick={() => setStep(1)} className="gap-2 w-full">
          <MessageCircle size={13} /> Connect WhatsApp Business
        </Button>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.12)' }}
          >
            <p className="text-xs font-sans font-medium mb-3" style={{ color: '#F0EBE1' }}>Step 1 of 3 — Install WhatsApp Business</p>
            <p className="text-xs font-sans mb-3" style={{ color: '#6b6b6b' }}>
              Download the free WhatsApp Business app on your phone to manage your business profile.
            </p>
            <div className="flex gap-2">
              <a
                href="https://apps.apple.com/app/whatsapp-business/id1386412985"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans"
                style={{ background: '#141414', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
              >
                🍎 App Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.whatsapp.w4b"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans"
                style={{ background: '#141414', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
              >
                🤖 Play Store
              </a>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setStep(2)}>Done — Next Step →</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div
            className="rounded-lg p-4"
            style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.12)' }}
          >
            <p className="text-xs font-sans font-medium mb-1" style={{ color: '#F0EBE1' }}>Step 2 of 3 — Enter Your Phone Number</p>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>The number you use for WhatsApp Business.</p>
          </div>
          <div>
            <FieldLabel>WhatsApp Business Phone Number</FieldLabel>
            <FieldInput
              value={phone}
              onChange={setPhone}
              placeholder="+92 300 0000000"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" disabled={saving || !phone} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save — Notify Me When Ready'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Integrations ────────────────────────────────────────────────────────

function IntegrationsTab({ tenantId }: { tenantId: string | null }) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'all'>('all')

  const filtered = INTEGRATIONS_CATALOGUE.filter(intg => {
    const matchesCategory = activeCategory === 'all' || intg.category === activeCategory
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      intg.name.toLowerCase().includes(q) ||
      intg.description.toLowerCase().includes(q) ||
      intg.tags.some(t => t.includes(q))
    return matchesCategory && matchesSearch
  })

  const liveCount = INTEGRATIONS_CATALOGUE.filter(i => i.status === 'live').length

  return (
    <div className="space-y-6">
      {/* Messaging Channels */}
      <div>
        <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>Messaging Channels</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tenantId && <TelegramConnectCard tenantId={tenantId} />}
          {tenantId && <WhatsAppConnectCard tenantId={tenantId} />}
        </div>
      </div>

      {/* Header stats */}
      <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '24px' }}>
        <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>All Integrations</p>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 text-xs font-sans" style={{ color: '#6b6b6b' }}>
            <span><span style={{ color: '#C9A84C' }}>{liveCount}</span> live</span>
            <span><span style={{ color: '#F0EBE1' }}>{INTEGRATIONS_CATALOGUE.length - liveCount}</span> coming soon</span>
            <span><span style={{ color: '#F0EBE1' }}>{INTEGRATIONS_CATALOGUE.length}</span> total</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6b6b6b' }} />
        <input
          type="text"
          placeholder="Search integrations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded text-sm font-sans outline-none transition-all"
          style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className="px-3 py-1.5 rounded text-xs font-sans transition-colors"
          style={{
            background: activeCategory === 'all' ? 'rgba(201,168,76,0.1)' : '#1c1c1c',
            color: activeCategory === 'all' ? '#C9A84C' : '#6b6b6b',
            border: activeCategory === 'all' ? '1px solid rgba(201,168,76,0.25)' : '1px solid #2a2a2a',
          }}
        >
          All
        </button>
        {INTEGRATION_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="px-3 py-1.5 rounded text-xs font-sans transition-colors"
            style={{
              background: activeCategory === cat.id ? 'rgba(201,168,76,0.1)' : '#1c1c1c',
              color: activeCategory === cat.id ? '#C9A84C' : '#6b6b6b',
              border: activeCategory === cat.id ? '1px solid rgba(201,168,76,0.25)' : '1px solid #2a2a2a',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration cards */}
      {filtered.length === 0 ? (
        <div className="rounded-lg p-12 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
          <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No integrations found for &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(intg => {
            const isLive = intg.status === 'live'
            return (
              <div
                key={intg.id}
                className="rounded-lg p-5 flex flex-col gap-3"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
                  >
                    {intg.logo}
                  </div>
                  <span
                    className="text-xs font-sans px-2 py-0.5 rounded"
                    style={
                      isLive
                        ? { background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                        : { background: 'rgba(107,107,107,0.08)', color: '#6b6b6b', border: '1px solid rgba(107,107,107,0.2)' }
                    }
                  >
                    {isLive ? 'Live' : 'Coming Soon'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{intg.name}</p>
                  <p className="text-xs font-sans mt-1 leading-relaxed" style={{ color: '#6b6b6b' }}>
                    {intg.description}
                  </p>
                </div>

                {/* Action button */}
                {isLive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toast('Navigate to agent settings to connect this channel', 'info')}
                  >
                    Connect
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast(`We'll notify you when ${intg.name} goes live`, 'success')}
                  >
                    Notify Me
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

const NOTIF_LABELS: Record<string, string> = {
  new_conversations:    'Email notifications for new conversations',
  whatsapp_escalations: 'WhatsApp alerts for escalations',
  weekly_digest:        'Weekly performance digest',
  monthly_roi:          'Monthly ROI report',
  trial_expiry:         'Trial expiry reminders',
  agent_errors:         'Agent error alerts',
}

function NotificationsTab() {
  const { toast } = useToast()
  const [prefs, setPrefs] = useState(DEFAULT_NOTIF)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lycho_notif_prefs')
      if (stored) setPrefs(JSON.parse(stored))
    } catch {}
  }, [])

  function handleSave() {
    localStorage.setItem('lycho_notif_prefs', JSON.stringify(prefs))
    toast('Notification preferences saved', 'success')
  }

  return (
    <div className="space-y-5 max-w-md">
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
        {(Object.keys(NOTIF_LABELS) as Array<keyof typeof DEFAULT_NOTIF>).map((key, i, arr) => (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-4 gap-4"
            style={{
              background: '#1c1c1c',
              borderBottom: i < arr.length - 1 ? '1px solid #2a2a2a' : undefined,
            }}
          >
            <p className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{NOTIF_LABELS[key]}</p>
            <Toggle checked={prefs[key]} onChange={v => setPrefs(p => ({ ...p, [key]: v }))} />
          </div>
        ))}
      </div>
      <Button variant="primary" onClick={handleSave}>Save Preferences</Button>
    </div>
  )
}

// ─── Danger Zone ─────────────────────────────────────────────────────────────

function DangerZone() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      if (!res.ok) { const j = await res.json(); toast(j.error ?? 'Delete failed', 'error'); return }
      toast('Account deleted. Goodbye.', 'success')
      setTimeout(() => router.push('/'), 1500)
    } catch {
      toast('Network error', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-16 pt-8" style={{ borderTop: '1px solid rgba(248,113,113,0.15)' }}>
      <p className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#7f1d1d' }}>Danger Zone</p>
      <div className="rounded-lg p-5 max-w-lg" style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }}>
        <h3 className="text-sm font-sans font-semibold mb-1" style={{ color: '#f87171' }}>Delete Account</h3>
        <p className="text-xs font-sans mb-4" style={{ color: '#6b6b6b' }}>
          Permanently delete your account, all agents, and all data. This cannot be undone.
        </p>
        {!confirming ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
            <Trash2 size={13} className="mr-1.5" /> Delete Account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-sans" style={{ color: '#f87171' }}>Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded text-sm font-sans outline-none"
              style={{ background: '#1c1c1c', border: '1px solid rgba(248,113,113,0.3)', color: '#F0EBE1' }}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={handleDelete}
                style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', opacity: confirmText !== 'DELETE' ? 0.4 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setConfirming(false); setConfirmText('') }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Developer ──────────────────────────────────────────────────────────

function DeveloperTab() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tenants/api-key')
      .then(r => r.json())
      .then(j => { setApiKey(j.data?.api_key ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function copy() {
    if (!apiKey) return
    navigator.clipboard.writeText(apiKey)
    toast('API key copied', 'success')
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="font-bebas text-2xl tracking-wider mb-1" style={{ color: '#F0EBE1' }}>Developer API Key</h2>
        <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Use this key to connect LYCHO agents to Claude Code via MCP or call the API directly.</p>
      </div>

      <div className="rounded-xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>API Key</p>
        {loading ? (
          <div className="h-10 rounded" style={{ background: '#1c1c1c' }} />
        ) : apiKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 rounded text-xs font-mono truncate" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#C9A84C' }}>
              {apiKey}
            </code>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded text-xs font-sans transition-opacity hover:opacity-80"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#C9A84C' }}
            >
              <Copy size={12} /> Copy
            </button>
          </div>
        ) : (
          <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>API key not found — run the Supabase migration to generate one.</p>
        )}
      </div>

      <div className="rounded-xl p-5 space-y-3" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>Connect to Claude Code (MCP)</p>
        <pre className="text-xs font-mono p-4 rounded overflow-x-auto" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}>{`{
  "mcpServers": {
    "lycho": {
      "url": "https://lycho.vercel.app/api/mcp",
      "apiKey": "${apiKey ?? 'YOUR_LYCHO_API_KEY'}"
    }
  }
}`}</pre>
        <a href="/developers" className="inline-block text-xs font-sans mt-2" style={{ color: '#C9A84C' }}>
          Full MCP documentation →
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile',       label: 'Business Profile', icon: <User size={15} /> },
  { key: 'team',          label: 'Team',              icon: <Users size={15} /> },
  { key: 'integrations',  label: 'Integrations',      icon: <Puzzle size={15} /> },
  { key: 'notifications', label: 'Notifications',     icon: <Bell size={15} /> },
  { key: 'developer',     label: 'Developer',         icon: <Code2 size={15} /> },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => { document.title = 'Settings — LYCHO' }, [])

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(j => {
      if (j.error === 'Unauthorized') { router.push('/login'); return }
    })
    // Get tenantId via Supabase client
    const sb = createClientSupabase()
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: u } = await sb.from('users').select('tenant_id').eq('id', data.user.id).single()
      if (u?.tenant_id) setTenantId(u.tenant_id)
    })
  }, [router])

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10">
          {/* Heading */}
          <div className="mb-8">
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>Account</p>
            <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>Settings</h1>
          </div>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 mb-8 p-1 rounded-lg w-fit" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-sans transition-colors"
                style={{
                  background: activeTab === t.key ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: activeTab === t.key ? '#C9A84C' : '#6b6b6b',
                  border: activeTab === t.key ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                }}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'profile'       && (tenantId ? <ProfileTab tenantId={tenantId} /> : <Skeleton width="100%" height="300px" />)}
          {activeTab === 'team'          && <TeamTab />}
          {activeTab === 'integrations'  && <IntegrationsTab tenantId={tenantId} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'developer'     && <DeveloperTab />}

          {/* Danger Zone — always visible */}
          <DangerZone />
        </main>
      </div>
    </div>
  )
}
