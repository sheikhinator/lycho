import { admin } from '@/lib/admin'

const supabase = admin()

export interface WebhookEndpoint {
  id: string
  tenant_id: string
  url: string
  secret: string
  events: string[]
  description?: string
  status: 'active' | 'paused' | 'failed'
  last_sent_at?: string
  last_status?: number
  created_at: string
}

export interface WebhookEvent {
  id: string
  tenant_id: string
  endpoint_id?: string
  event_type: string
  payload: any
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  attempts: number
  max_attempts: number
  last_error?: string
  created_at: string
}

export const WEBHOOK_EVENTS = [
  'conversation.created',
  'conversation.message',
  'conversation.resolved',
  'conversation.escalated',
  'agent.deployed',
  'agent.paused',
  'agent.error',
  'agent.health_changed',
  'lead.hot_detected',
  'lead.score_changed',
  'contact.created',
  'contact.updated',
  'subscription.created',
  'subscription.cancelled',
  'trial.expiring',
  'trial.ended',
  'workspace.member_added',
  'workspace.member_removed',
  'training.example_added',
  'training.prompt_optimized',
  'swarm.council_convened',
  'workflow.completed',
  'workflow.failed',
  'backup.created',
  'backup.restored',
]

export async function createEndpoint(
  tenantId: string,
  data: { url: string; events: string[]; description?: string }
): Promise<WebhookEndpoint> {
  const crypto = await import('crypto')
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`

  const { data: endpoint } = await supabase
    .from('webhook_endpoints')
    .insert({
      tenant_id: tenantId,
      url: data.url,
      secret,
      events: data.events,
      description: data.description,
      status: 'active',
    })
    .select()
    .single()

  return endpoint as WebhookEndpoint
}

export async function listEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
  const { data } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data || []) as WebhookEndpoint[]
}

export async function updateEndpoint(
  id: string,
  updates: Partial<WebhookEndpoint>
): Promise<void> {
  await supabase.from('webhook_endpoints').update(updates).eq('id', id)
}

export async function deleteEndpoint(id: string): Promise<void> {
  await supabase.from('webhook_endpoints').delete().eq('id', id)
}

export async function emitEvent(
  tenantId: string,
  eventType: string,
  payload: any
): Promise<void> {
  const { data: endpoints } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .contains('events', [eventType])

  if (!endpoints?.length) return

  for (const endpoint of endpoints) {
    const event: Omit<WebhookEvent, 'id' | 'created_at'> = {
      tenant_id: tenantId,
      endpoint_id: endpoint.id,
      event_type: eventType,
      payload,
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
    }

    const { data: record } = await supabase
      .from('webhook_events')
      .insert(event)
      .select()
      .single()

    if (record) {
      deliverWebhook(endpoint as WebhookEndpoint, record as WebhookEvent, supabase)
    }
  }
}

async function deliverWebhook(
  endpoint: WebhookEndpoint,
  event: WebhookEvent,
  supabase: any
): Promise<void> {
  const crypto = await import('crypto')
  const payload = JSON.stringify(event.payload)
  const signature = crypto
    .createHmac('sha256', endpoint.secret)
    .update(payload)
    .digest('hex')

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Lycho-Signature': signature,
        'X-Lycho-Event': event.event_type,
        'User-Agent': 'LYCHO-Webhook/1.0',
      },
      body: payload,
    })

    await supabase.from('webhook_events').update({
      status: response.ok ? 'delivered' : 'failed',
      attempts: event.attempts + 1,
      last_error: response.ok ? null : `HTTP ${response.status}`,
    }).eq('id', event.id)

    await supabase.from('webhook_endpoints').update({
      last_sent_at: new Date().toISOString(),
      last_status: response.status,
      status: response.ok ? 'active' : 'failed',
    }).eq('id', endpoint.id)

    if (!response.ok && event.attempts < event.max_attempts) {
      setTimeout(() => deliverWebhook(endpoint, {
        ...event,
        attempts: event.attempts + 1,
        status: 'retrying',
      }, supabase), Math.pow(2, event.attempts) * 1000)
    }
  } catch (error: any) {
    await supabase.from('webhook_events').update({
      status: 'failed',
      attempts: event.attempts + 1,
      last_error: error.message,
    }).eq('id', event.id)

    if (event.attempts < event.max_attempts) {
      setTimeout(() => deliverWebhook(endpoint, {
        ...event,
        attempts: event.attempts + 1,
        status: 'retrying',
      }, supabase), Math.pow(2, event.attempts) * 1000)
    }
  }
}
