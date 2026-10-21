import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Modal, Pressable, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Clipboard from 'expo-clipboard'
import { Logo } from '@/components/Logo'
import { Markdown } from '@/components/Markdown'
import { Btn, Field, Icon, Row, T, tap } from '@/components/ui'
import { PROVIDER_INFO } from '@/lib/ai/providers'
import type { ProviderId } from '@/lib/vault'
import {
  deleteMessage, getConversation, listMessages, regenerate, renameConversation, sendMessage,
  type Conversation, type Message,
} from '@/lib/store'
import { C, F, R, S } from '@/theme'

function Bubble({ m, last, onRetry, onChanged }: { m: Message; last: boolean; onRetry: () => void; onChanged: () => void }) {
  const mine = m.role === 'user'
  const menu = () =>
    Alert.alert(mine ? 'Your message' : 'Reply', undefined, [
      { text: 'Copy', onPress: () => Clipboard.setStringAsync(m.content) },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMessage(m.id); onChanged() } },
      { text: 'Cancel', style: 'cancel' },
    ])
  if (mine) {
    return (
      <Pressable onLongPress={menu} style={{ alignSelf: 'flex-end', maxWidth: '86%', marginVertical: 6 }}>
        <View style={{ backgroundColor: C.goldDim, borderColor: C.goldLine, borderWidth: 1, borderRadius: R.lg, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text selectable style={{ color: C.ivory, fontFamily: F.sans, fontSize: 15, lineHeight: 22 }}>{m.content}</Text>
        </View>
      </Pressable>
    )
  }
  if (m.error) {
    return (
      <View style={{ marginVertical: 6, backgroundColor: 'rgba(224,106,95,0.08)', borderColor: 'rgba(224,106,95,0.3)', borderWidth: 1, borderRadius: R.lg, padding: 12 }}>
        <Row style={{ marginBottom: 6 }}><Icon name="alert-triangle" size={14} color={C.red} /><Text style={{ color: C.red, fontFamily: F.sansBold, marginLeft: 6 }}>Couldn't get a reply</Text></Row>
        <T muted selectable style={{ fontSize: 12.5 }}>{m.content}</T>
        {last ? (
          <Row style={{ gap: 16, marginTop: 10 }}>
            <Pressable onPress={onRetry}><Text style={{ color: C.gold, fontFamily: F.sansBold }}>Retry</Text></Pressable>
            <Pressable onPress={() => router.push('/keys')}><Text style={{ color: C.soft, fontFamily: F.sansMedium }}>Check keys</Text></Pressable>
          </Row>
        ) : null}
      </View>
    )
  }
  return (
    <Pressable onLongPress={menu} style={{ marginVertical: 8 }}>
      <Markdown text={m.content} />
      <Row style={{ marginTop: 6, gap: 10 }}>
        <Text style={{ color: C.muted, fontFamily: F.mono, fontSize: 10.5 }} numberOfLines={1}>
          {PROVIDER_INFO[m.provider as ProviderId]?.name ?? m.provider} · {m.model?.split('/').pop()} · {m.tier}
          {m.latency_ms ? ` · ${(m.latency_ms / 1000).toFixed(1)}s` : ''}
        </Text>
        <View style={{ flex: 1 }} />
        <Pressable hitSlop={10} onPress={() => { tap(); void Clipboard.setStringAsync(m.content) }}><Icon name="copy" size={14} color={C.muted} /></Pressable>
        {last ? <Pressable hitSlop={10} onPress={onRetry}><Icon name="refresh-cw" size={14} color={C.muted} /></Pressable> : null}
      </Row>
    </Pressable>
  )
}

function Thinking() {
  return (
    <Row style={{ marginVertical: 10 }}>
      <Logo size={22} animated />
      <Text style={{ color: C.soft, fontFamily: F.mono, fontSize: 12, marginLeft: 10 }}>Routing to the best model…</Text>
    </Row>
  )
}

export default function Chat() {
  const { id, q } = useLocalSearchParams<{ id: string; q?: string }>()
  const [conv, setConv] = useState<Conversation | null>(null)
  const [msgs, setMsgs] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useRef<FlatList<Message>>(null)
  const sentInitial = useRef(false)

  const load = useCallback(async () => {
    setConv(await getConversation(id))
    setMsgs(await listMessages(id))
  }, [id])
  useFocusEffect(useCallback(() => { void load() }, [load]))

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try { await fn() } catch { /* error is saved as a message */ } finally {
      setBusy(false)
      await load()
    }
  }, [load])

  const send = useCallback(async (body?: string) => {
    const t = (body ?? text).trim()
    if (!t || busy) return
    setText('')
    setMsgs(m => [...m, { id: 'pending', conversation_id: id, role: 'user', content: t, provider: null, model: null, tier: null, tokens_in: null, tokens_out: null, latency_ms: null, error: 0, created_at: Date.now() }])
    await run(() => sendMessage(id, t))
  }, [text, busy, id, run])

  useEffect(() => {
    if (q && !sentInitial.current) { sentInitial.current = true; void send(q) }
  }, [q, send])

  const [renaming, setRenaming] = useState<string | null>(null)
  const rename = () => setRenaming(conv?.title ?? '')

  const lastId = msgs[msgs.length - 1]?.id

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.void }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Row style={{ paddingHorizontal: S.lg, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Pressable hitSlop={12} onPress={() => router.back()}><Icon name="arrow-left" size={22} /></Pressable>
          <Pressable style={{ flex: 1, marginHorizontal: S.md }} onLongPress={rename}
            onPress={() => conv && router.push({ pathname: '/agent/[id]', params: { id: conv.agent_id } })}>
            <Text style={{ color: C.ivory, fontFamily: F.sansBold, fontSize: 16 }} numberOfLines={1}>{conv?.title ?? ''}</Text>
            <Text style={{ color: C.gold, fontFamily: F.mono, fontSize: 11 }} numberOfLines={1}>{conv?.agent_name}</Text>
          </Pressable>
          <Pressable hitSlop={12} onPress={() => router.push({ pathname: '/model-picker', params: { target: `conv:${id}` } })}
            style={{ borderWidth: 1, borderColor: conv?.model_override ? C.gold : C.border, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 130 }}>
            <Text style={{ color: conv?.model_override ? C.gold : C.soft, fontFamily: F.mono, fontSize: 10.5 }} numberOfLines={1}>
              {conv?.model_override ? conv.model_override.split(':').slice(1).join(':').split('/').pop() : 'AUTO'}
            </Text>
          </Pressable>
        </Row>

        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: S.lg, paddingBottom: S.xl, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Logo size={64} />
              <Text style={{ color: C.ivory, fontFamily: F.display, fontSize: 28, marginTop: S.lg, letterSpacing: 1 }}>{conv?.agent_name?.toUpperCase()}</Text>
              <T muted style={{ textAlign: 'center', marginTop: 6 }}>Ask anything. Replies come from whichever model fits best.</T>
            </View>
          }
          ListFooterComponent={busy ? <Thinking /> : undefined}
          renderItem={({ item }) => (
            <Bubble m={item} last={item.id === lastId && !busy} onChanged={load} onRetry={() => run(() => regenerate(id))} />
          )}
        />

        <Row style={{ paddingHorizontal: S.md, paddingVertical: S.sm, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'flex-end' }}>
          <TextInput
            value={text} onChangeText={setText} multiline placeholder="Message" placeholderTextColor={C.muted}
            selectionColor={C.gold} cursorColor={C.gold}
            style={{ flex: 1, maxHeight: 140, color: C.ivory, fontFamily: F.sans, fontSize: 15, backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 }}
          />
          <Pressable onPress={() => { tap(); void send() }} disabled={!text.trim() || busy}
            style={{ marginLeft: S.sm, backgroundColor: text.trim() && !busy ? C.gold : C.surface, borderRadius: R.pill, padding: 11 }}>
            <Icon name="arrow-up" size={20} color={text.trim() && !busy ? C.void : C.muted} />
          </Pressable>
        </Row>
      </KeyboardAvoidingView>
      <Modal visible={renaming !== null} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: S.xl }}>
          <View style={{ backgroundColor: C.deep, borderColor: C.goldLine, borderWidth: 1, borderRadius: R.lg, padding: S.lg }}>
            <Field label="Rename chat" value={renaming ?? ''} onChangeText={setRenaming} autoFocus />
            <Row style={{ gap: S.sm }}>
              <Btn title="Cancel" variant="subtle" style={{ flex: 1 }} onPress={() => setRenaming(null)} />
              <Btn title="Save" style={{ flex: 1 }} onPress={async () => { await renameConversation(id, renaming ?? ''); setRenaming(null); void load() }} />
            </Row>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
