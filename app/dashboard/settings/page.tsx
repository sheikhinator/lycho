'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Users, Puzzle, Bell,
  UserPlus, Trash2, ChevronDown,
} from 'lucide-react'
import { FaWhatsapp, FaSlack } from 'react-icons/fa'
import { MdEmail, MdCalendarToday } from 'react-icons/md'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'
import { createClientSupabase } from '@/lib/supabase'

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

type Tab = 'profile' | 'team' | 'integrations' | 'notifications'

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

const INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Connect your WhatsApp number', icon: <FaWhatsapp size={22} style={{ color: '#25D366' }} />, color: '#25D366' },
  { id: 'gmail',    name: 'Gmail',              desc: 'Connect your Gmail account',   icon: <MdEmail    size={22} style={{ color: '#C9A84C' }} />, color: '#C9A84C' },
  { id: 'gcal',     name: 'Google Calendar',    desc: 'Sync your calendar',           icon: <MdCalendarToday size={22} style={{ color: '#3498db' }} />, color: '#3498db' },
  { id: 'slack',    name: 'Slack',              desc: 'Get notifications in Slack',   icon: <FaSlack    size={22} style={{ color: '#9b59b6' }} />, color: '#9b59b6' },
  { id: 'hubspot',  name: 'HubSpot',            desc: 'Sync your CRM',               icon: <span style={{ color: '#FF7A59', fontWeight: 700, fontSize: '18px' }}>HS</span>, color: '#FF7A59' },
  { id: 'shopify',  name: 'Shopify',            desc: 'Connect your store',           icon: <span style={{ color: '#96BF48', fontWeight: 700, fontSize: '18px' }}>S</span>, color: '#96BF48' },
]

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
      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center font-bebas text-2xl tracking-wider flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.1)', border: '2px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{form.business_name || 'Your Business'}</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>Logo upload available in a future update</p>
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

// ─── Tab: Integrations ────────────────────────────────────────────────────────

function IntegrationsTab() {
  const { toast } = useToast()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {INTEGRATIONS.map(intg => (
        <div key={intg.id} className="rounded-lg p-5 flex flex-col gap-3" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: `${intg.color}14`, border: `1px solid ${intg.color}30` }}
            >
              {intg.icon}
            </div>
            <span
              className="text-xs font-sans px-2 py-0.5 rounded"
              style={{ background: 'rgba(107,107,107,0.1)', color: '#6b6b6b', border: '1px solid rgba(107,107,107,0.2)' }}
            >
              Not Connected
            </span>
          </div>
          <div>
            <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{intg.name}</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>{intg.desc}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast('Integration coming in the next update', 'info')}
          >
            Connect
          </Button>
        </div>
      ))}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile',       label: 'Business Profile', icon: <User size={15} /> },
  { key: 'team',          label: 'Team',              icon: <Users size={15} /> },
  { key: 'integrations',  label: 'Integrations',      icon: <Puzzle size={15} /> },
  { key: 'notifications', label: 'Notifications',     icon: <Bell size={15} /> },
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
          {activeTab === 'integrations'  && <IntegrationsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
        </main>
      </div>
    </div>
  )
}
