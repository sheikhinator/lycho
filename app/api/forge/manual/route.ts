import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext } from '@/lib/api'
import { ok, err } from '@/lib/api'

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!auth) return err('Unauthorized', 'UNAUTHORIZED', 401)

  const { description, sector, channels } = await request.json()
  if (!description) return err('Description required', 'MISSING_FIELD', 400)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are the Forge Agent for LYCHO. Build a custom AI agent for this business request.

Request: ${description}
Sector: ${sector || 'general'}
Channels: ${channels?.join(', ') || 'web, email'}

Return ONLY valid JSON (no markdown):
{
  "agent_type": "unique_slug",
  "display_name": "Agent Name",
  "description": "One line description",
  "system_prompt": "Complete system prompt under 300 words with Human Sovereignty constraints and all language support",
  "recommended_channels": ["web"],
  "model_complexity": "simple",
  "capabilities": ["capability 1", "capability 2", "capability 3"]
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return err('Failed to build agent', 'FORGE_ERROR', 500)

  const agentSpec = JSON.parse(match[0])

  const { supabase, tenantId } = auth
  if (!tenantId) return err('Tenant not found', 'TENANT_ERROR', 400)
  const { data: agent } = await supabase.from('agents').insert({
    tenant_id: tenantId,
    agent_type: agentSpec.agent_type,
    display_name: agentSpec.display_name,
    status: 'configuring',
    config: { system_prompt: agentSpec.system_prompt, capabilities: agentSpec.capabilities },
    channels: agentSpec.recommended_channels,
  }).select().single()

  return ok({ agent, spec: agentSpec })
}
