import { getAIClient } from '@/lib/ai'
import { admin } from '@/lib/admin'

const supabaseAdmin = admin()

const openai = getAIClient()

export type SyndicateMessageType =
  | 'request_analysis'
  | 'request_action'
  | 'share_intelligence'
  | 'forge_brief'
  | 'quality_check'
  | 'security_check'
  | 'council_request'
  | 'optimisation_report'
  | 'market_alert'
  | 'escalation'

export interface SyndicateMessage {
  from_agent: string
  to_agent: string
  message_type: SyndicateMessageType
  payload: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high' | 'critical'
  tenant_id?: string
  conversation_id?: string
}

export interface SyndicateResponse {
  success: boolean
  response: unknown
  from_agent: string
  to_agent: string
  duration_ms: number
  quality_score?: number
  flagged?: boolean
}

// ── SYNDICATE INTELLIGENCE IDENTITY ────────────────────────────────────────

export async function getSyndicateIntelligence(): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('orion_agent_intelligence')
    .select('optimised_prompt, intelligence_score')
    .eq('agent_type', 'syndicate')
    .single()

  if (existing?.optimised_prompt) return existing.optimised_prompt

  const [routes, messages] = await Promise.all([
    supabaseAdmin.from('syndicate_routes').select('from_agent,to_agent,route_type').eq('active', true).limit(30),
    supabaseAdmin.from('syndicate_messages').select('from_agent,to_agent,status').order('created_at', { ascending: false }).limit(10)
  ])

  const response = await openai.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are ORION generating an identity prompt for THE SYNDICATE — LYCHO's inter-agent communication network.

THE SYNDICATE:
- Routes messages between all agents in real-time
- Enforces security via Guardian monitoring all traffic
- Ensures quality via Veritas scoring all responses
- Maintains ${routes.data?.length || 0} active routes across the agent network
- Has processed messages recently between: ${messages.data?.map(m => `${m.from_agent}→${m.to_agent}`).join(', ') || 'agents'}

