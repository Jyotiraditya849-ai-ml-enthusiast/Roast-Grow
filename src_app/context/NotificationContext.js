import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

const NotificationContext = createContext(null);

// Global bridge for non-React services (like mediaPickerService or storage)
let globalNotificationEmitter = null;
let globalDialogEmitter = null;

export const showGlobalCyberNotification = (options) => {
  if (globalNotificationEmitter) {
    globalNotificationEmitter(options);
  } else {
    console.log('[CyberNotification] Emitter not ready:', options);
  }
};

export const showGlobalCyberDialog = (options) => {
  if (globalDialogEmitter) {
    globalDialogEmitter(options);
  } else {
    console.log('[CyberDialog] Emitter not ready:', options);
  }
};

export const NotificationProvider = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [currentDialog, setCurrentDialog] = useState(null);
  const queueRef = useRef([]);
  const isDisplayingRef = useRef(false);
  const timerRef = useRef(null);

  const processQueue = useCallback(() => {
    if (isDisplayingRef.current || queueRef.current.length === 0) {
      return;
    }

    const nextItem = queueRef.current.shift();
    isDisplayingRef.current = true;
    setCurrentNotification(nextItem);

    if (Platform.OS !== 'web') {
      try {
        if (nextItem.type === 'warning' || nextItem.type === 'alert' || nextItem.type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        // Haptics fallback
      }
    }

    const duration = nextItem.duration || 4500;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      dismissNotification();
    }, duration);
  }, []);

  const showCyberNotification = useCallback(
    ({
      type = 'flame', // 'flame' | 'streak' | 'success' | 'warning' | 'error' | 'freeze' | 'coin' | 'push' | 'info'
      title,
      message,
      duration = 4500,
      actionLabel,
      onAction,
      hudTag
    }) => {
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type,
        title: title || 'System Update',
        message: message || '',
        duration,
        actionLabel,
        onAction,
        hudTag
      };

      queueRef.current.push(newItem);
      if (!isDisplayingRef.current) {
        processQueue();
      }
    },
    [processQueue]
  );

  const dismissNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCurrentNotification(null);
    isDisplayingRef.current = false;

    // Small delay before presenting next queued notification for natural pacing
    setTimeout(() => {
      processQueue();
    }, 280);
  }, [processQueue]);

  const showCyberDialog = useCallback(
    ({
      type = 'warning',
      title,
      message,
      confirmText = 'CONFIRM',
      cancelText = 'CANCEL',
      onConfirm,
      onCancel,
      isDestructive = false,
      hudTag
    }) => {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      }

      setCurrentDialog({
        id: Date.now().toString(),
        type,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm,
        onCancel,
        isDestructive,
        hudTag
      });
    },
    []
  );

  const dismissDialog = useCallback(() => {
    setCurrentDialog(null);
  }, []);

  // Register global emitters
  useEffect(() => {
    globalNotificationEmitter = showCyberNotification;
    globalDialogEmitter = showCyberDialog;

    return () => {
      globalNotificationEmitter = null;
      globalDialogEmitter = null;
    };
  }, [showCyberNotification, showCyberDialog]);

  // Intercept Foreground Push Notifications and render as Cyberpunk HUD
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification?.request?.content;
      if (!content) return;

      const title = content.title || 'Incoming Push Notification';
      const body = content.body || '';

      // Determine appropriate cyberpunk visual type from notification content
      let cyberType = 'push';
      const lowerTitle = title.toLowerCase();
      const lowerBody = body.toLowerCase();

      if (lowerTitle.includes('warning') || lowerTitle.includes('alert') || lowerTitle.includes('final')) {
        cyberType = 'warning';
      } else if (lowerTitle.includes('shield') || lowerTitle.includes('freeze')) {
        cyberType = 'freeze';
      } else if (lowerTitle.includes('streak') || lowerTitle.includes('kickoff') || lowerTitle.includes('flame') || lowerTitle.includes('roast')) {
        cyberType = 'streak';
      } else if (lowerTitle.includes('coin') || lowerTitle.includes('vault') || lowerTitle.includes('reward')) {
        cyberType = 'coin';
      }

      showCyberNotification({
        type: cyberType,
        title,
        message: body,
        duration: 5000,
        hudTag: '[FOREGROUND // NEON_PUSH]'
      });
    });

    return () => {
      subscription.remove();
    };
  }, [showCyberNotification]);

  return (
    <NotificationContext.Provider
      value={{
        showCyberNotification,
        dismissNotification,
        currentNotification,
        showCyberDialog,
        dismissDialog,
        currentDialog
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useCyberNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useCyberNotification must be used within a NotificationProvider');
  }
  return context;
};

