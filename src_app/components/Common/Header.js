import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCyberNotification } from '../../context/NotificationContext';
import * as Haptics from 'expo-haptics';
import { THEME } from '../../theme';

export const Header = React.memo(({ currentStreak, isBroken }) => {
  const { currentUser, logout } = useAuth();
  const { showCyberDialog } = useCyberNotification();

  const isPureRed = isBroken || currentStreak === 0;

  const handleLogout = () => {
    const doLogout = async () => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await logout();
    };

    showCyberDialog({
      type: 'warning',
      title: 'Log Out Challenger?',
      message: `Log out of @${currentUser?.username || 'your account'}? Your streak progress remains safe locally.`,
      confirmText: 'LOG OUT',
      cancelText: 'ABORT',
      isDestructive: true,
      hudTag: '[AUTH // LOGOUT_GATE]',
      onConfirm: doLogout
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* User Identity / Avatar */}
        <View style={styles.leftGroup}>
          <View style={[styles.avatarBadge, isPureRed && styles.avatarBadgeRed]}>
            <Text style={styles.avatarEmoji}>{currentUser?.avatar || '⚡'}</Text>
            <View style={styles.avatarOnlineDot} />
          </View>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {currentUser?.displayName || 'Challenger'}
              </Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.userHandle} numberOfLines={1}>
              @{currentUser?.username || 'jyotiraditya_369'}
            </Text>
          </View>
        </View>

        {/* Right side: Streak Badge & Logout Button */}
        <View style={styles.rightGroup}>
          <View
            style={[
              styles.streakIndicator,
              isPureRed ? styles.streakBrokenRed : styles.streakIndicatorActive
            ]}
          >
            <Ionicons
              name={isPureRed ? 'skull' : 'flame'}
              size={15}
              color={isPureRed ? THEME.crimsonPureRed : THEME.marigold}
            />
            <Text
              style={[
                styles.streakCountText,
                isPureRed ? styles.textPureRed : styles.textActive
              ]}
            >
              {currentStreak}d
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            title="Log Out"
          >
            <Feather name="log-out" size={15} color={THEME.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: THEME.bgApp,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : Platform.OS === 'web' ? 12 : 0
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderColor: THEME.borderSubtle,
    backgroundColor: THEME.bgApp
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: THEME.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.blue,
    position: 'relative',
    shadowColor: THEME.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3
  },
  avatarBadgeRed: {
    borderColor: THEME.crimsonPureRed,
    shadowColor: THEME.crimsonPureRed
  },
  avatarEmoji: {
    fontSize: 22
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.success,
    borderWidth: 2,
    borderColor: THEME.bgApp
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  userName: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.textWhite,
    letterSpacing: -0.2
  },
  proBadge: {
    backgroundColor: THEME.marigoldBg,
    borderWidth: 1.2,
    borderColor: THEME.marigold,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  proBadgeText: {
    color: THEME.marigoldLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  userHandle: {
    fontSize: 11,
    color: THEME.blueLight,
    fontWeight: '700',
    marginTop: 1,
    letterSpacing: 0.3
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 5
  },
  streakIndicatorActive: {
    backgroundColor: THEME.crimsonBg,
    borderColor: THEME.crimson
  },
  streakBrokenRed: {
    borderColor: THEME.crimsonPureRed,
    backgroundColor: 'rgba(255, 0, 63, 0.16)'
  },
  streakCountText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  textPureRed: {
    color: THEME.crimsonPureRed
  },
  textActive: {
    color: THEME.marigoldLight
  },
  logoutBtn: {
    padding: 9,
    borderRadius: 12,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  }
});
