import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { router } from 'expo-router'
import { resetPassword } from '../lib/auth'

const GOLD = '#C9A84C'
const BG = '#070707'
const SURFACE = '#141414'
const BORDER = '#2a2a2a'
const IVORY = '#F0EBE1'
const MUTED = '#6b6b6b'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset() {
    if (!email) return
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) {
      Alert.alert('Failed', error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.heading}>Check Your Email</Text>
          <Text style={styles.body}>
            We&apos;ve sent a password reset link to {email}. Click the link to set a new password.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/login')}>
            <Text style={styles.btnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.logoArea}>
        <Text style={styles.logoText}>LYCHO</Text>
        <Text style={styles.tagline}>Reset your password</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Forgot Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Business email"
          placeholderTextColor={MUTED}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleReset} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Remember your password?{' '}
          <Text style={{ color: GOLD }} onPress={() => router.back()}>Sign in</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, justifyContent: 'center', paddingHorizontal: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoText: { color: GOLD, fontSize: 40, fontWeight: '700', letterSpacing: 8 },
  tagline: { color: MUTED, fontSize: 12, letterSpacing: 4, marginTop: 4 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 24 },
  heading: { color: IVORY, fontSize: 20, fontWeight: '600', marginBottom: 16 },
  body: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 24 },
  input: { backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: BORDER, borderRadius: 8, color: IVORY, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  btn: { backgroundColor: GOLD, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: BG, fontWeight: '700', fontSize: 15 },
  footer: { color: MUTED, textAlign: 'center', fontSize: 13, marginTop: 20 },
})
