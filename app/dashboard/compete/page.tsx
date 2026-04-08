'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { TrendingUp, Loader2 } from 'lucide-react'

export default function CompetePage() {
  const [brief, setBrief]     = useState('')
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    fetch('/api/compete/brief')
      .then(r => r.json())
      .then(d => { if (d.brief) setBrief(d.brief) })
      .catch(() => {})
      .finally(() => setChecked(true))
  }, [])

  async function generateBrief() {
    setLoading(true)
    try {
      const res  = await fetch('/api/compete/brief', { method: 'POST' })
      const data = await res.json()
      setBrief(data.brief || '')
    } catch {}
    setLoading(false)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp size={22} style={{ color: '#C9A84C' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Compete</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Real-time competitor intelligence via live web search</p>
              </div>
            </div>
            {checked && !brief && (
              <button
                onClick={generateBrief}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
                style={{ background: loading ? '#2a2a2a' : '#C9A84C', color: loading ? '#6b6b6b' : '#070707' }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                {loading ? 'Researching…' : 'Generate Brief'}
              </button>
            )}
          </div>

          {!checked && (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={20} className="animate-spin" style={{ color: '#C9A84C' }} />
            </div>
          )}

          {checked && !brief && !loading && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl"
              style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <TrendingUp size={40} className="mb-4 opacity-20" style={{ color: '#C9A84C' }} />
              <p className="text-sm font-sans mb-1" style={{ color: '#F0EBE1' }}>No brief yet</p>
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Click Generate Brief to research your competitive landscape</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 rounded-xl"
              style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.2)' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: '#C9A84C' }} />
              <span className="text-sm font-sans" style={{ color: '#C9A84C' }}>Searching live web for competitor intelligence…</span>
            </div>
          )}

          {brief && (
            <div className="rounded-xl p-6" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="text-xs font-sans font-bold tracking-widest mb-4" style={{ color: '#C9A84C' }}>
                ⚡ INTELLIGENCE BRIEF
              </div>
              <div className="text-sm font-sans whitespace-pre-wrap" style={{ color: '#F0EBE1', lineHeight: 1.8 }}>
                {brief}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
