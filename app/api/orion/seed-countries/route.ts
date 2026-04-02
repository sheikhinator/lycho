import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { COUNTRY_PROFILES } from '@/lib/orion/country-profiles'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let seeded = 0
  for (const profile of COUNTRY_PROFILES) {
    const { error } = await supabaseAdmin
      .from('country_profiles')
      .upsert(profile, { onConflict: 'country_code' })
    if (!error) seeded++
    else console.error('Seed error for', profile.country_code, error.message)
  }

  return NextResponse.json({ success: true, seeded, total: COUNTRY_PROFILES.length })
}
