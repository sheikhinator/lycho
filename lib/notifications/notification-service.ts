export type NotificationType =
  | 'hot_lead'
  | 'escalation'
  | 'agent_error'
  | 'payment_received'
  | 'trial_expiring'
  | 'new_conversation'

export interface Notification {
  id: string
  tenant_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

export async function createNotification(
  tenantId: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('notifications').insert({
    tenant_id: tenantId,
    type,
    title,
    message,
    link,
    read: false,
  })
}
