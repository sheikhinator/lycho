export const PLAN_LIMITS: Record<string, { agents: number; interactions: number }> = {
  pending:    { agents: 0, interactions: 0 },
  trial:      { agents: 7, interactions: 999999 },
  starter:    { agents: 1, interactions: 1000 },
  growth:     { agents: 3, interactions: 10000 },
  business:   { agents: 7, interactions: 999999 },
  enterprise: { agents: 999, interactions: 999999 },
  expired:    { agents: 0, interactions: 0 },
}

export const canDeployAgent = (status: string, count: number) =>
  count < (PLAN_LIMITS[status]?.agents ?? 0)

export const canReceiveMessage = (status: string, monthly: number) =>
  monthly < (PLAN_LIMITS[status]?.interactions ?? 0)
