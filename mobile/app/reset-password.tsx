import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'

const GOLD = '#C9A84C'
const BG = '#070707'
const CARD = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { token } = useLocalSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleReset() {
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return }
    if (password !== confirm) { Alert.alert('Error', 'Passwords do not match'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { Alert.alert('Error', error.message); return }
      setDone(true)
      setTimeout(() => router.replace('/login'), 2000)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally { setLoading(false) }
  }

  if (done) return (
    <View style={styles.container}>
      <Text style={styles.title}>✓ Password Updated</Text>
      <Text style={styles.sub}>Redirecting to login...</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.sub}>Enter your new password</Text>
      <TextInput style={styles.input} placeholder="New password" placeholderTextColor={MUTED} value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor={MUTED} value={confirm} onChangeText={setConfirm} secureTextEntry />
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Updating...' : 'Update Password'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Back to Login</Text></TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: GOLD, fontSize: 24, fontWeight: '900', marginBottom: 8 },
  sub: { color: MUTED, fontSize: 14, marginBottom: 24 },
  input: { width: '100%', backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 14, color: IVORY, fontSize: 14, marginBottom: 12 },
  btn: { width: '100%', backgroundColor: GOLD, borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: BG, fontWeight: '700', fontSize: 14 },
  link: { color: GOLD, fontSize: 14 },
})
