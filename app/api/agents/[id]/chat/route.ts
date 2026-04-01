import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext, err, ok } from '@/lib/api'

type Params = { params: Promise<{ id: string }> }

const PAYING_STATUSES = ['active', 'starter', 'growth', 'business', 'enterprise']

// Supported image MIME types for Claude vision
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  // Plan check — paying customers only
  const { data: tenant } = await supabase.from('tenants').select('plan_status').eq('id', tenantId).single()
  if (!tenant || !PAYING_STATUSES.includes(tenant.plan_status ?? '')) {
    return err('Chat requires an active plan. Upgrade to access this feature.', 'PLAN_REQUIRED', 402)
  }

  // Load agent
  const { data: agent } = await supabase
    .from('agents').select('id, display_name, config, status').eq('id', id).eq('tenant_id', tenantId).neq('status', 'deleted').single()
  if (!agent) return err('Agent not found', 'NOT_FOUND', 404)
  if (agent.status !== 'active') return err('Agent is not active', 'AGENT_INACTIVE', 400)

  // Parse multipart or JSON
  const contentType = req.headers.get('content-type') ?? ''
  let message = ''
  let history: { role: 'user' | 'assistant'; content: string }[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attachments: { type: string; data: string; mediaType: string; name: string }[] = []

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    message = (form.get('message') as string) ?? ''
    try { history = JSON.parse((form.get('history') as string) ?? '[]') } catch { history = [] }

    for (const [, file] of form.entries()) {
      if (!(file instanceof File)) continue
      const buf = await file.arrayBuffer()
      const b64 = Buffer.from(buf).toString('base64')
      attachments.push({ type: IMAGE_TYPES.includes(file.type) ? 'image' : 'document', data: b64, mediaType: file.type, name: file.name })
    }
  } else {
    const body = await req.json().catch(() => ({}))
    message = body.message ?? ''
    history = body.history ?? []
  }

  if (!message.trim() && attachments.length === 0) return err('Message required', 'VALIDATION_ERROR', 400)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (agent.config ?? {}) as Record<string, any>
  const systemPrompt = config.system_prompt ?? `You are ${agent.display_name ?? 'an AI assistant'}. Be helpful, concise, and professional.`

  // Build content blocks for the latest user message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userContent: any[] = []

  // Attach files as content blocks
  for (const att of attachments) {
    if (att.type === 'image') {
      userContent.push({ type: 'image', source: { type: 'base64', media_type: att.mediaType, data: att.data } })
    } else {
      // Non-image files: send as text with filename prefix
      try {
        const decoded = Buffer.from(att.data, 'base64').toString('utf-8')
        userContent.push({ type: 'text', text: `[File: ${att.name}]\n${decoded.slice(0, 8000)}` })
      } catch {
        userContent.push({ type: 'text', text: `[File attached: ${att.name}]` })
      }
    }
  }

  if (message.trim()) userContent.push({ type: 'text', text: message.trim() })

  // Build messages array from history + current
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ]

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: systemPrompt,
    messages,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''
  return ok({ response: reply, agent_name: agent.display_name })
}
