import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err, rateGuard } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'

export async function POST(req: NextRequest) {
  const rl = await rateGuard(req)
  if (rl) return rl

  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId, userId } = ctx

  let body: {
    type: string
    message: string
    rating?: number
    category?: string
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.type || !body.message) {
    return err('type and message are required', 'VALIDATION_ERROR', 400)
  }

  const cleanedMessage = sanitiseInput(body.message)
  if (!cleanedMessage.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)

  const validTypes = ['bug', 'feature_request', 'ux_issue', 'performance', 'general', 'praise']
  if (!validTypes.includes(body.type)) {
    return err(`Invalid type. Must be one of: ${validTypes.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('feedback')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      type: body.type,
      message: cleanedMessage.cleaned,
      rating: body.rating ?? null,
      category: body.category ?? null,
      status: 'new',
    })
    .select()
    .single()

  if (error) return err(error.message, 'DB_ERROR', 500)

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'feedback.submitted',
    resourceType: 'feedback',
    resourceId: data.id,
    metadata: { type: body.type, rating: body.rating },
  })

  return ok(data, 'Feedback submitted', 201)
}

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}
