'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Sparkles, Loader2 } from 'lucide-react'

export default function OraclePage() {
  const [predictions, setPredictions] = useState<{ insight: string; recommendation: string; confidence: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/oracle')
      .then(r => r.json())
      .then(d => { if (d.predictions) setPredictions(d.predictions) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Oracle</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>AI-powered predictions and insights for your business</p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin" size={24} style={{ color: '#A78BFA' }} />
            </div>
          )}

          {!loading && predictions.length === 0 && (
            <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No predictions available yet. Ensure you have tenant data and try again.</p>
            </div>
          )}

          <div className="grid gap-4">
            {predictions.map((p, i) => (
              <div key={i} className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-sans uppercase tracking-widest px-2 py-0.5 rounded" style={{
                    background: p.confidence === 'high' ? '#166534' : p.confidence === 'medium' ? '#92400e' : '#3f3f46',
                    color: p.confidence === 'high' ? '#4ade80' : p.confidence === 'medium' ? '#fbbf24' : '#a1a1aa',
                  }}>
                    {p.confidence} confidence
                  </span>
                </div>
                <p className="text-sm font-sans mb-1" style={{ color: '#F0EBE1' }}>{p.insight}</p>
                {p.recommendation && (
                  <p className="text-xs font-sans" style={{ color: '#A78BFA' }}>→ {p.recommendation}</p>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
