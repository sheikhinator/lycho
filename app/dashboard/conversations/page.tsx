'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronLeft, ChevronRight, MessageCircle, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { ChannelIcon } from '@/components/ui/ChannelIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConvMetadata {
  lead_score?: number
  lead_label?: 'hot' | 'warm' | 'cold'
  sentiment?: string
  contact_profile?: { name?: string; email?: string }
  suggested_next_action?: string
}

interface Conversation {
  id: string
  agent_id: string
  channel: string | null
  contact_identifier: string | null
  status: string
  messages: Message[]
  confidence_score: number | null
  created_at: string
  resolved_at: string | null
  escalated_to: string | null
  metadata?: ConvMetadata
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface Agent {
  id: string
  display_name: string | null
  agent_type: string
}

const CHANNELS = ['whatsapp', 'email', 'web', 'sms', 'voice', 'instagram', 'facebook']
const STATUSES = ['open', 'resolved', 'escalated', 'abandoned']
const PAGE_SIZE = 20

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    open:      { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)'  },
    resolved:  { color: '#3498db', bg: 'rgba(52,152,219,0.08)',  border: 'rgba(52,152,219,0.25)'  },
    escalated: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)'  },
    abandoned: { color: '#6b6b6b', bg: 'rgba(107,107,107,0.08)', border: 'rgba(107,107,107,0.2)'  },
  }
  const s = map[status] ?? map.abandoned
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-sans whitespace-nowrap" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {status}
    </span>
  )
}

// ─── Lead badge ───────────────────────────────────────────────────────────────

function LeadBadge({ label }: { label: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
    warm: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
    cold: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  }
  const s = map[label]
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded font-sans font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}

const SENTIMENT_EMOJI: Record<string, string> = {
  positive: '😊', excited: '🤩', neutral: '😐', uncertain: '🤔', frustrated: '😤',
}

// ─── Stat badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <div>
        <span className="font-bebas text-xl tracking-wider" style={{ color }}>{value}</span>
        <span className="text-xs font-sans ml-1.5" style={{ color: '#6b6b6b' }}>{label}</span>
      </div>
    </div>
  )
}

// ─── Conversation Detail Panel ────────────────────────────────────────────────

