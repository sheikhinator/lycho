'use client'
import { useState } from 'react'

const PERSONAL_MODES = [
  { id: 'journal', name: 'AI Journal', icon: '📔', desc: 'Reflect, process, grow' },
  { id: 'goals', name: 'Goal Coach', icon: '🎯', desc: 'Set and achieve goals' },
  { id: 'productivity', name: 'Productivity', icon: '⚡', desc: 'Get more done' },
  { id: 'decisions', name: 'Decision Helper', icon: '🎲', desc: 'Make better choices' },
  { id: 'creativity', name: 'Creative Partner', icon: '🎨', desc: 'Brainstorm and create' },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', desc: 'Calm and clarity' },
]

const PERSONAL_PROMPTS: Record<string, string> = {
  journal: 'You are a compassionate AI journal companion. Help the user reflect on their thoughts, feelings and experiences. Ask thoughtful follow-up questions. Help them find patterns and insights in their life. Be supportive, non-judgmental and encouraging.',
  goals: 'You are an evidence-based goal achievement coach. Help users set SMART goals, break them into actionable steps, identify obstacles and stay accountable. Use proven goal-setting frameworks. Be motivating and practical.',
  productivity: 'You are a productivity expert. Help users manage their time, prioritise tasks, eliminate distractions and build better systems. Use frameworks like GTD, time-blocking, Pomodoro. Be practical and specific.',
  decisions: 'You are a decision-making expert. Help users think through important decisions using frameworks like pros/cons analysis, second-order thinking, pre-mortem analysis and decision trees. Help them avoid cognitive biases.',
  creativity: 'You are a creative brainstorming partner. Help users generate ideas, explore creative possibilities and overcome creative blocks. Use techniques like lateral thinking, random association and SCAMPER. Be playful and expansive.',
  mindfulness: 'You are a mindfulness and wellbeing guide. Guide users through breathing exercises, help them manage stress and anxiety, practice gratitude and build positive mental habits. Be calm, gentle and supportive.',
}

export default function PersonalPage() {
  const [mode, setMode] = useState('journal')
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/dev/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_prompt: PERSONAL_PROMPTS[mode], messages: [...messages, userMsg] }) })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try { const d = JSON.parse(line.slice(6)); if (d.text) setMessages(prev => { const u=[...prev]; u[u.length-1]={role:'assistant',content:u[u.length-1].content+d.text}; return u }) } catch {}
          }
        }
      }
    } catch { setMessages(prev => { const u=[...prev]; u[u.length-1]={role:'assistant',content:'Error. Try again.'}; return u }) }
    setLoading(false)
  }

  const activeMode = PERSONAL_MODES.find(m => m.id === mode)

  return (
    <div style={{ height: '100vh', background: '#070707', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '16px 24px' }}>
        <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>LYCHO PERSONAL</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PERSONAL_MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setMessages([]) }}
              style={{ background: mode === m.id ? '#C9A84C' : '#141414', color: mode === m.id ? '#070707' : '#888', border: `1px solid ${mode === m.id ? '#C9A84C' : '#2a2a2a'}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: mode === m.id ? 700 : 400 }}>
              {m.icon} {m.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#444', marginTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{activeMode?.icon}</div>
            <div style={{ color: '#666', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{activeMode?.name}</div>
            <div style={{ fontSize: 14 }}>{activeMode?.desc}</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: 10, fontSize: 14, lineHeight: 1.7, background: msg.role === 'user' ? '#C9A84C' : '#141414', color: msg.role === 'user' ? '#070707' : '#F0EBE1', whiteSpace: 'pre-wrap' }}>
              {msg.content || (loading && i === messages.length-1 ? '...' : '')}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid #1a1a1a', background: '#0d0d0d', display: 'flex', gap: 12 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={`Talk to your ${activeMode?.name}...`}
          style={{ flex: 1, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }} />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ background: '#C9A84C', color: '#070707', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          Send
        </button>
      </div>
    </div>
  )
}
