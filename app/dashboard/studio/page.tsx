'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECTORS = [
  'Sales & Marketing', 'Customer Service', 'Healthcare', 'Legal', 'Finance',
  'Real Estate', 'Education', 'Hospitality', 'Ecommerce', 'Logistics',
  'HR', 'Construction', 'Automotive', 'Insurance', 'Technology',
  'Government', 'Agriculture', 'Media', 'Non-Profit', 'Professional Services'
]
const TONES = ['Professional', 'Friendly', 'Formal', 'Empathetic', 'Direct', 'Enthusiastic']
const CHANNELS = ['Web Widget', 'Telegram', 'WhatsApp', 'Email', 'Voice']

export default function StudioPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [agent, setAgent] = useState({
    display_name: '', description: '', sector: '', tone: 'Professional',
    channels: ['Web Widget'], capabilities: '',
    escalation_trigger: 'complex legal or medical questions', system_prompt: ''
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateAgent(key: string, value: any) {
    setAgent(prev => ({ ...prev, [key]: value }))
  }

  function generatePrompt() {
    updateAgent('system_prompt', `You are the ${agent.display_name} for LYCHO.

ROLE: ${agent.description}

CAPABILITIES: ${agent.capabilities}

TONE: ${agent.tone}. Adapt to the visitor's language automatically and respond in kind.

SECTOR: ${agent.sector}

PROCESS:
1. Greet warmly and understand the visitor's need
2. Apply your specialist knowledge to help them
3. Ask clarifying questions one at a time
4. Provide clear, actionable responses
5. Always move toward resolution

HUMAN SOVEREIGNTY: Escalate to a human when: ${agent.escalation_trigger}. Say "Let me connect you with our team" and flag for follow-up.

METADATA: Extract and note {contact_name, contact_info, query_type, urgency, resolution_status}`)
    setStep(3)
  }

  async function testAgent() {
    if (!testInput.trim() || !agent.system_prompt) return
    setTesting(true)
    setTestResponse('')
    try {
      const res = await fetch('/api/dev/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: agent.system_prompt, messages: [{ role: 'user', content: testInput }] })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try { const d = JSON.parse(line.slice(6)); if (d.text) setTestResponse(p => p + d.text) } catch { /* skip */ }
          }
        }
      }
    } catch { setTestResponse('Test failed. Check your prompt.') }
    setTesting(false)
  }

  async function saveAgent() {
    if (!agent.display_name || !agent.system_prompt) return
    setSaving(true)
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: agent.display_name, description: agent.description,
        agent_type: `custom_${agent.display_name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        system_prompt: agent.system_prompt, model_complexity: 'simple', channels: agent.channels
      })
    })
    setSaving(false)
    if (res.ok) router.push('/dashboard/agents')
  }

  const inp = {
    width: '100%', background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8,
    padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'DM Sans, sans-serif'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070707', padding: '32px 24px', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>Agent Studio</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Build a specialist agent in minutes. No code required.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {['Define', 'Configure', 'Test & Deploy'].map((s, i) => (
            <div key={s} onClick={() => i + 1 <= step && setStep(i + 1)} style={{
              flex: 1, padding: 10, textAlign: 'center', borderRadius: 8,
              background: step === i+1 ? '#C9A84C' : step > i+1 ? '#1a1a1a' : '#0d0d0d',
              color: step === i+1 ? '#070707' : step > i+1 ? '#4ade80' : '#444',
              fontSize: 13, fontWeight: step === i+1 ? 700 : 400,
              cursor: i+1 <= step ? 'pointer' : 'default',
              border: `1px solid ${step === i+1 ? '#C9A84C' : '#1a1a1a'}`
            }}>
              {step > i+1 ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>AGENT NAME</label>
              <input value={agent.display_name} onChange={e => updateAgent('display_name', e.target.value)} placeholder="e.g. Pakistani Tax Advisor" style={inp} />
            </div>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>WHAT DOES IT DO</label>
              <textarea value={agent.description} onChange={e => updateAgent('description', e.target.value)} placeholder="Helps businesses understand Pakistani tax obligations..." rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>SECTOR</label>
              <select value={agent.sector} onChange={e => updateAgent('sector', e.target.value)} style={inp}>
                <option value="">Select sector</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>KEY CAPABILITIES</label>
              <textarea value={agent.capabilities} onChange={e => updateAgent('capabilities', e.target.value)} placeholder="List 3-5 specific things this agent can do..." rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!agent.display_name || !agent.description || !agent.sector}
              style={{ background: '#C9A84C', color: '#070707', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer', opacity: !agent.display_name || !agent.description || !agent.sector ? 0.5 : 1 }}>
              Next: Configure →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 8 }}>TONE</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TONES.map(t => (
                  <button key={t} onClick={() => updateAgent('tone', t)} style={{ background: agent.tone === t ? '#C9A84C' : '#141414', color: agent.tone === t ? '#070707' : '#888', border: `1px solid ${agent.tone === t ? '#C9A84C' : '#2a2a2a'}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 8 }}>CHANNELS</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CHANNELS.map(c => (
                  <button key={c} onClick={() => updateAgent('channels', agent.channels.includes(c) ? agent.channels.filter((x: string) => x !== c) : [...agent.channels, c])}
                    style={{ background: agent.channels.includes(c) ? '#C9A84C' : '#141414', color: agent.channels.includes(c) ? '#070707' : '#888', border: `1px solid ${agent.channels.includes(c) ? '#C9A84C' : '#2a2a2a'}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>ESCALATE TO HUMAN WHEN</label>
              <input value={agent.escalation_trigger} onChange={e => updateAgent('escalation_trigger', e.target.value)} style={inp} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: 12, color: '#666', cursor: 'pointer' }}>← Back</button>
              <button onClick={generatePrompt} style={{ flex: 2, background: '#C9A84C', color: '#070707', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer' }}>Generate Agent →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 6 }}>GENERATED SYSTEM PROMPT</label>
              <textarea value={agent.system_prompt} onChange={e => updateAgent('system_prompt', e.target.value)} rows={10} style={{ ...inp, resize: 'vertical', fontSize: 12, fontFamily: 'DM Mono, monospace' }} />
            </div>
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: 24 }}>
              <label style={{ color: '#666', fontSize: 12, display: 'block', marginBottom: 8 }}>TEST YOUR AGENT</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={testInput} onChange={e => setTestInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && testAgent()} placeholder="Type a test message..." style={{ ...inp, flex: 1 }} />
                <button onClick={testAgent} disabled={testing || !testInput.trim()} style={{ background: '#141414', border: '1px solid #C9A84C', color: '#C9A84C', borderRadius: 8, padding: '12px 16px', cursor: 'pointer', fontWeight: 600, opacity: testing ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {testing ? 'Testing...' : 'Test'}
                </button>
              </div>
              {testResponse && (
                <div style={{ background: '#141414', borderRadius: 8, padding: '12px 16px', color: '#F0EBE1', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{testResponse}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8, padding: 12, color: '#666', cursor: 'pointer' }}>← Back</button>
              <button onClick={saveAgent} disabled={saving} style={{ flex: 2, background: '#C9A84C', color: '#070707', border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Deploying...' : 'Deploy Agent →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
