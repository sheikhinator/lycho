'use client'
import { useEffect, useState } from 'react'

export default function EconomyPage() {
  const [stats, setStats] = useState<any>({ transactions: [], wallets: [], totalVolume: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/economy').then(r => r.json()).then(d => { setStats(d); setLoading(false) })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 4px', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2 }}>LYCHO ECONOMY</h1>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 32 }}>Agent marketplace economy — transactions, wallets, value flow</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Volume', value: `PKR ${(stats.totalVolume || 0).toLocaleString()}`, color: '#C9A84C' },
            { label: 'Transactions', value: stats.transactions?.length || 0, color: '#4ade80' },
            { label: 'Active Agents', value: stats.wallets?.length || 0, color: '#60a5fa' }
          ].map(s => (
            <div key={s.label} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24, textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: 24, fontWeight: 700, fontFamily: 'Bebas Neue, sans-serif' }}>{s.value}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
            <div style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>TOP EARNING AGENTS</div>
            {stats.wallets?.length === 0 && <div style={{ color: '#444', fontSize: 13 }}>No wallet data yet</div>}
            {stats.wallets?.map((w: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111' }}>
                <span style={{ color: '#aaa', fontSize: 13 }}>{w.agent_type}</span>
                <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 600 }}>PKR {(w.total_earned_pkr || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
            <div style={{ color: '#C9A84C', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>RECENT TRANSACTIONS</div>
            {stats.transactions?.length === 0 && <div style={{ color: '#444', fontSize: 13 }}>No transactions yet</div>}
            {stats.transactions?.slice(0, 8).map((t: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111' }}>
                <div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>{t.from_agent} &rarr; {t.to_agent}</div>
                  <div style={{ color: '#555', fontSize: 11 }}>{t.description?.slice(0, 30)}</div>
                </div>
                <span style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600 }}>PKR {t.amount_pkr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
