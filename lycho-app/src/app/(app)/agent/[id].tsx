import React, { useCallback, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { Badge, Btn, Card, Header, Icon, Label, Row, Screen, T, tap } from '@/components/ui'
import { createConversation, deleteAgent, getAgent, listConversations, toggleFavorite, type Agent, type Conversation } from '@/lib/store'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function AgentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useSession()
  const [a, setA] = useState<Agent | null>(null)
  const [chats, setChats] = useState<Conversation[]>([])
  const [showPrompt, setShowPrompt] = useState(false)

  const load = useCallback(() => {
    void getAgent(id).then(setA)
    if (user) void listConversations(user.id).then(c => setChats(c.filter(x => x.agent_id === id).slice(0, 5)))
  }, [id, user])
  useFocusEffect(load)

  if (!a) return <Screen><Header back title="Agent" /></Screen>

  const start = async () => {
    const cid = await createConversation(user!.id, a.id)
    router.replace({ pathname: '/chat/[id]', params: { id: cid } })
  }

  return (
    <Screen scroll>
      <Header back kicker={a.sector} title={a.name} right={
        <Pressable hitSlop={12} onPress={async () => { tap(); await toggleFavorite(a.id); load() }}>
          <Icon name="star" size={22} color={a.favorite ? C.gold : C.muted} />
        </Pressable>
      } />
      <Row style={{ gap: 6, marginBottom: S.md }}>
        <Badge label={a.source} tone={a.source === 'core' ? 'gold' : a.source === 'catalogue' ? 'muted' : 'green'} />
        {a.tier ? <Badge label={`${a.tier} tier`} tone="amber" /> : <Badge label="auto tier" tone="muted" />}
        <Badge label={`${a.uses} chats`} tone="muted" />
      </Row>
      <T serif style={{ fontSize: 20, lineHeight: 27 }}>{a.role}</T>

      <Btn title="Start chat" icon="message-square" style={{ marginTop: S.xl }} onPress={start} />
      <Row style={{ gap: S.sm, marginTop: S.sm }}>
        <Btn title="Edit" variant="ghost" icon="edit-3" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/agent/edit', params: { id: a.id } })} />
        {a.source === 'custom' || a.source === 'forge' ? (
          <Btn title="Delete" variant="danger" icon="trash-2" style={{ flex: 1 }}
            onPress={() => Alert.alert(`Delete ${a.name}?`, undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAgent(a.id); router.back() } },
            ])} />
        ) : null}
      </Row>

      {chats.length ? (
        <View style={{ marginTop: S.xl }}>
          <Label style={{ marginBottom: S.sm }}>Recent chats</Label>
          {chats.map(c => (
            <Card key={c.id} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={{ marginBottom: S.sm, paddingVertical: S.md }}>
              <Text style={{ color: C.ivory, fontFamily: F.sansMedium }} numberOfLines={1}>{c.title}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <Pressable onPress={() => setShowPrompt(!showPrompt)} style={{ marginTop: S.xl }}>
        <Row><Label style={{ flex: 1 }}>System prompt</Label><Icon name={showPrompt ? 'chevron-up' : 'chevron-down'} color={C.muted} /></Row>
      </Pressable>
      {showPrompt ? <Card style={{ marginTop: S.sm }}><T mono selectable style={{ fontSize: 12, lineHeight: 18 }}>{a.prompt}</T></Card> : null}
    </Screen>
  )
}
