'use client'
import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Cpu, Loader2 } from 'lucide-react'

const EXAMPLES = [
  'What if I cut my prices by 20%?',
  'What if I expand to a second city?',
  'What if I hire 3 more staff?',
  'What if I launch a WhatsApp marketing campaign?',
  'What if a competitor enters my market?',
  'What if I raise prices by 15%?',
]

export default function SimulatePage() {
  const [scenario, setScenario] = useState('')
  const [result, setResult]     = useState('')
  const [loading, setLoading]   = useState(false)

  async function run() {
    if (!scenario.trim() || loading) return
    setLoading(true); setResult('')
    try {
      const res  = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario }) })
      const data = await res.json()
      setResult(data.result || 'No result returned.')
    } catch { setResult('Simulation failed. Please try again.') }
    setLoading(false)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">

          <div className="flex items-center gap-3 mb-8">
            <Cpu size={22} style={{ color: '#C9A84C' }} />
            <div>
              <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Simulate</h1>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Ask "what if" before you commit. Simulate any business decision.</p>
            </div>
          </div>

          <div className="rounded-xl p-6 mb-6" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
            <textarea
              value={scenario}
              onChange={e => setScenario(e.target.value)}
              placeholder="Describe a business scenario… e.g. What if I expand to Dubai next quarter?"
              rows={3}
              className="w-full text-sm font-sans outline-none resize-none rounded-lg px-3 py-2.5 mb-4"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
            />

            <div className="flex flex-wrap gap-2 mb-4">
              {EXAMPLES.map(s => (
                <button key={s} onClick={() => setScenario(s)}
                  className="px-3 py-1.5 rounded text-xs font-sans transition-colors"
                  style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#6b6b6b' }}>
                  {s}
                </button>
              ))}
            </div>

            <button onClick={run} disabled={loading || !scenario.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
              style={{ background: loading || !scenario.trim() ? '#2a2a2a' : '#C9A84C', color: loading || !scenario.trim() ? '#6b6b6b' : '#070707' }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Cpu size={14} />}
              {loading ? 'Simulating…' : 'Run Simulation'}
            </button>
          </div>

          {result && (
            <div className="rounded-xl p-6" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="text-xs font-sans font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>⚡ SIMULATION RESULTS</div>
              <div className="text-sm font-sans whitespace-pre-wrap" style={{ color: '#F0EBE1', lineHeight: 1.8 }}>{result}</div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
