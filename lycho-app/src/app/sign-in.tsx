import React, { useCallback, useState } from 'react'
import { KeyboardAvoidingView, Pressable, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Logo } from '@/components/Logo'
import { Btn, Field, Screen, T } from '@/components/ui'
import { userCount } from '@/lib/auth'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function SignInScreen() {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstRun, setFirstRun] = useState(false)

  useFocusEffect(useCallback(() => { void userCount().then(n => setFirstRun(n === 0)) }, []))

  const submit = async () => {
    setBusy(true); setError(null)
    try { await signIn(email, password) } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior="padding">
        <View style={{ alignItems: 'center', marginTop: 64, marginBottom: 40 }}>
          <Logo size={96} animated />
          <Text style={{ color: C.ivory, fontFamily: F.display, fontSize: 56, letterSpacing: 8, marginTop: S.lg }}>LYCHO</Text>
          <Text style={{ color: C.gold, fontFamily: F.serifItalic, fontSize: 20 }}>Intelligence. Transmitted.</Text>
        </View>

        {firstRun ? (
          <View>
            <T serif style={{ textAlign: 'center', marginBottom: S.xl }}>
              Your private AI workforce, living entirely on this phone. Create the master account to begin.
            </T>
            <Btn title="Create master account" icon="shield" onPress={() => router.push('/signup')} />
          </View>
        ) : (
          <View>
            <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="••••••••" onSubmitEditing={submit} />
            {error ? <T style={{ color: C.red, marginBottom: S.md }}>{error}</T> : null}
            <Btn title="Sign in" onPress={submit} loading={busy} disabled={!email || !password} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: S.lg }}>
              <Pressable onPress={() => router.push('/forgot')}><T muted>Forgot password?</T></Pressable>
              <Pressable onPress={() => router.push('/signup')}><T style={{ color: C.gold }}>Create account</T></Pressable>
            </View>
          </View>
        )}
        <T muted style={{ textAlign: 'center', marginTop: 48, fontSize: 12 }}>
          Everything is stored on this device. No servers, no cloud.
        </T>
      </KeyboardAvoidingView>
    </Screen>
  )
}
