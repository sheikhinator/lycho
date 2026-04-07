'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createClientSupabase } from '@/lib/supabase'

const AGENT_SPRITES: Record<string, { emoji: string; color: string; size: number; role: string }> = {
  orion:      { emoji: '👑', color: '#fbbf24', size: 48, role: 'Queen Intelligence' },
  forge:      { emoji: '⚒️', color: '#fb923c', size: 40, role: 'Agent Builder' },
  guardian:   { emoji: '🛡️', color: '#dc2626', size: 40, role: 'Security' },
  veritas:    { emoji: '🔍', color: '#818cf8', size: 36, role: 'Quality' },
  nexus:      { emoji: '⚡', color: '#34d399', size: 36, role: 'Automation' },
  intake:     { emoji: '📥', color: '#4ade80', size: 32, role: 'Lead Intake' },
  research:   { emoji: '🔬', color: '#60a5fa', size: 32, role: 'Research' },
  operations: { emoji: '⚙️', color: '#f97316', size: 32, role: 'Operations' },
  client:     { emoji: '💝', color: '#ec4899', size: 32, role: 'Client Relations' },
  analyst:    { emoji: '📊', color: '#a78bfa', size: 32, role: 'Analytics' },
  compliance: { emoji: '⚖️', color: '#ef4444', size: 32, role: 'Compliance' },
  content:    { emoji: '✍️', color: '#C9A84C', size: 32, role: 'Content' },
}

const DEFAULT_AGENT_SPRITE = { emoji: '🤖', color: '#888', size: 28, role: 'Specialist' }

interface AgentNode {
  id: string; type: string; x: number; y: number; vx: number; vy: number
  state: 'idle' | 'thinking' | 'speaking' | 'celebrating' | 'sleeping' | 'alert'
  pulse: number; messages: string[]; lastMessage: string; messageTimer: number
  energy: number; connections: string[]; conversations: number; born: number
}

interface Particle {
  id: string; x: number; y: number; tx: number; ty: number
  progress: number; color: string; size: number; type: 'message' | 'energy' | 'spawn' | 'alert'
}

interface WorldEvent { id: string; text: string; color: string; y: number; opacity: number; time: number }

const AGENT_MESSAGES: Record<string, string[]> = {
  orion:      ['Optimising agents...', 'Intelligence rising', 'Watching the network', 'Analysing patterns', 'Strategic brief ready'],
  forge:      ['Building new agent...', 'Crafting specialist...', 'Market gap detected', 'Agent ready to deploy', 'Forging intelligence'],
  guardian:   ['All clear', 'Threat detected!', 'Network secure', 'Scanning messages', 'Blocking injection'],
  veritas:    ['Quality check...', 'Score: 94/100', 'Response verified', 'Hallucination detected!', 'Quality approved'],
  intake:     ['New lead!', 'Qualifying prospect...', 'Hot lead detected!', 'Routing to human', 'Lead scored: 87'],
  research:   ['Searching web...', 'Market intel gathered', 'Competitor found', 'Trend emerging', 'Research complete'],
  operations: ['Task automated', 'Workflow triggered', 'Schedule updated', 'Reminder sent', 'Process optimised'],
  client:     ['Client happy!', 'Churn risk detected', 'Relationship built', 'Follow-up sent', 'Retention achieved'],
  analyst:    ['ROI: 12x', 'Pattern identified', 'Forecast ready', 'Anomaly detected', 'Dashboard updated'],
  compliance: ['Regulation checked', 'Risk flagged!', 'Compliant ✓', 'Legal review needed', 'Policy updated'],
  content:    ['Content created', 'Post scheduled', 'Copy approved', 'Brand aligned', 'Campaign live'],
}
const DEFAULT_MESSAGES = ['Processing...', 'Working...', 'Analysing...', 'Complete ✓']

function getConnections(type: string): string[] {
  const map: Record<string, string[]> = {
    orion: ['forge', 'guardian', 'veritas', 'nexus'],
    forge: ['orion', 'nexus'],
    guardian: ['orion', 'veritas'],
    veritas: ['orion', 'guardian'],
    nexus: ['orion', 'forge'],
    intake: ['orion', 'research', 'compliance'],
    research: ['orion', 'analyst', 'compliance'],
    operations: ['orion', 'nexus'],
    client: ['orion', 'analyst'],
    analyst: ['orion', 'research'],
    compliance: ['orion', 'research'],
    content: ['orion', 'research'],
  }
  return map[type] || ['orion']
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255'
}

