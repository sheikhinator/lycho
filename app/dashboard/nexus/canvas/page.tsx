'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type NodeType = 'trigger' | 'agent' | 'condition' | 'action' | 'delay'
interface CanvasNode { id: string; type: NodeType; label: string; x: number; y: number }
interface Connection  { from: string; to: string }

const COLORS: Record<NodeType, string> = { trigger: '#4ade80', agent: '#C9A84C', condition: '#60a5fa', action: '#a78bfa', delay: '#f97316' }
const TYPES: { type: NodeType; label: string; icon: string }[] = [
  { type: 'trigger',   label: 'Trigger',   icon: '⚡' },
  { type: 'agent',     label: 'Agent',     icon: '🤖' },
  { type: 'condition', label: 'Condition', icon: '🔀' },
  { type: 'action',    label: 'Action',    icon: '▶' },
  { type: 'delay',     label: 'Delay',     icon: '⏱' },
]

export default function CanvasPage() {
  const [nodes, setNodes]             = useState<CanvasNode[]>([])
  const [connections]                 = useState<Connection[]>([])
  const [dragging, setDragging]       = useState<string | null>(null)
  const [dragOffset, setDragOffset]   = useState({ x: 0, y: 0 })
  const [saved, setSaved]             = useState(false)
  const canvasRef                     = useRef<HTMLDivElement>(null)

  function add(type: NodeType) {
    setNodes(p => [...p, { id: `n_${Date.now()}`, type, label: TYPES.find(t => t.type === type)!.label, x: 220 + Math.random() * 180, y: 120 + Math.random() * 160 }])
  }

  function onMouseDown(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    const n = nodes.find(n => n.id === id)
    if (!n) return
    setDragging(id)
    setDragOffset({ x: e.clientX - n.x, y: e.clientY - n.y })
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    setNodes(p => p.map(n => n.id === dragging ? { ...n, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } : n))
  }

  function save() {
    localStorage.setItem('lycho_canvas', JSON.stringify({ nodes, connections }))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ height: '100vh', background: '#070707', display: 'flex', overflow: 'hidden', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 200, background: '#0d0d0d', borderRight: '1px solid #1a1a1a', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link href="/dashboard/nexus" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b6b6b', fontSize: 12, marginBottom: 8, textDecoration: 'none' }}>
          <ArrowLeft size={12} /> Back to Nexus
        </Link>
        <div style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ADD NODE</div>
        {TYPES.map(t => (
          <button key={t.type} onClick={() => add(t.type)} style={{ background: '#141414', border: `1px solid ${COLORS[t.type]}33`, borderRadius: 6, padding: '9px 12px', color: COLORS[t.type], fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t.icon} {t.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={save} style={{ background: saved ? '#4ade80' : '#C9A84C', color: '#070707', border: 'none', borderRadius: 6, padding: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
          <button onClick={() => setNodes([])} style={{ background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 6, padding: 8, color: '#666', cursor: 'pointer', fontSize: 12 }}>
            Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'default' }}
        onMouseMove={onMouseMove} onMouseUp={() => setDragging(null)}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#fff" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {connections.map((c, i) => {
            const f = nodes.find(n => n.id === c.from), t = nodes.find(n => n.id === c.to)
            if (!f || !t) return null
            return <line key={i} x1={f.x+80} y1={f.y+30} x2={t.x+80} y2={t.y+30} stroke="#C9A84C" strokeWidth="2" opacity=".5" strokeDasharray="4 4"/>
          })}
        </svg>
        {nodes.map(n => (
          <div key={n.id} onMouseDown={e => onMouseDown(e, n.id)}
            style={{ position: 'absolute', left: n.x, top: n.y, width: 160, background: '#0d0d0d', border: `2px solid ${COLORS[n.type]}`, borderRadius: 8, padding: '10px 12px', cursor: 'grab', userSelect: 'none', boxShadow: `0 0 20px ${COLORS[n.type]}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: COLORS[n.type], fontSize: 12, fontWeight: 700 }}>{TYPES.find(t => t.type === n.type)?.icon} {n.label}</span>
              <button onClick={e => { e.stopPropagation(); setNodes(p => p.filter(x => x.id !== n.id)) }} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>{n.type}</div>
          </div>
        ))}
        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 32 }}>⚡</div>
            <div style={{ fontSize: 14 }}>Add nodes from the sidebar to build your workflow</div>
          </div>
        )}
      </div>
    </div>
  )
}
