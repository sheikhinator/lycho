import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

interface KPI { label: string; value: string | number; sub?: string }

export default function DashboardScreen() {
  const [kpis, setKpis] = useState<KPI[]>([
    { label: 'Active Agents', value: '—' },
    { label: 'Conversations Today', value: '—' },
    { label: 'Hot Leads', value: '—' },
  ])
  const [recentConvos, setRecentConvos] = useState<{ id: string; contact_identifier: string; channel: string; created_at: string }[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const today = new Date().toISOString().slice(0, 10)

    const [{ data: agents }, { data: conversations }] = await Promise.all([
      supabase.from('agents').select('id, status').eq('status', 'active'),
      supabase.from('conversations').select('id, contact_identifier, channel, created_at, metadata').gte('created_at', today).order('created_at', { ascending: false }).limit(10),
    ])

    const hotLeads = (conversations ?? []).filter(c => {
      const score = (c.metadata as Record<string, unknown>)?.lead_score ?? 0
      return (score as number) >= 85
    }).length

    setKpis([
      { label: 'Active Agents', value: agents?.length ?? 0 },
      { label: 'Conversations Today', value: conversations?.length ?? 0 },
      { label: 'Hot Leads', value: hotLeads, sub: 'Score ≥ 85' },
    ])
    setRecentConvos((conversations ?? []).slice(0, 5))
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>LYCHO</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signout}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <Text style={styles.sectionTitle}>COMMAND CENTER</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
          {kpis.map((k, i) => (
            <View key={i} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiValue}>{k.value}</Text>
              {k.sub && <Text style={styles.kpiSub}>{k.sub}</Text>}
            </View>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/agents' as never)}>
            <Text style={styles.actionBtnText}>Deploy Agent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => router.push('/conversations' as never)}>
            <Text style={[styles.actionBtnText, { color: GOLD }]}>View Conversations</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Conversations */}
        <Text style={styles.sectionTitle}>RECENT CONVERSATIONS</Text>
        {recentConvos.length === 0 ? (
          <Text style={styles.empty}>No conversations yet</Text>
        ) : (
          recentConvos.map(c => (
            <View key={c.id} style={styles.convoCard}>
              <Text style={styles.convoContact}>{c.contact_identifier}</Text>
              <Text style={styles.convoMeta}>{c.channel} · {new Date(c.created_at).toLocaleTimeString()}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { label: 'Dashboard', route: '/dashboard' },
          { label: 'Agents', route: '/agents' },
          { label: 'Chats', route: '/conversations' },
          { label: 'Settings', route: '/settings' },
        ].map(tab => (
          <TouchableOpacity key={tab.route} style={styles.tab} onPress={() => router.push(tab.route as never)}>
            <Text style={[styles.tabLabel, tab.route === '/dashboard' && { color: GOLD }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  logo: { color: GOLD, fontSize: 22, fontWeight: '700', letterSpacing: 6 },
  signout: { color: MUTED, fontSize: 13 },
  sectionTitle: { color: GOLD, fontSize: 11, letterSpacing: 3, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  kpiScroll: { paddingLeft: 20 },
  kpiCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginRight: 12, minWidth: 130 },
  kpiLabel: { color: MUTED, fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  kpiValue: { color: IVORY, fontSize: 28, fontWeight: '700' },
  kpiSub: { color: MUTED, fontSize: 11, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  actionBtn: { flex: 1, backgroundColor: GOLD, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  actionBtnSecondary: { backgroundColor: SURFACE, borderWidth: 1, borderColor: GOLD },
  actionBtnText: { color: BG, fontWeight: '700', fontSize: 14 },
  convoCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, marginHorizontal: 20, marginBottom: 8 },
  convoContact: { color: IVORY, fontSize: 14, fontWeight: '600' },
  convoMeta: { color: MUTED, fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  empty: { color: MUTED, fontSize: 13, paddingHorizontal: 20, paddingVertical: 8 },
  tabBar: { flexDirection: 'row', backgroundColor: SURFACE, borderTopWidth: 1, borderTopColor: BORDER, paddingBottom: 24, paddingTop: 12 },
  tab: { flex: 1, alignItems: 'center' },
  tabLabel: { color: MUTED, fontSize: 12 },
})
