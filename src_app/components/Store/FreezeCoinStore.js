import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCyberNotification } from '../../context/NotificationContext';

export const FreezeCoinStore = ({
  freezeCoins,
  onActivateShield,
  currentStreak
}) => {
  const [isActivating, setIsActivating] = useState(false);
  const { showCyberNotification, showCyberDialog } = useCyberNotification();

  const handleSpend = async () => {
    if (freezeCoins <= 0) {
      showCyberNotification({
        type: 'warning',
        title: 'Out of Freeze Coins 🥶',
        message: 'You need at least 1 Freeze Coin to activate streak immunity. Keep your streak going to earn more!',
        hudTag: '[VAULT // ZERO_BALANCE]'
      });
      return;
    }

    showCyberDialog({
      type: 'freeze',
      title: 'Activate Freeze Shield? ❄️',
      message: 'Spending 1 Freeze Coin will safeguard your streak for today, ensuring your day counter is never reset to 0 even if you miss tasks.',
      confirmText: 'SPEND 1 COIN',
      cancelText: 'ABORT',
      hudTag: '[VAULT // SHIELD_ACTIVATION]',
      onConfirm: async () => {
        setIsActivating(true);
        try {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          const res = await onActivateShield();
          if (res.success) {
            showCyberNotification({
              type: 'freeze',
              title: 'Shield Activated! ❄️',
              message: 'Defense matrix online. Your day streak is fully protected for 24 hours.',
              hudTag: '[DEFENSE // SHIELD_ONLINE]'
            });
          } else {
            showCyberNotification({
              type: 'warning',
              title: 'Shield Activation Notice',
              message: res.message || 'Could not activate shield.',
              hudTag: '[DEFENSE // NOTICE]'
            });
          }
        } finally {
          setIsActivating(false);
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Vault Card */}
      <View style={styles.vaultCard}>
        <View style={styles.balanceRow}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="snowflake" size={28} color="#38bdf8" />
          </View>
          <View>
            <Text style={styles.balanceNumber}>{freezeCoins}</Text>
            <Text style={styles.balanceLabel}>FREEZE COINS AVAILABLE</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.activateButton, freezeCoins <= 0 && styles.disabledButton]}
          onPress={handleSpend}
          disabled={isActivating || freezeCoins <= 0}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="shield-sun" size={18} color="#ffffff" />
          <Text style={styles.activateButtonText}>
            {freezeCoins > 0 ? 'Activate 24hr Freeze Shield (1 Coin)' : 'No Coins in Vault'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rules & Milestones Card */}
      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>Gamification Protocol</Text>

        <View style={styles.ruleItem}>
          <Ionicons name="flame" size={18} color="#f97316" style={styles.ruleIcon} />
          <View style={styles.ruleTextGroup}>
            <Text style={styles.ruleHeading}>Earn 1 Coin per 10 Days</Text>
            <Text style={styles.ruleDescription}>
              For every 10 consecutive days of strict check-ins, you automatically forge 1 Freeze Coin in your vault.
            </Text>
          </View>
        </View>

        <View style={styles.ruleItem}>
          <FontAwesome5 name="shield-alt" size={16} color="#38bdf8" style={styles.ruleIcon} />
          <View style={styles.ruleTextGroup}>
            <Text style={styles.ruleHeading}>Automatic Missed-Day Protection</Text>
            <Text style={styles.ruleDescription}>
              If you miss a calendar day due to travel or illness, the system automatically burns 1 Freeze Coin to prevent your streak resetting to 0.
            </Text>
          </View>
        </View>

        <View style={styles.ruleItem}>
          <Ionicons name="skull" size={18} color="#ef4444" style={styles.ruleIcon} />
          <View style={styles.ruleTextGroup}>
            <Text style={styles.ruleHeading}>Strict Zero-Tolerance Reset</Text>
            <Text style={styles.ruleDescription}>
              If a calendar day passes without a check-in and your coin balance is 0, the streak immediately drops to 0, and AI Roast Mode triggers.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  vaultCard: {
    backgroundColor: '#0a1622',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    marginBottom: 16,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38bdf8'
  },
  balanceNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#38bdf8'
  },
  balanceLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.2
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38bdf8',
    gap: 8,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4
  },
  disabledButton: {
    backgroundColor: '#16202c',
    borderColor: '#1e293b',
    opacity: 0.6,
    shadowOpacity: 0
  },
  activateButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  rulesCard: {
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e2636'
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.2,
    marginBottom: 16
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12
  },
  ruleIcon: {
    marginTop: 2
  },
  ruleTextGroup: {
    flex: 1
  },
  ruleHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0f6fc',
    marginBottom: 2
  },
  ruleDescription: {
    fontSize: 12,
    color: '#8b949e',
    lineHeight: 18
  }
});

