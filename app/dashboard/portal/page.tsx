'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Globe, Plus, Loader2, Copy, ExternalLink } from 'lucide-react'

export default function PortalPage() {
  const [portals, setPortals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', subdomain: '', agents: '' })
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => { fetchPortals() }, [])

  async function fetchPortals() {
    setLoading(true)
    try {
      const res = await fetch('/api/portal')
      const data = await res.json()
      setPortals(data.portals || [])
    } catch {} finally { setLoading(false) }
  }

  async function createPortal() {
    if (!form.name.trim() || !form.subdomain.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          subdomain: form.subdomain.replace(/[^a-z0-9-]/g, '').toLowerCase(),
          agentTypes: form.agents.split(',').map(s => s.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setForm({ name: '', subdomain: '', agents: '' })
        await fetchPortals()
      }
    } catch {} finally { setCreating(false) }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Globe size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Customer Portal</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>White-label portals — give your customers access to agents under your brand</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all"
              style={{ background: '#A78BFA', color: '#070707' }}
            >
              <Plus size={14} />
              New Portal
            </button>
          </div>

          {showCreate && (
            <div className="rounded-lg p-6 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <h2 className="text-sm font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>Create Portal</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Portal Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Customer Portal" className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                </div>
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Subdomain</label>
                  <div className="flex items-center gap-2">
                    <input value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.replace(/[^a-z0-9-]/g, '').toLowerCase() })} placeholder="mycompany" className="flex-1 px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                    <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>.lycho.app</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Agents (comma-separated agent types)</label>
                <input value={form.agents} onChange={e => setForm({ ...form, agents: e.target.value })} placeholder="lead_qualifier, sales_closer, support" className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
              </div>
              <button onClick={createPortal} disabled={creating || !form.name.trim() || !form.subdomain.trim()} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all" style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}>
                {creating ? <Loader2 className="animate-spin inline" size={14} /> : 'Create Portal'}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: '#A78BFA' }} /></div>
            ) : portals.length === 0 ? (
              <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No portals yet. Create one to offer LYCHO agents under your brand.</p>
              </div>
            ) : portals.map((portal, i) => (
              <div key={i} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{portal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] font-mono" style={{ color: '#A78BFA' }}>{portal.subdomain}.lycho.app</code>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-sans" style={{
                        background: portal.active ? '#166534' : '#3f3f46',
                        color: portal.active ? '#4ade80' : '#a1a1aa',
                      }}>{portal.active ? 'active' : 'inactive'}</span>
                    </div>
                    <p className="text-[10px] font-sans mt-1" style={{ color: '#6b6b6b' }}>
                      {portal.agent_count || 0} agents · {portal.visitor_count || 0} visitors · Created {new Date(portal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(`https://${portal.subdomain}.lycho.app`); setCopied(portal.id); setTimeout(() => setCopied(''), 2000); }} className="p-2 rounded-lg transition-all" style={{ background: '#2a2a2a' }}>
                      {copied === portal.id ? <Copy size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} style={{ color: '#6b6b6b' }} />}
                    </button>
                    <a href={`https://${portal.subdomain}.lycho.app`} target="_blank" rel="noreferrer" className="p-2 rounded-lg transition-all" style={{ background: '#2a2a2a' }}>
                      <ExternalLink size={14} style={{ color: '#6b6b6b' }} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
