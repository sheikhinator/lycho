import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Btn, Chip, Field, Header, Label, Row, Screen, T } from '@/components/ui'
import { getAgent, saveAgent } from '@/lib/store'
import { route } from '@/lib/ai/router'
import { C, S } from '@/theme'

const TIERS: [string | null, string][] = [[null, 'Auto'], ['fast', 'Fast'], ['balanced', 'Balanced'], ['heavy', 'Heavy']]

export default function AgentStudio() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [prompt, setPrompt] = useState('')
  const [tier, setTier] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) void getAgent(id).then(a => { if (a) { setName(a.name); setRole(a.role); setPrompt(a.prompt); setTier(a.tier) } })
  }, [id])

  const draft = async () => {
    setDrafting(true); setError(null)
    try {
      const r = await route([
        { role: 'system', content: 'You write system prompts for specialist AI agents. Output only the system prompt, 120–220 words, second person ("You are…"). Include: role, 4–5 concrete capabilities, how to structure answers, when to flag risk, and to reply in the user\'s language.' },
        { role: 'user', content: `Agent name: ${name}\nWhat it does: ${role}` },
      ], { tier: 'balanced' })
      setPrompt(r.text.trim())
    } catch (e: any) { setError(e.message) } finally { setDrafting(false) }
  }

  const save = async () => {
    setBusy(true)
    try {
      const saved = await saveAgent({ id, name: name.trim(), role: role.trim(), prompt: prompt.trim(), tier })
      router.replace({ pathname: '/agent/[id]', params: { id: saved } })
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior="padding">
        <Header back kicker="Agent Studio" title={id ? 'Edit agent' : 'New agent'} />
        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Supply Chain Strategist" />
        <Field label="What it does" value={role} onChangeText={setRole} multiline placeholder="One or two sentences about its job" />
        <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <Label>System prompt</Label>
        </Row>
        <Field value={prompt} onChangeText={setPrompt} multiline placeholder="How the agent should think and behave" style={{ minHeight: 180 }} />
        <Btn title={prompt ? 'Rewrite prompt with AI' : 'Write prompt with AI'} variant="ghost" icon="zap" onPress={draft} loading={drafting} disabled={!name || !role} />

        <Label style={{ marginTop: S.lg, marginBottom: S.sm }}>Model tier</Label>
        <Row style={{ marginBottom: S.sm }}>
          {TIERS.map(([v, l]) => <Chip key={l} label={l} active={tier === v} onPress={() => setTier(v)} />)}
        </Row>
        <T muted style={{ fontSize: 12, marginBottom: S.lg }}>Auto lets the router decide per message. Heavy always uses the strongest models.</T>

        {error ? <T style={{ color: C.red, marginBottom: S.md }}>{error}</T> : null}
        <Btn title="Save agent" onPress={save} loading={busy} disabled={!name.trim() || !role.trim() || !prompt.trim()} />
      </KeyboardAvoidingView>
    </Screen>
  )
}
