import { admin } from '@/lib/admin'

const supabase = admin()

export interface Workspace {
  id: string
  tenant_id: string
  name: string
  description?: string
  created_at: string
  member_count?: number
  agent_count?: number
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  email: string
  display_name?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
  last_active_at?: string
}

export async function createWorkspace(
  tenantId: string,
  name: string,
  description?: string
): Promise<Workspace> {
  const { data } = await supabase
    .from('workspaces')
    .insert({ tenant_id: tenantId, name, description })
    .select()
    .single()

  return data as Workspace
}

export async function listWorkspaces(tenantId: string): Promise<Workspace[]> {
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data || []) as Workspace[]
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  return data as Workspace | null
}

export async function updateWorkspace(
  id: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  await supabase.from('workspaces').update(updates).eq('id', id)
}

export async function deleteWorkspace(id: string): Promise<void> {
  await supabase.from('workspace_members').delete().eq('workspace_id', id)
  await supabase.from('workspace_agents').delete().eq('workspace_id', id)
  await supabase.from('workspaces').delete().eq('id', id)
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: WorkspaceMember['role'] = 'member'
): Promise<WorkspaceMember> {
  const { data } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, email, role })
    .select()
    .single()

  return data as WorkspaceMember
}

export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: false })

  return (data || []) as WorkspaceMember[]
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: WorkspaceMember['role']
): Promise<void> {
  await supabase
    .from('workspace_members')
    .update({ role })
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
}

export async function removeMember(workspaceId: string, memberId: string): Promise<void> {
  await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId)
}

export async function addAgentToWorkspace(
  workspaceId: string,
  agentId: string
): Promise<void> {
  await supabase
    .from('workspace_agents')
    .insert({ workspace_id: workspaceId, agent_id: agentId })
}

export async function listWorkspaceAgents(workspaceId: string): Promise<any[]> {
  const { data } = await supabase
    .from('workspace_agents')
    .select('*, agents(*)')
    .eq('workspace_id', workspaceId)

  return (data || []).map((d: any) => d.agents)
}
