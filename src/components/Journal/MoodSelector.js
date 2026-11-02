import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const MOODS = [
  { emoji: '🤩', label: 'Unstoppable' },
  { emoji: '🔥', label: 'On Fire' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Struggling' },
  { emoji: '💀', label: 'Cooked' }
];

export const MoodSelector = ({ selectedMood, onSelectMood }) => {
  const handleSelect = (emoji) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelectMood(emoji);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((item) => {
          const isSelected = selectedMood === item.emoji;
          return (
            <TouchableOpacity
              key={item.emoji}
              style={[styles.moodItem, isSelected && styles.moodItemSelected]}
              onPress={() => handleSelect(item.emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{item.emoji}</Text>
              <Text style={[styles.labelText, isSelected && styles.labelSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b949e',
    marginBottom: 10
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#0d1117',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262d'
  },
  moodItemSelected: {
    borderColor: '#f97316',
    backgroundColor: '#27150c'
  },
  emojiText: {
    fontSize: 26,
    marginBottom: 4
  },
  labelText: {
    fontSize: 10,
    color: '#8b949e',
    fontWeight: '600'
  },
  labelSelected: {
    color: '#f97316',
    fontWeight: '700'
  }
});

