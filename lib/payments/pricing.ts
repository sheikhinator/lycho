export const PLANS = {
  starter:    { pkr_monthly: 9900,   pkr_annual: 7920,   usd_monthly: 35,  usd_annual: 28  },
  growth:     { pkr_monthly: 24900,  pkr_annual: 19920,  usd_monthly: 89,  usd_annual: 71  },
  business:   { pkr_monthly: 59900,  pkr_annual: 47920,  usd_monthly: 215, usd_annual: 172 },
  enterprise: { pkr_monthly: 120000, pkr_annual: 96000,  usd_monthly: 450, usd_annual: 360 },
}

export function calculateAmount(plan: string, billing_cycle: string, currency: string): number {
  const p = PLANS[plan as keyof typeof PLANS]
  if (!p) return 0
  const key = `${currency.toLowerCase()}_${billing_cycle}` as keyof typeof p
  return p[key] || 0
}

export const PLAN_FEATURES: Record<string, string[]> = {
  starter:    ['3 active agents', '1,000 conversations/month', 'WhatsApp + Email', 'Basic analytics'],
  growth:     ['10 active agents', '10,000 conversations/month', 'All channels', 'Advanced analytics', 'Agent version history'],
  business:   ['Unlimited agents', '100,000 conversations/month', 'All channels', 'Full audit log', 'Custom integrations', 'The Forge access', 'SLA guarantee'],
  enterprise: ['Everything in Business', 'Custom deployment', 'Dedicated support', 'Custom SLA', 'On-premise option'],
}
