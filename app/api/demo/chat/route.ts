import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ok, err } from '@/lib/api'
import { callClaude, getModel } from '@/lib/claude'
import { buildIntakeSystemPrompt } from '@/lib/agents/intake-agent'
import { Redis } from '@upstash/redis'

const DEMO_LIMIT = 10

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

async function checkDemoLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return { allowed: true, remaining: DEMO_LIMIT }

  const redis = new Redis({ url, token })
  const key   = `demo:ip:${ip}`
  try {
    const count = await redis.incr(key)
    if (count === 1) {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      await redis.expireat(key, Math.floor(midnight.getTime() / 1000))
    }
    const remaining = Math.max(0, DEMO_LIMIT - count)
    return { allowed: count <= DEMO_LIMIT, remaining }
  } catch {
    return { allowed: true, remaining: DEMO_LIMIT }
  }
}

export async function POST(req: NextRequest) {
  const ip    = getIp(req)
  const limit = await checkDemoLimit(ip)

  if (!limit.allowed) {
    return err('Demo limit reached. Sign up to continue.', 'DEMO_LIMIT', 429)
  }

  let body: { message: string; history?: { role: string; content: string }[] }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.message?.trim()) return err('message is required', 'VALIDATION_ERROR', 400)

  const demoToken = process.env.DEMO_WIDGET_TOKEN
  if (!demoToken) {
    return ok({
      response: 'Hi! I\'m a LYCHO AI agent. I help businesses handle customer conversations 24/7. What would you like to know?',
      remaining: limit.remaining,
    })
  }

  const admin = createAdminClient()
  const { data: agent } = await admin
    .from('agents')
    .select('id, agent_type, display_name, config, tenant_id')
    .eq('widget_token', demoToken)
    .neq('status', 'deleted')
    .single()

  if (!agent) {
    return ok({
      response: 'Hi! I\'m a LYCHO AI agent. How can I help you today?',
      remaining: limit.remaining,
    })
  }

  const { data: tenant } = await admin
    .from('tenants')
    .select('*')
    .eq('id', agent.tenant_id)
    .single()

  const history = (body.history ?? []).slice(-10).map(m => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const messages = [...history, { role: 'user' as const, content: body.message.trim() }]
  const systemPrompt = buildIntakeSystemPrompt(tenant ?? {}, agent, null)
  const model = getModel('simple')

  try {
    const result = await callClaude({ systemPrompt, messages, model, maxTokens: 400, useCache: false })
    return ok({ response: result.response, remaining: limit.remaining })
  } catch {
    return err('AI temporarily unavailable. Please try again.', 'AI_ERROR', 503)
  }
}
