import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { injectIntelligence, applyGeoIntelligence } from '@/lib/orion/orion-engine'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const CORE_AGENTS = ['intake','research','operations','client','analyst','compliance','content']

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = request.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const countryCode = body.country_code || 'PK'

  // Auto-find master tenant by email
  const { data: masterTenant } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('business_email', process.env.MASTER_EMAIL || 'lychosystems@gmail.com')
    .single()

  // Initialize all core agents in parallel
  const settled = await Promise.allSettled(
    CORE_AGENTS.map(async (agentType) => {
      const prompt = await injectIntelligence(agentType, countryCode)
      return { agent: agentType, status: 'initialized', prompt_length: prompt.length }
    })
  )

  const results = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { agent: CORE_AGENTS[i], status: 'failed', error: (r.reason as Error).message }
  )

  // Apply geo to master tenant
  let geoResult = { agents_updated: 0 }
  if (masterTenant?.id) {
    geoResult = await applyGeoIntelligence(masterTenant.id, countryCode)
  }

  return NextResponse.json({
    success: true,
    initialized: results.filter(r => r.status === 'initialized').length,
    geo_applied: geoResult.agents_updated,
    tenant_id: masterTenant?.id || 'not_found',
    results
  })
}
