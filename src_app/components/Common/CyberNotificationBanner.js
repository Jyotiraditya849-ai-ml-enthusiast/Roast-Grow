import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  PanResponder,
  Easing,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCyberNotification } from '../../context/NotificationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEMES = {
  streak: {
    primary: '#f97316',
    glow: 'rgba(249, 115, 22, 0.5)',
    bgDark: '#120b06',
    tag: '[PROTOCOL // STREAK_ACTIVE]',
    IconLib: Ionicons,
    iconName: 'flame'
  },
  flame: {
    primary: '#f97316',
    glow: 'rgba(249, 115, 22, 0.5)',
    bgDark: '#120b06',
    tag: '[PROTOCOL // STREAK_ACTIVE]',
    IconLib: Ionicons,
    iconName: 'flame'
  },
  success: {
    primary: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.5)',
    bgDark: '#06130b',
    tag: '[CORE // DISCIPLINE_LOCKED]',
    IconLib: Ionicons,
    iconName: 'shield-checkmark'
  },
  locked: {
    primary: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.5)',
    bgDark: '#06130b',
    tag: '[CORE // DISCIPLINE_LOCKED]',
    IconLib: Ionicons,
    iconName: 'lock-closed'
  },
  warning: {
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.5)',
    bgDark: '#160809',
    tag: '[SYSTEM_ALERT // CRITICAL]',
    IconLib: Ionicons,
    iconName: 'warning'
  },
  alert: {
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.5)',
    bgDark: '#160809',
    tag: '[SYSTEM_ALERT // WARNING]',
    IconLib: Ionicons,
    iconName: 'warning'
  },
  error: {
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.5)',
    bgDark: '#160809',
    tag: '[ERROR // ACCESS_DENIED]',
    IconLib: Ionicons,
    iconName: 'alert-circle'
  },
  freeze: {
    primary: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.5)',
    bgDark: '#061019',
    tag: '[DEFENSE // SHIELD_MATRIX]',
    IconLib: FontAwesome5,
    iconName: 'snowflake'
  },
  coin: {
    primary: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.5)',
    bgDark: '#141106',
    tag: '[VAULT // ASSET_SECURED]',
    IconLib: FontAwesome5,
    iconName: 'coins'
  },
  push: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    bgDark: '#100818',
    tag: '[NEON_COMMS // DISPATCH]',
    IconLib: Ionicons,
    iconName: 'notifications'
  },
  info: {
    primary: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.5)',
    bgDark: '#061019',
    tag: '[HUD // SYSTEM_INFO]',
    IconLib: Ionicons,
    iconName: 'information-circle'
  }
};

export const CyberNotificationBanner = () => {
  const { currentNotification, dismissNotification } = useCyberNotification();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const currentTheme = (currentNotification && THEMES[currentNotification.type]) || THEMES.info;
  const IconComponent = currentTheme.IconLib;

  // Pan responder to handle swipe-up dismissal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 6;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30 || gestureState.vy < -0.4) {
          handleDismiss();
        } else {
          // Snap back down
          Animated.spring(translateY, {
            toValue: 0,
            friction: 6,
            tension: 50,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -160,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      dismissNotification();
    });
  };

  useEffect(() => {
    if (currentNotification) {
      // Reset values
      translateY.setValue(-160);
      opacity.setValue(0);
      progressAnim.setValue(1);

      // Slide and bounce into place
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 65,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true
        })
      ]).start();

      // Looping pulse animation for glowing icon halo
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      pulseLoop.start();

      // Countdown timer bar
      const duration = currentNotification.duration || 4500;
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration - 200,
        easing: Easing.linear,
        useNativeDriver: false // width animation requires false
      }).start();

      return () => {
        pulseLoop.stop();
      };
    }
  }, [currentNotification]);

  if (!currentNotification) return null;

  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 12 : 10);
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <Animated.View
      style={[
        styles.overlayContainer,
        {
          top: topInset,
          transform: [{ translateY }],
          opacity
        }
      ]}
      pointerEvents="box-none"
    >
      <View
        {...panResponder.panHandlers}
        style={[
          styles.cyberCard,
          {
            borderColor: currentTheme.primary + '55',
            backgroundColor: currentTheme.bgDark,
            shadowColor: currentTheme.primary
          }
        ]}
      >
        {/* Left Neon Cyber Energy Accent */}
        <View style={[styles.energyAccent, { backgroundColor: currentTheme.primary }]} />

        {/* Card Header: Monospace Tag + Close Pill */}
        <View style={styles.hudHeaderRow}>
          <View style={styles.tagWrapper}>
            <View style={[styles.tagDot, { backgroundColor: currentTheme.primary }]} />
            <Text style={[styles.tagText, { color: currentTheme.primary }]}>
              {currentNotification.hudTag || currentTheme.tag}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (currentNotification.onAction) {
              currentNotification.onAction();
            }
            handleDismiss();
          }}
          style={styles.contentRow}
        >
          {/* Glowing Icon Container with Looping Pulse */}
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.iconGlowHalo,
                {
                  borderColor: currentTheme.primary,
                  transform: [{ scale: pulseAnim }],
                  opacity: 0.6
                }
              ]}
            />
            <View
              style={[
                styles.iconCircle,
                {
                  borderColor: currentTheme.primary,
                  backgroundColor: currentTheme.primary + '22'
                }
              ]}
            >
              <IconComponent name={currentTheme.iconName} size={20} color={currentTheme.primary} />
            </View>
          </View>

          {/* Texts */}
          <View style={styles.textContainer}>
            <Text style={styles.titleText} numberOfLines={1}>
              {currentNotification.title}
            </Text>
            {Boolean(currentNotification.message) && (
              <Text style={styles.messageText} numberOfLines={3}>
                {currentNotification.message}
              </Text>
            )}

            {/* Optional Action Label */}
            {Boolean(currentNotification.actionLabel) && (
              <View style={[styles.actionBadge, { borderColor: currentTheme.primary }]}>
                <Text style={[styles.actionBadgeText, { color: currentTheme.primary }]}>
                  {currentNotification.actionLabel} →
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Countdown Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressBarWidth,
                backgroundColor: currentTheme.primary,
                shadowColor: currentTheme.primary
              }
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 16
  },
  cyberCard: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 490 : SCREEN_WIDTH - 24,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative'
  },
  energyAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4
  },
  hudHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 4
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textTransform: 'uppercase'
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
    gap: 12
  },
  iconWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconGlowHalo: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {
    flex: 1,
    gap: 3
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  messageText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500'
  },
  actionBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#090d14'
  },
  actionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2
  }
});

