'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, RotateCcw, Copy, Check, Code2, ExternalLink } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { ChannelIcon } from '@/components/ui/ChannelIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  agent_type: string
  display_name: string | null
  status: string
  version: number
  channels: string[]
  confidence_threshold: number
  interactions_count: number
  monthly_cost_pkr: number
  monthly_value_pkr: number
  widget_token: string | null
  created_at: string
}

interface AgentVersion {
  id: string
  version: number
  changed_by: string | null
  change_reason: string | null
  created_at: string
}

const ALL_CHANNELS = ['whatsapp', 'email', 'web', 'sms', 'voice', 'instagram', 'facebook']

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonDetail() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton width="200px" height="28px" />
      <Skeleton width="100%" height="120px" />
      <Skeleton width="100%" height="80px" />
    </div>
  )
}

function OverviewTab({ agent }: { agent: Agent }) {
  const roi = agent.monthly_cost_pkr > 0
    ? (agent.monthly_value_pkr / agent.monthly_cost_pkr).toFixed(1)
    : '∞'

  const valueWidth =
    agent.monthly_cost_pkr + agent.monthly_value_pkr > 0
      ? Math.min(100, Math.round((agent.monthly_value_pkr / (agent.monthly_cost_pkr + agent.monthly_value_pkr)) * 100))
      : 0

  return (
    <div className="space-y-6">
      {/* Agent info */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1 font-sans" style={{ color: '#6b6b6b' }}>
              {agent.agent_type.replace(/_/g, ' ')}
            </p>
            <h2 className="font-sans font-semibold text-xl" style={{ color: '#F0EBE1' }}>
              {agent.display_name ?? agent.agent_type}
            </h2>
            <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>
              Created {new Date(agent.created_at).toLocaleDateString()} · Version {agent.version}
            </p>
          </div>
          <span
            className="px-2 py-1 rounded text-xs font-sans"
            style={{
              background: agent.status === 'active' ? 'rgba(74,222,128,0.08)' : 'rgba(107,107,107,0.08)',
              border: `1px solid ${agent.status === 'active' ? 'rgba(74,222,128,0.25)' : 'rgba(107,107,107,0.25)'}`,
              color: agent.status === 'active' ? '#4ade80' : '#6b6b6b',
            }}
          >
            {agent.status}
          </span>
        </div>

        {/* Channels */}
        {agent.channels.length > 0 && (
          <div className="flex items-center gap-3">
            {agent.channels.map(ch => (
              <ChannelIcon key={ch} channel={ch} size={16} showLabel />
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Interactions', value: agent.interactions_count.toLocaleString(), color: '#F0EBE1' },
          { label: 'Confidence Threshold', value: `${(agent.confidence_threshold * 100).toFixed(0)}%`, color: '#F0EBE1' },
          { label: 'Monthly Cost', value: `PKR ${agent.monthly_cost_pkr.toLocaleString()}`, color: '#f87171' },
          { label: 'Monthly Value', value: `PKR ${agent.monthly_value_pkr.toLocaleString()}`, color: '#4ade80' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-lg p-4"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
          >
            <p className="text-xs font-sans mb-1" style={{ color: '#6b6b6b' }}>{s.label}</p>
            <p className="font-bebas text-2xl tracking-wider" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cost vs value bar */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest font-sans" style={{ color: '#6b6b6b' }}>
            Cost vs Value
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>ROI</span>
            <span className="font-bebas text-3xl tracking-wider" style={{ color: '#C9A84C' }}>{roi}x</span>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(248,113,113,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${valueWidth}%`,
              background: 'linear-gradient(90deg, #C9A84C, #4ade80)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-sans" style={{ color: '#f87171' }}>
            Cost: PKR {agent.monthly_cost_pkr.toLocaleString()}
          </span>
          <span className="text-xs font-sans" style={{ color: '#4ade80' }}>
            Value: PKR {agent.monthly_value_pkr.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

function ConfigTab({ agent, onSaved }: { agent: Agent; onSaved: (updated: Agent) => void }) {
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState(agent.display_name ?? '')
  const [threshold, setThreshold] = useState(agent.confidence_threshold)
  const [channels, setChannels] = useState<string[]>(agent.channels)
  const [saving, setSaving] = useState(false)

  function toggleChannel(ch: string) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName, confidence_threshold: threshold, channels }),
      })
      const json = await res.json()
      if (!res.ok) { toast(json.error ?? 'Save failed', 'error'); return }
      toast('Configuration saved — new version created', 'success')
      onSaved(json.data)
    } catch {
      toast('Network error', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-lg"
        style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
      >
        <span className="text-xs font-sans leading-relaxed" style={{ color: '#fbbf24' }}>
          Saving creates a new version. Previous versions can be restored from the Version History tab.
        </span>
      </div>

      {/* Display name */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-2 font-sans" style={{ color: '#6b6b6b' }}>
          Display Name
        </label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="w-full px-3 py-2.5 rounded text-sm font-sans outline-none transition-all"
          style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
          onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        />
      </div>

      {/* Confidence threshold slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs uppercase tracking-widest font-sans" style={{ color: '#6b6b6b' }}>
            Confidence Threshold
          </label>
          <span className="font-bebas text-xl tracking-wider" style={{ color: '#C9A84C' }}>
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.0}
          step={0.01}
          value={threshold}
          onChange={e => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-gold"
          style={{ accentColor: '#C9A84C' }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>50% (lenient)</span>
          <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>100% (strict)</span>
        </div>
      </div>

      {/* Channel toggles */}
      <div>
        <label className="block text-xs uppercase tracking-widest mb-3 font-sans" style={{ color: '#6b6b6b' }}>
          Channels
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_CHANNELS.map(ch => {
            const active = channels.includes(ch)
            return (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-sans transition-all"
                style={{
                  background: active ? 'rgba(201,168,76,0.08)' : '#1c1c1c',
                  border: `1px solid ${active ? '#C9A84C' : '#2a2a2a'}`,
                  color: active ? '#C9A84C' : '#6b6b6b',
                }}
              >
                <ChannelIcon channel={ch} size={13} />
                <span className="capitalize">{ch}</span>
              </button>
            )
          })}
        </div>
      </div>

      <Button variant="primary" disabled={saving} onClick={handleSave} className="gap-2">
        <Save size={14} />
        {saving ? 'Saving…' : 'Save Configuration'}
      </Button>
    </div>
  )
}

function VersionHistoryTab({ agentId, currentVersion }: { agentId: string; currentVersion: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [versions, setVersions] = useState<AgentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [rolling, setRolling] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/agents/${agentId}/versions`)
      .then(r => r.json())
      .then(j => setVersions(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [agentId])

  async function handleRollback(version: number) {
    setRolling(version)
    try {
      const res = await fetch(`/api/agents/${agentId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      })
      const json = await res.json()
      if (!res.ok) { toast(json.error ?? 'Rollback failed', 'error'); return }
      toast(`Rolled back to version ${version}`, 'success')
      router.push(`/dashboard/agents/${agentId}?tab=overview`)
      router.refresh()
    } catch {
      toast('Network error', 'error')
    } finally {
      setRolling(null)
    }
  }

  if (loading) return <Skeleton width="100%" height="200px" />

  if (versions.length === 0) {
    return (
      <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
        No version history yet.
      </p>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid #2a2a2a' }}
    >
      <table className="w-full text-sm font-sans">
        <thead>
          <tr style={{ background: '#1c1c1c', borderBottom: '1px solid #2a2a2a' }}>
            {['Version', 'Changed By', 'Reason', 'Date', ''].map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium"
                style={{ color: '#6b6b6b' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {versions.map(v => {
            const isCurrent = v.version === currentVersion
            return (
              <tr
                key={v.id}
                style={{
                  background: isCurrent ? 'rgba(201,168,76,0.04)' : 'transparent',
                  borderBottom: '1px solid #2a2a2a',
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bebas text-xl tracking-wider"
                      style={{ color: isCurrent ? '#C9A84C' : '#F0EBE1' }}
                    >
                      v{v.version}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(201,168,76,0.12)',
                          color: '#C9A84C',
                          border: '1px solid rgba(201,168,76,0.25)',
                        }}
                      >
                        current
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>
                  {v.changed_by?.slice(0, 8) ?? '—'}
                </td>
                <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>
                  {v.change_reason?.replace(/_/g, ' ') ?? '—'}
                </td>
                <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>
                  {new Date(v.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={rolling === v.version}
                      onClick={() => handleRollback(v.version)}
                      className="gap-1"
                    >
                      <RotateCcw size={12} />
                      {rolling === v.version ? 'Restoring…' : 'Restore'}
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Widget tab ───────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lycho.vercel.app'

function WidgetTab({ agent }: { agent: Agent }) {
  const [copied, setCopied] = useState(false)

  const embedCode = agent.widget_token
    ? `<script src="${APP_URL}/widget.js" data-token="${agent.widget_token}"></script>`
    : null

  function handleCopy() {
    if (!embedCode) return
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!agent.widget_token) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <p className="text-sm font-sans mb-4" style={{ color: '#6b6b6b' }}>
          This agent doesn&apos;t have a widget token yet. Run the following in your Supabase SQL editor:
        </p>
        <code className="block text-xs font-mono p-4 rounded-lg text-left" style={{ background: '#1c1c1c', color: '#C9A84C', border: '1px solid #2a2a2a' }}>
          {`ALTER TABLE agents ADD COLUMN IF NOT EXISTS widget_token text UNIQUE;\nUPDATE agents SET widget_token = gen_random_uuid()::text WHERE widget_token IS NULL;`}
        </code>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Embed code */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ background: '#141414', borderBottom: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-2">
            <Code2 size={15} style={{ color: '#C9A84C' }} />
            <span className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Embed Code</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg transition-colors"
            style={copied
              ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
              : { background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }
            }
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-5" style={{ background: '#0d0d0d' }}>
          <code className="text-xs font-mono break-all leading-relaxed" style={{ color: '#C9A84C' }}>
            {embedCode}
          </code>
        </div>
      </div>

      {/* Domain note */}
      <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
        When your domain changes to <span style={{ color: '#C9A84C' }}>lycho.ai</span> — update the{' '}
        <code style={{ color: '#F0EBE1' }}>src</code> URL in the script tag.
      </p>

      {/* Steps */}
      <div className="rounded-xl p-6 space-y-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Installation</p>
        {[
          { n: '01', text: 'Copy the code above' },
          { n: '02', text: "Open your website's HTML file" },
          { n: '03', text: 'Paste before the closing </body> tag' },
          { n: '04', text: 'Save and refresh — your LYCHO agent is live' },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-4">
            <span className="font-bebas text-2xl shrink-0" style={{ color: '#C9A84C', letterSpacing: '0.05em', lineHeight: 1 }}>{step.n}</span>
            <p className="text-sm font-sans pt-0.5" style={{ color: '#F0EBE1' }}>{step.text}</p>
          </div>
        ))}
      </div>

      {/* Preview link */}
      <div className="rounded-xl p-5 flex items-center justify-between" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        <div>
          <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Live Preview</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>Open the widget chat in a new tab</p>
        </div>
        <a
          href={`${APP_URL}/widget/${agent.widget_token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: '#C9A84C', color: '#070707' }}
        >
          Preview <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'config' | 'versions' | 'widget'

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const activeTab = (searchParams.get('tab') ?? 'overview') as Tab
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchAgent = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/agents/${params.id}`)
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 404) { router.push('/dashboard/agents'); return }
        setError(true)
        return
      }
      const json = await res.json()
      setAgent(json.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => { fetchAgent() }, [fetchAgent])

  useEffect(() => {
    if (agent) {
      document.title = `${agent.display_name ?? agent.agent_type} — LYCHO`
    }
  }, [agent])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'config',   label: 'Configuration' },
    { key: 'versions', label: 'Version History' },
    { key: 'widget',   label: 'Widget' },
  ]

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10">
          {/* Back link */}
          <Link
            href="/dashboard/agents"
            className="inline-flex items-center gap-2 text-sm font-sans mb-6 transition-colors"
            style={{ color: '#6b6b6b' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#C9A84C')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
          >
            <ArrowLeft size={14} />
            Back to Agents
          </Link>

          {/* Page title */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>
              Agent Detail
            </p>
            <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>
              {loading ? '—' : (agent?.display_name ?? agent?.agent_type ?? '—')}
            </h1>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-0 mb-8 w-fit rounded-lg overflow-hidden"
            style={{ border: '1px solid #2a2a2a' }}
          >
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => router.push(`/dashboard/agents/${params.id}?tab=${t.key}`)}
                className="px-4 py-2 text-sm font-sans transition-colors"
                style={{
                  background: activeTab === t.key ? 'rgba(201,168,76,0.08)' : '#1c1c1c',
                  color: activeTab === t.key ? '#C9A84C' : '#6b6b6b',
                  borderRight: '1px solid #2a2a2a',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading && <SkeletonDetail />}

          {!loading && error && (
            <div className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
              Failed to load agent.{' '}
              <button onClick={fetchAgent} style={{ color: '#C9A84C' }}>Retry</button>
            </div>
          )}

          {!loading && !error && agent && (
            <>
              {activeTab === 'overview' && <OverviewTab agent={agent} />}
              {activeTab === 'config' && (
                <ConfigTab agent={agent} onSaved={updated => { setAgent(updated); toast('Saved', 'success') }} />
              )}
              {activeTab === 'versions' && (
                <VersionHistoryTab agentId={agent.id} currentVersion={agent.version} />
              )}
              {activeTab === 'widget' && <WidgetTab agent={agent} />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
