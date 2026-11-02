import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { MoodSelector } from './MoodSelector';
import * as Haptics from 'expo-haptics';

export const JournalModal = ({
  visible,
  onClose,
  initialData,
  onSave
}) => {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('🤩');
  const [photoUri, setPhotoUri] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setText(initialData.text || '');
      setMood(initialData.mood || '🤩');
      setPhotoUri(initialData.photoUri || null);
    } else {
      setText('');
      setMood('🤩');
      setPhotoUri(null);
    }
  }, [initialData, visible]);

  // Launch camera to take proof photo
  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take proof photos.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera launch error:', err);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  // Pick photo from device gallery
  const handlePickGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
      Alert.alert('Gallery Error', 'Could not open photo library.');
    }
  };

  const handleSave = async () => {
    if (!text.trim() && !photoUri) {
      Alert.alert('Empty Log', 'Please add some reflection text or a photo proof.');
      return;
    }

    setIsSaving(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await onSave({ text: text.trim(), mood, photoUri });
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to save daily journal.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Daily Journal & Proof</Text>
              <Text style={styles.subtitle}>Document today's grind & mindset</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#8b949e" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Mood Picker */}
            <MoodSelector selectedMood={mood} onSelectMood={setMood} />

            {/* Reflection Text Input */}
            <Text style={styles.sectionLabel}>Daily Reflection</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What did you build, solve, or struggle with today?"
              placeholderTextColor="#6e7681"
              multiline
              numberOfLines={4}
              value={text}
              onChangeText={setText}
            />

            {/* Media / Photo Attachment */}
            <Text style={styles.sectionLabel}>Proof Photo</Text>
            {photoUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setPhotoUri(null)}
                >
                  <Ionicons name="trash" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Feather name="camera" size={18} color="#58a6ff" />
                  <Text style={styles.mediaButtonText}>Take Camera Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={handlePickGallery}
                  activeOpacity={0.8}
                >
                  <Feather name="image" size={18} color="#58a6ff" />
                  <Text style={styles.mediaButtonText}>Upload from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Lock In Daily Journal 🔒'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#161b22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#30363d'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f0f6fc'
  },
  subtitle: {
    fontSize: 12,
    color: '#8b949e',
    marginTop: 2
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b949e',
    marginVertical: 8
  },
  textArea: {
    backgroundColor: '#0d1117',
    color: '#f0f6fc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#30363d',
    textAlignVertical: 'top',
    minHeight: 90,
    fontSize: 14
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d1117',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  mediaButtonText: {
    color: '#58a6ff',
    fontSize: 12,
    fontWeight: '600'
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    height: 180,
    borderWidth: 1,
    borderColor: '#30363d'
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    padding: 6,
    borderRadius: 20
  },
  saveButton: {
    backgroundColor: '#238636',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 24 : 10
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});

