import { admin } from '@/lib/admin'

const supabase = admin()

export interface CustomerPortal {
  id: string
  tenant_id: string
  name: string
  subdomain: string
  agents: string[]
  custom_domain?: string
  primary_color?: string
  logo_url?: string
  welcome_message?: string
  active: boolean
  visitor_count: number
  created_at: string
}

export async function createPortal(
  tenantId: string,
  data: { name: string; subdomain: string; agentTypes: string[] }
): Promise<CustomerPortal> {
  const { data: portal } = await supabase
    .from('customer_portals')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      subdomain: data.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      agents: data.agentTypes,
      active: true,
    })
    .select()
    .single()

  return portal as CustomerPortal
}

export async function listPortals(tenantId: string): Promise<CustomerPortal[]> {
  const { data } = await supabase
    .from('customer_portals')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (data || []) as CustomerPortal[]
}

export async function getPortal(subdomain: string): Promise<CustomerPortal | null> {
  const { data } = await supabase
    .from('customer_portals')
    .select('*')
    .eq('subdomain', subdomain)
    .eq('active', true)
    .single()

  return data as CustomerPortal | null
}

export async function updatePortal(
  id: string,
  updates: Partial<CustomerPortal>
): Promise<void> {
  await supabase.from('customer_portals').update(updates).eq('id', id)
}

export async function trackPortalVisit(subdomain: string): Promise<void> {
  await supabase.rpc('increment_portal_visits', { portal_subdomain: subdomain })
}
