'use client'

import { useEffect, useState } from 'react'

export function InsightCard() {
  const [insight, setInsight] = useState('')

  useEffect(() => {
    fetch('/api/predict/insight')
      .then(r => r.json())
      .then(d => { if (d.insight) setInsight(d.insight) })
      .catch(() => {})
  }, [])

  if (!insight) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1500, #0d0d0d)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderLeft: '3px solid #C9A84C',
      borderRadius: 8,
      padding: '16px 20px',
    }}>
      <div className="text-xs font-sans font-bold tracking-widest mb-2" style={{ color: '#C9A84C' }}>
        ⚡ INTELLIGENCE BRIEF
      </div>
      <div className="text-sm font-sans" style={{ color: '#F0EBE1', lineHeight: 1.6 }}>
        {insight}
      </div>
    </div>
  )
}
