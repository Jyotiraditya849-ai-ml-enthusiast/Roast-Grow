import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#f97316', '#eab308', '#38bdf8', '#22c55e', '#a855f7', '#ec4899', '#ffffff'];
const CONFETTI_COUNT = 36;

export const StreakCelebrationModal = ({
  visible,
  onClose,
  streak = 1,
  isMilestone = false
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Generate randomized confetti elements
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateY: new Animated.Value(-50),
      translateX: (Math.random() - 0.5) * 80,
      startX: Math.random() * SCREEN_WIDTH,
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 6,
      duration: Math.random() * 1800 + 1800,
      delay: Math.random() * 400
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset values
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      pulseAnim.setValue(1);

      // Card pop in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true
        })
      ]).start();

      // Continuous pulse for the flame/badge
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();

      // Drop confetti
      const dropAnimations = confettiAnims.map((item) => {
        item.translateY.setValue(-50);
        item.rotate.setValue(0);
        return Animated.parallel([
          Animated.timing(item.translateY, {
            toValue: SCREEN_HEIGHT + 60,
            duration: item.duration,
            delay: item.delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(item.rotate, {
            toValue: 1,
            duration: item.duration,
            delay: item.delay,
            useNativeDriver: true
          })
        ]);
      });

      Animated.parallel(dropAnimations).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Confetti Particles */}
        {confettiAnims.map((c, i) => {
          const spin = c.rotate.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg']
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: c.startX,
                  width: c.size,
                  height: c.size * 1.4,
                  backgroundColor: c.color,
                  transform: [
                    { translateY: c.translateY },
                    { translateX: c.translateX },
                    { rotate: spin }
                  ]
                }
              ]}
            />
          );
        })}

        {/* Central Celebration Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Flame Icon with Pulse Animation */}
          <Animated.View
            style={[
              styles.flameContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.glowRing} />
            <Ionicons name="flame" size={76} color="#f97316" />
          </Animated.View>

          {/* Celebration Header */}
          <Text style={styles.badgeLabel}>TODAY'S STREAK UNLOCKED! 🔥</Text>
          <Text style={styles.streakNumber}>DAY {streak}</Text>

          {/* Subtitle / Fulfillment check */}
          <View style={styles.requirementsMetBox}>
            <View style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.reqText}>Today's Supreme Mission Conquered</Text>
            </View>
            <View style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.reqText}>At least 3 Daily Micro-Habits Done</Text>
            </View>
          </View>

          {isMilestone && (
            <View style={styles.milestoneBadge}>
              <Ionicons name="gift" size={18} color="#eab308" />
              <Text style={styles.milestoneText}>
                10-Day Milestone! +1 Freeze Coin 🪙 Added to Vault
              </Text>
            </View>
          )}

          <Text style={styles.affirmationText}>
            "Discipline is the bridge between your Supreme Goal and reality."
          </Text>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>KEEP CRUSHING IT 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 3
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161b22',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20
  },
  flameContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#2b1407',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  glowRing: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.4)'
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f97316',
    letterSpacing: 1.5,
    marginBottom: 4
  },
  streakNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 14
  },
  requirementsMetBox: {
    backgroundColor: '#0d1117',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reqText: {
    fontSize: 13,
    color: '#f0f6fc',
    fontWeight: '600'
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    width: '100%'
  },
  milestoneText: {
    fontSize: 12,
    color: '#fde047',
    fontWeight: '700',
    flex: 1
  },
  affirmationText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#8b949e',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  continueBtn: {
    backgroundColor: '#f97316',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});