function DetailPanel({
  conv,
  agents,
  onClose,
  onStatusChange,
}: {
  conv: Conversation
  agents: Agent[]
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const { toast } = useToast()
  const panelRef = useRef<HTMLDivElement>(null)
  const agent = agents.find(a => a.id === conv.agent_id)
  const agentName = agent?.display_name ?? agent?.agent_type ?? 'Unknown Agent'

  async function handleStatusUpdate(newStatus: string) {
    try {
      const res = await fetch(`/api/conversations/${conv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        onStatusChange(conv.id, newStatus)
        toast(`Conversation marked as ${newStatus}`, 'success')
      }
    } catch {
      toast('Failed to update status', 'error')
    }
  }

  function handleExport() {
    const text = conv.messages
      .map((m: Message) => `[${m.role.toUpperCase()}] ${m.content}`)
      .join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `conversation-${conv.id.slice(0, 8)}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-screen z-50 flex flex-col w-full max-w-lg shadow-2xl"
        style={{ background: '#141414', borderLeft: '1px solid #2a2a2a' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-3">
            {conv.channel && <ChannelIcon channel={conv.channel} size={18} />}
            <div>
              <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>
                {conv.contact_identifier ?? 'Anonymous'}
              </p>
              <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>
                via {agentName} · {new Date(conv.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: '#6b6b6b' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta bar */}
        <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <StatusBadge status={conv.status} />
          {conv.confidence_score !== null && (
            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
              Confidence: <span style={{ color: '#C9A84C' }}>{(conv.confidence_score * 100).toFixed(0)}%</span>
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {conv.messages.length === 0 ? (
            <p className="text-sm font-sans text-center mt-10" style={{ color: '#6b6b6b' }}>No messages</p>
          ) : (
            conv.messages.map((msg: Message, i: number) => {
              const isAgent = msg.role === 'assistant'
              return (
                <div key={i} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-lg px-4 py-2.5 text-sm font-sans leading-relaxed"
                    style={
                      isAgent
                        ? { background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', color: '#F0EBE1' }
                        : { background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }
                    }
                  >
                    <p className="text-xs mb-1" style={{ color: isAgent ? 'rgba(201,168,76,0.6)' : '#6b6b6b' }}>
                      {isAgent ? agentName : (conv.contact_identifier ?? 'User')}
                    </p>
                    {msg.content}
                    {msg.timestamp && (
                      <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 py-4 shrink-0 flex-wrap" style={{ borderTop: '1px solid #2a2a2a' }}>
          {conv.status !== 'resolved' && (
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => handleStatusUpdate('resolved')}>
              <CheckCircle size={13} /> Mark Resolved
            </Button>
          )}
          {conv.status !== 'escalated' && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => handleStatusUpdate('escalated')}>
              <AlertTriangle size={13} /> Escalate
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download size={13} /> Export
          </Button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [page, setPage] = useState(1)

  // Filters
  const [agentFilter, setAgentFilter]   = useState(searchParams.get('agent') ?? '')
  const [channelFilter, setChannelFilter] = useState('')
  const [statusFilter, setStatusFilter]  = useState('')
  const [search, setSearch]              = useState('')

  useEffect(() => { document.title = 'Conversations — LYCHO' }, [])

  // Fetch agents for filter dropdown
  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(j => setAgents(j.data ?? []))
      .catch(() => {})
  }, [])

  const fetchConversations = useCallback(async (pg = 1) => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(PAGE_SIZE) })
      if (agentFilter)   params.set('agent_id', agentFilter)
      if (channelFilter) params.set('channel', channelFilter)
      if (statusFilter)  params.set('status', statusFilter)
      if (search)        params.set('search', search)

      const res = await fetch(`/api/conversations?${params}`)
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        setError(true)
        return
      }
      const j = await res.json()
      setConversations(j.data?.conversations ?? [])
      setTotal(j.data?.total ?? 0)
      setPage(pg)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [agentFilter, channelFilter, statusFilter, search, router])

  useEffect(() => { fetchConversations(1) }, [fetchConversations])

  function clearFilters() {
    setAgentFilter(''); setChannelFilter(''); setStatusFilter(''); setSearch('')
  }

  const hasFilters = agentFilter || channelFilter || statusFilter || search

  // Stats for today
  const today = new Date().toISOString().slice(0, 10)
  const todayCount    = conversations.filter(c => c.created_at.startsWith(today)).length
  const openCount     = conversations.filter(c => c.status === 'open').length
  const resolvedCount = conversations.filter(c => c.status === 'resolved').length
  const escalatedCount = conversations.filter(c => c.status === 'escalated').length

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleStatusChange(id: string, status: string) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : prev)
  }

  function lastMessage(conv: Conversation): string {
    const msgs = conv.messages ?? []
    const last = msgs[msgs.length - 1]
    if (!last) return '—'
    const content = last.content ?? ''
    return content.length > 60 ? content.slice(0, 60) + '…' : content
  }

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />

        <main className="flex-1 p-4 lg:p-10 space-y-6">
          {/* Heading */}
          <div>
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>Inbox</p>
            <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>Conversations</h1>
            <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>All agent interactions in one place</p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <StatBadge label="Today"     value={todayCount}     color="#C9A84C" />
            <StatBadge label="Open"      value={openCount}      color="#4ade80" />
            <StatBadge label="Resolved"  value={resolvedCount}  color="#3498db" />
            <StatBadge label="Escalated" value={escalatedCount} color="#fbbf24" />
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b6b6b' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contact…"
                className="w-full pl-9 pr-3 py-2 rounded text-sm font-sans outline-none"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
              />
            </div>

            {/* Agent filter */}
            <select
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
              className="px-3 py-2 rounded text-sm font-sans outline-none"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: agentFilter ? '#F0EBE1' : '#6b6b6b' }}
            >
              <option value="">All Agents</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.display_name ?? a.agent_type}</option>
              ))}
            </select>

            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="px-3 py-2 rounded text-sm font-sans outline-none"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: channelFilter ? '#F0EBE1' : '#6b6b6b' }}
            >
              <option value="">All Channels</option>
              {CHANNELS.map(ch => <option key={ch} value={ch}>{ch.charAt(0).toUpperCase() + ch.slice(1)}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded text-sm font-sans outline-none"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: statusFilter ? '#F0EBE1' : '#6b6b6b' }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X size={12} /> Clear
              </Button>
            )}
          </div>

          {/* Table */}
          {loading && (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <Skeleton key={i} width="100%" height="52px" />)}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg p-8 flex flex-col items-center text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans mb-3" style={{ color: 'rgba(240,235,225,0.6)' }}>Something went wrong.</p>
              <Button variant="secondary" size="sm" onClick={() => fetchConversations(page)}>Retry</Button>
            </div>
          )}

          {!loading && !error && conversations.length === 0 && (
            <div className="rounded-lg p-12 flex flex-col items-center text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <MessageCircle size={40} className="mb-4 opacity-20" style={{ color: '#6b6b6b' }} />
              <p className="font-sans font-medium mb-1" style={{ color: 'rgba(240,235,225,0.7)' }}>No conversations yet</p>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Deploy an agent to start receiving messages.</p>
            </div>
          )}

          {!loading && !error && conversations.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
              {/* Table header */}
              <div
                className="grid text-xs font-sans uppercase tracking-widest px-4 py-3 hidden md:grid"
                style={{
                  background: '#1c1c1c',
                  borderBottom: '1px solid #2a2a2a',
                  color: '#6b6b6b',
                  gridTemplateColumns: '40px 1fr 1fr 1.5fr 80px 80px 60px 90px',
                  gap: '12px',
                }}
              >
                <span>Ch</span>
                <span>Contact</span>
                <span>Agent</span>
                <span>Last Message</span>
                <span>Status</span>
                <span>Lead</span>
                <span>Mood</span>
                <span>Date</span>
              </div>

              {conversations.map((conv, i) => {
                const agent = agents.find(a => a.id === conv.agent_id)
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    className="w-full text-left transition-colors"
                    style={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(28,28,28,0.5)',
                      borderBottom: i < conversations.length - 1 ? '1px solid #2a2a2a' : undefined,
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.03)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(28,28,28,0.5)')}
                  >
                    {/* Mobile layout */}
                    <div className="flex items-center gap-3 px-4 py-3 md:hidden">
                      {conv.channel && <ChannelIcon channel={conv.channel} size={16} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>
                            {conv.contact_identifier ?? 'Anonymous'}
                          </span>
                          <StatusBadge status={conv.status} />
                        </div>
                        <p className="text-xs font-sans truncate mt-0.5" style={{ color: '#6b6b6b' }}>
                          {lastMessage(conv)}
                        </p>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div
                      className="hidden md:grid items-center px-4 py-3 gap-3"
                      style={{ gridTemplateColumns: '40px 1fr 1fr 1.5fr 80px 80px 60px 90px' }}
                    >
                      <div>{conv.channel && <ChannelIcon channel={conv.channel} size={15} />}</div>
                      <div className="min-w-0">
                        <span className="text-sm font-sans truncate block" style={{ color: '#F0EBE1' }}>
                          {conv.metadata?.contact_profile?.name ?? conv.contact_identifier ?? 'Anonymous'}
                        </span>
                        {conv.metadata?.contact_profile?.name && conv.contact_identifier && (
                          <span className="text-xs font-sans truncate block" style={{ color: '#6b6b6b' }}>
                            {conv.contact_identifier}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-sans truncate" style={{ color: '#6b6b6b' }}>
                        {agent?.display_name ?? agent?.agent_type ?? '—'}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-sans truncate block" style={{ color: '#6b6b6b' }}>
                          {lastMessage(conv)}
                        </span>
                        {conv.metadata?.suggested_next_action && conv.metadata.suggested_next_action !== 'continue' && (
                          <span
                            className="text-xs font-sans truncate block mt-0.5"
                            style={{ color: '#C9A84C', opacity: 0.8 }}
                          >
                            → {conv.metadata.suggested_next_action.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={conv.status} />
                      <div>
                        {conv.metadata?.lead_label ? (
                          <LeadBadge label={conv.metadata.lead_label} />
                        ) : (
                          <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>—</span>
                        )}
                      </div>
                      <span className="text-sm" title={conv.metadata?.sentiment}>
                        {SENTIMENT_EMOJI[conv.metadata?.sentiment ?? ''] ?? '—'}
                      </span>
                      <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                        {new Date(conv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => fetchConversations(page - 1)} className="gap-1">
                  <ChevronLeft size={14} /> Previous
                </Button>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => fetchConversations(page + 1)} className="gap-1">
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          conv={selected}
          agents={agents}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
