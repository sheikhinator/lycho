'use client'
import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Brain, Loader2, MessageSquare, Vote, CheckCircle, AlertTriangle } from 'lucide-react'

export default function SwarmCouncilPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function conveneCouncil() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/swarm/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const consensusColor = (c: string) => {
    switch (c) {
      case 'unanimous': return '#4ade80'
      case 'majority': return '#fbbf24'
      case 'split': return '#fb923c'
      case 'deadlock': return '#ef4444'
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
              <Brain size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Swarm Council</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Multi-agent collaboration — specialist agents debate and solve complex problems together</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Pose a complex business question for the council..."
              className="w-full bg-transparent text-sm font-sans outline-none resize-none min-h-[100px]"
              style={{ color: '#F0EBE1' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) conveneCouncil() }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Cmd+Enter to convene</span>
              <button
                onClick={conveneCouncil}
                disabled={loading || !query.trim()}
                className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all"
                style={{ background: loading ? '#2a2a2a' : '#A78BFA', color: loading ? '#6b6b6b' : '#070707', opacity: !query.trim() ? 0.5 : 1 }}
              >
                {loading ? <Loader2 className="animate-spin inline" size={14} /> : 'Convene Council'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg p-4 mb-4 flex items-center gap-2" style={{ background: '#450a0a', border: '1px solid #7f1d1d' }}>
              <AlertTriangle size={14} style={{ color: '#ef4444' }} />
              <span className="text-xs font-sans" style={{ color: '#fca5a5' }}>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {result.consensus && (
                <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: '#1c1c1c', border: `1px solid ${consensusColor(result.consensus)}40` }}>
                  {result.consensus === 'unanimous' ? <CheckCircle size={18} style={{ color: consensusColor(result.consensus) }} /> :
                   result.consensus === 'deadlock' ? <AlertTriangle size={18} style={{ color: consensusColor(result.consensus) }} /> :
                   <Vote size={18} style={{ color: consensusColor(result.consensus) }} />}
                  <div>
                    <span className="text-xs uppercase tracking-widest font-sans" style={{ color: consensusColor(result.consensus) }}>{result.consensus} consensus</span>
                    <span className="text-xs font-sans ml-3" style={{ color: '#6b6b6b' }}>{result.confidence}% confidence · {result.members?.length} members · {(result.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )}

              {result.synthesis && (
                <div className="rounded-lg p-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <h2 className="text-sm font-sans uppercase tracking-widest mb-3" style={{ color: '#A78BFA' }}>Synthesis</h2>
                  <p className="text-sm font-sans leading-relaxed whitespace-pre-wrap" style={{ color: '#F0EBE1' }}>{result.synthesis}</p>
                </div>
              )}

              {result.members && (
                <div>
                  <h2 className="text-sm font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>Council Members</h2>
                  <div className="grid gap-3">
                    {result.members.map((m: any, i: number) => (
                      <div key={i} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={14} style={{ color: '#A78BFA' }} />
                            <span className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{m.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded font-sans" style={{
                              background: m.vote === 'approve' ? '#166534' : m.vote === 'reject' ? '#7f1d1d' : '#3f3f46',
                              color: m.vote === 'approve' ? '#4ade80' : m.vote === 'reject' ? '#ef4444' : '#a1a1aa',
                            }}>
                              {m.vote}
                            </span>
                            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{m.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-xs font-sans leading-relaxed" style={{ color: '#a1a1aa' }}>{m.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #A78BFA40' }}>
                  <h2 className="text-sm font-sans uppercase tracking-widest mb-3" style={{ color: '#A78BFA' }}>Recommendations</h2>
                  <ul className="space-y-2">
                    {result.recommendations.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-sans" style={{ color: '#F0EBE1' }}>
                        <span style={{ color: '#A78BFA' }}>→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
