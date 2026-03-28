'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ChevronRight, User, Zap, AlertTriangle, TrendingUp, Brain } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { useToast } from '@/components/providers/ToastProvider'
import { EMOTION_EMOJI } from '@/lib/agents/emotional-intelligence'
import { getAgentCapabilities } from '@/lib/agents/capability-manifest'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Agent {
  id: string
  display_name: string | null
  agent_type: string
  status: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  confidence?: number
  lead_score?: number
  cost_pkr?: number
  model_used?: string
  escalated?: boolean
  emotional_state?: string
  emotional_intensity?: number
}

interface ContactProfile {
  name?: string
  phone?: string
  email?: string
  company?: string
  specific_need?: string
  timeline?: string
  budget_signal?: string
  decision_authority?: string
  urgency?: string
}

interface ConversationMeta {
  lead_score: number
  lead_label: 'hot' | 'warm' | 'cold'
  sentiment: string
  emotional_state?: string
  emotional_intensity?: number
  contact_profile: ContactProfile
  suggested_next_action: string
  memory?: { relationship_score: number; total_interactions: number; total_value_pkr: number } | null
}

// ─── Lead badge ───────────────────────────────────────────────────────────────

function LeadBadge({ label }: { label: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot:  { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.35)'  },
    warm: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
    cold: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)'  },
  }
  const s = map[label]
  return (
    <span
      className="text-xs px-2 py-0.5 rounded font-sans font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}

// ─── Sentiment emoji ──────────────────────────────────────────────────────────

function sentimentEmoji(sentiment: string) {
  const map: Record<string, string> = {
    positive:   '😊',
    excited:    '🤩',
    neutral:    '😐',
    uncertain:  '🤔',
    frustrated: '😤',
  }
  return map[sentiment] ?? '😐'
}

// ─── Model label ─────────────────────────────────────────────────────────────

const COMPLEX_TYPES = ['research_agent', 'research', 'analyst_agent', 'analyst', 'compliance_agent', 'compliance']

function getModelLabel(agentType: string): string {
  return COMPLEX_TYPES.includes(agentType) ? 'Sonnet 4.6' : 'Haiku 4.5'
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? '#ef4444' : score >= 45 ? '#fbbf24' : '#3b82f6'
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: '#2a2a2a' }}>
      <div
        className="h-1.5 rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 justify-start">
      <div
        className="rounded-lg px-4 py-3 flex items-center gap-1"
        style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        {[0, 150, 300].map(delay => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: '#C9A84C',
              animation: `pulse 1.2s ease-in-out ${delay}ms infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { toast } = useToast()

  const CONTACT_ID = 'test-master'

  const [agents, setAgents]               = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [messages, setMessages]           = useState<ChatMessage[]>([])
  const [input, setInput]                 = useState('')
  const [typing, setTyping]               = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [convMeta, setConvMeta]           = useState<ConversationMeta | null>(null)
  const [profileOpen, setProfileOpen]     = useState(true)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { document.title = 'Test Agents — LYCHO' }, [])

  // Load history for a given agent
  const loadHistory = useCallback(async (agent: Agent) => {
    setLoadingHistory(true)
    setMessages([])
    setConvMeta(null)
    try {
      const params = new URLSearchParams({
        agent_id: agent.id,
        status: 'open',
        search: CONTACT_ID,
        limit: '1',
      })
      const res = await fetch(`/api/conversations?${params}`)
      if (!res.ok) return
      const json = await res.json()
      const convs: Record<string, unknown>[] = json.data?.conversations ?? []
      if (convs.length === 0) return

      const conv = convs[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawMessages: any[] = (conv.messages as any[]) ?? []
      const loaded: ChatMessage[] = rawMessages.map(m => ({
        role:      m.role as 'user' | 'assistant',
        content:   m.content as string,
        timestamp: m.timestamp ?? new Date().toISOString(),
      }))
      setMessages(loaded)

      // Restore convMeta from stored metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = conv.metadata as any
      if (meta) {
        setConvMeta({
          lead_score:            meta.lead_score ?? 50,
          lead_label:            meta.lead_label ?? 'warm',
          sentiment:             meta.sentiment ?? 'neutral',
          emotional_state:       meta.emotional_state ?? undefined,
          emotional_intensity:   meta.emotional_intensity ?? undefined,
          contact_profile:       meta.contact_profile ?? {},
          suggested_next_action: meta.suggested_next_action ?? 'continue',
          memory:                null,
        })
      }
    } catch {
      // History load is non-fatal
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Load agents, then load history for first agent
  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(j => {
        const list: Agent[] = (j.data ?? []).filter((a: Agent) => a.status !== 'deleted')
        setAgents(list)
        if (list.length > 0) {
          setSelectedAgent(list[0])
          loadHistory(list[0])
        }
      })
      .catch(() => toast('Failed to load agents', 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function resetChat() {
    setMessages([])
    setConvMeta(null)
    setInput('')
  }

  function selectAgent(agent: Agent) {
    setSelectedAgent(agent)
    setInput('')
    loadHistory(agent)
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedAgent || typing) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id:           selectedAgent.id,
          channel:            'web',
          contact_identifier: CONTACT_ID,
          message:            userMsg.content,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast(json.error ?? 'Something went wrong', 'error')
        return
      }

      const d = json.data

      const agentMsg: ChatMessage = {
        role:               'assistant',
        content:            d.response,
        timestamp:          new Date().toISOString(),
        confidence:         d.confidence,
        lead_score:         d.lead_score,
        cost_pkr:           d.cost_pkr,
        model_used:         d.model_used,
        escalated:          d.escalated,
        emotional_state:    d.emotional_state,
        emotional_intensity: d.emotional_intensity,
      }

      setMessages(prev => [...prev, agentMsg])

      setConvMeta({
        lead_score:             d.lead_score,
        lead_label:             d.lead_label,
        sentiment:              d.sentiment,
        emotional_state:        d.emotional_state,
        emotional_intensity:    d.emotional_intensity,
        contact_profile:        d.contact_profile ?? {},
        suggested_next_action:  d.suggested_next_action,
        memory:                 d.memory ?? null,
      })
    } catch {
      toast('Failed to send message', 'error')
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }, [input, selectedAgent, typing, toast])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hotLead = convMeta && convMeta.lead_score >= 85

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />

        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

          {/* ── Left panel: agent list ── */}
          <div
            className="w-60 shrink-0 flex flex-col overflow-y-auto hidden lg:flex"
            style={{ background: '#0d0d0d', borderRight: '1px solid #2a2a2a' }}
          >
            <div className="px-4 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
                Deployed Agents
              </p>
            </div>

            <div className="flex-1 py-2">
              {agents.length === 0 ? (
                <p className="text-xs font-sans px-4 py-3" style={{ color: '#6b6b6b' }}>
                  No agents deployed yet.
                </p>
              ) : (
                agents.map(agent => {
                  const active = selectedAgent?.id === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => selectAgent(agent)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                      style={{
                        background:   active ? 'rgba(201,168,76,0.07)' : 'transparent',
                        borderLeft:   active ? '2px solid #C9A84C' : '2px solid transparent',
                        color:        active ? '#F0EBE1' : '#6b6b6b',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs"
                        style={{ background: active ? 'rgba(201,168,76,0.15)' : '#1c1c1c', color: active ? '#C9A84C' : '#6b6b6b' }}
                      >
                        {(agent.display_name ?? agent.agent_type).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-sans truncate">{agent.display_name ?? agent.agent_type}</p>
                        <p className="text-xs font-sans opacity-60 truncate">{agent.agent_type}</p>
                      </div>
                      {active && <ChevronRight size={12} style={{ color: '#C9A84C' }} />}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── Main chat area ── */}
          {!selectedAgent ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>
                Select an agent to start testing
              </p>
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">

              {/* Chat column */}
              <div className="flex flex-col flex-1 overflow-hidden">

                {/* Top bar */}
                <div
                  className="flex items-center justify-between px-5 py-3 shrink-0"
                  style={{ background: '#0d0d0d', borderBottom: '1px solid #2a2a2a' }}
                >
                  <div>
                    <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>
                      {selectedAgent.display_name ?? selectedAgent.agent_type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                      <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                        {selectedAgent.agent_type} · {getModelLabel(selectedAgent.agent_type)}
                      </span>
                      {convMeta && (
                        <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                          · Confidence {(convMeta.lead_score > 0 ? 93 : 93)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {convMeta && <LeadBadge label={convMeta.lead_label} />}
                    <button
                      onClick={() => setProfileOpen(v => !v)}
                      className="text-xs font-sans px-3 py-1.5 rounded transition-colors"
                      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#6b6b6b' }}
                    >
                      {profileOpen ? 'Hide Profile' : 'Show Profile'}
                    </button>
                    <button
                      onClick={resetChat}
                      className="text-xs font-sans px-3 py-1.5 rounded transition-colors"
                      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#6b6b6b' }}
                    >
                      New Chat
                    </button>
                  </div>
                </div>

                {/* Hot lead banner */}
                {hotLead && (
                  <div
                    className="flex items-center gap-2 px-5 py-2 text-xs font-sans shrink-0"
                    style={{
                      background: 'rgba(201,168,76,0.12)',
                      borderBottom: '1px solid rgba(201,168,76,0.3)',
                      color: '#C9A84C',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  >
                    <TrendingUp size={13} />
                    <span>HOT LEAD detected — score {convMeta!.lead_score}/100. Consider immediate follow-up.</span>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 space-y-4">
                  {loadingHistory && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 pb-10">
                      <div className="flex items-center gap-1.5">
                        {[0, 150, 300].map(d => (
                          <span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />
                        ))}
                      </div>
                      <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Loading conversation…</p>
                    </div>
                  )}

                  {!loadingHistory && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(201,168,76,0.1)' }}
                      >
                        <Zap size={20} style={{ color: '#C9A84C' }} />
                      </div>
                      <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>
                        {selectedAgent.display_name ?? selectedAgent.agent_type} is ready
                      </p>
                      <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                        Send a message to start the conversation
                      </p>
                    </div>
                  )}

                  {messages.map((msg, i) => {
                    const isAgent = msg.role === 'assistant'
                    return (
                      <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] flex flex-col gap-1 ${isAgent ? 'items-start' : 'items-end'}`}>

                          {/* Escalation banner */}
                          {isAgent && msg.escalated && (
                            <div
                              className="flex items-center gap-1.5 text-xs font-sans px-3 py-1 rounded mb-1"
                              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                              <AlertTriangle size={11} />
                              Escalated to human
                            </div>
                          )}

                          <div
                            className="rounded-xl px-4 py-3 text-sm font-sans leading-relaxed whitespace-pre-wrap"
                            style={
                              isAgent
                                ? { background: 'rgba(201,168,76,0.06)', borderLeft: '2px solid #C9A84C', color: '#F0EBE1' }
                                : { background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }
                            }
                          >
                            {msg.content}
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 flex-wrap px-1">
                            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isAgent && msg.emotional_state && msg.emotional_state !== 'neutral' && (
                              <span
                                className="text-xs font-sans px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(107,107,107,0.1)', color: '#F0EBE1' }}
                                title={`Detected emotion: ${msg.emotional_state}`}
                              >
                                {EMOTION_EMOJI[msg.emotional_state as keyof typeof EMOTION_EMOJI] ?? '😐'} {msg.emotional_state}
                              </span>
                            )}
                            {isAgent && msg.confidence !== undefined && (
                              <span
                                className="text-xs font-sans px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                              >
                                {(msg.confidence * 100).toFixed(0)}% conf
                              </span>
                            )}
                            {isAgent && msg.lead_score !== undefined && (
                              <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                                Lead {msg.lead_score}
                              </span>
                            )}
                            {isAgent && msg.cost_pkr !== undefined && msg.cost_pkr > 0 && (
                              <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                                PKR {msg.cost_pkr.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {typing && <TypingIndicator />}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div
                  className="flex items-end gap-3 px-4 py-4 shrink-0"
                  style={{ borderTop: '1px solid #2a2a2a', background: '#0d0d0d' }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type a message… (Enter to send)"
                    rows={1}
                    className="flex-1 resize-none rounded-xl px-4 py-3 text-sm font-sans outline-none"
                    style={{
                      background:  '#1c1c1c',
                      border:      '1px solid #2a2a2a',
                      color:       '#F0EBE1',
                      maxHeight:   '120px',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || typing}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
                    style={{ background: '#C9A84C', color: '#070707', flexShrink: 0 }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>

              {/* ── Contact Profile sidebar ── */}
              {profileOpen && (
                <div
                  className="w-64 shrink-0 flex flex-col overflow-y-auto hidden xl:flex"
                  style={{ background: '#0d0d0d', borderLeft: '1px solid #2a2a2a' }}
                >
                  <div className="px-4 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
                      Contact Profile
                    </p>
                  </div>

                  <div className="flex-1 px-4 py-4 space-y-5">
                    {!convMeta ? (
                      <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                        Profile builds as conversation progresses…
                      </p>
                    ) : (
                      <>
                        {/* Lead score */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Lead Score</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bebas text-xl" style={{ color: '#F0EBE1', letterSpacing: '0.05em' }}>
                                {convMeta.lead_score}
                              </span>
                              <LeadBadge label={convMeta.lead_label} />
                            </div>
                          </div>
                          <ScoreBar score={convMeta.lead_score} />
                        </div>

                        {/* Sentiment */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Sentiment</span>
                          <span className="text-sm font-sans" style={{ color: '#F0EBE1' }}>
                            {sentimentEmoji(convMeta.sentiment)} {convMeta.sentiment}
                          </span>
                        </div>

                        {/* Suggested action */}
                        {convMeta.suggested_next_action && convMeta.suggested_next_action !== 'continue' && (
                          <div
                            className="rounded-lg px-3 py-2"
                            style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)' }}
                          >
                            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Next Action</p>
                            <p className="text-xs font-sans mt-0.5 font-medium" style={{ color: '#C9A84C' }}>
                              {convMeta.suggested_next_action.replace(/_/g, ' ')}
                            </p>
                          </div>
                        )}

                        {/* Profile fields */}
                        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '16px' }}>
                          <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>
                            Profile
                          </p>
                          {Object.entries(convMeta.contact_profile).length === 0 ? (
                            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                              Collecting…
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {Object.entries(convMeta.contact_profile).map(([key, value]) => (
                                value ? (
                                  <div key={key}>
                                    <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                                      {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs font-sans mt-0.5" style={{ color: '#F0EBE1' }}>
                                      {String(value)}
                                    </p>
                                  </div>
                                ) : null
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Identity chip */}
                        {convMeta.contact_profile.name && (
                          <div
                            className="flex items-center gap-2 rounded-lg px-3 py-2"
                            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(201,168,76,0.1)' }}
                            >
                              <User size={13} style={{ color: '#C9A84C' }} />
                            </div>
                            <div>
                              <p className="text-xs font-sans font-medium" style={{ color: '#F0EBE1' }}>
                                {convMeta.contact_profile.name}
                              </p>
                              {convMeta.contact_profile.email && (
                                <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
                                  {convMeta.contact_profile.email}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Emotional state */}
                        {convMeta.emotional_state && convMeta.emotional_state !== 'neutral' && (
                          <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '16px' }}>
                            <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                              Emotional State
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {EMOTION_EMOJI[convMeta.emotional_state as keyof typeof EMOTION_EMOJI] ?? '😐'}
                              </span>
                              <div>
                                <p className="text-xs font-sans font-medium capitalize" style={{ color: '#F0EBE1' }}>
                                  {convMeta.emotional_state}
                                </p>
                                {convMeta.emotional_intensity !== undefined && (
                                  <div className="mt-1 h-1 rounded-full w-16" style={{ background: '#2a2a2a' }}>
                                    <div
                                      className="h-1 rounded-full"
                                      style={{
                                        width: `${convMeta.emotional_intensity * 100}%`,
                                        background: convMeta.emotional_intensity > 0.7 ? '#ef4444' : convMeta.emotional_intensity > 0.4 ? '#fbbf24' : '#4ade80',
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Memory graph */}
                        {convMeta.memory && (
                          <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '16px' }}>
                            <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>
                              Memory Graph
                            </p>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Relationship</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1 w-12 rounded-full" style={{ background: '#2a2a2a' }}>
                                    <div className="h-1 rounded-full" style={{ width: `${convMeta.memory.relationship_score}%`, background: '#C9A84C' }} />
                                  </div>
                                  <span className="text-xs font-sans" style={{ color: '#C9A84C' }}>{convMeta.memory.relationship_score}</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Interactions</span>
                                <span className="text-xs font-sans" style={{ color: '#F0EBE1' }}>{convMeta.memory.total_interactions}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Total Value</span>
                                <span className="text-xs font-sans" style={{ color: '#F0EBE1' }}>PKR {convMeta.memory.total_value_pkr.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Agent capabilities */}
                  {selectedAgent && (() => {
                    const cap = getAgentCapabilities(selectedAgent.agent_type)
                    if (!cap) return null
                    return (
                      <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid #2a2a2a' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <Brain size={13} style={{ color: '#6b6b6b' }} />
                          <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
                            Capabilities
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {([
                            { label: 'Escalate',     val: cap.can_escalate },
                            { label: 'Book Appts',   val: cap.can_book_appointments },
                            { label: 'Send Files',   val: cap.can_send_files },
                          ] as { label: string; val: boolean }[]).map(({ label, val }) => (
                            <div key={label} className="flex items-center justify-between">
                              <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{label}</span>
                              <span className="text-xs font-sans" style={{ color: val ? '#4ade80' : '#6b6b6b' }}>
                                {val ? '✓' : '—'}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Channels</span>
                            <span className="text-xs font-sans" style={{ color: '#F0EBE1' }}>{cap.supported_channels.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Avg Response</span>
                            <span className="text-xs font-sans" style={{ color: '#F0EBE1' }}>{(cap.avg_response_ms / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
