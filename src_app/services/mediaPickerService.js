import { Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

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
          Alert.alert('Permission Required', 'Permission is required to choose files or photos.');
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
      Alert.alert('Error', 'Unable to pick file or photo.');
    }
    return null;
  }
};

export const takeRoadmapPhoto = async () => {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required.');
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
    Alert.alert('Error', 'Unable to access camera.');
    return null;
  }
};
