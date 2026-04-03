import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import Constants from 'expo-constants'

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || 'https://lycho.vercel.app'
const GOLD = '#C9A84C'
const BG = '#070707'
const CARD = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

const AGENT_TYPES = [
  { type: 'intake', name: 'Intake Agent', desc: 'Handles all inbound enquiries 24/7', icon: '💬' },
  { type: 'research', name: 'Research Agent', desc: 'Monitors markets and competitors', icon: '🔍' },
  { type: 'operations', name: 'Operations Agent', desc: 'Automates workflows and scheduling', icon: '⚙️' },
  { type: 'client', name: 'Client Agent', desc: 'Manages customer relationships', icon: '👥' },
  { type: 'analyst', name: 'Analyst Agent', desc: 'Tracks performance and predicts trends', icon: '📊' },
  { type: 'compliance', name: 'Compliance Agent', desc: 'Monitors regulatory changes', icon: '🛡️' },
  { type: 'content', name: 'Content Agent', desc: 'Creates content across all channels', icon: '📝' },
]

export default function DeployAgentScreen() {
  const router = useRouter()
  const [deploying, setDeploying] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function deployAgent(agentType: string) {
    setDeploying(agentType)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) return

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API_URL}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          agent_type: agentType,
          display_name: AGENT_TYPES.find(a => a.type === agentType)?.name || agentType,
          channels: ['web'],
        }),
      })
      if (res.ok) {
        Alert.alert('Success', `${AGENT_TYPES.find(a => a.type === agentType)?.name} deployed!`, [{ text: 'OK', onPress: () => router.back() }])
      } else {
        const json = await res.json()
        Alert.alert('Error', json.error || 'Failed to deploy agent')
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Network error')
    } finally { setDeploying(null) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>DEPLOY AGENT</Text>
      </View>
      <FlatList
        data={AGENT_TYPES}
        keyExtractor={item => item.type}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => deployAgent(item.type)}
            disabled={deploying !== null}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
            {deploying === item.type ? (
              <ActivityIndicator color={GOLD} />
            ) : (
              <View style={styles.deployBtn}><Text style={styles.deployBtnText}>Deploy</Text></View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  backBtn: { marginBottom: 8 },
  backText: { color: GOLD, fontSize: 14 },
  title: { color: GOLD, fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  icon: { fontSize: 32, marginRight: 12 },
  name: { color: IVORY, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  desc: { color: MUTED, fontSize: 13 },
  deployBtn: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  deployBtnText: { color: BG, fontWeight: '700', fontSize: 12 },
})
