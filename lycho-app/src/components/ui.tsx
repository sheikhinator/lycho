import React from 'react'
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import Feather from '@expo/vector-icons/Feather'
import * as Haptics from 'expo-haptics'
import { C, F, R, S } from '@/theme'

export type IconName = React.ComponentProps<typeof Feather>['name']
export const Icon = ({ name, size = 18, color = C.ivory }: { name: IconName; size?: number; color?: string }) => (
  <Feather name={name} size={size} color={color} />
)

export const tap = () => { void Haptics.selectionAsync().catch(() => {}) }

export function Screen({ children, scroll = false, pad = true, edges = ['top'] as const }: {
  children: React.ReactNode; scroll?: boolean; pad?: boolean; edges?: readonly ('top' | 'bottom')[]
}) {
  const inner = pad ? { paddingHorizontal: S.lg } : null
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.void }} edges={edges as any}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, { paddingBottom: 48 }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  )
}

export function Header({ title, kicker, back, backTo = '/', right }: { title: string; kicker?: string; back?: boolean; backTo?: string; right?: React.ReactNode }) {
  return (
    <View style={st.header}>
      {back && (
        <Pressable hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace(backTo as any))} style={{ marginRight: S.md }}>
          <Icon name="arrow-left" size={22} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        {kicker ? <Text style={st.kicker}>{kicker}</Text> : null}
        <Text style={st.title} numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  )
}

export const T = ({ children, style, muted, mono, serif, numberOfLines, selectable }: {
  children: React.ReactNode; style?: StyleProp<TextStyle>; muted?: boolean; mono?: boolean; serif?: boolean; numberOfLines?: number; selectable?: boolean
}) => (
  <Text
    selectable={selectable}
    numberOfLines={numberOfLines}
    style={[{ color: muted ? C.soft : C.ivory, fontFamily: mono ? F.mono : serif ? F.serif : F.sans, fontSize: serif ? 18 : 14, lineHeight: serif ? 24 : 20 }, style]}
  >
    {children}
  </Text>
)

export const Label = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[st.label, style]}>{children}</Text>
)

export const Card = ({ children, style, onPress, gold }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; gold?: boolean }) =>
  onPress ? (
    <Pressable onPress={() => { tap(); onPress() }} style={({ pressed }) => [st.card, gold && st.cardGold, pressed && { opacity: 0.75 }, style]}>
      {children}
    </Pressable>
  ) : (
    <View style={[st.card, gold && st.cardGold, style]}>{children}</View>
  )

