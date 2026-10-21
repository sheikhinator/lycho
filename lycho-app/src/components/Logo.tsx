import React, { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'
import Svg, { Circle, Line } from 'react-native-svg'
import { C } from '@/theme'

const SPOKES: [number, number, number, number, number][] = [
  // x1, y1, x2, y2, node radius — from public/lycho-logo.svg
  [50, 46, 50, 8, 2.8], [53, 48, 83, 27, 2.5], [53, 52, 83, 73, 2.5],
  [50, 54, 50, 92, 2.8], [47, 52, 17, 73, 2.5], [47, 48, 17, 27, 2.5],
]

/** The LYCHO mark. `animated` slowly breathes the outer rings. */
export function Logo({ size = 64, color = C.gold, animated = false }: { size?: number; color?: string; animated?: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!animated) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [animated, pulse])
  const stroke = size < 48 ? 1.6 : 1.1
  const mark = (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} stroke={color} strokeWidth={size < 48 ? 1.2 : 0.6} opacity={0.35} fill="none" />
      <Circle cx={50} cy={50} r={36} stroke={color} strokeWidth={0.4} opacity={0.2} fill="none" />
      <Circle cx={50} cy={50} r={4} fill={color} opacity={0.9} />
      {SPOKES.map(([x1, y1, x2, y2, r], i) => (
        <React.Fragment key={i}>
          <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={stroke} />
          <Circle cx={x2} cy={y2} r={r} fill={color} />
        </React.Fragment>
      ))}
    </Svg>
  )
  if (!animated) return mark
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] })
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] })
  return (
    <View>
      <Animated.View style={{ transform: [{ scale }], opacity }}>{mark}</Animated.View>
    </View>
  )
}
