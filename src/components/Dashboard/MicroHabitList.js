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
        <View>
          <Text style={styles.title}>Daily Micro-Habits</Text>
          <Text style={styles.subtitle}>Micro-habit stacking for maximum consistency</Text>
        </View>

        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {completedCount}/{totalCount} Done
          </Text>
        </View>
      </View>

      {/* Habit Items */}
      {habits.map((habit) => {
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
              <Feather name="trash-2" size={15} color="#484f58" />
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
    backgroundColor: '#161b22',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  subtitle: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 2
  },
  progressPill: {
    backgroundColor: '#21262d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#58a6ff'
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d1117',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262d'
  },
  habitRowCompleted: {
    borderColor: '#238636',
    backgroundColor: '#0f2417'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#484f58',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  checkboxActive: {
    backgroundColor: '#238636',
    borderColor: '#2ea043'
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6edf3',
    flex: 1
  },
  habitTitleCompleted: {
    color: '#7ee787',
    textDecorationLine: 'line-through'
  },
  deleteButton: {
    padding: 4
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

