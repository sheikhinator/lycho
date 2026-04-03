import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-master-secret') !== process.env.MASTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const errors: string[] = []
  let seeded = 0

  const demoTenants = [
    {
      business_name: 'Acme Trading Co.',
      business_email: 'demo@acme-trading.pk',
      business_phone: '+92 300 1234567',
      sector: 'E-commerce',
      country: 'PK',
      currency: 'PKR',
      plan_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      business_name: 'GreenLeaf Clinic',
      business_email: 'demo@greenleaf.pk',
      business_phone: '+92 321 7654321',
      sector: 'Healthcare',
      country: 'PK',
      currency: 'PKR',
      plan_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  for (const tenantData of demoTenants) {
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .upsert(tenantData, { onConflict: 'business_email' })
        .select()
        .single()

      if (tenantError) { errors.push(`${tenantData.business_name}: ${tenantError.message}`); continue }

      const { data: agents } = await supabase
        .from('agents')
        .insert([
          { tenant_id: tenant.id, agent_type: 'intake', display_name: 'Acme Intake Bot', status: 'active', channels: ['whatsapp', 'web_widget'], interactions_count: 142 },
          { tenant_id: tenant.id, agent_type: 'client', display_name: 'Client Relations', status: 'active', channels: ['email'], interactions_count: 87 },
          { tenant_id: tenant.id, agent_type: 'analyst', display_name: 'Performance Tracker', status: 'active', channels: ['web_widget'], interactions_count: 23 },
        ])
        .select()

      if (agents && agents.length > 0) {
        const convos = []
        const contactNames = ['Ahmed Khan', 'Sara Ali', 'Usman Malik', 'Fatima Noor', 'Bilal Ahmad', 'Ayesha Siddiqui', 'Hassan Raza', 'Zainab Tariq']
        const channels = ['whatsapp', 'email', 'web_widget']
        const statuses = ['open', 'resolved', 'escalated']
        const sentiments = ['positive', 'neutral', 'frustrated']

        for (let i = 0; i < 20; i++) {
          convos.push({
            tenant_id: tenant.id,
            agent_id: agents[i % agents.length].id,
            channel: channels[i % channels.length],
            contact_identifier: contactNames[i % contactNames.length],
            status: statuses[i % statuses.length],
            messages: [
              { role: 'user', content: 'Hi, I need help with my order', timestamp: new Date(Date.now() - (i * 3600000)).toISOString() },
              { role: 'assistant', content: 'Hello! I\'d be happy to help. Could you share your order number?', timestamp: new Date(Date.now() - (i * 3600000) + 5000).toISOString() },
            ],
            tokens_used: 284 + Math.floor(Math.random() * 200),
            metadata: {
              lead_score: 50 + Math.floor(Math.random() * 50),
              sentiment: sentiments[i % sentiments.length],
            },
            created_at: new Date(Date.now() - (i * 3600000)).toISOString(),
          })
        }

        await supabase.from('conversations').insert(convos)
      }

      seeded++
    } catch (e) {
      errors.push(`${tenantData.business_name}: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  return NextResponse.json({ seeded, total: demoTenants.length, errors })
}
