import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const secret = request.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section')

  if (section === 'dashboard') {
    const [tenants, agents, interactions] = await Promise.all([
      supabase.from('tenants').select('*').order('created_at', { ascending: false }),
      supabase.from('agents').select('id, status'),
      supabase.from('conversations').select('id').gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString())
    ])
    const t = tenants.data || []
    return NextResponse.json({
      total_tenants: t.length,
      active_trials: t.filter(x=>x.plan_status==='trial').length,
      paying: t.filter(x=>['starter','growth','business','enterprise'].includes(x.plan_status)).length,
      mrr_pkr: 0,
      interactions_today: interactions.data?.length || 0,
      agents_deployed: agents.data?.filter(x=>x.status==='active').length || 0,
      recent_tenants: t.slice(0, 20)
    })
  }

  if (section === 'tenants') {
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    return NextResponse.json({ tenants: data || [] })
  }

  if (section === 'forge') {
    const { data } = await supabase.from('forge_queue').select('*').eq('status','pending_review').order('created_at', { ascending: false })
    return NextResponse.json({ queue: data || [] })
  }

  if (section === 'waitlist') {
    const { data } = await supabase.from('waitlist').select('*').order('position', { ascending: true })
    return NextResponse.json({ waitlist: data || [] })
  }

  if (section === 'payments') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('payment_requests')
      .select('*, tenants(business_name, business_email)')
      .order('created_at', { ascending: false })
    return NextResponse.json({ payments: data || [] })
  }

  if (section === 'nexus') {
    const { data } = await supabase
      .from('nexus_queue')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
    return NextResponse.json({ queue: data || [] })
  }

  if (section === 'orion') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [intelligence, log, councils] = await Promise.all([
      supabase.from('orion_agent_intelligence').select('*').order('intelligence_score', { ascending: true }),
      supabase.from('orion_optimisation_log').select('*').gte('created_at', weekAgo).order('created_at', { ascending: false }).limit(20),
      supabase.from('orion_council_sessions').select('*').gte('created_at', dayAgo)
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agents: any[] = intelligence.data || []
    const avgScore = agents.length
      ? Math.round(agents.reduce((s: number, a: any) => s + (a.intelligence_score || 0), 0) / agents.length)
      : 0
    return NextResponse.json({
      total_agents: agents.length,
      avg_score: avgScore,
      optimisations_week: log.data?.length || 0,
      underperforming: agents.filter((a: any) => a.intelligence_score < 60),
      optimisation_log: log.data || [],
      council_sessions_today: councils.data?.length || 0,
      country_distribution: {},
      all_agents: agents
    })
  }

  if (section === 'syndicate') {
    const today = new Date(); today.setHours(0,0,0,0)
    const [msgs, routes, registry] = await Promise.all([
      supabase.from('syndicate_messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('syndicate_routes').select('*').order('created_at'),
      supabase.from('agent_registry').select('*').order('category')
    ])
    const allMsgs = msgs.data || []
    const todayMsgs = allMsgs.filter((m: Record<string, string>) => new Date(m.created_at) >= today)
    const blocked = allMsgs.filter((m: Record<string, boolean>) => m.flagged_by_guardian)
    const avgQ = allMsgs.filter((m: Record<string, number>) => m.quality_score).length
      ? Math.round(allMsgs.filter((m: Record<string, number>) => m.quality_score).reduce((s: number, m: Record<string, number>) => s + m.quality_score, 0) / allMsgs.filter((m: Record<string, number>) => m.quality_score).length)
      : 0
    // Most active pair
    const pairCounts: Record<string, number> = {}
    allMsgs.forEach((m: Record<string, string>) => {
      const key = `${m.from_agent} ↔ ${m.to_agent}`
      pairCounts[key] = (pairCounts[key] || 0) + 1
    })
    const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0]
    return NextResponse.json({
      messages: allMsgs,
      routes: routes.data || [],
      registry: registry.data || [],
      messages_today: todayMsgs.length,
      guardian_blocks: blocked.length,
      avg_quality: avgQ,
      active_routes: (routes.data || []).filter((r: Record<string, boolean>) => r.active).length,
      total_routes: routes.data?.length || 0,
      top_pair: topPair ? `${topPair[0]} (${topPair[1]} msgs)` : 'No traffic yet'
    })
  }

  return NextResponse.json({})
}
