'use client'

import { useState, useCallback } from 'react'
import { X, Check, ChevronRight, ChevronLeft, Zap } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChannelIcon } from '@/components/ui/ChannelIcon'
import { useToast } from '@/components/providers/ToastProvider'
import { AGENT_CATALOGUE, getSectorAgents } from '@/lib/agents-catalogue'
import type { CatalogueAgent } from '@/lib/agents-catalogue'

interface DeployAgentModalProps {
  open: boolean
  onClose: () => void
  tenantSector?: string | null
  onDeployed: () => void
}

function AgentIcon({ name, size = 20 }: { name: string; size?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as Record<string, any>)[name] as React.ElementType | undefined
  if (!Icon) return null
  return <Icon size={size} />
}

const ALL_CHANNELS = ['whatsapp', 'email', 'web', 'sms', 'voice', 'instagram', 'facebook']

export function DeployAgentModal({ open, onClose, tenantSector, onDeployed }: DeployAgentModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<CatalogueAgent | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [channels, setChannels] = useState<string[]>([])
  const [deploying, setDeploying] = useState(false)

  const sectorAgents = getSectorAgents(tenantSector)

  const reset = useCallback(() => {
    setStep(1)
    setSelected(null)
    setDisplayName('')
    setChannels([])
    setDeploying(false)
  }, [])

  function handleClose() {
    reset()
    onClose()
  }

  function handleSelect(agent: CatalogueAgent) {
    setSelected(agent)
    setDisplayName(agent.name)
    setChannels(agent.channels ?? [])
  }

  function toggleChannel(ch: string) {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )
  }

  async function handleDeploy() {
    if (!selected) return
    setDeploying(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_type: selected.type,
          display_name: displayName,
          channels,
          config: {},
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error ?? 'Failed to deploy agent', 'error')
        return
      }
      toast(`${displayName} deployed successfully!`, 'success')
      handleClose()
      onDeployed()
    } catch {
      toast('Network error — please try again', 'error')
    } finally {
      setDeploying(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div
        className="relative flex flex-col w-full mx-4 shadow-2xl"
        style={{
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          maxWidth: '700px',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid #2a2a2a' }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] mb-0.5 font-sans" style={{ color: '#7a6130' }}>
              Deploy New Agent
            </p>
            <h2 className="font-bebas text-2xl tracking-[0.15em]" style={{ color: '#C9A84C' }}>
              {step === 1 ? 'Choose Agent Type' : step === 2 ? 'Configure Agent' : 'Confirm & Deploy'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Step dots */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: s === step ? '#C9A84C' : s < step ? 'rgba(201,168,76,0.4)' : '#2a2a2a',
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleClose}
              style={{ color: '#6b6b6b' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#F0EBE1')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#6b6b6b')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Step 1: Choose ── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Sector agents */}
              {sectorAgents.length > 0 && (
                <section>
                  <p className="text-xs uppercase tracking-[0.25em] mb-3 font-sans font-medium" style={{ color: '#C9A84C' }}>
                    Recommended for Your Sector
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sectorAgents.map(a => (
                      <CatalogueCard key={a.type} agent={a} selected={selected?.type === a.type} onSelect={handleSelect} />
                    ))}
                  </div>
                </section>
              )}

              {/* Core agents */}
              <section>
                <p className="text-xs uppercase tracking-[0.25em] mb-3 font-sans font-medium" style={{ color: '#C9A84C' }}>
                  Core Agents
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AGENT_CATALOGUE.core.map(a => (
                    <CatalogueCard key={a.type} agent={a} selected={selected?.type === a.type} onSelect={handleSelect} />
                  ))}
                </div>
              </section>

              {/* Business Suite */}
              <section>
                <p className="text-xs uppercase tracking-[0.25em] mb-3 font-sans font-medium" style={{ color: '#C9A84C' }}>
                  Business Suite
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AGENT_CATALOGUE.business_suite.map(a => (
                    <CatalogueCard key={a.type} agent={a} selected={selected?.type === a.type} onSelect={handleSelect} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ── Step 2: Configure ── */}
          {step === 2 && selected && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2 font-sans" style={{ color: '#6b6b6b' }}>
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded text-sm font-sans outline-none transition-all"
                  style={{
                    background: '#1c1c1c',
                    border: '1px solid #2a2a2a',
                    color: '#F0EBE1',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest mb-3 font-sans" style={{ color: '#6b6b6b' }}>
                  Channels
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CHANNELS.map(ch => {
                    const active = channels.includes(ch)
                    return (
                      <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className="flex items-center gap-2 px-3 py-2 rounded text-xs font-sans transition-all"
                        style={{
                          background: active ? 'rgba(201,168,76,0.08)' : '#1c1c1c',
                          border: `1px solid ${active ? '#C9A84C' : '#2a2a2a'}`,
                          color: active ? '#C9A84C' : '#6b6b6b',
                        }}
                      >
                        <ChannelIcon channel={ch} size={14} />
                        <span className="capitalize">{ch}</span>
                        {active && <Check size={11} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && selected && (
            <div className="space-y-5">
              <div
                className="rounded-lg p-5 space-y-3"
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: '#C9A84C', opacity: 0.7 }}>
                    <AgentIcon name={selected.icon} size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-sans font-semibold" style={{ color: '#F0EBE1' }}>{displayName}</p>
                    <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{selected.type}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest mb-2 font-sans" style={{ color: '#6b6b6b' }}>Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {channels.map(ch => (
                      <ChannelIcon key={ch} channel={ch} size={16} showLabel />
                    ))}
                    {channels.length === 0 && (
                      <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>No channels selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Estimated value */}
              <div
                className="rounded-lg p-4 flex items-start gap-3"
                style={{
                  background: 'rgba(201,168,76,0.04)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderLeft: '3px solid #C9A84C',
                }}
              >
                <Zap size={16} style={{ color: '#C9A84C', opacity: 0.7 }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-widest mb-0.5 font-sans" style={{ color: '#6b6b6b' }}>
                    Estimated Monthly Value
                  </p>
                  <p className="font-bebas text-2xl tracking-wider" style={{ color: '#C9A84C' }}>
                    PKR 45,000 – 120,000
                  </p>
                  <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>
                    This agent typically delivers PKR 45,000–120,000 in monthly value
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid #2a2a2a' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 1 ? handleClose() : setStep(s => s - 1)}
          >
            <ChevronLeft size={14} className="mr-1" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={step === 1 && !selected}
              onClick={() => setStep(s => s + 1)}
            >
              Next
              <ChevronRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={deploying || !displayName}
              onClick={handleDeploy}
            >
              {deploying ? 'Deploying…' : 'Deploy Agent'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function CatalogueCard({
  agent,
  selected,
  onSelect,
}: {
  agent: CatalogueAgent
  selected: boolean
  onSelect: (a: CatalogueAgent) => void
}) {
  return (
    <button
      onClick={() => onSelect(agent)}
      className="flex items-start gap-3 p-3 rounded-lg text-left transition-all w-full"
      style={{
        background: selected ? 'rgba(201,168,76,0.06)' : '#1c1c1c',
        border: `1px solid ${selected ? '#C9A84C' : '#2a2a2a'}`,
      }}
    >
      <span
        className="shrink-0 mt-0.5"
        style={{ color: selected ? '#C9A84C' : '#6b6b6b', opacity: selected ? 1 : 0.6 }}
      >
        <AgentIcon name={agent.icon} size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>
            {agent.name}
          </p>
          <span
            className="shrink-0 text-xs font-sans px-1.5 py-0.5 rounded"
            style={
              agent.status === 'available'
                ? { background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                : { background: 'rgba(107,107,107,0.1)', color: '#6b6b6b', border: '1px solid rgba(107,107,107,0.2)' }
            }
          >
            {agent.status === 'available' ? 'Available' : 'Coming Soon'}
          </span>
        </div>
        <p className="text-xs font-sans mt-0.5 leading-snug" style={{ color: '#6b6b6b' }}>
          {agent.description}
        </p>
      </div>
      {selected && (
        <Check size={14} className="shrink-0 mt-1" style={{ color: '#C9A84C' }} />
      )}
    </button>
  )
}
