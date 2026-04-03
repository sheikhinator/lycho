'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Star, Bug, Lightbulb, Zap, Heart, Send, Filter } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'

type FeedbackType = 'bug' | 'feature_request' | 'ux_issue' | 'performance' | 'general' | 'praise'

interface FeedbackItem {
  id: string
  type: string
  message: string
  rating: number | null
  status: string
  created_at: string
}

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: 'Bug Report', icon: <Bug size={14} />, color: '#f87171' },
  feature_request: { label: 'Feature Request', icon: <Lightbulb size={14} />, color: '#fbbf24' },
  ux_issue: { label: 'UX Issue', icon: <MessageSquare size={14} />, color: '#60a5fa' },
  performance: { label: 'Performance', icon: <Zap size={14} />, color: '#4ade80' },
  general: { label: 'General', icon: <MessageSquare size={14} />, color: '#6b6b6b' },
  praise: { label: 'Praise', icon: <Heart size={14} />, color: '#C9A84C' },
}

export default function FeedbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formType, setFormType] = useState<FeedbackType>('general')
  const [formMessage, setFormMessage] = useState('')
  const [formRating, setFormRating] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { document.title = 'Feedback — LYCHO' }, [])

  const loadFeedback = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback')
      const json = await res.json()
      if (res.ok) setFeedback(json.data ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFeedback() }, [loadFeedback])

  async function handleSubmit() {
    if (!formMessage.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formType, message: formMessage, rating: formRating }),
      })
      if (!res.ok) { toast('Failed to submit feedback', 'error'); return }
      toast('Feedback submitted — thank you!', 'success')
      setFormMessage('')
      setFormRating(null)
      setFormType('general')
      loadFeedback()
    } catch {
      toast('Network error', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = filter === 'all' ? feedback : feedback.filter(f => f.type === filter)

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10">
          <div className="mb-8">
            <p className="text-xs font-sans uppercase tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>Community</p>
            <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>Feedback</h1>
            <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>Help us improve LYCHO. Report bugs, request features, or share what you love.</p>
          </div>

          {/* Submit form */}
          <div className="rounded-xl p-6 mb-8" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
            <h2 className="text-sm font-sans font-semibold mb-4" style={{ color: '#F0EBE1' }}>Submit Feedback</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.entries(TYPE_CONFIG) as [FeedbackType, typeof TYPE_CONFIG[FeedbackType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setFormType(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans transition-colors"
                  style={{
                    background: formType === key ? `${cfg.color}15` : '#1c1c1c',
                    color: formType === key ? cfg.color : '#6b6b6b',
                    border: `1px solid ${formType === key ? `${cfg.color}40` : '#2a2a2a'}`,
                  }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>

            <textarea
              value={formMessage}
              onChange={e => setFormMessage(e.target.value)}
              placeholder="Describe your feedback…"
              rows={3}
              className="w-full px-3 py-2.5 rounded text-sm font-sans outline-none transition-all resize-none mb-4"
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Rating (optional):</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setFormRating(n)} className="transition-colors">
                    <Star size={16} style={{ color: n <= (formRating ?? 0) ? '#C9A84C' : '#2a2a2a', fill: n <= (formRating ?? 0) ? '#C9A84C' : 'none' }} />
                  </button>
                ))}
              </div>
              <Button variant="primary" size="sm" disabled={submitting || !formMessage.trim()} onClick={handleSubmit} className="gap-2">
                <Send size={13} /> {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} style={{ color: '#6b6b6b' }} />
            <button onClick={() => setFilter('all')} className="text-xs font-sans px-2 py-1 rounded"
              style={{ background: filter === 'all' ? 'rgba(201,168,76,0.1)' : 'transparent', color: filter === 'all' ? '#C9A84C' : '#6b6b6b' }}>All</button>
            {(Object.entries(TYPE_CONFIG) as [FeedbackType, typeof TYPE_CONFIG[FeedbackType]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setFilter(key)} className="text-xs font-sans px-2 py-1 rounded"
                style={{ background: filter === key ? `${cfg.color}15` : 'transparent', color: filter === key ? cfg.color : '#6b6b6b' }}>{cfg.label}</button>
            ))}
          </div>

          {/* Feedback list */}
          {loading ? (
            <div className="space-y-3"><Skeleton width="100%" height="60px" /><Skeleton width="100%" height="60px" /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20" style={{ color: '#6b6b6b' }} />
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No feedback yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(f => {
                const cfg = TYPE_CONFIG[f.type as FeedbackType] ?? TYPE_CONFIG.general
                return (
                  <div key={f.id} className="rounded-lg p-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span className="text-xs font-sans font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {f.rating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} size={12} style={{ color: n <= (f.rating ?? 0) ? '#C9A84C' : '#2a2a2a', fill: n <= (f.rating ?? 0) ? '#C9A84C' : 'none' }} />
                            ))}
                          </div>
                        )}
                        <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                          <span className="px-1.5 py-0.5 rounded" style={{
                            background: f.status === 'new' ? 'rgba(74,222,128,0.08)' : 'rgba(107,107,107,0.08)',
                            color: f.status === 'new' ? '#4ade80' : '#6b6b6b',
                          }}>{f.status}</span>
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{f.message}</p>
                    <p className="text-xs font-sans mt-2" style={{ color: '#6b6b6b' }}>{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
