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
import { useCyberNotification } from '../context/NotificationContext';

export const DashboardScreen = ({ onNavigateToVault }) => {
  const { showCyberNotification } = useCyberNotification();
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
      showCyberNotification({
        type: 'streak',
        title: "Today's Streak Secured! 🔥",
        message: `You have already checked in for today (Day ${challenge.currentStreak}). Keep the discipline going tomorrow!`,
        hudTag: '[PROTOCOL // STREAK_ACTIVE]'
      });
      return;
    }

    if (!isEligible) {
      const missingParts = [];
      if (!isDailyGoalCompleted) {
        missingParts.push(
          hasDailyGoalText
            ? "• Supreme Mission: Pending"
            : "• Supreme Mission: Not Set"
        );
      } else {
        missingParts.push("• Supreme Mission: ✓ Completed");
      }

      if (completedHabitsCount < 3) {
        missingParts.push(
          `• Micro-Habits: ${completedHabitsCount}/3 completed (Min 3 required)`
        );
      } else {
        missingParts.push(`• Micro-Habits: ✓ Fulfillled (${completedHabitsCount}/3)`);
      }

      showCyberNotification({
        type: 'warning',
        title: 'Check-In Locked 🔒',
        message: `Strict Criteria:\n${missingParts.join('\n')}`,
        duration: 5000,
        hudTag: '[STRICT_RULE // CRITERIA_UNMET]'
      });
      return;
    }

    setIsCheckingIn(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await checkIn({ showAnimation: true });
    } catch (err) {
      showCyberNotification({
        type: 'error',
        title: 'Check-In Error ⚠️',
        message: 'Failed to perform daily check-in. Please try again.',
        hudTag: '[SYSTEM // ERROR]'
      });
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
            <View style={styles.journalLauncherLeft}>
              <View style={styles.journalIconBox}>
                <Ionicons name="book-outline" size={20} color="#38bdf8" />
              </View>
              <View style={styles.journalTextWrapper}>
                <Text style={styles.journalLauncherTitle}>Daily Journal & Proof</Text>
                <Text style={styles.journalLauncherSubtitle} numberOfLines={1}>
                  {todayJournal
                    ? `Logged today (${todayJournal.mood}) • ${todayJournal.photoUri ? '📸 Photo' : 'Text Log'}`
                    : 'Reflect on today’s discipline & mindset.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.journalLauncherBtn,
                todayJournal && styles.journalLauncherBtnDone
              ]}
              onPress={() => setJournalModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.journalLauncherBtnText}>
                {todayJournal ? 'Edit Log' : 'Write Log ✍️'}
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
    backgroundColor: '#090d14'
  },
  scrollContent: {
    paddingVertical: 10,
    paddingBottom: 40
  },
  actionContainer: {
    marginHorizontal: 12,
    marginVertical: 10
  },
  primaryCheckInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ea580c',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fb923c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8
  },
  alreadyCheckedInBtn: {
    backgroundColor: '#16a34a',
    borderColor: '#4ade80',
    shadowColor: '#22c55e',
    shadowOpacity: 0.45
  },
  pendingBtn: {
    backgroundColor: '#111620',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    shadowOpacity: 0.15,
    shadowColor: '#ef4444'
  },
  disabledBtn: {
    opacity: 0.7
  },
  primaryCheckInText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13.5,
    letterSpacing: 0.6,
    textAlign: 'center',
    flexShrink: 1
  },
  journalLauncherCard: {
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 15,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    overflow: 'hidden',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  journalLauncherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  journalLauncherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  journalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  journalTextWrapper: {
    flex: 1
  },
  journalLauncherTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f8fafc'
  },
  journalLauncherSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2
  },
  journalLauncherBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  journalLauncherBtnDone: {
    backgroundColor: '#16a34a',
    borderColor: '#4ade80'
  },
  journalLauncherBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12.5
  }
});
