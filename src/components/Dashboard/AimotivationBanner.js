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
        <View style={styles.badgeRow}>
          <MaterialCommunityIcons
            name={isRoast ? 'fire-alert' : 'lightning-bolt-circle'}
            size={18}
            color={isRoast ? '#f87171' : '#fbbf24'}
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
            <ActivityIndicator size="small" color="#8b949e" />
          ) : (
            <Ionicons name="refresh" size={16} color="#8b949e" />
          )}
        </TouchableOpacity>
      </View>

      {/* Message Body */}
      <Text style={[styles.messageText, isRoast ? styles.roastText : styles.hypeText]}>
        "{message}"
      </Text>

      {/* Action CTA if Roast Mode */}
      {isRoast && onCheckInNow && (
        <TouchableOpacity
          style={styles.roastCta}
          onPress={onCheckInNow}
          activeOpacity={0.8}
        >
          <Text style={styles.roastCtaText}>Prove AI Wrong: Check-in Now 🔥</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1.5
  },
  hypeContainer: {
    backgroundColor: '#1c1917',
    borderColor: '#d97706'
  },
  roastContainer: {
    backgroundColor: '#200e12',
    borderColor: '#dc2626'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  hypeBadgeText: {
    color: '#fbbf24'
  },
  roastBadgeText: {
    color: '#f87171'
  },
  refreshButton: {
    padding: 4
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    fontStyle: 'italic'
  },
  hypeText: {
    color: '#fef3c7'
  },
  roastText: {
    color: '#fecaca'
  },
  roastCta: {
    backgroundColor: '#dc2626',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  roastCtaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  }
});

