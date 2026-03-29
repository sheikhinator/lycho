'use client'

import { useEffect, useState, useCallback } from 'react'
import { Activity } from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
  id: string
  channel: string | null
  status: string
  contact_identifier: string | null
  created_at: string
  agent_id: string
  agent_name: string
  lead_score: number
  lead_label: string
  sentiment: string
  last_message_preview: string
  escalated: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_EMOJI: Record<string, string> = {
  frustrated:   '😤',
  angry:        '😠',
  excited:      '🤩',
  delighted:    '😊',
  confused:     '😕',
  urgent:       '🚨',
  satisfied:    '😌',
  neutral:      '😐',
  'business-like': '💼',
  happy:        '😊',
  sad:          '😔',
}

const CHANNEL_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  whatsapp:         { bg: 'rgba(37,211,102,0.1)',   color: '#25d366', label: 'WA'    },
  email:            { bg: 'rgba(201,168,76,0.1)',   color: '#C9A84C', label: 'EM'    },
  telegram:         { bg: 'rgba(0,136,204,0.1)',    color: '#0088cc', label: 'TG'    },
  web_widget:       { bg: 'rgba(107,107,107,0.1)',  color: '#6b6b6b', label: 'WEB'   },
  sms:              { bg: 'rgba(74,222,128,0.1)',   color: '#4ade80', label: 'SMS'   },
  instagram:        { bg: 'rgba(225,48,108,0.1)',   color: '#e1306c', label: 'IG'    },
  facebook_messenger: { bg: 'rgba(0,136,255,0.1)', color: '#0088ff', label: 'FB'    },
  api:              { bg: 'rgba(107,107,107,0.1)',  color: '#6b6b6b', label: 'API'   },
}

function getChannelStyle(channel: string | null) {
  return CHANNEL_COLORS[channel ?? ''] ?? { bg: 'rgba(107,107,107,0.1)', color: '#6b6b6b', label: (channel ?? 'UK').slice(0, 3).toUpperCase() }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function LeadBadge({ label, score }: { label: string; score: number }) {
  if (score >= 85) {
    return (
      <span
        className="text-xs font-sans px-2 py-0.5 rounded"
        style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.35)' }}
      >
        🔥 HOT
      </span>
    )
  }
  if (score >= 60) {
    return (
      <span
        className="text-xs font-sans px-2 py-0.5 rounded"
        style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}
      >
        🌡️ WARM
      </span>
    )
  }
  return (
    <span
      className="text-xs font-sans px-2 py-0.5 rounded"
      style={{ background: 'rgba(107,107,107,0.1)', color: '#6b6b6b', border: '1px solid rgba(107,107,107,0.2)' }}
    >
      ❄️ COLD
    </span>
  )
}

function ActivitySkeleton() {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-4 animate-pulse"
          style={{ borderBottom: i < 4 ? '1px solid #2a2a2a' : undefined }}
        >
          <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: '#2a2a2a' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded w-1/3" style={{ background: '#2a2a2a' }} />
            <div className="h-2.5 rounded w-2/3" style={{ background: '#2a2a2a' }} />
          </div>
          <div className="h-3 rounded w-16" style={{ background: '#2a2a2a' }} />
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityFeed({ initialActivity }: { initialActivity?: ActivityItem[] }) {
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity ?? [])
  const [loading, setLoading] = useState(!initialActivity)

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/dashboard')
      if (!res.ok) return
      const data = await res.json()
      setActivity(data.data?.recent_activity ?? [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialActivity) fetchActivity()
    const interval = setInterval(fetchActivity, 30_000)
    return () => clearInterval(interval)
  }, [fetchActivity, initialActivity])

  if (loading) return <ActivitySkeleton />

  if (activity.length === 0) {
    return (
      <div
        className="rounded-lg p-8 flex flex-col items-center justify-center text-center"
        style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', minHeight: '160px' }}
      >
        <Activity size={32} className="mb-3 opacity-30" style={{ color: '#6b6b6b' }} />
        <p className="text-sm font-sans mb-1" style={{ color: 'rgba(240,235,225,0.6)' }}>No conversations yet.</p>
        <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
          Deploy an agent and share your widget or Telegram bot.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      {activity.map((conv, i) => {
        const ch      = getChannelStyle(conv.channel)
        const isHot   = conv.lead_score >= 85
        const sentEm  = SENTIMENT_EMOJI[conv.sentiment] ?? '😐'

        return (
          <div
            key={conv.id}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
            style={{
              borderBottom: i < activity.length - 1 ? '1px solid #2a2a2a' : undefined,
              borderLeft: conv.escalated ? '3px solid #f87171' : isHot ? '3px solid rgba(201,168,76,0.6)' : '3px solid transparent',
              animation: isHot ? 'hotPulse 2s ease-in-out infinite' : undefined,
            }}
          >
            {/* Channel icon */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: ch.bg, color: ch.color, border: `1px solid ${ch.color}22` }}
            >
              {ch.label}
            </div>

            {/* Center: contact + agent + preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>
                  {conv.contact_identifier ?? 'Anonymous'}
                </p>
                <span className="text-xs font-sans shrink-0" style={{ color: '#6b6b6b' }}>
                  via {conv.agent_name}
                </span>
              </div>
              {conv.last_message_preview && (
                <p className="text-xs font-sans truncate mt-0.5" style={{ color: '#6b6b6b' }}>
                  {conv.last_message_preview}
                </p>
              )}
            </div>

            {/* Right: sentiment + badge + time + view */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base leading-none" title={conv.sentiment}>{sentEm}</span>
              <LeadBadge label={conv.lead_label} score={conv.lead_score} />
              <span className="text-xs font-sans hidden sm:block" style={{ color: '#6b6b6b' }}>
                {timeAgo(conv.created_at)}
              </span>
              <Link
                href={`/dashboard/conversations?id=${conv.id}`}
                className="text-xs font-sans px-2 py-1 rounded transition-colors"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  color: '#C9A84C',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                View
              </Link>
            </div>
          </div>
        )
      })}

      <style jsx global>{`
        @keyframes hotPulse {
          0%, 100% { border-left-color: rgba(201,168,76,0.4); }
          50%       { border-left-color: rgba(201,168,76,0.9); }
        }
      `}</style>
    </div>
  )
}
