'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface WidgetInfo {
  agent_id: string
  agent_name: string
  agent_type: string
  business_name: string
  sector: string | null
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

function fingerprint(): string {
  const parts = [
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(new Date().getTimezoneOffset()),
    navigator.platform ?? '',
  ]
  return 'visitor-' + btoa(parts.join('|')).replace(/[^a-z0-9]/gi, '').slice(0, 24)
}

export default function WidgetPage({ params }: { params: { token: string } }) {
  const [info, setInfo]         = useState<WidgetInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [visitorId]             = useState<string>(() => {
    if (typeof window === 'undefined') return 'visitor-unknown'
    try { return localStorage.getItem('lycho_vid') || (() => { const id = fingerprint(); localStorage.setItem('lycho_vid', id); return id })() }
    catch { return fingerprint() }
  })

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/widget/${params.token}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(j => { if (j) setInfo(j.data) })
      .catch(() => setNotFound(true))
  }, [params.token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function send() {
    if (!input.trim() || !info || typing) return

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id:           info.agent_id,
          channel:            'web_widget',
          contact_identifier: visitorId,
          message:            userMsg.content,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data?.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: json.data.response,
          timestamp: new Date().toISOString(),
        }])
      }
    } catch {
      // silently fail
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0d0d0d' }}>
        <p className="text-sm" style={{ color: '#6b6b6b', fontFamily: 'sans-serif' }}>Widget not found.</p>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#0d0d0d' }}>
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <span key={d} style={{
              width: '6px', height: '6px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block',
              animation: `pulse 1.2s ease-in-out ${d}ms infinite`,
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d0d', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e1e', background: '#141414', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#C9A84C', fontSize: '16px', fontWeight: 600 }}>
              {info.business_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p style={{ color: '#F0EBE1', fontSize: '14px', fontWeight: 600, margin: 0 }}>{info.business_name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <p style={{ color: '#6b6b6b', fontSize: '11px', margin: 0 }}>{info.agent_name} · Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '20px', paddingTop: '40px' }}>
            <p style={{ color: '#6b6b6b', fontSize: '13px' }}>Hi! How can I help you today?</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAgent = msg.role === 'assistant'
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end' }}>
              <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: isAgent ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background:   isAgent ? '#1a1a1a' : '#C9A84C',
                color:        isAgent ? '#F0EBE1' : '#070707',
                borderLeft:   isAgent ? '2px solid rgba(201,168,76,0.3)' : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          )
        })}

        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: '#1a1a1a', borderLeft: '2px solid rgba(201,168,76,0.3)', display: 'flex', gap: '4px' }}>
              {[0, 150, 300].map(d => (
                <span key={d} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C9A84C', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e', background: '#141414', display: 'flex', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            background: '#1c1c1c',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            padding: '10px 14px',
            color: '#F0EBE1',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
            maxHeight: '96px',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: input.trim() && !typing ? '#C9A84C' : '#2a2a2a',
            border: 'none', cursor: input.trim() && !typing ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
          }}
        >
          <Send size={15} color={input.trim() && !typing ? '#070707' : '#6b6b6b'} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>
    </div>
  )
}
