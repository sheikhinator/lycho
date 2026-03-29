// ─── Prompt injection patterns ────────────────────────────────────────────────
// Covers common jailbreak/injection vectors.  Input is NFKC-normalised before
// matching so unicode homoglyphs and ligatures don't bypass the filter.

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+|previous\s+|prior\s+)?instructions/i,
  /system\s+prompt/i,
  /you\s+are\s+now/i,
  /\bact\s+as\b/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /\bdisregard\b/i,
  /\boverride\b/i,
  /\bjailbreak\b/i,
  /\bforget\s+(all\s+|your\s+|previous\s+)?instructions/i,
  /\bnew\s+persona\b/i,
  /\bdeveloper\s+mode\b/i,
  /\brespond\s+as\b/i,
  /\broleplay\s+as\b/i,
  /\bhypothetically\s+(speaking\s+)?you\b/i,
  /\bsimulate\s+(being|an?\s+ai)/i,
  /\bfrom\s+now\s+on\b/i,
  /\bDAN\b/,                          // "Do Anything Now" jailbreak
  /\bunlimited\s+(mode|access)\b/i,
  /no\s+restrictions/i,
  /without\s+any\s+(guidelines|restrictions|rules)/i,
  /\[\s*INST\s*\]/i,                  // LLaMA instruction tokens
  /<\|system\|>/i,                    // Mistral/Falcon special tokens
  /<\/?(system|assistant|user)>/i,    // Chat-template injection
  /\{\{.*\}\}/,                       // Template injection (e.g. {{7*7}})
]

export function sanitiseInput(input: string): { safe: boolean; cleaned: string } {
  // NFKC normalization collapses unicode homoglyphs / ligatures before matching
  const normalised = input.normalize('NFKC')
  const detected = INJECTION_PATTERNS.some(p => p.test(normalised))
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
