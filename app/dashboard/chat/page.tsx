'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { MessageSquare, Copy, Trash2, Download, Bot } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'

interface Agent { id: string; display_name: string; agent_type: string; status: string }
interface Conversation {
  id: string; agent_id: string; contact_name: string | null; status: string
  message_count: number; created_at: string; last_message_at: string | null
  agent?: Agent
}

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [agents, setAgents]             = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(j => { if (j.data) { setAgents(j.data); if (j.data.length > 0) setSelectedAgent(j.data[0]) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedAgent) return
    fetch(`/api/conversations?agent_id=${selectedAgent.id}`)
      .then(r => r.json())
      .then(j => setConversations(j.data ?? []))
      .catch(() => {})
  }, [selectedAgent])

  async function deleteConversation(id: string) {
    if (!confirm('Delete this conversation?')) return
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConversations(prev => prev.filter(c => c.id !== id))
      toast('Conversation deleted', 'success')
    }
  }

  function copyConversationId(id: string) {
    navigator.clipboard.writeText(id)
    toast('Conversation ID copied', 'success')
  }

  function exportConversation(conv: Conversation) {
    const data = JSON.stringify(conv, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `conversation-${conv.id.slice(0, 8)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:pl-60">
        <DashboardTopBar />
        <div className="flex flex-1 min-h-0">

          {/* Agent list */}
          <div className="w-64 shrink-0 flex flex-col" style={{ borderRight: '1px solid #2a2a2a', background: '#0d0d0d' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <p className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>Your Agents</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {loading && <p className="text-xs font-sans px-4 py-3" style={{ color: '#555' }}>Loading…</p>}
              {!loading && agents.length === 0 && (
                <p className="text-xs font-sans px-4 py-3" style={{ color: '#555' }}>No agents deployed yet.</p>
              )}
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    background: selectedAgent?.id === agent.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                    borderLeft: selectedAgent?.id === agent.id ? '2px solid #C9A84C' : '2px solid transparent',
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1c1c1c' }}>
                    <Bot size={14} style={{ color: '#C9A84C' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-sans truncate" style={{ color: selectedAgent?.id === agent.id ? '#C9A84C' : '#F0EBE1' }}>
                      {agent.display_name || agent.agent_type}
                    </p>
                    <p className="text-xs font-sans" style={{ color: '#555' }}>{agent.status}</p>
                  </div>
                </button>
              ))}
            </div>
            {selectedAgent && (
              <div className="p-3" style={{ borderTop: '1px solid #2a2a2a' }}>
                <button
                  onClick={() => router.push(`/dashboard/agents/${selectedAgent.id}/chat`)}
                  className="w-full py-2 rounded-lg text-xs font-sans font-semibold transition-opacity hover:opacity-85"
                  style={{ background: '#C9A84C', color: '#070707' }}
                >
                  Chat with {selectedAgent.display_name}
                </button>
              </div>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>
                {selectedAgent ? `${selectedAgent.display_name} — Conversations` : 'Conversations'}
              </p>
              <p className="text-xs font-sans" style={{ color: '#555' }}>{conversations.length} total</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#555' }}>
                  <MessageSquare size={32} />
                  <p className="text-sm font-sans">No conversations yet.</p>
                  {selectedAgent && (
                    <button
                      onClick={() => router.push(`/dashboard/agents/${selectedAgent.id}/chat`)}
                      className="px-4 py-2 rounded-lg text-xs font-sans font-medium"
                      style={{ background: '#C9A84C', color: '#070707' }}
                    >
                      Start a conversation
                    </button>
                  )}
                </div>
              )}

              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className="rounded-xl p-4 mb-3 flex items-center justify-between gap-4"
                  style={{ background: '#141414', border: '1px solid #2a2a2a' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1c1c1c' }}>
                      <MessageSquare size={14} style={{ color: '#C9A84C' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>
                        {conv.contact_name || 'Anonymous'}
                      </p>
                      <p className="text-xs font-sans" style={{ color: '#555' }}>
                        {conv.message_count} messages · {conv.status} · {new Date(conv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/agents/${conv.agent_id}/chat?conversation=${conv.id}`)}
                      className="px-3 py-1.5 rounded text-xs font-sans transition-colors"
                      style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}
                    >
                      Open
                    </button>
                    <button onClick={() => copyConversationId(conv.id)} title="Copy ID" className="p-1.5 rounded transition-colors" style={{ color: '#555' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#555')}>
                      <Copy size={14} />
                    </button>
                    <button onClick={() => exportConversation(conv)} title="Export" className="p-1.5 rounded transition-colors" style={{ color: '#555' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#555')}>
                      <Download size={14} />
                    </button>
                    <button onClick={() => deleteConversation(conv.id)} title="Delete" className="p-1.5 rounded transition-colors" style={{ color: '#555' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ef4444')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#555')}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
