import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function processSensorData(
  tenantId: string, sensorType: string, data: any
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are LYCHO SENSE — an IoT intelligence agent. Analyse this sensor data and provide actionable insights.

Sensor type: ${sensorType}
Data: ${JSON.stringify(data)}

Provide a 2-3 sentence analysis with any alerts or recommendations. Be specific and actionable.`
    }]
  })

  const insight = response.content[0].type === 'text' ? response.content[0].text : ''

  await supabaseAdmin.from('sense_events').insert({
    tenant_id: tenantId,
    sensor_type: sensorType,
    data,
    insight,
    created_at: new Date().toISOString()
  })

  return insight
}

export async function getSenseHistory(tenantId: string): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('sense_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)
  return data || []
}
