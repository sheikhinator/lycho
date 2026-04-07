'use client'
import { useEffect, useRef, useState } from 'react'
import { createClientSupabase } from '@/lib/supabase'

// ─── constants ──────────────────────────────────────────────────────────────
const SPRITES: Record<string, { emoji: string; color: string; size: number; role: string }> = {
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
const MSGS: Record<string, string[]> = {
  orion:      ['Optimising agents…', 'Intelligence rising', 'Watching the network', 'Strategic brief ready'],
  forge:      ['Building new agent…', 'Market gap detected', 'Agent ready to deploy', 'Forging intelligence'],
  guardian:   ['All clear', 'Threat detected!', 'Network secure', 'Blocking injection'],
  veritas:    ['Quality check…', 'Score: 94/100', 'Response verified', 'Quality approved'],
  intake:     ['New lead!', 'Hot lead detected!', 'Routing to human', 'Lead scored: 87'],
  research:   ['Searching web…', 'Market intel gathered', 'Trend emerging', 'Research complete'],
  operations: ['Task automated', 'Workflow triggered', 'Schedule updated', 'Process optimised'],
  client:     ['Client happy!', 'Churn risk detected', 'Follow-up sent', 'Retention achieved'],
  analyst:    ['ROI: 12x', 'Pattern identified', 'Forecast ready', 'Anomaly detected'],
  compliance: ['Regulation checked', 'Risk flagged!', 'Compliant ✓', 'Policy updated'],
  content:    ['Content created', 'Post scheduled', 'Copy approved', 'Campaign live'],
}
const CONNS: Record<string, string[]> = {
  orion: ['forge','guardian','veritas','nexus'], forge: ['orion','nexus'],
  guardian: ['orion','veritas'], veritas: ['orion','guardian'], nexus: ['orion','forge'],
  intake: ['orion','research','compliance'], research: ['orion','analyst','compliance'],
  operations: ['orion','nexus'], client: ['orion','analyst'],
  analyst: ['orion','research'], compliance: ['orion','research'], content: ['orion','research'],
}

function h2rgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '255,255,255'
}

// ─── types ───────────────────────────────────────────────────────────────────
interface Node { id:string; x:number; y:number; vx:number; vy:number; pulse:number; state:string; lastMsg:string; msgTimer:number; conns:string[]; convos:number; energy:number }
interface Particle { x:number; y:number; tx:number; ty:number; p:number; color:string; sz:number }
interface Ev { text:string; color:string; opacity:number; time:number }

