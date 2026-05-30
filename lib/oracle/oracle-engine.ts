import { createClient } from '@supabase/supabase-js'
import { getAIClient, getModel } from '@/lib/ai'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function getSupabaseAdmin() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function generatePrediction(tenantId: string): Promise<string> {
  const openai = getAIClient()
  const supabaseAdmin = getSupabaseAdmin()

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('business_name, sector, country, health_score, churn_risk_score')
    .eq('id', tenantId)
    .single()

  if (!tenant) return 'No tenant data found.'

  const completion = await openai.chat.completions.create({
    model: getModel('simple'),
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Given this business data, provide a brief predictive insight and recommendation. Return JSON only:
{"insight": "one-sentence prediction", "recommendation": "actionable advice", "confidence": "low|medium|high"}

Business: ${tenant.business_name}
Sector: ${tenant.sector}
Country: ${tenant.country}
Health Score: ${tenant.health_score}/100
Churn Risk: ${tenant.churn_risk_score}/100`,
    }],
  })

  const text = completion.choices[0]?.message?.content || ''
  const clean = text.replace(/```json|```/g, '').trim()
  return clean
}

export async function getDashboardPredictions(): Promise<{ insight: string; recommendation: string; confidence: string }[]> {
  const supabaseAdmin = getSupabaseAdmin()

  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('id, business_name, sector, health_score')
    .order('health_score', { ascending: true })
    .limit(5)

  if (!tenants?.length) return []

  const results: { insight: string; recommendation: string; confidence: string }[] = []
  for (const t of tenants) {
    const raw = await generatePrediction(t.id)
    try {
      const parsed = JSON.parse(raw)
      results.push({
        insight: parsed.insight || raw,
        recommendation: parsed.recommendation || '',
        confidence: parsed.confidence || 'low',
      })
    } catch {
      results.push({ insight: raw.slice(0, 200), recommendation: '', confidence: 'low' })
    }
  }
  return results
}
