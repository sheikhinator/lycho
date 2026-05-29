import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/api'
import { getAIClient } from '@/lib/ai'
import { admin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const supabaseAdmin = admin()
const openai = getAIClient()

export async function POST(request: Request) {
  const ctx = await getAuthContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ctx.tenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  let body: { scenario?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.scenario?.trim()) return NextResponse.json({ error: 'No scenario' }, { status: 400 })

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('business_name, sector, country')
    .eq('id', ctx.tenantId)
    .single()

  const { data: recentConvos } = await supabaseAdmin
    .from('conversations')
    .select('metadata')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .limit(20)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avgScore = recentConvos?.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? Math.round(recentConvos.reduce((s, c) => s + ((c.metadata as any)?.lead_score ?? 0), 0) / recentConvos.length)
    : 50

  const response = await openai.chat.completions.create({
    model: 'gemini-2.5-pro',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a business simulation engine for ${tenant?.business_name || 'a business'} in the ${tenant?.sector || 'general'} sector in ${tenant?.country || 'PK'}.

Current performance baseline:
- Average lead score: ${avgScore}/100
- Recent conversations: ${recentConvos?.length || 0}

SCENARIO TO SIMULATE: "${body.scenario}"

Analyse this scenario and provide:

**BEST CASE** (20% probability)
What happens if everything goes right

**MOST LIKELY** (60% probability)
What realistically happens

**WORST CASE** (20% probability)
What happens if things go wrong

**RECOMMENDATION**
One specific action to maximise the best case outcome

Be specific with numbers and timeframes. Ground in the actual business context.`,
    }],
  })

  const result = response.choices[0]?.message?.content || ''
  return NextResponse.json({ result, scenario: body.scenario })
}
