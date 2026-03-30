'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Send, ArrowRight, Check } from 'lucide-react'

interface Msg { role: 'user' | 'assistant'; content: string }

const FEATURES = [
  'Handles WhatsApp, Email & Web 24/7',
  'Lead scoring & hot lead alerts',
  'Multilingual — Urdu, English, Arabic',
  'Escalates complex queries to humans',
  'Learns from every conversation',
]

export default function DemoPage() {
  const [messages, setMessages]   = useState<Msg[]>([])
  const [input, setInput]         = useState('')
  const [typing, setTyping]       = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showCTA, setShowCTA]     = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function send() {
    if (!input.trim() || typing) return

    const userMsg: Msg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('/api/demo/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: userMsg.content, history: messages }),
      })
      const json = await res.json()

      if (res.status === 429) {
        setShowCTA(true)
        setTyping(false)
        return
      }

      if (res.ok && json.data?.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.data.response }])
        const rem = json.data.remaining ?? null
        setRemaining(rem)
        if (rem !== null && rem <= 0) setShowCTA(true)
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

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#F0EBE1', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <nav style={{ padding: '16px 24px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size="sm" />
        <Link href="/signup" style={{ background: '#C9A84C', color: '#070707', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Start Trial — PKR 999
        </Link>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0', maxWidth: '1100px', margin: '0 auto', minHeight: 'calc(100vh - 57px)' }}>
        {/* Left — info */}
        <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid #1e1e1e' }}>
          <p style={{ color: '#C9A84C', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Live Demo</p>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '0.05em', lineHeight: 1.05, marginBottom: '16px' }}>
            SEE LYCHO<br />IN ACTION
          </h1>
          <p style={{ color: '#6b6b6b', fontSize: '14px', lineHeight: 1.7, marginBottom: '32px', maxWidth: '380px' }}>
            Chat with a live LYCHO AI agent — the same technology that handles thousands of customer conversations for businesses every day.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={10} color="#C9A84C" />
                </div>
                <span style={{ fontSize: '13px', color: '#a0a0a0' }}>{f}</span>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C9A84C', color: '#070707', padding: '14px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', alignSelf: 'flex-start' }}
          >
            <ArrowRight size={16} />Start Trial — PKR 999
          </Link>
          <p style={{ color: '#4a4a4a', fontSize: '11px', marginTop: '8px' }}>7-day trial · full refund if cancelled</p>
        </div>

        {/* Right — chat */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Chat header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#C9A84C', fontWeight: 700 }}>L</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>LYCHO Demo Agent</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                <p style={{ color: '#6b6b6b', fontSize: '11px', margin: 0 }}>
                  Online{remaining !== null ? ` · ${remaining} message${remaining !== 1 ? 's' : ''} remaining` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '400px', maxHeight: '60vh' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <p style={{ color: '#6b6b6b', fontSize: '13px' }}>Ask anything — try &quot;What can you do?&quot; or &quot;How does LYCHO work?&quot;</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isAgent = msg.role === 'assistant'
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: isAgent ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background:  isAgent ? '#1a1a1a' : '#C9A84C',
                    color:       isAgent ? '#F0EBE1' : '#070707',
                    borderLeft:  isAgent ? '2px solid rgba(201,168,76,0.3)' : 'none',
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
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e1e', background: '#0d0d0d', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message…"
              rows={1}
              style={{ flex: 1, resize: 'none', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '10px 14px', color: '#F0EBE1', fontSize: '13px', fontFamily: 'inherit', outline: 'none', maxHeight: '96px' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || typing}
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: input.trim() && !typing ? '#C9A84C' : '#2a2a2a', border: 'none', cursor: input.trim() && !typing ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <Send size={15} color={input.trim() && !typing ? '#070707' : '#6b6b6b'} />
            </button>
          </div>

          {/* CTA overlay */}
          {showCTA && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,7,7,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
              <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.05em', marginBottom: '12px' }}>DEMO LIMIT REACHED</p>
              <p style={{ color: '#6b6b6b', fontSize: '14px', marginBottom: '28px', maxWidth: '320px', lineHeight: 1.6 }}>
                You&apos;ve used your 10 free demo messages. Start your trial to get unlimited conversations.
              </p>
              <Link
                href="/signup"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C9A84C', color: '#070707', padding: '14px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}
              >
                <ArrowRight size={16} />Start Trial — PKR 999
              </Link>
              <p style={{ color: '#4a4a4a', fontSize: '11px', marginTop: '10px' }}>7-day trial · full refund if cancelled</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>
    </div>
  )
}
