import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const TabBar = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { key: 'dashboard', label: 'Streak', icon: 'flame', type: 'ion' },
    { key: 'journal', label: 'Journal', icon: 'book-open', type: 'feather' },
    { key: 'heatmap', label: 'Activity', icon: 'grid', type: 'feather' },
    { key: 'vault', label: 'Vault', icon: 'snowflake', type: 'fa5' }
  ];

  const handlePress = (key) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelectTab(key);
  };

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => handlePress(tab.key)}
            activeOpacity={0.7}
          >
            {tab.type === 'ion' && (
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? '#f97316' : '#6e7681'}
              />
            )}
            {tab.type === 'feather' && (
              <Feather
                name={tab.icon}
                size={20}
                color={isActive ? '#f97316' : '#6e7681'}
              />
            )}
            {tab.type === 'fa5' && (
              <FontAwesome5
                name={tab.icon}
                size={18}
                color={isActive ? '#38bdf8' : '#6e7681'}
              />
            )}
            <Text
              style={[
                styles.tabLabel,
                isActive && (tab.key === 'vault' ? styles.tabLabelBlue : styles.tabLabelActive)
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161b22',
    borderTopWidth: 1,
    borderColor: '#30363d',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4
  },
  tabButtonActive: {},
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6e7681'
  },
  tabLabelActive: {
    color: '#f97316'
  },
  tabLabelBlue: {
    color: '#38bdf8'
  }
});

