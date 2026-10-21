import React, { useCallback, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Logo } from '@/components/Logo'
import { Badge, Card, Icon, Label, Row, Screen, Stat, T, tap } from '@/components/ui'
import { MODULES } from '@/data/modules'
import { configuredProviders, type ProviderId } from '@/lib/vault'
import { PROVIDER_INFO } from '@/lib/ai/providers'
import { createConversation, dashboardStats, listConversations, type Conversation } from '@/lib/store'
import { useSession } from '@/lib/session'
import { C, F, R, S } from '@/theme'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Command() {
  const { user } = useSession()
  const [stats, setStats] = useState<Awaited<ReturnType<typeof dashboardStats>> | null>(null)
  const [recent, setRecent] = useState<Conversation[]>([])
  const [keys, setKeys] = useState<ProviderId[]>([])
  const [ask, setAsk] = useState('')

  useFocusEffect(useCallback(() => {
    if (!user) return
    void dashboardStats(user.id).then(setStats)
    void listConversations(user.id).then(c => setRecent(c.slice(0, 3)))
    void configuredProviders().then(setKeys)
  }, [user]))

  const go = async () => {
    if (!ask.trim() || !user) return
    const id = await createConversation(user.id, 'lycho_prime')
    const q = ask.trim()
    setAsk('')
    router.push({ pathname: '/chat/[id]', params: { id, q } })
  }

  const live = MODULES.filter(m => m.phase === 1)
  const next = MODULES.filter(m => m.phase > 1)

  return (
    <Screen scroll>
      <Row style={{ paddingTop: S.lg, paddingBottom: S.lg }}>
        <Logo size={36} />
        <View style={{ marginLeft: S.md, flex: 1 }}>
          <Text style={{ color: C.soft, fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>{greeting()}</Text>
          <Text style={{ color: C.ivory, fontFamily: F.display, fontSize: 30, letterSpacing: 1 }}>{user?.name?.split(' ')[0]?.toUpperCase()}</Text>
        </View>
        {user?.role === 'master' ? <Pressable onPress={() => { tap(); router.push('/master') }} hitSlop={10}><Icon name="shield" color={C.gold} size={22} /></Pressable> : null}
      </Row>

      <Card gold>
        <Label style={{ color: C.gold }}>Ask LYCHO Prime</Label>
        <TextInput
          value={ask} onChangeText={setAsk} onSubmitEditing={go} returnKeyType="send"
          placeholder="Plan, analyse, write, decide…" placeholderTextColor={C.muted}
          selectionColor={C.gold} cursorColor={C.gold}
          style={{ color: C.ivory, fontFamily: F.serif, fontSize: 20, paddingVertical: S.sm }}
        />
        <Row style={{ justifyContent: 'space-between' }}>
          <T muted style={{ fontSize: 12 }}>Routed to the best model automatically</T>
          <Pressable onPress={go} style={{ backgroundColor: C.gold, borderRadius: R.pill, padding: 8 }}><Icon name="arrow-up" color={C.void} size={18} /></Pressable>
        </Row>
      </Card>

      {keys.length === 0 ? (
        <Card onPress={() => router.push('/keys')} style={{ marginTop: S.md, borderColor: C.amber + '66' }}>
          <Row><Icon name="key" color={C.amber} /><T style={{ marginLeft: S.sm, flex: 1 }}>Add a Gemini, Groq or OpenRouter key to wake your agents.</T><Icon name="chevron-right" color={C.muted} /></Row>
        </Card>
      ) : (
        <Row style={{ marginTop: S.md, gap: 6, flexWrap: 'wrap' }}>
          {(['gemini', 'groq', 'openrouter'] as ProviderId[]).map(p => (
            <Badge key={p} label={`${PROVIDER_INFO[p].name} ${keys.includes(p) ? '● on' : '○ off'}`} tone={keys.includes(p) ? 'green' : 'muted'} />
          ))}
        </Row>
      )}

      <Row style={{ gap: S.sm, marginTop: S.lg }}>
        <Stat value={stats?.agents ?? '—'} label="Agents" />
        <Stat value={stats?.conversations ?? '—'} label="Chats" />
        <Stat value={stats?.repliesToday ?? '—'} label="Replies today" />
      </Row>

      {recent.length ? (
        <View style={{ marginTop: S.xl }}>
          <Label style={{ marginBottom: S.sm }}>Recent</Label>
          {recent.map(c => (
            <Card key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={{ marginBottom: S.sm, paddingVertical: S.md }}>
              <Text style={{ color: C.ivory, fontFamily: F.sansMedium, fontSize: 15 }} numberOfLines={1}>{c.title}</Text>
              <T muted numberOfLines={1} style={{ fontSize: 12.5 }}>{c.agent_name} · {c.last ?? ''}</T>
            </Card>
          ))}
        </View>
      ) : null}

      <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>Live now</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
        {live.map(m => (
          <Card key={m.id} onPress={() => m.route && router.push(m.route as any)} style={{ width: '48.5%', padding: S.md }}>
            <Icon name={m.icon} color={C.gold} />
            <Text style={{ color: C.ivory, fontFamily: F.sansBold, fontSize: 14, marginTop: S.sm }}>{m.name}</Text>
            <T muted style={{ fontSize: 12, lineHeight: 16 }}>{m.desc}</T>
          </Card>
        ))}
      </View>

      <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>Being built</Label>
      <Card style={{ padding: 0 }}>
        {next.map((m, i) => (
          <Row key={m.id} style={{ paddingHorizontal: S.md, paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: C.border }}>
            <Icon name={m.icon} size={16} color={C.muted} />
            <View style={{ flex: 1, marginLeft: S.md }}>
              <Text style={{ color: C.ivory, fontFamily: F.sansMedium, fontSize: 14 }}>{m.name}</Text>
              <T muted style={{ fontSize: 12, lineHeight: 16 }}>{m.desc}</T>
            </View>
            <Badge label={`Phase ${m.phase}`} tone="muted" />
          </Row>
        ))}
      </Card>
    </Screen>
  )
}
