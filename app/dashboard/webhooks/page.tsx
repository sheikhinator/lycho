'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Webhook, Plus, Loader2, Copy, CheckCircle, XCircle } from 'lucide-react'

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<any[]>([])
  const [events, setEvents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ url: '', description: '', selectedEvents: [] as string[] })
  const [creating, setCreating] = useState(false)
  const [showSecret, setShowSecret] = useState<string | null>(null)

  useEffect(() => { fetchEndpoints() }, [])

  async function fetchEndpoints() {
    setLoading(true)
    try {
      const res = await fetch('/api/webhooks/settings')
      const data = await res.json()
      setEndpoints(data.endpoints || [])
      setEvents(data.available_events || [])
    } catch {} finally { setLoading(false) }
  }

  async function createEndpoint() {
    if (!form.url.trim() || form.selectedEvents.length === 0) return
    setCreating(true)
    try {
      const res = await fetch('/api/webhooks/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: form.url, events: form.selectedEvents, description: form.description }),
      })
      const data = await res.json()
      if (data.endpoint?.secret) setShowSecret(data.endpoint.secret)
      setShowCreate(false)
      setForm({ url: '', description: '', selectedEvents: [] })
      await fetchEndpoints()
    } catch {} finally { setCreating(false) }
  }

  function toggleEvent(event: string) {
    setForm(prev => ({
      ...prev,
      selectedEvents: prev.selectedEvents.includes(event)
        ? prev.selectedEvents.filter(e => e !== event)
        : [...prev.selectedEvents, event],
    }))
  }

  async function toggleEndpoint(id: string, currentStatus: string) {
    try {
      await fetch('/api/webhooks/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: currentStatus === 'active' ? 'paused' : 'active' }),
      })
      await fetchEndpoints()
    } catch {}
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Webhook size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Webhooks</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Real-time events for every platform action</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all" style={{ background: '#A78BFA', color: '#070707' }}>
              <Plus size={14} /> New Endpoint
            </button>
          </div>

          {showCreate && (
            <div className="rounded-lg p-5 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>New Webhook Endpoint</h2>
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://your-app.com/webhook" className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none mb-3" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none mb-4" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
              <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Subscribe to events:</p>
              <div className="grid grid-cols-4 gap-2 mb-4 max-h-[200px] overflow-y-auto">
                {events.map(event => (
                  <label key={event} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[10px] font-sans transition-all" style={{ background: form.selectedEvents.includes(event) ? '#A78BFA20' : '#070707', color: form.selectedEvents.includes(event) ? '#A78BFA' : '#6b6b6b', border: `1px solid ${form.selectedEvents.includes(event) ? '#A78BFA40' : '#2a2a2a'}` }}>
                    <input type="checkbox" checked={form.selectedEvents.includes(event)} onChange={() => toggleEvent(event)} className="hidden" />
                    {event}
                  </label>
                ))}
              </div>
              <button onClick={createEndpoint} disabled={creating || !form.url || form.selectedEvents.length === 0} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}>
                {creating ? <Loader2 className="animate-spin inline" size={14} /> : 'Create Endpoint'}
              </button>
            </div>
          )}

          {showSecret && (
            <div className="rounded-lg p-4 mb-6 flex items-center justify-between" style={{ background: '#166534', border: '1px solid #22c55e40' }}>
              <div>
                <span className="text-xs font-sans flex items-center gap-2" style={{ color: '#4ade80' }}><CheckCircle size={12} /> Endpoint created — signing secret:</span>
                <code className="text-[10px] font-mono mt-1 block" style={{ color: '#F0EBE1' }}>{showSecret}</code>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(showSecret); setShowSecret(null) }} className="p-2 rounded-lg" style={{ background: '#166534' }}>
                <Copy size={14} style={{ color: '#4ade80' }} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: '#A78BFA' }} /></div>
          ) : endpoints.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No webhook endpoints yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {endpoints.map((ep, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {ep.status === 'active' ? <CheckCircle size={14} style={{ color: '#4ade80' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                      <div>
                        <div className="text-sm font-sans flex items-center gap-2" style={{ color: '#F0EBE1' }}>
                          {ep.description || 'Webhook Endpoint'}
                          <code className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#070707', color: '#6b6b6b' }}>{ep.url}</code>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>{(ep.events as string[])?.length || 0} events</span>
                          {ep.last_sent_at && <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>· Last: {new Date(ep.last_sent_at).toLocaleString()}</span>}
                          {ep.last_status && <span className="text-[10px] font-sans" style={{ color: ep.last_status < 400 ? '#4ade80' : '#ef4444' }}>· HTTP {ep.last_status}</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => toggleEndpoint(ep.id, ep.status)} className="px-3 py-1.5 rounded-lg text-[10px] font-sans" style={{ background: '#2a2a2a', color: '#a1a1aa' }}>
                      {ep.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(ep.events as string[])?.map((ev: string, j: number) => (
                      <span key={j} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: '#070707', color: '#a1a1aa' }}>{ev}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
