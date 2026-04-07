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

export async function GET() {
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
  return NextResponse.json({ brief })
}
