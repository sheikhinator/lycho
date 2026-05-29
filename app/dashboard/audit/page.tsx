'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Shield, ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface AuditEntry {
  id: string
  actor_id: string | null
  action: string | null
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

interface ActionOption {
  value: string
  label: string
}

const ACTION_COLORS: Record<string, string> = {
  'agent.created': '#4ade80',
  'agent.updated': '#60a5fa',
  'agent.deleted': '#f87171',
  'agent.paused': '#fbbf24',
  'agent.activated': '#4ade80',
  'agent.rolled_back': '#a78bfa',
  'conversation.deleted': '#f87171',
  'team.invited': '#60a5fa',
  'team.role_changed': '#fbbf24',
  'team.removed': '#f87171',
  'channel.connected': '#4ade80',
  'channel.disconnected': '#fbbf24',
  'tenant.updated': '#60a5fa',
  'account.deleted': '#f87171',
}

function getActionColor(action: string | null): string {
  if (!action) return '#6b6b6b'
  return ACTION_COLORS[action] ?? '#6b6b6b'
}

function getActionLabel(action: string | null): string {
  if (!action) return 'Unknown'
  return action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')
  const [actions, setActions] = useState<ActionOption[]>([])
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', action: actionFilter })
      const res = await fetch(`/api/audit?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load'); return }
      setEntries(json.data?.entries ?? [])
      setPagination(json.data?.pagination ?? null)
      if (json.data?.filters?.actions) setActions(json.data.filters.actions)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="flex min-h-screen" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Shield size={22} style={{ color: '#C9A84C' }} />
              <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Audit Log</h1>
            </div>
            <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Every action taken in your account — timestamped and immutable.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm font-sans" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6b6b6b' }} />
              <select
                value={actionFilter}
                onChange={e => { setActionFilter(e.target.value); setPage(1) }}
                className="pl-9 pr-8 py-2.5 rounded-lg text-sm font-sans outline-none appearance-none"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1', minWidth: 180 }}
              >
                {actions.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {pagination && (
              <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                {pagination.total} {pagination.total === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Shield size={40} className="mb-4 opacity-20" style={{ color: '#C9A84C' }} />
              <p className="text-sm font-sans mb-1" style={{ color: '#F0EBE1' }}>No audit entries found</p>
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Actions like creating agents or inviting team members will appear here.</p>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a2a2a', background: '#141414' }}>
                      {['Action', 'Resource', 'User', 'Time', 'IP'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs uppercase tracking-widest font-sans" style={{ color: '#6b6b6b' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => (
                      <tr
                        key={entry.id}
                        style={{
                          background: i % 2 === 0 ? '#0d0d0d' : '#141414',
                          borderBottom: i < entries.length - 1 ? '1px solid #1a1a1a' : 'none',
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: getActionColor(entry.action) }}
                            />
                            <span className="font-medium" style={{ color: '#F0EBE1' }}>{getActionLabel(entry.action)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs" style={{ color: '#6b6b6b' }}>
                            {entry.resource_type
                              ? `${entry.resource_type.replace(/_/g, ' ')}${entry.resource_id ? ` · ${entry.resource_id.slice(0, 8)}…` : ''}`
                              : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span style={{ color: '#6b6b6b' }}>{entry.actor_id ? `${entry.actor_id.slice(0, 8)}…` : 'System'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span style={{ color: '#F0EBE1' }}>{timeAgo(entry.created_at)}</span>
                            <span className="text-xs" style={{ color: '#444' }}>{new Date(entry.created_at).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <code className="text-xs font-mono" style={{ color: '#6b6b6b' }}>{entry.ip_address ?? '—'}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!pagination.has_prev}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors"
                style={{
                  background: pagination.has_prev ? 'rgba(201,168,76,0.08)' : '#1c1c1c',
                  color: pagination.has_prev ? '#C9A84C' : '#444',
                  border: `1px solid ${pagination.has_prev ? 'rgba(201,168,76,0.25)' : '#2a2a2a'}`,
                  cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.has_next}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors"
                style={{
                  background: pagination.has_next ? 'rgba(201,168,76,0.08)' : '#1c1c1c',
                  color: pagination.has_next ? '#C9A84C' : '#444',
                  border: `1px solid ${pagination.has_next ? 'rgba(201,168,76,0.25)' : '#2a2a2a'}`,
                  cursor: pagination.has_next ? 'pointer' : 'not-allowed',
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
