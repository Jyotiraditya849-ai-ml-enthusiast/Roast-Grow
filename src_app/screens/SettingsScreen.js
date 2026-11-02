import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, saveFreezeCoins, getFreezeCoins } from '../storage/asyncStorage';
import { useStreak } from '../context/StreakContext';
import { useAuth } from '../context/AuthContext';
import { FreezeCoinStore } from '../components/Store/FreezeCoinStore';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const SettingsScreen = () => {
  const {
    challenge,
    freezeCoins,
    activateFreezeShield,
    resetStreak,
    simulateMissedDay,
    initApp
  } = useStreak();

  const { currentUser, logout, savedAccounts, switchAccount } = useAuth();

  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadKey = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.API_KEY);
      if (stored) setApiKey(stored);
    };
    loadKey();
  }, []);

  const handleSaveKey = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, apiKey.trim());
      setIsSaved(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setIsSaved(false), 3000);
      Alert.alert('Key Saved', 'LLM API key updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save API key.');
    }
  };

  const handleLogout = () => {
    const doLogout = async () => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await logout();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Log out of @${currentUser?.username}?`)) {
        doLogout();
      }
    } else {
      Alert.alert('Log Out', `Log out of @${currentUser?.username}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout }
      ]);
    }
  };

  const handleSimulateMissedDay = () => {
    Alert.alert(
      'Simulate Missed Day? ⚠️',
      'This shifts your last active date 3 days into the past. It will trigger the strict calendar check: either auto-consuming a Freeze Coin if available, or resetting your streak to 0 and triggering AI Roast Mode!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger Simulation',
          style: 'destructive',
          onPress: async () => {
            await simulateMissedDay();
            Alert.alert('Simulation Executed', 'Check the Dashboard for the updated streak and AI reaction!');
          }
        }
      ]
    );
  };

  const handleAddTestCoin = async () => {
    const current = await getFreezeCoins();
    await saveFreezeCoins(current + 1);
    await initApp();
    Alert.alert('Coin Added 🪙', 'Added 1 test Freeze Coin to your vault.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Profile Card */}
        <View style={styles.accountCard}>
          <View style={styles.accountTop}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>{currentUser?.avatar || '🔥'}</Text>
            </View>
            <View style={styles.accountDetails}>
              <Text style={styles.accountName}>{currentUser?.displayName || 'Challenger'}</Text>
              <Text style={styles.accountHandle}>@{currentUser?.username || 'user'}</Text>
              <Text style={styles.accountDate}>
                Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Today'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={16} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Log Out of @{currentUser?.username}</Text>
          </TouchableOpacity>
        </View>

        {/* Switch Account Quick List (if multiple exist) */}
        {savedAccounts.length > 1 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Switch Profile</Text>
            <Text style={styles.sectionSubtitle}>Quickly change to another challenger on this device</Text>

            {savedAccounts
              .filter((a) => a.username.toLowerCase() !== currentUser?.username.toLowerCase())
              .map((acc) => (
                <TouchableOpacity
                  key={acc.username}
                  style={styles.switchRow}
                  onPress={() => switchAccount(acc.username)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchAvatar}>{acc.avatar}</Text>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchName}>{acc.displayName}</Text>
                    <Text style={styles.switchHandle}>@{acc.username}</Text>
                  </View>
                  <Feather name="refresh-cw" size={14} color="#58a6ff" />
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Freeze Coin Store */}
        <FreezeCoinStore
          freezeCoins={freezeCoins}
          onActivateShield={activateFreezeShield}
          currentStreak={challenge.currentStreak}
        />

        {/* AI Configuration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>AI Motivation & Roast Engine</Text>
          <Text style={styles.sectionSubtitle}>
            Configure a Google Gemini API key for dynamic real-time LLM hype messages and sarcastic roasts. (Offline engine runs if left empty).
          </Text>

          <TextInput
            style={styles.input}
            placeholder="AIzaSy... (Gemini API Key)"
            placeholderTextColor="#6e7681"
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            secureTextEntry
          />

          <TouchableOpacity style={styles.saveKeyBtn} onPress={handleSaveKey} activeOpacity={0.8}>
            <Feather name={isSaved ? 'check' : 'save'} size={16} color="#ffffff" />
            <Text style={styles.saveKeyBtnText}>{isSaved ? 'Key Saved!' : 'Save API Key'}</Text>
          </TouchableOpacity>
        </View>

        {/* Developer / Testing Sandbox */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sandbox & Edge Case Testing</Text>
          <Text style={styles.sectionSubtitle}>
            Use these controls to verify strict calendar day reset logic, freeze coin protection, and AI roast reactions.
          </Text>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleSimulateMissedDay}
            activeOpacity={0.8}
          >
            <Ionicons name="time" size={18} color="#ef4444" />
            <Text style={[styles.testBtnText, { color: '#ef4444' }]}>
              Simulate Missed Day (-3 Days)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleAddTestCoin}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#38bdf8" />
            <Text style={[styles.testBtnText, { color: '#38bdf8' }]}>
              Add +1 Freeze Coin (Test Reward)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={() => {
              Alert.alert('Reset to 0?', 'Are you sure you want to manually reset the streak?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: resetStreak }
              ]);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={18} color="#8b949e" />
            <Text style={[styles.testBtnText, { color: '#8b949e' }]}>
              Manual Reset Streak to 0
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117'
  },
  scrollContent: {
    paddingBottom: 40
  },
  accountCard: {
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  accountTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16
  },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#0d1117',
    borderWidth: 1.5,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarEmoji: {
    fontSize: 28
  },
  accountDetails: {
    flex: 1
  },
  accountName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  accountHandle: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '700'
  },
  accountDate: {
    fontSize: 11,
    color: '#8b949e',
    marginTop: 2
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#200e12',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700'
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262d',
    marginTop: 8,
    gap: 12
  },
  switchAvatar: {
    fontSize: 22
  },
  switchInfo: {
    flex: 1
  },
  switchName: {
    color: '#f0f6fc',
    fontSize: 13,
    fontWeight: '700'
  },
  switchHandle: {
    color: '#8b949e',
    fontSize: 11
  },
  sectionCard: {
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8b949e',
    lineHeight: 18,
    marginBottom: 12
  },
  input: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#30363d',
    fontSize: 13,
    marginBottom: 10
  },
  saveKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#238636',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8
  },
  saveKeyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#21262d',
    marginBottom: 8,
    gap: 10
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700'
  }
});
