import { NextResponse } from 'next/server'
import { admin } from '@/lib/admin'
import { COUNTRY_PROFILES } from '@/lib/orion/country-profiles'

const supabaseAdmin = admin()

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const secret = request.headers.get('x-master-secret')
  if (!secret || secret !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Seeding', COUNTRY_PROFILES.length, 'countries')

    let seeded = 0
    const errors = []

    for (const profile of COUNTRY_PROFILES) {
      const { error } = await supabaseAdmin
        .from('country_profiles')
        .upsert({
          country_code: profile.country_code,
          country_name: profile.country_name,
          currency: profile.currency ?? '',
          primary_language: profile.primary_language ?? '',
          secondary_languages: profile.secondary_languages ?? [],
          timezone: profile.timezone ?? '',
          regulatory_context: (profile.regulatory_context ?? '').slice(0, 5000),
          market_context: (profile.market_context ?? '').slice(0, 5000),
          agent_injection: (profile.agent_injection ?? '').slice(0, 3000),
          last_updated_at: new Date().toISOString()
        }, { onConflict: 'country_code' })

      if (error) {
        console.error('Failed to seed', profile.country_code, ':', error.message)
        errors.push({ country: profile.country_code, error: error.message })
      } else {
        console.log('Seeded:', profile.country_code)
        seeded++
      }
    }

    return NextResponse.json({
      success: true,
      seeded,
      total: COUNTRY_PROFILES.length,
      errors
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('Seed error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
