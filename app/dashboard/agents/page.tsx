'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, Settings, RefreshCw, Bot, Wand2, Trash2 } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { DeployAgentModal } from '@/components/dashboard/DeployAgentModal'
import { ChannelIcon } from '@/components/ui/ChannelIcon'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface Agent {
  id: string
  agent_type: string
  display_name: string | null
  status: string
  version: number
  channels: string[]
  interactions_count: number
  monthly_cost_pkr: number
  monthly_value_pkr: number
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; border: string; pulse?: boolean }> = {
    active:      { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.25)'  },
    paused:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)'  },
    configuring: { color: '#6b6b6b', bg: 'rgba(107,107,107,0.08)', border: 'rgba(107,107,107,0.25)', pulse: true },
    error:       { color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.25)' },
    deleted:     { color: '#6b6b6b', bg: 'rgba(107,107,107,0.08)', border: 'rgba(107,107,107,0.25)' },
  }
  const s = config[status] ?? config.configuring

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-sans"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${s.pulse ? 'animate-pulse' : ''}`}
        style={{ background: s.color }}
      />
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="text-xs font-sans uppercase tracking-widest px-2 py-0.5 rounded"
      style={{
        background: 'rgba(201,168,76,0.06)',
        border: '1px solid rgba(201,168,76,0.2)',
        color: '#7a6130',
      }}
    >
      {type.replace(/_/g, ' ')}
    </span>
  )
}

function AgentCard({
  agent,
  onStatusToggle,
  onDeleted,
}: {
  agent: Agent
  onStatusToggle: (id: string, current: string) => Promise<void>
  onDeleted: (id: string) => void
}) {
  const { toast } = useToast()
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onStatusToggle(agent.id, agent.status)
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${agent.display_name ?? agent.agent_type}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
      if (res.ok) { toast('Agent deleted', 'success'); onDeleted(agent.id) }
      else { const j = await res.json(); toast(j.error ?? 'Delete failed', 'error') }
    } catch { toast('Network error', 'error') }
    finally { setDeleting(false) }
  }

  const isPaused = agent.status === 'paused'

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-3 transition-colors"
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <TypeBadge type={agent.agent_type} />
          <h3 className="font-sans font-semibold text-base mt-1.5 truncate" style={{ color: '#F0EBE1' }}>
            {agent.display_name ?? agent.agent_type}
          </h3>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Interactions</p>
          <p className="font-bebas text-xl tracking-wider" style={{ color: '#F0EBE1' }}>
            {agent.interactions_count.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Cost / mo</p>
          <p className="font-bebas text-xl tracking-wider" style={{ color: '#F0EBE1' }}>
            {agent.monthly_cost_pkr.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Value / mo</p>
          <p className="font-bebas text-xl tracking-wider" style={{ color: '#4ade80' }}>
            {agent.monthly_value_pkr.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Channels */}
      {agent.channels.length > 0 && (
        <div className="flex items-center gap-2">
          {agent.channels.map(ch => (
            <ChannelIcon key={ch} channel={ch} size={15} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div
        className="flex flex-col gap-2 pt-3"
        style={{ borderTop: '1px solid #2a2a2a' }}
      >
        <Link href={`/dashboard/agents/${agent.id}?tab=config`} className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <Settings size={13} />
            Configure
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          disabled={toggling || agent.status === 'configuring'}
          onClick={handleToggle}
        >
          <RefreshCw size={13} className={toggling ? 'animate-spin' : ''} />
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        <Link href={`/dashboard/conversations?agent=${agent.id}`} className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <MessageSquare size={13} />
            View Conversations
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          disabled={deleting}
          onClick={handleDelete}
          style={{ color: '#f87171' }}
        >
          <Trash2 size={13} />
          {deleting ? 'Deleting…' : 'Delete Agent'}
        </Button>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 403) { setAgents([]); return } // no tenant yet — show empty state
        setError(true)
        return
      }
      const json = await res.json()
      setAgents(json.data ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  async function handleStatusToggle(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused'
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error ?? 'Failed to update agent', 'error')
        return
      }
      setAgents(prev =>
        prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
      )
      toast(`Agent ${newStatus === 'paused' ? 'paused' : 'resumed'}`, 'success')
    } catch {
      toast('Network error', 'error')
    }
  }

  useEffect(() => { document.title = 'Your Agents — LYCHO' }, [])

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>
                AI Workforce
              </p>
              <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>
                Your Agents
              </h1>
              <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>
                Deploy and manage your AI workforce
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/agents/builder">
                <Button variant="ghost" className="flex items-center gap-2" style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}>
                  <Wand2 size={14} />
                  Build Custom Agent
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Deploy New Agent
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center text-center"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', minHeight: '200px' }}
            >
              <p className="text-sm font-sans mb-3" style={{ color: 'rgba(240,235,225,0.6)' }}>
                Something went wrong. Please refresh.
              </p>
              <Button variant="secondary" size="sm" onClick={fetchAgents}>
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && agents.length === 0 && (
            <div
              className="rounded-lg p-12 flex flex-col items-center justify-center text-center"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', minHeight: '280px' }}
            >
              <Bot size={40} className="mb-4 opacity-20" style={{ color: '#6b6b6b' }} />
              <p className="font-sans font-medium mb-1" style={{ color: 'rgba(240,235,225,0.7)' }}>
                No agents deployed yet
              </p>
              <p className="text-sm font-sans mb-6" style={{ color: '#6b6b6b' }}>
                Deploy your first AI agent to start automating your business
              </p>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Deploy Your First Agent
              </Button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && agents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onStatusToggle={handleStatusToggle}
                  onDeleted={(id) => setAgents(prev => prev.filter(a => a.id !== id))}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <DeployAgentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDeployed={fetchAgents}
      />
    </div>
  )
}
