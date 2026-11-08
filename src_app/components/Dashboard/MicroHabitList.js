import React, { useState, useMemo } from 'react';
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
import { getLocalDateString } from '../../storage/asyncStorage';

export const MicroHabitList = ({
  habits = [],
  history = {},
  onToggleHabit,
  onAddHabit,
  onDeleteHabit
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const isAllDone = totalCount > 0 && completedCount >= totalCount;
  const isLocked = completedCount >= Math.min(3, totalCount);

  // Generate the last 7 calendar days ending on today (Day -6 to Today)
  const past7Days = useMemo(() => {
    const list = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayLabel = dayNames[d.getDay()];
      list.push({ dateStr, dayLabel, isToday: i === 0 });
    }
    return list;
  }, []);

  // Determine completion of a habit on a specific day
  const isHabitDoneOnDay = (habit, dayObj) => {
    if (dayObj.isToday) {
      return Boolean(habit.completedToday);
    }
    if (!history) return false;
    const entry = history[dayObj.dateStr];
    if (!entry) return false;

    if (Array.isArray(entry.completedHabitIds) && entry.completedHabitIds.includes(habit.id)) {
      return true;
    }
    if (
      Array.isArray(entry.completedHabits) &&
      entry.completedHabits.some((t) =>
        t &&
        habit.title &&
        (t.toLowerCase().includes(habit.title.toLowerCase().slice(0, 8)) ||
          habit.title.toLowerCase().includes(t.toLowerCase().slice(0, 8)))
      )
    ) {
      return true;
    }
    if (
      entry.completed &&
      (habit.isNonEditable || habit.id?.startsWith('core_')) &&
      (entry.ratio || 0) >= 0.75
    ) {
      return true;
    }
    return false;
  };

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
            <Ionicons name="flash" size={16} color="#22c55e" />
            <Text style={styles.title} numberOfLines={1}>Daily Micro-Habits</Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            Micro-habit stacking for maximum consistency
          </Text>
        </View>

        <View style={[styles.progressPill, isLocked && styles.progressPillLocked]}>
          <Ionicons
            name={isAllDone ? 'shield-checkmark' : isLocked ? 'checkmark-circle' : 'flame'}
            size={12}
            color={isLocked ? '#22c55e' : '#f97316'}
          />
          <Text style={[styles.progressText, isLocked && styles.progressTextLocked]}>
            {isAllDone
              ? `${completedCount}/${totalCount} Done ✓`
              : `${completedCount}/${totalCount} to Lock`}
          </Text>
        </View>
      </View>

      {/* Sub-Header: Habit Title column on Left, 7-Day Day Initials column on Right */}
      <View style={styles.colHeaderRow}>
        <Text style={styles.colHeaderTitle}>HABIT</Text>
        <View style={styles.colHeaderDotsRow}>
          {past7Days.map((d) => (
            <View key={`col_hdr_${d.dateStr}`} style={styles.colHeaderDotCell}>
              <Text
                style={[
                  styles.colHeaderDayText,
                  d.isToday && styles.colHeaderDayTextToday
                ]}
              >
                {d.dayLabel}
              </Text>
              {d.isToday && <View style={styles.colHeaderTodayIndicator} />}
            </View>
          ))}
        </View>
      </View>

      {/* Habit Items: Checkbox + Title + 7-Day Consistency Dots unified in one row */}
      {habits.map((habit, index) => {
        const isDone = Boolean(habit.completedToday);
        const isCore = habit.isNonEditable || habit.id?.startsWith('core_');
        return (
          <View
            key={habit.id}
            style={[styles.habitRow, isDone && styles.habitRowCompleted]}
          >
            {/* Left Touch Area: Index + Checkbox + Habit Title + Core Lock */}
            <TouchableOpacity
              style={styles.habitLeftTouch}
              onPress={() => handleToggle(habit.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.habitIndexBadge, isDone && styles.habitIndexBadgeDone]}>
                <Text style={[styles.habitIndexText, isDone && styles.habitIndexTextDone]}>
                  {index < 9 ? `0${index + 1}` : index + 1}
                </Text>
              </View>

              <View style={[styles.checkbox, isDone && styles.checkboxActive]}>
                {isDone && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>

              <View style={styles.titleWrapper}>
                <Text
                  style={[styles.habitTitle, isDone && styles.habitTitleCompleted]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {habit.title}
                </Text>
              </View>

              {isCore && (
                <Ionicons
                  name="lock-closed"
                  size={10}
                  color="#fbbf24"
                  style={styles.lockIcon}
                />
              )}
            </TouchableOpacity>

            {/* Right: 7-Day Consistency Dots (Picture 3 Reference) */}
            <View style={styles.dotsRow}>
              {past7Days.map((dayObj) => {
                const isDayDone = isHabitDoneOnDay(habit, dayObj);
                return (
                  <View
                    key={`dot_${habit.id}_${dayObj.dateStr}`}
                    style={styles.dotCell}
                  >
                    <View
                      style={[
                        styles.dotCircle,
                        isDayDone ? styles.dotCircleDone : styles.dotCircleEmpty,
                        dayObj.isToday && isDayDone && styles.dotCircleTodayDone,
                        dayObj.isToday && !isDayDone && styles.dotCircleTodayEmpty
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Delete button for custom non-core habits */}
            {!isCore && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeleteHabit(habit.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={12} color="#6e7681" />
              </TouchableOpacity>
            )}
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
          <Ionicons name="add-circle-outline" size={16} color="#58a6ff" />
          <Text style={styles.addHabitButtonText}>Stack another micro-habit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0c1017',
    borderRadius: 18,
    padding: 13,
    marginHorizontal: 10,
    marginVertical: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  titleGroup: {
    flex: 1,
    minWidth: 140
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.2
  },
  subtitle: {
    fontSize: 10.5,
    color: '#8b949e',
    marginTop: 1
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    flexShrink: 0
  },
  progressPillLocked: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.5)'
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f97316'
  },
  progressTextLocked: {
    color: '#22c55e'
  },
  /* Column Sub-Header */
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  colHeaderTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8
  },
  colHeaderDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 84,
    justifyContent: 'space-between'
  },
  colHeaderDotCell: {
    width: 11,
    alignItems: 'center'
  },
  colHeaderDayText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b'
  },
  colHeaderDayTextToday: {
    color: '#f43f5e',
    fontWeight: '900'
  },
  colHeaderTodayIndicator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#f43f5e',
    marginTop: 1
  },
  /* Habit Row */
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#090d14',
    paddingVertical: 9,
    paddingHorizontal: 9,
    borderRadius: 12,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#1e2430',
    overflow: 'hidden'
  },
  habitRowCompleted: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    backgroundColor: 'rgba(34, 197, 94, 0.06)'
  },
  habitLeftTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    marginRight: 6
  },
  habitIndexBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#161b22',
    borderWidth: 1,
    borderColor: '#2d333b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    flexShrink: 0
  },
  habitIndexBadgeDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)'
  },
  habitIndexText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8b949e'
  },
  habitIndexTextDone: {
    color: '#22c55e'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#484f58',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#070a0f',
    flexShrink: 0
  },
  checkboxActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  titleWrapper: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center'
  },
  habitTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#f0f6fc',
    lineHeight: 16
  },
  habitTitleCompleted: {
    color: '#8b949e',
    textDecorationLine: 'line-through'
  },
  lockIcon: {
    marginLeft: 5,
    flexShrink: 0
  },
  /* 7-Day Consistency Dots Row (Picture 3 Reference) */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 84,
    justifyContent: 'space-between',
    flexShrink: 0
  },
  dotCell: {
    width: 11,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dotCircle: {
    width: 7.5,
    height: 7.5,
    borderRadius: 3.75
  },
  dotCircleDone: {
    backgroundColor: '#f43f5e',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 3
  },
  dotCircleEmpty: {
    backgroundColor: '#1f2530'
  },
  dotCircleTodayDone: {
    backgroundColor: '#f43f5e',
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: '#f43f5e',
    shadowRadius: 5
  },
  dotCircleTodayEmpty: {
    backgroundColor: '#141820',
    borderWidth: 1,
    borderColor: '#475569'
  },
  deleteButton: {
    padding: 4,
    marginLeft: 4,
    flexShrink: 0
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    marginTop: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#21262d',
    borderStyle: 'dashed',
    gap: 6
  },
  addHabitButtonText: {
    color: '#58a6ff',
    fontSize: 12,
    fontWeight: '600'
  },
  inputContainer: {
    marginTop: 6,
    backgroundColor: '#0d1117',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#388bfd'
  },
  input: {
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 5,
    paddingHorizontal: 8
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6
  },
  saveBtn: {
    backgroundColor: '#238636',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  cancelBtnText: {
    color: '#8b949e',
    fontWeight: '600',
    fontSize: 11
  }
});
