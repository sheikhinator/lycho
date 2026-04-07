'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar'
import { BookOpen, Upload, Trash2, FileText, Loader2, Plus, X, Link as LinkIcon } from 'lucide-react'

interface KnowledgeDoc {
  id: string
  name: string
  source_type: string
  source_url: string | null
  chunks: number
  created_at: string
}

export default function KnowledgePage() {
  const [docs, setDocs]         = useState<KnowledgeDoc[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', content: '', source_type: 'upload' as 'upload' | 'url', source_url: '' })
  const [successMsg, setSuccessMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge')
      const json = await res.json()
      setDocs(json.data?.documents ?? [])
    } catch {}
    setLoading(false)
  }

  async function handleFileRead(file: File) {
    const text = await file.text()
    setForm(f => ({ ...f, name: file.name, content: text, source_type: 'upload' }))
    setShowForm(true)
  }

  async function handleUpload() {
    if (!form.name.trim() || !form.content.trim()) return
    setUploading(true)
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Upload failed')
      setForm({ name: '', content: '', source_type: 'upload', source_url: '' })
      setShowForm(false)
      setSuccessMsg('Document uploaded successfully')
      setTimeout(() => setSuccessMsg(''), 4000)
      await fetchDocs()
    } catch {}
    setUploading(false)
  }

  async function handleDelete(doc: KnowledgeDoc) {
    setDeleting(doc.id)
    try {
      await fetch(`/api/knowledge/${doc.id}`, { method: 'DELETE' })
      setDocs(prev => prev.filter(d => d.id !== doc.id))
    } catch {}
    setDeleting(null)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#070707' }}>
      <DashboardSidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-60">
        <DashboardTopBar />

        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BookOpen size={22} style={{ color: '#C9A84C' }} />
                <h1 className="font-bebas text-3xl tracking-wider" style={{ color: '#F0EBE1' }}>Knowledge Base</h1>
              </div>
              <p className="text-sm font-sans" style={{ color: '#6b6b6b' }}>Your agents learn from your documents</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium transition-opacity hover:opacity-80"
              style={{ background: '#C9A84C', color: '#070707' }}
            >
              <Plus size={15} />
              Add Document
            </button>
          </div>

          {/* Upload form */}
          {showForm && (
            <div className="rounded-xl p-6 mb-6" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-sans font-semibold" style={{ color: '#F0EBE1' }}>Add Document</h2>
                <button onClick={() => setShowForm(false)}><X size={16} style={{ color: '#6b6b6b' }} /></button>
              </div>

              {/* Source type tabs */}
              <div className="flex gap-2 mb-4">
                {(['upload', 'url'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setForm(f => ({ ...f, source_type: type }))}
                    className="px-3 py-1.5 rounded text-xs font-sans capitalize transition-colors"
                    style={{
                      background: form.source_type === type ? 'rgba(201,168,76,0.1)' : 'transparent',
                      color: form.source_type === type ? '#C9A84C' : '#6b6b6b',
                      border: `1px solid ${form.source_type === type ? 'rgba(201,168,76,0.3)' : '#2a2a2a'}`,
                    }}
                  >
                    {type === 'upload' ? 'Paste Text' : 'URL'}
                  </button>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans transition-colors"
                  style={{ background: 'transparent', color: '#6b6b6b', border: '1px solid #2a2a2a' }}
                >
                  <Upload size={11} /> Read File
                </button>
                <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileRead(f); e.target.value = '' }} />
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Document name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-sans outline-none"
                  style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
                />

                {form.source_type === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.source_url}
                    onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm font-sans outline-none"
                    style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
                  />
                ) : null}

                <textarea
                  rows={8}
                  placeholder="Paste your document content here — product info, FAQs, policies, procedures..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-sans outline-none resize-none"
                  style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#F0EBE1' }}
                />

                <p className="text-xs font-sans" style={{ color: '#444' }}>
                  Supported: plain text, Word content, PDF text, FAQs, SOPs · ~$0.0001 per document
                </p>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-sans" style={{ color: '#6b6b6b' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !form.name.trim() || !form.content.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans font-medium transition-opacity"
                    style={{ background: uploading || !form.name.trim() || !form.content.trim() ? '#2a2a2a' : '#C9A84C', color: uploading || !form.name.trim() || !form.content.trim() ? '#6b6b6b' : '#070707' }}
                  >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {uploading ? 'Processing…' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm font-sans" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
              {successMsg}
            </div>
          )}

          {/* Documents list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin" style={{ color: '#C9A84C' }} />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BookOpen size={40} className="mb-4 opacity-20" style={{ color: '#C9A84C' }} />
              <p className="text-sm font-sans mb-1" style={{ color: '#F0EBE1' }}>Upload your first document</p>
              <p className="text-xs font-sans" style={{ color: '#6b6b6b' }}>Your agents will search it automatically when answering questions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 rounded-xl" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    {doc.source_type === 'url' ? <LinkIcon size={15} style={{ color: '#C9A84C' }} /> : <FileText size={15} style={{ color: '#C9A84C' }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans font-medium truncate" style={{ color: '#F0EBE1' }}>{doc.name}</p>
                    <p className="text-xs font-sans mt-0.5" style={{ color: '#6b6b6b' }}>
                      {doc.chunks} {doc.chunks === 1 ? 'chunk' : 'chunks'} · {doc.source_type} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deleting === doc.id}
                    className="flex-shrink-0 p-1.5 rounded transition-colors"
                    style={{ color: deleting === doc.id ? '#444' : '#6b6b6b' }}
                    onMouseEnter={e => { if (deleting !== doc.id) (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                    onMouseLeave={e => { if (deleting !== doc.id) (e.currentTarget as HTMLElement).style.color = '#6b6b6b' }}
                  >
                    {deleting === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
