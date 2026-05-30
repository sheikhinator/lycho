import { getAIClient, getModel } from '@/lib/ai'
import { getSystemPrompt } from '@/lib/agents/get-system-prompt'
import { admin } from '@/lib/admin'

const supabase = admin()
const openai = getAIClient()

export interface SwarmMember {
  agentType: string
  displayName: string
  analysis: string
  confidence: number
  vote: 'approve' | 'abstain' | 'reject'
}

export interface SwarmCouncilResult {
  query: string
  members: SwarmMember[]
  synthesis: string
  consensus: 'unanimous' | 'majority' | 'split' | 'deadlock'
  recommendations: string[]
  confidence: number
  duration: number
}

export async function conveneCouncil(
  query: string,
  tenantId: string,
  agentTypes?: string[]
): Promise<SwarmCouncilResult> {
  const start = Date.now()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const members = agentTypes || await selectCouncilMembers(query, tenant?.sector)

  const analyses = await Promise.all(
    members.map(agentType => analyzeAsMember(agentType, query, tenant))
  )

  const synthesis = await synthesizeCouncil(analyses, query)

  const votes = analyses.map(a => ({
    agentType: a.agentType,
    displayName: a.displayName,
    analysis: a.analysis,
    confidence: a.confidence,
    vote: a.vote as 'approve' | 'abstain' | 'reject'
  }))

  const approvals = votes.filter(v => v.vote === 'approve').length
  const rejections = votes.filter(v => v.vote === 'reject').length
  const total = votes.length

  let consensus: SwarmCouncilResult['consensus'] = 'split'
  if (approvals === total) consensus = 'unanimous'
  else if (approvals > total / 2) consensus = 'majority'
  else if (rejections > total / 2) consensus = 'deadlock'

  const avgConfidence = Math.round(
    votes.reduce((s, v) => s + v.confidence, 0) / total
  )

  const recommendations = extractRecommendations(synthesis)

  await supabase.from('swarm_council_logs').insert({
    tenant_id: tenantId,
    query,
    members: votes,
    synthesis,
    consensus,
    confidence: avgConfidence,
    duration_ms: Date.now() - start,
  })

  return {
    query,
    members: votes,
    synthesis,
    consensus,
    recommendations,
    confidence: avgConfidence,
    duration: Date.now() - start,
  }
}

async function selectCouncilMembers(
  query: string,
  sector?: string
): Promise<string[]> {
  const sectorMap: Record<string, string[]> = {
    sales: ['lead_qualifier', 'sales_closer', 'market_researcher', 'competitive_handler', 'proposal_agent'],
    service: ['complaint_handler', 'ticket_triage', 'proactive_support', 'csat_improver', 'service_recovery'],
    healthcare: ['patient_intake', 'medical_followup', 'health_screener', 'chronic_care', 'wellness_coach'],
    legal: ['legal_intake', 'contract_reviewer', 'legal_researcher', 'compliance_checker', 'gdpr_agent'],
    finance: ['financial_advisor', 'tax_assistant', 'budget_tracker', 'cashflow_agent', 'fraud_detection'],
    education: ['student_admissions', 'course_advisor', 'career_counsellor', 'learning_coach', 'research_support'],
    technology: ['it_helpdesk', 'cybersecurity_agent', 'cloud_support', 'api_support', 'startup_advisor'],
    ecommerce: ['product_advisor', 'cart_abandonment', 'order_tracking', 'review_collector', 'subscription_retail'],
    realestate: ['property_enquiry', 'property_valuation', 'rental_manager', 'mortgage_enquiry', 'property_management'],
    hr: ['recruitment_screener', 'performance_coach', 'benefits_agent', 'training_coordinator', 'succession_planning'],
    hospitality: ['restaurant_booking', 'hotel_concierge', 'event_coordinator', 'travel_concierge', 'vip_guest'],
    logistics: ['shipment_coordinator', 'customs_agent', 'warehouse_agent', 'route_optimizer', 'inventory_manager'],
    construction: ['project_enquiry', 'quantity_surveyor', 'planning_permission', 'site_safety', 'materials_agent'],
    automotive: ['vehicle_service', 'car_sales', 'breakdown_agent', 'electric_vehicle', 'accident_management'],
    insurance: ['claims_handler', 'policy_advisor', 'renewal_agent', 'fraud_detection', 'underwriting_support'],
  }

  return sectorMap[sector?.toLowerCase() || ''] || ['research', 'analyst', 'operations', 'compliance', 'client']
}

