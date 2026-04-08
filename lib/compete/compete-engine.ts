import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateCompetitorBrief(
  tenantId: string,
  industry: string,
  country = 'PK'
): Promise<string> {
  // web_search_20250305 is a beta tool not yet typed in the SDK — cast is intentional
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webSearchTool = { type: 'web_search_20250305', name: 'web_search' } as any

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    tools: [webSearchTool],
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

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')

  await supabaseAdmin.from('notifications').insert({
    tenant_id: tenantId,
    type:      'competitor_brief',
    title:     `Weekly Competitor Brief — ${industry}`,
    message:   text.slice(0, 200) + '...',
    read:      false,
  })

  return text
}
