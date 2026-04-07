'use client'
import { useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Wrench, Plus, Loader2, X } from 'lucide-react'

interface Skill { id: string; display_name: string; description: string; sector: string; publisher_name: string; downloads: number; rating: number }

export default function SkillsPage() {
  const [skills, setSkills]     = useState<Skill[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deploying, setDeploying] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ display_name: '', description: '', sector: '', system_prompt: '', publisher_name: '', price_pkr: 0 })

  useEffect(() => {
    fetch('/api/skills').then(r => r.json()).then(d => { setSkills(d.skills || []); setLoading(false) })
  }, [])

  async function deploy(id: string) {
    setDeploying(id)
    await fetch(`/api/skills/${id}/deploy`, { method: 'POST' })
    setDeploying(null)
    alert('Skill deployed to your agents!')
  }

  async function submit() {
    const res = await fetch('/api/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setSubmitted(true); setShowForm(false); setForm({ display_name: '', description: '', sector: '', system_prompt: '', publisher_name: '', price_pkr: 0 }) }
  }

  const F = ({ k, label, placeholder, area }: { k: keyof typeof form; label: string; placeholder: string; area?: boolean }) => (
    <div className="mb-3">
      <label className="block text-xs font-sans uppercase tracking-widest mb-1.5" style={{ color: '#6b6b6b' }}>{label}</label>
      {area
        ? <textarea value={String(form[k])} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={placeholder} rows={5}
            className="w-full px-3 py-2.5 rounded-lg text-sm font-sans outline-none resize-none" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }} />
        : <input type="text" value={String(form[k])} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-lg text-sm font-sans outline-none" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }} />}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Wrench size={22} style={{ color: '#C9A84C' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Skills</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Community-built specialist agents. Deploy in one click.</p>
              </div>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
              style={{ background: '#C9A84C', color: '#070707' }}>
              <Plus size={14} /> Publish Skill
            </button>
          </div>

          {submitted && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm font-sans" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}>
              Skill submitted for review. We will notify you when approved.
            </div>
          )}

          {showForm && (
            <div className="rounded-xl p-6 mb-6" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-sans font-semibold" style={{ color: '#F0EBE1' }}>Publish a Skill</h2>
                <button onClick={() => setShowForm(false)}><X size={16} style={{ color: '#6b6b6b' }} /></button>
              </div>
              <F k="display_name"  label="Agent Name"   placeholder="e.g. Pakistani Tax Specialist" />
              <F k="description"   label="Description"  placeholder="What does this agent do?" />
              <F k="sector"        label="Sector"       placeholder="e.g. Finance, Legal, Healthcare" />
              <F k="publisher_name" label="Your Name"   placeholder="Your name or company" />
              <F k="system_prompt" label="System Prompt" placeholder="Write the complete system prompt..." area />
              <button onClick={submit}
                className="px-5 py-2.5 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
                style={{ background: '#C9A84C', color: '#070707' }}>
                Submit for Review
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 size={20} className="animate-spin" style={{ color: '#C9A84C' }} /></div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Wrench size={40} className="mb-4 opacity-20" style={{ color: '#C9A84C' }} />
              <p className="text-sm font-sans mb-1" style={{ color: '#F0EBE1' }}>No skills yet</p>
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Be the first to publish one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(s => (
                <div key={s.id} className="rounded-xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-sans font-bold uppercase tracking-widest" style={{ color: '#C9A84C' }}>{s.sector}</span>
                    <span className="text-xs font-sans" style={{ color: '#6b6b6b' }}>↓ {s.downloads}</span>
                  </div>
                  <p className="text-sm font-sans font-semibold mb-1" style={{ color: '#F0EBE1' }}>{s.display_name}</p>
                  <p className="text-xs font-sans mb-4" style={{ color: '#6b6b6b', lineHeight: 1.6 }}>{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans" style={{ color: '#444' }}>by {s.publisher_name}</span>
                    <button onClick={() => deploy(s.id)} disabled={deploying === s.id}
                      className="px-3 py-1.5 rounded text-xs font-sans font-medium transition-opacity hover:opacity-80"
                      style={{ background: deploying === s.id ? '#2a2a2a' : '#C9A84C', color: deploying === s.id ? '#6b6b6b' : '#070707' }}>
                      {deploying === s.id ? 'Deploying…' : 'Deploy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
