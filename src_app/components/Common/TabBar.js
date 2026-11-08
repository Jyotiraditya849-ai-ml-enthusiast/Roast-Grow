import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../../theme';

export const TabBar = React.memo(({ activeTab, onSelectTab }) => {
  const tabs = [
    { key: 'dashboard', label: 'Home', icon: 'home', type: 'feather', activeColor: THEME.marigold },
    { key: 'journal', label: 'Journal', icon: 'book-open', type: 'feather', activeColor: THEME.blueLight },
    { key: 'create', label: 'Create', icon: 'plus', type: 'centerFloating' },
    { key: 'heatmap', label: 'Activity', icon: 'grid', type: 'feather', activeColor: THEME.marigoldLight },
    { key: 'vault', label: 'Vault', icon: 'snowflake', type: 'fa5', activeColor: THEME.blueLight }
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

        // Elevated Center Floating (+) Button (Image 2 Replica)
        if (tab.type === 'centerFloating') {
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.centerFloatingBtn,
                isActive && styles.centerFloatingBtnActive
              ]}
              onPress={() => handlePress(tab.key)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={26} color="#ffffff" />
            </TouchableOpacity>
          );
        }

        const activeColor = tab.activeColor || THEME.marigold;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              isActive && {
                backgroundColor: tab.key === 'dashboard' || tab.key === 'heatmap' ? THEME.marigoldBg : THEME.blueBg,
                borderColor: tab.key === 'dashboard' || tab.key === 'heatmap' ? THEME.marigoldBorder : THEME.blueBorder,
                borderWidth: 1
              }
            ]}
            onPress={() => handlePress(tab.key)}
            activeOpacity={0.75}
          >
            {tab.type === 'feather' && (
              <Feather
                name={tab.icon}
                size={isActive ? 20 : 18}
                color={isActive ? activeColor : THEME.textMuted}
              />
            )}
            {tab.type === 'fa5' && (
              <FontAwesome5
                name={tab.icon}
                size={isActive ? 18 : 16}
                color={isActive ? activeColor : THEME.textMuted}
              />
            )}
            <Text
              style={[
                styles.tabLabel,
                isActive && { color: activeColor, fontWeight: '800' }
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.bgApp,
    borderTopWidth: 1.5,
    borderColor: THEME.borderSubtle,
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 3
  },
  centerFloatingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    borderWidth: 2.5,
    borderColor: THEME.marigold,
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8
  },
  centerFloatingBtnActive: {
    backgroundColor: THEME.crimsonDeep,
    borderColor: THEME.blueLight,
    shadowColor: THEME.blueLight,
    shadowOpacity: 0.85
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted
  }
});

