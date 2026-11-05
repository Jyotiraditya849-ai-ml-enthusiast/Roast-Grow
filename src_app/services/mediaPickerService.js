import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { showGlobalCyberNotification } from '../context/NotificationContext';

/**
 * Service to handle picking full roadmap files (PDF, images, documents)
 * and camera captures across iOS, Android, and Web.
 */

export const pickRoadmapFileOrPhoto = async () => {
  try {
    // Primary: DocumentPicker for picking PDFs, images, or documents
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.name || 'roadmap_document';
      const isPdf = Boolean(
        asset.mimeType?.includes('pdf') ||
        name.toLowerCase().endsWith('.pdf')
      );

      return {
        uri: asset.uri,
        name,
        type: isPdf ? 'pdf' : 'image',
        mimeType: asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg')
      };
    }
    return null;
  } catch (error) {
    console.warn('DocumentPicker fallback to ImagePicker:', error);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showGlobalCyberNotification({
            type: 'warning',
            title: 'Permission Required 📷',
            message: 'Permission is required to choose files or photos.',
            hudTag: '[MEDIA // PERMISSION_REQUIRED]'
          });
          return null;
        }
      }

      const imgResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85
      });

      if (!imgResult.canceled && imgResult.assets && imgResult.assets.length > 0) {
        const asset = imgResult.assets[0];
        return {
          uri: asset.uri,
          name: asset.fileName || 'roadmap_photo.jpg',
          type: 'image',
          mimeType: 'image/jpeg'
        };
      }
    } catch (e) {
      showGlobalCyberNotification({
        type: 'error',
        title: 'File Picker Error',
        message: 'Unable to pick file or photo.',
        hudTag: '[MEDIA // ERROR]'
      });
    }
    return null;
  }
};

export const takeRoadmapPhoto = async () => {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showGlobalCyberNotification({
          type: 'warning',
          title: 'Permission Required 📷',
          message: 'Camera permission is required.',
          hudTag: '[CAMERA // PERMISSION_REQUIRED]'
        });
        return null;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.fileName || 'roadmap_camera_photo.jpg',
        type: 'image',
        mimeType: 'image/jpeg'
      };
    }
    return null;
  } catch (error) {
    console.warn('takeRoadmapPhoto error:', error);
    showGlobalCyberNotification({
      type: 'error',
      title: 'Camera Error',
      message: 'Unable to access camera.',
      hudTag: '[CAMERA // ERROR]'
    });
    return null;
  }
};
