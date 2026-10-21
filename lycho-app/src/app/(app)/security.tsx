import React, { useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Btn, Card, Field, Header, Label, Screen, T } from '@/components/ui'
import { changePassword } from '@/lib/auth'
import { useSession } from '@/lib/session'
import { C, F, S } from '@/theme'

export default function Security() {
  const { user } = useSession()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState<string | null>(null)

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior="padding">
        <Header back kicker="Security" title="Password" />
        {code ? (
          <>
            <T style={{ marginBottom: S.md }}>Password changed. Your old recovery code no longer works — save this new one.</T>
            <Card gold style={{ alignItems: 'center' }}>
              <Label>New recovery code</Label>
              <T selectable style={{ fontFamily: F.mono, fontSize: 20, color: C.gold, marginTop: S.sm, letterSpacing: 2 }}>{code}</T>
            </Card>
            <Btn title="Copy code" variant="ghost" icon="copy" style={{ marginTop: S.md }} onPress={() => Clipboard.setStringAsync(code)} />
          </>
        ) : (
          <>
            <T muted style={{ marginBottom: S.lg }}>Changing your password also issues a new recovery code.</T>
            <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry />
            <Field label="New password" value={next} onChangeText={setNext} secureTextEntry hint="At least 8 characters, letters and numbers." />
            {error ? <T style={{ color: C.red, marginBottom: S.md }}>{error}</T> : null}
            <Btn title="Change password" loading={busy} disabled={!current || !next}
              onPress={async () => {
                setBusy(true); setError(null)
                try { setCode(await changePassword(user!.id, current, next)) } catch (e: any) { setError(e.message) } finally { setBusy(false) }
              }} />
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}
