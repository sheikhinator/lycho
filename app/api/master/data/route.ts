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

  return NextResponse.json({})
}
