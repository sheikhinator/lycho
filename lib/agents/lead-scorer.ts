// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateLeadScore(baseScore: number, metadata: any, messageCount: number): number {
  let score = baseScore || 50
  if (metadata?.lead_score) score = metadata.lead_score
  if (messageCount > 5)  score = Math.min(score + 10, 100)
  if (messageCount > 10) score = Math.min(score + 10, 100)
  return Math.max(0, Math.min(100, score))
}

export function getLeadLabel(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 75) return 'hot'
  if (score >= 45) return 'warm'
  return 'cold'
}
