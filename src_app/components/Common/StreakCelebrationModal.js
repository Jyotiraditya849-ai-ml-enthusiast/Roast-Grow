import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../../theme';

const BURST_PARTICLES = [
  { id: 1, angle: 0, color: THEME.marigold, size: 8 },
  { id: 2, angle: 45, color: THEME.crimsonPureRed, size: 7 },
  { id: 3, angle: 90, color: THEME.marigoldLight, size: 9 },
  { id: 4, angle: 135, color: THEME.blueLight, size: 7 },
  { id: 5, angle: 180, color: THEME.marigold, size: 8 },
  { id: 6, angle: 225, color: '#ffffff', size: 6 },
  { id: 7, angle: 270, color: THEME.crimson, size: 9 },
  { id: 8, angle: 315, color: THEME.marigoldLight, size: 7 }
];

export const StreakCelebrationModal = React.memo(({
  visible,
  onClose,
  streak = 1,
  isMilestone = false
}) => {
  // Master entry animation: controls card pop and burst particles simultaneously with 100% Native Driver
  const entryAnim = useRef(new Animated.Value(0)).current;
  // Looping flame pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  const handleClose = useCallback(() => {
    if (loopRef.current) {
      loopRef.current.stop();
      loopRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    pulseAnim.stopAnimation();
    entryAnim.stopAnimation();
    if (onClose) onClose();
  }, [onClose, entryAnim, pulseAnim]);

  useEffect(() => {
    if (visible) {
      // Safe haptics feedback
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // ignore
        }
      }

      // Reset values
      entryAnim.setValue(0);
      pulseAnim.setValue(1);

      // Card pop in
      Animated.spring(entryAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true
      }).start();

      // Flame pulse loop
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.09,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      loopRef.current.start();

      // Auto-dismiss safety timer (8 seconds) so the app never freezes or traps the user
      autoCloseTimerRef.current = setTimeout(() => {
        handleClose();
      }, 8000);
    }

    return () => {
      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current = null;
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      pulseAnim.stopAnimation();
      entryAnim.stopAnimation();
    };
  }, [visible, entryAnim, pulseAnim, handleClose]);

  if (!visible) return null;

  const cardScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1]
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      hardwareAccelerated={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Full Backdrop touchable: tap outside to instantly close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Central Celebration Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: entryAnim,
              transform: [{ scale: cardScale }]
            }
          ]}
        >
          {/* Top-Right Quick Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={THEME.textMuted} />
          </TouchableOpacity>

          {/* Flame Icon with Pulse Animation & Orbit Burst Particles */}
          <View style={styles.flameOuter}>
            {/* 8 Symmetrical Hardware-Driven Burst Particles */}
            {BURST_PARTICLES.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const targetDist = 72;
              const dx = Math.cos(rad) * targetDist;
              const dy = Math.sin(rad) * targetDist;

              const partTranslateX = entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, dx]
              });
              const partTranslateY = entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, dy]
              });
              const partScale = entryAnim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 1.4, 1]
              });
              const partOpacity = entryAnim.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 0.9, 0.8]
              });

              return (
                <Animated.View
                  key={p.id}
                  style={[
                    styles.burstParticle,
                    {
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: p.color,
                      opacity: partOpacity,
                      transform: [
                        { translateX: partTranslateX },
                        { translateY: partTranslateY },
                        { scale: partScale }
                      ]
                    }
                  ]}
                />
              );
            })}

            <Animated.View
              style={[
                styles.flameContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <View style={styles.glowRing} />
              <Ionicons name="flame" size={72} color={THEME.marigold} />
            </Animated.View>
          </View>

          {/* Celebration Header */}
          <Text style={[styles.badgeLabel, streak >= 100 && styles.badgeLabelCenturion]}>
            {streak === 100
              ? '🏆 100-DAY CHALLENGE CONQUERED! 🏆'
              : streak > 100
              ? '⚡ BEYOND 100 DAYS: LEGENDARY RUN ⚡'
              : "TODAY'S STREAK UNLOCKED! 🔥"}
          </Text>
          <Text style={[styles.streakNumber, streak >= 100 && styles.streakNumberCenturion]}>
            DAY {streak} {streak >= 100 ? '👑' : ''}
          </Text>

          {/* Subtitle / Fulfillment check */}
          <View style={styles.requirementsMetBox}>
            <View style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={17} color="#22c55e" />
              <Text style={styles.reqText} numberOfLines={1}>Today's Supreme Mission Conquered</Text>
            </View>
            <View style={styles.reqRow}>
              <Ionicons name="checkmark-circle" size={17} color="#22c55e" />
              <Text style={styles.reqText} numberOfLines={1}>At least 3 Daily Micro-Habits Done</Text>
            </View>
          </View>

          {isMilestone && (
            <View style={[styles.milestoneBadge, streak === 100 && styles.milestoneBadgeCenturion]}>
              <Ionicons
                name={streak === 100 ? 'trophy' : 'gift'}
                size={18}
                color={streak === 100 ? '#fbbf24' : '#eab308'}
              />
              <Text style={[styles.milestoneText, streak === 100 && styles.milestoneTextCenturion]}>
                {streak === 100
                  ? '👑 100-Day Grand Milestone! +1 Freeze Coin 🪙 Added to Vault'
                  : '10-Day Milestone! +1 Freeze Coin 🪙 Added to Vault'}
              </Text>
            </View>
          )}

          <Text style={styles.affirmationText}>
            {streak === 100
              ? '"You conquered the 100-Day Challenge! What 99% of people quit, you finished. You are now officially in the elite tier."'
              : streak > 100
              ? '"Every day past Day 100 is building an empire. True mastery is continuous."'
              : '"Discipline is the bridge between your Supreme Goal and reality."'}
          </Text>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueBtn, streak >= 100 && styles.continueBtnCenturion]}
            onPress={handleClose}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {streak === 100
                ? 'ENTER THE NEXT LEVEL (DAY 101+) 🚀'
                : streak > 100
                ? `KEEP CRUSHING IT (DAY ${streak + 1}) 🚀`
                : 'KEEP CRUSHING IT 🚀'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: THEME.bgCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.marigold,
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  flameOuter: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 14
  },
  burstParticle: {
    position: 'absolute',
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4
  },
  flameContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: THEME.marigoldBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  glowRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: THEME.marigoldBorder
  },
  badgeLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: THEME.marigoldLight,
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center'
  },
  badgeLabelCenturion: {
    color: '#fbbf24',
    fontSize: 13.5
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 12
  },
  streakNumberCenturion: {
    color: '#fbbf24',
    textShadowColor: 'rgba(251, 191, 36, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8
  },
  requirementsMetBox: {
    backgroundColor: '#0d1117',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  reqText: {
    fontSize: 12.5,
    color: '#f0f6fc',
    fontWeight: '600',
    flexShrink: 1
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
    marginBottom: 12,
    width: '100%'
  },
  milestoneBadgeCenturion: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#fbbf24',
    borderWidth: 1.5
  },
  milestoneText: {
    fontSize: 12,
    color: '#fde047',
    fontWeight: '700',
    flex: 1
  },
  milestoneTextCenturion: {
    color: '#fbbf24',
    fontWeight: '800'
  },
  affirmationText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#8b949e',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 17
  },
  continueBtn: {
    backgroundColor: THEME.crimson,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.marigold,
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6
  },
  continueBtnCenturion: {
    backgroundColor: '#ea580c',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.6
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.5
  }
});
