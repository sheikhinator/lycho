'use client'

import { useState, useEffect } from 'react'

interface SyndicateMessage {
  id: string
  from_agent: string
  to_agent: string
  message_type: string
  status: string
  quality_score: number | null
  flagged_by_guardian: boolean
  duration_ms: number | null
  created_at: string
}

// Node positions for 7 agents in a circle (cx=200, cy=200, r=140)
const NODES = [
  { id: 'orion',    label: 'ORION',    x: 200, y: 60,  color: '#a78bfa' },
  { id: 'forge',    label: 'FORGE',    x: 323, y: 110, color: '#f59e0b' },
  { id: 'nexus',    label: 'NEXUS',    x: 340, y: 245, color: '#34d399' },
  { id: 'guardian', label: 'GUARD',   x: 263, y: 355, color: '#f87171' },
  { id: 'veritas',  label: 'VERIT',   x: 137, y: 355, color: '#60a5fa' },
  { id: 'intake',   label: 'INTAKE',  x: 60,  y: 245, color: '#C9A84C' },
  { id: 'research', label: 'RESRCH',  x: 77,  y: 110, color: '#c084fc' },
]

// Static edges for the network map
const EDGES = [
  { from: 'orion', to: 'forge' },
  { from: 'orion', to: 'nexus' },
  { from: 'orion', to: 'guardian' },
  { from: 'orion', to: 'veritas' },
  { from: 'forge', to: 'nexus' },
  { from: 'guardian', to: 'veritas' },
  { from: 'intake', to: 'orion' },
  { from: 'research', to: 'orion' },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

const TYPE_COLORS: Record<string, string> = {
  security_check: '#f87171',
  quality_check: '#60a5fa',
  forge_brief: '#f59e0b',
  share_intelligence: '#a78bfa',
  request_analysis: '#34d399',
  escalation: '#fb923c',
}

export default function SyndicatePage() {
  const [messages, setMessages] = useState<SyndicateMessage[]>([])
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set())

  async function loadMessages() {
    try {
      const res = await fetch('/api/syndicate/messages')
      if (!res.ok) return
      const json = await res.json()
      const msgs: SyndicateMessage[] = json.messages || []
      setMessages(msgs)

      // Find edges active in last 60s
      const cutoff = Date.now() - 60_000
      const active = new Set<string>()
      msgs.forEach(m => {
        if (new Date(m.created_at).getTime() > cutoff) {
          active.add(`${m.from_agent}-${m.to_agent}`)
          active.add(`${m.to_agent}-${m.from_agent}`)
        }
      })
      setActiveEdges(active)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadMessages()
    const interval = setInterval(loadMessages, 10_000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date(); today.setHours(0,0,0,0)
  const msgsToday = messages.filter(m => new Date(m.created_at) >= today).length
  const blocked = messages.filter(m => m.flagged_by_guardian).length
  const avgQ = messages.filter(m => m.quality_score).length
    ? Math.round(messages.filter(m => m.quality_score).reduce((s, m) => s + (m.quality_score || 0), 0) / messages.filter(m => m.quality_score).length)
    : 0

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'sans-serif', fontSize: 32, fontWeight: 900, color: '#06b6d4', letterSpacing: 3, margin: 0 }}>
          THE SYNDICATE
        </h1>
        <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>Your AI agents — working together</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Messages Today',      value: msgsToday,       color: '#06b6d4' },
          { label: 'Active Routes',        value: 8,               color: '#06b6d4' },
          { label: 'Avg Quality Score',    value: `${avgQ}/100`,   color: '#34d399' },
          { label: 'Guardian Blocks',      value: blocked,         color: blocked > 0 ? '#ef4444' : '#34d399' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16 }}>
            <div style={{ color: '#444', fontSize: 11 }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: 24, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Network Map */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
          <div style={{ color: '#444', fontSize: 11, marginBottom: 12, letterSpacing: 1 }}>NETWORK MAP</div>
          <svg width="400" height="415" viewBox="0 0 400 415">
            <defs>
              <style>{`
                @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
                @keyframes flow { 0%{stroke-dashoffset:20} 100%{stroke-dashoffset:0} }
                .edge-active { animation: pulse 1.5s ease-in-out infinite; }
                .edge-flow { stroke-dasharray: 6 4; animation: flow 0.8s linear infinite; }
              `}</style>
            </defs>

            {/* Edges */}
            {EDGES.map(e => {
              const from = NODES.find(n => n.id === e.from)!
              const to   = NODES.find(n => n.id === e.to)!
              const key  = `${e.from}-${e.to}`
              const isActive = activeEdges.has(key)
              return (
                <line
                  key={key}
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isActive ? '#06b6d4' : '#1e1e1e'}
                  strokeWidth={isActive ? 1.5 : 1}
                  className={isActive ? 'edge-active edge-flow' : ''}
                />
              )
            })}

            {/* Center pulse */}
            <circle cx="200" cy="200" r="8" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="8;18;8" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="200" r="4" fill="#06b6d4" opacity="0.6" />

            {/* Nodes */}
            {NODES.map(n => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="22" fill="#111" stroke={n.color} strokeWidth="1.5" />
                <text x={n.x} y={n.y - 2} textAnchor="middle" fill={n.color} fontSize="8" fontWeight="bold" fontFamily="monospace">{n.label}</text>
                <circle cx={n.x} cy={n.y + 9} r="3" fill={n.color} opacity="0.8" />
              </g>
            ))}
          </svg>
        </div>

        {/* Live Message Feed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#444', fontSize: 11, letterSpacing: 1 }}>LIVE TRAFFIC</div>
            <div style={{ color: '#1e3a3a', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} />
              <span style={{ color: '#555' }}>Auto-refreshes every 10s</span>
            </div>
          </div>

          {messages.length === 0 ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: 32, textAlign: 'center' }}>
              <div style={{ color: '#333', fontSize: 13 }}>Your agents are ready.</div>
              <div style={{ color: '#2a2a2a', fontSize: 12, marginTop: 6 }}>Deploy them to see the Syndicate in action.</div>
            </div>
          ) : (
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden' }}>
              {messages.slice(0, 20).map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  borderBottom: '1px solid #111', fontSize: 12
                }}>
                  <span style={{ color: '#06b6d4', fontWeight: 600, width: 70, flexShrink: 0 }}>{m.from_agent}</span>
                  <span style={{ color: '#2a2a2a' }}>→</span>
                  <span style={{ color: '#06b6d4', fontWeight: 600, width: 70, flexShrink: 0 }}>{m.to_agent}</span>
                  <span style={{
                    background: '#111', color: TYPE_COLORS[m.message_type] || '#666',
                    padding: '1px 6px', borderRadius: 3, fontSize: 10, flexShrink: 0
                  }}>{m.message_type.replace(/_/g, ' ')}</span>
                  <span style={{
                    color: m.status === 'completed' ? '#34d399' : m.status === 'blocked' ? '#ef4444' : '#f59e0b',
                    flexShrink: 0, fontSize: 11
                  }}>{m.status}</span>
                  {m.quality_score && (
                    <span style={{ color: m.quality_score >= 80 ? '#34d399' : m.quality_score >= 60 ? '#f59e0b' : '#ef4444', fontSize: 10 }}>
                      Q:{m.quality_score}
                    </span>
                  )}
                  {m.flagged_by_guardian && <span style={{ color: '#ef4444', fontSize: 10 }}>BLOCKED</span>}
                  <span style={{ color: '#333', marginLeft: 'auto', fontSize: 11, flexShrink: 0 }}>{timeAgo(m.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
