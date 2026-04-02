import { NextRequest } from 'next/server'
import { getAuthContext, auditLog, ok, err, rateGuard } from '@/lib/api'
import { canReceiveMessage } from '@/lib/plan-limits'
import { sanitiseInput } from '@/lib/sanitise'
import { callClaude, getModel } from '@/lib/claude'
import { getSystemPrompt, COMPLEX_CORE } from '@/lib/agents/get-system-prompt'
import { extractProfileFromMetadata } from '@/lib/agents/profile-extractor'
import { calculateLeadScore, getLeadLabel } from '@/lib/agents/lead-scorer'
import { analyseEmotion }               from '@/lib/agents/emotional-intelligence'
import { getContactMemory, updateContactMemory, buildMemoryContext } from '@/lib/agents/memory-graph'
import { sendHotLeadAlert, sendEscalationAlert } from '@/lib/email-service'
import { dispatchTrigger } from '@/lib/nexus/trigger-dispatcher'
import { createNotification } from '@/lib/notifications/notification-service'

function normaliseType(agentType: string): string {
  return agentType.replace(/_agent$/, '')
}

function getAgentComplexity(agentType: string): 'simple' | 'complex' {
  return COMPLEX_CORE.has(normaliseType(agentType)) ? 'complex' : 'simple'
}

// GET /api/conversations — filtered list for tenant
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

