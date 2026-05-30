'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Workflow, Plus, Loader2, Play, Pause, Settings } from 'lucide-react'

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', trigger: 'manual' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchWorkflows() }, [])

  async function fetchWorkflows() {
    setLoading(true)
    try {
      const res = await fetch('/api/nexus/build')
      const data = await res.json()
      setWorkflows(data.workflows || [])
    } catch {} finally { setLoading(false) }
  }

  async function createWorkflow() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await fetch('/api/nexus/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          trigger: form.trigger,
          steps: [],
          variables: [],
        }),
      })
      setShowCreate(false)
      setForm({ name: '', description: '', trigger: 'manual' })
      await fetchWorkflows()
    } catch {} finally { setCreating(false) }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return '#4ade80'
      case 'paused': return '#fbbf24'
      case 'draft': return '#6b6b6b'
      default: return '#6b6b6b'
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Workflow size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Workflows</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Advanced workflow builder with loops, branching, conditions, and sub-workflows</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all" style={{ background: '#A78BFA', color: '#070707' }}>
              <Plus size={14} /> New Workflow
            </button>
          </div>

          {showCreate && (
            <div className="rounded-lg p-5 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>New Workflow</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Workflow name" className="px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} className="px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }}>
                  <option value="manual">Manual</option>
                  <option value="conversation.created">Conversation Created</option>
                  <option value="conversation.message">New Message</option>
                  <option value="schedule.daily">Daily Schedule</option>
                  <option value="lead.hot_detected">Hot Lead Detected</option>
                </select>
              </div>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none mb-3" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
              <button onClick={createWorkflow} disabled={creating || !form.name.trim()} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}>
                {creating ? <Loader2 className="animate-spin inline" size={14} /> : 'Create'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: '#A78BFA' }} /></div>
          ) : workflows.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No workflows yet. Create one to automate your agent workflows.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((w, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{ color: statusColor(w.status) }}>
                        {w.status === 'active' ? <Play size={14} /> : w.status === 'paused' ? <Pause size={14} /> : <Settings size={14} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{w.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-sans" style={{ background: '#3f3f46', color: statusColor(w.status) }}>{w.status}</span>
                          <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>v{w.version} · {w.trigger} · {(w.steps as any[])?.length || 0} steps</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>{new Date(w.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>Available Step Types</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { type: 'agent_chat', desc: 'Route to any LYCHO agent' },
                { type: 'condition', desc: 'If/else logic on variables' },
                { type: 'loop', desc: 'Iterate over arrays' },
                { type: 'branch', desc: 'Multi-branch execution paths' },
                { type: 'sub_workflow', desc: 'Call another workflow' },
                { type: 'webhook', desc: 'Call external APIs' },
                { type: 'delay', desc: 'Wait N seconds' },
                { type: 'llm_action', desc: 'Free-form LLM prompt' },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-lg text-center" style={{ background: '#070707' }}>
                  <div className="text-[10px] font-mono mb-1" style={{ color: '#A78BFA' }}>{s.type}</div>
                  <div className="text-[9px] font-sans" style={{ color: '#6b6b6b' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
