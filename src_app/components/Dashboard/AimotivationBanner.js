import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export const AimotivationBanner = ({
  message,
  type = 'hype', // 'hype' | 'roast'
  isLoading = false,
  onRefresh,
  onCheckInNow
}) => {
  const isRoast = type === 'roast';

  return (
    <View style={[styles.container, isRoast ? styles.roastContainer : styles.hypeContainer]}>
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={[styles.badgePill, isRoast ? styles.roastBadgePill : styles.hypeBadgePill]}>
          <MaterialCommunityIcons
            name={isRoast ? 'fire-alert' : 'lightning-bolt'}
            size={16}
            color={isRoast ? '#ef4444' : '#f59e0b'}
          />
          <Text style={[styles.badgeText, isRoast ? styles.roastBadgeText : styles.hypeBadgeText]}>
            {isRoast ? 'AI DRILL SERGEANT ROAST' : 'AI HYPED MOTIVATION'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isLoading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#f59e0b" />
          ) : (
            <View style={styles.refreshIconBox}>
              <Ionicons name="sparkles" size={14} color={isRoast ? '#ef4444' : '#f59e0b'} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Message Body */}
      <View style={styles.messageBox}>
        <Text style={[styles.quoteMark, isRoast ? { color: '#ef4444' } : { color: '#f59e0b' }]}>“</Text>
        <Text style={[styles.messageText, isRoast ? styles.roastText : styles.hypeText]}>
          {message}
        </Text>
      </View>

      {/* Action CTA if Roast Mode */}
      {isRoast && onCheckInNow && (
        <TouchableOpacity
          style={styles.roastCta}
          onPress={onCheckInNow}
          activeOpacity={0.8}
        >
          <Ionicons name="flame" size={16} color="#ffffff" />
          <Text style={styles.roastCtaText}>Prove AI Wrong: Check-in Now 🔥</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  hypeContainer: {
    backgroundColor: '#16130b',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: '#f59e0b'
  },
  roastContainer: {
    backgroundColor: '#1a0b0f',
    borderColor: 'rgba(239, 68, 68, 0.45)',
    shadowColor: '#ef4444'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1
  },
  hypeBadgePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  roastBadgePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1
  },
  hypeBadgeText: {
    color: '#f59e0b'
  },
  roastBadgeText: {
    color: '#ef4444'
  },
  refreshButton: {
    padding: 2
  },
  refreshIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4
  },
  quoteMark: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 24,
    marginTop: -2
  },
  messageText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '700',
    fontStyle: 'italic'
  },
  hypeText: {
    color: '#fef3c7'
  },
  roastText: {
    color: '#fee2e2'
  },
  roastCta: {
    backgroundColor: '#dc2626',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3
  },
  roastCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900'
  }
});

