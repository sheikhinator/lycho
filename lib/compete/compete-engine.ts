import { admin } from '@/lib/admin'
import { getAIClient } from '@/lib/ai'

const supabaseAdmin = admin()

const openai = getAIClient()

export async function generateCompetitorBrief(
  tenantId: string,
  industry: string,
  country = 'PK'
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a competitive intelligence agent. Research the current competitive landscape for a ${industry} business in ${country}.

Find and report:
1. Top 3 competitors and their current positioning
2. Recent market changes in the last 30 days
3. One specific opportunity this business should act on now
4. One specific threat to watch

Be specific, actionable, current. Max 300 words.`,
    }],
  })

  const text = response.choices[0]?.message?.content || ''

  await supabaseAdmin.from('notifications').insert({
    tenant_id: tenantId,
    type:      'competitor_brief',
    title:     `Weekly Competitor Brief — ${industry}`,
    message:   text.slice(0, 200) + '...',
    read:      false,
  })

  return text
}
