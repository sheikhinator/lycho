import { admin } from '@/lib/admin'

const supabase = admin()

export interface Backup {
  id: string
  tenant_id: string
  label: string
  type: 'full' | 'agents' | 'workflows' | 'knowledge'
  size_bytes: number
  status: 'creating' | 'completed' | 'failed' | 'restoring'
  metadata: {
    agent_count?: number
    workflow_count?: number
    conversation_count?: number
    knowledge_doc_count?: number
  }
  created_at: string
  restored_at?: string
}

export async function createBackup(
  tenantId: string,
  label: string,
  type: Backup['type'] = 'full'
): Promise<Backup> {
  const { data: backup } = await supabase
    .from('backups')
    .insert({
      tenant_id: tenantId,
      label,
      type,
      status: 'creating',
      metadata: {},
      size_bytes: 0,
    })
    .select()
    .single()

  const metadata: Backup['metadata'] = {}

  if (type === 'full' || type === 'agents') {
    const { count: agentCount } = await supabase
      .from('agents').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    metadata.agent_count = agentCount || 0
  }

  if (type === 'full' || type === 'workflows') {
    const { count: workflowCount } = await supabase
      .from('workflows').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    metadata.workflow_count = workflowCount || 0
  }

  if (type === 'full' || type === 'knowledge') {
    const { count: docCount } = await supabase
      .from('knowledge_docs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    metadata.knowledge_doc_count = docCount || 0
  }

  const snapshot = await captureSnapshot(tenantId, type)

  await supabase.from('backup_snapshots').insert({
    backup_id: backup.id,
    tenant_id: tenantId,
    snapshot,
    type,
  })

  const sizeBytes = new Blob([JSON.stringify(snapshot)]).size

  await supabase.from('backups').update({
    status: 'completed',
    metadata,
    size_bytes: sizeBytes,
  }).eq('id', backup.id)

  return { ...backup, metadata, size_bytes: sizeBytes } as Backup
}

export async function listBackups(tenantId: string): Promise<Backup[]> {
  const { data } = await supabase
    .from('backups')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data || []) as Backup[]
}

export async function restoreBackup(
  tenantId: string,
  backupId: string
): Promise<{ success: boolean; restored: string[]; errors: string[] }> {
  await supabase.from('backups').update({ status: 'restoring' }).eq('id', backupId)

  const { data: snapshot } = await supabase
    .from('backup_snapshots')
    .select('snapshot, type')
    .eq('backup_id', backupId)
    .single()

  if (!snapshot) {
    await supabase.from('backups').update({ status: 'failed' }).eq('id', backupId)
    return { success: false, restored: [], errors: ['No snapshot found'] }
  }

  const restored: string[] = []
  const errors: string[] = []
  const data = snapshot.snapshot as any

  if (data.agents) {
    for (const agent of data.agents) {
      const { error } = await supabase.from('agents').upsert({
        ...agent,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      })
      if (error) errors.push(`Agent ${agent.id}: ${error.message}`)
      else restored.push(`agent:${agent.id}`)
    }
  }

  if (data.marketplace_agents) {
    for (const agent of data.marketplace_agents) {
      const { error } = await supabase.from('marketplace_agents').upsert(agent)
      if (error) errors.push(`Marketplace agent ${agent.agent_type}: ${error.message}`)
      else restored.push(`marketplace:${agent.agent_type}`)
    }
  }

  if (data.workflows) {
    for (const workflow of data.workflows) {
      const { error } = await supabase.from('workflows').upsert({
        ...workflow,
        tenant_id: tenantId,
      })
      if (error) errors.push(`Workflow ${workflow.id}: ${error.message}`)
      else restored.push(`workflow:${workflow.id}`)
    }
  }

  await supabase.from('backups').update({
    status: 'completed',
    restored_at: new Date().toISOString(),
  }).eq('id', backupId)

  return {
    success: errors.length === 0,
    restored,
    errors,
  }
}

export async function deleteBackup(backupId: string): Promise<void> {
  await supabase.from('backup_snapshots').delete().eq('backup_id', backupId)
  await supabase.from('backups').delete().eq('id', backupId)
}

async function captureSnapshot(
  tenantId: string,
  type: string
): Promise<Record<string, any>> {
  const snapshot: Record<string, any> = {}

  if (type === 'full' || type === 'agents') {
    const { data: agents } = await supabase
      .from('agents').select('*').eq('tenant_id', tenantId)
    if (agents) snapshot.agents = agents

    const { data: marketplaceAgents } = await supabase
      .from('marketplace_agents').select('*')
    if (marketplaceAgents) snapshot.marketplace_agents = marketplaceAgents
  }

  if (type === 'full' || type === 'workflows') {
    const { data: workflows } = await supabase
      .from('workflows').select('*').eq('tenant_id', tenantId)
    if (workflows) snapshot.workflows = workflows
  }

  if (type === 'full' || type === 'knowledge') {
    const { data: docs } = await supabase
      .from('knowledge_docs').select('*').eq('tenant_id', tenantId)
    if (docs) snapshot.knowledge_docs = docs
  }

  return snapshot
}
