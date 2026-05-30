'use client'
import { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { Database, Plus, Loader2, Download, RotateCcw, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [restoreResult, setRestoreResult] = useState<any>(null)

  useEffect(() => { fetchBackups() }, [])

  async function fetchBackups() {
    setLoading(true)
    try {
      const res = await fetch('/api/backup')
      const data = await res.json()
      setBackups(data.backups || [])
    } catch {} finally { setLoading(false) }
  }

  async function createBackup() {
    setCreating(true)
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', label: `Backup ${new Date().toLocaleString()}`, type: 'full' }),
      })
      if (res.ok) await fetchBackups()
    } catch {} finally { setCreating(false) }
  }

  async function restoreBackup(backupId: string) {
    setRestoring(backupId)
    setRestoreResult(null)
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', backupId }),
      })
      const data = await res.json()
      setRestoreResult(data)
      await fetchBackups()
    } catch {} finally { setRestoring(null) }
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <Database size={22} style={{ color: '#A78BFA' }} />
              <div>
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Backup & Restore</h1>
                <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Snapshots, versioning, one-click rollback, and export</p>
              </div>
            </div>
            <button onClick={createBackup} disabled={creating} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider transition-all" style={{ background: creating ? '#2a2a2a' : '#A78BFA', color: creating ? '#6b6b6b' : '#070707' }}>
              {creating ? <Loader2 className="animate-spin inline" size={14} /> : <><Plus size={14} /> Backup Now</>}
            </button>
          </div>

          {restoreResult && (
            <div className={`rounded-lg p-4 mb-6 flex items-start gap-3`} style={{ background: restoreResult.success ? '#166534' : '#7f1d1d', border: `1px solid ${restoreResult.success ? '#22c55e40' : '#ef444440'}` }}>
              {restoreResult.success ? <CheckCircle size={16} style={{ color: '#4ade80', marginTop: 2 }} /> : <AlertTriangle size={16} style={{ color: '#ef4444', marginTop: 2 }} />}
              <div>
                <p className="text-xs font-sans" style={{ color: restoreResult.success ? '#4ade80' : '#fca5a5' }}>
                  {restoreResult.success ? `Restored ${restoreResult.restored?.length || 0} items` : 'Restore failed'}
                </p>
                {restoreResult.errors?.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {restoreResult.errors.map((e: string, i: number) => (
                      <li key={i} className="text-[10px] font-sans" style={{ color: '#fca5a5' }}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={20} style={{ color: '#A78BFA' }} /></div>
          ) : backups.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>No backups yet. Create your first backup to protect your agents and data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((b, i) => (
                <div key={i} className="rounded-lg p-4" style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database size={14} style={{ color: b.status === 'completed' ? '#4ade80' : b.status === 'restoring' ? '#fbbf24' : '#6b6b6b' }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-sans" style={{ color: '#F0EBE1' }}>{b.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-sans" style={{
                            background: b.status === 'completed' ? '#166534' : b.status === 'restoring' ? '#92400e' : '#3f3f46',
                            color: b.status === 'completed' ? '#4ade80' : b.status === 'restoring' ? '#fbbf24' : '#a1a1aa',
                          }}>{b.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] font-sans" style={{ color: '#6b6b6b' }}>
                          <span>{b.type}</span>
                          <span>{formatBytes(b.size_bytes)}</span>
                          <span>{new Date(b.created_at).toLocaleString()}</span>
                          <span>{b.metadata?.agent_count || 0} agents</span>
                          {b.metadata?.workflow_count !== undefined && <span>{b.metadata.workflow_count} workflows</span>}
                          {b.restored_at && <span>· Restored {new Date(b.restored_at).toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => restoreBackup(b.id)} disabled={restoring === b.id || b.status !== 'completed'} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-sans transition-all" style={{ background: '#2a2a2a', color: '#a1a1aa' }}>
                        {restoring === b.id ? <Loader2 className="animate-spin" size={10} /> : <RotateCcw size={10} />}
                        Restore
                      </button>
                    </div>
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
