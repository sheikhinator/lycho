import { getAIClient, getModel } from '@/lib/ai'
import { getSystemPrompt } from '@/lib/agents/get-system-prompt'
import { admin } from '@/lib/admin'
import { rateLimit } from '@/lib/rate-limit'

const supabase = admin()
const openai = getAIClient()

export interface ApiKey {
  id: string
  tenant_id: string
  label: string
  key_prefix: string
  key_hash: string
  permissions: string[]
  rate_limit_per_minute: number
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  active: boolean
}

export interface GatewayRequest {
  agentType: string
  message: string
  conversationId?: string
  metadata?: Record<string, unknown>
}

export interface GatewayResponse {
  response: string
  conversationId: string
  agentType: string
  duration: number
  creditsUsed: number
}

export async function generateApiKey(
  tenantId: string,
  label: string,
  permissions: string[] = ['chat'],
  rateLimitPerMinute: number = 60,
  expiresInDays?: number
): Promise<{ key: string; keyPrefix: string }> {
  const crypto = await import('crypto')
  const keyPrefix = `ly_${crypto.randomBytes(4).toString('hex')}`
  const keySecret = crypto.randomBytes(32).toString('hex')
  const fullKey = `${keyPrefix}_${keySecret}`
  const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex')

  await supabase.from('api_keys').insert({
    tenant_id: tenantId,
    label,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    permissions,
    rate_limit_per_minute: rateLimitPerMinute,
    expires_at: expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    active: true,
  })

  return { key: fullKey, keyPrefix }
}

export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const crypto = await import('crypto')
  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  const { data } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('active', true)
    .single()

  if (!data) return null

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabase.from('api_keys').update({ active: false }).eq('id', data.id)
    return null
  }

  await supabase.from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return data as ApiKey
}

export async function gatewayChat(
  apiKey: ApiKey,
  request: GatewayRequest
): Promise<GatewayResponse> {
  const start = Date.now()

  const allowed = await rateLimit(`gateway:${apiKey.id}`, apiKey.rate_limit_per_minute)
  if (!allowed) {
    throw new Error('Rate limit exceeded. Try again shortly.')
  }

  if (!apiKey.permissions.includes('chat') && !apiKey.permissions.includes('*')) {
    throw new Error('API key does not have chat permission.')
  }

  const { prompt } = await getSystemPrompt(request.agentType, supabase)

  const conversationId = request.conversationId || crypto.randomUUID()

  const response = await openai.chat.completions.create({
    model: getModel('simple'),
    max_tokens: 500,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: request.message }
    ]
  })

  const text = response.choices[0]?.message?.content || ''

  await supabase.from('gateway_logs').insert({
    api_key_id: apiKey.id,
    tenant_id: apiKey.tenant_id,
    agent_type: request.agentType,
    conversation_id: conversationId,
    request_message: request.message.slice(0, 500),
    response_preview: text.slice(0, 200),
    duration_ms: Date.now() - start,
    credits_used: 1,
  })

  const credits = response.usage?.total_tokens
    ? Math.ceil((response.usage.total_tokens || 0) / 1000)
    : 1

  return {
    response: text,
    conversationId,
    agentType: request.agentType,
    duration: Date.now() - start,
    creditsUsed: credits,
  }
}

export async function listApiKeys(tenantId: string): Promise<ApiKey[]> {
  const { data } = await supabase
    .from('api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data || []) as ApiKey[]
}

export async function revokeApiKey(keyId: string, tenantId: string): Promise<void> {
  await supabase
    .from('api_keys')
    .update({ active: false })
    .eq('id', keyId)
    .eq('tenant_id', tenantId)
}
