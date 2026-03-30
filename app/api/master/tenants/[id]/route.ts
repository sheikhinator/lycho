import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'

// ─── Auth guard helper ────────────────────────────────────────────────────────
function checkSecret(req: NextRequest): true | ReturnType<typeof err> {
  const expected = process.env.MASTER_SECRET
  if (!expected) return err('Master override not configured', 'NOT_CONFIGURED', 503)
  const secret = req.headers.get('x-master-secret')
  if (!secret || secret !== expected) return err('Invalid master secret', 'UNAUTHORIZED', 401)
  return true
}

// GET /api/master/tenants/[id] — full tenant profile + agents + team members
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateGuard(req, AUTH_LIMITS)
  if (limited) return limited

  const guard = checkSecret(req)
  if (guard !== true) return guard

  const { id } = await params
  const admin = createAdminClient()

  const [{ data: tenant, error: tErr }, { data: agents }, { data: team }] = await Promise.all([
    admin.from('tenants').select('*').eq('id', id).is('deleted_at', null).single(),
    admin.from('agents').select('id, agent_type, display_name, status, interactions_count, created_at').eq('tenant_id', id),
    admin.from('users').select('id, full_name, role, email_verified, last_login_at, created_at').eq('tenant_id', id),
  ])

  if (tErr || !tenant) return err('Tenant not found', 'NOT_FOUND', 404)

  return ok({ tenant, agents: agents ?? [], team: team ?? [] })
}

// PUT /api/master/tenants/[id] — tenant lifecycle actions
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateGuard(req, AUTH_LIMITS)
  if (limited) return limited

  const guard = checkSecret(req)
  if (guard !== true) return guard

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.action) return err('Missing action', 'BAD_REQUEST', 400)

  const admin = createAdminClient()
  const { action, plan, days } = body as { action: string; plan?: string; days?: number }

  let update: Record<string, unknown> = {}

  switch (action) {
    case 'change_plan': {
      if (!plan) return err('Missing plan', 'BAD_REQUEST', 400)
      update = { plan, plan_status: 'active', updated_at: new Date().toISOString() } as any
      break
    }
    case 'extend_trial': {
      if (!days || days < 1) return err('Missing or invalid days', 'BAD_REQUEST', 400)
      // Fetch current trial_ends_at to extend from latest boundary
      const { data: t } = await admin.from('tenants').select('trial_ends_at').eq('id', id).single()
      const base = t?.trial_ends_at ? new Date(t.trial_ends_at) : new Date()
      base.setDate(base.getDate() + days)
      update = { trial_ends_at: base.toISOString(), plan_status: 'trialing' } as any
      break
    }
    case 'suspend': {
      update = { plan_status: 'suspended' } as any
      break
    }
    case 'reactivate': {
      update = { plan_status: 'active' } as any
      break
    }
    case 'delete': {
      update = { deleted_at: new Date().toISOString() } as any
      break
    }
    default:
      return err(`Unknown action: ${action}`, 'BAD_REQUEST', 400)
  }

  const { error } = await admin.from('tenants').update(update as any).eq('id', id)
  if (error) return err('Database error', 'DB_ERROR', 500)

  // Audit trail
  await admin.from('audit_log').insert({
    tenant_id: id,
    actor_type: 'system',
    actor_id: 'master_override',
    action: `master.tenant.${action}`,
    resource_type: 'tenants',
    resource_id: id,
    metadata: { plan, days },
  })

  return ok({ success: true, action, tenant_id: id })
}
