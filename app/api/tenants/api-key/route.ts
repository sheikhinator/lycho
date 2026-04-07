import { getAuthContext, ok, err } from '@/lib/api'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('api_key')
    .eq('id', ctx.tenantId)
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok({ api_key: data?.api_key ?? null })
}
