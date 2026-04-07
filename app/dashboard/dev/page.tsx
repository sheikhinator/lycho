'use client'
import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Send, Loader2 } from 'lucide-react'

const AGENTS = [
  { id: 'architect', name: 'Architect', icon: '🏗', desc: 'System design and technical architecture',   prompt: 'You are a senior software architect. Analyse requirements and design scalable, maintainable system architectures. Provide diagrams in text format, technology recommendations, and detailed technical specifications.' },
  { id: 'coder',     name: 'Coder',     icon: '💻', desc: 'Write, review and refactor code',           prompt: 'You are an expert software engineer. Write clean, well-commented, production-ready code. Review code for bugs, suggest improvements, and refactor for clarity and performance.' },
  { id: 'qa',        name: 'QA',        icon: '🧪', desc: 'Test plans, test cases, bug analysis',       prompt: 'You are a QA engineer. Create comprehensive test plans, write test cases, analyse bugs, and suggest testing strategies. Focus on edge cases and failure modes.' },
  { id: 'security',  name: 'Security',  icon: '🔒', desc: 'Security review and vulnerability detection', prompt: 'You are a security engineer. Review code and architectures for vulnerabilities. Identify OWASP top 10 risks, suggest fixes, and recommend security best practices.' },
  { id: 'docs',      name: 'Docs',      icon: '📝', desc: 'Documentation, READMEs, API docs',           prompt: 'You are a technical writer. Write clear, comprehensive documentation including READMEs, API docs, architecture docs, and inline code comments.' },
  { id: 'devops',    name: 'DevOps',    icon: '⚙',  desc: 'CI/CD, deployment, infrastructure',         prompt: 'You are a DevOps engineer. Design CI/CD pipelines, Docker configurations, Kubernetes manifests, and infrastructure-as-code. Focus on reliability and automation.' },
]

interface Msg { role: string; content: string }

export default function DevPage() {
  const [active, setActive]   = useState('coder')
  const [msgs, setMsgs]       = useState<Msg[]>([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)

  const agent = AGENTS.find(a => a.id === active)!

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: input }
    const history = [...msgs, userMsg]
    setMsgs([...history, { role: 'assistant', content: '' }])
    setInput(''); setLoading(true)

    try {
      const res = await fetch('/api/dev/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_prompt: agent.prompt, messages: history }) })
      const reader = res.body?.getReader(); const dec = new TextDecoder()
      if (!reader) throw new Error('No stream')
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const d = JSON.parse(line.slice(6))
              if (d.text) setMsgs(p => { const u = [...p]; u[u.length-1] = { role: 'assistant', content: u[u.length-1].content + d.text }; return u })
            } catch {}
          }
        }
      }
    } catch { setMsgs(p => { const u=[...p]; u[u.length-1]={ role:'assistant', content:'Error. Please try again.' }; return u }) }
    setLoading(false)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Agent selector */}
          <div className="px-4 lg:px-6 py-3 shrink-0 overflow-x-auto" style={{ background: '#141414', borderBottom: '1px solid #2a2a2a' }}>
            <div className="flex gap-2">
              {AGENTS.map(a => (
                <button key={a.id} onClick={() => { setActive(a.id); setMsgs([]) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-sans font-medium whitespace-nowrap transition-all"
                  style={{ background: active === a.id ? '#C9A84C' : 'transparent', color: active === a.id ? '#070707' : '#6b6b6b', border: `1px solid ${active === a.id ? '#C9A84C' : '#2a2a2a'}` }}>
                  {a.icon} {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-4">
            {msgs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-40 text-center">
                <div className="text-4xl mb-3">{agent.icon}</div>
                <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{agent.name}</p>
                <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>{agent.desc}</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%] px-4 py-3 rounded-2xl text-sm font-sans whitespace-pre-wrap" style={{ background: m.role === 'user' ? 'rgba(201,168,76,0.1)' : '#1c1c1c', border: `1px solid ${m.role === 'user' ? 'rgba(201,168,76,0.2)' : '#2a2a2a'}`, color: '#F0EBE1', lineHeight: 1.7, borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
                  {m.content || (loading && i === msgs.length-1 ? '…' : '')}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 lg:px-6 py-4 shrink-0" style={{ borderTop: '1px solid #2a2a2a' }}>
            <div className="flex items-end gap-2 rounded-xl px-4 py-3" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={`Ask the ${agent.name}…`} rows={1}
                className="flex-1 bg-transparent text-sm font-sans outline-none resize-none" style={{ color: '#F0EBE1', maxHeight: 120 }} />
              <button onClick={send} disabled={loading || !input.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mb-0.5"
                style={{ background: loading || !input.trim() ? '#2a2a2a' : '#C9A84C' }}>
                {loading ? <Loader2 size={14} className="animate-spin" style={{ color: '#6b6b6b' }} /> : <Send size={14} style={{ color: '#070707' }} />}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
