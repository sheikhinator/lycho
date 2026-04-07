import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/api'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const { data } = await supabaseAdmin
    .from('skill_listings')
    .select('id, agent_type, display_name, description, sector, price_pkr, price_usd, publisher_name, downloads, rating')
    .eq('status', 'approved')
    .order('downloads', { ascending: false })
  return NextResponse.json({ skills: data || [] })
}

export async function POST(request: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const body = await request.json()
  const { display_name, description, sector, system_prompt, price_pkr, price_usd, publisher_name } = body
  if (!display_name || !description || !system_prompt || !sector)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const agent_type = `skill_${display_name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`

  const { data, error } = await supabaseAdmin
    .from('skill_listings')
    .insert({
      agent_type, display_name, description, sector, system_prompt,
      price_pkr: price_pkr || 0, price_usd: price_usd || 0,
      publisher_name: publisher_name || 'Anonymous',
      publisher_email: (ctx as { email?: string }).email || '',
      status: 'pending',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ skill: data, message: 'Skill submitted for review' })
}
