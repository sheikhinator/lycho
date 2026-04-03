import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AgentCardProps {
  name: string;
  status: 'active' | 'paused' | 'configuring';
  interactions: number;
  onDeploy?: () => void;
  onPause?: () => void;
  onChat?: () => void;
}

export default function AgentCard({ name, status, interactions, onDeploy, onPause, onChat }: AgentCardProps) {
  const statusColor = status === 'active' ? '#4ade80' : status === 'paused' ? '#fbbf24' : '#6b7280';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.interactions}>{interactions.toLocaleString()} interactions</Text>
      <View style={styles.actions}>
        {status === 'active' && (
          <>
            <TouchableOpacity style={styles.chatButton} onPress={onChat}>
              <Text style={styles.chatButtonText}>💬 Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
              <Text style={styles.pauseButtonText}>Pause</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'paused' && (
          <TouchableOpacity style={styles.deployButton} onPress={onDeploy}>
            <Text style={styles.deployButtonText}>Resume</Text>
          </TouchableOpacity>
        )}
        {status === 'configuring' && (
          <TouchableOpacity style={styles.deployButton} onPress={onDeploy}>
            <Text style={styles.deployButtonText}>Deploy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#C9A84C',
    fontWeight: '700',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#666',
    fontSize: 12,
  },
  interactions: {
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C9A84C',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chatButtonText: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '600',
  },
  pauseButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  pauseButtonText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  deployButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  deployButtonText: {
    color: '#070707',
    fontSize: 13,
    fontWeight: '700',
  },
});
