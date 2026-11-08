import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCyberNotification } from '../../context/NotificationContext';
import { THEME } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CyberAlertModal = () => {
  const { currentDialog, dismissDialog } = useCyberNotification();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentDialog) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [currentDialog]);

  if (!currentDialog) return null;

  const handleCancel = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => {
      if (currentDialog.onCancel) {
        currentDialog.onCancel();
      }
      dismissDialog();
    });
  };

  const handleConfirm = async () => {
    if (Platform.OS !== 'web') {
      try {
        if (currentDialog.isDestructive) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {}
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(async () => {
      const confirmAction = currentDialog.onConfirm;
      dismissDialog();
      if (confirmAction) {
        await confirmAction();
      }
    });
  };

  const isDestructive = currentDialog.isDestructive || currentDialog.type === 'error' || currentDialog.type === 'warning';
  const isFreeze = currentDialog.type === 'freeze';
  const primaryColor = isDestructive ? THEME.crimsonPureRed : isFreeze ? THEME.blueLight : THEME.marigold;
  const hudTag = currentDialog.hudTag || (isDestructive ? '[GATEWAY // CRITICAL_ACTION]' : isFreeze ? '[VAULT // SHIELD_REQUEST]' : '[GATEWAY // AUTHORIZATION]');

  return (
    <Modal visible={true} transparent={true} animationType="none" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.dialogCard,
            {
              borderColor: primaryColor + '66',
              shadowColor: primaryColor,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          {/* Corner Cyber Brackets */}
          <View style={[styles.cornerBracketTL, { borderColor: primaryColor }]} />
          <View style={[styles.cornerBracketTR, { borderColor: primaryColor }]} />
          <View style={[styles.cornerBracketBL, { borderColor: primaryColor }]} />
          <View style={[styles.cornerBracketBR, { borderColor: primaryColor }]} />

          {/* Top HUD Tag */}
          <View style={styles.tagRow}>
            <View style={[styles.tagDot, { backgroundColor: primaryColor }]} />
            <Text style={[styles.tagText, { color: primaryColor }]}>{hudTag}</Text>
          </View>

          {/* Icon Badge */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  borderColor: primaryColor,
                  backgroundColor: primaryColor + '18'
                }
              ]}
            >
              {isFreeze ? (
                <FontAwesome5 name="snowflake" size={26} color={primaryColor} />
              ) : isDestructive ? (
                <Ionicons name="warning" size={28} color={primaryColor} />
              ) : (
                <Ionicons name="shield-checkmark" size={28} color={primaryColor} />
              )}
            </View>
          </View>

          {/* Title & Message */}
          <Text style={styles.titleText}>{currentDialog.title}</Text>
          <Text style={styles.messageText}>{currentDialog.message}</Text>

          {/* Actions */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelButtonText}>
                {currentDialog.cancelText || 'ABORT'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor: primaryColor,
                  shadowColor: primaryColor
                }
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {currentDialog.confirmText || 'EXECUTE'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 6, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  dialogCard: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : SCREEN_WIDTH - 36,
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative'
  },
  cornerBracketTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2
  },
  cornerBracketTR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderRightWidth: 2
  },
  cornerBracketBL: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2
  },
  cornerBracketBR: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textTransform: 'uppercase'
  },
  iconContainer: {
    marginBottom: 14
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3
  },
  messageText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#161e2e',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  confirmButton: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  }
});

