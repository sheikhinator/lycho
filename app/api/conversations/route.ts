import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err, rateGuard } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'

// GET /api/conversations — filtered list for tenant
// Query params: agent_id, status, channel, search, page (1-based), limit
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx
  const { searchParams } = new URL(req.url)

  const agentId  = searchParams.get('agent_id')
  const status   = searchParams.get('status')
  const channel  = searchParams.get('channel')
  const search   = searchParams.get('search')
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const from     = (page - 1) * limit
  const to       = from + limit - 1

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (agentId) query = query.eq('agent_id', agentId)
  if (status)  query = query.eq('status', status)
  if (channel) query = query.eq('channel', channel)
  if (search)  query = query.ilike('contact_identifier', `%${search}%`)

  const { data, error, count } = await query

  if (error) return err(error.message, 'DB_ERROR', 500)

  return ok({ conversations: data, total: count ?? 0, page, limit })
}

// POST /api/conversations — create a new conversation (Phase 2 stub)
export async function POST(req: NextRequest) {
  const rl = await rateGuard(req)
  if (rl) return rl

  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, userId, tenantId } = ctx

  let body: {
    agent_id: string
    channel: string
    contact_identifier: string
    message: string
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.agent_id)           return err('agent_id is required', 'VALIDATION_ERROR', 400)
  if (!body.channel)            return err('channel is required', 'VALIDATION_ERROR', 400)
  if (!body.contact_identifier) return err('contact_identifier is required', 'VALIDATION_ERROR', 400)
  if (!body.message)            return err('message is required', 'VALIDATION_ERROR', 400)

  const siContact = sanitiseInput(body.contact_identifier)
  if (!siContact.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
  body.contact_identifier = siContact.cleaned

  const siMessage = sanitiseInput(body.message)
  if (!siMessage.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
  body.message = siMessage.cleaned

  // Verify agent belongs to tenant
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, status')
    .eq('id', body.agent_id)
    .eq('tenant_id', tenantId)
    .single()

  if (agentError || !agent) return err('Agent not found', 'NOT_FOUND', 404)

  // Create conversation with initial user message
  const { data: conversation, error: insertError } = await supabase
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      agent_id: body.agent_id,
      channel: body.channel,
      contact_identifier: body.contact_identifier,
      status: 'open',
      messages: [
        {
          role: 'user',
          content: body.message,
          timestamp: new Date().toISOString(),
        },
      ],
    })
    .select()
    .single()

  if (insertError) return err(insertError.message, 'DB_ERROR', 500)

  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'conversation.created',
    resourceType: 'conversation',
    resourceId: conversation.id,
    metadata: { agent_id: body.agent_id, channel: body.channel },
  })

  // Phase 2 stub — real Claude API response wired in Phase 3
  return ok(
    {
      conversation,
      agent_response: {
        role: 'assistant',
        content: 'Thank you for reaching out. An agent will respond shortly.',
        placeholder: true,
      },
    },
    'Conversation created',
    201,
  )
}
