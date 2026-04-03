import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Constants from 'expo-constants'

const API_URL = (Constants.expoConfig?.extra?.apiUrl as string) || 'https://lycho.vercel.app'
const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const CARD = '#1c1c1c'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

const PLANS = [
  { name: 'Starter', price: 'PKR 9,900', agents: '1 Agent', interactions: '1,000/mo' },
  { name: 'Growth', price: 'PKR 24,900', agents: '5 Agents', interactions: '10,000/mo', popular: true },
  { name: 'Business', price: 'PKR 59,900', agents: '15 Agents', interactions: '50,000/mo' },
  { name: 'Enterprise', price: 'PKR 120,000+', agents: 'Unlimited', interactions: 'Unlimited' },
]

export default function BillingScreen() {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadBilling() }, [])

  async function loadBilling() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) return
      const { data: tenant } = await supabase.from('tenants').select('plan, plan_status, trial_ends_at').eq('id', userData.tenant_id).single()
      setPlan(tenant)
    } catch {} finally { setLoading(false) }
  }

  function handleUpgrade(planName: string) {
    Alert.alert(
      `Upgrade to ${planName}`,
      'Payment integration is coming soon. Email hello@lycho.app to upgrade your plan now.',
      [{ text: 'OK' }]
    )
  }

  if (loading) return <View style={styles.center}><Text style={{ color: GOLD }}>Loading...</Text></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>BILLING</Text>

      {/* Current Plan */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Plan</Text>
        <Text style={styles.planName}>{plan?.plan?.toUpperCase() || 'STARTER'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan?.plan_status === 'trialing' ? '🟡 Free Trial' : plan?.plan_status === 'active' ? '🟢 Active' : '⚪ Pending'}</Text>
        </View>
        {plan?.trial_ends_at && (
          <Text style={styles.trialText}>Trial ends: {new Date(plan.trial_ends_at).toLocaleDateString()}</Text>
        )}
      </View>

      {/* Upgrade Plans */}
      <Text style={styles.sectionTitle}>Upgrade Plan</Text>
      {PLANS.map((p) => (
        <TouchableOpacity key={p.name} style={[styles.planCard, p.popular && styles.popularCard]} onPress={() => handleUpgrade(p.name)} activeOpacity={0.8}>
          {p.popular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>MOST POPULAR</Text></View>}
          <Text style={styles.planCardName}>{p.name}</Text>
          <Text style={styles.planCardPrice}>{p.price}/mo</Text>
          <View style={styles.planFeatures}>
            <Text style={styles.planFeature}>✓ {p.agents}</Text>
            <Text style={styles.planFeature}>✓ {p.interactions} interactions</Text>
            <Text style={styles.planFeature}>✓ All channels</Text>
            <Text style={styles.planFeature}>✓ 24/7 support</Text>
          </View>
          <TouchableOpacity style={[styles.upgradeBtn, p.popular && styles.popularBtn]} onPress={() => handleUpgrade(p.name)}>
            <Text style={[styles.upgradeBtnText, p.popular && { color: BG }]}>Upgrade</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <Text style={styles.note}>All plans include 14-day free trial. No credit card required.</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingTop: 56, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  title: { color: GOLD, fontFamily: 'sans-serif', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  card: { backgroundColor: CARD, borderRadius: 12, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: BORDER },
  cardLabel: { color: MUTED, fontSize: 12, marginBottom: 8 },
  planName: { color: GOLD, fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  badge: { backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { color: GOLD, fontSize: 12 },
  trialText: { color: MUTED, fontSize: 13, marginTop: 8 },
  sectionTitle: { color: IVORY, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  planCard: { backgroundColor: CARD, borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  popularCard: { borderColor: GOLD, borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: GOLD, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 8 },
  popularBadgeText: { color: BG, fontSize: 10, fontWeight: '800' },
  planCardName: { color: IVORY, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  planCardPrice: { color: GOLD, fontSize: 22, fontWeight: '900', marginBottom: 12 },
  planFeatures: { marginBottom: 16 },
  planFeature: { color: MUTED, fontSize: 13, marginBottom: 4 },
  upgradeBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: GOLD, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  popularBtn: { backgroundColor: GOLD, borderColor: GOLD },
  upgradeBtnText: { color: GOLD, fontWeight: '700', fontSize: 14 },
  note: { color: MUTED, fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 40 },
})
