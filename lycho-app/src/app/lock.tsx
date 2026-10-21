import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Logo } from '@/components/Logo'
import { Btn, Field, Screen, T } from '@/components/ui'
import { biometricPrompt, signIn } from '@/lib/auth'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function LockScreen() {
  const { user, unlock, signOut } = useSession()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const tryBio = async () => { if (await biometricPrompt()) unlock() }
  useEffect(() => { void tryBio() }, [])

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Logo size={88} animated />
          <Text style={{ color: C.ivory, fontFamily: F.display, fontSize: 40, letterSpacing: 6, marginTop: S.lg }}>LOCKED</Text>
          <T muted>{user?.name}</T>
        </View>
        <Btn title="Unlock with fingerprint" icon="unlock" onPress={tryBio} />
        <View style={{ marginTop: S.xl }}>
          <Field label="Or use your password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <T style={{ color: C.red, marginBottom: S.md }}>{error}</T> : null}
          <Btn title="Unlock" variant="ghost" loading={busy} disabled={!password}
            onPress={async () => {
              setBusy(true); setError(null)
              try { await signIn(user!.email, password); unlock() } catch (e: any) { setError(e.message) } finally { setBusy(false) }
            }} />
          <Btn title="Switch account" variant="subtle" style={{ marginTop: S.md }} onPress={signOut} />
        </View>
      </View>
    </Screen>
  )
}
