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
          </View>
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUser?.displayName || 'Challenger'}
            </Text>
            <Text style={styles.userHandle}>
              @{currentUser?.username || 'guest'} • {todayFormatted}
            </Text>
          </View>
        </View>

        {/* Right side: Streak Badge & Logout Button */}
        <View style={styles.rightGroup}>
          <View style={[styles.streakIndicator, isBroken && styles.streakBroken]}>
            <Ionicons
              name={isBroken ? 'skull' : 'flame'}
              size={14}
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
            <Feather name="log-out" size={16} color="#8b949e" />
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#161b22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#30363d'
  },
  avatarEmoji: {
    fontSize: 20
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  userHandle: {
    fontSize: 11,
    color: '#8b949e',
    fontWeight: '600'
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    gap: 4
  },
  streakBroken: {
    borderColor: '#7f1d1d',
    backgroundColor: '#1a1012'
  },
  streakCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f97316'
  },
  textRed: {
    color: '#ef4444'
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d'
  }
});
