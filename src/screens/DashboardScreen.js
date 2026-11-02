import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import { useStreak } from '../context/StreakContext';
import { ChallengeCard } from '../components/Dashboard/ChallengeCard';
import { MicroHabitList } from '../components/Dashboard/MicroHabitList';
import { AimotivationBanner } from '../components/Dashboard/AimotivationBanner';
import { JournalModal } from '../components/Journal/JournalModal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const DashboardScreen = ({ onNavigateToVault }) => {
  const {
    challenge,
    habits,
    freezeCoins,
    todayJournal,
    aiMessage,
    aiType,
    isAiLoading,
    toggleHabit,
    addHabit,
    deleteHabit,
    checkIn,
    saveJournal,
    refreshAIMessage,
    initApp
  } = useStreak();

  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    await initApp();
    setIsRefreshing(false);
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const res = await checkIn();
      if (res.earnedNewFreezeCoin) {
        Alert.alert(
          '10-Day Milestone Achieved! 🏆',
          `Incredible dedication! You reached Day ${res.newStreak} and earned 1 Freeze Coin 🪙 for your vault.`
        );
      } else {
        Alert.alert('Check-In Locked In! 🔥', `You are on Day ${res.newStreak}. Keep dominating!`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to perform daily check-in.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
            tintColor="#f97316"
          />
        }
      >
        {/* Dynamic AI Motivation or Roast Banner */}
        <AimotivationBanner
          message={aiMessage}
          type={aiType}
          isLoading={isAiLoading}
          onRefresh={refreshAIMessage}
          onCheckInNow={handleCheckIn}
        />

        {/* Challenge Overview Card */}
        <ChallengeCard
          challenge={challenge}
          freezeCoins={freezeCoins}
          onOpenStore={onNavigateToVault}
        />

        {/* Primary Daily Check-In Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.primaryCheckInBtn, isCheckingIn && styles.disabledBtn]}
            onPress={handleCheckIn}
            disabled={isCheckingIn}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done-circle" size={22} color="#ffffff" />
            <Text style={styles.primaryCheckInText}>
              {isCheckingIn ? 'LOCKING IN...' : "LOCK IN TODAY'S CHECK-IN 🔥"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Micro-Habits Stacking Checklist */}
        <MicroHabitList
          habits={habits}
          onToggleHabit={toggleHabit}
          onAddHabit={addHabit}
          onDeleteHabit={deleteHabit}
        />

        {/* Daily Journal Quick Launcher */}
        <View style={styles.journalLauncherCard}>
          <View style={styles.journalLauncherHeader}>
            <View>
              <Text style={styles.journalLauncherTitle}>Daily Journal & Proof</Text>
              <Text style={styles.journalLauncherSubtitle}>
                {todayJournal
                  ? `Logged today (${todayJournal.mood}) • ${todayJournal.photoUri ? '📸 Photo Attached' : 'Text Log'}`
                  : 'No reflection logged yet for today.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.journalLauncherBtn}
              onPress={() => setJournalModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.journalLauncherBtnText}>
                {todayJournal ? 'Edit Journal' : 'Write Log ✍️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Journal Modal */}
      <JournalModal
        visible={journalModalVisible}
        onClose={() => setJournalModalVisible(false)}
        initialData={todayJournal}
        onSave={saveJournal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117'
  },
  scrollContent: {
    paddingBottom: 32
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginVertical: 4
  },
  primaryCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6
  },
  disabledBtn: {
    opacity: 0.6
  },
  primaryCheckInText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  journalLauncherCard: {
    backgroundColor: '#161b22',
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  journalLauncherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  journalLauncherTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  journalLauncherSubtitle: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 2,
    maxWidth: 200
  },
  journalLauncherBtn: {
    backgroundColor: '#21262d',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  journalLauncherBtnText: {
    color: '#58a6ff',
    fontWeight: '700',
    fontSize: 13
  }
});

