const INJECTION_PATTERNS = [
  /ignore (all |previous |prior )?instructions/i,
  /system prompt/i,
  /you are now/i,
  /act as/i,
  /pretend (you are|to be)/i,
  /disregard/i,
  /override/i,
  /jailbreak/i,
]

export function sanitiseInput(input: string): { safe: boolean; cleaned: string } {
  const detected = INJECTION_PATTERNS.some(p => p.test(input))
  if (detected) return { safe: false, cleaned: '' }
  return { safe: true, cleaned: input.trim() }
}

export function sanitiseObject(obj: Record<string, unknown>): { safe: boolean; cleaned: Record<string, unknown> } {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const result = sanitiseInput(value)
      if (!result.safe) return { safe: false, cleaned: {} }
      cleaned[key] = result.cleaned
    } else {
      cleaned[key] = value
    }
  }
  return { safe: true, cleaned }
}