function initAgents(width: number, height: number): AgentNode[] {
  const cx = width / 2, cy = height / 2
  const types = ['orion','forge','guardian','veritas','nexus','intake','research','operations','client','analyst','compliance','content']
  return types.map((type, i) => {
    const ring = i < 5 ? 120 : 240
    const angle = (i / types.length) * Math.PI * 2 - Math.PI / 2
    const jitter = (Math.random() - 0.5) * 40
    return {
      id: type, type,
      x: cx + Math.cos(angle) * (ring + jitter),
      y: cy + Math.sin(angle) * (ring + jitter),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      state: 'idle' as const, pulse: Math.random() * Math.PI * 2,
      messages: AGENT_MESSAGES[type] || DEFAULT_MESSAGES,
      lastMessage: '', messageTimer: Math.random() * 200,
      energy: 0.5 + Math.random() * 0.5,
      connections: getConnections(type),
      conversations: Math.floor(Math.random() * 100),
      born: Date.now()
    }
  })
}

export default function WorldPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<AgentNode[]>([])
  const particlesRef = useRef<Particle[]>([])
  const eventsRef = useRef<WorldEvent[]>([])
  const animFrameRef = useRef<number>()
  const timeRef = useRef(0)
  const supabase = createClientSupabase()

  const [stats, setStats] = useState({ agents: 0 })
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null)
  const [worldMood, setWorldMood] = useState<'peaceful' | 'active' | 'alert'>('peaceful')
  const [showLegend, setShowLegend] = useState(true)
  const frameCountRef = useRef(0)

  function spawnParticle(fromNode: AgentNode, toId: string, type: Particle['type'] = 'message') {
    const toNode = nodesRef.current.find(n => n.id === toId)
    if (!toNode) return
    const sprite = AGENT_SPRITES[fromNode.type] || DEFAULT_AGENT_SPRITE
    particlesRef.current.push({
      id: `p_${Date.now()}_${Math.random()}`, x: fromNode.x, y: fromNode.y,
      tx: toNode.x, ty: toNode.y, progress: 0, color: sprite.color,
      size: type === 'energy' ? 6 : type === 'spawn' ? 10 : 4, type
    })
    if (particlesRef.current.length > 80) particlesRef.current = particlesRef.current.slice(-60)
  }

  function addEvent(text: string, color: string) {
    eventsRef.current.push({ id: `e_${Date.now()}`, text, color, y: 0, opacity: 1, time: Date.now() })
    if (eventsRef.current.length > 8) eventsRef.current = eventsRef.current.slice(-8)
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    timeRef.current += 0.016

    ctx.fillStyle = '#070707'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.02)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

    const grad = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,200)
    grad.addColorStop(0,'rgba(201,168,76,0.04)'); grad.addColorStop(1,'rgba(0,0,0,0)')
    ctx.fillStyle = grad; ctx.fillRect(0,0,W,H)

    const nodes = nodesRef.current

    nodes.forEach(node => {
      node.x += node.vx; node.y += node.vy
      if (node.x < 60 || node.x > W-60) node.vx *= -1
      if (node.y < 60 || node.y > H-60) node.vy *= -1
      node.vx *= 0.995; node.vy *= 0.995
      node.pulse += 0.05 + (node.state === 'thinking' ? 0.05 : 0)
      node.messageTimer--
      if (node.messageTimer <= 0) {
        node.messageTimer = 150 + Math.random() * 300
        node.lastMessage = node.messages[Math.floor(Math.random() * node.messages.length)]
        const roll = Math.random()
        node.state = roll < 0.1 ? 'celebrating' : roll < 0.2 ? 'alert' : roll < 0.3 ? 'thinking' : roll < 0.05 ? 'sleeping' : 'speaking'
        if (node.connections.length && Math.random() < 0.6) {
          spawnParticle(node, node.connections[Math.floor(Math.random() * node.connections.length)], Math.random() < 0.2 ? 'energy' : 'message')
        }
        if (Math.random() < 0.15) {
          const sprite = AGENT_SPRITES[node.type] || DEFAULT_AGENT_SPRITE
          addEvent(`${sprite.emoji} ${node.type.toUpperCase()}: ${node.lastMessage}`, sprite.color)
        }
      }
      if (node.state === 'celebrating' && Math.random() < 0.02) node.state = 'idle'
      if (node.state === 'alert' && Math.random() < 0.015) node.state = 'idle'
      if (node.state === 'speaking' && Math.random() < 0.01) node.state = 'idle'
    })

    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId)
        if (!target) return
        const sprite = AGENT_SPRITES[node.type] || DEFAULT_AGENT_SPRITE
        const dist = Math.hypot(target.x - node.x, target.y - node.y)
        const alpha = Math.max(0, 0.15 - dist / 3000)
        ctx.strokeStyle = `${sprite.color}${Math.floor(alpha*255).toString(16).padStart(2,'0')}`
        ctx.lineWidth = 1; ctx.setLineDash([4,8])
        ctx.beginPath(); ctx.moveTo(node.x,node.y); ctx.lineTo(target.x,target.y); ctx.stroke()
        ctx.setLineDash([])
      })
    })

    particlesRef.current = particlesRef.current.filter(p => p.progress < 1)
    particlesRef.current.forEach(p => {
      p.progress += 0.018 + (p.type === 'energy' ? 0.01 : 0)
      const t = p.progress
      const midX = (p.x+p.tx)/2, midY = (p.ty+p.y)/2-40
      const bx = (1-t)*(1-t)*p.x + 2*(1-t)*t*midX + t*t*p.tx
      const by = (1-t)*(1-t)*p.y + 2*(1-t)*t*midY + t*t*p.ty
      const alpha = Math.sin(p.progress * Math.PI)
      const glow = ctx.createRadialGradient(bx,by,0,bx,by,p.size*3)
      glow.addColorStop(0,`${p.color}${Math.floor(alpha*200).toString(16).padStart(2,'0')}`)
      glow.addColorStop(1,'transparent')
      ctx.fillStyle = glow; ctx.fillRect(bx-p.size*3,by-p.size*3,p.size*6,p.size*6)
      ctx.fillStyle = `${p.color}${Math.floor(alpha*255).toString(16).padStart(2,'0')}`
      ctx.beginPath(); ctx.arc(bx,by,p.size*alpha,0,Math.PI*2); ctx.fill()
    })

    nodes.forEach(node => {
      const sprite = AGENT_SPRITES[node.type] || DEFAULT_AGENT_SPRITE
      const s = sprite.size
      const pulseScale = 1 + Math.sin(node.pulse) * 0.06

      if (node.state === 'alert') {
        const ap = (Math.sin(timeRef.current * 8)+1)/2
        ctx.strokeStyle = `rgba(239,68,68,${ap*0.8})`; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(node.x,node.y,s*pulseScale+10+ap*8,0,Math.PI*2); ctx.stroke()
      }
      if (node.state === 'celebrating') {
        for (let i=0;i<6;i++) {
          const angle = (i/6)*Math.PI*2+timeRef.current*3
          const dist = s+12+Math.sin(timeRef.current*5+i)*5
          ctx.font='10px serif'; ctx.fillStyle='#fbbf24'
          ctx.fillText('✨',node.x+Math.cos(angle)*dist-5,node.y+Math.sin(angle)*dist+4)
        }
      }
      if (node.state === 'thinking') {
        for (let i=0;i<3;i++) {
          const alpha = Math.sin(timeRef.current*4+i) > 0 ? 1 : 0.2
          ctx.fillStyle=`rgba(255,255,255,${alpha})`
          ctx.beginPath(); ctx.arc(node.x-8+i*8,node.y-s-8,3,0,Math.PI*2); ctx.fill()
        }
      }

      const glowGrad = ctx.createRadialGradient(node.x,node.y,s*0.5,node.x,node.y,s*2)
      glowGrad.addColorStop(0,`${sprite.color}40`); glowGrad.addColorStop(1,'transparent')
      ctx.fillStyle=glowGrad; ctx.beginPath(); ctx.arc(node.x,node.y,s*2,0,Math.PI*2); ctx.fill()

      ctx.fillStyle='rgba(0,0,0,0.4)'
      ctx.beginPath(); ctx.ellipse(node.x,node.y+s*0.8,s*0.5,s*0.15,0,0,Math.PI*2); ctx.fill()

      ctx.fillStyle='#0d0d0d'; ctx.strokeStyle=sprite.color
      ctx.lineWidth=node.state==='alert'?3:1.5
      ctx.beginPath()
      for (let i=0;i<6;i++) {
        const angle=(i/6)*Math.PI*2-Math.PI/2
        const r=s*0.7*pulseScale
        const px=node.x+Math.cos(angle)*r, py=node.y+Math.sin(angle)*r
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py)
      }
      ctx.closePath(); ctx.fill(); ctx.stroke()

      ctx.font=`${Math.floor(s*0.55)}px serif`
      ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(sprite.emoji,node.x,node.y)

      ctx.font='bold 10px DM Sans, sans-serif'
      ctx.fillStyle=sprite.color; ctx.textAlign='center'; ctx.textBaseline='top'
      ctx.fillText(node.type.toUpperCase(),node.x,node.y+s*0.75)

      if (node.lastMessage && node.state==='speaking') {
        ctx.font='10px DM Sans, sans-serif'
        const tw=ctx.measureText(node.lastMessage).width+12
        const bx=node.x-tw/2, by=node.y-s-32
        ctx.fillStyle='#141414'; ctx.strokeStyle=sprite.color; ctx.lineWidth=1
        ctx.beginPath(); ctx.roundRect(bx,by,tw,20,4); ctx.fill(); ctx.stroke()
        ctx.fillStyle='#141414'; ctx.strokeStyle=sprite.color
        ctx.beginPath(); ctx.moveTo(node.x-4,by+20); ctx.lineTo(node.x+4,by+20); ctx.lineTo(node.x,by+28); ctx.closePath(); ctx.fill(); ctx.stroke()
        ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(node.lastMessage,node.x,by+10)
      }
      if (node.state==='sleeping') {
        ctx.font='14px serif'; ctx.fillStyle='rgba(255,255,255,0.5)'
        ctx.fillText('💤',node.x+s*0.5,node.y-s*0.5)
      }
    })

    eventsRef.current.forEach((ev, i) => {
      ev.y = 20 + i*22
      ev.opacity = Math.max(0, 1-(Date.now()-ev.time)/6000)
      ctx.font='11px DM Mono, monospace'; ctx.textAlign='left'; ctx.textBaseline='top'
      ctx.fillStyle=`rgba(${hexToRgb(ev.color)},${ev.opacity})`
      ctx.fillText(`› ${ev.text}`,16,ev.y)
    })
    eventsRef.current = eventsRef.current.filter(ev => ev.opacity > 0)

    // Throttle React state updates to once per second (avoid re-render on every frame)
    frameCountRef.current++
    if (frameCountRef.current % 60 === 0) {
      setStats({ agents: nodes.length })
      const alertCount = nodes.filter(n => n.state==='alert').length
      const activeCount = nodes.filter(n => n.state!=='idle' && n.state!=='sleeping').length
      if (alertCount>2) setWorldMood('alert')
      else if (activeCount>4) setWorldMood('active')
      else setWorldMood('peaceful')
    }

    animFrameRef.current = requestAnimationFrame(render)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      nodesRef.current = initAgents(canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)
    animFrameRef.current = requestAnimationFrame(render)
    return () => {
      window.removeEventListener('resize', resize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [render])

  useEffect(() => {
    const channel = supabase
      .channel('world-syndicate')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'syndicate_messages' }, (payload) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = payload.new as any
        const fromNode = nodesRef.current.find(n => n.id === msg.from_agent)
        if (fromNode && msg.to_agent) {
          spawnParticle(fromNode, msg.to_agent,
            msg.flagged_by_guardian ? 'alert' : msg.message_type==='forge_brief' ? 'energy' : 'message')
          fromNode.state = 'speaking'
          fromNode.lastMessage = msg.message_type?.replace(/_/g,' ') || 'transmitting'
          addEvent(`${msg.from_agent} → ${msg.to_agent} [${msg.message_type}]`, AGENT_SPRITES[msg.from_agent]?.color || '#888')
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX-rect.left, my = e.clientY-rect.top
    const hit = nodesRef.current.find(n => {
      const sprite = AGENT_SPRITES[n.type] || DEFAULT_AGENT_SPRITE
      return Math.hypot(mx-n.x,my-n.y) < sprite.size
    })
    setSelectedAgent(hit || null)
    if (hit) {
      hit.state='celebrating'
      hit.connections.forEach(cid => spawnParticle(hit,cid,'energy'))
      addEvent(`Selected ${hit.type.toUpperCase()} — ${hit.conversations} conversations`, AGENT_SPRITES[hit.type]?.color||'#fff')
    }
  }

  const moodConfig = {
    peaceful: { label: '● Peaceful', color: '#4ade80' },
    active:   { label: '⚡ Active',  color: '#C9A84C' },
    alert:    { label: '🚨 Alert',   color: '#ef4444' }
  }

  return (
    <div style={{ height:'100vh', background:'#070707', display:'flex', flexDirection:'column', fontFamily:'DM Sans, sans-serif', overflow:'hidden' }}>
      <div style={{ background:'#0d0d0d', borderBottom:'1px solid #1a1a1a', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div>
            <span style={{ color:'#C9A84C', fontWeight:700, fontSize:16, letterSpacing:2, fontFamily:'Bebas Neue, sans-serif' }}>✦ LYCHO WORLD</span>
            <span style={{ color:'#444', fontSize:11, marginLeft:8 }}>Agent Society — Live</span>
          </div>
          <div style={{ color:moodConfig[worldMood].color, fontSize:12, fontWeight:600 }}>{moodConfig[worldMood].label}</div>
        </div>
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#C9A84C', fontWeight:700, fontSize:18, fontFamily:'Bebas Neue, sans-serif' }}>{stats.agents}</div>
            <div style={{ color:'#444', fontSize:10 }}>Agents</div>
          </div>
          <button onClick={() => setShowLegend(!showLegend)}
            style={{ background:'#141414', border:'1px solid #2a2a2a', borderRadius:6, padding:'6px 12px', color:'#888', cursor:'pointer', fontSize:12 }}>
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>
      </div>

      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <canvas ref={canvasRef} onClick={handleCanvasClick}
          style={{ width:'100%', height:'100%', cursor:'crosshair', display:'block' }} />

        {selectedAgent && (
          <div style={{ position:'absolute', top:16, right:16, background:'#0d0d0d',
            border:`1px solid ${AGENT_SPRITES[selectedAgent.type]?.color||'#888'}`,
            borderRadius:8, padding:20, minWidth:220,
            boxShadow:`0 0 30px ${AGENT_SPRITES[selectedAgent.type]?.color||'#888'}33` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ color:AGENT_SPRITES[selectedAgent.type]?.color||'#fff', fontWeight:700, fontSize:16 }}>
                  {AGENT_SPRITES[selectedAgent.type]?.emoji} {selectedAgent.type.toUpperCase()}
                </div>
                <div style={{ color:'#666', fontSize:12 }}>{AGENT_SPRITES[selectedAgent.type]?.role||'Specialist'}</div>
              </div>
              <button onClick={() => setSelectedAgent(null)} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:16 }}>×</button>
            </div>
            {[
              { label:'Status', value:selectedAgent.state.toUpperCase() },
              { label:'Conversations', value:selectedAgent.conversations.toLocaleString() },
              { label:'Energy', value:`${Math.round(selectedAgent.energy*100)}%` },
              { label:'Connections', value:selectedAgent.connections.length },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #111' }}>
                <span style={{ color:'#666', fontSize:12 }}>{item.label}</span>
                <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{item.value}</span>
              </div>
            ))}
            {selectedAgent.lastMessage && (
              <div style={{ marginTop:12, background:'#141414', borderRadius:6, padding:'8px 10px', color:'#aaa', fontSize:12 }}>
                Last: "{selectedAgent.lastMessage}"
              </div>
            )}
          </div>
        )}

        {showLegend && (
          <div style={{ position:'absolute', bottom:16, right:16, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:8, padding:16, maxWidth:200 }}>
            <div style={{ color:'#666', fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:10 }}>AGENT SOCIETY</div>
            {Object.entries(AGENT_SPRITES).slice(0,8).map(([type, sprite]) => (
              <div key={type} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:14 }}>{sprite.emoji}</span>
                <span style={{ color:sprite.color, fontSize:11, fontWeight:600 }}>{type.toUpperCase()}</span>
                <span style={{ color:'#444', fontSize:10 }}>{sprite.role}</span>
              </div>
            ))}
            <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid #1a1a1a', color:'#444', fontSize:10 }}>Click any agent to inspect</div>
          </div>
        )}

        <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', color:'#333', fontSize:11, pointerEvents:'none' }}>
          Click any agent to inspect • Messages flow in real time via Syndicate
        </div>
      </div>
    </div>
  )
}
