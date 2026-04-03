import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err, rateGuard } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'

export async function GET() {
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { data, error } = await supabase
    .from('channel_connections')
    .select('*, agents(display_name, agent_type)')
    .eq('tenant_id', tenantId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 'DB_ERROR', 500)
  return ok(data)
}

export async function POST(req: NextRequest) {
  const rl = await rateGuard(req)
  if (rl) return rl

  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  let body: {
    agent_id: string
    channel_type: string
    channel_identifier?: string
    display_name?: string
    credentials?: Record<string, unknown>
    config?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.agent_id || !body.channel_type) {
    return err('agent_id and channel_type are required', 'VALIDATION_ERROR', 400)
  }

  const channelType = sanitiseInput(body.channel_type).safe ? body.channel_type.toLowerCase() : null
  if (!channelType) return err('Invalid channel_type', 'VALIDATION_ERROR', 400)

  const validChannels = ['whatsapp', 'telegram', 'email', 'sms', 'slack', 'instagram', 'facebook_messenger', 'web_widget']
  if (!validChannels.includes(channelType)) {
    return err(`Unsupported channel. Must be one of: ${validChannels.join(', ')}`, 'VALIDATION_ERROR', 400)
  }

  if (body.display_name) {
    const s = sanitiseInput(body.display_name)
    if (!s.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
    body.display_name = s.cleaned
  }

  const { data: connection, error: insertError } = await supabase
    .from('channel_connections')
    .insert({
      tenant_id: tenantId,
      agent_id: body.agent_id,
      channel_type: channelType,
      channel_identifier: body.channel_identifier ?? null,
      display_name: body.display_name ?? null,
      credentials: body.credentials ?? {},
      config: body.config ?? {},
      status: 'active',
    })
    .select()
    .single()

  if (insertError) return err(insertError.message, 'DB_ERROR', 500)

  await auditLog(supabase, {
    tenantId,
    actorId: ctx.userId,
    action: 'channel_connection.created',
    resourceType: 'channel_connection',
    resourceId: connection.id,
    metadata: { channel_type: channelType, agent_id: body.agent_id },
  })

  return ok(connection, 'Channel connection created', 201)
}
