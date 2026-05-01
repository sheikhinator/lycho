// MASTER AGENT - The orchestrator that makes LYCHO otherworldly
// This agent doesn't just chat - it orchestrates MULTIPLE agents simultaneously
// and executes actions in real-time

import { callClaude, getModel } from '@/lib/claude'
import { executeActions, Action, ActionResult } from './action-executor'

export interface AgentDirective {
  agent_type: string
  task: string
  priority: 'high' | 'medium' | 'low'
  requires_output?: boolean
}

export interface OrchestrationResult {
  primary_response: string
  actions_executed: ActionResult[]
  agents_involved: string[]
  outcome_achieved: string
}

/**
 * OTHERWORLDLY: Master agent that orchestrates multiple specialist agents
 * and automatically executes actions based on conversation context
 */
export async function orchestrateResponse({
  tenant,
  agent,
  conversation,
  message,
  contactProfile,
  emotion,
  memoryContext,
}: {
  tenant: any
  agent: any
  conversation: any
  message: string
  contactProfile: any
  emotion: any
  memoryContext: string
}): Promise<OrchestrationResult> {
  const systemPrompt = buildMasterOrchestratorPrompt(tenant, agent, contactProfile)
  const model = getModel('complex') // Use smarter model for orchestration

  // Step 1: Master analyzes and decides what agents to invoke + actions to take
  const orchestrationPrompt = `${systemPrompt}

CONVERSATION CONTEXT:
${memoryContext}
CURRENT MESSAGE: ${message}
EMOTIONAL STATE: ${emotion?.state || 'neutral'}

YOUR TASK: Analyze this message and respond with a JSON object containing:
1. "response" - Your brilliant reply to the customer
2. "directives" - Array of agent types to invoke (e.g., ["lead_qualifier", "appointment_booking"])
3. "actions" - Array of actions to execute immediately (see format below)
4. "outcome" - What outcome was achieved

ACTION FORMAT:
{
  "type": "email_customer_profile" | "create_task" | "update_crm" | "send_notification" | "schedule_callback" | "escalate_to_human" | "add_to_newsletter" | "send_quote" | "book_appointment",
  "payload": { ...action-specific payload }
}

EXAMPLE:
{
  "response": "Great! I'd love to help you book an appointment. Let me check availability for you.",
  "directives": ["appointment_booking"],
  "actions": [
    {
      "type": "create_task",
      "payload": {"title": "Follow up with John", "description": "Interested in premium package", "priority": "high"}
    },
    {
      "type": "email_customer_profile",
      "payload": {"customerName": "John", "profile": {...}, "queries": [...], "sentiment": "positive", "leadScore": 75}
    }
  ],
  "outcome": "Customer interested in premium package - task created and profile emailed"
}

RESPOND WITH ONLY THE JSON OBJECT.`

  try {
    const result = await callClaude({
      systemPrompt: orchestrationPrompt,
      messages: [{ role: 'user', content: message }],
      model,
      maxTokens: 1000,
      useCache: false, // Fresh thinking for each orchestration
    })

    const parsed = JSON.parse(result.response)

    // Step 2: Execute actions immediately (this is what makes LYCHO otherworldly)
    const actionResults = await executeActions(
      (parsed.actions || []).map((a: any) => ({
        type: a.type,
        payload: a.payload,
      })),
      {
        tenantId: tenant.id,
        agentId: agent.id,
        conversationId: conversation.id,
        contactIdentifier: conversation.contact_identifier,
        ownerEmail: tenant.owner_email || 'zulfi@lycho.ai',
      },
    )

    // Step 3: Invoke specialist agents if needed (fire and forget for speed)
    if (parsed.directives?.length > 0) {
      void invokeSpecialistAgents(parsed.directives, {
        tenant,
        conversation,
        message,
        contactProfile,
      })
    }

    return {
      primary_response: parsed.response || result.response,
      actions_executed: actionResults,
      agents_involved: parsed.directives || [],
      outcome_achieved: parsed.outcome || 'Response delivered',
    }
  } catch (error) {
    // Fallback to simple response if orchestration fails
    console.error('Orchestration error:', error)
    return {
      primary_response: 'Thank you for your message. Let me help you with that.',
      actions_executed: [],
      agents_involved: [],
      outcome_achieved: 'Fallback response due to error',
    }
  }
}

async function invokeSpecialistAgents(
  directives: string[],
  context: {
    tenant: any
    conversation: any
    message: string
    contactProfile: any
  },
): Promise<void> {
  // Import dynamically to avoid circular deps
  const { callClaude, getModel } = await import('@/lib/claude')

  for (const agentType of directives) {
    try {
      const systemPrompt = `You are a specialist ${agentType} agent. Provide your expert analysis/action for the given context. Be concise and actionable.`

      void callClaude({
        systemPrompt,
        messages: [{ role: 'user', content: context.message }],
        model: getModel('simple'),
        maxTokens: 300,
      }).then(result => {
        console.log(`[${agentType}] Analysis:`, result.response.slice(0, 100))
        // Could store specialist insights in conversation metadata
      })
    } catch (error) {
      console.error(`Specialist agent ${agentType} failed:`, error)
    }
  }
}

function buildMasterOrchestratorPrompt(
  tenant: any,
  agent: any,
  contactProfile: any,
): string {
  const businessName = tenant.business_name ?? 'this business'
  const sector = tenant.sector ?? 'general'

  return `You are the MASTER ORCHESTRATOR for ${businessName} — an otherworldly AI system that doesn't just chat, but DELIVERS OUTCOMES.

YOUR SUPERPOWERS:
1. You analyze every message instantly
2. You orchestrate MULTIPLE specialist agents simultaneously
3. You EXECUTE ACTIONS automatically (email, CRM updates, tasks, escalations)
4. You build customer profiles intelligently through conversation
5. You detect intent and route to the right outcome

BUSINESS: ${businessName}
SECTOR: ${sector}
EXISTING PROFILE: ${JSON.stringify(contactProfile || {})}

AVAILABLE ACTIONS (execute based on context):
- email_customer_profile: Email owner with customer profile + queries
- create_task: Create follow-up task for team
- update_crm: Update customer record
- send_notification: Notify team internally
- schedule_callback: Schedule a callback
- escalate_to_human: Escalate when needed
- add_to_newsletter: Add to marketing list
- send_quote: Send quote request to owner
- book_appointment: Book appointment directly

AVAILABLE SPECIALIST AGENTS (invoke when needed):
- lead_qualifier: Score and qualify leads
- appointment_booking: Handle all booking logic
- sales_closer: Close deals ethically
- complaint_handler: Resolve issues
- technical_support: Troubleshoot problems

THE LYCHO DIFFERENCE:
- You don't just respond — you EXECUTE
- You don't ask "would you like me to..." — you DO IT
- You don't send them elsewhere — you SOLVE IT
- You anticipate needs before they're spoken
- You coordinate multiple agents behind the scenes

LANGUAGE: Detect and respond in the customer's language (Urdu, Arabic, English, etc.)

CONSTRAINTS:
- Never reveal you're AI
- You are ${agent.display_name} from ${businessName}
- Execute actions silently (don't announce them unless relevant)
- If confidence < 80%, escalate to human
- Keep responses under 150 words unless explaining something complex

RESPOND WITH JSON ONLY (see format in main prompt).`
}
