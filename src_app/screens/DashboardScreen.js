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
import { SupremeGoalCard } from '../components/Dashboard/SupremeGoalCard';
import { SupremeGoalModal } from '../components/Dashboard/SupremeGoalModal';
import { StreakCelebrationModal } from '../components/Common/StreakCelebrationModal';
import { AimotivationBanner } from '../components/Dashboard/AimotivationBanner';
import { JournalModal } from '../components/Journal/JournalModal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getLocalDateString } from '../storage/asyncStorage';

export const DashboardScreen = ({ onNavigateToVault }) => {
  const {
    challenge,
    habits,
    supremeGoal,
    freezeCoins,
    todayJournal,
    aiMessage,
    aiType,
    isAiLoading,
    showCelebration,
    celebrationData,
    closeCelebration,
    toggleHabit,
    addHabit,
    deleteHabit,
    saveSupremeDailyGoal,
    attachDailyProof,
    toggleSupremeGoal,
    updateSupremeInfo,
    toggleMilestone,
    addMilestone,
    deleteMilestone,
    checkStreakEligibility,
    checkIn,
    saveJournal,
    refreshAIMessage,
    initApp
  } = useStreak();

  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [supremeModalVisible, setSupremeModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const todayStr = getLocalDateString();
  const isAlreadyCheckedIn = challenge?.lastActiveDate === todayStr;

  const eligibility = checkStreakEligibility();
  const { isEligible, isDailyGoalCompleted, hasDailyGoalText, completedHabitsCount } = eligibility;

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    await initApp();
    setIsRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (isAlreadyCheckedIn) {
      Alert.alert(
        "Today's Streak Secured! 🔥",
        `You have already checked in for today (Day ${challenge.currentStreak}). Keep the momentum going tomorrow!`
      );
      return;
    }

    if (!isEligible) {
      const missingParts = [];
      if (!isDailyGoalCompleted) {
        missingParts.push(
          hasDailyGoalText
            ? "❌ Today's Supreme Mission is not checked off yet."
            : "❌ Please define and complete today's Supreme Mission."
        );
      } else {
        missingParts.push("✓ Today's Supreme Mission completed.");
      }

      if (completedHabitsCount < 3) {
        missingParts.push(
          `❌ Need at least 3 Micro-Habits completed (${completedHabitsCount}/3 currently done).`
        );
      } else {
        missingParts.push(`✓ Micro-Habits threshold met (${completedHabitsCount}/3).`);
      }

      Alert.alert(
        'Streak Check-In Locked 🔒',
        `Strict Rule: Today's streak will not count unless BOTH criteria are fulfilled:\n\n${missingParts.join(
          '\n'
        )}\n\nOnce both are checked off, today's streak will lock in automatically with celebration!`
      );
      return;
    }

    setIsCheckingIn(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await checkIn({ showAnimation: true });
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

        {/* Primary Daily Check-In Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.primaryCheckInBtn,
              isAlreadyCheckedIn && styles.alreadyCheckedInBtn,
              !isAlreadyCheckedIn && !isEligible && styles.pendingBtn,
              isCheckingIn && styles.disabledBtn
            ]}
            onPress={handleCheckIn}
            disabled={isCheckingIn}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                isAlreadyCheckedIn
                  ? 'checkmark-done-circle'
                  : isEligible
                  ? 'flame'
                  : 'lock-closed'
              }
              size={22}
              color="#ffffff"
            />
            <Text style={styles.primaryCheckInText}>
              {isCheckingIn
                ? 'LOCKING IN...'
                : isAlreadyCheckedIn
                ? `DAY ${challenge.currentStreak} LOCKED IN FOR TODAY 🔥`
                : isEligible
                ? "LOCK IN TODAY'S CHECK-IN 🔥"
                : `STREAK LOCKED: SUPREME GOAL + 3 HABITS (${completedHabitsCount}/3) 🔒`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Daily Micro-Habits Stacking Checklist */}
        <MicroHabitList
          habits={habits}
          onToggleHabit={toggleHabit}
          onAddHabit={addHabit}
          onDeleteHabit={deleteHabit}
        />

        {/* 2. SUPREME GOAL SECTION (Underneath Daily Micro-Habits) */}
        <SupremeGoalCard
          supremeGoal={supremeGoal}
          habits={habits}
          isAlreadyCheckedIn={isAlreadyCheckedIn}
          onSaveDailyGoal={saveSupremeDailyGoal}
          onToggleDailyGoal={toggleSupremeGoal}
          onOpenSettings={() => setSupremeModalVisible(true)}
          onToggleMilestone={toggleMilestone}
          onUpdateDetails={updateSupremeInfo}
        />

        {/* 3. Daily Journal Quick Launcher */}
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

      {/* Supreme Goal Configuration Modal */}
      <SupremeGoalModal
        visible={supremeModalVisible}
        onClose={() => setSupremeModalVisible(false)}
        supremeGoal={supremeGoal}
        onUpdateDetails={updateSupremeInfo}
        onToggleMilestone={toggleMilestone}
        onAddMilestone={addMilestone}
        onDeleteMilestone={deleteMilestone}
      />

      {/* Streak Celebration Full Screen Animation Modal */}
      <StreakCelebrationModal
        visible={showCelebration}
        onClose={closeCelebration}
        streak={celebrationData.streak}
        isMilestone={celebrationData.isMilestone}
      />

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
    paddingVertical: 10,
    paddingBottom: 40
  },
  actionContainer: {
    marginHorizontal: 16,
    marginVertical: 8
  },
  primaryCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ea580c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6
  },
  alreadyCheckedInBtn: {
    backgroundColor: '#15803d',
    shadowColor: '#22c55e'
  },
  pendingBtn: {
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#ef4444',
    shadowOpacity: 0.1
  },
  disabledBtn: {
    opacity: 0.7
  },
  primaryCheckInText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8
  },
  journalLauncherCard: {
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  journalLauncherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  journalLauncherTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  journalLauncherSubtitle: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 4,
    maxWidth: 200
  },
  journalLauncherBtn: {
    backgroundColor: '#238636',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  journalLauncherBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
