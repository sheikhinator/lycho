export type EmotionalState =
  | 'frustrated' | 'angry' | 'upset'
  | 'excited'    | 'delighted' | 'happy'
  | 'confused'   | 'lost'      | 'uncertain'
  | 'urgent'     | 'panicked'
  | 'satisfied'  | 'grateful'
  | 'neutral'    | 'business-like'

export interface EmotionalAnalysis {
  state:                    EmotionalState
  intensity:                number   // 0-1
  urgency:                  number   // 0-1
  recommended_tone:         string
  response_speed:           'immediate' | 'normal'
  opening_acknowledgement?: string
}

const EMOTIONAL_SIGNALS: Record<string, {
  signals: string[]
  state: EmotionalState
  intensity: number
}> = {
  frustrated: {
    signals: [
      // English
      'frustrated', 'angry', 'ridiculous', 'unacceptable', 'terrible', 'worst',
      'horrible', 'disgusting', 'fed up', 'sick of', 'never again', 'useless',
      'pathetic', 'waste of time', 'not good enough', 'disappointed',
      // Urdu
      'تنگ', 'غصہ', 'ناقابل قبول', 'بکواس', 'بے کار', 'شرم', 'افسوس',
      // Arabic
      'محبط', 'غاضب', 'مزعج', 'سيء',
    ],
    state: 'frustrated',
    intensity: 0.8,
  },
  angry: {
    signals: [
      'furious', 'outrageous', 'disgusted', 'appalled', 'livid',
      'غصے میں', 'ناراض',
      'غضبان', 'مغضوب',
    ],
    state: 'angry',
    intensity: 0.95,
  },
  urgent: {
    signals: [
      'urgent', 'asap', 'immediately', 'right now', 'emergency', 'critical',
      'help', 'please', 'now', 'fast', 'quick', 'hurry', 'rush',
      'فوری', 'ابھی', 'جلدی', 'مدد', 'ضروری',
      'عاجل', 'سريع', 'الآن',
    ],
    state: 'urgent',
    intensity: 0.7,
  },
  excited: {
    signals: [
      'amazing', 'love', 'excellent', 'fantastic', 'great', 'brilliant',
      'perfect', 'wonderful', 'incredible', 'awesome', 'excited', 'thrilled',
      'شاندار', 'زبردست', 'بہترین', 'لاجواب', 'کمال',
      'رائع', 'ممتاز', 'مذهل',
    ],
    state: 'excited',
    intensity: 0.8,
  },
  confused: {
    signals: [
      'confused', 'lost', "don't understand", "don't know", 'unclear',
      'what do you mean', 'explain', 'not sure', "can't figure",
      'سمجھ نہیں', 'پتہ نہیں', 'واضح نہیں',
      'لا أفهم', 'غير واضح',
    ],
    state: 'confused',
    intensity: 0.5,
  },
  satisfied: {
    signals: [
      'thank you', 'thanks', 'appreciate', 'helpful', 'resolved', 'sorted',
      'perfect', 'happy with', 'satisfied',
      'شکریہ', 'ممنون', 'مہربانی',
      'شكرا', 'ممتنن',
    ],
    state: 'satisfied',
    intensity: 0.6,
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function analyseEmotion(message: string, history: any[] = []): EmotionalAnalysis {
  const lower = message.toLowerCase()

  // Escalating frustration check (3 recent user messages)
  const recentFrustration = history.slice(-3).filter(m =>
    m.role === 'user' &&
    EMOTIONAL_SIGNALS.frustrated.signals.some(s => (m.content ?? '').toLowerCase().includes(s)),
  ).length

  const openings: Record<string, string> = {
    frustrated:  'I completely understand your frustration, and I sincerely apologize for the inconvenience.',
    angry:       'I hear you, and I want to make this right immediately.',
    urgent:      "I'm on this right now.",
    confused:    'Let me explain this clearly.',
    excited:     "That's wonderful to hear!",
    satisfied:   "I'm so glad we could help!",
  }

  const tones: Record<string, string> = {
    frustrated:  'empathetic',
    angry:       'de-escalating',
    urgent:      'direct',
    excited:     'energetic',
    confused:    'clear',
    satisfied:   'warm',
  }

  for (const [key, data] of Object.entries(EMOTIONAL_SIGNALS)) {
    if (data.signals.some(s => lower.includes(s.toLowerCase()))) {
      const intensity = recentFrustration > 1
        ? Math.min(data.intensity + 0.15, 1.0)
        : data.intensity

      return {
        state: data.state,
        intensity,
        urgency:                  key === 'urgent' ? 0.9 : key === 'angry' || key === 'frustrated' ? 0.6 : 0.2,
        recommended_tone:         tones[key] ?? 'warm-professional',
        response_speed:           (key === 'urgent' || key === 'frustrated' || key === 'angry') ? 'immediate' : 'normal',
        opening_acknowledgement:  openings[key],
      }
    }
  }

  return {
    state:           'neutral',
    intensity:       0.2,
    urgency:         0.1,
    recommended_tone: 'warm-professional',
    response_speed:  'normal',
  }
}

export const EMOTION_EMOJI: Record<EmotionalState, string> = {
  frustrated:     '😤',
  angry:          '😠',
  upset:          '😔',
  excited:        '🤩',
  delighted:      '😄',
  happy:          '😊',
  confused:       '🤔',
  lost:           '😕',
  uncertain:      '🤔',
  urgent:         '⚡',
  panicked:       '😰',
  satisfied:      '😌',
  grateful:       '🙏',
  neutral:        '😐',
  'business-like': '💼',
}
