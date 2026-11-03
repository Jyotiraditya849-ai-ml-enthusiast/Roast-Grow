import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';

export const Header = ({ currentStreak, isBroken }) => {
  const { currentUser, logout } = useAuth();

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleLogout = () => {
    const doLogout = async () => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await logout();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Log out of @${currentUser?.username || 'account'}?`)) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        `Are you sure you want to log out of @${currentUser?.username || 'your account'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: doLogout }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* User Identity / Avatar */}
        <View style={styles.leftGroup}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarEmoji}>{currentUser?.avatar || '🔥'}</Text>
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
              @{currentUser?.username || 'guest'} • {todayFormatted}
            </Text>
          </View>
        </View>

        {/* Right side: Streak Badge & Logout Button */}
        <View style={styles.rightGroup}>
          <View style={[styles.streakIndicator, isBroken && styles.streakBroken]}>
            <Ionicons
              name={isBroken ? 'skull' : 'flame'}
              size={16}
              color={isBroken ? '#ef4444' : '#f97316'}
            />
            <Text style={[styles.streakCountText, isBroken && styles.textRed]}>
              {currentStreak}d
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            title="Log Out"
          >
            <Feather name="log-out" size={15} color="#8b949e" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0d1117',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : Platform.OS === 'web' ? 12 : 0
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#21262d'
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
    backgroundColor: '#161b22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    position: 'relative'
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
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0d1117'
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  userName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2
  },
  proBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#f97316',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  proBadgeText: {
    color: '#f97316',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  userHandle: {
    fontSize: 11,
    color: '#8b949e',
    fontWeight: '600',
    marginTop: 1
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.6)',
    gap: 5
  },
  streakBroken: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)'
  },
  streakCountText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#f97316'
  },
  textRed: {
    color: '#ef4444'
  },
  logoutBtn: {
    padding: 9,
    borderRadius: 12,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d'
  }
});
