import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'

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

  useEffect(() => {
    loadConversation()
  }, [id])

  async function loadConversation() {
    if (!id) return
    const { data } = await supabase
      .from('conversations')
      .select('messages, contact_identifier, channel')
      .eq('id', id)
      .single()
    if (data) {
      setMessages((data.messages as Message[]) || [])
      setContactName(data.contact_identifier || 'Unknown')
      setChannel(data.channel || 'unknown')
    }
  }

  async function handleSend() {
    if (!input.trim() || sending || !id) return
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setInput('')
    setSending(true)
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: id, message: userMsg.content }),
      })
      const json = await res.json()
      if (res.ok && json.data?.response) {
        const assistantMsg: Message = { role: 'assistant', content: json.data.response, timestamp: new Date().toISOString() }
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
