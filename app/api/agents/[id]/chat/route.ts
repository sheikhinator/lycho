import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getAuthContext, err, ok } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

const PAYING_STATUSES = ['active', 'starter', 'growth', 'business', 'enterprise']

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  const { data: tenant } = await supabase.from('tenants').select('plan_status').eq('id', tenantId).single()
  if (!tenant || !PAYING_STATUSES.includes(tenant.plan_status ?? '')) {
    return err('Chat requires an active plan. Upgrade to access this feature.', 'PLAN_REQUIRED', 402)
  }

  const { data: agent } = await supabase
    .from('agents').select('id, display_name, config, status').eq('id', id).eq('tenant_id', tenantId).neq('status', 'deleted').single()
  if (!agent) return err('Agent not found', 'NOT_FOUND', 404)
  if (agent.status !== 'active') return err('Agent is not active', 'AGENT_INACTIVE', 400)

  const contentType = req.headers.get('content-type') ?? ''
  let message = ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    message = (form.get('message') as string) ?? ''
  } else {
    const body = await req.json().catch(() => ({}))
    message = body.message ?? ''
  }

  if (!message.trim()) return err('Message required', 'VALIDATION_ERROR', 400)

  const config = (agent.config ?? {}) as Record<string, unknown>
  const systemPrompt = config.system_prompt ?? `You are ${agent.display_name ?? 'an AI assistant'}. Be helpful, concise, and professional.`

  const openai = new OpenAI({ apiKey: process.env.OPENCODE_API_KEY || 'sk-DkKhm5mvzbJQHPhVyAbDBKVbDQgKuq5e6bTxTHW9jcRHa50tW3P9ax4oEsDv3buu', baseURL: 'https://opencode.ai/zen/v1' })

  const response = await openai.chat.completions.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message.trim() },
    ],
  })

  const reply = response.choices[0]?.message?.content || ''
  return ok({ response: reply, agent_name: agent.display_name })
}
