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
            style={[
              styles.tabButton,
              isActive && (tab.key === 'vault' ? styles.tabButtonActiveBlue : styles.tabButtonActiveOrange)
            ]}
            onPress={() => handlePress(tab.key)}
            activeOpacity={0.75}
          >
            {tab.type === 'ion' && (
              <Ionicons
                name={tab.icon}
                size={isActive ? 21 : 19}
                color={isActive ? '#f97316' : '#6e7681'}
              />
            )}
            {tab.type === 'feather' && (
              <Feather
                name={tab.icon}
                size={isActive ? 21 : 19}
                color={isActive ? '#f97316' : '#6e7681'}
              />
            )}
            {tab.type === 'fa5' && (
              <FontAwesome5
                name={tab.icon}
                size={isActive ? 19 : 17}
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
    backgroundColor: '#0a0e14',
    borderTopWidth: 1.5,
    borderColor: '#1e2430',
    paddingVertical: 8,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 14,
    gap: 3
  },
  tabButtonActiveOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)'
  },
  tabButtonActiveBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)'
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6e7681'
  },
  tabLabelActive: {
    color: '#f97316',
    fontWeight: '800'
  },
  tabLabelBlue: {
    color: '#38bdf8',
    fontWeight: '800'
  }
});

