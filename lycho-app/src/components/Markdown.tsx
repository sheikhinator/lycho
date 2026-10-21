import React from 'react'
import { Text, View, type TextStyle } from 'react-native'
import { C, F, R } from '@/theme'

// Lightweight markdown for AI replies: headings, lists, quotes, code blocks, bold/italic/inline code.
const base: TextStyle = { color: C.ivory, fontFamily: F.sans, fontSize: 15, lineHeight: 22 }

function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**') || tok.startsWith('__')) out.push(<Text key={`${key}b${i}`} style={{ fontFamily: F.sansBold }}>{tok.slice(2, -2)}</Text>)
    else if (tok.startsWith('`')) out.push(<Text key={`${key}c${i}`} style={{ fontFamily: F.mono, fontSize: 13.5, color: C.pulse, backgroundColor: C.surface }}>{` ${tok.slice(1, -1)} `}</Text>)
    else out.push(<Text key={`${key}i${i}`} style={{ fontStyle: 'italic' }}>{tok.slice(1, -1)}</Text>)
    last = m.index + tok.length
    i++
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ text, color }: { text: string; color?: string }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let k = 0
  const t = color ? { ...base, color } : base
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3)
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      i++
      blocks.push(
        <View key={k++} style={{ backgroundColor: C.void, borderColor: C.border, borderWidth: 1, borderRadius: R.md, padding: 12, marginVertical: 6 }}>
          {lang ? <Text style={{ color: C.muted, fontFamily: F.mono, fontSize: 10, marginBottom: 6, textTransform: 'uppercase' }}>{lang}</Text> : null}
          <Text selectable style={{ color: C.ivory, fontFamily: F.mono, fontSize: 12.5, lineHeight: 18 }}>{code.join('\n')}</Text>
        </View>,
      )
      continue
    }
    const h = line.match(/^(#{1,4})\s+(.*)/)
    if (h) {
      const size = [24, 20, 17, 15][h[1].length - 1]
      blocks.push(
        <Text key={k++} style={{ color: C.gold, fontFamily: h[1].length <= 2 ? F.display : F.sansBold, fontSize: h[1].length <= 2 ? size + 4 : size, letterSpacing: h[1].length <= 2 ? 0.8 : 0, marginTop: 10, marginBottom: 2 }}>
          {inline(h[2], `h${k}`)}
        </Text>,
      )
      i++
      continue
    }
    const li = line.match(/^(\s*)([-*•]|\d+[.)])\s+(.*)/)
    if (li) {
      const indent = Math.min(3, Math.floor(li[1].length / 2))
      const bullet = /\d/.test(li[2]) ? li[2] : '•'
      blocks.push(
        <View key={k++} style={{ flexDirection: 'row', paddingLeft: 4 + indent * 14, marginVertical: 1.5 }}>
          <Text style={[t, { color: C.gold, width: /\d/.test(bullet) ? 24 : 16 }]}>{bullet}</Text>
          <Text selectable style={[t, { flex: 1 }]}>{inline(li[3], `l${k}`)}</Text>
        </View>,
      )
      i++
      continue
    }
    if (line.startsWith('>')) {
      blocks.push(
        <View key={k++} style={{ borderLeftWidth: 2, borderLeftColor: C.gold, paddingLeft: 10, marginVertical: 4 }}>
          <Text selectable style={[t, { color: C.soft, fontStyle: 'italic' }]}>{inline(line.replace(/^>\s?/, ''), `q${k}`)}</Text>
        </View>,
      )
      i++
      continue
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<View key={k++} style={{ height: 1, backgroundColor: C.border, marginVertical: 10 }} />)
      i++
      continue
    }
    if (!line.trim()) { blocks.push(<View key={k++} style={{ height: 6 }} />); i++; continue }
    blocks.push(<Text key={k++} selectable style={t}>{inline(line, `p${k}`)}</Text>)
    i++
  }
  return <View>{blocks}</View>
}
