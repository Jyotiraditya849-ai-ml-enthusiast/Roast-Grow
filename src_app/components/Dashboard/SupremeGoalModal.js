import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getLocalDateString } from '../../storage/asyncStorage';
import { pickRoadmapFileOrPhoto } from '../../services/mediaPickerService';

export const SupremeGoalModal = ({
  visible,
  onClose,
  supremeGoal,
  onUpdateDetails,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onSetFinalMilestone
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [attachmentUri, setAttachmentUri] = useState(null);
  const [attachmentName, setAttachmentName] = useState(null);
  const [attachmentType, setAttachmentType] = useState(null);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  useEffect(() => {
    if (supremeGoal) {
      setTitle(supremeGoal.title || '');
      setDescription(supremeGoal.description || '');
      setDeadline(supremeGoal.deadline || '2027-12-31');
      setAttachmentUri(supremeGoal.attachmentUri || null);
      setAttachmentName(supremeGoal.attachmentName || null);
      setAttachmentType(supremeGoal.attachmentType || null);
    }
  }, [supremeGoal, visible]);

  const handleSaveDetails = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a Supreme Goal title.');
      return;
    }
    await onUpdateDetails({
      title: title.trim(),
      description: description.trim(),
      deadline: deadline.trim() || '2027-12-31',
      attachmentUri,
      attachmentName,
      attachmentType
    });
    onClose();
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneText.trim()) return;
    await onAddMilestone(newMilestoneText.trim());
    setNewMilestoneText('');
  };

  const setDeadlinePreset = (monthsToAdd) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsToAdd);
    setDeadline(getLocalDateString(d));
  };

  // + icon file/photo/PDF picker for Roadmap
  const handlePickRoadmapAttachment = async () => {
    const asset = await pickRoadmapFileOrPhoto();
    if (asset) {
      setAttachmentUri(asset.uri);
      setAttachmentName(asset.name);
      setAttachmentType(asset.type);
    }
  };

  const isPdf = Boolean(
    attachmentType === 'pdf' ||
    attachmentName?.toLowerCase().endsWith('.pdf')
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="trophy" size={22} color="#eab308" />
              <Text style={styles.headerTitle}>Configure Supreme Goal</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#8b949e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Main Goal Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supreme Goal Title 🎯</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Become a Senior Full-Stack Engineer"
                placeholderTextColor="#6e7681"
              />
            </View>

            {/* Vision / Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vision & Why (Motivation) 💡</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Why is this supreme goal worth your daily discipline?"
                placeholderTextColor="#6e7681"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Expected Completion Deadline */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expected Completion Deadline ⏳</Text>
              <TextInput
                style={styles.input}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="YYYY-MM-DD (e.g. 2027-12-31)"
                placeholderTextColor="#6e7681"
              />
              {/* Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setDeadlinePreset(3)}
                >
                  <Text style={styles.presetBtnText}>+3 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setDeadlinePreset(6)}
                >
                  <Text style={styles.presetBtnText}>+6 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setDeadlinePreset(12)}
                >
                  <Text style={styles.presetBtnText}>+1 Year</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setDeadline('2027-12-31')}
                >
                  <Text style={styles.presetBtnText}>Dec 2027</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ROADMAP MILESTONES WITH SIDE + FILE UPLOAD BUTTON */}
            <View style={styles.roadmapSection}>
              {/* Header with Side + Button */}
              <View style={styles.roadmapHeaderRow}>
                <View style={styles.roadmapHeaderTitles}>
                  <Text style={styles.label}>Strategic Roadmap Milestones 🗺️</Text>
                  <Text style={styles.sublabel}>
                    Phases leading to your Supreme Goal
                  </Text>
                </View>

                {/* Side + Button for Full Roadmap File / PDF / Photo */}
                <TouchableOpacity
                  style={styles.plusFileBtn}
                  onPress={handlePickRoadmapAttachment}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={17} color="#eab308" />
                  <Text style={styles.plusFileText}>+ Roadmap PDF/Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Attached Roadmap File Pill (if attached) */}
              {attachmentUri && (
                <View style={styles.attachedPillRow}>
                  {isPdf ? (
                    <Ionicons name="document-text" size={18} color="#ef4444" />
                  ) : (
                    <Image source={{ uri: attachmentUri }} style={styles.attachedMiniThumb} />
                  )}
                  <View style={styles.attachedPillMeta}>
                    <Text style={styles.attachedFileName} numberOfLines={1}>
                      {attachmentName || 'roadmap_blueprint'}
                    </Text>
                    <Text style={styles.attachedFileStatus}>
                      ✓ Full Roadmap {isPdf ? 'PDF' : 'Photo'} Attached
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeAttachedBtn}
                    onPress={() => {
                      setAttachmentUri(null);
                      setAttachmentName(null);
                      setAttachmentType(null);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Existing Milestones List */}
              {(supremeGoal?.roadmap || []).map((milestone, idx) => {
                const phaseNum = milestone.phaseNumber || idx + 1;
                const isFinal = Boolean(milestone.isFinal);
                return (
                  <View
                    key={milestone.id}
                    style={[styles.milestoneRow, isFinal && styles.milestoneRowFinal]}
                  >
                    <TouchableOpacity
                      style={styles.milestoneCheck}
                      onPress={() => onToggleMilestone(milestone.id)}
                    >
                      <Ionicons
                        name={milestone.completed ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={milestone.completed ? '#22c55e' : '#8b949e'}
                      />
                    </TouchableOpacity>

                    <View style={styles.milestoneContent}>
                      <View style={styles.phaseTagRow}>
                        <Text style={[styles.phaseTagText, isFinal && styles.phaseTagFinalText]}>
                          {isFinal ? `🏆 Phase ${phaseNum} (Supreme Target)` : `Phase ${phaseNum}`}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.milestoneTitle,
                          milestone.completed && styles.milestoneDoneText,
                          isFinal && styles.milestoneTitleFinal
                        ]}
                      >
                        {milestone.title}
                      </Text>
                    </View>

                    {/* Final Milestone Crown/Trophy Selector */}
                    {onSetFinalMilestone && (
                      <TouchableOpacity
                        style={[styles.finalSelectBtn, isFinal && styles.finalSelectBtnActive]}
                        onPress={() => onSetFinalMilestone(milestone.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isFinal ? 'trophy' : 'trophy-outline'}
                          size={16}
                          color={isFinal ? '#fbbf24' : '#6e7681'}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.deleteMilestoneBtn}
                      onPress={() => onDeleteMilestone(milestone.id)}
                    >
                      <Feather name="trash-2" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add Milestone Input */}
              <View style={styles.addMilestoneBox}>
                <TextInput
                  style={styles.addMilestoneInput}
                  value={newMilestoneText}
                  onChangeText={setNewMilestoneText}
                  placeholder="e.g. Phase 4: Deploy & Scale to 50k users"
                  placeholderTextColor="#6e7681"
                  onSubmitEditing={handleAddMilestone}
                />
                <TouchableOpacity
                  style={styles.addMilestoneBtn}
                  onPress={handleAddMilestone}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.addMilestoneBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveDetails}
            >
              <Ionicons name="checkmark-sharp" size={18} color="#ffffff" />
              <Text style={styles.saveBtnText}>Save Supreme Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#161b22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eab308',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#30363d',
    backgroundColor: '#0d1117'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  closeBtn: {
    padding: 4
  },
  body: {
    padding: 20
  },
  inputGroup: {
    marginBottom: 18
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0f6fc',
    marginBottom: 4
  },
  sublabel: {
    fontSize: 12,
    color: '#8b949e',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#0d1117',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f0f6fc',
    fontSize: 15
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top'
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap'
  },
  presetBtn: {
    backgroundColor: '#21262d',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  presetBtnText: {
    fontSize: 11,
    color: '#eab308',
    fontWeight: '700'
  },
  roadmapSection: {
    marginBottom: 20,
    backgroundColor: '#0d1117',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363d',
    overflow: 'hidden'
  },
  roadmapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  roadmapHeaderTitles: {
    flex: 1,
    minWidth: 160
  },
  plusFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#eab308',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  plusFileText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '700'
  },
  attachedPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10
  },
  attachedMiniThumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#21262d'
  },
  attachedPillMeta: {
    flex: 1
  },
  attachedFileName: {
    fontSize: 12,
    color: '#f0f6fc',
    fontWeight: '600'
  },
  attachedFileStatus: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: '700',
    marginTop: 1
  },
  removeAttachedBtn: {
    padding: 6
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161b22',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    gap: 8
  },
  milestoneRowFinal: {
    borderColor: 'rgba(251, 191, 36, 0.6)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)'
  },
  milestoneCheck: {
    marginRight: 4
  },
  milestoneContent: {
    flex: 1
  },
  phaseTagRow: {
    marginBottom: 2
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8b949e',
    letterSpacing: 0.3
  },
  phaseTagFinalText: {
    color: '#fbbf24',
    fontWeight: '900'
  },
  milestoneTitle: {
    fontSize: 13.5,
    color: '#f0f6fc',
    fontWeight: '600'
  },
  milestoneTitleFinal: {
    color: '#fef08a'
  },
  milestoneDoneText: {
    textDecorationLine: 'line-through',
    color: '#8b949e'
  },
  finalSelectBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#0d1117'
  },
  finalSelectBtnActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)'
  },
  deleteMilestoneBtn: {
    padding: 4,
    marginLeft: 6
  },
  addMilestoneBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  addMilestoneInput: {
    flex: 1,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f0f6fc',
    fontSize: 13
  },
  addMilestoneBtn: {
    backgroundColor: '#238636',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center'
  },
  addMilestoneBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#30363d',
    backgroundColor: '#0d1117'
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#21262d'
  },
  cancelBtnText: {
    color: '#8b949e',
    fontWeight: '700',
    fontSize: 14
  },
  saveBtn: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14
  }
});