async function analyzeAsMember(
  agentType: string,
  query: string,
  tenant: any
): Promise<SwarmMember> {
  try {
    const { prompt } = await getSystemPrompt(agentType, supabase, tenant, null, null)
    const response = await openai.chat.completions.create({
      model: getModel('complex'),
      max_tokens: 500,
      messages: [
        { role: 'system', content: `${prompt}\n\nYou are part of the SWARM COUNCIL. Analyze the query from your specialist perspective. Provide your analysis, confidence (0-100), and vote (approve/abstain/reject).` },
        { role: 'user', content: `SWARM COUNCIL QUERY: ${query}\n\nProvide your specialist analysis.` }
      ]
    })

    const text = response.choices[0]?.message?.content || ''
    return {
      agentType,
      displayName: agentType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      analysis: text,
      confidence: extractConfidence(text),
      vote: extractVote(text),
    }
  } catch {
    return {
      agentType,
      displayName: agentType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      analysis: 'Unable to provide analysis at this time.',
      confidence: 0,
      vote: 'abstain',
    }
  }
}

async function synthesizeCouncil(
  analyses: SwarmMember[],
  query: string
): Promise<string> {
  const memberInputs = analyses
    .map(a => `${a.displayName} (confidence: ${a.confidence}, vote: ${a.vote}):\n${a.analysis}`)
    .join('\n\n---\n\n')

  const response = await openai.chat.completions.create({
    model: getModel('complex'),
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are the SWARM COUNCIL SYNTHESIZER. Synthesize the following specialist analyses into a unified response.

QUERY: ${query}

COUNCIL MEMBER ANALYSES:
${memberInputs}

Provide a synthesis that:
1. Summarizes the key insights from all members
2. Highlights areas of agreement and disagreement
3. Provides a final unified recommendation
4. If there is deadlock, explain the disagreement and suggest next steps`
    }]
  })

  return response.choices[0]?.message?.content || 'Council could not reach a synthesis.'
}

function extractConfidence(text: string): number {
  const match = text.match(/(?:confidence|score)[:\s]*(\d{1,3})/i)
  if (match) return Math.min(100, Math.max(0, parseInt(match[1])))
  const vote = extractVote(text)
  if (vote === 'approve') return 75
  if (vote === 'abstain') return 50
  return 30
}

function extractVote(text: string): 'approve' | 'abstain' | 'reject' {
  const lower = text.toLowerCase()
  if (lower.includes('vote: approve') || lower.includes('i approve') || lower.includes('recommend proceed')) return 'approve'
  if (lower.includes('vote: reject') || lower.includes('i reject') || lower.includes('recommend against')) return 'reject'
  return 'abstain'
}

function extractRecommendations(synthesis: string): string[] {
  const lines = synthesis.split('\n')
  const recommendations: string[] = []
  let inRecs = false
  for (const line of lines) {
    if (/recommend(ation|ed|)|next steps?|action items?|proposed/i.test(line) && !inRecs) {
      inRecs = true
      continue
    }
    if (inRecs && /^\s*[-*\d.]/.test(line)) {
      recommendations.push(line.replace(/^\s*[-*\d.]+\s*/, '').trim())
    }
    if (inRecs && recommendations.length > 0 && !line.trim()) {
      inRecs = false
    }
  }
  return recommendations
}
