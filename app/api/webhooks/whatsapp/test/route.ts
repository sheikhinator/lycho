import { createAdminClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const masterSecret = searchParams.get('secret')

  if (masterSecret !== process.env.MASTER_SECRET) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: Record<string, unknown> = {}

  try {
    const { data: envCheck } = await supabase.from('tenants').select('id, business_name, plan_status').limit(3)
    results.database = { status: 'connected', sample_tenants: envCheck?.length ?? 0 }
  } catch (e) {
    results.database = { status: 'error', error: e instanceof Error ? e.message : 'unknown' }
  }

  const envVars = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENCODE_API_KEY: !!process.env.OPENCODE_API_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    WHATSAPP_VERIFY_TOKEN: !!process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_APP_SECRET: !!process.env.WHATSAPP_APP_SECRET,
    MASTER_SECRET: !!process.env.MASTER_SECRET,
    MASTER_EMAIL: !!process.env.MASTER_EMAIL,
  }
  results.env = envVars

  const missingEnv = Object.entries(envVars).filter(([, v]) => !v).map(([k]) => k)
  if (missingEnv.length > 0) {
    results.warnings = [`Missing environment variables: ${missingEnv.join(', ')}`]
  }

  try {
    const { data: connections } = await supabase
      .from('channel_connections')
      .select('id, channel_type, status, tenant_id')
      .eq('channel_type', 'whatsapp')
      .eq('status', 'active')
      .limit(5)
    results.whatsapp_connections = connections ?? []
  } catch (e) {
    results.whatsapp_connections = { error: e instanceof Error ? e.message : 'unknown' }
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: agents } = await admin.from('marketplace_agents').select('id, agent_type, status').limit(3)
    results.marketplace = { status: 'connected', sample_agents: agents?.length ?? 0 }
  } catch (e) {
    results.marketplace = { status: 'error', error: e instanceof Error ? e.message : 'unknown' }
  }

  return Response.json({ ok: true, diagnostics: results })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const masterSecret = searchParams.get('secret')

  if (masterSecret !== process.env.MASTER_SECRET) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const phoneNumberId = body.phone_number_id ?? process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = body.access_token ?? process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    return Response.json({ ok: false, error: 'phone_number_id and access_token required' }, { status: 400 })
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=display_phone_number,quality_rating,status_message`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!metaRes.ok) {
      const metaError = await metaRes.json().catch(() => ({}))
      return Response.json({ ok: false, error: 'Meta API error', details: metaError }, { status: 400 })
    }

    const metaInfo = await metaRes.json()

    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('channel_connections')
      .select('id, status')
      .eq('channel_type', 'whatsapp')
      .eq('channel_identifier', metaInfo.display_phone_number)
      .maybeSingle()

    return Response.json({
      ok: true,
      phone_number: metaInfo.display_phone_number,
      quality_rating: metaInfo.quality_rating,
      status_message: metaInfo.status_message,
      already_configured: !!existing,
      connection_id: existing?.id,
    })
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
}
