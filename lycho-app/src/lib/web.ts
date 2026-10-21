// Web access straight from the phone — no server. Search uses DuckDuckGo's HTML page with Google News RSS as backup.
export type WebResult = { title: string; url: string; snippet: string; source?: string; published?: number }

const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36'

function decode(s: string) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ').trim()
}

async function get(url: string, ms = 15000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xml,*/*' } })
    if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
    return await res.text()
  } finally { clearTimeout(t) }
}

export async function newsSearch(q: string, limit = 10): Promise<WebResult[]> {
  const xml = await get(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`)
  const items = xml.split('<item>').slice(1)
  return items.slice(0, limit).map(it => {
    const pick = (tag: string) => (it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] ?? '').replace(/<!\[CDATA\[|\]\]>/g, '')
    const pub = Date.parse(pick('pubDate'))
    return { title: decode(pick('title')), url: decode(pick('link')), snippet: decode(pick('description')).slice(0, 300), source: decode(pick('source')), published: isNaN(pub) ? undefined : pub }
  }).filter(r => r.url)
}

export async function webSearch(q: string, limit = 8): Promise<WebResult[]> {
  try {
    const html = await get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`)
    const out: WebResult[] = []
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) && out.length < limit) {
      let url = m[1]
      const uddg = url.match(/uddg=([^&]+)/)
      if (uddg) url = decodeURIComponent(uddg[1])
      if (url.startsWith('//')) url = 'https:' + url
      if (/duckduckgo\.com\/y\.js/.test(url)) continue // ads
      out.push({ title: decode(m[2]), url, snippet: decode(m[3]) })
    }
    if (out.length) return out
  } catch { /* fall through */ }
  return newsSearch(q, limit)
}

/** Fetches a page and returns readable text. */
export async function readUrl(url: string, maxChars = 12000): Promise<{ title: string; text: string }> {
  const html = await get(url, 20000)
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url)
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|footer|header|aside|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h\d|li|tr|br|section|article)>/gi, '\n')
  const text = body.split('\n').map(decode).filter(l => l.length > 1).join('\n').replace(/\n{3,}/g, '\n\n')
  return { title, text: text.slice(0, maxChars) }
}
