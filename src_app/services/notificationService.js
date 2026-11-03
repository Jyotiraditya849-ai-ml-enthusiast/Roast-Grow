import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Channel ID for Android notification grouping
const REMINDER_CHANNEL_ID = 'roast-grow-reminders';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure Android notification channels with high priority, sound & vibration
 */
export const configureNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily Streak & Goal Reminders',
      description: 'Daily habit reminders and Supreme Goal deadline alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f97316',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }
};

/**
 * Request notification permissions from user (iOS & Android 13+)
 */
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Notification permission not granted');
      return false;
    }

    await configureNotificationChannels();
    return true;
  } catch (error) {
    console.warn('[NotificationService] Error requesting permission:', error);
    return false;
  }
};

/**
 * Schedule the 3 daily recurring reminders:
 * 1. Morning Kickoff (9:00 AM)
 * 2. Midday Momentum Check (2:30 PM)
 * 3. Final Evening Warning (8:30 PM)
 */
export const scheduleDailyReminders = async () => {
  if (Platform.OS === 'web') return;

  const reminders = [
    {
      hour: 9,
      minute: 0,
      title: '🌅 Morning Kickoff • Roast & Grow',
      body: "Lock in today's Supreme Mission and start your micro-habits! Don't let your streak slip today. 🔥",
    },
    {
      hour: 14,
      minute: 30,
      title: '⚡ Midday Momentum Check',
      body: 'Half the day is done! Have you checked off your daily habits yet? Keep the discipline strong.',
    },
    {
      hour: 20,
      minute: 30,
      title: '🚨 Final Streak Warning!',
      body: 'Midnight is approaching! Complete your Supreme Mission & check in before your day streak breaks.',
    },
  ];

  for (const item of reminders) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          sound: 'default',
          color: '#f97316',
          channelId: REMINDER_CHANNEL_ID,
        },
        trigger: {
          hour: item.hour,
          minute: item.minute,
          repeats: true,
        },
      });
      console.log(`[NotificationService] Scheduled daily reminder for ${item.hour}:${item.minute < 10 ? '0' : ''}${item.minute}`);
    } catch (err) {
      console.warn(`[NotificationService] Failed to schedule daily reminder at ${item.hour}:${item.minute}:`, err);
    }
  }
};

/**
 * Schedule special deadline alerts for Supreme Goal:
 * 1. 1 Month Before (30 days)
 * 2. 1 Week Before (7 days)
 * 3. Last Day (Deadline Day)
 */
export const scheduleDeadlineSpecialAlerts = async (supremeGoal) => {
  if (Platform.OS === 'web' || !supremeGoal?.deadline) return;

  const goalTitle = supremeGoal.title || 'Supreme Goal';
  const deadlineStr = supremeGoal.deadline; // format: 'YYYY-MM-DD'
  const deadlineDate = new Date(`${deadlineStr}T09:00:00`);

  if (isNaN(deadlineDate.getTime())) {
    console.warn('[NotificationService] Invalid deadline date:', deadlineStr);
    return;
  }

  const now = new Date();

  // 1. One Month Before (30 Days prior at 10:00 AM)
  const oneMonthDate = new Date(deadlineDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  oneMonthDate.setHours(10, 0, 0, 0);

  if (oneMonthDate > now) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏳ 1 Month Warning: Supreme Goal',
          body: `Only 30 days remaining for "${goalTitle}"! Review your roadmap milestones and accelerate.`,
          sound: 'default',
          color: '#f97316',
          channelId: REMINDER_CHANNEL_ID,
        },
        trigger: oneMonthDate,
      });
      console.log('[NotificationService] Scheduled 1-month alert for:', oneMonthDate);
    } catch (e) {
      console.warn('[NotificationService] Failed 1-month alert:', e);
    }
  }

  // 2. One Week Before (7 Days prior at 10:00 AM)
  const oneWeekDate = new Date(deadlineDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  oneWeekDate.setHours(10, 0, 0, 0);

  if (oneWeekDate > now) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 1 Week Alert: Supreme Goal!',
          body: `Final 7 days left until your "${goalTitle}" deadline! Push through the final stretch.`,
          sound: 'default',
          color: '#f97316',
          channelId: REMINDER_CHANNEL_ID,
        },
        trigger: oneWeekDate,
      });
      console.log('[NotificationService] Scheduled 1-week alert for:', oneWeekDate);
    } catch (e) {
      console.warn('[NotificationService] Failed 1-week alert:', e);
    }
  }

  // 3. Last Day (Deadline Day at 9:00 AM)
  const lastDayDate = new Date(deadlineDate.getTime());
  lastDayDate.setHours(9, 0, 0, 0);

  if (lastDayDate > now) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 FINAL DAY: Supreme Goal Deadline!',
          body: `Today is the final deadline day for "${goalTitle}"! Finish strong and secure your ultimate victory!`,
          sound: 'default',
          color: '#ef4444',
          channelId: REMINDER_CHANNEL_ID,
        },
        trigger: lastDayDate,
      });
      console.log('[NotificationService] Scheduled final-day alert for:', lastDayDate);
    } catch (e) {
      console.warn('[NotificationService] Failed final-day alert:', e);
    }
  }
};

/**
 * Reschedule all notifications cleanly:
 * Cancels old notifications to avoid duplicates, then schedules daily & deadline alerts.
 */
export const scheduleAllAppNotifications = async (supremeGoal) => {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Clear previous schedules to prevent accumulation
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[NotificationService] Cleared old scheduled notifications');

    // 1. Schedule 3 daily reminders
    await scheduleDailyReminders();

    // 2. Schedule special deadline alerts
    if (supremeGoal) {
      await scheduleDeadlineSpecialAlerts(supremeGoal);
    }

    console.log('[NotificationService] Successfully registered all reminders & alerts');
  } catch (error) {
    console.warn('[NotificationService] Failed to schedule notifications:', error);
  }
};

/**
 * Send an immediate test notification (2 seconds delay) for user verification
 */
export const sendInstantTestNotification = async () => {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Roast & Grow Test Alert',
        body: 'Notifications are working perfectly! Daily reminders (3x) and Supreme Goal alerts are active.',
        sound: 'default',
        color: '#f97316',
        channelId: REMINDER_CHANNEL_ID,
      },
      trigger: {
        seconds: 2,
      },
    });
    return true;
  } catch (err) {
    console.warn('[NotificationService] Test notification failed:', err);
    return false;
  }
};