export function Btn({ title, onPress, variant = 'gold', icon, loading, disabled, style, small }: {
  title: string; onPress: () => void; variant?: 'gold' | 'ghost' | 'danger' | 'subtle'; icon?: IconName
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean
}) {
  const bg = variant === 'gold' ? C.gold : variant === 'danger' ? 'rgba(224,106,95,0.12)' : variant === 'subtle' ? C.surface : 'transparent'
  const fg = variant === 'gold' ? C.void : variant === 'danger' ? C.red : variant === 'subtle' ? C.ivory : C.gold
  const border = variant === 'ghost' ? C.goldLine : variant === 'danger' ? 'rgba(224,106,95,0.35)' : variant === 'subtle' ? C.border : C.gold
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => { tap(); onPress() }}
      style={({ pressed }) => [
        st.btn, small && { paddingVertical: 8, paddingHorizontal: 12 },
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          {icon ? <Icon name={icon} size={small ? 14 : 16} color={fg} /> : null}
          <Text style={[st.btnText, { color: fg }, small && { fontSize: 13 }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export function Field({ label, hint, style, ...p }: TextInputProps & { label?: string; hint?: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ marginBottom: S.md }}>
      {label ? <Label style={{ marginBottom: 6 }}>{label}</Label> : null}
      <TextInput placeholderTextColor={C.muted} selectionColor={C.gold} cursorColor={C.gold} style={[st.input, p.multiline && { minHeight: 96, textAlignVertical: 'top' }, style]} {...p} />
      {hint ? <Text style={st.hint}>{hint}</Text> : null}
    </View>
  )
}

export const Chip = ({ label, active, onPress, count }: { label: string; active?: boolean; onPress?: () => void; count?: number }) => (
  <Pressable onPress={() => { tap(); onPress?.() }} style={[st.chip, active && { backgroundColor: C.goldDim, borderColor: C.gold }]}>
    <Text style={[st.chipText, active && { color: C.gold }]}>{label}{count != null ? `  ${count}` : ''}</Text>
  </Pressable>
)

export const Badge = ({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'green' | 'amber' | 'red' | 'muted' }) => {
  const color = tone === 'gold' ? C.gold : tone === 'green' ? C.green : tone === 'amber' ? C.amber : tone === 'red' ? C.red : C.soft
  return (
    <View style={[st.badge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
      <Text style={[st.badgeText, { color }]}>{label}</Text>
    </View>
  )
}

export const Stat = ({ value, label, style }: { value: string | number; label: string; style?: StyleProp<ViewStyle> }) => (
  <View style={[st.stat, style]}>
    <Text style={st.statValue}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </View>
)

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>
)

export function ListItem({ icon, title, subtitle, right, onPress, danger }: {
  icon?: IconName; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; danger?: boolean
}) {
  return (
    <Pressable onPress={onPress && (() => { tap(); onPress() })} style={({ pressed }) => [st.item, pressed && onPress && { backgroundColor: C.surface }]}>
      {icon ? <View style={st.itemIcon}><Icon name={icon} size={17} color={danger ? C.red : C.gold} /></View> : null}
      <View style={{ flex: 1 }}>
        <Text style={[st.itemTitle, danger && { color: C.red }]}>{title}</Text>
        {subtitle ? <Text style={st.itemSub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={18} color={C.muted} /> : null)}
    </Pressable>
  )
}

export const Divider = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: S.sm }} />

export const Empty = ({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: React.ReactNode }) => (
  <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: S.xl }}>
    <Icon name={icon} size={30} color={C.goldLine} />
    <Text style={[st.title, { fontSize: 24, marginTop: S.md, textAlign: 'center' }]}>{title}</Text>
    {body ? <T muted style={{ textAlign: 'center', marginTop: 6 }}>{body}</T> : null}
    {action ? <View style={{ marginTop: S.lg }}>{action}</View> : null}
  </View>
)

export const st = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: S.md, paddingBottom: S.lg },
  kicker: { color: C.gold, fontFamily: F.mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  title: { color: C.ivory, fontFamily: F.display, fontSize: 34, letterSpacing: 1, lineHeight: 38 },
  label: { color: C.soft, fontFamily: F.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  card: { backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: R.lg, padding: S.lg },
  cardGold: { borderColor: C.goldLine, backgroundColor: '#15130d' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: R.md, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 18 },
  btnText: { fontFamily: F.sansBold, fontSize: 15, letterSpacing: 0.3 },
  input: { backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: R.md, color: C.ivory, fontFamily: F.sans, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  hint: { color: C.muted, fontFamily: F.sans, fontSize: 12, marginTop: 6 },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, backgroundColor: C.deep },
  chipText: { color: C.soft, fontFamily: F.sansMedium, fontSize: 13 },
  badge: { borderWidth: 1, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  stat: { flex: 1, backgroundColor: C.deep, borderColor: C.border, borderWidth: 1, borderRadius: R.lg, padding: S.md },
  statValue: { color: C.gold, fontFamily: F.display, fontSize: 30, lineHeight: 32 },
  statLabel: { color: C.soft, fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4, gap: 12, borderRadius: R.md },
  itemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.goldDim, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { color: C.ivory, fontFamily: F.sansMedium, fontSize: 15 },
  itemSub: { color: C.soft, fontFamily: F.sans, fontSize: 12.5, marginTop: 2, lineHeight: 17 },
})
