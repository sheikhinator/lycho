import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ConversationCardProps {
  contactName: string;
  agentName: string;
  lastMessage: string;
  status: 'open' | 'resolved' | 'escalated';
  channel: string;
  timeAgo: string;
}

const channelIcons: Record<string, string> = {
  whatsapp: '💬',
  email: '📧',
  web: '🌐',
  telegram: '✈️',
  sms: '📱',
};

const statusColors: Record<string, string> = {
  open: '#4ade80',
  resolved: '#6b7280',
  escalated: '#ef4444',
};

export default function ConversationCard({ contactName, agentName, lastMessage, status, channel, timeAgo }: ConversationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={styles.channelIcon}>{channelIcons[channel] || '💬'}</Text>
          <View>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.agentName}>{agentName}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[status] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColors[status] }]}>{status}</Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>
      <Text style={styles.lastMessage} numberOfLines={2}>{lastMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  contactName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  agentName: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeAgo: {
    color: '#666',
    fontSize: 11,
  },
  lastMessage: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
});
