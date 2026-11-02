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
  Alert
} from 'react-native';
import { useAuth, AVATAR_OPTIONS } from '../context/AuthContext';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const AuthScreen = () => {
  const { login, register, savedAccounts } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🔥');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            <Ionicons name="flame" size={36} color="#f97316" />
          </View>
          <Text style={styles.brandTitle}>STREAK LAB</Text>
          <Text style={styles.brandSubtitle}>Personal Habit & Discipline Engine</Text>
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

          {/* Optional PIN */}
          <Text style={styles.inputLabel}>Security PIN (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional 4-digit PIN for lock"
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#05080c'
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
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#161b22',
    borderWidth: 1.5,
    borderColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f0f6fc',
    letterSpacing: 2
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#8b949e',
    fontWeight: '600',
    marginTop: 4
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#161b22',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  tabToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabToggleBtnActive: {
    backgroundColor: '#21262d'
  },
  tabToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b949e'
  },
  tabToggleTextActive: {
    color: '#f97316'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1215',
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
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
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b949e',
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
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  avatarChoiceSelected: {
    borderColor: '#f97316',
    backgroundColor: '#27150c'
  },
  avatarChoiceText: {
    fontSize: 20
  },
  userIdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d1117',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    paddingHorizontal: 12,
    marginBottom: 14
  },
  atSymbol: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 4
  },
  userIdInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 12
  },
  input: {
    backgroundColor: '#0d1117',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 14
  },
  submitButton: {
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
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
  }
});