// POST /api/conversations — send a message, get Claude response
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

  // 1. Sanitise inputs
  const siContact = sanitiseInput(body.contact_identifier)
  if (!siContact.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)
  body.contact_identifier = siContact.cleaned

  const siMessage = sanitiseInput(body.message)
  if (!siMessage.safe) {
    return ok({
      response: "I'm sorry, I couldn't process that message. Please try rephrasing.",
      confidence: 1.0,
      escalated: false,
    })
  }
  body.message = siMessage.cleaned

  // 2. Get agent and tenant
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', body.agent_id)
    .eq('tenant_id', tenantId)
    .single()

  if (agentError || !agent) return err('Agent not found', 'NOT_FOUND', 404)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (!tenant) return err('Tenant not found', 'NOT_FOUND', 404)

  // Plan check
  const planStatus = (tenant.plan_status as string) ?? 'pending'
  if (planStatus === 'pending' || planStatus === 'expired') {
    return err('Active plan required. Please activate your account.', 'PLAN_REQUIRED', 403)
  }
  const { data: agentRows } = await supabase.from('agents').select('interactions_count').eq('tenant_id', tenantId)
  const totalInteractions = (agentRows ?? []).reduce((s, a) => s + ((a.interactions_count as number) || 0), 0)
  if (!canReceiveMessage(planStatus, totalInteractions)) {
    return err('Interaction limit reached. Upgrade your plan to continue.', 'PLAN_LIMIT', 403)
  }

  // 3. Get or create conversation
  let conversation: Record<string, unknown> | null = null

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('agent_id', body.agent_id)
    .eq('contact_identifier', body.contact_identifier)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get previous closed conversations to build existing profile
  const { data: previousConvos } = await supabase
    .from('conversations')
    .select('messages, metadata')
    .eq('agent_id', body.agent_id)
    .eq('contact_identifier', body.contact_identifier)
    .order('created_at', { ascending: false })
    .limit(5)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingProfile = (previousConvos ?? []).reduce((profile: any, convo: any) => {
    if (convo.metadata?.contact_profile) {
      return { ...profile, ...convo.metadata.contact_profile }
    }
    return profile
  }, {})

  if (existing) {
    conversation = existing
  } else {
    const { data: newConvo, error: createError } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        agent_id: body.agent_id,
        channel: body.channel,
        contact_identifier: body.contact_identifier,
        status: 'open',
        messages: [],
        metadata: { contact_profile: existingProfile || {}, lead_score: 50 },
      })
      .select()
      .single()

    if (createError) return err(createError.message, 'DB_ERROR', 500)
    conversation = newConvo
  }

  // 4. Build messages array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priorMessages: { role: 'user' | 'assistant'; content: string }[] = ((conversation!.messages as any[]) ?? []).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
  }))

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...priorMessages,
    { role: 'user', content: body.message },
  ]

  // 5a. Emotional intelligence
  const emotion = analyseEmotion(body.message, priorMessages)

  // 5b. Contact memory
  const memory        = await getContactMemory(tenantId, body.contact_identifier, supabase)
  const memoryContext = buildMemoryContext(memory)

  // 5c. Build intelligent system prompt — routed by agent type
  const hasProfile = Object.keys(existingProfile || {}).length > 0
  let extraContext = ''
  if (memoryContext) extraContext += memoryContext + '\n\n'
  if (emotion.opening_acknowledgement) {
    extraContext += `EMOTIONAL CONTEXT: Customer appears ${emotion.state} (intensity: ${emotion.intensity.toFixed(1)}). Tone: ${emotion.recommended_tone}. Start with: "${emotion.opening_acknowledgement}"\n\n`
  }

  const { prompt: basePrompt, model: promptModel } = await getSystemPrompt(
    agent.agent_type,
    supabase,
    tenant,
    agent,
    hasProfile ? existingProfile : null,
  )
  let model = getModel(promptModel)

  const systemPrompt = extraContext ? `${basePrompt}\n\n${extraContext}` : basePrompt

  // 6. Call Claude — complex agents use Sonnet, simple use Haiku
  const maxTokens = promptModel === 'complex' ? 900 : 600
  let claudeResult
  try {
    claudeResult = await callClaude({
      systemPrompt,
      messages,
      model,
      maxTokens,
      useCache: true,
    })
  } catch (e) {
    return err('AI service temporarily unavailable. Please try again.', 'AI_ERROR', 503)
  }

  // 7. Extract metadata and clean response
  const { cleanResponse, metadata, escalated } = extractProfileFromMetadata(claudeResult.response)

  // 7b. Update contact memory graph (non-fatal)
  await updateContactMemory(
    tenantId,
    body.contact_identifier,
    {
      profile:         metadata?.profile_update ?? {},
      total_value_pkr: metadata?.transaction_value ?? 0,
    },
    {
      timestamp:  new Date().toISOString(),
      type:       'interaction',
      summary:    body.message.slice(0, 120),
      sentiment:  metadata?.sentiment ?? emotion.state,
      agent_type: agent.agent_type,
      channel:    body.channel,
    },
    supabase,
  )

  // 8. Update contact profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentProfile = (conversation!.metadata as any)?.contact_profile || {}
  const updatedProfile = { ...currentProfile, ...(metadata?.profile_update || {}) }

  // 9. Calculate lead score
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadScore = calculateLeadScore(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conversation!.metadata as any)?.lead_score || 50,
    metadata,
    messages.length,
  )

  // 10. Calculate confidence
  const confidence = calculateConfidence(cleanResponse, body.message)

  // 11. Update conversation in DB
  const updatedMessages = [
    ...messages,
    { role: 'assistant' as const, content: cleanResponse, timestamp: new Date().toISOString() },
  ]

  await supabase
    .from('conversations')
    .update({
      messages: updatedMessages,
      confidence_score: confidence,
      escalated_to: escalated ? 'human' : null,
      status: escalated ? 'escalated' : 'open',
      tokens_used: ((conversation!.tokens_used as number) || 0) + claudeResult.tokensUsed,
      metadata: {
        contact_profile:       updatedProfile,
        lead_score:            leadScore,
        lead_label:            getLeadLabel(leadScore),
        sentiment:             metadata?.sentiment || 'neutral',
        emotional_state:       emotion.state,
        emotional_intensity:   emotion.intensity,
        intent:                metadata?.intent || 'enquiry',
        suggested_next_action: metadata?.suggested_next_action || 'continue',
        last_metadata:         metadata,
      },
    })
    .eq('id', conversation!.id as string)

  // 12. Update agent interaction count
  await supabase
    .from('agents')
    .update({
      interactions_count: ((agent.interactions_count as number) || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.agent_id)

  // 13. Hot lead audit log + email alert
  const previousLeadScore = (conversation!.metadata as Record<string, unknown>)?.lead_score as number | undefined ?? 50
  const isNewHotLead = leadScore >= 85 && previousLeadScore < 85

  if (leadScore >= 85) {
    await auditLog(supabase, {
      tenantId,
      actorId: userId,
      action: 'lead.hot_detected',
      resourceType: 'conversation',
      resourceId: conversation!.id as string,
      metadata: { lead_score: leadScore, contact_profile: updatedProfile },
    })
  }

  const ownerEmail = tenant.business_email as string | undefined

  if (isNewHotLead) {
    void createNotification(
      tenantId,
      'hot_lead',
      '🔥 Hot Lead',
      `Contact scored ${leadScore}/100`,
      '/dashboard/conversations',
      supabase,
    )
  }

  if (escalated && conversation!.status !== 'escalated') {
    void createNotification(
      tenantId,
      'escalation',
      '⚡ Escalation',
      `${body.contact_identifier} needs attention`,
      '/dashboard/conversations',
      supabase,
    )
  }

  if (isNewHotLead && ownerEmail) {
    // Fire-and-forget hot lead alert
    sendHotLeadAlert(
      ownerEmail,
      tenant.business_name ?? 'Your Business',
      body.contact_identifier,
      leadScore,
      conversation!.id as string,
      updatedMessages.slice(-4),
      updatedProfile,
      body.channel,
    )
  }

  if (escalated && conversation!.status !== 'escalated' && ownerEmail) {
    // Fire-and-forget escalation alert
    sendEscalationAlert(
      ownerEmail,
      tenant.business_name ?? 'Your Business',
      body.contact_identifier,
      body.channel,
      conversation!.id as string,
      metadata?.suggested_next_action ?? 'Conversation requires human intervention',
      updatedMessages.slice(-4),
    )
  }

  // 13b. Nexus trigger dispatches (fire-and-forget)
  const triggerBase = {
    conversation_id:    conversation!.id as string,
    agent_id:           body.agent_id,
    channel:            body.channel,
    contact_identifier: body.contact_identifier,
    lead_score:         leadScore,
    sentiment:          metadata?.sentiment ?? 'neutral',
    dashboard_url:      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/conversations`,
  }

  void dispatchTrigger(tenantId, 'conversation.message', triggerBase, supabase)

  if (isNewHotLead) {
    void dispatchTrigger(tenantId, 'lead.hot_detected', { ...triggerBase, contact_name: body.contact_identifier }, supabase)
  }

  if (escalated && conversation!.status !== 'escalated') {
    void dispatchTrigger(tenantId, 'conversation.escalated', {
      ...triggerBase,
      reason: metadata?.suggested_next_action ?? 'Human intervention required',
    }, supabase)
  }

  const sentiment = metadata?.sentiment ?? 'neutral'
  if (sentiment === 'frustrated') {
    void dispatchTrigger(tenantId, 'sentiment.frustrated', { ...triggerBase, contact_name: body.contact_identifier }, supabase)
  }
  if (sentiment === 'excited') {
    void dispatchTrigger(tenantId, 'sentiment.excited', { ...triggerBase, contact_name: body.contact_identifier }, supabase)
  }

  // 14. Message audit log
  await auditLog(supabase, {
    tenantId,
    actorId: userId,
    action: 'conversation.message',
    resourceType: 'conversation',
    resourceId: conversation!.id as string,
    metadata: {
      model: claudeResult.model,
      tokens: claudeResult.tokensUsed,
      cost_pkr: claudeResult.estimatedCostPkr,
      confidence,
      escalated,
      lead_score: leadScore,
      sentiment: metadata?.sentiment,
    },
  })

  return ok({
    conversation_id:       conversation!.id,
    response:              cleanResponse,
    confidence,
    escalated,
    model_used:            claudeResult.model,
    tokens_used:           claudeResult.tokensUsed,
    cost_pkr:              claudeResult.estimatedCostPkr,
    lead_score:            leadScore,
    lead_label:            getLeadLabel(leadScore),
    sentiment:             metadata?.sentiment || 'neutral',
    emotional_state:       emotion.state,
    emotional_intensity:   emotion.intensity,
    contact_profile:       updatedProfile,
    suggested_next_action: metadata?.suggested_next_action || 'continue',
    memory: memory ? {
      relationship_score:  memory.relationship_score,
      total_interactions:  memory.total_interactions,
      total_value_pkr:     memory.total_value_pkr,
    } : null,
  })
}

function calculateConfidence(response: string, userMessage: string): number {
  void userMessage
  const lowSignals = [
    "i don't know", "i'm not sure", "i cannot",
    "i don't have", "unclear", "not certain",
    "unfortunately", "i'm unable",
  ]
  return lowSignals.some(s => response.toLowerCase().includes(s)) ? 0.62 : 0.93
}
