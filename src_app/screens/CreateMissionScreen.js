import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStreak } from '../context/StreakContext';
import { MicroHabitList } from '../components/Dashboard/MicroHabitList';
import { SupremeGoalCard } from '../components/Dashboard/SupremeGoalCard';
import { SupremeGoalModal } from '../components/Dashboard/SupremeGoalModal';
import { getLocalDateString } from '../storage/asyncStorage';
import { THEME } from '../theme';

export const CreateMissionScreen = React.memo(({ onNavigateToHome }) => {
  const {
    challenge,
    habits,
    supremeGoal,
    history,
    toggleHabit,
    addHabit,
    deleteHabit,
    saveSupremeDailyGoal,
    toggleSupremeGoal,
    updateSupremeInfo,
    toggleMilestone,
    updateMilestone,
    setFinalMilestone,
    addMilestone,
    deleteMilestone,
    checkStreakEligibility,
    initApp
  } = useStreak();

  const [supremeModalVisible, setSupremeModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayStr = getLocalDateString();
  const isAlreadyCheckedIn = challenge?.lastActiveDate === todayStr;

  const eligibility = checkStreakEligibility();
  const { isEligible, isDailyGoalCompleted, completedHabitsCount } = eligibility;

  const handlePullRefresh = async () => {
    setIsRefreshing(true);
    await initApp();
    setIsRefreshing(false);
  };

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
            tintColor={THEME.crimson}
            colors={[THEME.crimson, THEME.marigold, THEME.blueLight]}
          />
        }
      >
        {/* Header HUD Banner */}
        <View style={styles.headerCard}>
          <View style={styles.headerTagRow}>
            <View style={styles.tagDot} />
            <Text style={styles.tagText}>[CREATION_HUB // MISSION_PROTOCOL]</Text>
          </View>
          <Text style={styles.headerTitle}>Supreme Mission & Habits</Text>
          <Text style={styles.headerSubtitle}>
            Configure your daily non-negotiable mission, stack atomic habits, and conquer the 100-day milestone.
          </Text>

          {/* Live Lock-in Eligibility Status Bar */}
          <View
            style={[
              styles.statusRadar,
              {
                borderColor: isAlreadyCheckedIn
                  ? THEME.success
                  : isEligible
                  ? THEME.blueLight
                  : THEME.crimson
              }
            ]}
          >
            <View style={styles.radarLeft}>
              <View style={styles.radarItem}>
                <Ionicons
                  name={isDailyGoalCompleted ? 'checkmark-circle' : 'time-outline'}
                  size={15}
                  color={isDailyGoalCompleted ? THEME.success : THEME.crimson}
                />
                <Text style={styles.radarItemText}>
                  Supreme Mission: {isDailyGoalCompleted ? 'Done ✓' : 'Incomplete'}
                </Text>
              </View>

              <View style={styles.radarItem}>
                <Ionicons
                  name={completedHabitsCount >= 3 ? 'checkmark-circle' : 'time-outline'}
                  size={15}
                  color={completedHabitsCount >= 3 ? THEME.success : THEME.marigold}
                />
                <Text style={styles.radarItemText}>
                  Micro-Habits: {completedHabitsCount}/3 Met
                </Text>
              </View>
            </View>

            {Boolean(onNavigateToHome) && (
              <TouchableOpacity
                style={[
                  styles.radarActionBtn,
                  {
                    backgroundColor: isEligible ? THEME.crimson : THEME.bgCardHover,
                    borderColor: isEligible ? THEME.marigold : THEME.borderMedium,
                    borderWidth: 1.5
                  }
                ]}
                onPress={onNavigateToHome}
                activeOpacity={0.8}
              >
                <Text style={styles.radarActionText}>
                  {isAlreadyCheckedIn
                    ? 'Secured ✓'
                    : isEligible
                    ? 'Lock In →'
                    : 'Home 🏠'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 1. Daily Micro-Habits Checklist Section */}
        <MicroHabitList
          habits={habits}
          history={history}
          onToggleHabit={toggleHabit}
          onAddHabit={addHabit}
          onDeleteHabit={deleteHabit}
        />

        {/* 2. Supreme Goal & Roadmap Section */}
        <SupremeGoalCard
          supremeGoal={supremeGoal}
          habits={habits}
          isAlreadyCheckedIn={isAlreadyCheckedIn}
          onSaveDailyGoal={saveSupremeDailyGoal}
          onToggleDailyGoal={toggleSupremeGoal}
          onOpenSettings={() => setSupremeModalVisible(true)}
          onToggleMilestone={toggleMilestone}
          onUpdateMilestone={updateMilestone}
          onSetFinalMilestone={setFinalMilestone}
          onAddMilestone={addMilestone}
          onDeleteMilestone={deleteMilestone}
          onUpdateDetails={updateSupremeInfo}
        />

        <View style={{ height: 40 }} />
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
        onSetFinalMilestone={setFinalMilestone}
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
  },
  headerCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: THEME.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.crimson
  },
  tagText: {
    color: THEME.crimson,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  headerTitle: {
    color: THEME.textWhite,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 4
  },
  headerSubtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14
  },
  statusRadar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.bgInput,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.2
  },
  radarLeft: {
    gap: 4
  },
  radarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  radarItemText: {
    color: THEME.textSecondary,
    fontSize: 11.5,
    fontWeight: '700'
  },
  radarActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  radarActionText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800'
  }
});

