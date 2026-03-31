'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'

const SECTORS = [
  { value: '', label: 'Select sector...' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'legal', label: 'Legal' },
  { value: 'finance', label: 'Finance' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'general', label: 'General' },
]

const CHANNELS = ['web', 'whatsapp', 'email', 'sms', 'voice']

interface AgentSpec {
  agent_type: string
  display_name: string
  description: string
  system_prompt: string
  recommended_channels: string[]
  capabilities: string[]
}

export default function AgentBuilderPage() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [sector, setSector] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['web'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ agent: { id: string }; spec: AgentSpec } | null>(null)
  const [deploying, setDeploying] = useState(false)

  function toggleChannel(ch: string) {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  async function handleBuild() {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/forge/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, sector, channels: selectedChannels }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to build agent'); return }
      setResult(json.data)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeploy() {
    if (!result?.agent?.id) return
    setDeploying(true)
    try {
      await fetch(`/api/agents/${result.agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })
      router.push('/dashboard/agents')
    } catch {
      setDeploying(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <Link href="/dashboard/agents" className="inline-flex items-center gap-1.5 text-sm font-sans mb-6" style={{ color: '#6b6b6b' }}>
              <ArrowLeft size={14} />
              Back to Agents
            </Link>

            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.3em] mb-1 font-sans" style={{ color: '#7a6130' }}>Forge</p>
              <h1 className="font-bebas text-4xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>BUILD CUSTOM AGENT</h1>
              <p className="text-sm font-sans mt-1" style={{ color: '#6b6b6b' }}>Describe the agent your business needs</p>
            </div>

            {!result && (
              <div className="space-y-5">
                {/* Description */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. An agent that handles appointment booking for my dental clinic, speaks Urdu and English, collects patient name, phone and preferred time"
                    className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none resize-none"
                    style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
                  />
                </div>

                {/* Sector */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                    Sector
                  </label>
                  <select
                    value={sector}
                    onChange={e => setSector(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-sm font-sans outline-none"
                    style={{ background: '#141414', border: '1px solid #2a2a2a', color: sector ? '#F0EBE1' : '#6b6b6b' }}
                  >
                    {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                {/* Channels */}
                <div>
                  <label className="block text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                    Channels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(ch => {
                      const active = selectedChannels.includes(ch)
                      return (
                        <button
                          key={ch}
                          onClick={() => toggleChannel(ch)}
                          className="px-3 py-1.5 rounded text-xs font-sans capitalize transition-all"
                          style={{
                            background: active ? 'rgba(201,168,76,0.15)' : '#141414',
                            border: active ? '1px solid rgba(201,168,76,0.5)' : '1px solid #2a2a2a',
                            color: active ? '#C9A84C' : '#6b6b6b',
                          }}
                        >
                          {ch}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-lg text-sm font-sans" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                    {error}
                    <button onClick={handleBuild} className="ml-3 underline">Retry</button>
                  </div>
                )}

                <button
                  onClick={handleBuild}
                  disabled={loading || !description.trim()}
                  className="w-full py-3 rounded-lg text-sm font-sans font-medium flex items-center justify-center gap-2 transition-opacity"
                  style={{
                    background: loading || !description.trim() ? '#2a2a2a' : '#C9A84C',
                    color: loading || !description.trim() ? '#6b6b6b' : '#070707',
                    cursor: loading || !description.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                        style={{ borderColor: 'rgba(201,168,76,0.3)', borderTopColor: '#C9A84C' }}
                      />
                      Designing your agent...
                    </>
                  ) : (
                    <>
                      <Wand2 size={15} />
                      Build Agent
                    </>
                  )}
                </button>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                <div className="p-5 rounded-xl" style={{ background: '#141414', border: '1px solid rgba(201,168,76,0.25)' }}>
                  <p className="text-xs uppercase tracking-widest font-sans mb-3" style={{ color: '#C9A84C' }}>Agent Ready</p>
                  <h2 className="font-bebas text-2xl tracking-wider mb-1" style={{ color: '#F0EBE1' }}>{result.spec.display_name}</h2>
                  <p className="text-sm font-sans mb-4" style={{ color: '#6b6b6b' }}>{result.spec.description}</p>
                  <div className="space-y-1">
                    {result.spec.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-sans" style={{ color: '#F0EBE1' }}>
                        <span style={{ color: '#C9A84C' }}>·</span> {cap}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 py-3 rounded-lg text-sm font-sans"
                    style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#6b6b6b' }}
                  >
                    Start Over
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="flex-1 py-3 rounded-lg text-sm font-sans font-medium"
                    style={{ background: '#C9A84C', color: '#070707', opacity: deploying ? 0.6 : 1 }}
                  >
                    {deploying ? 'Deploying...' : 'Deploy This Agent'}
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
