import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function KPICard({ label, value, trend, trendValue }: KPICardProps) {
  const trendColor = trend === 'up' ? '#4ade80' : trend === 'down' ? '#ef4444' : '#6b7280';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{typeof value === 'number' ? value.toLocaleString() : value}</Text>
      {trend && trendValue && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
          <Text style={[styles.trendText, { color: trendColor }]}>{trendValue}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    flex: 1,
    minWidth: '45%',
  },
  label: {
    color: '#444',
    fontSize: 11,
    marginBottom: 6,
  },
  value: {
    color: '#C9A84C',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
