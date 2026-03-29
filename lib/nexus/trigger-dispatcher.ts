/* eslint-disable @typescript-eslint/no-explicit-any */
import { executeAutomation, type TriggerType } from './automation-engine'

export async function dispatchTrigger(
  tenantId: string,
  triggerType: TriggerType,
  triggerData: Record<string, any>,
  supabase: any,
): Promise<void> {
  // Fetch active automations matching this trigger_type (indexed column — fast)
  const { data: automations } = await supabase
    .from('automations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .eq('trigger_type', triggerType)

  if (!automations?.length) return

  const matching = automations.filter((a: any) => {
    const config  = a.trigger_config as any
    const filters = config?.filters

    if (!filters) return true

    if (filters.lead_score_min != null && (triggerData.lead_score ?? 0) < filters.lead_score_min) return false
    if (filters.lead_score_max != null && (triggerData.lead_score ?? 0) > filters.lead_score_max) return false
    if (filters.sentiment  && triggerData.sentiment  !== filters.sentiment)  return false
    if (filters.agent_id   && triggerData.agent_id   !== filters.agent_id)   return false
    if (filters.channel    && triggerData.channel    !== filters.channel)    return false

    return true
  })

  if (!matching.length) return

  // Execute all matching automations in parallel (fire-and-forget)
  await Promise.allSettled(
    matching.map((a: any) =>
      executeAutomation(
        {
          id:          a.id,
          tenant_id:   a.tenant_id,
          name:        a.name,
          trigger:     { type: triggerType, filters: (a.trigger_config as any)?.filters },
          steps:       (a.action_config as any)?.steps ?? [],
          status:      a.status,
          run_count:   a.run_count ?? 0,
          last_run_at: a.last_run_at ?? undefined,
          created_at:  a.created_at,
        },
        { ...triggerData, event_type: triggerType },
        supabase,
      ),
    ),
  )
}
