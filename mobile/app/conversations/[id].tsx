import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import Constants from 'expo-constants'

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || 'https://lycho.vercel.app'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

interface Message { role: 'user' | 'assistant'; content: string; timestamp?: string }

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [contactName, setContactName] = useState('')
  const [channel, setChannel] = useState('')
  const [agentId, setAgentId] = useState('')

  useEffect(() => {
    loadConversation()
  }, [id])

  async function loadConversation() {
    if (!id) return
    const { data } = await supabase
      .from('conversations')
      .select('messages, contact_identifier, channel, agent_id')
      .eq('id', id)
      .single()
    if (data) {
      setMessages((data.messages as Message[]) || [])
      setContactName(data.contact_identifier || 'Unknown')
      setChannel(data.channel || 'unknown')
      setAgentId(data.agent_id || '')
    }
  }

  async function handleSend() {
    if (!input.trim() || sending || !id) return
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setInput('')
    setSending(true)
    setMessages(prev => [...prev, userMsg])

    try {
      // Get session for auth
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const res = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agent_id: agentId,
          message: userMsg.content,
          channel: 'mobile',
          contact_identifier: sessionData?.session?.user?.id || 'mobile-user',
        }),
      })
      const json = await res.json()
      const reply = json.data?.response || json.response || json.message
      if (reply) {
        const assistantMsg: Message = { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to send. Please try again.', timestamp: new Date().toISOString() }])
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.contactName}>{contactName}</Text>
        <Text style={styles.channel}>{channel}</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item: m }) => (
          <View style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.bubbleText, m.role === 'user' ? styles.userText : styles.assistantText]}>{m.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={MUTED}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendBtnText}>{sending ? '…' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  header: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  contactName: { color: IVORY, fontSize: 16, fontWeight: '600' },
  channel: { color: MUTED, fontSize: 12, textTransform: 'capitalize' },
  messagesList: { padding: 16 },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 10, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: IVORY },
  assistantText: { color: IVORY },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: BORDER, gap: 8 },
  input: { flex: 1, backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: BORDER, borderRadius: 20, color: IVORY, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: BG, fontWeight: '700', fontSize: 13 },
})
