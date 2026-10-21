// LYCHO design tokens — same palette and type as the website (app/globals.css + layout.tsx).
export const C = {
  void: '#070707',
  deep: '#141414',
  surface: '#1c1c1c',
  raised: '#232323',
  border: '#2a2a2a',
  gold: '#C9A84C',
  pulse: '#E2C06A',
  goldDim: 'rgba(201,168,76,0.12)',
  goldLine: 'rgba(201,168,76,0.35)',
  ivory: '#F0EBE1',
  muted: '#6b6b6b',
  soft: '#9a958c',
  green: '#5FBF7F',
  amber: '#E0A84A',
  red: '#E06A5F',
} as const

export const F = {
  display: 'BebasNeue_400Regular',
  serif: 'CormorantGaramond_500Medium',
  serifItalic: 'CormorantGaramond_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  mono: 'DMMono_400Regular',
} as const

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const R = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const
