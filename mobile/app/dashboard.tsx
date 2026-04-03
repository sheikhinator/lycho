import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function DashboardScreen() {
  const [kpis, setKpis] = useState([
    { label: 'Active Agents', value: 0 },
    { label: 'Conversations Today', value: 0 },
    { label: 'Hot Leads', value: 0 },
    { label: 'Revenue', value: 'PKR 0' },
  ])
  const [recentConvos, setRecentConvos] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: agents }, { data: conversations }] = await Promise.all([
      supabase.from('agents').select('id, status').eq('status', 'active'),
      supabase.from('conversations').select('id, contact_identifier, channel, created_at, metadata').gte('created_at', today).order('created_at', { ascending: false }).limit(10),
    ])
    const hotLeads = (conversations ?? []).filter((c: any) => (c.metadata as any)?.lead_score >= 85).length
    setKpis([
      { label: 'Active Agents', value: agents?.length ?? 0 },
      { label: 'Conversations Today', value: conversations?.length ?? 0 },
      { label: 'Hot Leads', value: hotLeads },
      { label: 'Revenue', value: 'PKR 0' },
    ])
    setRecentConvos((conversations ?? []).slice(0, 5))
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}>
      <View style={styles.header}>
        <Text style={styles.logo}>LYCHO</Text>
        <TouchableOpacity onPress={handleSignOut}><Text style={styles.signout}>Sign Out</Text></TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>COMMAND CENTER</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
        {kpis.map((k, i) => (
          <View key={i} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{k.label}</Text>
            <Text style={styles.kpiValue}>{k.value}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/agents/new' as never)}>
          <Text style={styles.actionBtnText}>Deploy Agent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/conversations' as never)}>
          <Text style={[styles.actionBtnText, { color: GOLD }]}>Conversations</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/analytics' as never)}>
          <Text style={[styles.actionBtnText, { color: GOLD }]}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/billing' as never)}>
          <Text style={[styles.actionBtnText, { color: GOLD }]}>Billing</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>RECENT CONVERSATIONS</Text>
      {recentConvos.length === 0 ? (
        <Text style={styles.empty}>No conversations yet</Text>
      ) : (
        recentConvos.map((c: any) => (
          <TouchableOpacity key={c.id} style={styles.convoCard} onPress={() => router.push(`/conversations/${c.id}` as never)}>
            <Text style={styles.convoContact}>{c.contact_identifier}</Text>
            <Text style={styles.convoMeta}>{c.channel} · {new Date(c.created_at).toLocaleTimeString()}</Text>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  logo: { color: GOLD, fontSize: 22, fontWeight: '700', letterSpacing: 6 },
  signout: { color: MUTED, fontSize: 13 },
  sectionTitle: { color: GOLD, fontSize: 11, letterSpacing: 3, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  kpiScroll: { paddingLeft: 20 },
  kpiCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginRight: 12, minWidth: 130 },
  kpiLabel: { color: MUTED, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  kpiValue: { color: IVORY, fontSize: 28, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 12 },
  actionBtn: { flex: 1, backgroundColor: GOLD, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: SURFACE, borderWidth: 1, borderColor: GOLD },
  actionBtnText: { color: BG, fontWeight: '700', fontSize: 14 },
  convoCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, marginHorizontal: 20, marginBottom: 8 },
  convoContact: { color: IVORY, fontSize: 14, fontWeight: '600' },
  convoMeta: { color: MUTED, fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  empty: { color: MUTED, fontSize: 13, paddingHorizontal: 20, paddingVertical: 8 },
})
