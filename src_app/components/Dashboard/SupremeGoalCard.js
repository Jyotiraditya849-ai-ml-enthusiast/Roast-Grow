import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Modal,
  Linking
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getDayDifference, getLocalDateString } from '../../storage/asyncStorage';
import { pickRoadmapFileOrPhoto } from '../../services/mediaPickerService';

export const SupremeGoalCard = ({
  supremeGoal,
  habits = [],
  isAlreadyCheckedIn = false,
  onSaveDailyGoal,
  onToggleDailyGoal,
  onOpenSettings,
  onToggleMilestone,
  onUpdateDetails
}) => {
  const [dailyGoalInput, setDailyGoalInput] = useState('');
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [showRoadmapList, setShowRoadmapList] = useState(false);

  // Full-screen image viewer modal state
  const [previewImageUri, setPreviewImageUri] = useState(null);

  const todayStr = getLocalDateString();
  const deadlineStr = supremeGoal?.deadline || '2027-12-31';
  const daysRemaining = Math.max(0, getDayDifference(todayStr, deadlineStr));

  const roadmap = supremeGoal?.roadmap || [];
  const completedMilestones = roadmap.filter((m) => m.completed).length;
  const totalMilestones = roadmap.length;
  const roadmapProgress = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  const dailyGoal = supremeGoal?.dailyGoal || { text: '', completed: false };
  const hasDailyGoal = Boolean(dailyGoal.text && dailyGoal.text.trim().length > 0);
  const isDailyGoalDone = Boolean(dailyGoal.completed && hasDailyGoal);

  // Roadmap File/Photo Attachment
  const roadmapAttachmentUri = supremeGoal?.attachmentUri;
  const roadmapAttachmentName = supremeGoal?.attachmentName || 'roadmap_blueprint';
  const isPdf = Boolean(
    supremeGoal?.attachmentType === 'pdf' ||
    roadmapAttachmentName.toLowerCase().endsWith('.pdf')
  );

  // Micro habits status
  const completedHabitsCount = habits.filter((h) => h.completedToday).length;
  const isHabitsThresholdMet = completedHabitsCount >= 3;

  // Streak status
  const isStreakCriteriaMet = isDailyGoalDone && isHabitsThresholdMet;

  const handleToggleDailyGoal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleDailyGoal();
  };

  const handleSaveDailyGoal = () => {
    if (!dailyGoalInput.trim()) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSaveDailyGoal(dailyGoalInput.trim());
    setDailyGoalInput('');
    setIsEditingDaily(false);
  };

  const handleStartEditDaily = () => {
    setDailyGoalInput(dailyGoal.text || '');
    setIsEditingDaily(true);
  };

  // Upload Roadmap Photo or PDF using + icon
  const handleUploadRoadmapFile = async () => {
    const asset = await pickRoadmapFileOrPhoto();
    if (asset && onUpdateDetails) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await onUpdateDetails({
        attachmentUri: asset.uri,
        attachmentName: asset.name,
        attachmentType: asset.type
      });
    }
  };

  const handleRemoveRoadmapFile = async () => {
    if (onUpdateDetails) {
      await onUpdateDetails({
        attachmentUri: null,
        attachmentName: null,
        attachmentType: null
      });
    }
  };

  const handleOpenRoadmapAttachment = () => {
    if (!roadmapAttachmentUri) return;
    if (isPdf) {
      // Open PDF in browser or viewer
      if (Platform.OS === 'web') {
        window.open(roadmapAttachmentUri, '_blank');
      } else {
        Linking.openURL(roadmapAttachmentUri).catch(() => {});
      }
    } else {
      // Open image full screen
      setPreviewImageUri(roadmapAttachmentUri);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <View style={styles.badgeIcon}>
            <Ionicons name="trophy" size={13} color="#f59e0b" />
          </View>
          <Text style={styles.badgeText}>SUPREME GOAL</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Deadline Countdown */}
          <View style={styles.deadlineContainer}>
            <Ionicons name="hourglass-outline" size={12} color="#f59e0b" />
            <Text style={styles.deadlineText}>
              {daysRemaining}d left • {deadlineStr}
            </Text>
          </View>

          {/* Edit Goal & Roadmap Button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <Feather name="edit-3" size={14} color="#f0f6fc" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Goal Title & Description */}
      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle}>
          {supremeGoal?.title || 'Set Your Supreme Goal'}
        </Text>
        {supremeGoal?.description ? (
          <Text style={styles.goalDescription} numberOfLines={2}>
            {supremeGoal.description}
          </Text>
        ) : null}
      </View>

      {/* ROADMAP SECTION WITH + FILE/PHOTO UPLOAD OPTION */}
      <View style={styles.roadmapCard}>
        <View style={styles.roadmapHeader}>
          {/* Left: Milestones Title & Count */}
          <TouchableOpacity
            style={styles.roadmapHeaderLeft}
            onPress={() => setShowRoadmapList(!showRoadmapList)}
            activeOpacity={0.8}
          >
            <Ionicons name="git-network-outline" size={15} color="#eab308" />
            <Text style={styles.roadmapTitle} numberOfLines={1}>Roadmap Milestones</Text>
            <Text style={styles.roadmapRatio}>
              ({completedMilestones}/{totalMilestones})
            </Text>
            <Ionicons
              name={showRoadmapList ? 'chevron-up' : 'chevron-down'}
              size={13}
              color="#8b949e"
            />
          </TouchableOpacity>

          {/* Right: + Upload Roadmap File/Photo Button */}
          <View style={styles.roadmapHeaderRight}>
            <TouchableOpacity
              style={styles.plusUploadBtn}
              onPress={handleUploadRoadmapFile}
              activeOpacity={0.75}
            >
              <Ionicons name="add-circle" size={15} color="#eab308" />
              <Text style={styles.plusUploadText}>Roadmap Doc/PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Roadmap Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.round(roadmapProgress * 100)}%` }
            ]}
          />
        </View>

        {/* Attached Roadmap File/Photo Display Bar */}
        {roadmapAttachmentUri && (
          <View style={styles.attachedRoadmapPill}>
            <TouchableOpacity
              style={styles.attachedRoadmapTouch}
              onPress={handleOpenRoadmapAttachment}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPdf ? 'document-text' : 'image'}
                size={16}
                color={isPdf ? '#ef4444' : '#38bdf8'}
              />
              <Text style={styles.attachedRoadmapName} numberOfLines={1}>
                {roadmapAttachmentName}
              </Text>
              <View style={styles.viewBadge}>
                <Text style={styles.viewBadgeText}>View</Text>
                <Ionicons name="open-outline" size={11} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeRoadmapAttachBtn}
              onPress={handleRemoveRoadmapFile}
            >
              <Ionicons name="close-circle" size={16} color="#8b949e" />
            </TouchableOpacity>
          </View>
        )}

        {/* Expanded Roadmap Milestones List */}
        {showRoadmapList && (
          <View style={styles.milestoneList}>
            {roadmap.map((milestone) => (
              <TouchableOpacity
                key={milestone.id}
                style={styles.milestoneItem}
                onPress={() => onToggleMilestone(milestone.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={milestone.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={milestone.completed ? '#22c55e' : '#6e7681'}
                />
                <Text
                  style={[
                    styles.milestoneText,
                    milestone.completed && styles.milestoneDoneText
                  ]}
                >
                  {milestone.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* TODAY'S SINGLE SUPREME GOAL (Clean, Mobile Responsive) */}
      <View style={styles.dailyMissionBox}>
        <View style={styles.missionHeader}>
          <View style={styles.missionHeaderLeft}>
            <Ionicons name="sparkles" size={14} color="#f59e0b" />
            <Text style={styles.missionTitle}>Today's Supreme Mission</Text>
          </View>
          <View style={styles.singleGoalBadge}>
            <Text style={styles.singleGoalNotice}>1 Non-Negotiable Step</Text>
          </View>
        </View>

        {isEditingDaily || !hasDailyGoal ? (
          /* Input for Today's Single Goal */
          <View style={styles.dailyInputContainer}>
            <TextInput
              style={styles.dailyInput}
              placeholder="e.g. Code auth system & revise algorithms"
              placeholderTextColor="#6e7681"
              value={dailyGoalInput}
              onChangeText={setDailyGoalInput}
              autoFocus={isEditingDaily}
              onSubmitEditing={handleSaveDailyGoal}
            />
            <View style={styles.dailyInputActions}>
              <TouchableOpacity
                style={styles.setMissionBtn}
                onPress={handleSaveDailyGoal}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={14} color="#ffffff" />
                <Text style={styles.setMissionBtnText}>
                  {isEditingDaily ? 'Update' : 'Set Mission'}
                </Text>
              </TouchableOpacity>
              {isEditingDaily && (
                <TouchableOpacity
                  style={styles.cancelDailyBtn}
                  onPress={() => setIsEditingDaily(false)}
                >
                  <Text style={styles.cancelDailyText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          /* Display Today's Single Goal with Checkbox */
          <View
            style={[
              styles.missionRow,
              isDailyGoalDone && styles.missionRowCompleted
            ]}
          >
            <TouchableOpacity
              style={styles.checkboxWrapper}
              onPress={handleToggleDailyGoal}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  isDailyGoalDone && styles.checkboxActive
                ]}
              >
                {isDailyGoalDone && (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                )}
              </View>

              <View style={styles.missionTextContainer}>
                <Text
                  style={[
                    styles.missionText,
                    isDailyGoalDone && styles.missionTextCompleted
                  ]}
                >
                  {dailyGoal.text}
                </Text>
                <Text style={styles.missionStatusSub}>
                  {isDailyGoalDone
                    ? '✓ MISSION ACCOMPLISHED TODAY'
                    : '⏳ Tap to check off when completed'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editDailyBtn}
              onPress={handleStartEditDaily}
            >
              <Feather name="edit-2" size={14} color="#6e7681" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* STREAK RULE INTEGRITY BAR */}
      <View
        style={[
          styles.ruleBox,
          isAlreadyCheckedIn && styles.ruleBoxSuccess,
          !isAlreadyCheckedIn && isStreakCriteriaMet && styles.ruleBoxReady
        ]}
      >
        <View style={styles.ruleHeader}>
          <Ionicons
            name={
              isAlreadyCheckedIn
                ? 'shield-checkmark'
                : isStreakCriteriaMet
                ? 'flash'
                : 'lock-closed'
            }
            size={16}
            color={
              isAlreadyCheckedIn
                ? '#22c55e'
                : isStreakCriteriaMet
                ? '#f59e0b'
                : '#ef4444'
            }
          />
          <Text
            style={[
              styles.ruleTitle,
              isAlreadyCheckedIn && { color: '#22c55e' },
              !isAlreadyCheckedIn && isStreakCriteriaMet && { color: '#f59e0b' }
            ]}
          >
            {isAlreadyCheckedIn
              ? "TODAY'S STREAK LOCKED IN 🔥"
              : isStreakCriteriaMet
              ? 'STREAK CRITERIA MET! AUTO-LOCKING ⚡'
              : 'STREAK LOCK CRITERIA (MANDATORY)'}
          </Text>
        </View>

        {/* Requirements Checklist */}
        <View style={styles.reqGrid}>
          <View style={styles.reqItem}>
            <Ionicons
              name={isDailyGoalDone ? 'checkmark-circle' : 'close-circle'}
              size={15}
              color={isDailyGoalDone ? '#22c55e' : '#ef4444'}
            />
            <Text
              style={[
                styles.reqItemText,
                isDailyGoalDone && styles.reqItemTextDone
              ]}
            >
              Supreme Mission ({isDailyGoalDone ? 'Done' : hasDailyGoal ? 'Incomplete' : 'Not Set'})
            </Text>
          </View>

          <View style={styles.reqItem}>
            <Ionicons
              name={isHabitsThresholdMet ? 'checkmark-circle' : 'close-circle'}
              size={15}
              color={isHabitsThresholdMet ? '#22c55e' : '#ef4444'}
            />
            <Text
              style={[
                styles.reqItemText,
                isHabitsThresholdMet && styles.reqItemTextDone
              ]}
            >
              Min 3 Daily Habits ({completedHabitsCount}/3)
            </Text>
          </View>
        </View>

        <Text style={styles.ruleExplainText}>
          {isAlreadyCheckedIn
            ? 'Awesome discipline! Day streak secured with full criteria.'
            : isStreakCriteriaMet
            ? 'Both conditions satisfied! Check-in triggers automatically.'
            : 'Rule: Streak will NOT lock in unless today\'s Supreme Goal AND at least 3 Micro-Habits are both checked off.'}
        </Text>
      </View>

      {/* Full-Screen Image Preview Modal for Roadmap Photo */}
      <Modal
        visible={Boolean(previewImageUri)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewImageUri(null)}
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111620',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#fbbf24'
  },
  badgeIcon: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 1.2
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    flexShrink: 1
  },
  deadlineText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '800',
    letterSpacing: 0.3
  },
  editBtn: {
    backgroundColor: '#1a202c',
    padding: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  goalInfo: {
    marginBottom: 14
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
    marginBottom: 5
  },
  goalDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19
  },
  roadmapCard: {
    backgroundColor: '#090d14',
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    overflow: 'hidden'
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  roadmapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 130
  },
  roadmapTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc'
  },
  roadmapRatio: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fbbf24',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  roadmapHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  plusUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161d28',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8
  },
  plusUploadText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '800'
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#1a2230',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 4
  },
  attachedRoadmapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131924',
    borderWidth: 1,
    borderColor: '#2d3748',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    overflow: 'hidden'
  },
  attachedRoadmapTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  attachedRoadmapName: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: '600',
    flex: 1
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16a34a',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  viewBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800'
  },
  removeRoadmapAttachBtn: {
    padding: 3,
    marginLeft: 6
  },
  milestoneList: {
    marginTop: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e2636',
    paddingTop: 10
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 4
  },
  milestoneText: {
    fontSize: 13,
    color: '#e2e8f0',
    flex: 1,
    fontWeight: '500'
  },
  milestoneDoneText: {
    textDecorationLine: 'line-through',
    color: '#64748b'
  },
  dailyMissionBox: {
    backgroundColor: '#090d14',
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    overflow: 'hidden'
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10
  },
  missionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1
  },
  missionTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.2
  },
  singleGoalBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  singleGoalNotice: {
    fontSize: 10.5,
    color: '#fbbf24',
    fontWeight: '700'
  },
  dailyInputContainer: {
    gap: 10,
    width: '100%'
  },
  dailyInput: {
    backgroundColor: '#111620',
    borderWidth: 1.5,
    borderColor: '#2d3748',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14
  },
  dailyInputActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  setMissionBtn: {
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3
  },
  setMissionBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.3
  },
  cancelDailyBtn: {
    backgroundColor: '#1e2430',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  cancelDailyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111620',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2d3748',
    overflow: 'hidden'
  },
  missionRowCompleted: {
    borderColor: 'rgba(34, 197, 94, 0.6)',
    backgroundColor: 'rgba(34, 197, 94, 0.12)'
  },
  checkboxWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090d14'
  },
  checkboxActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3
  },
  missionTextContainer: {
    flex: 1
  },
  missionText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 20
  },
  missionTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8'
  },
  missionStatusSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '600'
  },
  editDailyBtn: {
    backgroundColor: '#1e2430',
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginLeft: 6
  },
  ruleBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    overflow: 'hidden'
  },
  ruleBoxReady: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b'
  },
  ruleBoxSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22c55e'
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
    flexWrap: 'wrap'
  },
  ruleTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#f87171',
    letterSpacing: 0.8,
    flexShrink: 1
  },
  reqGrid: {
    flexDirection: 'column',
    gap: 7,
    marginBottom: 9
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap'
  },
  reqItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f87171',
    flexShrink: 1
  },
  reqItemTextDone: {
    color: '#22c55e'
  },
  ruleExplainText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10
  },
  fullScreenImage: {
    width: '90%',
    height: '80%'
  }
});
