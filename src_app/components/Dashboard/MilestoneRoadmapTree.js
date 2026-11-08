import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const MilestoneRoadmapTree = ({
  roadmap = [],
  onToggleMilestone,
  onUpdateMilestone,
  onSetFinalMilestone,
  onAddMilestone,
  onDeleteMilestone
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');

  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleStartEdit = (milestone) => {
    triggerHaptic();
    setEditingId(milestone.id);
    setEditText(milestone.title);
  };

  const handleSaveEdit = (milestoneId) => {
    if (editText.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      onUpdateMilestone(milestoneId, { title: editText.trim() });
    }
    setEditingId(null);
    setEditText('');
  };

  const handleToggleFinal = (milestoneId) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    onSetFinalMilestone(milestoneId);
  };

  const handleCreatePhase = () => {
    if (newPhaseTitle.trim()) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      onAddMilestone(newPhaseTitle.trim(), false);
      setNewPhaseTitle('');
      setIsAddingPhase(false);
    } else {
      // Default phase creation
      const nextNum = (roadmap.length || 0) + 1;
      onAddMilestone(`Phase ${nextNum} Mastery Target`, false);
      setIsAddingPhase(false);
    }
  };

  if (!roadmap || roadmap.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No roadmap milestones defined yet.</Text>
        <TouchableOpacity
          style={styles.addPhaseBtn}
          onPress={() => onAddMilestone('Phase 1 Foundation', false)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#f59e0b" />
          <Text style={styles.addPhaseBtnText}>Initialize Phase 1</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.treeContainer}>
      {roadmap.map((milestone, index) => {
        const isFirst = index === 0;
        const isLast = index === roadmap.length - 1;
        const isEven = index % 2 === 0; // Even: Card on Right, Odd: Card on Left
        const isDone = Boolean(milestone.completed);
        const isFinal = Boolean(milestone.isFinal);
        const isEditing = editingId === milestone.id;

        // Stem coloring: active if current and previous completed
        const prevCompleted = index > 0 ? Boolean(roadmap[index - 1]?.completed) : true;
        const isStemActive = isDone || prevCompleted;

        // Phase display number
        const phaseNumber = milestone.phaseNumber || index + 1;
        const phaseLabel = milestone.phaseTitle || `Phase ${phaseNumber}`;

        return (
          <View key={milestone.id} style={styles.timelineRow}>
            {/* Top Stem Segment (connects from previous row) */}
            {!isFirst && (
              <View
                style={[
                  styles.stemSegmentTop,
                  isStemActive ? styles.stemSegmentActive : styles.stemSegmentInactive
                ]}
              />
            )}

            {/* Bottom Stem Segment (connects to next row) */}
            {!isLast && (
              <View
                style={[
                  styles.stemSegmentBottom,
                  isDone ? styles.stemSegmentActive : styles.stemSegmentInactive
                ]}
              />
            )}

            {/* LEFT ZONE */}
            <View style={[styles.sideZone, styles.leftZone]}>
              {!isEven ? (
                // ODD INDEX: Milestone Card is on LEFT
                renderCard({
                  milestone,
                  phaseLabel,
                  phaseNumber,
                  isDone,
                  isFinal,
                  isEditing,
                  editText,
                  setEditText,
                  handleStartEdit,
                  handleSaveEdit,
                  setEditingId,
                  handleToggleFinal,
                  onToggleMilestone,
                  onDeleteMilestone,
                  canDelete: roadmap.length > 1,
                  alignment: 'left'
                })
              ) : (
                // EVEN INDEX: Subtle Phase Indicator on LEFT
                <View style={[styles.phaseIndicatorChip, isDone && styles.phaseChipDone]}>
                  <Text style={[styles.phaseIndicatorText, isDone && styles.phaseTextDone]}>
                    {phaseLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* CENTER STEM & CIRCULAR NODE */}
            <View style={styles.centerNodeColumn}>
              {/* Horizontal Branch Connector Line */}
              <View
                style={[
                  isEven ? styles.branchConnectorRight : styles.branchConnectorLeft,
                  isDone && styles.branchConnectorActive,
                  isFinal && styles.branchConnectorFinal
                ]}
              />

              {/* Interactive Node Disc */}
              <TouchableOpacity
                style={[
                  styles.nodeDisc,
                  isDone && styles.nodeDiscDone,
                  isFinal && styles.nodeDiscFinal,
                  !isDone && !isFinal && styles.nodeDiscActive
                ]}
                onPress={() => {
                  triggerHaptic();
                  onToggleMilestone(milestone.id);
                }}
                activeOpacity={0.8}
              >
                {isFinal ? (
                  <Ionicons name="trophy" size={17} color="#fbbf24" />
                ) : isDone ? (
                  <Ionicons name="checkmark" size={17} color="#10b981" />
                ) : (
                  <Text style={styles.nodePhaseNum}>
                    {phaseNumber < 10 ? `0${phaseNumber}` : phaseNumber}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* RIGHT ZONE */}
            <View style={[styles.sideZone, styles.rightZone]}>
              {isEven ? (
                // EVEN INDEX: Milestone Card is on RIGHT
                renderCard({
                  milestone,
                  phaseLabel,
                  phaseNumber,
                  isDone,
                  isFinal,
                  isEditing,
                  editText,
                  setEditText,
                  handleStartEdit,
                  handleSaveEdit,
                  setEditingId,
                  handleToggleFinal,
                  onToggleMilestone,
                  onDeleteMilestone,
                  canDelete: roadmap.length > 1,
                  alignment: 'right'
                })
              ) : (
                // ODD INDEX: Subtle Phase Indicator on RIGHT
                <View style={[styles.phaseIndicatorChip, isDone && styles.phaseChipDone]}>
                  <Text style={[styles.phaseIndicatorText, isDone && styles.phaseTextDone]}>
                    {phaseLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* FOOTER: Stem continuation & + Add Phase Button */}
      <View style={styles.treeFooter}>
        <View style={styles.footerStemLine} />
        {isAddingPhase ? (
          <View style={styles.addPhaseInputBox}>
            <TextInput
              style={styles.addPhaseInput}
              placeholder={`Phase ${roadmap.length + 1} Target...`}
              placeholderTextColor="#64748b"
              value={newPhaseTitle}
              onChangeText={setNewPhaseTitle}
              autoFocus
              onSubmitEditing={handleCreatePhase}
            />
            <View style={styles.addPhaseActions}>
              <TouchableOpacity style={styles.addPhaseSaveBtn} onPress={handleCreatePhase}>
                <Ionicons name="checkmark" size={14} color="#ffffff" />
                <Text style={styles.addPhaseSaveText}>Add Phase</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addPhaseCancelBtn}
                onPress={() => {
                  setIsAddingPhase(false);
                  setNewPhaseTitle('');
                }}
              >
                <Text style={styles.addPhaseCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addPhasePillBtn}
            onPress={() => setIsAddingPhase(true)}
            activeOpacity={0.8}
          >
            <View style={styles.addPhaseIconWrap}>
              <Ionicons name="add" size={15} color="#fbbf24" />
            </View>
            <Text style={styles.addPhasePillText}>+ Add Phase / Milestone</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Helper renderer for Milestone Cards
const renderCard = ({
  milestone,
  phaseLabel,
  isDone,
  isFinal,
  isEditing,
  editText,
  setEditText,
  handleStartEdit,
  handleSaveEdit,
  setEditingId,
  handleToggleFinal,
  onToggleMilestone,
  onDeleteMilestone,
  canDelete,
  alignment
}) => {
  return (
    <View
      style={[
        styles.milestoneCard,
        alignment === 'left' ? styles.cardAlignLeft : styles.cardAlignRight,
        isDone && styles.cardDone,
        isFinal && styles.cardFinal
      ]}
    >
      {/* Card Header: Phase Tag + Supreme Crown Tag */}
      <View style={styles.cardHeaderRow}>
        <View
          style={[
            styles.phaseBadge,
            isDone && styles.phaseBadgeDone,
            isFinal && styles.phaseBadgeFinal
          ]}
        >
          <Text
            style={[
              styles.phaseBadgeText,
              isDone && styles.phaseBadgeTextDone,
              isFinal && styles.phaseBadgeTextFinal
            ]}
          >
            {isFinal ? `🏆 ${phaseLabel} (FINAL)` : phaseLabel}
          </Text>
        </View>

        {/* Action icons row */}
        <View style={styles.cardActionsRow}>
          {/* Crown toggle for Final Supreme Milestone */}
          <TouchableOpacity
            style={[styles.miniActionBtn, isFinal && styles.miniActionBtnFinal]}
            onPress={() => handleToggleFinal(milestone.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Set as Supreme Milestone"
          >
            <Ionicons
              name={isFinal ? 'trophy' : 'trophy-outline'}
              size={13}
              color={isFinal ? '#fbbf24' : '#64748b'}
            />
          </TouchableOpacity>

          {/* Edit title */}
          <TouchableOpacity
            style={styles.miniActionBtn}
            onPress={() => handleStartEdit(milestone)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="edit-2" size={11} color="#94a3b8" />
          </TouchableOpacity>

          {/* Delete if allowed */}
          {canDelete && (
            <TouchableOpacity
              style={styles.miniActionBtn}
              onPress={() => onDeleteMilestone(milestone.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="trash-2" size={11} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Card Body: Title (or inline edit input) */}
      {isEditing ? (
        <View style={styles.inlineEditWrap}>
          <TextInput
            style={styles.inlineInput}
            value={editText}
            onChangeText={setEditText}
            autoFocus
            onSubmitEditing={() => handleSaveEdit(milestone.id)}
            placeholder="Milestone target title..."
            placeholderTextColor="#64748b"
          />
          <View style={styles.inlineEditBtns}>
            <TouchableOpacity
              style={styles.inlineSaveBtn}
              onPress={() => handleSaveEdit(milestone.id)}
            >
              <Ionicons name="checkmark" size={13} color="#ffffff" />
              <Text style={styles.inlineSaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inlineCancelBtn}
              onPress={() => setEditingId(null)}
            >
              <Text style={styles.inlineCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onToggleMilestone(milestone.id)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.milestoneTitle,
              isDone && styles.milestoneTitleDone,
              isFinal && styles.milestoneTitleFinal
            ]}
          >
            {milestone.title}
          </Text>
          <View style={styles.cardStatusRow}>
            <Ionicons
              name={isDone ? 'checkmark-circle' : isFinal ? 'star' : 'ellipse-outline'}
              size={11}
              color={isDone ? '#10b981' : isFinal ? '#fbbf24' : '#64748b'}
            />
            <Text
              style={[
                styles.cardStatusText,
                isDone && styles.cardStatusDone,
                isFinal && styles.cardStatusFinal
              ]}
            >
              {isDone
                ? 'Phase Unlocked ✓'
                : isFinal
                ? 'Supreme Milestone 🏆'
                : 'In Progress'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  treeContainer: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center'
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 88,
    marginVertical: 4,
    position: 'relative'
  },
  /* Central vertical stem segments */
  stemSegmentTop: {
    position: 'absolute',
    top: 0,
    bottom: '50%',
    left: '50%',
    width: 2.5,
    marginLeft: -1.25,
    zIndex: 1
  },
  stemSegmentBottom: {
    position: 'absolute',
    top: '50%',
    bottom: 0,
    left: '50%',
    width: 2.5,
    marginLeft: -1.25,
    zIndex: 1
  },
  stemSegmentActive: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4
  },
  stemSegmentInactive: {
    backgroundColor: '#1e293b'
  },
  /* Side zones */
  sideZone: {
    flex: 1,
    paddingHorizontal: 6
  },
  leftZone: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  rightZone: {
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  /* Center node */
  centerNodeColumn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    position: 'relative'
  },
  branchConnectorLeft: {
    position: 'absolute',
    right: 22,
    width: 20,
    height: 2,
    backgroundColor: '#334155',
    zIndex: 2
  },
  branchConnectorRight: {
    position: 'absolute',
    left: 22,
    width: 20,
    height: 2,
    backgroundColor: '#334155',
    zIndex: 2
  },
  branchConnectorActive: {
    backgroundColor: '#f59e0b'
  },
  branchConnectorFinal: {
    backgroundColor: '#fbbf24',
    height: 2.5
  },
  nodeDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#090d16',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3
  },
  nodeDiscActive: {
    borderColor: 'rgba(245, 158, 11, 0.6)',
    backgroundColor: '#14120c'
  },
  nodeDiscDone: {
    borderColor: '#10b981',
    backgroundColor: '#061a12',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 6
  },
  nodeDiscFinal: {
    borderColor: '#fbbf24',
    backgroundColor: '#261b07',
    borderWidth: 2.5,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.6,
    shadowRadius: 8
  },
  nodePhaseNum: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8'
  },
  /* Opposite phase indicator chip */
  phaseIndicatorChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0d131f',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  phaseChipDone: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)'
  },
  phaseIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.3
  },
  phaseTextDone: {
    color: '#10b981'
  },
  /* Milestone Card */
  milestoneCard: {
    width: '100%',
    maxWidth: 180,
    backgroundColor: '#0c1220',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.2,
    borderColor: '#1e293b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2
  },
  cardAlignLeft: {
    alignSelf: 'flex-end'
  },
  cardAlignRight: {
    alignSelf: 'flex-start'
  },
  cardDone: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.06)'
  },
  cardFinal: {
    borderColor: 'rgba(251, 191, 36, 0.65)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 4
  },
  phaseBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#162032',
    borderWidth: 1,
    borderColor: '#223048'
  },
  phaseBadgeDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  phaseBadgeFinal: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderColor: 'rgba(251, 191, 36, 0.5)'
  },
  phaseBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.4
  },
  phaseBadgeTextDone: {
    color: '#10b981'
  },
  phaseBadgeTextFinal: {
    color: '#fbbf24',
    fontWeight: '900'
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  miniActionBtn: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  miniActionBtnFinal: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)'
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    lineHeight: 16,
    marginBottom: 4
  },
  milestoneTitleDone: {
    color: '#94a3b8',
    textDecorationLine: 'line-through'
  },
  milestoneTitleFinal: {
    color: '#fef08a'
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  cardStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b'
  },
  cardStatusDone: {
    color: '#10b981'
  },
  cardStatusFinal: {
    color: '#fbbf24'
  },
  /* Inline Edit */
  inlineEditWrap: {
    marginTop: 2
  },
  inlineInput: {
    backgroundColor: '#070b13',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
    color: '#ffffff',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 4
  },
  inlineEditBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  inlineSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  inlineSaveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff'
  },
  inlineCancelBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  inlineCancelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600'
  },
  /* Footer & Add Phase */
  treeFooter: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    position: 'relative'
  },
  footerStemLine: {
    width: 2.5,
    height: 16,
    backgroundColor: '#1e293b',
    marginBottom: 6
  },
  addPhasePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0e1726',
    borderWidth: 1.2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20
  },
  addPhaseIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addPhasePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.3
  },
  addPhaseInputBox: {
    width: '90%',
    maxWidth: 280,
    backgroundColor: '#0b111e',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24'
  },
  addPhaseInput: {
    color: '#ffffff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#050811',
    borderRadius: 6,
    marginBottom: 6
  },
  addPhaseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  addPhaseSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  addPhaseSaveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000'
  },
  addPhaseCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  addPhaseCancelText: {
    fontSize: 11,
    color: '#94a3b8'
  },
  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    padding: 16
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8
  },
  addPhaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#162032',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  addPhaseBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#f59e0b'
  }
});

