'use client'
import { useState, useEffect } from 'react'

const SECTIONS = ['dashboard', 'tenants', 'forge', 'payments', 'waitlist'] as const
type Section = typeof SECTIONS[number]

export default function MasterPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [section, setSection] = useState<Section>('dashboard')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [forgeLoading, setForgeLoading] = useState(false)
  const [forgeResult, setForgeResult] = useState('')

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

  async function runForge() {
    setForgeLoading(true)
    setForgeResult('')
    try {
      const res = await fetch('/api/forge/autonomous', {
        method: 'POST',
        headers: { 'x-master-secret': sessionStorage.getItem('lycho_master') || '' }
      })
      const text = await res.text()
      if (!text) { setForgeResult('❌ Empty response'); setForgeLoading(false); return }
      const json = JSON.parse(text)
      if (res.ok) {
        setForgeResult('⏳ Forge is running... agents will appear in queue within 30 seconds')
        setTimeout(() => {
          loadSection('forge')
          setForgeResult('✅ Done — check queue below')
          setForgeLoading(false)
        }, 35000)
      } else {
        setForgeResult(`❌ Error: ${json.error}`)
        setForgeLoading(false)
      }
    } catch(e: any) {
      setForgeResult(`❌ Failed: ${e.message}`)
      setForgeLoading(false)
    }
  }

  useEffect(() => { if (authed) loadSection('dashboard') }, [authed])

  useEffect(() => {
    const interval = setInterval(() => loadSection(section), 30000)
    return () => clearInterval(interval)
  }, [section, authed])

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
      <div style={{width:220,background:'#0d0d0d',borderRight:'1px solid #1a1a1a',padding:'24px 0',flexShrink:0}}>
        <div style={{padding:'0 20px 24px',borderBottom:'1px solid #1a1a1a',marginBottom:16}}>
          <div style={{color:'#C9A84C',fontWeight:900,fontSize:18,letterSpacing:2}}>LYCHO</div>
          <div style={{color:'#444',fontSize:11,marginTop:2}}>MASTER PANEL</div>
        </div>
        {SECTIONS.map(s => (
          <div key={s} onClick={()=>loadSection(s)}
            style={{padding:'10px 20px',cursor:'pointer',background:section===s?'rgba(201,168,76,0.08)':'transparent',
              borderLeft:section===s?'2px solid #C9A84C':'2px solid transparent',
              color:section===s?'#C9A84C':'#666',fontSize:13,textTransform:'capitalize',transition:'all 0.2s'}}>
            {s === 'forge' ? 'Forge Queue' : s === 'payments' ? 'Payments' : s.charAt(0).toUpperCase()+s.slice(1)}
          </div>
        ))}
        <div style={{padding:'10px 20px',marginTop:16,borderTop:'1px solid #1a1a1a'}}>
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
                  <thead><tr>{['Business','Email','Plan','Status','Agents','Trial Ends','Joined'].map(h=>(
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
                        await fetch(`/api/forge/queue/${agent.id}`,{method:'PUT',headers:{'Content-Type':'application/json','x-master-secret':sessionStorage.getItem('lycho_master')||''},body:JSON.stringify({action:'approve'})})
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
    </div>
  )
}
