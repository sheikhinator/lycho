'use client'

import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Hammer, Zap, Lock, Check, AlertCircle } from 'lucide-react'

const SECTORS = ['Healthcare','Legal','Finance','Real Estate','Education','Retail','Logistics','HR','Marketing','Customer Support','Other']
const CHANNELS = ['whatsapp','email','web_widget','sms','telegram','slack']

interface ForgedAgent {
  id: string
  display_name: string
  agent_type: string
  config: {
    description?: string
    sector_tags?: string[]
    use_case_examples?: string[]
    why_novel?: string
    estimated_value_pkr?: number
  }
}

export default function ForgePage() {
  const [description, setDescription] = useState('')
  const [sector, setSector]           = useState('')
  const [channels, setChannels]       = useState<string[]>(['whatsapp', 'email'])
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<ForgedAgent | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [planBlocked, setPlanBlocked] = useState(false)

  function toggleChannel(ch: string) {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  async function handleForge() {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setPlanBlocked(false)

    try {
      const res = await fetch('/api/forge/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), sector: sector || undefined, channels }),
      })
      const json = await res.json()

      if (res.status === 403 && json.code === 'PLAN_REQUIRED') {
        setPlanBlocked(true)
        return
      }
      if (!res.ok) {
        setError(json.error ?? 'Failed to forge agent. Please try again.')
        return
      }
      setResult(json.data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070707' }}>
      <DashboardSidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', marginLeft: '240px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hammer size={20} color="#C9A84C" />
            </div>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', color: '#F0EBE1', letterSpacing: '0.05em', margin: 0 }}>
              THE FORGE
            </h1>
          </div>
          <p style={{ color: '#6b6b6b', fontSize: '14px', fontFamily: 'sans-serif', margin: 0 }}>
            Describe the agent you need. Claude builds it. Deployed in seconds.
          </p>
        </div>

        {/* Plan gate */}
        {planBlocked && (
          <div style={{ marginBottom: '24px', padding: '20px 24px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Lock size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ color: '#f87171', fontSize: '14px', fontFamily: 'sans-serif', fontWeight: 600, margin: '0 0 4px' }}>Business or Enterprise plan required</p>
              <p style={{ color: '#6b6b6b', fontSize: '13px', fontFamily: 'sans-serif', margin: 0 }}>
                The Forge is available on Business (PKR 59,900/mo) and Enterprise plans. Upgrade to create unlimited custom agents.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px', maxWidth: result ? '100%' : '680px' }}>
          {/* Builder */}
          <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '28px' }}>
            <p style={{ color: '#C9A84C', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>Agent Brief</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#a0a0a0', fontSize: '12px', fontFamily: 'sans-serif', display: 'block', marginBottom: '8px' }}>Describe what this agent should do *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. An agent that handles patient appointment bookings for a private clinic in Lahore, speaks Urdu and English, collects symptoms, sends confirmation via WhatsApp..."
                rows={5}
                style={{ width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px', color: '#F0EBE1', fontSize: '13px', fontFamily: 'sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#a0a0a0', fontSize: '12px', fontFamily: 'sans-serif', display: 'block', marginBottom: '8px' }}>Sector (optional)</label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                style={{ width: '100%', background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 12px', color: sector ? '#F0EBE1' : '#6b6b6b', fontSize: '13px', fontFamily: 'sans-serif', outline: 'none' }}
              >
                <option value="">Select sector…</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ color: '#a0a0a0', fontSize: '12px', fontFamily: 'sans-serif', display: 'block', marginBottom: '10px' }}>Channels</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CHANNELS.map(ch => (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontFamily: 'sans-serif',
                      cursor: 'pointer',
                      border: channels.includes(ch) ? '1px solid rgba(201,168,76,0.6)' : '1px solid #2a2a2a',
                      background: channels.includes(ch) ? 'rgba(201,168,76,0.1)' : '#1c1c1c',
                      color: channels.includes(ch) ? '#C9A84C' : '#6b6b6b',
                    }}
                  >
                    {ch.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={14} color="#f87171" />
                <p style={{ color: '#f87171', fontSize: '13px', fontFamily: 'sans-serif', margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={handleForge}
              disabled={loading || !description.trim()}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '10px',
                background: loading || !description.trim() ? '#2a2a2a' : '#C9A84C',
                color: loading || !description.trim() ? '#6b6b6b' : '#070707',
                fontFamily: 'sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                border: 'none',
                cursor: loading || !description.trim() ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-flex', gap: '3px' }}>
                    {[0, 150, 300].map(d => (
                      <span key={d} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6b6b6b', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${d}ms infinite` }} />
                    ))}
                  </span>
                  Forging agent…
                </>
              ) : (
                <><Hammer size={16} />Forge Agent</>
              )}
            </button>
            <p style={{ color: '#4a4a4a', fontSize: '11px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '8px' }}>
              Claude will design and deploy a custom agent for your account
            </p>
          </div>

          {/* Result */}
          {result && (
            <div style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '16px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={16} color="#C9A84C" />
                </div>
                <div>
                  <p style={{ color: '#C9A84C', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Agent Forged</p>
                  <p style={{ color: '#F0EBE1', fontSize: '16px', fontFamily: 'sans-serif', fontWeight: 600, margin: '2px 0 0' }}>{result.display_name}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Type</p>
                  <p style={{ color: '#F0EBE1', fontSize: '13px', fontFamily: 'monospace', background: '#1c1c1c', padding: '6px 10px', borderRadius: '6px', margin: 0 }}>{result.agent_type}</p>
                </div>

                {result.config?.estimated_value_pkr ? (
                  <div>
                    <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Estimated Value</p>
                    <p style={{ color: '#C9A84C', fontSize: '18px', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em', margin: 0 }}>
                      PKR {result.config.estimated_value_pkr.toLocaleString('en-PK')}/mo
                    </p>
                  </div>
                ) : null}

                {result.config?.why_novel && (
                  <div>
                    <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Why This Agent</p>
                    <p style={{ color: '#a0a0a0', fontSize: '13px', fontFamily: 'sans-serif', lineHeight: 1.6, margin: 0 }}>{result.config.why_novel}</p>
                  </div>
                )}

                {result.config?.use_case_examples?.length ? (
                  <div>
                    <p style={{ color: '#6b6b6b', fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Use Cases</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {result.config.use_case_examples.map((ex, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <Zap size={12} color="#C9A84C" style={{ flexShrink: 0, marginTop: '3px' }} />
                          <p style={{ color: '#a0a0a0', fontSize: '12px', fontFamily: 'sans-serif', margin: 0, lineHeight: 1.5 }}>{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <a
                  href={`/dashboard/agents/${result.id}`}
                  style={{ display: 'block', width: '100%', padding: '12px', borderRadius: '10px', background: '#C9A84C', color: '#070707', fontFamily: 'sans-serif', fontWeight: 700, fontSize: '14px', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box', marginTop: '4px' }}
                >
                  Configure Agent →
                </a>
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }`}</style>
      </main>
    </div>
  )
}
