import { lookup } from 'dns/promises'

// ─── SSRF protection ──────────────────────────────────────────────────────────
// Blocks requests to private/internal IP ranges, loopback, link-local, and
// cloud metadata endpoints to prevent Server-Side Request Forgery attacks.

const PRIVATE_RANGES = [
  // IPv4 private + special ranges
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^127\.\d+\.\d+\.\d+$/,          // loopback
  /^169\.254\.\d+\.\d+$/,          // link-local (AWS metadata: 169.254.169.254)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+$/, // CGNAT
  /^0\.0\.0\.0$/,
  /^::1$/,                          // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,              // IPv6 unique local
  /^fd[0-9a-f]{2}:/i,              // IPv6 unique local
  /^fe80:/i,                        // IPv6 link-local
]

function isPrivateIp(ip: string): boolean {
  return PRIVATE_RANGES.some(re => re.test(ip))
}

/**
 * Returns true if the URL resolves to a private/internal address or uses a
 * non-https scheme — meaning the request should be blocked.
 */
export async function isPrivateUrl(rawUrl: unknown): Promise<boolean> {
  if (typeof rawUrl !== 'string') return true

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return true // Unparseable URL — block it
  }

  // Only allow HTTPS outbound webhook calls
  if (parsed.protocol !== 'https:') return true

  const host = parsed.hostname

  // Check if the hostname is already a raw IP
  if (isPrivateIp(host)) return true

  // Resolve hostname and check each resolved address
  try {
    const addresses = await lookup(host, { all: true })
    for (const { address } of addresses) {
      if (isPrivateIp(address)) return true
    }
  } catch {
    // DNS resolution failure — block to fail closed
    return true
  }

  return false
}
