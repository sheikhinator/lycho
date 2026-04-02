import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [intelligence, log, councils, geoDistrib] = await Promise.all([
    supabaseAdmin.from('orion_agent_intelligence').select('*').order('intelligence_score', { ascending: true }),
    supabaseAdmin.from('orion_optimisation_log').select('*').gte('created_at', weekAgo),
    supabaseAdmin.from('orion_council_sessions').select('*').gte('created_at', dayAgo),
    supabaseAdmin.from('tenant_geo_settings').select('country_code')
  ])

  const agents = intelligence.data || []
  const avgScore = agents.length
    ? Math.round(agents.reduce((s, a) => s + (a.intelligence_score || 0), 0) / agents.length)
    : 0

  const countryDist: Record<string, number> = {}
  for (const g of geoDistrib.data || []) {
    countryDist[g.country_code] = (countryDist[g.country_code] || 0) + 1
  }

  return NextResponse.json({
    total_agents: agents.length,
    avg_intelligence_score: avgScore,
    optimisations_this_week: log.data?.length || 0,
    underperforming_agents: agents.filter(a => a.intelligence_score < 60),
    council_sessions_today: councils.data?.length || 0,
    country_distribution: countryDist,
    all_agents: agents,
    optimisation_log: log.data || []
  })
}
