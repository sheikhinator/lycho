import { NextRequest } from 'next/server'
import { getAuthContext, ok, err, rateGuard, AUTH_LIMITS } from '@/lib/api'
import { sanitiseInput } from '@/lib/sanitise'
import { callClaude, MODELS } from '@/lib/claude'
import { MANUAL_FORGE_PROMPT } from '@/lib/agents/forge-agent'

interface ForgedAgentSpec {
  agent_type: string
  display_name: string
  description: string
  system_prompt: string
  recommended_channels: string[]
  model_complexity: string
  estimated_value_pkr: number
  sector_tags: string[]
  use_case_examples: string[]
  why_novel: string
}

function stripMarkdown(text: string): string {
  return text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
}

// POST /api/forge/manual — create a bespoke agent for the authenticated tenant
export async function POST(req: NextRequest) {
  const rl = await rateGuard(req, AUTH_LIMITS)
  if (rl) return rl

  const ctx = await getAuthContext()
  if (!ctx) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!ctx.tenantId) return err('No tenant found', 'NO_TENANT', 403)

  const { supabase, tenantId } = ctx

  // Check tenant plan
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan')
    .eq('id', tenantId)
    .single()

  if (!tenant || !['business', 'enterprise'].includes(tenant.plan ?? ''))
    return err('The Forge requires a Business or Enterprise plan', 'PLAN_REQUIRED', 403)

  let body: { description: string; sector?: string; channels?: string[] }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 'INVALID_BODY', 400)
  }

  if (!body.description?.trim())
    return err('description is required', 'VALIDATION_ERROR', 400)

  const sanitised = sanitiseInput(body.description)
  if (!sanitised.safe) return err('Invalid input detected', 'INVALID_INPUT', 400)

  const contextBlock = [
    `Description: ${sanitised.cleaned}`,
    body.sector   ? `Sector: ${body.sector}`                    : null,
    body.channels ? `Preferred channels: ${body.channels.join(', ')}` : null,
  ].filter(Boolean).join('\n')

  const { response } = await callClaude({
    systemPrompt: MANUAL_FORGE_PROMPT,
    messages: [{ role: 'user', content: contextBlock }],
    model: MODELS.smart,
    maxTokens: 3000,
    useCache: false,
  })

  let spec: ForgedAgentSpec
  try {
    spec = JSON.parse(stripMarkdown(response))
    if (!spec?.agent_type) throw new Error('missing agent_type')
  } catch (e) {
    return err('AI returned an invalid specification. Please try again.', 'PARSE_ERROR', 500)
  }

  // Create the agent for this tenant
  const { data: agent, error: insertErr } = await supabase
    .from('agents')
    .insert({
      tenant_id:    tenantId,
      agent_type:   spec.agent_type,
      display_name: spec.display_name,
      channels:     spec.recommended_channels ?? [],
      config: {
        system_prompt:       spec.system_prompt,
        model_complexity:    spec.model_complexity ?? 'simple',
        estimated_value_pkr: spec.estimated_value_pkr ?? 0,
        sector_tags:         spec.sector_tags ?? [],
        use_case_examples:   spec.use_case_examples ?? [],
        why_novel:           spec.why_novel ?? '',
        source:              'forge',
        description:         body.description,
        sector:              body.sector ?? null,
      },
      status:  'configuring',
      version: 1,
    })
    .select()
    .single()

  if (insertErr) return err(insertErr.message, 'DB_ERROR', 500)

  return ok({ ...agent, spec }, 'Agent forged successfully', 201)
}
