'use client'
import { useState, useEffect, useRef } from 'react'

const SECTIONS = ['dashboard', 'tenants', 'forge', 'nexus', 'orion', 'payments', 'waitlist'] as const
type Section = typeof SECTIONS[number]

type ChatEntity = 'orion' | 'forge' | 'nexus'
interface ChatMessage { role: 'user' | 'assistant'; content: string; entity?: string }

export default function MasterPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [section, setSection] = useState<Section>('dashboard')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [forgeLoading, setForgeLoading] = useState(false)
  const [forgeResult, setForgeResult] = useState('')
  const [nexusLoading, setNexusLoading] = useState(false)
  const [nexusResult, setNexusResult] = useState('')
  const [orionLoading, setOrionLoading] = useState(false)
  const [orionResult, setOrionResult] = useState('')
  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatEntity, setChatEntity] = useState<ChatEntity>('orion')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('lycho_master')
    if (saved === process.env.NEXT_PUBLIC_MASTER_HINT) setAuthed(true)
  }, [])

  function login(e: React.FormEvent) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_MASTER_HINT) {
      sessionStorage.setItem('lycho_master', password)
      setAuthed(true)
    } else {
      setError('Invalid password')
    }
  }

  async function loadSection(s: Section) {
    setSection(s)
    setLoading(true)
    try {
      const res = await fetch(`/api/master/data?section=${s}`, {
        headers: { 'x-master-secret': password || sessionStorage.getItem('lycho_master') || '' }
      })
      const json = await res.json()
      setData(json)
    } catch { setData(null) }
    setLoading(false)
  }

  async function runNexus() {
    setNexusLoading(true)
    setNexusResult('⏳ Nexus is running...')
    try {
      const res = await fetch('/api/nexus/generate', {
        method: 'POST',
        headers: { 'x-master-secret': sessionStorage.getItem('lycho_master') || '' }
      })
      const json = await res.json()
      if (json.success) {
        setNexusResult(`✅ ${json.templates_queued} templates queued — refreshing...`)
        loadSection('nexus')
      } else {
        setNexusResult(`❌ ${json.error}`)
      }
    } catch(e: unknown) {
      const err = e as { message?: string }
      setNexusResult(`❌ ${err.message}`)
    }
    setNexusLoading(false)
  }

  async function runForge() {
    setForgeLoading(true)
    setForgeResult('⏳ Forge is running...')
    try {
      const res = await fetch('/api/forge/autonomous', {
        method: 'POST',
        headers: { 'x-master-secret': sessionStorage.getItem('lycho_master') || '' }
      })
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
      let chunks = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks += new TextDecoder().decode(value)
      }
      const json = JSON.parse(chunks)
      if (json.success) {
        setForgeResult(`✅ ${json.agents_queued} agents queued — refreshing...`)
        loadSection('forge')
      } else {
        setForgeResult(`❌ ${json.error}`)
      }
    } catch(e: unknown) {
      const err = e as { message?: string }
      setForgeResult(`❌ ${err.message}`)
    }
    setForgeLoading(false)
  }

  async function runOrionOptimise() {
    setOrionLoading(true)
    setOrionResult('⏳ Orion optimisation running...')
    try {
      const res = await fetch('/api/orion/optimise', {
        method: 'POST',
        headers: { 'x-master-secret': sessionStorage.getItem('lycho_master') || '' }
      })
      const json = await res.json()
      if (json.success) {
        setOrionResult(`✅ ${json.optimised} agents optimised`)
        loadSection('orion')
      } else {
        setOrionResult(`❌ ${json.error}`)
      }
    } catch(e: unknown) {
      const err = e as { message?: string }
      setOrionResult(`❌ ${err.message}`)
    }
    setOrionLoading(false)
  }

  async function seedCountries() {
    setOrionResult('⏳ Seeding countries...')
    try {
      const res = await fetch('/api/orion/seed-countries', {
        method: 'POST',
        headers: { 'x-master-secret': sessionStorage.getItem('lycho_master') || '' }
      })
      const json = await res.json()
      setOrionResult(json.success ? `✅ ${json.seeded}/${json.total} countries seeded` : `❌ ${json.error}`)
    } catch(e: unknown) {
      const err = e as { message?: string }
      setOrionResult(`❌ ${err.message}`)
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim()
    setChatInput('')
    const userMsg: ChatMessage = { role: 'user', content: msg }
    const newHistory = [...chatHistory, userMsg]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const res = await fetch('/api/master/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-master-secret': sessionStorage.getItem('lycho_master') || '' },
        body: JSON.stringify({
          entity: chatEntity,
          message: msg,
          history: newHistory.slice(-10).map(h => ({ role: h.role, content: h.content }))
        })
      })
      const json = await res.json()
      if (json.success) {
        const actionLog = json.actions_taken?.length ? `\n\n⚡ Actions executed:\n${json.actions_taken.join('\n')}` : ''
        setChatHistory(prev => [...prev, { role: 'assistant', content: json.reply + actionLog, entity: json.entity }])
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${json.error}`, entity: chatEntity.toUpperCase() }])
      }
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Connection error.', entity: chatEntity.toUpperCase() }])
    }
    setChatLoading(false)
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  useEffect(() => { if (authed) loadSection('dashboard') }, [authed])

  useEffect(() => {
    const interval = setInterval(() => loadSection(section), 30000)
    return () => clearInterval(interval)
  }, [section, authed])

  const entityColors: Record<ChatEntity, string> = { orion: '#a78bfa', forge: '#f59e0b', nexus: '#34d399' }
  const entityLabels: Record<ChatEntity, string> = { orion: 'ORION — Intelligence', forge: 'FORGE — Agent Builder', nexus: 'NEXUS — Automations' }

  if (!authed) return (
    <div style={{minHeight:'100vh',background:'#070707',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#141414',border:'1px solid #2a2a2a',borderRadius:12,padding:40,width:360}}>
        <h1 style={{color:'#C9A84C',fontFamily:'sans-serif',fontSize:28,fontWeight:900,marginBottom:8,letterSpacing:2}}>LYCHO MASTER</h1>
        <p style={{color:'#666',fontSize:14,marginBottom:24}}>Backend control panel</p>
        <form onSubmit={login}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Master secret" autoFocus
            style={{width:'100%',background:'#0a0a0a',border:'1px solid #2a2a2a',borderRadius:8,padding:'12px 16px',color:'#fff',fontSize:14,marginBottom:12,boxSizing:'border-box'}} />
          {error && <p style={{color:'#ef4444',fontSize:13,marginBottom:12}}>{error}</p>}
          <button type="submit" style={{width:'100%',background:'#C9A84C',color:'#070707',border:'none',borderRadius:8,padding:'12px 16px',fontSize:14,fontWeight:700,cursor:'pointer'}}>
            Enter
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#070707',display:'flex',color:'#fff',fontFamily:'sans-serif'}}>
      {/* Sidebar */}
      <div style={{width:220,background:'#0d0d0d',borderRight:'1px solid #1a1a1a',padding:'24px 0',flexShrink:0,display:'flex',flexDirection:'column'}}>
        <div style={{padding:'0 20px 24px',borderBottom:'1px solid #1a1a1a',marginBottom:16}}>
          <div style={{color:'#C9A84C',fontWeight:900,fontSize:18,letterSpacing:2}}>LYCHO</div>
          <div style={{color:'#444',fontSize:11,marginTop:2}}>MASTER PANEL</div>
        </div>
        {SECTIONS.map(s => (
          <div key={s} onClick={()=>loadSection(s)}
            style={{padding:'10px 20px',cursor:'pointer',background:section===s?'rgba(201,168,76,0.08)':'transparent',
              borderLeft:section===s?'2px solid #C9A84C':'2px solid transparent',
              color:section===s?'#C9A84C':'#666',fontSize:13,textTransform:'capitalize',transition:'all 0.2s'}}>
            {s === 'forge' ? 'Forge Queue' : s === 'nexus' ? 'Nexus Queue' : s === 'payments' ? 'Payments' : s === 'orion' ? 'Orion Intelligence' : s.charAt(0).toUpperCase()+s.slice(1)}
          </div>
        ))}
        <div style={{marginTop:'auto',padding:'16px 20px',borderTop:'1px solid #1a1a1a'}}>
          {/* Command Center Chat button */}
          <div onClick={()=>setChatOpen(true)}
            style={{cursor:'pointer',background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.3)',borderRadius:8,padding:'8px 12px',marginBottom:12,textAlign:'center',color:'#a78bfa',fontSize:12,fontWeight:700,letterSpacing:1}}>
            COMMAND CENTER
          </div>
          <div onClick={()=>{sessionStorage.clear();setAuthed(false)}}
            style={{cursor:'pointer',color:'#ef4444',fontSize:13}}>Logout</div>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,padding:32,overflowY:'auto'}}>
        {loading && <div style={{color:'#666'}}>Loading...</div>}
        {!loading && data && (
          <div>
            {section === 'dashboard' && (
              <div>
                <h2 style={{color:'#C9A84C',fontSize:24,fontWeight:900,marginBottom:24,letterSpacing:1}}>COMMAND CENTER</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16,marginBottom:32}}>
                  {[
                    {label:'Total Tenants', value:data.total_tenants||0},
                    {label:'Active Trials', value:data.active_trials||0},
                    {label:'Paying Clients', value:data.paying||0},
                    {label:'MRR (PKR)', value:`${(data.mrr_pkr||0).toLocaleString()}`},
                    {label:'Interactions Today', value:data.interactions_today||0},
                    {label:'Agents Deployed', value:data.agents_deployed||0},
                  ].map(k=>(
                    <div key={k.label} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:16}}>
                      <div style={{color:'#444',fontSize:11,marginBottom:4}}>{k.label}</div>
                      <div style={{color:'#C9A84C',fontSize:22,fontWeight:700}}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <h3 style={{color:'#888',fontSize:14,marginBottom:12}}>RECENT SIGNUPS</h3>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Business','Email','Plan','Status','Joined'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#444',fontSize:11,borderBottom:'1px solid #1a1a1a'}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{(data.recent_tenants||[]).map((t:any)=>(
                    <tr key={t.id} style={{borderBottom:'1px solid #111'}}>
                      <td style={{padding:'10px 12px',fontSize:13}}>{t.business_name}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#666'}}>{t.business_email}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#C9A84C'}}>{t.plan}</td>
                      <td style={{padding:'10px 12px',fontSize:13}}><span style={{background:t.plan_status==='enterprise'?'#064e3b':t.plan_status==='trial'?'#1e3a5f':'#1a1a1a',color:t.plan_status==='enterprise'?'#34d399':t.plan_status==='trial'?'#60a5fa':'#666',padding:'2px 8px',borderRadius:4,fontSize:11}}>{t.plan_status}</span></td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#444'}}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {section === 'tenants' && (
              <div>
                <h2 style={{color:'#C9A84C',fontSize:24,fontWeight:900,marginBottom:24,letterSpacing:1}}>ALL TENANTS</h2>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Business','Email','Plan','Status','Agents','Trial Ends','Joined','Action'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#444',fontSize:11,borderBottom:'1px solid #1a1a1a'}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{(data.tenants||[]).map((t:any)=>(
                    <tr key={t.id} style={{borderBottom:'1px solid #111'}}>
                      <td style={{padding:'10px 12px',fontSize:13}}>{t.business_name}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#666'}}>{t.business_email}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#C9A84C'}}>{t.plan}</td>
                      <td style={{padding:'10px 12px',fontSize:13}}>{t.plan_status}</td>
                      <td style={{padding:'10px 12px',fontSize:13}}>{t.agent_count||0}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#444'}}>{t.trial_ends_at?new Date(t.trial_ends_at).toLocaleDateString():'-'}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#444'}}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={{padding:'10px 12px'}}>
                        <button onClick={async()=>{
                          if(!confirm(`Permanently delete "${t.business_name}" (${t.business_email}) and all auth users? This cannot be undone.`)) return
                          const res = await fetch(`/api/master/tenants/${t.id}`,{method:'PUT',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({action:'purge'})})
                          const json = await res.json()
                          if (!res.ok) { alert(`Delete failed: ${json.error}`); return }
                          loadSection('tenants')
                        }} style={{background:'transparent',color:'#ef4444',border:'1px solid #7f1d1d',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer'}}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {section === 'forge' && (
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:forgeResult?12:24}}>
                  <h2 style={{color:'#C9A84C',fontSize:24,fontWeight:900,letterSpacing:1}}>FORGE QUEUE</h2>
                  <button onClick={runForge} disabled={forgeLoading}
                    style={{background:forgeLoading?'#7a6130':'#C9A84C',color:'#070707',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:700,cursor:forgeLoading?'not-allowed':'pointer'}}>
                    {forgeLoading ? 'Running…' : 'Run Forge Now'}
                  </button>
                </div>
                {forgeResult && <p style={{color:forgeResult.startsWith('✅')?'#34d399':'#ef4444',fontSize:13,marginBottom:16}}>{forgeResult}</p>}
                {(data.queue||[]).length===0 && <p style={{color:'#444'}}>No agents in queue. Run Forge to generate new agents.</p>}
                {(data.queue||[]).map((agent:any)=>(
                  <div key={agent.id} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:20,marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                      <div>
                        <div style={{color:'#fff',fontSize:16,fontWeight:600}}>{agent.display_name}</div>
                        <div style={{color:'#666',fontSize:13,marginTop:4}}>{agent.description}</div>
                      </div>
                      <div style={{color:'#C9A84C',fontSize:13}}>PKR {(agent.estimated_value_pkr||0).toLocaleString()}/mo</div>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                      {(agent.sector_tags||[]).map((t:string)=>(
                        <span key={t} style={{background:'#1a1a1a',color:'#888',padding:'2px 8px',borderRadius:4,fontSize:11}}>{t}</span>
                      ))}
                    </div>
                    <div style={{marginBottom:12}}>
                      {(agent.use_case_examples||[]).map((ex:string,i:number)=>(
                        <div key={i} style={{color:'#666',fontSize:13,marginBottom:4}}>{ex}</div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={async()=>{
                        const res = await fetch(`/api/forge/queue/${agent.id}`,{method:'PUT',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({action:'approve'})})
                        const json = await res.json()
                        if (!res.ok) { alert(`Approve failed: ${json.error}`); return }
                        loadSection('forge')
                      }} style={{background:'#064e3b',color:'#34d399',border:'1px solid #065f46',borderRadius:6,padding:'6px 16px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                        Approve &amp; Deploy
                      </button>
                      <button onClick={async()=>{
                        const notes = prompt('Rejection reason (optional):')
                        await fetch(`/api/forge/queue/${agent.id}`,{method:'PUT',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({action:'reject',notes})})
                        loadSection('forge')
                      }} style={{background:'transparent',color:'#ef4444',border:'1px solid #7f1d1d',borderRadius:6,padding:'6px 16px',fontSize:13,cursor:'pointer'}}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {section === 'nexus' && (
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:nexusResult?12:24}}>
                  <h2 style={{color:'#C9A84C',fontSize:24,fontWeight:900,letterSpacing:1}}>NEXUS QUEUE</h2>
                  <button onClick={runNexus} disabled={nexusLoading}
                    style={{background:nexusLoading?'#7a6130':'#C9A84C',color:'#070707',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:700,cursor:nexusLoading?'not-allowed':'pointer'}}>
                    {nexusLoading ? 'Running…' : 'Run Nexus Now'}
                  </button>
                </div>
                {nexusResult && <p style={{color:nexusResult.startsWith('✅')?'#34d399':'#ef4444',fontSize:13,marginBottom:16}}>{nexusResult}</p>}
                {(data.queue||[]).length===0 && <p style={{color:'#444'}}>No templates in queue. Run Nexus to generate automation templates.</p>}
                {(data.queue||[]).map((tmpl:any)=>(
                  <div key={tmpl.id} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:20,marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                      <div>
                        <div style={{color:'#fff',fontSize:16,fontWeight:600}}>{tmpl.name}</div>
                        <div style={{color:'#666',fontSize:13,marginTop:4}}>{tmpl.description}</div>
                        <div style={{color:'#444',fontSize:12,marginTop:4}}>Category: {tmpl.category} · Trigger: {tmpl.trigger?.type}</div>
                      </div>
                      <span style={{background:'rgba(201,168,76,0.1)',color:'#C9A84C',padding:'2px 8px',borderRadius:4,fontSize:11,whiteSpace:'nowrap'}}>{tmpl.category}</span>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
                      {(tmpl.sector_tags||[]).map((t:string)=>(
                        <span key={t} style={{background:'#1a1a1a',color:'#888',padding:'2px 8px',borderRadius:4,fontSize:11}}>{t}</span>
                      ))}
                    </div>
                    <div style={{marginBottom:12}}>
                      {(tmpl.use_case_examples||[]).map((ex:string,i:number)=>(
                        <div key={i} style={{color:'#666',fontSize:13,marginBottom:4}}>· {ex}</div>
                      ))}
                    </div>
                    {tmpl.why_useful && <div style={{color:'#888',fontSize:12,marginBottom:12,fontStyle:'italic'}}>{tmpl.why_useful}</div>}
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={async()=>{
                        const res = await fetch(`/api/nexus/queue/${tmpl.id}`,{method:'PUT',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({action:'approve'})})
                        const json = await res.json()
                        if (!res.ok) { alert(`Approve failed: ${json.error}`); return }
                        loadSection('nexus')
                      }} style={{background:'#064e3b',color:'#34d399',border:'1px solid #065f46',borderRadius:6,padding:'6px 16px',fontSize:13,cursor:'pointer',fontWeight:600}}>
                        Approve &amp; Publish
                      </button>
                      <button onClick={async()=>{
                        const notes = prompt('Rejection reason (optional):')
                        await fetch(`/api/nexus/queue/${tmpl.id}`,{method:'PUT',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({action:'reject',notes})})
                        loadSection('nexus')
                      }} style={{background:'transparent',color:'#ef4444',border:'1px solid #7f1d1d',borderRadius:6,padding:'6px 16px',fontSize:13,cursor:'pointer'}}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {section === 'orion' && (
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:orionResult?12:24,flexWrap:'wrap',gap:12}}>
                  <div>
                    <h2 style={{color:'#a78bfa',fontSize:24,fontWeight:900,letterSpacing:1,margin:0}}>ORION COMMAND CENTER</h2>
                    <p style={{color:'#555',fontSize:12,margin:'4px 0 0'}}>Autonomous intelligence layer — central nervous system of LYCHO</p>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={seedCountries} style={{background:'#1e1b4b',color:'#a78bfa',border:'1px solid #3730a3',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                      Seed Countries
                    </button>
                    <button onClick={runOrionOptimise} disabled={orionLoading}
                      style={{background:orionLoading?'#3730a3':'#a78bfa',color:'#070707',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:700,cursor:orionLoading?'not-allowed':'pointer'}}>
                      {orionLoading ? 'Optimising…' : 'Run Optimisation Now'}
                    </button>
                  </div>
                </div>
                {orionResult && <p style={{color:orionResult.startsWith('✅')?'#34d399':'#ef4444',fontSize:13,marginBottom:16}}>{orionResult}</p>}
                {/* Stats grid */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:16,marginBottom:32}}>
                  {[
                    {label:'Agents in Store', value:data.total_agents||0, color:'#a78bfa'},
                    {label:'Avg Intelligence Score', value:`${data.avg_score||0}/100`, color:'#a78bfa'},
                    {label:'Optimisations This Week', value:data.optimisations_week||0, color:'#a78bfa'},
                    {label:'Council Sessions Today', value:data.council_sessions_today||0, color:'#a78bfa'},
                    {label:'Countries Active', value:Object.keys(data.country_distribution||{}).length, color:'#a78bfa'},
                    {label:'Underperforming', value:(data.underperforming||[]).length, color:'#ef4444'},
                  ].map(k=>(
                    <div key={k.label} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:16}}>
                      <div style={{color:'#444',fontSize:11,marginBottom:4}}>{k.label}</div>
                      <div style={{color:k.color,fontSize:22,fontWeight:700}}>{k.value}</div>
                    </div>
                  ))}
                </div>
                {/* Underperforming agents */}
                {(data.underperforming||[]).length > 0 && (
                  <div style={{marginBottom:32}}>
                    <h3 style={{color:'#888',fontSize:14,marginBottom:12}}>UNDERPERFORMING AGENTS</h3>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead><tr>{['Agent Type','Score','Version','Last Optimised'].map(h=>(
                        <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#444',fontSize:11,borderBottom:'1px solid #1a1a1a'}}>{h}</th>
                      ))}</tr></thead>
                      <tbody>{(data.underperforming||[]).map((a:any)=>(
                        <tr key={a.agent_type} style={{borderBottom:'1px solid #111'}}>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#fff'}}>{a.agent_type}</td>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#ef4444'}}>{a.intelligence_score}/100</td>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#666'}}>v{a.version||1}</td>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#444'}}>{a.last_optimised_at?new Date(a.last_optimised_at).toLocaleDateString():'-'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {/* All agents */}
                {(data.all_agents||[]).length > 0 && (
                  <div style={{marginBottom:32}}>
                    <h3 style={{color:'#888',fontSize:14,marginBottom:12}}>ALL AGENTS IN INTELLIGENCE STORE</h3>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead><tr>{['Agent Type','Score','Version','Conversations','Optimised'].map(h=>(
                        <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#444',fontSize:11,borderBottom:'1px solid #1a1a1a'}}>{h}</th>
                      ))}</tr></thead>
                      <tbody>{(data.all_agents||[]).map((a:any)=>(
                        <tr key={a.agent_type} style={{borderBottom:'1px solid #111'}}>
                          <td style={{padding:'10px 12px',fontSize:13}}>{a.agent_type}</td>
                          <td style={{padding:'10px 12px',fontSize:13}}>
                            <span style={{color:a.intelligence_score>=80?'#34d399':a.intelligence_score>=60?'#C9A84C':'#ef4444',fontWeight:600}}>{a.intelligence_score}</span>
                          </td>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#666'}}>v{a.version||1}</td>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#666'}}>{a.performance_data?.total_conversations||0}</td>
                          <td style={{padding:'10px 12px',fontSize:13,color:'#444'}}>{a.last_optimised_at?new Date(a.last_optimised_at).toLocaleDateString():'-'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {/* Optimisation log */}
                {(data.optimisation_log||[]).length > 0 && (
                  <div>
                    <h3 style={{color:'#888',fontSize:14,marginBottom:12}}>RECENT OPTIMISATION LOG</h3>
                    {(data.optimisation_log||[]).slice(0,10).map((log:any)=>(
                      <div key={log.id} style={{background:'#111',border:'1px solid #1a1a1a',borderRadius:8,padding:16,marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                          <span style={{color:'#fff',fontSize:13,fontWeight:600}}>{log.agent_type}</span>
                          <span style={{color:'#666',fontSize:11}}>{new Date(log.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{color:'#666',fontSize:12,marginBottom:4}}>{log.trigger_reason}</div>
                        <div style={{color:'#a78bfa',fontSize:12}}>Score: {log.previous_score} → {log.new_score}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {section === 'payments' && (
              <div>
                <h2 style={{color:'#C9A84C',fontSize:24,fontWeight:900,marginBottom:24,letterSpacing:1}}>PAYMENTS</h2>
                {(data.payments||[]).length===0 && <p style={{color:'#444'}}>No payment requests yet.</p>}
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Business','Plan','Amount (PKR)','Method','Transaction ID','Status','Date','Action'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#444',fontSize:11,borderBottom:'1px solid #1a1a1a'}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{(data.payments||[]).map((p:any)=>(
                    <tr key={p.id} style={{borderBottom:'1px solid #111',background:p.status==='pending'?'rgba(201,168,76,0.04)':'transparent'}}>
                      <td style={{padding:'10px 12px',fontSize:13}}>{p.tenants?.business_name||'-'}<br/><span style={{color:'#444',fontSize:11}}>{p.tenants?.business_email||'-'}</span></td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#C9A84C'}}>{p.plan}</td>
                      <td style={{padding:'10px 12px',fontSize:13}}>{(p.amount_pkr||0).toLocaleString()}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#888'}}>{p.payment_method}</td>
                      <td style={{padding:'10px 12px',fontSize:11,color:'#666',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis'}}>{p.transaction_id||'-'}</td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{background:p.status==='approved'?'#064e3b':p.status==='pending'?'rgba(201,168,76,0.15)':'#1a1a1a',color:p.status==='approved'?'#34d399':p.status==='pending'?'#C9A84C':'#666',padding:'2px 8px',borderRadius:4,fontSize:11}}>{p.status}</span>
                      </td>
                      <td style={{padding:'10px 12px',fontSize:11,color:'#444'}}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{padding:'10px 12px'}}>
                        {p.status==='pending' && (
                          <button onClick={async()=>{
                            await fetch('/api/master/activate',{method:'POST',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({tenant_id:p.tenant_id,plan:p.plan,billing_cycle:p.billing_cycle,payment_request_id:p.id})})
                            loadSection('payments')
                          }} style={{background:'#064e3b',color:'#34d399',border:'1px solid #065f46',borderRadius:6,padding:'4px 12px',fontSize:12,cursor:'pointer',fontWeight:600}}>
                            ✅ Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {section === 'waitlist' && (
              <div>
                <h2 style={{color:'#C9A84C',fontSize:24,fontWeight:900,marginBottom:24,letterSpacing:1}}>WAITLIST</h2>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr>{['Position','Email','Name','Referrals','Joined'].map(h=>(
                    <th key={h} style={{textAlign:'left',padding:'8px 12px',color:'#444',fontSize:11,borderBottom:'1px solid #1a1a1a'}}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{(data.waitlist||[]).map((w:any)=>(
                    <tr key={w.id} style={{borderBottom:'1px solid #111'}}>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#C9A84C'}}>#{w.position}</td>
                      <td style={{padding:'10px 12px',fontSize:13}}>{w.email}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#666'}}>{w.name||'-'}</td>
                      <td style={{padding:'10px 12px',fontSize:13}}>{w.referral_count||0}</td>
                      <td style={{padding:'10px 12px',fontSize:13,color:'#444'}}>{new Date(w.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COMMAND CENTER CHAT MODAL */}
      {chatOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'flex-end',justifyContent:'flex-end',padding:24,zIndex:1000}}>
          <div style={{width:480,height:620,background:'#0d0d0d',border:`1px solid ${entityColors[chatEntity]}33`,borderRadius:16,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Header */}
            <div style={{padding:'16px 20px',borderBottom:'1px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <div style={{color:entityColors[chatEntity],fontWeight:900,fontSize:14,letterSpacing:1}}>COMMAND CENTER</div>
                <div style={{color:'#444',fontSize:11,marginTop:2}}>Direct line to your intelligence systems</div>
              </div>
              <button onClick={()=>setChatOpen(false)} style={{background:'transparent',border:'1px solid #2a2a2a',borderRadius:6,color:'#888',fontSize:12,cursor:'pointer',padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>← Back</button>
            </div>
            {/* Entity selector */}
            <div style={{padding:'12px 20px',borderBottom:'1px solid #111',display:'flex',gap:8}}>
              {(['orion','forge','nexus'] as ChatEntity[]).map(e=>(
                <button key={e} onClick={()=>{setChatEntity(e);setChatHistory([])}}
                  style={{flex:1,background:chatEntity===e?`${entityColors[e]}15`:'transparent',border:`1px solid ${chatEntity===e?entityColors[e]:'#222'}`,borderRadius:8,padding:'6px 8px',color:chatEntity===e?entityColors[e]:'#555',fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:1}}>
                  {e.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Entity label */}
            <div style={{padding:'8px 20px',background:`${entityColors[chatEntity]}08`}}>
              <span style={{color:entityColors[chatEntity],fontSize:11,fontWeight:600}}>{entityLabels[chatEntity]}</span>
            </div>
            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
              {chatHistory.length === 0 && (
                <div style={{color:'#333',fontSize:13,textAlign:'center',marginTop:40}}>
                  <div style={{color:entityColors[chatEntity],fontSize:28,marginBottom:8}}>◈</div>
                  <div>Speak to {chatEntity.toUpperCase()} directly.</div>
                  <div style={{marginTop:4,fontSize:12}}>Ask about diagnostics, operations, performance,</div>
                  <div style={{fontSize:12}}>or issue commands to act immediately.</div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{display:'flex',flexDirection:'column',alignItems:msg.role==='user'?'flex-end':'flex-start'}}>
                  {msg.role === 'assistant' && (
                    <div style={{color:entityColors[chatEntity],fontSize:10,fontWeight:700,marginBottom:4,letterSpacing:1}}>{msg.entity || chatEntity.toUpperCase()}</div>
                  )}
                  <div style={{
                    maxWidth:'85%',padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.5,
                    background:msg.role==='user'?'#1a1a1a':`${entityColors[chatEntity]}10`,
                    color:msg.role==='user'?'#ccc':'#e5e7eb',
                    border:msg.role==='assistant'?`1px solid ${entityColors[chatEntity]}20`:'1px solid #222'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                  <div style={{color:entityColors[chatEntity],fontSize:10,fontWeight:700,marginBottom:4,letterSpacing:1}}>{chatEntity.toUpperCase()}</div>
                  <div style={{background:`${entityColors[chatEntity]}10`,border:`1px solid ${entityColors[chatEntity]}20`,borderRadius:12,padding:'10px 14px',color:entityColors[chatEntity],fontSize:13}}>
                    <span style={{opacity:0.7}}>Processing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {/* Input */}
            <div style={{padding:'12px 20px',borderTop:'1px solid #111',display:'flex',gap:8}}>
              <input
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()} }}
                placeholder={`Message ${chatEntity.toUpperCase()}...`}
                disabled={chatLoading}
                style={{flex:1,background:'#0a0a0a',border:`1px solid #222`,borderRadius:8,padding:'10px 14px',color:'#fff',fontSize:13,outline:'none'}}
              />
              <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()}
                style={{background:entityColors[chatEntity],color:'#070707',border:'none',borderRadius:8,padding:'10px 16px',fontSize:13,fontWeight:700,cursor:chatLoading||!chatInput.trim()?'not-allowed':'pointer',opacity:chatLoading||!chatInput.trim()?0.5:1}}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
