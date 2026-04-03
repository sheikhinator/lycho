import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import AgentCard from '../components/AgentCard'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

interface Agent { id: string; display_name: string; agent_type: string; status: 'active' | 'paused' | 'configuring'; interactions_count: number }

export default function AgentsScreen() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadAgents() {
    const { data } = await supabase.from('agents').select('id, display_name, agent_type, status, interactions_count')
    if (data) setAgents(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { loadAgents() }, [])

  async function toggleAgentStatus(agent: Agent) {
    const newStatus = agent.status === 'active' ? 'paused' : 'active'
    const { error } = await supabase.from('agents').update({ status: newStatus }).eq('id', agent.id)
    if (error) return
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a))
  }

  function handleChat(agent: Agent) {
    // Navigate to conversation with this agent
    router.push(`/conversations` as never)
  }

  const filtered = agents.filter(a =>
    a.display_name.toLowerCase().includes(search.toLowerCase()) ||
    a.agent_type.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <View style={styles.container}><Text style={styles.loading}>Loading agents...</Text></View>

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>AGENTS</Text>
        <TouchableOpacity style={styles.deployBtn} onPress={() => router.push('/agents/new' as never)}>
          <Text style={styles.deployBtnText}>+ Deploy</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search agents..."
        placeholderTextColor={MUTED}
        value={search}
        onChangeText={setSearch}
      />

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No agents found. {search ? 'Try a different search.' : 'Tap Deploy to create one.'}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a.id}
          contentContainerStyle={{ padding: 20 }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadAgents() }}
          renderItem={({ item: a }) => (
            <AgentCard
              name={a.display_name}
              status={a.status}
              interactions={a.interactions_count}
              onDeploy={() => router.push(`/agents/${a.id}` as never)}
              onPause={() => toggleAgentStatus(a)}
              onChat={() => handleChat(a)}
            />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  loading: { color: MUTED, textAlign: 'center', marginTop: 40, fontSize: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { color: GOLD, fontSize: 28, fontWeight: '700', letterSpacing: 4 },
  deployBtn: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: GOLD, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  deployBtnText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  searchInput: { marginHorizontal: 20, marginBottom: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12, color: IVORY, fontSize: 14 },
  empty: { color: MUTED, textAlign: 'center', marginTop: 40, fontSize: 14 },
})
