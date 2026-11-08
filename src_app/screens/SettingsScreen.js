import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_KEYS,
  saveFreezeCoins,
  getFreezeCoins,
  getRemindersExpandedPreference,
  saveRemindersExpandedPreference
} from '../storage/asyncStorage';
import { useStreak } from '../context/StreakContext';
import { useAuth } from '../context/AuthContext';
import { useCyberNotification } from '../context/NotificationContext';
import { FreezeCoinStore } from '../components/Store/FreezeCoinStore';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../theme';

export const SettingsScreen = React.memo(() => {
  const { showCyberNotification, showCyberDialog } = useCyberNotification();
  const {
    challenge,
    freezeCoins,
    activateFreezeShield,
    resetStreak,
    simulateMissedDay,
    initApp,
    sendInstantTestNotification
  } = useStreak();

  const { currentUser, logout, savedAccounts, switchAccount, updatePin } = useAuth();

  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isRemindersExpanded, setIsRemindersExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadRemindersState = async () => {
      try {
        const saved = await getRemindersExpandedPreference();
        if (isMounted && typeof saved === 'boolean') {
          setIsRemindersExpanded(saved);
        }
      } catch (e) {
        // Fallback default: collapsed (false)
      }
    };
    loadRemindersState();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleReminders = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRemindersExpanded((prev) => {
      const nextState = !prev;
      saveRemindersExpandedPreference(nextState);
      return nextState;
    });
  }, []);

  // In-app PIN management state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const handleOpenPinModal = () => {
    setNewPinInput('');
    setConfirmPinInput('');
    setPinError(null);
    setPinModalVisible(true);
  };

  const handleSavePin = async () => {
    setPinError(null);
    if (newPinInput.trim() && newPinInput.trim() !== confirmPinInput.trim()) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsSavingPin(true);
    try {
      await updatePin(newPinInput.trim());
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPinModalVisible(false);
      showCyberNotification({
        type: 'success',
        title: 'Security PIN Updated! 🔒',
        message: newPinInput.trim()
          ? 'Your new Security PIN is now active on this account.'
          : 'Security PIN has been removed. You can now log in without a PIN.',
        hudTag: '[SECURITY // PIN_UPDATED]'
      });
    } catch (err) {
      setPinError(err.message || 'Failed to update PIN.');
    } finally {
      setIsSavingPin(false);
    }
  };

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
      showCyberNotification({
        type: 'success',
        title: 'API Key Saved 🔑',
        message: 'LLM API key updated successfully in secure vault storage.',
        hudTag: '[VAULT // KEY_STORED]'
      });
    } catch (e) {
      showCyberNotification({
        type: 'error',
        title: 'Storage Error ⚠️',
        message: 'Failed to save API key.',
        hudTag: '[SYSTEM // ERROR]'
      });
    }
  };

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
      message: `Log out of @${currentUser?.username}? Your streak progress remains safe locally.`,
      confirmText: 'LOG OUT',
      cancelText: 'ABORT',
      isDestructive: true,
      hudTag: '[AUTH // LOGOUT_GATE]',
      onConfirm: doLogout
    });
  };

  const handleSimulateMissedDay = () => {
    showCyberDialog({
      type: 'warning',
      title: 'Simulate Missed Day? ⚠️',
      message: 'This shifts your last active date 3 days into the past. It triggers calendar validation: auto-consuming a Freeze Coin if available, or resetting your streak to 0 and triggering AI Roast Mode!',
      confirmText: 'TRIGGER SIMULATION',
      cancelText: 'ABORT',
      isDestructive: true,
      hudTag: '[SIMULATION // PROTOCOL]',
      onConfirm: async () => {
        await simulateMissedDay();
        showCyberNotification({
          type: 'warning',
          title: 'Simulation Executed ⚡',
          message: 'Check Dashboard for the updated streak and AI reaction!',
          hudTag: '[SIMULATION // COMPLETE]'
        });
      }
    });
  };

  const handleAddTestCoin = async () => {
    const current = await getFreezeCoins();
    await saveFreezeCoins(current + 1);
    await initApp();
    showCyberNotification({
      type: 'coin',
      title: 'Coin Added 🪙',
      message: 'Added 1 test Freeze Coin to your vault.',
      hudTag: '[VAULT // TEST_CREDIT]'
    });
  };

  const handleTestNotification = async () => {
    if (Platform.OS === 'web') {
      showCyberNotification({
        type: 'info',
        title: 'Web Preview Mode 🌐',
        message: 'Notifications run natively on Android & iOS mobile devices.',
        hudTag: '[SYSTEM // PLATFORM_INFO]'
      });
      return;
    }
    const sent = await sendInstantTestNotification();
    if (sent) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      showCyberNotification({
        type: 'push',
        title: 'Notification Triggered 🔔',
        message: 'Dispatched instant reminder! Notification received in-app & device tray.',
        hudTag: '[COMMS // ALERT_DISPATCHED]'
      });
    } else {
      showCyberNotification({
        type: 'warning',
        title: 'Permission Denied 🚫',
        message: 'Please enable notifications for Roast & Grow in device settings.',
        hudTag: '[PERMISSIONS // DENIED]'
      });
    }
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

          {/* Security PIN status & manage */}
          <View style={styles.pinManageRow}>
            <View style={styles.pinStatusLeft}>
              <Ionicons
                name={currentUser?.pin ? 'lock-closed' : 'lock-open-outline'}
                size={16}
                color={currentUser?.pin ? '#22c55e' : '#8b949e'}
              />
              <Text style={[styles.pinStatusText, currentUser?.pin && styles.pinStatusTextActive]}>
                {currentUser?.pin ? 'Security PIN Active' : 'No PIN Lock'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePinBtn}
              onPress={handleOpenPinModal}
              activeOpacity={0.8}
            >
              <Ionicons name="key-outline" size={13} color="#f97316" />
              <Text style={styles.changePinBtnText}>
                {currentUser?.pin ? 'Change / Remove PIN' : '+ Set PIN'}
              </Text>
            </TouchableOpacity>
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

        {/* Smart Notifications & Reminders (Collapsible) */}
        <View style={styles.remindersSectionCard}>
          <TouchableOpacity
            style={styles.remindersHeaderRow}
            onPress={toggleReminders}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: isRemindersExpanded }}
            accessibilityLabel="Smart Reminders & Alerts, 3 daily reminders on"
          >
            <View style={styles.remindersHeaderContent}>
              <View style={styles.remindersTitleRow}>
                <Ionicons name="notifications" size={18} color="#f97316" />
                <Text style={styles.remindersTitleText}>Smart Reminders & Alerts</Text>
                <View style={styles.remindersStatusBadge}>
                  <View style={styles.remindersStatusDot} />
                  <Text style={styles.remindersStatusText}>3 daily reminders on</Text>
                </View>
              </View>
              <Text style={styles.remindersArrow}>{isRemindersExpanded ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {isRemindersExpanded && (
            <View style={styles.remindersExpandedContent}>
              <Text style={styles.sectionSubtitle}>
                Automated daily reminders (3x a day) and Supreme Goal countdown alerts.
              </Text>

              {/* 3 Daily Reminders */}
              <View style={styles.notifGroup}>
                <Text style={styles.notifGroupTitle}>📅 DAILY STREAK REMINDERS (3X)</Text>
                
                <View style={styles.notifItem}>
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>09:00 AM</Text>
                  </View>
                  <View style={styles.notifDetails}>
                    <Text style={styles.notifName}>🌅 Morning Kickoff</Text>
                    <Text style={styles.notifDesc}>Set & start today's Supreme Mission and Micro-Habits.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>

                <View style={styles.notifItem}>
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>02:30 PM</Text>
                  </View>
                  <View style={styles.notifDetails}>
                    <Text style={styles.notifName}>⚡ Midday Momentum Check</Text>
                    <Text style={styles.notifDesc}>Keep the discipline going before evening sets in.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>

                <View style={styles.notifItem}>
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>08:30 PM</Text>
                  </View>
                  <View style={styles.notifDetails}>
                    <Text style={styles.notifName}>🚨 Final Streak Warning</Text>
                    <Text style={styles.notifDesc}>Midnight deadline warning to protect your day streak.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>
              </View>

              {/* Supreme Goal Deadline Alerts */}
              <View style={styles.notifGroup}>
                <Text style={styles.notifGroupTitle}>🎯 SUPREME GOAL DEADLINE ALERTS</Text>

                <View style={styles.notifItem}>
                  <View style={[styles.notifBadge, styles.notifBadgeGold]}>
                    <Text style={[styles.notifBadgeText, styles.notifBadgeGoldText]}>30 Days</Text>
                  </View>
                  <View style={styles.notifDetails}>
                    <Text style={styles.notifName}>⏳ 1 Month Warning</Text>
                    <Text style={styles.notifDesc}>Review roadmap milestones 1 month before deadline.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>

                <View style={styles.notifItem}>
                  <View style={[styles.notifBadge, styles.notifBadgeOrange]}>
                    <Text style={[styles.notifBadgeText, styles.notifBadgeOrangeText]}>7 Days</Text>
                  </View>
                  <View style={styles.notifDetails}>
                    <Text style={styles.notifName}>🚨 1 Week Alert</Text>
                    <Text style={styles.notifDesc}>Final 7-day push alert before goal target date.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>

                <View style={styles.notifItem}>
                  <View style={[styles.notifBadge, styles.notifBadgeRed]}>
                    <Text style={[styles.notifBadgeText, styles.notifBadgeRedText]}>Final Day</Text>
                  </View>
                  <View style={styles.notifDetails}>
                    <Text style={styles.notifName}>🔥 Deadline Day</Text>
                    <Text style={styles.notifDesc}>Ultimate victory day call-to-action at 9:00 AM.</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>
              </View>

              {/* Test Notification Button */}
              <TouchableOpacity
                style={styles.testNotificationBtn}
                onPress={handleTestNotification}
                activeOpacity={0.8}
              >
                <Ionicons name="paper-plane" size={16} color="#ffffff" />
                <Text style={styles.testNotificationBtnText}>Send Test Notification (Now)</Text>
              </TouchableOpacity>
            </View>
          )}
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
              showCyberDialog({
                type: 'warning',
                title: 'Reset Streak to 0? ⚠️',
                message: 'Are you sure you want to manually reset your streak to 0? This cannot be undone.',
                confirmText: 'RESET TO 0',
                cancelText: 'ABORT',
                isDestructive: true,
                hudTag: '[MANUAL_OVERRIDE // RESET]',
                onConfirm: async () => {
                  await resetStreak();
                  showCyberNotification({
                    type: 'warning',
                    title: 'Streak Reset to 0',
                    message: 'Challenger counter set to 0. Time to rebuild!',
                    hudTag: '[REBOOT // STREAK_RESET]'
                  });
                }
              });
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

      {/* In-App Security PIN Update Modal */}
      <Modal
        visible={pinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="shield-checkmark" size={20} color="#f97316" />
              </View>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Security PIN Setting</Text>
                <Text style={styles.modalSubtitle}>@{currentUser?.username}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPinModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#8b949e" />
              </TouchableOpacity>
            </View>

            {pinError && (
              <View style={styles.modalErrorBanner}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.modalErrorText}>{pinError}</Text>
              </View>
            )}

            <Text style={styles.modalInstructionText}>
              Enter a new 4-digit PIN to lock your account on app start. Leave blank if you want to remove the PIN lock.
            </Text>

            <Text style={styles.modalInputLabel}>New PIN (4 digits)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 1234 (blank to remove)"
              placeholderTextColor="#6e7681"
              value={newPinInput}
              onChangeText={setNewPinInput}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
            />

            {newPinInput.length > 0 && (
              <>
                <Text style={styles.modalInputLabel}>Confirm New PIN</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Re-enter 4-digit PIN"
                  placeholderTextColor="#6e7681"
                  value={confirmPinInput}
                  onChangeText={setConfirmPinInput}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </>
            )}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSavingPin && styles.disabledBtn]}
                onPress={handleSavePin}
                disabled={isSavingPin}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isSavingPin ? 'Saving...' : 'Save PIN 🔒'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgApp
  },
  scrollContent: {
    paddingBottom: 40
  },
  accountCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 12,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    overflow: 'hidden',
    shadowColor: THEME.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
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
    backgroundColor: THEME.bgInput,
    borderWidth: 1.5,
    borderColor: THEME.blueLight,
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
    color: THEME.textWhite
  },
  accountHandle: {
    fontSize: 13,
    color: THEME.marigoldLight,
    fontWeight: '700'
  },
  accountDate: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 63, 0.12)',
    borderWidth: 1.5,
    borderColor: THEME.crimsonPureRed,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8
  },
  logoutButtonText: {
    color: THEME.crimsonPureRed,
    fontSize: 13,
    fontWeight: '800'
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
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e2636',
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 4
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12
  },
  input: {
    backgroundColor: '#090d14',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2d3748',
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
  remindersSectionCard: {
    backgroundColor: '#111620',
    borderRadius: 20,
    marginHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e2636',
    overflow: 'hidden'
  },
  remindersHeaderRow: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  remindersHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  remindersTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  remindersTitleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.2
  },
  remindersStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    gap: 5
  },
  remindersStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e'
  },
  remindersStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ade80'
  },
  remindersArrow: {
    fontSize: 14,
    fontWeight: '900',
    color: '#f97316',
    marginLeft: 6
  },
  remindersExpandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  notifGroup: {
    marginBottom: 14
  },
  notifGroupTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#8b949e',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262d',
    marginBottom: 6,
    gap: 10
  },
  notifBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)'
  },
  notifBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#f97316'
  },
  notifBadgeGold: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)'
  },
  notifBadgeGoldText: {
    color: '#eab308'
  },
  notifBadgeOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  notifBadgeOrangeText: {
    color: '#f59e0b'
  },
  notifBadgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)'
  },
  notifBadgeRedText: {
    color: '#ef4444'
  },
  notifDetails: {
    flex: 1
  },
  notifName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f0f6fc',
    marginBottom: 1
  },
  notifDesc: {
    fontSize: 10.5,
    color: '#8b949e',
    lineHeight: 14
  },
  testNotificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6
  },
  testNotificationBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
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
  },
  pinManageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090d14',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e2636',
    marginBottom: 12
  },
  pinStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  pinStatusText: {
    fontSize: 12,
    color: '#8b949e',
    fontWeight: '600'
  },
  pinStatusTextActive: {
    color: '#22c55e',
    fontWeight: '700'
  },
  changePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)'
  },
  changePinBtnText: {
    fontSize: 11.5,
    color: '#f97316',
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 10, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111620',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.45)',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitleWrap: {
    flex: 1
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc'
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  modalCloseBtn: {
    padding: 4
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8
  },
  modalErrorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  modalInstructionText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6
  },
  modalInput: {
    backgroundColor: '#090d14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#1e2636',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  modalCancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700'
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fb923c'
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  disabledBtn: {
    opacity: 0.6
  }
});