// ─── component ───────────────────────────────────────────────────────────────
export default function WorldPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase  = createClientSupabase()

  // React state — updated only 1x/sec via setInterval, never from rAF
  const [agentCount, setAgentCount]   = useState(12)
  const [mood, setMood]               = useState<'peaceful'|'active'|'alert'>('peaceful')
  const [showLegend, setShowLegend]   = useState(true)
  const [selected, setSelected]       = useState<Node | null>(null)

  // ─── main effect — everything lives here ─────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const canvas = canvasRef.current!
    const supabaseChannel = supabase.channel('world')

    let nodes:    Node[]     = []
    let parts:    Particle[] = []
    let events:   Ev[]       = []
    let time      = 0
    let raf       = 0
    let selectedId: string | null = null

    // ── init ──────────────────────────────────────────────────────────────
    function init(W: number, H: number) {
      const cx = W / 2, cy = H / 2
      const types = Object.keys(SPRITES)
      nodes = types.map((type, i) => {
        const ring  = i < 5 ? 120 : 240
        const angle = (i / types.length) * Math.PI * 2 - Math.PI / 2
        const j     = (Math.random() - 0.5) * 40
        return {
          id: type, x: cx + Math.cos(angle)*(ring+j), y: cy + Math.sin(angle)*(ring+j),
          vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
          pulse: Math.random()*Math.PI*2, state: 'idle',
          lastMsg: '', msgTimer: Math.random()*200,
          conns: CONNS[type] || ['orion'],
          convos: Math.floor(Math.random()*100),
          energy: 0.5 + Math.random()*0.5,
        }
      })
    }

    function spawn(from: Node, toId: string, type='msg') {
      const to = nodes.find(n => n.id === toId)
      if (!to) return
      const sp = SPRITES[from.id] || { color: '#888' }
      parts.push({ x:from.x, y:from.y, tx:to.x, ty:to.y, p:0, color:sp.color, sz: type==='energy'?6:4 })
      if (parts.length > 80) parts = parts.slice(-60)
    }

    function addEv(text: string, color: string) {
      events.push({ text, color, opacity:1, time:Date.now() })
      if (events.length > 8) events = events.slice(-8)
    }

    // ── resize ────────────────────────────────────────────────────────────
    function resize() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (W < 10 || H < 10) return          // guard against 0-dim flash
      canvas.width  = W
      canvas.height = H
      if (nodes.length === 0) init(W, H)
      else {
        // recentre nodes proportionally instead of reinitialising
        const scaleX = W / (canvas.width  || W)
        const scaleY = H / (canvas.height || H)
        nodes.forEach(n => { n.x = Math.max(60, Math.min(W-60, n.x*scaleX)); n.y = Math.max(60, Math.min(H-60, n.y*scaleY)) })
      }
    }

    // ── render loop ───────────────────────────────────────────────────────
    function draw() {
      raf = requestAnimationFrame(draw)
      const ctx = canvas.getContext('2d')
      if (!ctx || canvas.width < 10) return
      const W = canvas.width, H = canvas.height
      time += 0.016

      // background
      ctx.fillStyle = '#070707'; ctx.fillRect(0,0,W,H)
      ctx.strokeStyle='rgba(255,255,255,0.02)'; ctx.lineWidth=1
      for (let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for (let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,200)
      g.addColorStop(0,'rgba(201,168,76,0.04)');g.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H)

      // update nodes
      nodes.forEach(n => {
        n.x+=n.vx; n.y+=n.vy
        if(n.x<60||n.x>W-60)n.vx*=-1
        if(n.y<60||n.y>H-60)n.vy*=-1
        n.vx*=0.995; n.vy*=0.995
        n.pulse+=0.05+(n.state==='thinking'?0.05:0)
        n.msgTimer--
        if(n.msgTimer<=0){
          n.msgTimer=150+Math.random()*300
          const msgs=MSGS[n.id]||['Working…']
          n.lastMsg=msgs[Math.floor(Math.random()*msgs.length)]
          const roll=Math.random()
          n.state=roll<0.1?'celebrating':roll<0.2?'alert':roll<0.3?'thinking':roll<0.05?'sleeping':'speaking'
          if(n.conns.length&&Math.random()<0.6)
            spawn(n,n.conns[Math.floor(Math.random()*n.conns.length)],Math.random()<0.2?'energy':'msg')
          if(Math.random()<0.15){
            const sp=SPRITES[n.id]||{emoji:'🤖',color:'#888'}
            addEv(`${sp.emoji} ${n.id.toUpperCase()}: ${n.lastMsg}`, sp.color)
          }
        }
        if(n.state==='celebrating'&&Math.random()<0.02)n.state='idle'
        if(n.state==='alert'&&Math.random()<0.015)n.state='idle'
        if(n.state==='speaking'&&Math.random()<0.01)n.state='idle'
      })

      // connection lines
      nodes.forEach(n=>{
        n.conns.forEach(tid=>{
          const t=nodes.find(x=>x.id===tid); if(!t)return
          const sp=SPRITES[n.id]||{color:'#888'}
          const dist=Math.hypot(t.x-n.x,t.y-n.y)
          const alpha=Math.max(0,0.15-dist/3000)
          ctx.strokeStyle=`${sp.color}${Math.floor(alpha*255).toString(16).padStart(2,'0')}`
          ctx.lineWidth=1;ctx.setLineDash([4,8])
          ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(t.x,t.y);ctx.stroke()
          ctx.setLineDash([])
        })
      })

      // particles
      parts=parts.filter(p=>p.p<1)
      parts.forEach(p=>{
        p.p+=0.018
        const t=p.p,mx=(p.x+p.tx)/2,my=(p.ty+p.y)/2-40
        const bx=(1-t)*(1-t)*p.x+2*(1-t)*t*mx+t*t*p.tx
        const by=(1-t)*(1-t)*p.y+2*(1-t)*t*my+t*t*p.ty
        const al=Math.sin(p.p*Math.PI)
        const gg=ctx.createRadialGradient(bx,by,0,bx,by,p.sz*3)
        gg.addColorStop(0,`${p.color}${Math.floor(al*200).toString(16).padStart(2,'0')}`)
        gg.addColorStop(1,'transparent')
        ctx.fillStyle=gg;ctx.fillRect(bx-p.sz*3,by-p.sz*3,p.sz*6,p.sz*6)
        ctx.fillStyle=`${p.color}${Math.floor(al*255).toString(16).padStart(2,'0')}`
        ctx.beginPath();ctx.arc(bx,by,p.sz*al,0,Math.PI*2);ctx.fill()
      })

      // draw agents
      nodes.forEach(n=>{
        const sp=SPRITES[n.id]||{emoji:'🤖',color:'#888',size:28}
        const s=sp.size, ps=1+Math.sin(n.pulse)*0.06

        if(n.state==='alert'){
          const ap=(Math.sin(time*8)+1)/2
          ctx.strokeStyle=`rgba(239,68,68,${ap*0.8})`;ctx.lineWidth=2
          ctx.beginPath();ctx.arc(n.x,n.y,s*ps+10+ap*8,0,Math.PI*2);ctx.stroke()
        }
        if(n.state==='celebrating'){
          for(let i=0;i<6;i++){
            const a=(i/6)*Math.PI*2+time*3, d=s+12+Math.sin(time*5+i)*5
            ctx.font='10px serif';ctx.fillStyle='#fbbf24'
            ctx.fillText('✨',n.x+Math.cos(a)*d-5,n.y+Math.sin(a)*d+4)
          }
        }
        if(n.state==='thinking'){
          for(let i=0;i<3;i++){
            ctx.fillStyle=`rgba(255,255,255,${Math.sin(time*4+i)>0?1:0.2})`
            ctx.beginPath();ctx.arc(n.x-8+i*8,n.y-s-8,3,0,Math.PI*2);ctx.fill()
          }
        }

        // glow
        const gg2=ctx.createRadialGradient(n.x,n.y,s*0.5,n.x,n.y,s*2)
        gg2.addColorStop(0,`${sp.color}40`);gg2.addColorStop(1,'transparent')
        ctx.fillStyle=gg2;ctx.beginPath();ctx.arc(n.x,n.y,s*2,0,Math.PI*2);ctx.fill()

        // shadow
        ctx.fillStyle='rgba(0,0,0,0.4)'
        ctx.beginPath();ctx.ellipse(n.x,n.y+s*0.8,s*0.5,s*0.15,0,0,Math.PI*2);ctx.fill()

        // hex body
        const sel=selectedId===n.id
        ctx.fillStyle='#0d0d0d';ctx.strokeStyle=sp.color;ctx.lineWidth=n.state==='alert'?3:sel?2.5:1.5
        ctx.beginPath()
        for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2-Math.PI/2,r=s*0.7*ps;i===0?ctx.moveTo(n.x+Math.cos(a)*r,n.y+Math.sin(a)*r):ctx.lineTo(n.x+Math.cos(a)*r,n.y+Math.sin(a)*r)}
        ctx.closePath();ctx.fill();ctx.stroke()

        // emoji + label
        ctx.font=`${Math.floor(s*0.55)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle'
        ctx.fillText(sp.emoji,n.x,n.y)
        ctx.font='bold 10px DM Sans,sans-serif';ctx.fillStyle=sp.color;ctx.textBaseline='top'
        ctx.fillText(n.id.toUpperCase(),n.x,n.y+s*0.75)

        // speech bubble
        if(n.lastMsg&&n.state==='speaking'){
          ctx.font='10px DM Sans,sans-serif'
          const tw=ctx.measureText(n.lastMsg).width+12,bx=n.x-tw/2,by=n.y-s-32
          ctx.fillStyle='#141414';ctx.strokeStyle=sp.color;ctx.lineWidth=1
          ctx.beginPath();ctx.roundRect(bx,by,tw,20,4);ctx.fill();ctx.stroke()
          ctx.fillStyle='#141414';ctx.strokeStyle=sp.color
          ctx.beginPath();ctx.moveTo(n.x-4,by+20);ctx.lineTo(n.x+4,by+20);ctx.lineTo(n.x,by+28);ctx.closePath();ctx.fill();ctx.stroke()
          ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle'
          ctx.fillText(n.lastMsg,n.x,by+10)
        }
        if(n.state==='sleeping'){ctx.font='14px serif';ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillText('💤',n.x+s*0.5,n.y-s*0.5)}
      })

      // event log
      events.forEach((ev,i)=>{
        ev.opacity=Math.max(0,1-(Date.now()-ev.time)/6000)
        ctx.font='11px DM Mono,monospace';ctx.textAlign='left';ctx.textBaseline='top'
        ctx.fillStyle=`rgba(${h2rgb(ev.color)},${ev.opacity})`
        ctx.fillText(`› ${ev.text}`,16,20+i*22)
      })
      events=events.filter(ev=>ev.opacity>0)
    }

    // ── start ─────────────────────────────────────────────────────────────
    resize()
    window.addEventListener('resize', resize)
    draw()

    // React state updates — 1x per second only
    const statsInterval = setInterval(() => {
      setAgentCount(nodes.length)
      const alertCount  = nodes.filter(n=>n.state==='alert').length
      const activeCount = nodes.filter(n=>n.state!=='idle'&&n.state!=='sleeping').length
      setMood(alertCount>2?'alert':activeCount>4?'active':'peaceful')
      // expose selected node for panel
      setSelected(selectedId ? (nodes.find(n=>n.id===selectedId)||null) : null)
    }, 1000)

    // canvas click
    function onClick(e: MouseEvent) {
      const rect=canvas.getBoundingClientRect()
      const mx=e.clientX-rect.left, my=e.clientY-rect.top
      const hit=nodes.find(n=>{const sp=SPRITES[n.id]||{size:28};return Math.hypot(mx-n.x,my-n.y)<sp.size})
      selectedId=hit?.id||null
      if(hit){
        hit.state='celebrating'
        hit.conns.forEach(cid=>spawn(hit,cid,'energy'))
        addEv(`Selected ${hit.id.toUpperCase()} — ${hit.convos} conversations`, SPRITES[hit.id]?.color||'#fff')
      }
    }
    canvas.addEventListener('click', onClick)

    // realtime
    supabaseChannel
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'syndicate_messages'},(payload)=>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg=payload.new as any
        const from=nodes.find(n=>n.id===msg.from_agent)
        if(from&&msg.to_agent){
          spawn(from,msg.to_agent,msg.flagged_by_guardian?'alert':msg.message_type==='forge_brief'?'energy':'msg')
          from.state='speaking'; from.lastMsg=msg.message_type?.replace(/_/g,' ')||'transmitting'
          addEv(`${msg.from_agent} → ${msg.to_agent}`,SPRITES[msg.from_agent]?.color||'#888')
        }
      })
      .subscribe()

    // cleanup
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(statsInterval)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', onClick)
      supabase.removeChannel(supabaseChannel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moodCfg = { peaceful:{label:'● Peaceful',color:'#4ade80'}, active:{label:'⚡ Active',color:'#C9A84C'}, alert:{label:'🚨 Alert',color:'#ef4444'} }

  return (
    <div style={{height:'100vh',background:'#070707',display:'flex',flexDirection:'column',fontFamily:'DM Sans,sans-serif',overflow:'hidden'}}>
      {/* header */}
      <div style={{background:'#0d0d0d',borderBottom:'1px solid #1a1a1a',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:'#C9A84C',fontWeight:700,fontSize:16,letterSpacing:2,fontFamily:'Bebas Neue,sans-serif'}}>✦ LYCHO WORLD</span>
          <span style={{color:'#444',fontSize:11}}>Agent Society — Live</span>
          <span style={{color:moodCfg[mood].color,fontSize:12,fontWeight:600}}>{moodCfg[mood].label}</span>
        </div>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{color:'#C9A84C',fontWeight:700,fontSize:18,fontFamily:'Bebas Neue,sans-serif'}}>{agentCount}</div>
            <div style={{color:'#444',fontSize:10}}>Agents</div>
          </div>
          <button onClick={()=>setShowLegend(v=>!v)} style={{background:'#141414',border:'1px solid #2a2a2a',borderRadius:6,padding:'6px 12px',color:'#888',cursor:'pointer',fontSize:12}}>
            {showLegend?'Hide':'Show'} Legend
          </button>
        </div>
      </div>

      {/* canvas */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}} />

        {/* selected agent panel */}
        {selected && (
          <div style={{position:'absolute',top:16,right:16,background:'#0d0d0d',border:`1px solid ${SPRITES[selected.id]?.color||'#888'}`,borderRadius:8,padding:20,minWidth:220,boxShadow:`0 0 30px ${SPRITES[selected.id]?.color||'#888'}33`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div style={{color:SPRITES[selected.id]?.color||'#fff',fontWeight:700,fontSize:16}}>{SPRITES[selected.id]?.emoji} {selected.id.toUpperCase()}</div>
                <div style={{color:'#666',fontSize:12}}>{SPRITES[selected.id]?.role||'Specialist'}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:16}}>×</button>
            </div>
            {[{label:'Status',value:selected.state.toUpperCase()},{label:'Conversations',value:selected.convos.toLocaleString()},{label:'Energy',value:`${Math.round(selected.energy*100)}%`},{label:'Connections',value:selected.conns.length}].map(item=>(
              <div key={item.label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #111'}}>
                <span style={{color:'#666',fontSize:12}}>{item.label}</span>
                <span style={{color:'#fff',fontSize:12,fontWeight:600}}>{item.value}</span>
              </div>
            ))}
            {selected.lastMsg&&<div style={{marginTop:12,background:'#141414',borderRadius:6,padding:'8px 10px',color:'#aaa',fontSize:12}}>Last: "{selected.lastMsg}"</div>}
          </div>
        )}

        {/* legend */}
        {showLegend&&(
          <div style={{position:'absolute',bottom:16,right:16,background:'#0d0d0d',border:'1px solid #1a1a1a',borderRadius:8,padding:16,maxWidth:200}}>
            <div style={{color:'#666',fontSize:10,fontWeight:700,letterSpacing:1,marginBottom:10}}>AGENT SOCIETY</div>
            {Object.entries(SPRITES).slice(0,8).map(([type,sp])=>(
              <div key={type} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{fontSize:14}}>{sp.emoji}</span>
                <span style={{color:sp.color,fontSize:11,fontWeight:600}}>{type.toUpperCase()}</span>
                <span style={{color:'#444',fontSize:10}}>{sp.role}</span>
              </div>
            ))}
            <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #1a1a1a',color:'#444',fontSize:10}}>Click any agent to inspect</div>
          </div>
        )}

        <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',color:'#333',fontSize:11,pointerEvents:'none'}}>
          Click any agent to inspect • Live via Syndicate
        </div>
      </div>
    </div>
  )
}
