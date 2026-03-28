/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MemoryNode {
  timestamp:   string
  type:        'interaction' | 'purchase' | 'complaint' | 'compliment' | 'referral' | 'appointment'
  summary:     string
  sentiment:   string
  value_pkr?:  number
  agent_type?: string
  channel?:    string
}

export interface ContactMemory {
  contact_identifier: string
  contact_name?:      string
  profile: {
    name?:               string
    email?:              string
    phone?:              string
    company?:            string
    role?:               string
    location?:           string
    language?:           string
    specific_need?:      string
    budget_signal?:      string
    decision_authority?: string
    timeline?:           string
  }
  memory_nodes:        MemoryNode[]
  relationship_score:  number
  total_interactions:  number
  total_value_pkr:     number
  first_seen_at:       string
  last_seen_at:        string
}

export async function getContactMemory(
  tenantId: string,
  contactIdentifier: string,
  supabase: any,
): Promise<ContactMemory | null> {
  try {
    const { data } = await supabase
      .from('contact_memory')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('contact_identifier', contactIdentifier)
      .single()
    return data ?? null
  } catch {
    return null
  }
}

export async function updateContactMemory(
  tenantId: string,
  contactIdentifier: string,
  update: Partial<ContactMemory>,
  newNode?: MemoryNode,
  supabase?: any,
): Promise<void> {
  if (!supabase) return
  try {
    const existing = await getContactMemory(tenantId, contactIdentifier, supabase)
    const nodes: MemoryNode[] = existing?.memory_nodes ?? []
    if (newNode) nodes.push(newNode)
    const trimmedNodes = nodes.slice(-100)

    // Compute relationship score delta from sentiment
    const sentimentDelta: Record<string, number> = {
      positive: 3, excited: 5, satisfied: 4, grateful: 4,
      neutral: 0, uncertain: -1, frustrated: -3, angry: -5,
    }
    const sentiment = newNode?.sentiment ?? 'neutral'
    const scoreDelta = sentimentDelta[sentiment] ?? 0
    const baseScore = existing?.relationship_score ?? 50
    const newScore = Math.max(0, Math.min(100, (update.relationship_score ?? baseScore) + scoreDelta))

    const record = {
      tenant_id:           tenantId,
      contact_identifier:  contactIdentifier,
      contact_name:        update.contact_name ?? existing?.contact_name ?? null,
      profile:             { ...(existing?.profile ?? {}), ...(update.profile ?? {}) },
      memory_nodes:        trimmedNodes,
      relationship_score:  newScore,
      total_interactions:  (existing?.total_interactions ?? 0) + 1,
      total_value_pkr:     (existing?.total_value_pkr ?? 0) + (update.total_value_pkr ?? 0),
      last_seen_at:        new Date().toISOString(),
    }

    await supabase
      .from('contact_memory')
      .upsert(record, { onConflict: 'tenant_id,contact_identifier' })
  } catch {
    // Non-fatal — memory update failure should never break conversations
  }
}

export function buildMemoryContext(memory: ContactMemory | null): string {
  if (!memory || memory.total_interactions === 0) return ''

  const recentNodes = memory.memory_nodes.slice(-5)
  const recentSummary = recentNodes
    .map(n => `  - [${n.type}] ${n.summary} (${n.sentiment})`)
    .join('\n')

  return `RETURNING CONTACT — ${memory.total_interactions} previous interaction${memory.total_interactions !== 1 ? 's' : ''}
Name: ${memory.profile.name || 'Unknown'}
Relationship Score: ${memory.relationship_score}/100
Total Value: PKR ${memory.total_value_pkr.toLocaleString()}
First Seen: ${new Date(memory.first_seen_at).toLocaleDateString()}
Recent History:
${recentSummary || '  No recent interactions recorded'}
Profile: ${JSON.stringify(memory.profile)}`
}
