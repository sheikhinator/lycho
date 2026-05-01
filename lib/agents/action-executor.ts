import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

// Action types that agents can execute
export type ActionType =
  | 'email_customer_profile'
  | 'create_task'
  | 'update_crm'
  | 'send_notification'
  | 'schedule_callback'
  | 'escalate_to_human'
  | 'add_to_newsletter'
  | 'send_quote'
  | 'book_appointment'

export interface Action {
  type: ActionType
  payload: Record<string, any>
}

interface ActionResult {
  success: boolean
  message: string
  data?: any
}

export async function executeActions(
  actions: Action[],
  context: {
    tenantId: string
    agentId: string
    conversationId: string
    contactIdentifier: string
    ownerEmail: string
  },
): Promise<ActionResult[]> {
  const results: ActionResult[] = []

  for (const action of actions) {
    try {
      const result = await executeAction(action, context)
      results.push(result)
    } catch (error) {
      results.push({
        success: false,
        message: `Failed to execute ${action.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return results
}

async function executeAction(
  action: Action,
  context: {
    tenantId: string
    agentId: string
    conversationId: string
    contactIdentifier: string
    ownerEmail: string
  },
): Promise<ActionResult> {
  const supabase = createAdminClient()

  switch (action.type) {
    case 'email_customer_profile':
      return sendCustomerProfileEmail(action.payload, context)

    case 'create_task':
      return createTask(action.payload, context, supabase)

    case 'update_crm':
      return updateCRM(action.payload, context, supabase)

    case 'send_notification':
      return sendNotification(action.payload, context, supabase)

    case 'schedule_callback':
      return scheduleCallback(action.payload, context, supabase)

    case 'escalate_to_human':
      return escalateToHuman(action.payload, context, supabase)

    case 'add_to_newsletter':
      return addToNewsletter(action.payload, context, supabase)

    case 'send_quote':
      return sendQuote(action.payload, context)

    case 'book_appointment':
      return bookAppointment(action.payload, context, supabase)

    default:
      return { success: false, message: `Unknown action type: ${action.type}` }
  }
}

export async function sendCustomerProfileEmail(
  payload: any,
  context: { ownerEmail: string; contactIdentifier: string; conversationId: string },
): Promise<ActionResult> {
  try {
    const { customerName, profile, queries, sentiment, leadScore } = payload

    await resend.emails.send({
      from: 'LYCHO <alerts@lycho.ai>',
      to: context.ownerEmail,
      subject: `New Customer Query — ${customerName || context.contactIdentifier}`,
      html: `
        <h2>New Customer Query via WhatsApp</h2>
        <p><strong>Customer:</strong> ${customerName || 'Unknown'}</p>
        <p><strong>Contact:</strong> ${context.contactIdentifier}</p>
        <p><strong>Sentiment:</strong> ${sentiment || 'neutral'}</p>
        <p><strong>Lead Score:</strong> ${leadScore || 'N/A'}/100</p>
        
        <h3>Profile Details</h3>
        <pre>${JSON.stringify(profile || {}, null, 2)}</pre>
        
        <h3>Queries</h3>
        <ul>${(queries || []).map((q: string) => `<li>${q}</li>`).join('')}</ul>
        
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations/${context.conversationId}">View Full Conversation</a></p>
      `,
    })

    return { success: true, message: 'Customer profile emailed successfully' }
  } catch (error) {
    return { success: false, message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

async function createTask(
  payload: any,
  context: { tenantId: string; agentId: string },
  supabase: any,
): Promise<ActionResult> {
  const { title, description, priority = 'medium', due_date } = payload

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      tenant_id: context.tenantId,
      agent_id: context.agentId,
      title,
      description,
      priority,
      due_date,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  return { success: true, message: `Task created: ${title}`, data }
}

async function updateCRM(
  payload: any,
  context: { tenantId: string; contactIdentifier: string },
  supabase: any,
): Promise<ActionResult> {
  const { field, value } = payload

  const { error } = await supabase
    .from('contacts')
    .upsert(
      {
        tenant_id: context.tenantId,
        identifier: context.contactIdentifier,
        [field]: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,identifier' },
    )

  if (error) throw error

  return { success: true, message: `CRM updated: ${field} = ${value}` }
}

async function sendNotification(
  payload: any,
  context: { tenantId: string; ownerEmail: string },
  supabase: any,
): Promise<ActionResult> {
  const { message, type = 'info' } = payload

  await supabase.from('notifications').insert({
    tenant_id: context.tenantId,
    type,
    title: 'Agent Notification',
    message,
    read: false,
  })

  return { success: true, message: 'Notification sent' }
}

async function scheduleCallback(
  payload: any,
  context: { tenantId: string; contactIdentifier: string },
  supabase: any,
): Promise<ActionResult> {
  const { preferred_time, notes } = payload

  const { data, error } = await supabase
    .from('callbacks')
    .insert({
      tenant_id: context.tenantId,
      contact_identifier: context.contactIdentifier,
      preferred_time,
      notes,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) throw error

  return { success: true, message: `Callback scheduled for ${preferred_time}`, data }
}

async function escalateToHuman(
  payload: any,
  context: { tenantId: string; conversationId: string; ownerEmail: string },
  supabase: any,
): Promise<ActionResult> {
  const { reason, priority = 'high' } = payload

  await supabase
    .from('conversations')
    .update({
      status: 'escalated',
      escalated_to: 'human',
      escalation_reason: reason,
    })
    .eq('id', context.conversationId)

  await resend.emails.send({
    from: 'LYCHO <alerts@lycho.ai>',
    to: context.ownerEmail,
    subject: `⚡ ESCALATION — Conversation needs human attention`,
    html: `
      <h2>Conversation Escalated</h2>
      <p><strong>Reason:</strong> ${reason}</p>
      <p><strong>Priority:</strong> ${priority}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/conversations/${context.conversationId}">View Conversation</a></p>
    `,
  })

  return { success: true, message: `Escalated to human: ${reason}` }
}

async function addToNewsletter(
  payload: any,
  context: { tenantId: string; contactIdentifier: string },
  supabase: any,
): Promise<ActionResult> {
  const { email, name } = payload

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      tenant_id: context.tenantId,
      email,
      name,
      source: 'whatsapp',
      subscribed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return { success: true, message: `Added to newsletter: ${email}` }
}

async function sendQuote(
  payload: any,
  context: { ownerEmail: string; contactIdentifier: string },
): Promise<ActionResult> {
  const { quote_details, customer_name } = payload

  await resend.emails.send({
    from: 'LYCHO <alerts@lycho.ai>',
    to: context.ownerEmail,
    subject: `Quote Request from ${customer_name || context.contactIdentifier}`,
    html: `
      <h2>Quote Request</h2>
      <p><strong>Customer:</strong> ${customer_name || context.contactIdentifier}</p>
      <h3>Details:</h3>
      <pre>${JSON.stringify(quote_details, null, 2)}</pre>
    `,
  })

  return { success: true, message: 'Quote request emailed' }
}

async function bookAppointment(
  payload: any,
  context: { tenantId: string; contactIdentifier: string },
  supabase: any,
): Promise<ActionResult> {
  const { appointment_type, preferred_date, preferred_time, notes } = payload

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: context.tenantId,
      contact_identifier: context.contactIdentifier,
      appointment_type,
      preferred_date,
      preferred_time,
      notes,
      status: 'pending_confirmation',
    })
    .select()
    .single()

  if (error) throw error

  return { success: true, message: `Appointment booked for ${preferred_date} at ${preferred_time}`, data }
}
