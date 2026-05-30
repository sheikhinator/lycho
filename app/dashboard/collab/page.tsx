'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Users, Plus, Loader2, UserPlus, Trash2, Shield, User } from 'lucide-react'

export default function CollabPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', description: '' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchWorkspaces() }, [])

  async function fetchWorkspaces() {
    setLoading(true)
    try {
      const res = await fetch('/api/collab/workspaces')
      const data = await res.json()
      setWorkspaces(data.workspaces || [])
    } catch {} finally { setLoading(false) }
  }

  async function createWorkspace() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await fetch('/api/collab/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setShowCreate(false)
      setForm({ name: '', description: '' })
      await fetchWorkspaces()
    } catch {} finally { setCreating(false) }
  }

  async function selectWorkspace(ws: any) {
    setSelectedWorkspace(ws)
    try {
      const res = await fetch(`/api/collab/members?workspace_id=${ws.id}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch {}
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !selectedWorkspace) return
    try {
      await fetch('/api/collab/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: selectedWorkspace.id, email: inviteEmail }),
      })
      setInviteEmail('')
      const res = await fetch(`/api/collab/members?workspace_id=${selectedWorkspace.id}`)
      const data = await res.json()
      setMembers(data.members || [])
    } catch {}
  }

  async function removeMember(memberId: string) {
    if (!selectedWorkspace) return
    try {
      await fetch('/api/collab/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: selectedWorkspace.id, memberId }),
      })
      setMembers(members.filter(m => m.id !== memberId))
    } catch {}
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield size={12} style={{ color: '#fbbf24' }} />
      case 'admin': return <Shield size={12} style={{ color: '#A78BFA' }} />
      default: return <User size={12} style={{ color: '#6b6b6b' }} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Users size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Collaboration</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Team workspaces, shared agents, role-based permissions</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all" style={{ background: '#A78BFA', color: '#070707' }}>
              <Plus size={14} /> Workspace
            </button>
          </div>

          {showCreate && (
            <div className="rounded-lg p-5 mb-6" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <h2 className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: '#A78BFA' }}>New Workspace</h2>
              <div className="flex gap-3 mb-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Workspace name" className="flex-1 px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="flex-1 px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
              </div>
              <button onClick={createWorkspace} disabled={creating || !form.name.trim()} className="px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider" style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}>
                {creating ? <Loader2 className="animate-spin inline" size={14} /> : 'Create'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={16} style={{ color: '#A78BFA' }} /></div>
              ) : workspaces.length === 0 ? (
                <div className="rounded-lg p-6 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>No workspaces yet.</p>
                </div>
              ) : workspaces.map(ws => (
                <div key={ws.id} onClick={() => selectWorkspace(ws)} className="rounded-lg p-3 cursor-pointer transition-all" style={{ background: selectedWorkspace?.id === ws.id ? '#2a2a2a' : '#1c1c1c', border: `1px solid ${selectedWorkspace?.id === ws.id ? '#A78BFA' : '#2a2a2a'}` }}>
                  <h3 className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{ws.name}</h3>
                  {ws.description && <p className="text-[10px] font-sans mt-1" style={{ color: '#6b6b6b' }}>{ws.description}</p>}
                </div>
              ))}
            </div>

            <div className="col-span-2">
              {selectedWorkspace ? (
                <div className="rounded-lg" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <div className="p-4 border-b" style={{ borderColor: '#2a2a2a' }}>
                    <h2 className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{selectedWorkspace.name} — Members</h2>
                  </div>
                  <div className="p-4 border-b flex gap-2" style={{ borderColor: '#2a2a2a' }}>
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email to invite..." className="flex-1 px-3 py-2 rounded-lg text-xs font-sans outline-none" style={{ background: '#070707', color: '#F0EBE1', border: '1px solid #2a2a2a' }} />
                    <button onClick={inviteMember} disabled={!inviteEmail.trim()} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-sans" style={{ background: '#A78BFA', color: '#070707' }}>
                      <UserPlus size={12} /> Invite
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
                    {members.map(m => (
                      <div key={m.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {roleIcon(m.role)}
                          <div>
                            <span className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{m.email}</span>
                            <span className="text-[10px] font-sans ml-2 px-1.5 py-0.5 rounded" style={{ background: '#3f3f46', color: '#a1a1aa' }}>{m.role}</span>
                          </div>
                        </div>
                        {m.role !== 'owner' && (
                          <button onClick={() => removeMember(m.id)} className="p-1.5 rounded-lg transition-all" style={{ color: '#6b6b6b' }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Select a workspace to view its members.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
