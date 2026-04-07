'use client'

import { useEffect, useState, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Plus, Trash2, ChevronRight, ChevronLeft, X, Play, Pause, FileText, RefreshCw, CheckCircle2, XCircle, Wand2 } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/providers/ToastProvider'
import { AUTOMATION_TEMPLATES } from '@/lib/nexus/automation-templates'
import type { TriggerType, ActionType, AutomationStep } from '@/lib/nexus/automation-engine'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Automation {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger: { type: string; filters?: Record<string, unknown> }
  steps: AutomationStep[]
  status: 'active' | 'paused' | 'draft'
  run_count: number
  last_run_at: string | null
  runs_today: number
  success_rate: number
  created_at: string
}

interface AutomationLog {
  id: string
  trigger_event: string
  steps_executed: unknown[]
  status: 'success' | 'failed'
  error_message: string | null
  duration_ms: number
  created_at: string
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

const TRIGGER_META: Record<string, { icon: string; label: string; desc: string; category: string }> = {
  'conversation.created':    { icon: '💬', label: 'New Conversation',       desc: 'When a contact starts a new conversation',          category: 'Conversations' },
  'conversation.message':    { icon: '✉️', label: 'Message Received',       desc: 'Every time a message is sent or received',          category: 'Conversations' },
  'conversation.resolved':   { icon: '✅', label: 'Conversation Resolved',  desc: 'When a conversation is marked resolved',            category: 'Conversations' },
  'conversation.escalated':  { icon: '⚡', label: 'Conversation Escalated', desc: 'When your agent escalates to human',                category: 'Conversations' },
  'lead.hot_detected':       { icon: '🔥', label: 'Hot Lead Detected',      desc: 'When a contact scores 85+ (ready to convert)',      category: 'Leads' },
  'lead.score_changed':      { icon: '📈', label: 'Lead Score Changed',     desc: 'Whenever a contact\'s lead score updates',          category: 'Leads' },
  'contact.profile_updated': { icon: '👤', label: 'Contact Profile Updated',desc: 'When LYCHO learns new info about a contact',        category: 'Leads' },
  'contact.returning':       { icon: '🔄', label: 'Returning Contact',      desc: 'When a contact comes back after 7+ days',           category: 'Leads' },
  'sentiment.frustrated':    { icon: '😤', label: 'Customer Frustrated',    desc: 'When frustration is detected in a message',         category: 'Sentiment' },
  'sentiment.excited':       { icon: '🤩', label: 'Customer Excited',       desc: 'When excitement or delight is detected',            category: 'Sentiment' },
  'agent.deployed':          { icon: '🚀', label: 'Agent Deployed',         desc: 'When an agent goes live on a channel',              category: 'Agents' },
  'agent.paused':            { icon: '⏸️', label: 'Agent Paused',           desc: 'When an agent is paused',                          category: 'Agents' },
  'agent.error':             { icon: '🚨', label: 'Agent Error',            desc: 'When an agent encounters an error',                 category: 'Agents' },
  'schedule.daily':          { icon: '📅', label: 'Every Day',              desc: 'Runs once daily at a set time',                    category: 'Schedule' },
  'schedule.weekly':         { icon: '📆', label: 'Every Week',             desc: 'Runs once per week on a set day',                  category: 'Schedule' },
}

const ACTION_META: Record<string, { icon: string; label: string; category: string }> = {
  'send_email':     { icon: '📧', label: 'Send Email',              category: 'Notify'  },
  'send_slack':     { icon: '💬', label: 'Send Slack Message',      category: 'Notify'  },
  'send_whatsapp':  { icon: '📱', label: 'Send WhatsApp',           category: 'Notify'  },
  'send_telegram':  { icon: '✈️', label: 'Send Telegram',           category: 'Notify'  },
  'send_to_zapier': { icon: '⚡', label: 'Send to Zapier',          category: 'Connect' },
  'send_to_n8n':    { icon: '🔗', label: 'Send to n8n',             category: 'Connect' },
  'send_to_make':   { icon: '⚙️', label: 'Send to Make',            category: 'Connect' },
  'send_webhook':   { icon: '🌐', label: 'HTTP Webhook',             category: 'Connect' },
  'tag_contact':    { icon: '🏷️', label: 'Tag Contact',             category: 'Manage'  },
  'pause_agent':    { icon: '⏸️', label: 'Pause Agent',             category: 'Manage'  },
  'wait':           { icon: '⏱️', label: 'Wait',                    category: 'Manage'  },
}

const TRIGGER_VARIABLES: Record<string, string[]> = {
  'conversation.message':    ['contact_name', 'message', 'agent_name', 'channel', 'lead_score', 'sentiment'],
  'conversation.created':    ['contact_name', 'channel', 'agent_name', 'conversation_id'],
  'conversation.resolved':   ['contact_name', 'channel', 'conversation_id', 'dashboard_url'],
  'conversation.escalated':  ['contact_name', 'reason', 'conversation_id', 'channel', 'dashboard_url'],
  'lead.hot_detected':       ['contact_name', 'lead_score', 'channel', 'dashboard_url'],
  'lead.score_changed':      ['contact_name', 'lead_score', 'channel'],
  'sentiment.frustrated':    ['contact_name', 'channel', 'message', 'dashboard_url'],
  'sentiment.excited':       ['contact_name', 'channel', 'message'],
  'agent.error':             ['agent_name', 'channel', 'error_message'],
  'agent.deployed':          ['agent_name', 'channel'],
  'agent.paused':            ['agent_name'],
  'schedule.daily':          ['dashboard_url'],
  'schedule.weekly':         ['dashboard_url'],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function makeStepId() {
  return `step-${Math.random().toString(36).slice(2, 8)}`
}

// ─── ActionConfigForm ─────────────────────────────────────────────────────────

function ActionConfigForm({
  type,
  config,
  onChange,
}: {
  type: ActionType
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...config, [k]: e.target.value })

  const inputCls = 'w-full px-3 py-2 rounded text-sm font-sans outline-none'
  const inputStyle = { background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }
  const lbl = (t: string) => (
    <label className="block text-xs font-sans uppercase tracking-widest mb-1" style={{ color: '#6b6b6b' }}>{t}</label>
  )

  switch (type) {
    case 'send_email':
      return (
        <div className="space-y-3">
          <div>{lbl('To')}<input className={inputCls} style={inputStyle} value={String(config.to ?? '')} onChange={f('to')} placeholder="owner@example.com or {{contact_email}}" /></div>
          <div>{lbl('Subject')}<input className={inputCls} style={inputStyle} value={String(config.subject ?? '')} onChange={f('subject')} placeholder="🔥 Hot lead: {{contact_name}}" /></div>
          <div>{lbl('Body (HTML allowed)')}<textarea className={inputCls} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={String(config.body ?? '')} onChange={f('body')} placeholder="{{contact_name}} just scored {{lead_score}}/100" /></div>
        </div>
      )

    case 'send_slack':
      return (
        <div className="space-y-3">
          <div>{lbl('Slack Webhook URL')}<input className={inputCls} style={inputStyle} value={String(config.webhook_url ?? '')} onChange={f('webhook_url')} placeholder="https://hooks.slack.com/services/..." /></div>
          <div>{lbl('Message')}<textarea className={inputCls} style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={String(config.message ?? '')} onChange={f('message')} placeholder="🔥 {{contact_name}} scored {{lead_score}}/100" /></div>
        </div>
      )

    case 'send_to_zapier':
    case 'send_to_n8n':
    case 'send_to_make':
      return (
        <div>{lbl('Webhook URL')}<input className={inputCls} style={inputStyle} value={String(config.webhook_url ?? '')} onChange={f('webhook_url')} placeholder="https://hooks.zapier.com/hooks/catch/..." /></div>
      )

    case 'send_webhook':
      return (
        <div className="space-y-3">
          <div>{lbl('URL')}<input className={inputCls} style={inputStyle} value={String(config.url ?? '')} onChange={f('url')} placeholder="https://api.yourapp.com/webhook" /></div>
          <div>
            {lbl('Method')}
            <select className={inputCls} style={{ ...inputStyle, appearance: 'none' }} value={String(config.method ?? 'POST')} onChange={f('method')}>
              {['POST', 'GET', 'PUT', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      )

    case 'tag_contact':
      return (
        <div>{lbl('Tag Name')}<input className={inputCls} style={inputStyle} value={String(config.tag_name ?? '')} onChange={f('tag_name')} placeholder="hot-lead" /></div>
      )

    case 'wait':
      return (
        <div>{lbl('Seconds')}<input type="number" min={1} max={300} className={inputCls} style={inputStyle} value={String(config.seconds ?? 5)} onChange={f('seconds')} /></div>
      )

    case 'send_whatsapp':
      return (
        <div className="space-y-3">
          <div>{lbl('To (phone number)')}<input className={inputCls} style={inputStyle} value={String(config.to ?? '')} onChange={f('to')} placeholder="+92 300 0000000" /></div>
          <div>{lbl('Message')}<textarea className={inputCls} style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={String(config.message ?? '')} onChange={f('message')} placeholder="{{contact_name}} needs your attention" /></div>
        </div>
      )

    case 'send_telegram':
      return (
        <div className="space-y-3">
          <div>{lbl('Bot Token')}<input className={inputCls} style={inputStyle} value={String(config.bot_token ?? '')} onChange={f('bot_token')} placeholder="1234567890:ABC..." /></div>
          <div>{lbl('Chat ID')}<input className={inputCls} style={inputStyle} value={String(config.chat_id ?? '')} onChange={f('chat_id')} placeholder="-100123456789" /></div>
          <div>{lbl('Message')}<textarea className={inputCls} style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }} value={String(config.message ?? '')} onChange={f('message')} placeholder="🔥 {{contact_name}} is a hot lead!" /></div>
        </div>
      )

    default:
      return <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>No configuration needed for this action.</p>
  }
}

// ─── Step 1: Trigger Picker ────────────────────────────────────────────────────

function TriggerPicker({
  selected,
  onSelect,
}: {
  selected: TriggerType | ''
  onSelect: (t: TriggerType) => void
}) {
  const categories = ['Conversations', 'Leads', 'Sentiment', 'Agents', 'Schedule']

  return (
    <div className="space-y-6">
      {categories.map(cat => {
        const triggers = Object.entries(TRIGGER_META).filter(([, v]) => v.category === cat)
        return (
          <div key={cat}>
            <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {triggers.map(([key, meta]) => {
                const isSelected = selected === key
                return (
                  <button
                    key={key}
                    onClick={() => onSelect(key as TriggerType)}
                    className="text-left p-3 rounded-lg transition-all"
                    style={{
                      background:  isSelected ? 'rgba(201,168,76,0.08)' : '#1c1c1c',
                      border:      isSelected ? '1px solid rgba(201,168,76,0.4)' : '1px solid #2a2a2a',
                      outline:     'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-sm font-sans font-medium" style={{ color: isSelected ? '#C9A84C' : '#F0EBE1' }}>{meta.label}</span>
                    </div>
                    <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{meta.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 2: Action Builder ────────────────────────────────────────────────────

function ActionBuilder({
  steps,
  triggerType,
  onChange,
}: {
  steps: AutomationStep[]
  triggerType: TriggerType | ''
  onChange: (steps: AutomationStep[]) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const actionCategories = ['Notify', 'Connect', 'Manage']
  const variables = TRIGGER_VARIABLES[triggerType] ?? []

  function addStep(type: ActionType) {
    onChange([...steps, { id: makeStepId(), type, config: {} }])
    setPickerOpen(false)
  }

  function updateStep(id: string, config: Record<string, unknown>) {
    onChange(steps.map(s => s.id === id ? { ...s, config } : s))
  }

  function removeStep(id: string) {
    onChange(steps.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Added steps */}
      {steps.map((step, i) => {
        const meta = ACTION_META[step.type]
        return (
          <div key={step.id} className="rounded-lg" style={{ border: '1px solid #2a2a2a', overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1c1c1c', borderBottom: '1px solid #2a2a2a' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                  {i + 1}
                </span>
                <span className="text-base">{meta?.icon ?? '⚙️'}</span>
                <span className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{meta?.label ?? step.type}</span>
              </div>
              <button onClick={() => removeStep(step.id)} style={{ color: '#6b6b6b' }} title="Remove action">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="p-4" style={{ background: '#141414' }}>
              <ActionConfigForm
                type={step.type as ActionType}
                config={step.config}
                onChange={c => updateStep(step.id, c)}
              />
            </div>
          </div>
        )
      })}

      {/* Add action button */}
      {!pickerOpen ? (
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full py-3 rounded-lg text-sm font-sans flex items-center justify-center gap-2 transition-colors"
          style={{ background: 'rgba(201,168,76,0.04)', border: '1px dashed rgba(201,168,76,0.3)', color: '#C9A84C' }}
        >
          <Plus size={15} /> Add Action
        </button>
      ) : (
        <div className="rounded-lg" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
            <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>Choose an action</p>
            <button onClick={() => setPickerOpen(false)} style={{ color: '#6b6b6b' }}><X size={14} /></button>
          </div>
          <div className="p-4 space-y-4">
            {actionCategories.map(cat => (
              <div key={cat}>
                <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>{cat}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(ACTION_META).filter(([, v]) => v.category === cat).map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => addStep(key as ActionType)}
                      className="flex items-center gap-2 p-2.5 rounded text-left transition-colors"
                      style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    >
                      <span>{meta.icon}</span>
                      <span className="text-xs font-sans">{meta.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variables helper */}
      {variables.length > 0 && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)' }}>
          <p className="text-xs font-sans mb-2" style={{ color: '#7a6130' }}>Available variables for this trigger:</p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map(v => (
              <code key={v} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.15)' }}>
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create Automation Modal ───────────────────────────────────────────────────

function CreateAutomationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [tab, setTab]                   = useState<'scratch' | 'template'>('scratch')
  const [step, setStep]                 = useState<1 | 2 | 3>(1)
  const [triggerType, setTriggerType]   = useState<TriggerType | ''>('')
  const [steps, setSteps]               = useState<AutomationStep[]>([])
  const [name, setName]                 = useState('')
  const [description, setDescription]  = useState('')
  const [saving, setSaving]             = useState(false)
  const [templateCat, setTemplateCat]   = useState<string>('all')
  const [dynamicTemplates, setDynamicTemplates] = useState<typeof AUTOMATION_TEMPLATES>([])

  useEffect(() => {
    fetch('/api/nexus/templates')
      .then(r => r.json())
      .then(j => {
        if (j.templates?.length) setDynamicTemplates(j.templates)
      })
      .catch(() => {})
  }, [])

  const allTemplates = [...AUTOMATION_TEMPLATES, ...dynamicTemplates]

  const inputCls = 'w-full px-3 py-2.5 rounded text-sm font-sans outline-none'
  const inputStyle = { background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }

  function applyTemplate(tpl: typeof AUTOMATION_TEMPLATES[0]) {
    setTriggerType(tpl.trigger.type as TriggerType)
    setSteps(tpl.steps as AutomationStep[])
    setName(tpl.name)
    setDescription(tpl.description)
    setTab('scratch')
    setStep(3)
  }

  async function handleSave(status: 'active' | 'draft') {
    if (!triggerType) { toast('Choose a trigger first', 'error'); return }
    if (!name.trim()) { toast('Enter a name for your automation', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           name.trim(),
          description:    description.trim(),
          trigger_config: { type: triggerType },
          steps,
          status,
        }),
      })
      const j = await res.json()
      if (!res.ok) { toast(j.error ?? 'Failed to create automation', 'error'); return }
      toast(`Automation "${name}" created!`, 'success')
      onCreated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const triggerMeta = triggerType ? TRIGGER_META[triggerType] : null

  const cats = ['all', 'leads', 'conversations', 'sentiment', 'agents', 'schedule']
  const filteredTemplates = templateCat === 'all'
    ? allTemplates
    : allTemplates.filter(t => t.category === templateCat)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div>
            <h2 className="font-bebas text-2xl tracking-wider" style={{ color: '#C9A84C' }}>Create Automation</h2>
            {tab === 'scratch' && (
              <div className="flex items-center gap-2 mt-1">
                {([1, 2, 3] as const).map(n => (
                  <div key={n} className="flex items-center gap-1">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: step >= n ? 'rgba(201,168,76,0.15)' : '#2a2a2a',
                        color:      step >= n ? '#C9A84C' : '#6b6b6b',
                        border:     step === n ? '1px solid #C9A84C' : '1px solid transparent',
                      }}
                    >{n}</div>
                    {n < 3 && <div className="w-6 h-px" style={{ background: step > n ? '#C9A84C' : '#2a2a2a' }} />}
                  </div>
                ))}
                <span className="text-xs font-sans ml-2" style={{ color: '#6b6b6b' }}>
                  {step === 1 ? 'Choose Trigger' : step === 2 ? 'Add Actions' : 'Review & Save'}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ color: '#6b6b6b' }}><X size={18} /></button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {(['scratch', 'template'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded text-sm font-sans transition-colors"
              style={{
                background: tab === t ? 'rgba(201,168,76,0.08)' : 'transparent',
                color:      tab === t ? '#C9A84C' : '#6b6b6b',
                border:     tab === t ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
              }}
            >
              {t === 'scratch' ? 'Build from scratch' : 'Start from template'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Templates tab ── */}
          {tab === 'template' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {cats.map(c => (
                  <button
                    key={c}
                    onClick={() => setTemplateCat(c)}
                    className="px-3 py-1 rounded text-xs font-sans transition-colors capitalize"
                    style={{
                      background: templateCat === c ? 'rgba(201,168,76,0.1)' : '#1c1c1c',
                      color:      templateCat === c ? '#C9A84C' : '#6b6b6b',
                      border:     templateCat === c ? '1px solid rgba(201,168,76,0.25)' : '1px solid #2a2a2a',
                    }}
                  >{c}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTemplates.map(tpl => {
                  const tm = TRIGGER_META[tpl.trigger.type]
                  return (
                    <div key={tpl.id} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{tm?.icon ?? '⚙️'}</span>
                        <p className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{tpl.name}</p>
                      </div>
                      <p className="text-xs font-sans mb-3" style={{ color: '#6b6b6b' }}>{tpl.description}</p>
                      <Button variant="secondary" size="sm" onClick={() => applyTemplate(tpl)}>Use Template</Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Build from scratch ── */}
          {tab === 'scratch' && (
            <>
              {step === 1 && (
                <TriggerPicker
                  selected={triggerType}
                  onSelect={t => setTriggerType(t)}
                />
              )}

              {step === 2 && (
                <ActionBuilder
                  steps={steps}
                  triggerType={triggerType as TriggerType}
                  onChange={setSteps}
                />
              )}

              {step === 3 && (
                <div className="space-y-5">
                  {/* Summary */}
                  {triggerMeta && (
                    <div className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                      <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Trigger</p>
                      <div className="flex items-center gap-2">
                        <span>{triggerMeta.icon}</span>
                        <span className="text-sm font-sans font-medium" style={{ color: '#F0EBE1' }}>{triggerMeta.label}</span>
                      </div>
                    </div>
                  )}
                  {steps.length > 0 && (
                    <div className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                      <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>Actions ({steps.length})</p>
                      <div className="space-y-1">
                        {steps.map((s, i) => {
                          const m = ACTION_META[s.type]
                          return (
                            <div key={s.id} className="flex items-center gap-2 text-sm font-sans" style={{ color: '#F0EBE1' }}>
                              <span className="text-xs" style={{ color: '#6b6b6b' }}>{i + 1}.</span>
                              <span>{m?.icon ?? '⚙️'}</span>
                              <span>{m?.label ?? s.type}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-sans uppercase tracking-widest mb-1.5" style={{ color: '#6b6b6b' }}>Automation Name *</label>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Hot Lead → Slack Alert"
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-sans uppercase tracking-widest mb-1.5" style={{ color: '#6b6b6b' }}>Description (optional)</label>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Notify team when a hot lead comes in"
                      onFocus={e => (e.currentTarget.style.borderColor = '#C9A84C')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {tab === 'scratch' && (
          <div className="flex items-center justify-between px-6 py-4 shrink-0 gap-3" style={{ borderTop: '1px solid #2a2a2a' }}>
            <div>
              {step > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} className="gap-1">
                  <ChevronLeft size={14} /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 3 && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={step === 1 && !triggerType}
                  onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                  className="gap-1"
                >
                  Continue <ChevronRight size={14} />
                </Button>
              )}
              {step === 3 && (
                <>
                  <Button variant="ghost" size="sm" disabled={saving} onClick={() => handleSave('draft')}>
                    Save as Draft
                  </Button>
                  <Button variant="primary" size="sm" disabled={saving || !name.trim()} onClick={() => handleSave('active')}>
                    {saving ? 'Activating…' : 'Activate Automation'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Automation Logs Modal ─────────────────────────────────────────────────────

function AutomationLogsModal({
  automationId,
  automationName,
  onClose,
}: {
  automationId: string
  automationName: string
  onClose: () => void
}) {
  const [logs, setLogs]   = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/automations/${automationId}/logs?page=${page}`)
      .then(r => r.json())
      .then(j => {
        setLogs(j.data?.logs ?? [])
        setTotal(j.data?.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [automationId, page])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl" style={{ background: '#0d0d0d', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <div>
            <h2 className="font-bebas text-xl tracking-wider" style={{ color: '#C9A84C' }}>Run Logs</h2>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{automationName}</p>
          </div>
          <button onClick={onClose} style={{ color: '#6b6b6b' }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} width="100%" height="44px" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={32} className="mx-auto mb-3 opacity-20" style={{ color: '#6b6b6b' }} />
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No runs yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  {['Run Time', 'Trigger', 'Steps', 'Status', 'Duration'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b', background: '#141414' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <>
                    <tr
                      key={log.id}
                      className="cursor-pointer transition-colors"
                      style={{ background: i % 2 === 0 ? '#0d0d0d' : '#111', borderBottom: '1px solid #1a1a1a' }}
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-xs font-sans" style={{ color: '#F0EBE1' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: '#6b6b6b' }}>{log.trigger_event}</td>
                      <td className="px-4 py-3 text-xs font-sans" style={{ color: '#6b6b6b' }}>
                        {(log.steps_executed as unknown[]).length} steps
                      </td>
                      <td className="px-4 py-3">
                        {log.status === 'success'
                          ? <span className="flex items-center gap-1 text-xs" style={{ color: '#4ade80' }}><CheckCircle2 size={12} /> success</span>
                          : <span className="flex items-center gap-1 text-xs" style={{ color: '#f87171' }}><XCircle size={12} /> failed</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs font-sans" style={{ color: '#6b6b6b' }}>
                        {log.duration_ms != null ? `${log.duration_ms}ms` : '—'}
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr key={`${log.id}-detail`} style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
                        <td colSpan={5} className="px-4 py-3">
                          {log.error_message && (
                            <p className="text-xs font-sans mb-2 px-2 py-1 rounded" style={{ background: 'rgba(248,113,113,0.06)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}>
                              {log.error_message}
                            </p>
                          )}
                          <pre className="text-xs font-mono overflow-x-auto" style={{ color: '#6b6b6b' }}>
                            {JSON.stringify(log.steps_executed, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderTop: '1px solid #2a2a2a' }}>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{total} total runs</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Automation Card ───────────────────────────────────────────────────────────

function AutomationCard({
  automation,
  onToggle,
  onDelete,
  onViewLogs,
}: {
  automation: Automation
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onViewLogs: (id: string, name: string) => void
}) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const tm = TRIGGER_META[automation.trigger_type]
  const isActive = automation.status === 'active'

  async function handleToggle() {
    setToggling(true)
    await onToggle(automation.id)
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${automation.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await onDelete(automation.id)
    setDeleting(false)
  }

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-4"
      style={{
        background:  '#1c1c1c',
        border:      `1px solid ${isActive ? 'rgba(201,168,76,0.15)' : '#2a2a2a'}`,
        borderLeft:  `3px solid ${isActive ? '#C9A84C' : '#2a2a2a'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{tm?.icon ?? '⚙️'}</span>
            <p className="text-sm font-sans font-semibold truncate" style={{ color: '#F0EBE1' }}>{automation.name}</p>
          </div>
          {automation.description && (
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{automation.description}</p>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={isActive ? 'Pause' : 'Activate'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-sans transition-colors shrink-0"
          style={{
            background: isActive ? 'rgba(74,222,128,0.08)' : 'rgba(107,107,107,0.1)',
            color:      isActive ? '#4ade80' : '#6b6b6b',
            border:     isActive ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(107,107,107,0.2)',
          }}
        >
          {isActive ? <><Play size={11} /> Active</> : <><Pause size={11} /> Paused</>}
        </button>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-sans px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.06)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.15)' }}>
          {tm?.label ?? automation.trigger_type}
        </span>
        <span className="text-xs font-sans px-2 py-0.5 rounded" style={{ background: '#141414', color: '#6b6b6b', border: '1px solid #2a2a2a' }}>
          {automation.steps.length} step{automation.steps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Runs',    value: String(automation.run_count) },
          { label: 'Today',         value: String(automation.runs_today) },
          { label: 'Success Rate',  value: `${automation.success_rate}%` },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded" style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-sm font-sans font-bold" style={{ color: '#F0EBE1' }}>{s.value}</p>
            <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Last run + actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>
          Last run: <span style={{ color: '#F0EBE1' }}>{timeAgo(automation.last_run_at)}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onViewLogs(automation.id, automation.name)}
            className="text-xs font-sans px-2.5 py-1.5 rounded transition-colors"
            style={{ background: '#141414', color: '#6b6b6b', border: '1px solid #2a2a2a' }}
          >
            Logs
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-sans px-2.5 py-1.5 rounded transition-colors"
            style={{ background: '#141414', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NexusPage() {
  const router = useRouter()
  const { toast } = useToast()
  const uid = useId()
  void uid

  const [automations, setAutomations]   = useState<Automation[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [logsModal, setLogsModal]       = useState<{ id: string; name: string } | null>(null)
  const [businessName, setBusinessName] = useState('Your Business')
  const [planStatus, setPlanStatus]     = useState<string | null>(null)

  const fetchAutomations = useCallback(async () => {
    try {
      const res = await fetch('/api/automations')
      if (res.status === 401) { router.push('/login'); return }
      const j = await res.json()
      setAutomations(j.data ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [router])

  useEffect(() => {
    // Auth check + profile
    fetch('/api/me').then(r => r.json()).then(j => {
      if (j.error === 'Unauthorized') { router.push('/login'); return }
      setBusinessName(j.data?.tenants?.business_name ?? 'Your Business')
      setPlanStatus(j.data?.tenants?.plan_status ?? null)
    })
    fetchAutomations()
  }, [router, fetchAutomations])

  async function handleToggle(id: string) {
    const res = await fetch(`/api/automations/${id}/toggle`, { method: 'POST' })
    const j = await res.json()
    if (!res.ok) { toast(j.error ?? 'Failed', 'error'); return }
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: j.data?.status ?? a.status } : a))
    toast(`Automation ${j.data?.status === 'active' ? 'activated' : 'paused'}`, 'success')
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Failed to delete', 'error'); return }
    setAutomations(prev => prev.filter(a => a.id !== id))
    toast('Automation deleted', 'success')
  }

  const activeCount  = automations.filter(a => a.status === 'active').length
  const runsToday    = automations.reduce((s, a) => s + a.runs_today, 0)
  const totalRuns    = automations.reduce((s, a) => s + a.run_count, 0)
  const avgSuccess   = automations.length > 0
    ? Math.round(automations.reduce((s, a) => s + a.success_rate, 0) / automations.length)
    : 100

  return (
    <div className="flex" style={{ background: '#070707', minHeight: '100vh' }}>
      <DashboardSidebar />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar
          businessName={businessName}
          initials={businessName.charAt(0).toUpperCase()}
          planStatus={planStatus}
          trialDays={0}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-sans uppercase tracking-[0.3em] mb-1" style={{ color: '#7a6130' }}>Automation Engine</p>
              <h1 className="font-bebas text-5xl tracking-[0.15em] leading-none" style={{ color: '#C9A84C' }}>THE NEXUS</h1>
              <p className="text-sm font-sans mt-2" style={{ color: '#6b6b6b' }}>Automate everything. Connect anywhere.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/dashboard/nexus/canvas">
                <Button variant="ghost" className="gap-2" style={{ color: '#6b6b6b', border: '1px solid #2a2a2a' }}>
                  Visual Canvas
                </Button>
              </Link>
              <Link href="/dashboard/nexus/builder">
                <Button variant="ghost" className="gap-2" style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}>
                  <Wand2 size={14} /> Build with AI
                </Button>
              </Link>
              <Button variant="primary" onClick={() => setModalOpen(true)} className="gap-2">
                <Zap size={15} /> Create Automation
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Automations', value: String(automations.length) },
              { label: 'Active',            value: String(activeCount), color: '#4ade80' },
              { label: 'Runs Today',        value: String(runsToday) },
              { label: 'Success Rate',      value: `${avgSuccess}%`,  color: avgSuccess >= 90 ? '#4ade80' : avgSuccess >= 70 ? '#fbbf24' : '#f87171' },
            ].map(s => (
              <div key={s.label} className="rounded-lg p-5" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <p className="text-xs font-sans uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>{s.label}</p>
                <p className="font-bebas text-4xl tracking-wider leading-none" style={{ color: s.color ?? '#F0EBE1' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Templates quick-start strip */}
          {automations.length === 0 && !loading && (
            <section>
              <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: '#6b6b6b' }}>
                Quick Start — Popular Templates
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {AUTOMATION_TEMPLATES.slice(0, 5).map(tpl => {
                  const tm = TRIGGER_META[tpl.trigger.type]
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setModalOpen(true)}
                      className="flex-shrink-0 rounded-lg p-4 text-left w-52 transition-colors"
                      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                    >
                      <p className="text-lg mb-2">{tm?.icon ?? '⚙️'}</p>
                      <p className="text-sm font-sans font-medium mb-1" style={{ color: '#F0EBE1' }}>{tpl.name}</p>
                      <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>{tpl.description}</p>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {/* Automation list */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bebas text-2xl tracking-[0.2em]" style={{ color: '#C9A84C' }}>Your Automations</h2>
              <button
                onClick={fetchAutomations}
                className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded transition-colors"
                style={{ background: '#1c1c1c', color: '#6b6b6b', border: '1px solid #2a2a2a' }}
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} width="100%" height="220px" />)}
              </div>
            ) : automations.length === 0 ? (
              <div
                className="rounded-lg p-12 flex flex-col items-center justify-center text-center"
                style={{ background: '#1c1c1c', border: '1px dashed #2a2a2a', minHeight: '200px' }}
              >
                <Zap size={36} className="mb-4 opacity-20" style={{ color: '#C9A84C' }} />
                <p className="text-sm font-sans mb-1" style={{ color: 'rgba(240,235,225,0.6)' }}>No automations yet.</p>
                <p className="text-xs font-sans mb-5" style={{ color: '#6b6b6b' }}>
                  Create your first automation to connect LYCHO to your other tools.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)} className="gap-2">
                  <Plus size={13} /> Create Automation
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {automations.map(a => (
                  <AutomationCard
                    key={a.id}
                    automation={a}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onViewLogs={(id, name) => setLogsModal({ id, name })}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Total runs callout */}
          {totalRuns > 0 && (
            <div
              className="rounded-lg p-5 flex items-center justify-between gap-4"
              style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderLeft: '3px solid #C9A84C' }}
            >
              <div>
                <p className="text-xs font-sans uppercase tracking-widest mb-1" style={{ color: '#6b6b6b' }}>THE NEXUS HAS EXECUTED</p>
                <p className="font-bebas text-4xl tracking-wider leading-none" style={{ color: '#C9A84C' }}>{totalRuns.toLocaleString()} AUTOMATION RUNS</p>
              </div>
              <Zap size={40} style={{ color: '#C9A84C', opacity: 0.3, flexShrink: 0 }} />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {modalOpen && (
        <CreateAutomationModal
          onClose={() => setModalOpen(false)}
          onCreated={fetchAutomations}
        />
      )}
      {logsModal && (
        <AutomationLogsModal
          automationId={logsModal.id}
          automationName={logsModal.name}
          onClose={() => setLogsModal(null)}
        />
      )}
    </div>
  )
}
