import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useAuth, AVATAR_OPTIONS } from '../context/AuthContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const AuthScreen = () => {
  const { login, register, resetPin, savedAccounts } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🔥');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password / PIN Recovery Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [verificationChallenge, setVerificationChallenge] = useState('');
  const [verificationInput, setVerificationInput] = useState('');
  const [forgotError, setForgotError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleOpenForgotModal = (targetUser = null) => {
    const defaultUser = targetUser || username || (savedAccounts[0]?.username || '');
    setForgotUsername(defaultUser);
    setForgotNewPin('');
    setForgotConfirmPin('');
    setVerificationInput('');
    setVerificationChallenge(Math.floor(1000 + Math.random() * 9000).toString());
    setForgotError(null);
    setForgotModalVisible(true);
  };

  const handleResetPinSubmit = async () => {
    setForgotError(null);
    const cleanUser = forgotUsername.trim().toLowerCase();
    if (!cleanUser) {
      setForgotError('Please enter your User ID.');
      return;
    }

    const matchedAccount = savedAccounts.find(
      (a) => a.username.toLowerCase() === cleanUser
    );
    if (!matchedAccount) {
      setForgotError(`User @${cleanUser} not found on this device.`);
      return;
    }

    if (verificationInput.trim() !== verificationChallenge) {
      setForgotError(`Security code mismatch! Please enter ${verificationChallenge}.`);
      return;
    }

    if (forgotNewPin.trim() && forgotNewPin.trim() !== forgotConfirmPin.trim()) {
      setForgotError('New PIN and Confirm PIN do not match.');
      return;
    }

    setIsResetting(true);
    try {
      await resetPin(cleanUser, forgotNewPin.trim());
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setForgotModalVisible(false);
      Alert.alert(
        'PIN Reset Successful! 🔓',
        forgotNewPin.trim()
          ? `Your new PIN has been saved. Welcome back, ${matchedAccount.displayName}!`
          : `PIN protection removed. Welcome back, ${matchedAccount.displayName}!`
      );
    } catch (err) {
      setForgotError(err.message || 'Failed to reset PIN.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!username.trim()) {
      setErrorMsg('Please enter a User ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        await register({
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          avatar: selectedAvatar,
          pin: pin.trim()
        });
      } else {
        await login(username.trim(), pin.trim());
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (acc) => {
    setErrorMsg(null);
    try {
      await login(acc.username, acc.pin || '');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      // If PIN is required, pre-fill username and prompt for PIN
      setUsername(acc.username);
      setMode('login');
      setErrorMsg(err.message);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await register({
        username: `warrior_${Math.floor(1000 + Math.random() * 9000)}`,
        displayName: 'Guest Challenger',
        avatar: '⚡'
      });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="flame" size={38} color="#f97316" />
          </View>
          <Text style={styles.brandTitle}>ROAST & GROW</Text>
          <Text style={styles.brandSubtitle}>Discipline, AI Roast & Growth Engine</Text>
        </View>

        {/* Tab Toggle: Sign In vs Create Account */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabToggleBtn, mode === 'login' && styles.tabToggleBtnActive]}
            onPress={() => {
              setMode('login');
              setErrorMsg(null);
            }}
          >
            <Text style={[styles.tabToggleText, mode === 'login' && styles.tabToggleTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabToggleBtn, mode === 'register' && styles.tabToggleBtnActive]}
            onPress={() => {
              setMode('register');
              setErrorMsg(null);
            }}
          >
            <Text style={[styles.tabToggleText, mode === 'register' && styles.tabToggleTextActive]}>
              Create New ID
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Form Container */}
        <View style={styles.formCard}>
          {mode === 'register' && (
            <>
              {/* Avatar Selector */}
              <Text style={styles.inputLabel}>Choose Challenger Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarRow}>
                {AVATAR_OPTIONS.map((av) => (
                  <TouchableOpacity
                    key={av}
                    style={[styles.avatarChoice, selectedAvatar === av && styles.avatarChoiceSelected]}
                    onPress={() => setSelectedAvatar(av)}
                  >
                    <Text style={styles.avatarChoiceText}>{av}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Display Name Input */}
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jyoti Sharma"
                placeholderTextColor="#6e7681"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </>
          )}

          {/* User ID / Username Input */}
          <Text style={styles.inputLabel}>User ID (Unique Handle)</Text>
          <View style={styles.userIdInputWrapper}>
            <Text style={styles.atSymbol}>@</Text>
            <TextInput
              style={styles.userIdInput}
              placeholder="your_unique_id"
              placeholderTextColor="#6e7681"
              value={username}
              onChangeText={(val) => setUsername(val.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Security PIN Field */}
          <View style={styles.pinHeaderRow}>
            <Text style={styles.inputLabel}>
              {mode === 'register' ? 'Security PIN (Optional)' : 'Security PIN'}
            </Text>
            {mode === 'login' && (
              <TouchableOpacity
                onPress={() => handleOpenForgotModal(username)}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPinLink}>Forgot PIN / Password?</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder={
              mode === 'register'
                ? 'Optional 4-digit PIN for lock'
                : 'Enter 4-digit PIN'
            }
            placeholderTextColor="#6e7681"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={6}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting
                ? 'Authenticating...'
                : mode === 'register'
                ? 'Create Challenger ID 🚀'
                : 'Enter Streak Lab 🔓'}
            </Text>
          </TouchableOpacity>

          {/* Guest Quick Access */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestLogin}
            activeOpacity={0.7}
          >
            <Feather name="zap" size={14} color="#8b949e" />
            <Text style={styles.guestButtonText}>Instant One-Click Guest ID</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Switch from Saved Profiles on Device */}
        {savedAccounts.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.savedTitle}>Saved Profiles on this Device ({savedAccounts.length})</Text>
            <View style={styles.savedGrid}>
              {savedAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc.username}
                  style={styles.savedCard}
                  onPress={() => handleQuickLogin(acc)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.savedAvatar}>{acc.avatar}</Text>
                  <View style={styles.savedInfo}>
                    <Text style={styles.savedName} numberOfLines={1}>
                      {acc.displayName}
                    </Text>
                    <Text style={styles.savedHandle}>@{acc.username}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={20} color="#f97316" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Forgot Password / PIN Recovery Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="key" size={20} color="#f97316" />
              </View>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Reset Security PIN</Text>
                <Text style={styles.modalSubtitle}>Device Ownership Recovery</Text>
              </View>
              <TouchableOpacity
                onPress={() => setForgotModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#8b949e" />
              </TouchableOpacity>
            </View>

            {forgotError && (
              <View style={styles.modalErrorBanner}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.modalErrorText}>{forgotError}</Text>
              </View>
            )}

            {/* Quick account selection if multiple profiles exist */}
            {savedAccounts.length > 0 && (
              <View style={styles.modalAccountPicker}>
                <Text style={styles.modalPickerLabel}>Select Account on this device:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountChipsRow}>
                  {savedAccounts.map((acc) => {
                    const isSelected = forgotUsername.toLowerCase() === acc.username.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={acc.username}
                        style={[
                          styles.accountChip,
                          isSelected && styles.accountChipActive
                        ]}
                        onPress={() => setForgotUsername(acc.username)}
                      >
                        <Text style={styles.accountChipAvatar}>{acc.avatar}</Text>
                        <Text
                          style={[
                            styles.accountChipName,
                            isSelected && styles.accountChipNameActive
                          ]}
                        >
                          @{acc.username}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* User ID Field */}
            <Text style={styles.modalInputLabel}>User ID (@handle)</Text>
            <View style={styles.userIdInputWrapper}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.userIdInput}
                placeholder="account_id"
                placeholderTextColor="#6e7681"
                value={forgotUsername}
                onChangeText={(val) => setForgotUsername(val.toLowerCase())}
                autoCapitalize="none"
              />
            </View>

            {/* Security Verification Code Challenge */}
            <View style={styles.securityChallengeBox}>
              <View style={styles.securityChallengeHeader}>
                <Ionicons name="shield-checkmark" size={15} color="#22c55e" />
                <Text style={styles.securityChallengeTitle}>Ownership Verification</Text>
              </View>
              <Text style={styles.securityChallengeSub}>
                Type confirmation code <Text style={styles.challengeHighlight}>{verificationChallenge}</Text> to verify device access:
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder={`Type ${verificationChallenge}`}
                placeholderTextColor="#6e7681"
                value={verificationInput}
                onChangeText={setVerificationInput}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {/* New PIN & Confirm PIN */}
            <Text style={styles.modalInputLabel}>New PIN (Leave blank to remove PIN lock)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new 4-digit PIN (optional)"
              placeholderTextColor="#6e7681"
              value={forgotNewPin}
              onChangeText={setForgotNewPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
            />

            {forgotNewPin.length > 0 && (
              <TextInput
                style={styles.modalInput}
                placeholder="Confirm new 4-digit PIN"
                placeholderTextColor="#6e7681"
                value={forgotConfirmPin}
                onChangeText={setForgotConfirmPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={6}
              />
            )}

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setForgotModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isResetting && styles.submitButtonDisabled]}
                onPress={handleResetPinSubmit}
                disabled={isResetting}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitBtnText}>
                  {isResetting ? 'Saving...' : 'Reset & Log In 🚀'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#090d14'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 36
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#111620',
    borderWidth: 2,
    borderColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#111620',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e2636'
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabToggleBtnActive: {
    backgroundColor: '#1e2636'
  },
  tabToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8'
  },
  tabToggleTextActive: {
    color: '#f97316'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1
  },
  formCard: {
    backgroundColor: '#111620',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#1e2636',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 6
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 14
  },
  avatarChoice: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#090d14',
    borderWidth: 1.5,
    borderColor: '#2d3748',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  avatarChoiceSelected: {
    borderColor: '#ea580c',
    backgroundColor: 'rgba(234, 88, 12, 0.15)'
  },
  avatarChoiceText: {
    fontSize: 20
  },
  userIdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 12,
    marginBottom: 14
  },
  atSymbol: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 4
  },
  userIdInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 12
  },
  input: {
    backgroundColor: '#090d14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 14
  },
  submitButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#fb923c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 6
  },
  guestButtonText: {
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '600'
  },
  savedSection: {
    marginTop: 24
  },
  savedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8b949e',
    letterSpacing: 0.8,
    marginBottom: 10
  },
  savedGrid: {
    gap: 8
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363d',
    gap: 12
  },
  savedAvatar: {
    fontSize: 24
  },
  savedInfo: {
    flex: 1
  },
  savedName: {
    color: '#f0f6fc',
    fontSize: 14,
    fontWeight: '700'
  },
  savedHandle: {
    color: '#8b949e',
    fontSize: 12
  },
  pinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6
  },
  forgotPinLink: {
    fontSize: 12,
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
    maxWidth: 420,
    backgroundColor: '#111620',
    borderRadius: 24,
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
    marginBottom: 16
  },
  modalIconWrap: {
    width: 42,
    height: 42,
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
    fontSize: 17,
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
  modalAccountPicker: {
    marginBottom: 12
  },
  modalPickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b949e',
    marginBottom: 6
  },
  accountChipsRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#090d14',
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8
  },
  accountChipActive: {
    borderColor: '#ea580c',
    backgroundColor: 'rgba(234, 88, 12, 0.12)'
  },
  accountChipAvatar: {
    fontSize: 14
  },
  accountChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8'
  },
  accountChipNameActive: {
    color: '#f97316'
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 4
  },
  modalInput: {
    backgroundColor: '#090d14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
    marginBottom: 10
  },
  securityChallengeBox: {
    backgroundColor: '#090d14',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 12
  },
  securityChallengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  securityChallengeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22c55e'
  },
  securityChallengeSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 8
  },
  challengeHighlight: {
    color: '#fbbf24',
    fontWeight: '900',
    fontSize: 13
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#1e2636',
    paddingVertical: 13,
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
    flex: 1.6,
    backgroundColor: '#ea580c',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fb923c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3
  }
});

