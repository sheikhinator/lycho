'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'

const CATEGORIES = [
  { value: '', label: 'Auto-detect...' },
  { value: 'leads', label: 'Leads & CRM' },
  { value: 'conversations', label: 'Conversations' },
  { value: 'sentiment', label: 'Sentiment Response' },
  { value: 'agents', label: 'Agent Management' },
  { value: 'schedule', label: 'Scheduled Tasks' },
]

const TRIGGER_LABELS: Record<string, string> = {
  'lead.hot_detected': 'Hot Lead Detected',
  'conversation.created': 'New Conversation',
  'conversation.escalated': 'Conversation Escalated',
  'conversation.resolved': 'Conversation Resolved',
  'sentiment.frustrated': 'Customer Frustrated',
  'schedule.daily': 'Every Day',
  'schedule.weekly': 'Every Week',
}

const ACTION_LABELS: Record<string, string> = {
  send_email: 'Send Email', send_slack: 'Slack Alert', send_whatsapp: 'WhatsApp Message',
  send_webhook: 'HTTP Webhook', send_to_zapier: 'Zapier', tag_contact: 'Tag Contact',
  wait: 'Wait', pause_agent: 'Pause Agent',
}

interface AutomationSpec {
  name: string
  description: string
  category: string
  trigger_type: string
  steps: { id: string; type: string; config: Record<string, unknown> }[]
  explanation: string
}

export default function NexusBuilderPage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ automation: { id: string }; spec: AutomationSpec } | null>(null)

  async function handleBuild() {
    if (!description.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/nexus/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, category }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to build'); return }
      setResult(json.data)
    } catch { setError('Network error — please try again.') }
    finally { setLoading(false) }
  }

  const inputStyle = { background: '#141414', border: '1px solid #2a2a2a', color: '#F0EBE1' } as const

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <Link href="/dashboard/nexus" className="inline-flex items-center gap-1.5 text-sm font-sans mb-6" style={{ color: '#6b6b6b' }}>
              <ArrowLeft size={14} /> Back to Nexus
            </Link>

            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>Nexus AI</p>
              <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>BUILD WITH AI</h1>
              <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>Describe your automation and AI will build it</p>
            </div>

            {!result && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                    What should this automation do?
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. When a hot lead is detected, immediately send me a WhatsApp alert with their name and score, then tag them as 'priority' in the system"
                    className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none resize-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none"
                    style={{ ...inputStyle, color: category ? '#F0EBE1' : '#6b6b6b' }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-lg text-sm font-sans" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                    {error} <button onClick={handleBuild} className="ml-3 underline">Retry</button>
                  </div>
                )}

                <button onClick={handleBuild} disabled={loading || !description.trim()}
                  className="w-full py-3 rounded-lg text-sm font-sans font-medium flex items-center justify-center gap-2 transition-opacity"
                  style={{ background: loading || !description.trim() ? '#2a2a2a' : '#C9A84C', color: loading || !description.trim() ? '#6b6b6b' : '#070707', cursor: loading || !description.trim() ? 'not-allowed' : 'pointer' }}>
                  {loading ? (
                    <><span className="inline-block w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }} />Building automation...</>
                  ) : (
                    <><Zap size={15} />Build Automation</>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                {/* Success header */}
                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-sans font-medium" style={{ color: '#4ade80' }}>Automation built successfully</p>
                    <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>Saved as draft — activate it from Nexus</p>
                  </div>
                </div>

                <div className="p-5 rounded-xl space-y-4" style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <div>
                    <p className="text-xs font-sans uppercase tracking-widest mb-1" style={{ color: '#7a6130' }}>{result.spec.category}</p>
                    <h2 className="font-sans font-semibold text-lg" style={{ color: '#F0EBE1' }}>{result.spec.name}</h2>
                    <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>{result.spec.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-sans px-2 py-1 rounded" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C' }}>
                      Trigger: {TRIGGER_LABELS[result.spec.trigger_type] ?? result.spec.trigger_type}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Steps</p>
                    <div className="space-y-2">
                      {result.spec.steps.map((step, i) => (
                        <div key={step.id} className="flex items-center gap-3 px-3 py-2 rounded" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                          <span className="text-xs font-sans w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>{i + 1}</span>
                          <span className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{ACTION_LABELS[step.type] ?? step.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result.spec.explanation && (
                    <p className="text-xs font-sans italic" style={{ color: '#6b6b6b' }}>{result.spec.explanation}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => router.push('/dashboard/nexus')}
                    className="flex-1 py-3 rounded-lg text-sm font-sans font-medium"
                    style={{ background: '#C9A84C', color: '#070707' }}>
                    Go to Nexus &rarr;
                  </button>
                  <button onClick={() => { setResult(null); setDescription(''); setCategory('') }}
                    className="px-6 py-3 rounded-lg text-sm font-sans"
                    style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#6b6b6b' }}>
                    Build Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
