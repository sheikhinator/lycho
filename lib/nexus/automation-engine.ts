/* eslint-disable @typescript-eslint/no-explicit-any */
import { isPrivateUrl } from '@/lib/security'

export type TriggerType =
  | 'conversation.created'
  | 'conversation.message'
  | 'conversation.resolved'
  | 'conversation.escalated'
  | 'lead.hot_detected'
  | 'lead.score_changed'
  | 'agent.deployed'
  | 'agent.paused'
  | 'agent.error'
  | 'contact.profile_updated'
  | 'contact.returning'
  | 'sentiment.frustrated'
  | 'sentiment.excited'
  | 'trial.expiring'
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'webhook.received'
  | 'schedule.daily'
  | 'schedule.weekly'

export type ActionType =
  | 'send_email'
  | 'send_webhook'
  | 'send_whatsapp'
  | 'send_telegram'
  | 'send_slack'
  | 'create_contact_in_hubspot'
  | 'create_task_in_asana'
  | 'add_row_to_google_sheets'
  | 'send_to_zapier'
  | 'send_to_n8n'
  | 'send_to_make'
  | 'update_agent_config'
  | 'pause_agent'
  | 'escalate_conversation'
  | 'tag_contact'
  | 'wait'
  | 'condition'

export interface AutomationStep {
  id: string
  type: ActionType
  config: Record<string, any>
  condition?: {
    field: string
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals'
    value: any
  }
}

export interface AutomationTrigger {
  type: TriggerType
  filters?: {
    agent_id?: string
    channel?: string
    lead_score_min?: number
    lead_score_max?: number
    sentiment?: string
  }
}

export interface Automation {
  id: string
  tenant_id: string
  name: string
  description?: string
  trigger: AutomationTrigger
  steps: AutomationStep[]
  status: 'active' | 'paused' | 'draft'
  run_count: number
  last_run_at?: string
  created_at: string
}

export async function executeAutomation(
  automation: Automation,
  triggerData: Record<string, any>,
  supabase: any,
): Promise<{ success: boolean; stepsExecuted: any[]; error?: string }> {
  const stepsExecuted: any[] = []
  const startTime = Date.now()

  try {
    for (const step of automation.steps) {
      // Check condition first
      if (step.condition) {
        const fieldValue = triggerData[step.condition.field]
        const passes = evaluateCondition(fieldValue, step.condition.operator, step.condition.value)
        if (!passes) {
          stepsExecuted.push({ step: step.id, status: 'skipped', reason: 'condition_not_met' })
          continue
        }
      }

      const result = await executeStep(step, triggerData)
      stepsExecuted.push({
        step:   step.id,
        type:   step.type,
        status: result.success ? 'success' : 'failed',
        result,
      })

      if (!result.success && step.type !== 'condition') {
        throw new Error(`Step ${step.id} (${step.type}) failed: ${result.error}`)
      }
    }

    // Log success (automation_logs table — run SQL migration first)
    await (supabase.from('automation_logs') as any).insert({
      tenant_id:      automation.tenant_id,
      automation_id:  automation.id,
      trigger_event:  triggerData.event_type,
      trigger_data:   triggerData,
      steps_executed: stepsExecuted,
      status:         'success',
      duration_ms:    Date.now() - startTime,
    })

    // Update run count
    await supabase
      .from('automations')
      .update({ run_count: automation.run_count + 1, last_run_at: new Date().toISOString() })
      .eq('id', automation.id)

    return { success: true, stepsExecuted }
  } catch (error: any) {
    // Log failure
    await (supabase.from('automation_logs') as any).insert({
      tenant_id:      automation.tenant_id,
      automation_id:  automation.id,
      trigger_event:  triggerData.event_type,
      trigger_data:   triggerData,
      steps_executed: stepsExecuted,
      status:         'failed',
      error_message:  error.message,
      duration_ms:    Date.now() - startTime,
    })

    return { success: false, stepsExecuted, error: error.message }
  }
}

async function executeStep(
  step: AutomationStep,
  data: Record<string, any>,
): Promise<{ success: boolean; error?: string; result?: any }> {
  try {
    switch (step.type) {
      case 'send_email':
        await sendEmailAction(step.config, data)
        return { success: true }

      case 'send_webhook': {
        // SSRF protection — reject private/internal URLs
        if (await isPrivateUrl(step.config.url)) {
          return { success: false, error: 'Webhook URL targets a private/internal address — blocked for security' }
        }
        const response = await fetch(step.config.url, {
          method:  step.config.method ?? 'POST',
          headers: { 'Content-Type': 'application/json', ...(step.config.headers ?? {}) },
          body:    JSON.stringify({ ...data, ...(step.config.payload ?? {}) }),
        })
        return { success: response.ok, result: { status: response.status } }
      }

      case 'send_slack': {
        if (await isPrivateUrl(step.config.webhook_url)) {
          return { success: false, error: 'Slack webhook URL targets a private/internal address — blocked for security' }
        }
        await fetch(step.config.webhook_url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text: interpolate(step.config.message ?? '', data) }),
        })
        return { success: true }
      }

      case 'send_to_zapier':
      case 'send_to_n8n':
      case 'send_to_make': {
        if (await isPrivateUrl(step.config.webhook_url)) {
          return { success: false, error: 'Integration webhook URL targets a private/internal address — blocked for security' }
        }
        await fetch(step.config.webhook_url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        })
        return { success: true }
      }

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, (step.config.seconds ?? 1) * 1000))
        return { success: true }

      case 'tag_contact':
        // Handled by caller updating memory graph
        return { success: true, result: { tag: step.config.tag_name } }

      default:
        return { success: true, result: { skipped: true, reason: 'action_not_implemented_yet' } }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

function evaluateCondition(value: any, operator: string, target: any): boolean {
  switch (operator) {
    case 'equals':       return value === target
    case 'not_equals':   return value !== target
    case 'greater_than': return Number(value) > Number(target)
    case 'less_than':    return Number(value) < Number(target)
    case 'contains':     return String(value).toLowerCase().includes(String(target).toLowerCase())
    default:             return true
  }
}

function interpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => String(data[key] ?? `{{${key}}}`))
}

async function sendEmailAction(config: any, data: Record<string, any>): Promise<void> {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from:    config.from ?? 'LYCHO <notifications@lycho.app>',
    to:      interpolate(config.to ?? '', data),
    subject: interpolate(config.subject ?? '', data),
    html:    interpolate(config.body ?? '', data),
  })
}
