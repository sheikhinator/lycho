'use client'

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, Flame, Target, AlertTriangle, Star } from 'lucide-react'

interface AgentStat {
  id: string
  name: string
  agent_type: string
  status: string
  total_conversations: number
  hot_leads: number
  avg_lead_score: number
  escalations: number
  escalation_rate: number
  top_channels: string[]
}

interface Summary {
  total_conversations: number
  hot_leads: number
  avg_lead_score: number
  escalation_rate: number
}

interface DayVolume { date: string; count: number }
interface Channel { name: string; value: number }

const GOLD = '#C9A84C'
const PIE_COLORS = ['#C9A84C', '#7a6130', '#4ade80', '#60a5fa', '#f87171', '#fbbf24']

const PERIODS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function KPICard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.1)' }}>
          <Icon size={16} style={{ color: GOLD }} />
        </div>
        <span className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>{label}</span>
      </div>
      <p className="font-bebas text-3xl tracking-wide" style={{ color: '#F0EBE1' }}>{value}</p>
      {sub && <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<AgentStat[]>([])
  const [summary, setSummary] = useState<Summary>({ total_conversations: 0, hot_leads: 0, avg_lead_score: 0, escalation_rate: 0 })
  const [dailyVolume, setDailyVolume] = useState<DayVolume[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [topAgent, setTopAgent] = useState<AgentStat | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics/agents?days=${days}`)
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setAgents(j.data.agents ?? [])
          setSummary(j.data.summary ?? {})
          setDailyVolume(j.data.daily_volume ?? [])
          setChannels(j.data.channels ?? [])
          setTopAgent(j.data.top_agent ?? null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-bebas text-4xl tracking-[0.1em]" style={{ color: GOLD }}>
            ANALYTICS
          </h1>
          <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>
            Agent performance and conversation intelligence
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className="px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all"
              style={{
                background: days === p.days ? GOLD : '#1c1c1c',
                color: days === p.days ? '#070707' : '#6b6b6b',
                border: `1px solid ${days === p.days ? GOLD : '#2a2a2a'}`,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />
            ))}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard icon={TrendingUp} label="Total Conversations" value={summary.total_conversations.toLocaleString()} />
            <KPICard icon={Flame}      label="Hot Leads"           value={summary.hot_leads.toLocaleString()} sub="Score ≥ 85" />
            <KPICard icon={Target}     label="Avg Lead Score"      value={`${summary.avg_lead_score}/100`} />
            <KPICard icon={AlertTriangle} label="Escalation Rate"  value={`${summary.escalation_rate}%`} />
          </div>

          {/* Top Agent Card */}
          {topAgent && (
            <div
              className="rounded-xl p-5 mb-8 flex items-center gap-4"
              style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid ${GOLD}40` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(201,168,76,0.12)' }}>
                <Star size={18} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs font-sans uppercase tracking-widest mb-0.5" style={{ color: GOLD }}>Top Performing Agent</p>
                <p className="text-sm font-sans font-semibold" style={{ color: '#F0EBE1' }}>{topAgent.name}</p>
                <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                  {topAgent.total_conversations} conversations · {topAgent.hot_leads} hot leads · avg score {topAgent.avg_lead_score}
                </p>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Line chart — conversation volume */}
            <div className="lg:col-span-2 rounded-xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <p className="text-xs font-sans uppercase tracking-widest mb-5" style={{ color: GOLD }}>Conversation Volume</p>
              {dailyVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyVolume} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b6b6b', fontSize: 10 }}
                      tickFormatter={d => d.slice(5)}
                      interval={Math.floor(dailyVolume.length / 6)}
                    />
                    <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 8, color: '#F0EBE1', fontSize: 12 }}
                      labelStyle={{ color: GOLD }}
                    />
                    <Line type="monotone" dataKey="count" stroke={GOLD} strokeWidth={2} dot={false} name="Conversations" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>No conversation data yet</p>
                </div>
              )}
            </div>

            {/* Pie chart — channels */}
            <div className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <p className="text-xs font-sans uppercase tracking-widest mb-5" style={{ color: GOLD }}>Top Channels</p>
              {channels.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={channels} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {channels.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: 8, color: '#F0EBE1', fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#6b6b6b' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>No channel data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Agent performance table */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <p className="text-xs font-sans uppercase tracking-widest" style={{ color: GOLD }}>Agent Performance</p>
            </div>
            {agents.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No agents deployed yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                      {['Agent', 'Conversations', 'Hot Leads', 'Avg Score', 'Escalations', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map(a => (
                      <tr key={a.id} style={{ borderBottom: '1px solid #1c1c1c' }}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{a.name}</p>
                          <p className="text-xs font-sans capitalize" style={{ color: '#6b6b6b' }}>{a.agent_type.replace(/_/g, ' ')}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-sans" style={{ color: '#F0EBE1' }}>{a.total_conversations}</td>
                        <td className="px-4 py-3 text-sm font-sans" style={{ color: a.hot_leads > 0 ? '#f97316' : '#6b6b6b' }}>{a.hot_leads}</td>
                        <td className="px-4 py-3 text-sm font-sans" style={{ color: '#F0EBE1' }}>{a.avg_lead_score}/100</td>
                        <td className="px-4 py-3 text-sm font-sans" style={{ color: a.escalation_rate > 20 ? '#f87171' : '#6b6b6b' }}>
                          {a.escalations} ({a.escalation_rate}%)
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-sans px-2 py-0.5 rounded capitalize"
                            style={{
                              background: a.status === 'active' ? 'rgba(74,222,128,0.1)' : 'rgba(107,107,107,0.1)',
                              color: a.status === 'active' ? '#4ade80' : '#6b6b6b',
                              border: `1px solid ${a.status === 'active' ? 'rgba(74,222,128,0.2)' : '#2a2a2a'}`,
                            }}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
