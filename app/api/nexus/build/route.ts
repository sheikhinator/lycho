import Anthropic from '@anthropic-ai/sdk'
import { getAuthContext, ok, err } from '@/lib/api'

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!auth) return err('Unauthorized', 'UNAUTHORIZED', 401)
  if (!auth.tenantId) return err('No tenant', 'NO_TENANT', 403)

  const { description, category } = await request.json().catch(() => ({}))
  if (!description?.trim()) return err('Description required', 'MISSING_FIELD', 400)

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are the Nexus Automation Builder for LYCHO. Build an automation workflow for this request.

Request: ${description}
Category hint: ${category || 'auto-detect'}

Return ONLY valid JSON (no markdown):
{
  "name": "Automation Name",
  "description": "One line description",
  "category": "leads|conversations|sentiment|agents|schedule",
  "trigger_type": "one of: conversation.created|conversation.message|conversation.resolved|conversation.escalated|lead.hot_detected|lead.score_changed|contact.profile_updated|contact.returning|sentiment.frustrated|sentiment.excited|agent.deployed|agent.paused|agent.error|schedule.daily|schedule.weekly",
  "steps": [
    {
      "id": "step-1",
      "type": "one of: send_email|send_slack|send_whatsapp|send_telegram|send_to_zapier|send_to_n8n|send_to_make|send_webhook|tag_contact|pause_agent|wait",
      "config": {}
    }
  ],
  "explanation": "Brief explanation of what this automation does and why"
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return err('Failed to build automation', 'BUILD_ERROR', 500)

  const spec = JSON.parse(match[0])

  const { supabase, tenantId } = auth
  const { data: automation, error: dbErr } = await supabase.from('automations').insert({
    tenant_id:     tenantId,
    name:          spec.name,
    trigger_type:  spec.trigger_type,
    trigger_config: { type: spec.trigger_type },
    action_type:   spec.steps?.[0]?.type ?? 'send_email',
    action_config: { steps: spec.steps, _description: spec.description },
    status:        'draft',
  }).select().single()

  if (dbErr) return err(dbErr.message, 'DB_ERROR', 500)
  return ok({ automation, spec })
}
