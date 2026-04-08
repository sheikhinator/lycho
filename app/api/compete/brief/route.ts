import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { generateCompetitorBrief } from '@/lib/compete/compete-engine'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET — return cached brief from scout_reports if < 7 days old
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabaseAdmin
    .from('scout_reports')
    .select('competitor_brief, created_at')
    .eq('id', 'latest')
    .gte('created_at', sevenDaysAgo)
    .single()

  return NextResponse.json({ brief: data?.competitor_brief ?? null })
}

// POST — generate a fresh brief and save it to scout_reports
export async function POST() {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('sector, country')
    .eq('id', ctx.tenantId)
    .single()

  const industry = (tenant?.sector as string) || 'business'
  const country  = (tenant?.country as string) || 'PK'

  const brief = await generateCompetitorBrief(ctx.tenantId, industry, country)

  await supabaseAdmin
    .from('scout_reports')
    .upsert({ id: 'latest', competitor_brief: brief, created_at: new Date().toISOString() }, { onConflict: 'id' })

  return NextResponse.json({ brief })
}
