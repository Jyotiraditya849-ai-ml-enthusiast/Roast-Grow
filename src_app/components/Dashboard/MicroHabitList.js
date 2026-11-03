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

export const MicroHabitList = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;

  const handleToggle = (id) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleHabit(id);
  };

  const handleCreate = () => {
    if (newTitle.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onAddHabit(newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.titleRow}>
            <Ionicons name="flash" size={17} color="#22c55e" />
            <Text style={styles.title}>Daily Micro-Habits</Text>
          </View>
          <Text style={styles.subtitle}>Micro-habit stacking for maximum consistency</Text>
        </View>

        <View style={[styles.progressPill, completedCount >= 3 && styles.progressPillLocked]}>
          <Ionicons
            name={completedCount >= 3 ? 'shield-checkmark' : 'flame'}
            size={13}
            color={completedCount >= 3 ? '#22c55e' : '#f97316'}
          />
          <Text style={[styles.progressText, completedCount >= 3 && styles.progressTextLocked]}>
            {completedCount >= 3 ? `${completedCount}/3 Done ✓` : `${completedCount}/3 to Lock`}
          </Text>
        </View>
      </View>

      {/* Habit Items */}
      {habits.map((habit, index) => {
        const isDone = habit.completedToday;
        return (
          <View
            key={habit.id}
            style={[styles.habitRow, isDone && styles.habitRowCompleted]}
          >
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleToggle(habit.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.habitIndexBadge, isDone && styles.habitIndexBadgeDone]}>
                <Text style={[styles.habitIndexText, isDone && styles.habitIndexTextDone]}>
                  {index < 9 ? `0${index + 1}` : index + 1}
                </Text>
              </View>

              <View style={[styles.checkbox, isDone && styles.checkboxActive]}>
                {isDone && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </View>

              <Text style={[styles.habitTitle, isDone && styles.habitTitleCompleted]}>
                {habit.title}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteHabit(habit.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="trash-2" size={14} color="#6e7681" />
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Add New Micro-Habit Section */}
      {isAdding ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Read 15 pages of system design"
            placeholderTextColor="#6e7681"
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus
            onSubmitEditing={handleCreate}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setIsAdding(false);
                setNewTitle('');
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addHabitButton}
          onPress={() => setIsAdding(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color="#58a6ff" />
          <Text style={styles.addHabitButtonText}>Stack another micro-habit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8
  },
  titleGroup: {
    flex: 1,
    minWidth: 160
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2
  },
  subtitle: {
    fontSize: 11.5,
    color: '#8b949e',
    marginTop: 2
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)'
  },
  progressPillLocked: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.5)'
  },
  progressText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#f97316'
  },
  progressTextLocked: {
    color: '#22c55e'
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0e14',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e2430'
  },
  habitRowCompleted: {
    borderColor: 'rgba(34, 197, 94, 0.45)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  habitIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#2d333b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  habitIndexBadgeDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)'
  },
  habitIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8b949e'
  },
  habitIndexTextDone: {
    color: '#22c55e'
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#484f58',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#0d1117'
  },
  checkboxActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0f6fc',
    flex: 1
  },
  habitTitleCompleted: {
    color: '#8b949e',
    textDecorationLine: 'line-through'
  },
  deleteButton: {
    padding: 6,
    marginLeft: 6
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30363d',
    borderStyle: 'dashed',
    gap: 8
  },
  addHabitButtonText: {
    color: '#58a6ff',
    fontSize: 13,
    fontWeight: '600'
  },
  inputContainer: {
    marginTop: 8,
    backgroundColor: '#0d1117',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#388bfd'
  },
  input: {
    color: '#ffffff',
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  },
  saveBtn: {
    backgroundColor: '#238636',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  cancelBtnText: {
    color: '#8b949e',
    fontWeight: '600',
    fontSize: 12
  }
});

