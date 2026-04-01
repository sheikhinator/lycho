import { NextRequest } from 'next/server'
import { getAuthContext, ok, err } from '@/lib/api'

// GET /api/users/me — returns current user + tenant data
export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)

  const { supabase, userId, tenantId } = ctx

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, role, has_completed_onboarding, created_at')
    .eq('id', userId)
    .single()

  let tenant = null
  if (tenantId) {
    const { data } = await supabase
      .from('tenants')
      .select('id, business_name, business_email, plan, plan_status, country, currency')
      .eq('id', tenantId)
      .single()
    tenant = data
  }

  return ok({ user, tenant })
}

// PATCH /api/users/me — updates user fields
export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)

  const { supabase, userId } = ctx

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  const allowed = ['has_completed_onboarding', 'full_name'] as const
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return err('No valid fields to update', 'VALIDATION_ERROR', 400)
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}
