'use client'
import { useEffect, useState } from 'react'

const EVENT_COLORS: Record<string, string> = {
  knowledge_share: '#60a5fa',
  debate: '#f97316',
  teaching: '#4ade80',
  vote: '#C9A84C',
  discovery: '#a78bfa'
}

const EVENT_ICONS: Record<string, string> = {
  knowledge_share: '📡',
  debate: '⚔️',
  teaching: '🎓',
  vote: '🗳️',
  discovery: '💡'
}

export default function SocietyPage() {
  const [events, setEvents] = useState<any[]>([])
  const [simulation, setSimulation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/society')
      .then(r => r.json())
      .then(d => { setEvents(d.events || []); setLoading(false) })
  }, [])

  async function simulate() {
    setSimulating(true)
    const res = await fetch('/api/society', { method: 'POST' })
    const data = await res.json()
    setSimulation(data.result)
    setEvents(prev => [...(data.result?.events || []).map((e: any) => ({ ...e, created_at: new Date().toISOString() })), ...prev])
    setSimulating(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2 }}>LYCHO SOCIETY</h1>
            <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Your agent civilisation — self-organising, learning, evolving</p>
          </div>
          <button onClick={simulate} disabled={simulating} style={{ background: simulating ? '#1a1a1a' : '#C9A84C', color: simulating ? '#666' : '#070707', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: simulating ? 'not-allowed' : 'pointer', fontSize: 14 }}>
            {simulating ? 'Simulating...' : '⚡ Run Society Simulation'}
          </button>
        </div>

        {simulation && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Society Health', value: `${simulation.society_health}%`, color: simulation.society_health > 70 ? '#4ade80' : '#C9A84C' },
              { label: 'Events Today', value: simulation.events?.length || 0, color: '#fff' },
              { label: 'Culture', value: (simulation.dominant_culture?.slice(0, 30) || '...') + '...', color: '#a78bfa' }
            ].map(s => (
              <div key={s.label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16 }}>
                <div style={{ color: '#666', fontSize: 11, marginBottom: 6 }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: 700, fontSize: 15 }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {simulation?.consensus && (
          <div style={{ background: 'linear-gradient(135deg,#1a1500,#0d0d0d)', border: '1px solid #C9A84C44', borderLeft: '3px solid #C9A84C', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <div style={{ color: '#C9A84C', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>TODAY&apos;S SOCIETY CONSENSUS</div>
            <div style={{ color: '#F0EBE1', fontSize: 14, lineHeight: 1.6 }}>{simulation.consensus}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <div style={{ color: '#444', textAlign: 'center', padding: 40 }}>Loading society history...</div>}
          {!loading && events.length === 0 && (
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 60, textAlign: 'center', color: '#444' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
              <div>No society events yet. Run a simulation to see your agents interact.</div>
            </div>
          )}
          {events.map((event, i) => (
            <div key={i} style={{ background: '#0d0d0d', border: `1px solid ${EVENT_COLORS[event.event_type] || '#1a1a1a'}22`, borderRadius: 8, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{EVENT_ICONS[event.event_type] || '🔗'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ color: EVENT_COLORS[event.event_type] || '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {event.event_type?.replace('_', ' ')} &middot; {event.from_agent} &rarr; {event.to_agent}
                  </div>
                  <div style={{ color: '#444', fontSize: 11 }}>{new Date(event.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ color: '#aaa', fontSize: 14, lineHeight: 1.5, marginBottom: 6 }}>{event.description}</div>
                {event.outcome && <div style={{ color: '#666', fontSize: 12, fontStyle: 'italic' }}>Outcome: {event.outcome}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
