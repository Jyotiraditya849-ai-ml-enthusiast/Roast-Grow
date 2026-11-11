import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl
} from 'react-native';
import { useStreak } from '../context/StreakContext';
import { StreakHorseshoeCard } from '../components/Dashboard/StreakHorseshoeCard';
import { FocusPomodoroTimer } from '../components/Dashboard/FocusPomodoroTimer';
import { MistakesVsDreamCard } from '../components/Dashboard/MistakesVsDreamCard';
import { StreakCelebrationModal } from '../components/Common/StreakCelebrationModal';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getLocalDateString } from '../storage/asyncStorage';
import { useCyberNotification } from '../context/NotificationContext';
import { THEME } from '../theme';

export const DashboardScreen = React.memo(({ onNavigateToVault, onNavigateToCreate }) => {
  const { showCyberNotification } = useCyberNotification();
  const {
    challenge,
    freezeCoins,
    aiMessage,
    aiType,
    showCelebration,
    celebrationData,
    closeCelebration,
    checkStreakEligibility,
    checkIn,
    initApp
  } = useStreak();

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
        missingParts.push(`• Micro-Habits: ✓ Fulfilled (${completedHabitsCount}/3)`);
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

  const isPureRed = challenge?.currentStreak === 0 || challenge?.isBroken;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullRefresh}
            tintColor={isPureRed ? THEME.crimsonPureRed : THEME.marigold}
            colors={[THEME.crimsonPureRed, THEME.marigold, THEME.blueLight]}
          />
        }
      >
        {/* 1. Supreme Streak Horseshoe Gauge Card (Image 1 1:1 Replica) */}
        <StreakHorseshoeCard
          challenge={challenge}
          freezeCoins={freezeCoins}
          aiMessage={aiMessage}
          aiType={aiType}
          eligibility={eligibility}
          isAlreadyCheckedIn={isAlreadyCheckedIn}
          isCheckingIn={isCheckingIn}
          onCheckIn={handleCheckIn}
          onNavigateToCreate={onNavigateToCreate}
          onOpenVault={onNavigateToVault}
        />

        {/* 2. Reality Check vs Dream Vision Dual Cockpit (Moved UP per user request) */}
        <MistakesVsDreamCard />

        {/* 3. Pomodoro & Deep Focus Timer (Moved DOWN per user request) */}
        <FocusPomodoroTimer />

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Streak Celebration Full Screen Animation Modal */}
      <StreakCelebrationModal
        visible={showCelebration}
        onClose={closeCelebration}
        streak={celebrationData.streak}
        isMilestone={celebrationData.isMilestone}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgApp,
    width: '100%'
  },
  scrollView: {
    flex: 1,
    width: '100%'
  },
  scrollContent: {
    paddingVertical: 10,
    paddingBottom: 40
  }
});
