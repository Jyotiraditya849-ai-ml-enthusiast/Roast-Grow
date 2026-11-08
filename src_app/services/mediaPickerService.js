import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { showGlobalCyberNotification } from '../context/NotificationContext';

/**
 * Converts a temporary blob: URI or file into a permanent Base64 Data URL.
 * Base64 Data URLs live directly inside AsyncStorage / localStorage and
 * NEVER disappear when the web dev server restarts or browser refreshes.
 */
export const ensurePersistentBase64 = async (uri, mimeType = 'image/jpeg') => {
  if (!uri) return uri;
  // If already a persistent base64 data URL, return immediately
  if (uri.startsWith('data:')) return uri;

  // On Web or blob URLs:
  if (Platform.OS === 'web' || uri.startsWith('blob:')) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === 'string' ? reader.result : uri);
        };
        reader.onerror = () => {
          resolve(uri);
        };
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Could not convert blob to persistent data URL:', e);
      return uri;
    }
  }
  return uri;
};

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
      const mime = asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');
      const persistentUri = await ensurePersistentBase64(asset.uri, mime);

      return {
        uri: persistentUri,
        name,
        type: isPdf ? 'pdf' : 'image',
        mimeType: mime
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
        const mime = 'image/jpeg';
        const persistentUri = await ensurePersistentBase64(asset.uri, mime);
        return {
          uri: persistentUri,
          name: asset.fileName || 'roadmap_photo.jpg',
          type: 'image',
          mimeType: mime
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
      const mime = 'image/jpeg';
      const persistentUri = await ensurePersistentBase64(asset.uri, mime);
      return {
        uri: persistentUri,
        name: asset.fileName || 'roadmap_camera_photo.jpg',
        type: 'image',
        mimeType: mime
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