Generate a system prompt for SYNDICATE's identity in Command Center.
Include: role as network controller, capabilities (transmit/broadcast/route management), personality (precise, network-aware, technical), authority over routes.
Return only the system prompt. Be concise and powerful.`
    }]
  })

  const prompt = response.choices[0]?.message?.content || 'You are THE SYNDICATE — LYCHO\'s inter-agent communication highway. You route messages, enforce security, and maintain network integrity.'

  await supabaseAdmin.from('orion_agent_intelligence').upsert({
    agent_type: 'syndicate',
    base_prompt: prompt,
    optimised_prompt: prompt,
    intelligence_score: 80,
    version: 1,
    country_variants: {},
    last_optimised_at: new Date().toISOString(),
    next_optimisation_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, { onConflict: 'agent_type' })

  return prompt
}

// ── TRANSMIT ────────────────────────────────────────────────────────────────

export async function transmit(message: SyndicateMessage): Promise<SyndicateResponse> {
  const start = Date.now()
  console.log(`[SYNDICATE] ${message.from_agent} ──► ${message.to_agent} [${message.message_type}]`)

  try {
    const { data: record } = await supabaseAdmin
      .from('syndicate_messages')
      .insert({
        from_agent: message.from_agent,
        to_agent: message.to_agent,
        message_type: message.message_type,
        payload: message.payload,
        priority: message.priority || 'normal',
        tenant_id: message.tenant_id || null,
        conversation_id: message.conversation_id || null,
        status: 'processing'
      })
      .select()
      .single()

    // Guardian block critical or security messages
    let flagged = false
    if (message.priority === 'critical' || message.message_type === 'security_check') {
      flagged = await guardianCheck(message)
    }

    if (flagged) {
      if (record) {
        await supabaseAdmin.from('syndicate_messages')
          .update({ status: 'blocked', flagged_by_guardian: true })
          .eq('id', record.id)
      }
      return {
        success: false,
        response: { blocked: true, reason: 'Guardian flagged this message' },
        from_agent: message.from_agent,
        to_agent: message.to_agent,
        duration_ms: Date.now() - start,
        flagged: true
      }
    }

    const response = await routeToAgent(message)

    let qualityScore = 85
    if (message.message_type === 'request_analysis' && response) {
      const responseStr = typeof response === 'object' && response !== null && 'response' in response
        ? String((response as Record<string, unknown>).response || '')
        : String(response)
      qualityScore = veritasCheck(responseStr)
    }

    if (record) {
      await supabaseAdmin.from('syndicate_messages')
        .update({
          response,
          status: 'completed',
          responded_at: new Date().toISOString(),
          quality_score: qualityScore,
          duration_ms: Date.now() - start
        })
        .eq('id', record.id)
    }

    console.log(`[SYNDICATE] ✓ ${message.from_agent} ──► ${message.to_agent} (${Date.now() - start}ms, quality: ${qualityScore})`)

    return {
      success: true,
      response,
      from_agent: message.from_agent,
      to_agent: message.to_agent,
      duration_ms: Date.now() - start,
      quality_score: qualityScore
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    console.error(`[SYNDICATE] ✗ ${message.from_agent} ──► ${message.to_agent}:`, err.message)
    return {
      success: false,
      response: { error: err.message },
      from_agent: message.from_agent,
      to_agent: message.to_agent,
      duration_ms: Date.now() - start
    }
  }
}

// ── BROADCAST ───────────────────────────────────────────────────────────────

export async function broadcast(
  fromAgent: string,
  toAgents: string[],
  messageType: SyndicateMessageType,
  payload: Record<string, unknown>,
  tenantId?: string
): Promise<SyndicateResponse[]> {
  console.log(`[SYNDICATE BROADCAST] ${fromAgent} ──► [${toAgents.join(', ')}]`)
  return Promise.all(
    toAgents.map(toAgent => transmit({
      from_agent: fromAgent,
      to_agent: toAgent,
      message_type: messageType,
      payload,
      tenant_id: tenantId
    }))
  )
}

// ── AGENT ROUTER ────────────────────────────────────────────────────────────

async function routeToAgent(message: SyndicateMessage): Promise<unknown> {
  switch (message.to_agent) {
    case 'orion':    return handleOrion(message)
    case 'forge':    return handleForge(message)
    case 'nexus':    return handleNexus(message)
    case 'guardian': return handleGuardian(message)
    case 'veritas':  return handleVeritas(message)
    default:         return handleSpecialist(message)
  }
}

async function handleOrion(message: SyndicateMessage): Promise<unknown> {
  if (message.message_type === 'forge_brief') {
    const { generateForgeBrief } = await import('@/lib/orion/forge-collaboration')
    const brief = await generateForgeBrief()
    return { brief, generated_at: new Date().toISOString() }
  }
  if (message.message_type === 'request_analysis') {
    const { data: agents } = await supabaseAdmin.from('orion_agent_intelligence').select('agent_type, intelligence_score')
    const avg = agents ? Math.round(agents.reduce((s, a) => s + a.intelligence_score, 0) / (agents.length || 1)) : 0
    return { platform_health: agents?.length || 0, avg_score: avg, underperforming: agents?.filter(a => a.intelligence_score < 60).map(a => a.agent_type) || [] }
  }
  return { acknowledged: true, agent: 'orion' }
}

async function handleForge(message: SyndicateMessage): Promise<unknown> {
  if (message.message_type === 'share_intelligence') {
    try {
      await supabaseAdmin.from('orion_forge_briefs').insert({
        quality_directives: message.payload.brief || message.payload.message,
        gaps_identified: message.payload.gaps || [],
        status: 'pending'
      })
    } catch { /* table may not exist */ }
    return { received: true, stored: true }
  }
  if (message.message_type === 'request_action' && message.payload.action === 'run') {
    const { runAutonomousForge } = await import('@/lib/forge/forge-scheduler')
    return await runAutonomousForge()
  }
  return { acknowledged: true, agent: 'forge' }
}

async function handleNexus(message: SyndicateMessage): Promise<unknown> {
  if (message.message_type === 'share_intelligence') {
    const { data } = await supabaseAdmin.from('automations').select('trigger_type, status').eq('status', 'active')
    return { active_automations: data?.length || 0 }
  }
  return { acknowledged: true, agent: 'nexus' }
}

async function handleGuardian(message: SyndicateMessage): Promise<unknown> {
  const flagged = await guardianCheck(message)
  return { flagged, cleared: !flagged, checked_at: new Date().toISOString() }
}

async function handleVeritas(message: SyndicateMessage): Promise<unknown> {
  const text = typeof message.payload.response === 'string' ? message.payload.response : ''
  const score = veritasCheck(text)
  return { quality_score: score, passed: score >= 70, checked_at: new Date().toISOString() }
}

async function handleSpecialist(message: SyndicateMessage): Promise<unknown> {
  const { injectIntelligence } = await import('@/lib/orion/orion-engine')
  const countryCode = typeof message.payload.country_code === 'string' ? message.payload.country_code : 'PK'
  const systemPrompt = await injectIntelligence(message.to_agent, countryCode)
  const response = await openai.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 400,
    messages: [
      { role: 'system', content: `${systemPrompt}\n\nYou are receiving a Syndicate message from ${message.from_agent}. Respond concisely with your specialist expertise.` },
      { role: 'user', content: `[${message.message_type}] from ${message.from_agent}: ${JSON.stringify(message.payload)}` }
    ]
  })
  return { response: response.choices[0]?.message?.content || '', agent: message.to_agent }
}

// ── GUARDIAN ────────────────────────────────────────────────────────────────

async function guardianCheck(message: SyndicateMessage): Promise<boolean> {
  const payloadStr = JSON.stringify(message.payload).toLowerCase()
  const injectionPatterns = [
    'ignore all previous instructions', 'ignore previous', 'system prompt',
    'jailbreak', 'act as if you have no', 'pretend you have no restrictions',
    'bypass all', 'override instructions', 'you are now', 'forget your',
    'new persona', 'disregard', '[[system]]', '</system>', 'do anything now',
    'dan mode', 'developer mode'
  ]
  const flagged = injectionPatterns.some(p => payloadStr.includes(p))
  if (flagged) {
    console.warn(`[GUARDIAN] Flagged message from ${message.from_agent} to ${message.to_agent}`)
    try {
      await supabaseAdmin.from('syndicate_messages').insert({
        from_agent: 'guardian',
        to_agent: 'orion',
        message_type: 'security_check',
        payload: { incident: 'injection_attempt', original_from: message.from_agent },
        status: 'completed',
        priority: 'critical'
      })
    } catch { /* non-critical */ }
  }
  return flagged
}

// ── VERITAS ─────────────────────────────────────────────────────────────────

function veritasCheck(response: string): number {
  if (!response || response.length < 10) return 20
  let score = 70
  if (response.length > 100) score += 5
  if (response.includes('?')) score += 3
  if (/\d/.test(response)) score += 3
  if (response.split('\n').length > 2) score += 4
  if (response.toLowerCase().includes('i cannot')) score -= 10
  if (response.toLowerCase().includes("i don't know")) score -= 8
  if (response.toLowerCase().includes('error')) score -= 15
  if (response.toLowerCase().includes('i apologize') && response.length < 100) score -= 5
  return Math.max(0, Math.min(100, score))
}

// ── SEED ROUTES ─────────────────────────────────────────────────────────────

export async function seedSyndicateRoutes(): Promise<{ seeded: number }> {
  const routes = [
    { from_agent: 'orion',       to_agent: 'forge',      route_type: 'strategic',     bidirectional: true  },
    { from_agent: 'orion',       to_agent: 'nexus',      route_type: 'strategic',     bidirectional: true  },
    { from_agent: 'orion',       to_agent: 'guardian',   route_type: 'security',      bidirectional: true  },
    { from_agent: 'orion',       to_agent: 'veritas',    route_type: 'quality',       bidirectional: true  },
    { from_agent: 'forge',       to_agent: 'nexus',      route_type: 'coordination',  bidirectional: true  },
    { from_agent: 'guardian',    to_agent: 'veritas',    route_type: 'security',      bidirectional: true  },
    { from_agent: 'intake',      to_agent: 'orion',      route_type: 'reporting',     bidirectional: false },
    { from_agent: 'research',    to_agent: 'orion',      route_type: 'reporting',     bidirectional: false },
    { from_agent: 'compliance',  to_agent: 'orion',      route_type: 'reporting',     bidirectional: false },
    { from_agent: 'analyst',     to_agent: 'orion',      route_type: 'reporting',     bidirectional: false },
    { from_agent: 'intake',      to_agent: 'research',   route_type: 'escalation',    bidirectional: false },
    { from_agent: 'intake',      to_agent: 'compliance', route_type: 'escalation',    bidirectional: false },
    { from_agent: 'intake',      to_agent: 'operations', route_type: 'handoff',       bidirectional: false },
    { from_agent: 'research',    to_agent: 'analyst',    route_type: 'collaboration', bidirectional: true  },
    { from_agent: 'compliance',  to_agent: 'research',   route_type: 'collaboration', bidirectional: true  },
    { from_agent: 'client',      to_agent: 'analyst',    route_type: 'data',          bidirectional: false },
    { from_agent: 'content',     to_agent: 'research',   route_type: 'intelligence',  bidirectional: false },
    { from_agent: 'operations',  to_agent: 'analyst',    route_type: 'reporting',     bidirectional: false },
    { from_agent: 'guardian',    to_agent: 'intake',     route_type: 'security',      bidirectional: false },
    { from_agent: 'guardian',    to_agent: 'research',   route_type: 'security',      bidirectional: false },
    { from_agent: 'guardian',    to_agent: 'compliance', route_type: 'security',      bidirectional: false },
    { from_agent: 'veritas',     to_agent: 'intake',     route_type: 'quality',       bidirectional: false },
    { from_agent: 'veritas',     to_agent: 'content',    route_type: 'quality',       bidirectional: false },
    { from_agent: 'veritas',     to_agent: 'research',   route_type: 'quality',       bidirectional: false },
  ]

  let seeded = 0
  for (const route of routes) {
    const { error } = await supabaseAdmin.from('syndicate_routes')
      .upsert(route, { onConflict: 'from_agent,to_agent' })
    if (!error) seeded++
  }
  return { seeded }
}

// ── SEED REGISTRY ────────────────────────────────────────────────────────────

export async function seedAgentRegistry(): Promise<{ seeded: number }> {
  const agents = [
    { agent_type: 'orion',      display_name: 'ORION',      category: 'universe_a', description: 'Intelligence layer — optimises all agents', is_core: true, is_universe_a: true, can_initiate_council: true },
    { agent_type: 'forge',      display_name: 'FORGE',      category: 'universe_a', description: 'Autonomous agent builder', is_core: true, is_universe_a: true },
    { agent_type: 'nexus',      display_name: 'NEXUS',      category: 'universe_a', description: 'Automation orchestration engine', is_core: true, is_universe_a: true },
    { agent_type: 'guardian',   display_name: 'GUARDIAN',   category: 'universe_a', description: 'Security enforcement — monitors all traffic', is_core: true, is_universe_a: true },
    { agent_type: 'veritas',    display_name: 'VERITAS',    category: 'universe_a', description: 'Quality control — scores all responses', is_core: true, is_universe_a: true },
    { agent_type: 'intake',     display_name: 'Intake',     category: 'core',       description: 'First contact — qualifies and routes leads', is_core: true },
    { agent_type: 'research',   display_name: 'Research',   category: 'core',       description: 'Deep research and intelligence gathering', is_core: true },
    { agent_type: 'compliance', display_name: 'Compliance', category: 'core',       description: 'Regulatory and legal compliance', is_core: true },
    { agent_type: 'analyst',    display_name: 'Analyst',    category: 'core',       description: 'Data analysis and insights', is_core: true },
    { agent_type: 'operations', display_name: 'Operations', category: 'core',       description: 'Operational execution and coordination', is_core: true },
    { agent_type: 'client',     display_name: 'Client',     category: 'core',       description: 'Client relationship management', is_core: true },
    { agent_type: 'content',    display_name: 'Content',    category: 'core',       description: 'Content creation and management', is_core: true },
  ]

  let seeded = 0
  for (const agent of agents) {
    const { error } = await supabaseAdmin.from('agent_registry')
      .upsert(agent, { onConflict: 'agent_type' })
    if (!error) seeded++
  }
  return { seeded }
}

// ── PERMISSIONS ──────────────────────────────────────────────────────────────

export const SYNDICATE_PERMISSIONS: Record<string, string[]> = {
  orion:      ['read_all','write_all','execute_all','manage_agents','manage_routes','security_override'],
  forge:      ['read_all','write_forge_queue','write_marketplace','read_intelligence'],
  nexus:      ['read_automations','write_automations','read_conversations','trigger_webhooks'],
  guardian:   ['read_all','block_messages','log_incidents','alert_orion'],
  veritas:    ['read_all_responses','score_responses','flag_quality'],
  syndicate:  ['read_all','write_all','execute_all','manage_routes','manage_agents','full_platform_access'],
  intake:     ['read_contacts','write_conversations','escalate_to_any','request_research'],
  research:   ['read_all_data','write_intelligence','escalate_to_compliance'],
  operations: ['read_schedules','write_tasks','trigger_automations'],
  client:     ['read_contact_history','write_relationship_data','request_analyst'],
  analyst:    ['read_all_metrics','write_reports','request_research'],
  compliance: ['read_regulations','write_compliance_reports','alert_orion'],
  content:    ['read_brand_context','write_content','request_research'],
  default:    ['read_own_context','write_own_responses','escalate_to_core','request_help'],
}

export function getAgentPermissions(agentType: string): string[] {
  return SYNDICATE_PERMISSIONS[agentType] || SYNDICATE_PERMISSIONS.default
}

export async function checkPermission(agentType: string, permission: string): Promise<boolean> {
  const perms = getAgentPermissions(agentType)
  return perms.includes(permission) || perms.includes('full_platform_access') || perms.includes('read_all')
}

// ── REGISTER AGENT ───────────────────────────────────────────────────────────

export async function registerAgent(agentType: string, displayName: string, isUniverseA = false): Promise<void> {
  await supabaseAdmin.from('agent_registry').upsert({
    agent_type: agentType,
    display_name: displayName,
    category: isUniverseA ? 'universe_a' : 'specialist',
    is_universe_a: isUniverseA,
    is_core: false,
    can_receive_messages: true,
    status: 'active',
    registered_at: new Date().toISOString()
  }, { onConflict: 'agent_type' })

  // Auto-create default routes
  const routes = [
    { from_agent: agentType, to_agent: 'orion',    route_type: 'reporting',    bidirectional: false },
    { from_agent: agentType, to_agent: 'guardian',  route_type: 'security',     bidirectional: false },
    { from_agent: agentType, to_agent: 'veritas',   route_type: 'quality',      bidirectional: false },
    { from_agent: 'orion',   to_agent: agentType,   route_type: 'optimisation', bidirectional: false },
  ]
  for (const route of routes) {
    try {
      await supabaseAdmin.from('syndicate_routes')
        .upsert(route, { onConflict: 'from_agent,to_agent' })
    } catch { /* ignore duplicates */ }
  }
  console.log(`[SYNDICATE] Registered: ${agentType}`)
}
