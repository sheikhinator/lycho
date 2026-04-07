'use client'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Eye, Loader2 } from 'lucide-react'

interface AgentStat {
  agent_id: string; display_name: string; agent_type: string
  total_conversations: number; avg_lead_score: number
  escalation_rate: number; satisfaction_rate: number
  estimated_cost_pkr: number; estimated_value_pkr: number; roi: number
}
interface Totals {
  total_conversations: number; avg_lead_score: number
  total_cost_pkr: number; total_value_pkr: number
}

export default function ObservePage() {
  const [agents, setAgents]   = useState<AgentStat[]>([])
  const [totals, setTotals]   = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/agents')
      .then(r => r.json())
      .then(d => { setAgents(d.agents ?? []); setTotals(d.totals ?? null) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Eye size={22} style={{ color: '#C9A84C' }} />
            <div>
              <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Observe</h1>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Last 30 days — every decision, every outcome</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={20} className="animate-spin" style={{ color: '#C9A84C' }} />
            </div>
          ) : (
            <>
              {/* KPI strip */}
              {totals && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Conversations',  value: String(totals.total_conversations),                              color: '#F0EBE1' },
                    { label: 'Avg Lead Score', value: `${totals.avg_lead_score}/100`,                                  color: '#C9A84C' },
                    { label: 'Est. Cost',      value: `PKR ${totals.total_cost_pkr.toLocaleString()}`,                 color: '#ef4444' },
                    { label: 'Est. Value',     value: `PKR ${totals.total_value_pkr.toLocaleString()}`,                color: '#4ade80' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                      <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>{s.label}</p>
                      <p className="font-bebas text-3xl tracking-wider" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ROI banner */}
              {totals && totals.total_cost_pkr > 0 && (
                <div className="flex items-center gap-3 rounded-xl px-5 py-4 mb-6"
                  style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)', borderLeft: '3px solid #4ade80' }}>
                  <span style={{ fontSize: 22 }}>📈</span>
                  <div>
                    <span className="font-bebas text-xl tracking-wider" style={{ color: '#4ade80' }}>
                      {Math.round((totals.total_value_pkr / totals.total_cost_pkr) * 10) / 10}x ROI
                    </span>
                    <span className="ml-3 text-sm font-sans" style={{ color: '#6b6b6b' }}>
                      Every PKR 1 spent generates PKR {Math.round(totals.total_value_pkr / Math.max(totals.total_cost_pkr, 1))} in estimated value
                    </span>
                  </div>
                </div>
              )}

              {/* Table */}
              {agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Eye size={40} className="mb-4 opacity-20" style={{ color: '#C9A84C' }} />
                  <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No agent activity yet. Start conversations to see intelligence.</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <h2 className="text-sm font-sans font-semibold" style={{ color: '#F0EBE1' }}>Agent Performance</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-sans" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                          {['Agent', 'Convos', 'Avg Score', 'Satisfaction', 'Escalations', 'Cost', 'Value', 'ROI'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-widest" style={{ color: '#6b6b6b' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {agents.map(a => (
                          <tr key={a.agent_id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                            <td className="px-4 py-3 font-medium" style={{ color: '#F0EBE1' }}>{a.display_name}</td>
                            <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>{a.total_conversations}</td>
                            <td className="px-4 py-3 font-semibold" style={{ color: a.avg_lead_score >= 70 ? '#4ade80' : a.avg_lead_score >= 40 ? '#C9A84C' : '#ef4444' }}>
                              {a.avg_lead_score}/100
                            </td>
                            <td className="px-4 py-3" style={{ color: '#6b6b6b' }}>{a.satisfaction_rate}%</td>
                            <td className="px-4 py-3" style={{ color: a.escalation_rate > 20 ? '#ef4444' : '#6b6b6b' }}>{a.escalation_rate}%</td>
                            <td className="px-4 py-3" style={{ color: '#ef4444' }}>PKR {a.estimated_cost_pkr}</td>
                            <td className="px-4 py-3" style={{ color: '#4ade80' }}>PKR {a.estimated_value_pkr}</td>
                            <td className="px-4 py-3 font-semibold" style={{ color: '#C9A84C' }}>{a.roi}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
