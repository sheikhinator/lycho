'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { FlaskConical, Plus, Loader2, Play, CheckCircle, XCircle } from 'lucide-react'

export default function ABTestingPage() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', agent_type: '', metric: 'lead_score', min_sample_size: 50, variant1Label: 'Control', variant1Prompt: '', variant1Traffic: 50, variant2Label: 'Variant', variant2Prompt: '', variant2Traffic: 50 })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchTests() }, [])

  async function fetchTests() {
    setLoading(true)
    try {
      const res = await fetch('/api/abtesting')
      const data = await res.json()
      setTests(data.tests || [])
    } catch {} finally { setLoading(false) }
  }

  async function createTest() {
    if (!form.name.trim() || !form.agent_type || !form.variant1Prompt || !form.variant2Prompt) return
    setCreating(true)
    try {
      const res = await fetch('/api/abtesting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          agent_type: form.agent_type,
          metric: form.metric,
          min_sample_size: form.min_sample_size,
          variants: [
            { label: form.variant1Label, system_prompt: form.variant1Prompt, traffic_percentage: form.variant1Traffic },
            { label: form.variant2Label, system_prompt: form.variant2Prompt, traffic_percentage: form.variant2Traffic },
          ],
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setForm({ name: '', description: '', agent_type: '', metric: 'lead_score', min_sample_size: 50, variant1Label: 'Control', variant1Prompt: '', variant1Traffic: 50, variant2Label: 'Variant', variant2Prompt: '', variant2Traffic: 50 })
        await fetchTests()
      }
    } catch {} finally { setCreating(false) }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return '#4ade80'
      case 'running': return '#fbbf24'
      case 'draft': return '#6b6b6b'
      case 'paused': return '#fb923c'
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
              <FlaskConical size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>A/B Testing</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Test prompts, models, and configurations side by side</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all" style={{ background: '#A78BFA', color: '#070707' }}>
              <Plus size={14} /> New Test
            </button>
          </div>

          {showCreate && (
            <div className="rounded-lg p-5 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>New A/B Test</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Test name" className="px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                <input value={form.agent_type} onChange={e => setForm({ ...form, agent_type: e.target.value })} placeholder="Agent type (e.g. lead_qualifier)" className="px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ background: '#070707', border: '1px solid #2a2a2a' }}>
                  <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Control</p>
                  <input value={form.variant1Label} onChange={e => setForm({ ...form, variant1Label: e.target.value })} placeholder="Label" className="w-full px-2 py-1.5 rounded text-[10px] font-sans outline-none mb-2" style={{ background: '#1c1c1c', color: '#F0EBE1' }} />
                  <textarea value={form.variant1Prompt} onChange={e => setForm({ ...form, variant1Prompt: e.target.value })} placeholder="System prompt..." className="w-full px-2 py-1.5 rounded text-[10px] font-sans outline-none resize-none min-h-[100px]" style={{ background: '#1c1c1c', color: '#F0EBE1' }} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>Traffic:</span>
                    <input value={form.variant1Traffic} onChange={e => setForm({ ...form, variant1Traffic: parseInt(e.target.value) || 0 })} type="range" min={0} max={100} className="flex-1" />
                    <span className="text-[10px] font-sans" style={{ color: '#A78BFA' }}>{form.variant1Traffic}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#070707', border: '1px solid #2a2a2a' }}>
                  <p className="text-[10px] font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Variant</p>
                  <input value={form.variant2Label} onChange={e => setForm({ ...form, variant2Label: e.target.value })} placeholder="Label" className="w-full px-2 py-1.5 rounded text-[10px] font-sans outline-none mb-2" style={{ background: '#1c1c1c', color: '#F0EBE1' }} />
                  <textarea value={form.variant2Prompt} onChange={e => setForm({ ...form, variant2Prompt: e.target.value })} placeholder="System prompt..." className="w-full px-2 py-1.5 rounded text-[10px] font-sans outline-none resize-none min-h-[100px]" style={{ background: '#1c1c1c', color: '#F0EBE1' }} />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>Traffic:</span>
                    <input value={form.variant2Traffic} onChange={e => setForm({ ...form, variant2Traffic: parseInt(e.target.value) || 0 })} type="range" min={0} max={100} className="flex-1" />
                    <span className="text-[10px] font-sans" style={{ color: '#A78BFA' }}>{form.variant2Traffic}%</span>
                  </div>
                </div>
              </div>
              <button onClick={createTest} disabled={creating || !form.name.trim() || !form.agent_type} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}>
                {creating ? <Loader2 className="animate-spin inline" size={14} /> : 'Create Test'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: '#A78BFA' }} /></div>
          ) : tests.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No A/B tests yet. Create one to optimize your agent prompts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test, i) => (
                <div key={i} className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ color: statusColor(test.status) }}>
                        {test.status === 'completed' ? <CheckCircle size={16} /> : test.status === 'running' ? <Play size={16} /> : <FlaskConical size={16} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{test.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-sans" style={{ background: '#3f3f46', color: statusColor(test.status) }}>{test.status}</span>
                          <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>{test.agent_type} · {test.metric} · min {test.min_sample_size} samples</span>
                        </div>
                      </div>
                    </div>
                    {test.winner && (
                      <span className="text-[10px] px-2 py-1 rounded font-sans" style={{ background: '#166534', color: '#4ade80' }}>Winner: {test.winner}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(test.variants || []).map((v: any, j: number) => (
                      <div key={j} className="p-3 rounded-lg" style={{ background: '#070707', border: `1px solid ${test.winner === v.label ? '#4ade8040' : '#2a2a2a'}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-sans" style={{ color: test.winner === v.label ? '#4ade80' : '#F0EBE1' }}>{v.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>{v.traffic_percentage}% traffic</span>
                            <span className="text-xs font-sans" style={{ color: '#A78BFA' }}>{v.results?.avg_score || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-sans" style={{ color: '#6b6b6b' }}>
                          <span>{v.results?.conversations || 0} conversations</span>
                          <span>Total: {v.results?.total_score || 0}</span>
                        </div>
                      </div>
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
