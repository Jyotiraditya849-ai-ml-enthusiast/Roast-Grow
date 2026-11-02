import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const FreezeCoinStore = ({
  freezeCoins,
  onActivateShield,
  currentStreak
}) => {
  const [isActivating, setIsActivating] = useState(false);

  const handleSpend = async () => {
    if (freezeCoins <= 0) {
      Alert.alert(
        'Out of Freeze Coins 🥶',
        'You need at least 1 Freeze Coin to activate streak immunity. Keep your streak going to earn more!'
      );
      return;
    }

    Alert.alert(
      'Activate Freeze Shield? ❄️',
      'Spending 1 Freeze Coin will safeguard your streak for today, ensuring your day counter is never reset to 0 even if you miss tasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spend 1 Coin',
          style: 'default',
          onPress: async () => {
            setIsActivating(true);
            try {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              const res = await onActivateShield();
              if (res.success) {
                Alert.alert('Shield Activated! ❄️', 'Your streak is fully protected.');
              } else {
                Alert.alert('Notice', res.message || 'Could not activate shield.');
              }
            } finally {
              setIsActivating(false);
            }
          }
        }
      ]
    );
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
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  vaultCard: {
    backgroundColor: '#0c1a24',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    marginBottom: 16
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
    backgroundColor: '#03344d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  balanceNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#38bdf8'
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b949e',
    letterSpacing: 1
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  disabledButton: {
    backgroundColor: '#1f2937',
    opacity: 0.6
  },
  activateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  rulesCard: {
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc',
    marginBottom: 14
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

