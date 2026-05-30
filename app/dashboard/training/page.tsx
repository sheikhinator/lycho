'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { GraduationCap, Plus, Loader2, Beaker, CheckCircle } from 'lucide-react'

export default function TrainingPage() {
  const [examples, setExamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentType, setAgentType] = useState('')
  const [form, setForm] = useState({ user_message: '', ideal_response: '', rationale: '', category: 'custom' })
  const [adding, setAdding] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [testMessages, setTestMessages] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])
  const [testing, setTesting] = useState(false)
  const [agents, setAgents] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => {
      if (d.agents) setAgents(d.agents.map((a: any) => a.agent_type || a.id))
    }).catch(() => {})
  }, [])

  async function fetchExamples() {
    if (!agentType) return
    setLoading(true)
    try {
      const res = await fetch(`/api/training/examples?agent_type=${agentType}`)
      const data = await res.json()
      setExamples(data.examples || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { if (agentType) fetchExamples() }, [agentType])

  async function addExample() {
    if (!form.user_message || !form.ideal_response) return
    setAdding(true)
    try {
      await fetch('/api/training/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agent_type: agentType }),
      })
      setForm({ user_message: '', ideal_response: '', rationale: '', category: 'custom' })
      await fetchExamples()
    } catch {} finally { setAdding(false) }
  }

  async function optimize() {
    if (!agentType) return
    setOptimizing(true)
    setOptimizationResult(null)
    try {
      const res = await fetch('/api/training/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize', agentType }),
      })
      const data = await res.json()
      setOptimizationResult(data)
    } catch {} finally { setOptimizing(false) }
  }

  async function runTest() {
    if (!agentType || !testMessages) return
    setTesting(true)
    setTestResults([])
    try {
      const msgs = testMessages.split('\n').filter(Boolean)
      const res = await fetch('/api/training/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', agentType, prompt: 'You are a helpful AI assistant.', testMessages: msgs }),
      })
      const data = await res.json()
      setTestResults(data.results || [])
    } catch {} finally { setTesting(false) }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <GraduationCap size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Training Studio</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Few-shot training, prompt optimization, and testing</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Select Agent</label>
            <select value={agentType} onChange={e => setAgentType(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-sans outline-none w-full max-w-xs" style={{ background: '#1c1c1c', color: '#F0EBE1', border: '1px solid #2a2a2a' }}>
              <option value="">Choose an agent...</option>
              {agents.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {agentType && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>Add Training Example</h2>
                  <div className="space-y-3">
                    <input value={form.user_message} onChange={e => setForm({ ...form, user_message: e.target.value })} placeholder="User message..." className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                    <textarea value={form.ideal_response} onChange={e => setForm({ ...form, ideal_response: e.target.value })} placeholder="Ideal response..." className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none resize-none min-h-[80px]" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                    <div className="flex gap-2">
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }}>
                        <option value="greeting">Greeting</option><option value="question">Question</option><option value="objection">Objection</option><option value="closing">Closing</option><option value="support">Support</option><option value="custom">Custom</option>
                      </select>
                      <button onClick={addExample} disabled={adding || !form.user_message || !form.ideal_response} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: adding ? '#2a2a2a' : '#A78BFA', color: adding ? '#6b6b6b' : '#070707' }}>
                        {adding ? <Loader2 className="animate-spin inline" size={14} /> : 'Add Example'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-sans uppercase tracking-widest" style={{ color: '#A78BFA' }}>Optimize Prompt</h2>
                    <button onClick={optimize} disabled={optimizing} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: optimizing ? '#2a2a2a' : '#A78BFA', color: optimizing ? '#6b6b6b' : '#070707' }}>
                      {optimizing ? <Loader2 className="animate-spin inline" size={14} /> : 'Optimize'}
                    </button>
                  </div>
                  {optimizationResult && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={14} style={{ color: '#4ade80' }} />
                        <span className="text-xs font-sans" style={{ color: '#4ade80' }}>Improved by {optimizationResult.improvement_score} points (v{optimizationResult.version})</span>
                      </div>
                      <p className="text-[10px] font-sans mb-2" style={{ color: '#6b6b6b' }}>Changes made:</p>
                      <ul className="space-y-1">
                        {optimizationResult.changes?.map((c: string, i: number) => (
                          <li key={i} className="text-[10px] font-sans" style={{ color: '#a1a1aa' }}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>Test Messages</h2>
                  <textarea value={testMessages} onChange={e => setTestMessages(e.target.value)} placeholder="One message per line..." className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none resize-none min-h-[80px] mb-3" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                  <button onClick={runTest} disabled={testing || !testMessages} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: testing ? '#2a2a2a' : '#A78BFA', color: testing ? '#6b6b6b' : '#070707' }}>
                    {testing ? <Loader2 className="animate-spin inline" size={14} /> : 'Run Test'}
                  </button>
                  {testResults.map((r, i) => (
                    <div key={i} className="mt-3 p-3 rounded-lg" style={{ background: '#070707' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>Test {i + 1}</span>
                        <span className="text-[10px] font-sans" style={{ color: r.score >= 70 ? '#4ade80' : '#ef4444' }}>Score: {r.score}</span>
                      </div>
                      <p className="text-[10px] font-sans" style={{ color: '#a1a1aa' }}>{r.message}</p>
                      <p className="text-[10px] font-sans mt-1" style={{ color: '#F0EBE1' }}>{r.response}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-sans uppercase tracking-widest" style={{ color: '#A78BFA' }}>Training Examples ({examples.length})</h2>
                  <Beaker size={14} style={{ color: '#6b6b6b' }} />
                </div>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={16} style={{ color: '#A78BFA' }} /></div>
                ) : examples.length === 0 ? (
                  <p className="text-xs font-sans text-center py-8" style={{ color: '#6b6b6b' }}>No examples yet. Add training data to improve this agent.</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {examples.map((ex, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ background: '#070707' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-sans" style={{ background: '#3f3f46', color: '#a1a1aa' }}>{ex.category}</span>
                          <span className="text-[10px] font-sans" style={{ color: ex.quality_score >= 75 ? '#4ade80' : '#fbbf24' }}>{ex.quality_score}/100</span>
                        </div>
                        <p className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>User: <span style={{ color: '#F0EBE1' }}>{ex.user_message}</span></p>
                        <p className="text-[10px] font-sans mt-1" style={{ color: '#6b6b6b' }}>Ideal: <span style={{ color: '#4ade80' }}>{ex.ideal_response}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
