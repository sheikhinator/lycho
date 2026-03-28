import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from './supabase-server'
import { checkRateLimit, DEFAULT_LIMITS, AUTH_LIMITS } from './rate-limit'
import type { RateLimitOptions } from './rate-limit'

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok(data: unknown, message?: string, status = 200) {
  return NextResponse.json({ data, ...(message ? { message } : {}) }, { status })
}

export function err(error: string, code: string, status = 400) {
  return NextResponse.json({ error, code }, { status })
}

// ─── Rate limit guard ─────────────────────────────────────────────────────────

export async function rateGuard(
  req: NextRequest,
  opts: RateLimitOptions = DEFAULT_LIMITS,
): Promise<NextResponse | null> {
  return checkRateLimit(req, opts)
}

export { AUTH_LIMITS }

// ─── Auth helper ──────────────────────────────────────────────────────────────

export async function getAuthContext() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: userRow } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', session.user.id)
    .single()

  return {
    supabase,
    userId: session.user.id,
    tenantId: userRow?.tenant_id ?? null,
  }
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export async function auditLog(
  supabase: ReturnType<typeof createServerSupabase>,
  {
    tenantId,
    actorId,
    action,
    resourceType,
    resourceId,
    metadata,
  }: {
    tenantId: string | null
    actorId: string
    action: string
    resourceType: string
    resourceId?: string
    metadata?: Record<string, unknown>
  },
) {
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_type: 'user',
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    metadata: metadata ?? null,
  })
}
