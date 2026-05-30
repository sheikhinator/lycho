import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function recordTransaction(
  tenantId: string, fromAgent: string, toAgent: string,
  amountPkr: number, description: string
): Promise<void> {
  await supabaseAdmin.from('economy_transactions').insert({
    tenant_id: tenantId,
    transaction_type: 'agent_payment',
    from_agent: fromAgent,
    to_agent: toAgent,
    amount_pkr: amountPkr,
    description
  })

  await supabaseAdmin.from('agent_wallets').upsert({
    agent_type: toAgent,
    balance_pkr: amountPkr,
    total_earned_pkr: amountPkr,
    transactions: 1
  }, { onConflict: 'agent_type' })
}

export async function getEconomyStats(tenantId: string): Promise<any> {
  const { data: transactions } = await supabaseAdmin
    .from('economy_transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: wallets } = await supabaseAdmin
    .from('agent_wallets')
    .select('*')
    .order('total_earned_pkr', { ascending: false })
    .limit(10)

  const totalVolume = transactions?.reduce((s, t) => s + (t.amount_pkr || 0), 0) || 0

  return { transactions: transactions || [], wallets: wallets || [], totalVolume }
}
