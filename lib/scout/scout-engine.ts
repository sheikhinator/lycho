import { getAIClient } from '@/lib/ai'
import { admin } from '@/lib/admin'

const supabaseAdmin = admin()

const openai = getAIClient()

async function scoutWithSearch(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gemini-2.0-flash',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  })
  return response.choices[0]?.message?.content || ''
}

export async function runMarketScout(): Promise<string> {
  return scoutWithSearch(`You are LYCHO's Market Scout. Search for the most important business and AI news from the last 48 hours. Focus on: new AI agent capabilities, business automation trends, regulatory changes. Return a structured brief of the 5 most important developments. Be specific and actionable.`)
}

export async function runRegulatoryScout(): Promise<string> {
  return scoutWithSearch(`You are LYCHO's Regulatory Scout. Search for any regulatory or legal changes in the last 7 days affecting businesses in Pakistan, UAE, Saudi Arabia, UK, and USA. Focus on: tax changes, business law updates, AI regulations, data privacy rules. Return structured findings by country.`)
}

export async function runCompetitorScout(): Promise<string> {
  return scoutWithSearch(`You are LYCHO's Competitor Scout. Research the latest developments from these AI agent platforms: OpenClaw, Dify, n8n, Intercom, Salesforce Agentforce. What new features did they launch? What are users complaining about? What gaps exist? Return a brief with opportunities for LYCHO.`)
}

export async function runTrendScout(): Promise<string> {
  return scoutWithSearch(`You are LYCHO's Trend Scout. Search Reddit, LinkedIn, and tech forums for emerging business pain points that AI agents could solve. What problems are businesses complaining about right now? What automation needs are unmet? Return the top 5 emerging needs with suggested agent types LYCHO should build.`)
}

export async function runKnowledgeScout(): Promise<string> {
  return scoutWithSearch(`You are LYCHO's Knowledge Scout. Find the most important AI agent research papers, GitHub releases, and technical breakthroughs from the last 7 days. What new techniques could improve LYCHO's agents? Return top 3 findings with implementation suggestions.`)
}

export async function runAllScouts(): Promise<{
  market: string; regulatory: string; competitor: string; trend: string; knowledge: string
}> {
  console.log('[SCOUT] Starting all scouts...')
  const [market, regulatory, competitor, trend, knowledge] = await Promise.allSettled([
    runMarketScout(), runRegulatoryScout(), runCompetitorScout(), runTrendScout(), runKnowledgeScout()
  ])
  const results = {
    market:     market.status     === 'fulfilled' ? market.value     : 'Scout failed',
    regulatory: regulatory.status === 'fulfilled' ? regulatory.value : 'Scout failed',
    competitor: competitor.status === 'fulfilled' ? competitor.value : 'Scout failed',
    trend:      trend.status      === 'fulfilled' ? trend.value      : 'Scout failed',
    knowledge:  knowledge.status  === 'fulfilled' ? knowledge.value  : 'Scout failed',
  }
  await supabaseAdmin.from('scout_reports').upsert({
    id: 'latest',
    market_brief: results.market, regulatory_brief: results.regulatory,
    competitor_brief: results.competitor, trend_brief: results.trend,
    knowledge_brief: results.knowledge, created_at: new Date().toISOString()
  }, { onConflict: 'id' })

  await supabaseAdmin.from('orion_forge_briefs').insert({
    quality_directives: `SCOUT INTELLIGENCE BRIEF:\n\nMARKET: ${results.market.slice(0, 300)}\n\nCOMPETITOR GAPS: ${results.competitor.slice(0, 300)}\n\nEMERGING TRENDS: ${results.trend.slice(0, 300)}`,
    status: 'pending'
  })
  console.log('[SCOUT] Complete. Forge brief updated.')
  return results
}
