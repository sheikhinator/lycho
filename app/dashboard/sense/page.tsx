'use client'
import { useEffect, useState } from 'react'

const SENSOR_TYPES = [
  { id: 'temperature', label: 'Temperature', icon: '🌡️', example: { value: 24.5, location: 'Office' } },
  { id: 'occupancy', label: 'Occupancy', icon: '👥', example: { count: 12, location: 'Floor 2' } },
  { id: 'inventory', label: 'Inventory', icon: '📦', example: { item: 'Product A', quantity: 45, threshold: 50 } },
  { id: 'energy', label: 'Energy', icon: '⚡', example: { consumption: 124.5, peak_hour: '14:00' } },
  { id: 'traffic', label: 'Website Traffic', icon: '📊', example: { visitors: 1250, bounce_rate: 0.45 } },
  { id: 'custom', label: 'Custom', icon: '🔧', example: { value: 0, note: 'Custom sensor data' } },
]

export default function SensePage() {
  const [events, setEvents] = useState<any[]>([])
  const [sensorType, setSensorType] = useState('temperature')
  const [customData, setCustomData] = useState('')
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState('')

  useEffect(() => {
    fetch('/api/sense').then(r => r.json()).then(d => setEvents(d.events || []))
  }, [])

  async function sendData() {
    setLoading(true)
    setInsight('')
    const sensor = SENSOR_TYPES.find(s => s.id === sensorType)
    let data: any
    try { data = customData ? JSON.parse(customData) : sensor?.example }
    catch { data = { value: customData } }

    const res = await fetch('/api/sense', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sensor_type: sensorType, data }) })
    const result = await res.json()
    setInsight(result.insight || '')
    setEvents(prev => [{ sensor_type: sensorType, data, insight: result.insight, created_at: new Date().toISOString() }, ...prev])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2 }}>LYCHO SENSE</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>Connect physical world data. Agents analyse and act on sensor inputs.</p>

        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ color: '#666', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>SENSOR TYPE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {SENSOR_TYPES.map(s => <button key={s.id} onClick={() => setSensorType(s.id)} style={{ background: sensorType === s.id ? '#C9A84C' : '#141414', color: sensorType === s.id ? '#070707' : '#888', border: `1px solid ${sensorType === s.id ? '#C9A84C' : '#2a2a2a'}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: sensorType === s.id ? 700 : 400 }}>{s.icon} {s.label}</button>)}
          </div>
          <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>DATA (JSON) &mdash; leave blank to use example</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={customData} onChange={e => setCustomData(e.target.value)} placeholder={JSON.stringify(SENSOR_TYPES.find(s=>s.id===sensorType)?.example)} style={{ flex: 1, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
            <button onClick={sendData} disabled={loading} style={{ background: loading ? '#1a1a1a' : '#C9A84C', color: loading ? '#666' : '#070707', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {loading ? 'Analysing...' : 'Send Data'}
            </button>
          </div>
          {insight && <div style={{ marginTop: 16, background: 'linear-gradient(135deg,#1a1500,#0d0d0d)', border: '1px solid #C9A84C44', borderLeft: '3px solid #C9A84C', borderRadius: 8, padding: 16, color: '#F0EBE1', fontSize: 14, lineHeight: 1.6 }}>{insight}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: '#666', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>SENSE HISTORY</div>
          {events.length === 0 && <div style={{ color: '#333', fontSize: 13, padding: 20 }}>No sensor events yet.</div>}
          {events.map((e, i) => (
            <div key={i} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 16, display: 'flex', gap: 12 }}>
              <div style={{ fontSize: 20 }}>{SENSOR_TYPES.find(s=>s.id===e.sensor_type)?.icon || '🔧'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#C9A84C', fontSize: 12, fontWeight: 700 }}>{e.sensor_type?.toUpperCase()}</span>
                  <span style={{ color: '#444', fontSize: 11 }}>{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div style={{ color: '#555', fontSize: 11, fontFamily: 'monospace', marginBottom: 6 }}>{JSON.stringify(e.data)}</div>
                {e.insight && <div style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5 }}>{e.insight}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
