import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'
import type { Database } from '@/lib/database.types'

type TenantUpdate = Database['public']['Tables']['tenants']['Update']

const ALLOWED = new Set([
  'onboarding_step',
  'onboarding_completed',
  'business_name',
  'sector',
  'business_phone',
  'country',
])

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx
  const { data, error } = await supabase
    .from('tenants')
    .select('id, business_name, business_email, business_phone, sector, country, onboarding_step, onboarding_completed')
    .eq('id', tenantId)
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return err('Invalid JSON', 'INVALID_BODY', 400) }

  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.has(k))
  )
  if (Object.keys(update).length === 0) return err('No valid fields', 'VALIDATION_ERROR', 400)

  const { data, error } = await supabase
    .from('tenants')
    .update(update as TenantUpdate)
    .eq('id', tenantId)
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}
