import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { WidgetBridgeModule } = NativeModules;
const WIDGET_LOCAL_BACKUP = '@streak_widget_sync_backup';

/**
 * Synchronizes the streak count, active challenge title, status, and AI message
 * to the native home screen widgets on iOS (WidgetKit) and Android (AppWidgetProvider).
 */
export const syncToNativeWidget = async ({ streakCount, challengeTitle, status, aiMotivation }) => {
  const payload = {
    streakCount: Number(streakCount) || 0,
    challengeTitle: String(challengeTitle || 'Challenge'),
    status: String(status || 'ACTIVE'), // 'ACTIVE' | 'BROKEN' | 'FROZEN'
    aiMotivation: String(aiMotivation || 'Keep pushing!'),
    updatedAt: new Date().toISOString()
  };

  // Always backup locally in AsyncStorage for fallback / debugging
  try {
    await AsyncStorage.setItem(WIDGET_LOCAL_BACKUP, JSON.stringify(payload));
  } catch (e) {
    // Ignore backup failure
  }

  // If running in bare React Native or EAS Build with native modules compiled:
  if (WidgetBridgeModule && typeof WidgetBridgeModule.updateWidgetData === 'function') {
    try {
      await WidgetBridgeModule.updateWidgetData(payload);
      console.log('[WidgetBridge] Successfully updated native widget:', payload);
      return { success: true };
    } catch (err) {
      console.warn('[WidgetBridge] Native update call failed:', err);
      return { success: false, error: err.message };
    }
  } else {
    // Graceful fallback for Expo Go / simulated dev environment
    console.log(
      `[WidgetBridge] (Simulated / Expo Go): Widget data would sync to ${Platform.OS.toUpperCase()}:`,
      payload
    );
    return { success: true, simulated: true };
  }
};

