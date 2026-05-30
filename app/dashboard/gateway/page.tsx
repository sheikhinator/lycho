'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Key, Plus, Copy, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function GatewayPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [form, setForm] = useState({ label: '', rateLimit: '60', expiresIn: '30' })
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => { fetchKeys() }, [])

  async function fetchKeys() {
    setLoading(true)
    try {
      const res = await fetch('/api/gateway/keys')
      const data = await res.json()
      setKeys(data.keys || [])
    } catch {} finally { setLoading(false) }
  }

  async function createKey() {
    if (!form.label.trim()) return
    setCreating(true)
    setNewKey('')
    try {
      const res = await fetch('/api/gateway/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label,
          rateLimitPerMinute: parseInt(form.rateLimit),
          expiresInDays: parseInt(form.expiresIn) || undefined,
        }),
      })
      const data = await res.json()
      if (data.key) {
        setNewKey(data.key)
        await fetchKeys()
      }
    } catch {} finally { setCreating(false) }
  }

  async function revokeKey(keyId: string) {
    try {
      await fetch('/api/gateway/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      })
      await fetchKeys()
    } catch {}
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Key size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>API Gateway</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Public REST API for third-party integration with LYCHO agents</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all"
              style={{ background: '#A78BFA', color: '#070707' }}
            >
              <Plus size={14} />
              New Key
            </button>
          </div>

          {showCreate && (
            <div className="rounded-lg p-6 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <h2 className="text-sm font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>Create API Key</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Label</label>
                  <input
                    value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    placeholder="Production API Key"
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none"
                    style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Rate Limit (req/min)</label>
                  <input
                    value={form.rateLimit}
                    onChange={e => setForm({ ...form, rateLimit: e.target.value })}
                    type="number"
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none"
                    style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-sans uppercase tracking-widest block mb-1" style={{ color: '#6b6b6b' }}>Expires (days)</label>
                  <input
                    value={form.expiresIn}
                    onChange={e => setForm({ ...form, expiresIn: e.target.value })}
                    type="number"
                    className="w-full px-3 py-2 rounded-lg text-xs font-sans outline-none"
                    style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }}
                  />
                </div>
              </div>
              <button
                onClick={createKey}
                disabled={creating || !form.label.trim()}
                className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all"
                style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}
              >
                {creating ? <Loader2 className="animate-spin inline" size={14} /> : 'Generate Key'}
              </button>

              {newKey && (
                <div className="mt-4 p-3 rounded-lg flex items-center justify-between" style={{ background: '#166534', border: '1px solid #22c55e40' }}>
                  <div>
                    <div className="text-xs font-sans flex items-center gap-2" style={{ color: '#4ade80' }}>
                      <CheckCircle size={12} />
                      Key generated — copy it now, it won't be shown again
                    </div>
                    <code className="text-xs font-mono mt-1 block" style={{ color: '#F0EBE1' }}>{newKey}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(newKey, 'new')}
                    className="p-2 rounded-lg transition-all"
                    style={{ background: '#166534' }}
                  >
                    {copied === 'new' ? <CheckCircle size={14} style={{ color: '#4ade80' }} /> : <Copy size={14} style={{ color: '#4ade80' }} />}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <div className="p-4 border-b" style={{ borderColor: '#2a2a2a' }}>
              <h2 className="text-xs font-sans uppercase tracking-widest" style={{ color: '#6b6b6b' }}>API Keys ({keys.length})</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin" size={20} style={{ color: '#A78BFA' }} />
              </div>
            ) : keys.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No API keys yet. Create one to start using the gateway.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
                {keys.map((key: any) => (
                  <div key={key.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{ color: key.active ? '#4ade80' : '#ef4444' }}>
                        {key.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      </div>
                      <div>
                        <div className="text-sm font-sans flex items-center gap-2" style={{ color: '#F0EBE1' }}>
                          {key.label}
                          <code className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#070707', color: '#6b6b6b' }}>{key.key_prefix}...</code>
                        </div>
                        <div className="text-[10px] font-sans mt-0.5" style={{ color: '#6b6b6b' }}>
                          {key.rate_limit_per_minute} req/min · Created {new Date(key.created_at).toLocaleDateString()}
                          {key.last_used_at ? ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}` : ''}
                          {key.expires_at ? ` · Expires ${new Date(key.expires_at).toLocaleDateString()}` : ' · No expiry'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="p-2 rounded-lg transition-all hover:opacity-70"
                      style={{ color: '#6b6b6b' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg p-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <h2 className="text-sm font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>API Reference</h2>
            <div className="space-y-4">
              <div>
                <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#070707', color: '#4ade80' }}>POST /api/gateway/chat</code>
                <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>Send a message to any LYCHO agent. Requires Bearer token in Authorization header.</p>
                <pre className="text-[10px] font-mono mt-2 p-3 rounded" style={{ background: '#070707', color: '#a1a1aa' }}>
{JSON.stringify({
  agentType: 'lead_qualifier',
  message: 'I am interested in your premium plan',
  conversationId: 'opt-xyz',
  metadata: { source: 'my-app' }
}, null, 2)}</pre>
              </div>
              <div>
                <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#070707', color: '#4ade80' }}>GET /api/gateway/keys</code>
                <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>List all API keys for your tenant.</p>
              </div>
              <div>
                <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#070707', color: '#4ade80' }}>POST /api/gateway/keys</code>
                <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>Generate a new API key.</p>
              </div>
              <div>
                <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: '#070707', color: '#4ade80' }}>DELETE /api/gateway/keys</code>
                <p className="text-xs font-sans mt-1" style={{ color: '#6b6b6b' }}>Revoke an API key.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
