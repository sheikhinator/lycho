'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Activity, Shield, Loader2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function HealPage() {
  const [scan, setScan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState<string | null>(null)

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/heal/status')
      const data = await res.json()
      setScan(data)
    } catch {} finally { setLoading(false) }
  }

  async function recoverAgent(agentType: string) {
    setRecovering(agentType)
    try {
      await fetch('/api/heal/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType }),
      })
      await fetchStatus()
    } catch {} finally { setRecovering(null) }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'healthy': return '#4ade80'
      case 'degraded': return '#fbbf24'
      case 'failing': return '#ef4444'
      default: return '#6b6b6b'
    }
  }

  const statusBg = (s: string) => {
    switch (s) {
      case 'healthy': return '#166534'
      case 'degraded': return '#92400e'
      case 'failing': return '#7f1d1d'
      default: return '#3f3f46'
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
              <Shield size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Agent Health</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Self-healing agents — auto-detect errors, degradation, and recover</p>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              className="p-2 rounded-lg transition-all"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
            >
              <RefreshCw size={16} style={{ color: '#6b6b6b' }} />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin" size={24} style={{ color: '#A78BFA' }} />
            </div>
          )}

          {!loading && scan && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Agents', value: scan.total, color: '#6b6b6b' },
                  { label: 'Healthy', value: scan.healthy, color: '#4ade80' },
                  { label: 'Degraded', value: scan.degraded, color: '#fbbf24' },
                  { label: 'Failing', value: scan.failing, color: '#ef4444' },
                ].map((stat, i) => (
                  <div key={i} className="rounded-lg p-4 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                    <div className="text-2xl font-bebas tracking-wider" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {scan.recoveries?.length > 0 && (
                  <div className="rounded-lg p-4 mb-4" style={{ background: '#1c1c1c', border: '1px solid #A78BFA40' }}>
                    <h2 className="text-sm font-sans uppercase tracking-widest mb-3" style={{ color: '#A78BFA' }}>Auto-Recovery Actions</h2>
                    {scan.recoveries.map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 py-2 text-xs font-sans" style={{ borderBottom: i < scan.recoveries.length - 1 ? '1px solid #2a2a2a' : 'none' }}>
                        <CheckCircle size={12} style={{ color: '#4ade80', marginTop: 2 }} />
                        <div>
                          <span style={{ color: '#F0EBE1' }}>{r.agentType}</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: '#3f3f46', color: '#a1a1aa' }}>{r.action}</span>
                          <p style={{ color: '#6b6b6b', marginTop: 2 }}>{r.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {scan.details?.map((agent: any, i: number) => (
                  <div key={i} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity size={14} style={{ color: statusColor(agent.status) }} />
                        <span className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{agent.displayName}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-sans" style={{
                          background: statusBg(agent.status),
                          color: statusColor(agent.status),
                        }}>{agent.status}</span>
                        <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{agent.healthScore}/100</span>
                      </div>
                      <button
                        onClick={() => recoverAgent(agent.agentType)}
                        disabled={recovering === agent.agentType}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans transition-all"
                        style={{ background: '#2a2a2a', color: '#a1a1aa' }}
                      >
                        {recovering === agent.agentType ? <Loader2 className="animate-spin inline" size={12} /> : 'Recover'}
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-3 mb-3">
                      {[
                        { label: 'Conversations', value: agent.metrics?.totalConversations },
                        { label: 'Error Rate', value: `${agent.metrics?.errorRate}%` },
                        { label: 'Avg Score', value: agent.metrics?.avgLeadScore },
                        { label: 'Satisfaction', value: `${agent.metrics?.satisfactionRate}%` },
                        { label: 'Response Time', value: `${agent.metrics?.avgResponseTime}ms` },
                      ].map((m, j) => (
                        <div key={j} className="text-center">
                          <div className="text-xs font-sans" style={{ color: '#F0EBE1' }}>{m.value}</div>
                          <div className="text-[10px] font-sans" style={{ color: '#6b6b6b' }}>{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {agent.issues?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {agent.issues.map((issue: string, j: number) => (
                          <span key={j} className="text-[10px] px-2 py-0.5 rounded font-sans flex items-center gap-1" style={{ background: '#7f1d1d', color: '#fca5a5' }}>
                            <AlertTriangle size={10} />
                            {issue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
