'use client'

import { useState, useEffect, useCallback } from 'react'
import { Hammer, RefreshCw, Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface ForgeEntry {
  id: string
  agent_type: string
  display_name: string
  description: string
  system_prompt: string
  recommended_channels: string[]
  model_complexity: string
  estimated_value_pkr: number
  sector_tags: string[]
  use_case_examples: string[]
  why_novel: string
  status: string
  master_notes: string | null
  created_at: string
  reviewed_at: string | null
}

const MASTER_SECRET = typeof window !== 'undefined' ? (localStorage.getItem('master_secret') ?? '') : ''

function getSecret(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('master_secret') ?? ''
}

export default function MasterForgePage() {
  const [entries, setEntries]     = useState<ForgeEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [running, setRunning]     = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [tab, setTab]             = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [notes, setNotes]         = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forge/queue?status=${tab === 'pending' ? 'pending_review' : tab}`, {
        headers: { 'x-master-secret': getSecret() },
      })
      const json = await res.json()
      setEntries(json.data ?? [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function runForge() {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/forge/autonomous', {
        method: 'POST',
        headers: { 'x-master-secret': getSecret() },
      })
      const json = await res.json()
      setRunResult(`Queued ${json.data?.agents_queued ?? 0} new agents`)
      fetchEntries()
    } catch {
      setRunResult('Error running Forge')
    } finally {
      setRunning(false)
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id + action)
    try {
      const res = await fetch(`/api/forge/queue/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-master-secret': getSecret() },
        body: JSON.stringify({ action, notes: notes[id] ?? null }),
      })
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== id))
        setExpanded(null)
      }
    } finally {
      setActionLoading(null)
    }
  }

  const pending   = entries.filter(e => e.status === 'pending_review')
  const approved  = entries.filter(e => e.status === 'approved')
  const rejected  = entries.filter(e => e.status === 'rejected')
  const displayed = tab === 'pending' ? pending : tab === 'approved' ? approved : rejected

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#F0EBE1', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <Hammer size={24} color="#C9A84C" />
              <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.2rem', color: '#F0EBE1', letterSpacing: '0.05em', margin: 0 }}>FORGE QUEUE</h1>
            </div>
            <p style={{ color: '#6b6b6b', fontSize: '14px', margin: 0 }}>Built while you slept. Review and deploy new agents.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button
              onClick={runForge}
              disabled={running}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: running ? '#2a2a2a' : '#C9A84C', color: running ? '#6b6b6b' : '#070707', fontWeight: 700, fontSize: '13px', border: 'none', cursor: running ? 'default' : 'pointer' }}
            >
              <RefreshCw size={14} style={{ animation: running ? 'spin 1s linear infinite' : 'none' }} />
              {running ? 'Running…' : 'Run Forge Now'}
            </button>
            {runResult && <p style={{ color: '#C9A84C', fontSize: '12px', margin: 0 }}>{runResult}</p>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Pending Review', value: pending.length, color: '#f59e0b' },
            { label: 'Approved', value: approved.length, color: '#4ade80' },
            { label: 'Rejected', value: rejected.length, color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#6b6b6b', fontSize: '12px', margin: 0 }}>{s.label}</p>
              <p style={{ color: s.color, fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.04em', margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#141414', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {(['pending', 'approved', 'rejected'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ padding: '8px 20px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t ? '#C9A84C' : 'transparent', color: tab === t ? '#070707' : '#6b6b6b', transition: 'all 0.15s', textTransform: 'capitalize' }}
            >
              {t === 'pending' ? `Pending (${pending.length})` : t === 'approved' ? `Approved (${approved.length})` : `Rejected (${rejected.length})`}
            </button>
          ))}
        </div>

        {/* Entries */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 150, 300].map(d => <span key={d} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />)}
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#4a4a4a', fontSize: '14px' }}>
            {tab === 'pending' ? 'No agents pending review. Run the Forge to generate new ones.' : `No ${tab} agents.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayed.map(entry => (
              <div key={entry.id} style={{ background: '#141414', border: `1px solid ${entry.status === 'approved' ? 'rgba(74,222,128,0.2)' : entry.status === 'rejected' ? 'rgba(248,113,113,0.2)' : '#2a2a2a'}`, borderRadius: '12px', overflow: 'hidden' }}>
                {/* Card header */}
                <div
                  style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <p style={{ color: '#F0EBE1', fontSize: '15px', fontWeight: 600, margin: 0 }}>{entry.display_name}</p>
                      <code style={{ color: '#6b6b6b', fontSize: '11px', background: '#1c1c1c', padding: '2px 8px', borderRadius: '4px' }}>{entry.agent_type}</code>
                      {entry.sector_tags?.map(tag => (
                        <span key={tag} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>{tag}</span>
                      ))}
                    </div>
                    <p style={{ color: '#6b6b6b', fontSize: '13px', margin: 0 }}>{entry.description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {entry.estimated_value_pkr > 0 && (
                      <p style={{ color: '#C9A84C', fontSize: '13px', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em', margin: 0 }}>
                        PKR {entry.estimated_value_pkr.toLocaleString('en-PK')}/mo
                      </p>
                    )}
                    {expanded === entry.id ? <ChevronUp size={16} color="#6b6b6b" /> : <ChevronDown size={16} color="#6b6b6b" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === entry.id && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1e1e1e' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '18px', marginBottom: '20px' }}>
                      {entry.why_novel && (
                        <div>
                          <p style={{ color: '#6b6b6b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Why Novel</p>
                          <p style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>{entry.why_novel}</p>
                        </div>
                      )}
                      {entry.use_case_examples?.length > 0 && (
                        <div>
                          <p style={{ color: '#6b6b6b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Use Cases</p>
                          <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            {entry.use_case_examples.map((ex, i) => (
                              <li key={i} style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6 }}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* System prompt preview */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: '#6b6b6b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>System Prompt Preview</p>
                      <pre style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '12px', color: '#6b6b6b', fontSize: '11px', lineHeight: 1.6, overflow: 'hidden', maxHeight: '120px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {entry.system_prompt?.slice(0, 400)}{entry.system_prompt?.length > 400 ? '…' : ''}
                      </pre>
                    </div>

                    {/* Channels */}
                    {entry.recommended_channels?.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <p style={{ color: '#6b6b6b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Channels</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {entry.recommended_channels.map(ch => (
                            <span key={ch} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: '#1c1c1c', color: '#a0a0a0', border: '1px solid #2a2a2a' }}>{ch}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions (pending only) */}
                    {entry.status === 'pending_review' && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ color: '#6b6b6b', fontSize: '11px', display: 'block', marginBottom: '6px' }}>Notes (optional)</label>
                          <input
                            type="text"
                            value={notes[entry.id] ?? ''}
                            onChange={e => setNotes(prev => ({ ...prev, [entry.id]: e.target.value }))}
                            placeholder="Add review notes…"
                            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 12px', color: '#F0EBE1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <button
                          onClick={() => handleAction(entry.id, 'approve')}
                          disabled={actionLoading !== null}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: '#4ade80', color: '#070707', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: actionLoading ? 0.6 : 1 }}
                        >
                          <Check size={14} />Approve & Deploy
                        </button>
                        <button
                          onClick={() => handleAction(entry.id, 'reject')}
                          disabled={actionLoading !== null}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: '#1c1c1c', color: '#f87171', fontWeight: 700, fontSize: '13px', border: '1px solid rgba(248,113,113,0.3)', cursor: 'pointer', flexShrink: 0, opacity: actionLoading ? 0.6 : 1 }}
                        >
                          <X size={14} />Reject
                        </button>
                      </div>
                    )}

                    {/* History status */}
                    {entry.status !== 'pending_review' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: entry.status === 'approved' ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${entry.status === 'approved' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                        {entry.status === 'approved' ? <Check size={14} color="#4ade80" /> : <X size={14} color="#f87171" />}
                        <p style={{ color: entry.status === 'approved' ? '#4ade80' : '#f87171', fontSize: '13px', margin: 0 }}>
                          {entry.status === 'approved' ? 'Approved & deployed' : 'Rejected'}
                          {entry.reviewed_at ? ` · ${new Date(entry.reviewed_at).toLocaleDateString()}` : ''}
                        </p>
                        {entry.master_notes && <p style={{ color: '#6b6b6b', fontSize: '12px', margin: '0 0 0 8px' }}>"{entry.master_notes}"</p>}
                      </div>
                    )}

                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={11} color="#4a4a4a" />
                      <p style={{ color: '#4a4a4a', fontSize: '11px', margin: 0 }}>Generated {new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
