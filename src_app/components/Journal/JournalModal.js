import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Dimensions,
  Share
} from 'react-native';
import Svg, { Path, Rect, Line, Circle, Polygon } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MoodSelector } from './MoodSelector';
import {
  getJournalTheme,
  saveJournalTheme,
  getLocalDateString
} from '../../storage/asyncStorage';
import { showGlobalCyberNotification } from '../../context/NotificationContext';
import { THEME } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 7 Engaging Scenery & Notes Paper Themes
export const JOURNAL_THEMES = [
  {
    id: 'anime_sky',
    name: 'Anime Horizon (Sky & Hills)',
    description: 'Soft pastel sky with rolling hills & telegraph wires',
    sceneryType: 'anime_sky',
    paperType: 'clean',
    bg: '#dce5ef',
    cardBg: '#ffffff',
    titleColor: '#0f172a',
    textColor: '#334155',
    placeholderColor: '#64748b',
    border: 'rgba(15, 23, 42, 0.1)',
    topBarBg: '#dce5ef',
    floatingPillBg: 'rgba(255, 255, 255, 0.88)',
    floatingPillBorder: 'rgba(15, 23, 42, 0.15)',
    floatingIconColor: '#0f172a',
    accentColor: '#0284c7'
  },
  {
    id: 'sunset_mountain',
    name: 'Sunset Mountains & Pines',
    description: 'Golden hour sunset with mountain ridges & pine forest',
    sceneryType: 'sunset_mountain',
    paperType: 'clean',
    bg: '#fbe7d5',
    cardBg: 'rgba(255, 255, 255, 0.94)',
    titleColor: '#451a03',
    textColor: '#78350f',
    placeholderColor: '#9a3412',
    border: 'rgba(180, 83, 9, 0.2)',
    topBarBg: '#fbe7d5',
    floatingPillBg: 'rgba(255, 247, 237, 0.92)',
    floatingPillBorder: 'rgba(180, 83, 9, 0.3)',
    floatingIconColor: '#78350f',
    accentColor: '#d97706'
  },
  {
    id: 'starry_night',
    name: 'Midnight Stargazing & Moon',
    description: 'Deep midnight blue with glowing crescent moon & stars',
    sceneryType: 'starry_night',
    paperType: 'clean',
    bg: '#081026',
    cardBg: '#0e1a38',
    titleColor: '#f8fafc',
    textColor: '#cbd5e1',
    placeholderColor: '#64748b',
    border: 'rgba(56, 189, 248, 0.25)',
    topBarBg: '#081026',
    floatingPillBg: 'rgba(14, 26, 56, 0.9)',
    floatingPillBorder: 'rgba(56, 189, 248, 0.35)',
    floatingIconColor: '#38bdf8',
    accentColor: '#38bdf8'
  },
  {
    id: 'vintage_notebook',
    name: 'Vintage Ruled Notebook Paper',
    description: 'Real physical diary with blue horizontal lines & red margin',
    sceneryType: 'vintage_notebook',
    paperType: 'lined',
    bg: '#fbf7ee',
    cardBg: '#fffdf9',
    titleColor: '#1c1917',
    textColor: '#292524',
    placeholderColor: '#78716c',
    border: 'rgba(68, 64, 60, 0.15)',
    topBarBg: '#fbf7ee',
    floatingPillBg: 'rgba(255, 253, 249, 0.94)',
    floatingPillBorder: 'rgba(68, 64, 60, 0.2)',
    floatingIconColor: '#1c1917',
    accentColor: '#b45309'
  },
  {
    id: 'ocean_waves',
    name: 'Ocean Waves & Coastal Lighthouse',
    description: 'Gentle sea waves, coastal cliff & lighthouse beam',
    sceneryType: 'ocean_waves',
    paperType: 'clean',
    bg: '#d7e8f7',
    cardBg: 'rgba(255, 255, 255, 0.92)',
    titleColor: '#0c4a6e',
    textColor: '#0369a1',
    placeholderColor: '#0284c7',
    border: 'rgba(2, 132, 199, 0.2)',
    topBarBg: '#d7e8f7',
    floatingPillBg: 'rgba(255, 255, 255, 0.9)',
    floatingPillBorder: 'rgba(2, 132, 199, 0.25)',
    floatingIconColor: '#0c4a6e',
    accentColor: '#0284c7'
  },
  {
    id: 'zen_blossom',
    name: 'Zen Cherry Blossom & Mt. Fuji',
    description: 'Sakura pink horizon with pagoda temple & falling petals',
    sceneryType: 'zen_blossom',
    paperType: 'clean',
    bg: '#fce7eb',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    titleColor: '#4c0519',
    textColor: '#881337',
    placeholderColor: '#be123c',
    border: 'rgba(225, 29, 72, 0.2)',
    topBarBg: '#fce7eb',
    floatingPillBg: 'rgba(255, 241, 242, 0.92)',
    floatingPillBorder: 'rgba(225, 29, 72, 0.3)',
    floatingIconColor: '#881337',
    accentColor: '#e11d48'
  },
  {
    id: 'cyber_matrix',
    name: 'Cyberpunk Grid Matrix',
    description: 'AMOLED pitch black with millimeter grid & neon horizon',
    sceneryType: 'cyber_matrix',
    paperType: 'grid',
    bg: '#03050a',
    cardBg: '#070d18',
    titleColor: '#ffffff',
    textColor: '#cbd5e1',
    placeholderColor: '#475569',
    border: 'rgba(0, 245, 212, 0.3)',
    topBarBg: '#03050a',
    floatingPillBg: 'rgba(7, 13, 24, 0.92)',
    floatingPillBorder: 'rgba(0, 245, 212, 0.4)',
    floatingIconColor: '#00f5d4',
    accentColor: '#00f5d4'
  }
];

// Helper to render scenery SVG footer
const SceneryArtwork = React.memo(({ sceneryType }) => {
  if (sceneryType === 'anime_sky') {
    return (
      <Svg width={SCREEN_WIDTH} height={125} viewBox="0 0 400 125">
        <Path d="M0,80 Q100,50 200,75 T400,65 L400,125 L0,125 Z" fill="#cad5e2" opacity={0.6} />
        <Path d="M0,95 Q140,82 280,98 T400,90 L400,125 L0,125 Z" fill="#bac6d6" opacity={0.75} />
        <Line x1="100" y1="50" x2="100" y2="120" stroke="#475569" strokeWidth="2" />
        <Line x1="88" y1="58" x2="112" y2="58" stroke="#475569" strokeWidth="1.8" />
        <Line x1="90" y1="68" x2="110" y2="68" stroke="#475569" strokeWidth="1.8" />
        <Path d="M0,52 Q100,60 200,55 T400,50" fill="none" stroke="#64748b" strokeWidth="0.9" />
        <Path d="M0,62 Q100,70 200,65 T400,60" fill="none" stroke="#64748b" strokeWidth="0.9" />
        <Rect x="45" y="92" width="18" height="12" fill="#94a3b8" rx={1} />
        <Path d="M42,92 L54,84 L66,92 Z" fill="#64748b" />
      </Svg>
    );
  }

  if (sceneryType === 'sunset_mountain') {
    return (
      <Svg width={SCREEN_WIDTH} height={125} viewBox="0 0 400 125">
        {/* Golden Sun Disk */}
        <Circle cx="280" cy="45" r="22" fill="#f59e0b" opacity={0.75} />
        {/* Back Mountains */}
        <Path d="M0,75 Q90,35 180,65 T400,55 L400,125 L0,125 Z" fill="#ea580c" opacity={0.35} />
        {/* Front Mountain Ridge */}
        <Path d="M0,90 Q120,68 240,85 T400,78 L400,125 L0,125 Z" fill="#c2410c" opacity={0.65} />
        {/* Pine Trees Silhouette */}
        <Path d="M40,115 L50,85 L60,115 Z" fill="#78350f" />
        <Path d="M43,105 L50,80 L57,105 Z" fill="#451a03" />
        <Path d="M65,118 L73,92 L81,118 Z" fill="#78350f" />
        <Path d="M140,120 L148,96 L156,120 Z" fill="#451a03" />
        <Path d="M320,118 L328,90 L336,118 Z" fill="#78350f" />
        {/* Flying Birds */}
        <Path d="M120,35 Q125,30 130,35 Q135,30 140,35" fill="none" stroke="#9a3412" strokeWidth="1.4" />
        <Path d="M150,28 Q154,24 158,28 Q162,24 166,28" fill="none" stroke="#9a3412" strokeWidth="1.2" />
      </Svg>
    );
  }

  if (sceneryType === 'starry_night') {
    return (
      <Svg width={SCREEN_WIDTH} height={125} viewBox="0 0 400 125">
        {/* Glowing Crescent Moon */}
        <Path d="M310,25 A18,18 0 1,0 328,43 A14,14 0 1,1 310,25 Z" fill="#fef08a" />
        {/* Twinkling 4-Point Stars */}
        <Path d="M80,25 Q83,25 83,22 Q83,25 86,25 Q83,25 83,28 Q83,25 80,25 Z" fill="#ffffff" />
        <Path d="M160,18 Q163,18 163,15 Q163,18 166,18 Q163,18 163,21 Q163,18 160,18 Z" fill="#38bdf8" />
        <Path d="M220,38 Q222,38 222,36 Q222,38 224,38 Q222,38 222,40 Q222,38 220,38 Z" fill="#ffffff" />
        <Path d="M40,45 Q42,45 42,43 Q42,45 44,45 Q42,45 42,47 Q42,45 40,45 Z" fill="#fef08a" />
        {/* Constellation Dots */}
        <Circle cx="130" cy="40" r="1.5" fill="#93c5fd" />
        <Circle cx="150" cy="48" r="1.5" fill="#93c5fd" />
        <Circle cx="175" cy="42" r="1.5" fill="#93c5fd" />
        <Line x1="130" y1="40" x2="150" y2="48" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2,2" />
        <Line x1="150" y1="48" x2="175" y2="42" stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="2,2" />
        {/* Midnight Mountain Silhouettes */}
        <Path d="M0,85 Q110,65 220,80 T400,70 L400,125 L0,125 Z" fill="#0f172a" opacity={0.65} />
        <Path d="M0,98 Q140,84 280,100 T400,92 L400,125 L0,125 Z" fill="#020617" />
      </Svg>
    );
  }

  if (sceneryType === 'ocean_waves') {
    return (
      <Svg width={SCREEN_WIDTH} height={125} viewBox="0 0 400 125">
        {/* Lighthouse Beam */}
        <Polygon points="45,55 380,15 380,65" fill="rgba(254, 240, 138, 0.22)" />
        {/* Waves Layer 1 */}
        <Path d="M0,88 Q50,75 100,88 T200,88 T300,88 T400,88 L400,125 L0,125 Z" fill="#38bdf8" opacity={0.4} />
        {/* Waves Layer 2 */}
        <Path d="M0,98 Q60,88 120,98 T240,98 T360,98 T400,98 L400,125 L0,125 Z" fill="#0284c7" opacity={0.7} />
        {/* Coastal Cliff with Lighthouse */}
        <Path d="M0,70 L60,70 L45,125 L0,125 Z" fill="#0f172a" />
        <Rect x="40" y="55" width="10" height="20" fill="#f8fafc" />
        <Rect x="38" y="52" width="14" height="4" fill="#ef4444" />
        <Path d="M39,52 L45,46 L51,52 Z" fill="#0f172a" />
        {/* Flying Seagulls */}
        <Path d="M180,45 Q185,40 190,45 Q195,40 200,45" fill="none" stroke="#0369a1" strokeWidth="1.4" />
        <Path d="M220,38 Q224,34 228,38 Q232,34 236,38" fill="none" stroke="#0369a1" strokeWidth="1.2" />
      </Svg>
    );
  }

  if (sceneryType === 'zen_blossom') {
    return (
      <Svg width={SCREEN_WIDTH} height={125} viewBox="0 0 400 125">
        {/* Distant Mt. Fuji */}
        <Path d="M120,110 L200,35 L280,110 Z" fill="#f43f5e" opacity={0.25} />
        <Path d="M175,58 L200,35 L225,58 Q200,65 175,58 Z" fill="#ffffff" opacity={0.9} />
        {/* Hill & Pagoda Silhouette */}
        <Path d="M0,92 Q140,80 280,95 T400,88 L400,125 L0,125 Z" fill="#881337" opacity={0.4} />
        <Rect x="40" y="80" width="24" height="30" fill="#4c0519" />
        <Path d="M30,80 Q52,72 74,80 L70,76 Q52,70 34,76 Z" fill="#4c0519" />
        <Path d="M34,68 Q52,60 70,68 L66,64 Q52,58 38,64 Z" fill="#4c0519" />
        {/* Falling Cherry Blossom Petals */}
        <Circle cx="120" cy="40" r="3" fill="#f43f5e" opacity={0.7} />
        <Circle cx="140" cy="65" r="2.5" fill="#fb7185" opacity={0.8} />
        <Circle cx="260" cy="50" r="3" fill="#f43f5e" opacity={0.65} />
        <Circle cx="300" cy="75" r="2" fill="#fb7185" opacity={0.8} />
        <Circle cx="90" cy="70" r="3" fill="#f43f5e" opacity={0.7} />
      </Svg>
    );
  }

  if (sceneryType === 'cyber_matrix') {
    return (
      <Svg width={SCREEN_WIDTH} height={125} viewBox="0 0 400 125">
        {/* Cyber Grid Ground Lines */}
        <Line x1="0" y1="100" x2="400" y2="100" stroke="#00f5d4" strokeWidth="1" opacity={0.7} />
        <Line x1="0" y1="112" x2="400" y2="112" stroke="#00f5d4" strokeWidth="0.8" opacity={0.5} />
        <Line x1="0" y1="120" x2="400" y2="120" stroke="#00f5d4" strokeWidth="0.6" opacity={0.3} />
        {/* Perspective Grid Rays */}
        <Line x1="200" y1="80" x2="0" y2="125" stroke="#00f5d4" strokeWidth="0.7" opacity={0.4} />
        <Line x1="200" y1="80" x2="80" y2="125" stroke="#00f5d4" strokeWidth="0.7" opacity={0.4} />
        <Line x1="200" y1="80" x2="160" y2="125" stroke="#00f5d4" strokeWidth="0.7" opacity={0.4} />
        <Line x1="200" y1="80" x2="240" y2="125" stroke="#00f5d4" strokeWidth="0.7" opacity={0.4} />
        <Line x1="200" y1="80" x2="320" y2="125" stroke="#00f5d4" strokeWidth="0.7" opacity={0.4} />
        <Line x1="200" y1="80" x2="400" y2="125" stroke="#00f5d4" strokeWidth="0.7" opacity={0.4} />
        {/* Neon City Skyline */}
        <Rect x="40" y="55" width="22" height="45" fill="#070d18" stroke="#38bdf8" strokeWidth="1" />
        <Rect x="70" y="40" width="28" height="60" fill="#070d18" stroke="#00f5d4" strokeWidth="1" />
        <Rect x="105" y="65" width="18" height="35" fill="#070d18" stroke="#e11d48" strokeWidth="1" />
        <Rect x="280" y="50" width="24" height="50" fill="#070d18" stroke="#38bdf8" strokeWidth="1" />
        <Rect x="312" y="35" width="30" height="65" fill="#070d18" stroke="#f59e0b" strokeWidth="1" />
      </Svg>
    );
  }

  return null;
});

export const JournalModal = ({
  visible,
  onClose,
  initialData,
  onSave
}) => {
  const [title, setTitle] = useState('My day in my mind');
  const [text, setText] = useState('');
  const [mood, setMood] = useState('🤩');
  const [photoUri, setPhotoUri] = useState(null);
  const [themeId, setThemeId] = useState('anime_sky');
  const [isSaving, setIsSaving] = useState(false);

  // Theme customizer drawer & media option modals
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [showMoodBar, setShowMoodBar] = useState(true);

  // Load saved theme and entry data
  useEffect(() => {
    const initTheme = async () => {
      const saved = await getJournalTheme();
      setThemeId(saved || 'anime_sky');
    };
    initTheme();
  }, []);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || 'My day in my mind');
      setText(initialData.text || '');
      setMood(initialData.mood || '🤩');
      setPhotoUri(initialData.photoUri || null);
      if (initialData.themeId) {
        setThemeId(initialData.themeId);
      }
    } else {
      setTitle('My day in my mind');
      setText('');
      setMood('🤩');
      setPhotoUri(null);
    }
  }, [initialData, visible]);

  const currentTheme =
    JOURNAL_THEMES.find((t) => t.id === themeId) || JOURNAL_THEMES[0];

  const handleSelectTheme = async (id) => {
    setThemeId(id);
    await saveJournalTheme(id);
    setThemeModalVisible(false);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  // Launch Camera
  const handleTakePhoto = async () => {
    setMediaModalVisible(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showGlobalCyberNotification({
            type: 'warning',
            title: 'Camera Permission Required',
            message: 'Please grant camera access to take proof photo.'
          });
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  // Pick Gallery Photo
  const handlePickGallery = async () => {
    setMediaModalVisible(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showGlobalCyberNotification({
            type: 'warning',
            title: 'Gallery Permission Required',
            message: 'Please grant photo library access.'
          });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  // Share journal note
  const handleShare = async () => {
    try {
      const content = `${title || 'My Day in My Mind'}\nMood: ${mood}\n\n${text}\n\n[Logged via Roast&Grow Discipline App]`;
      await Share.share({ message: content });
    } catch (e) {
      // Ignored
    }
  };

  // Save Journal
  const handleSave = async () => {
    if (!text.trim() && !photoUri) {
      showGlobalCyberNotification({
        type: 'warning',
        title: 'Empty Note',
        message: 'Write a reflection or attach a proof photo before saving.'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await onSave({
        title: title.trim() || 'My day in my mind',
        text: text.trim(),
        mood,
        photoUri,
        themeId
      });
      showGlobalCyberNotification({
        type: 'success',
        title: 'Journal Saved ✨',
        message: 'Your reflection & proof have been secured.',
        hudTag: '[JOURNAL // SECURED]'
      });
      onClose();
    } catch (err) {
      showGlobalCyberNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save journal entry.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const todayDateDisplay = getLocalDateString();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.canvas, { backgroundColor: currentTheme.bg }]}>
        {/* Ruled Notebook Paper Vertical Margin Line */}
        {currentTheme.paperType === 'lined' && (
          <View style={styles.ruledMarginLine} pointerEvents="none" />
        )}

        {/* ============================================================== */}
        {/* 1. TOP APP BAR (Back, Share, Theme T-shirt, More Menu)         */}
        {/* ============================================================== */}
        <View style={[styles.topBar, { backgroundColor: currentTheme.topBarBg }]}>
          {/* Left: Back Arrow */}
          <TouchableOpacity
            style={styles.circleIconBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={currentTheme.titleColor} />
          </TouchableOpacity>

          {/* Right Action Icons: Share, Theme T-shirt, More */}
          <View style={styles.topRightActions}>
            {/* Share */}
            <TouchableOpacity
              style={styles.circleIconBtn}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={21} color={currentTheme.titleColor} />
            </TouchableOpacity>

            {/* T-Shirt Theme Customizer Button (Screenshot Match!) */}
            <TouchableOpacity
              style={[
                styles.circleIconBtn,
                styles.themeTshirtBtn,
                { borderColor: currentTheme.border }
              ]}
              onPress={() => setThemeModalVisible(true)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="tshirt-crew-outline"
                size={22}
                color={currentTheme.accentColor}
              />
            </TouchableOpacity>

            {/* More Menu */}
            <TouchableOpacity
              style={styles.circleIconBtn}
              onPress={() => {
                Alert.alert(
                  'Journal Options',
                  `Logged date: ${todayDateDisplay}\nCurrent theme: ${currentTheme.name}`,
                  [
                    {
                      text: 'Clear All Text',
                      style: 'destructive',
                      onPress: () => {
                        setTitle('My day in my mind');
                        setText('');
                        setPhotoUri(null);
                      }
                    },
                    { text: 'Close', style: 'cancel' }
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={21} color={currentTheme.titleColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* 2. WRITING CANVAS BODY                                         */}
        {/* ============================================================== */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Note Title Input (Bold "MY DAY IN MY MIND" Style) */}
          <TextInput
            style={[
              styles.titleInput,
              { color: currentTheme.titleColor }
            ]}
            placeholder="My day in my mind"
            placeholderTextColor={currentTheme.placeholderColor}
            value={title}
            onChangeText={setTitle}
            multiline={false}
            returnKeyType="next"
          />

          {/* Date & Proof Sub-header */}
          <View style={styles.metaRow}>
            <Text style={[styles.dateText, { color: currentTheme.placeholderColor }]}>
              {todayDateDisplay} • {currentTheme.name}
            </Text>

            {/* Mood Toggle Pill */}
            <TouchableOpacity
              style={[styles.moodBadgePill, { borderColor: currentTheme.border }]}
              onPress={() => setShowMoodBar(!showMoodBar)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14 }}>{mood}</Text>
              <Text style={[styles.moodBadgeText, { color: currentTheme.textColor }]}>
                Mood
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mood Selector (Preserved Emojis as requested!) */}
          {showMoodBar && (
            <View style={[styles.moodSection, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}>
              <MoodSelector selectedMood={mood} onSelectMood={setMood} />
            </View>
          )}

          {/* Note Body Text Input */}
          <TextInput
            style={[
              styles.bodyInput,
              { color: currentTheme.textColor },
              currentTheme.paperType === 'lined' && styles.bodyInputLined
            ]}
            placeholder="Write your daily mindset, learnings, proof of work, or reflection..."
            placeholderTextColor={currentTheme.placeholderColor}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />

          {/* ============================================================== */}
          {/* 3. EMBEDDED MEDIA CARD (Rounded Photo as seen in Screenshot)  */}
          {/* ============================================================== */}
          {photoUri && (
            <View style={[styles.photoCardWrapper, { borderColor: currentTheme.border }]}>
              <Image source={{ uri: photoUri }} style={styles.embeddedPhoto} resizeMode="cover" />
              <View style={styles.photoOverlayBadge}>
                <Text style={styles.photoBadgeText}>Proof of Work 📸</Text>
              </View>
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setPhotoUri(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={15} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Space for scrolling above bottom toolbar */}
          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ============================================================== */}
        {/* 4. SCENERY ARTWORK FOOTER                                      */}
        {/* ============================================================== */}
        {currentTheme.sceneryType && (
          <View style={styles.landscapeFooter} pointerEvents="none">
            <SceneryArtwork sceneryType={currentTheme.sceneryType} />
          </View>
        )}

        {/* ============================================================== */}
        {/* 5. FLOATING TOOLBAR PILL (Screenshot Match: 📷, ✒️, ✓)         */}
        {/* ============================================================== */}
        <View style={styles.floatingDockWrapper}>
          <View
            style={[
              styles.floatingDock,
              {
                backgroundColor: currentTheme.floatingPillBg,
                borderColor: currentTheme.floatingPillBorder
              }
            ]}
          >
            {/* 📷 Camera / Image Button */}
            <TouchableOpacity
              style={styles.dockIconBtn}
              onPress={() => setMediaModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="camera-outline"
                size={23}
                color={photoUri ? currentTheme.accentColor : currentTheme.floatingIconColor}
              />
            </TouchableOpacity>

            {/* ✒️ Fountain Pen / Stylus Button (Toggles Mood & Options) */}
            <TouchableOpacity
              style={styles.dockIconBtn}
              onPress={() => setShowMoodBar(!showMoodBar)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fountain-pen-tip"
                size={22}
                color={showMoodBar ? currentTheme.accentColor : currentTheme.floatingIconColor}
              />
            </TouchableOpacity>

            {/* ✓ Checkmark Save Button */}
            <TouchableOpacity
              style={[
                styles.dockIconBtn,
                styles.dockSaveBtn,
                { backgroundColor: currentTheme.accentColor }
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={23} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================== */}
        {/* 6. THEME SELECTION MODAL (Opened via T-Shirt Icon 👕)          */}
        {/* ============================================================== */}
        <Modal
          visible={themeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <View style={styles.themeModalBackdrop}>
            <View style={styles.themeModalContainer}>
              <View style={styles.themeModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="tshirt-crew" size={22} color={THEME.marigoldLight} />
                  <Text style={styles.themeModalTitle}>Customize Scenery & Paper</Text>
                </View>
                <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.themeModalSub}>
                Choose from 7 artistic scenery themes and notebook paper styles for your journal.
              </Text>

              {/* Theme Options */}
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {JOURNAL_THEMES.map((theme) => {
                  const isSelected = theme.id === themeId;
                  return (
                    <TouchableOpacity
                      key={theme.id}
                      style={[
                        styles.themeItem,
                        { backgroundColor: theme.bg, borderColor: isSelected ? theme.accentColor : 'rgba(255,255,255,0.1)' },
                        isSelected && styles.themeItemSelected
                      ]}
                      onPress={() => handleSelectTheme(theme.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.themeItemHeader}>
                        <View style={[styles.themeColorDot, { backgroundColor: theme.accentColor }]} />
                        <Text style={[styles.themeItemName, { color: theme.titleColor }]}>
                          {theme.name}
                        </Text>
                        {isSelected && (
                          <View style={[styles.activePill, { backgroundColor: theme.accentColor }]}>
                            <Text style={styles.activePillText}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.themeItemDesc, { color: theme.textColor }]}>
                        {theme.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ============================================================== */}
        {/* 7. MEDIA ATTACHMENT MODAL                                      */}
        {/* ============================================================== */}
        <Modal
          visible={mediaModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMediaModalVisible(false)}
        >
          <View style={styles.themeModalBackdrop}>
            <View style={styles.mediaModalContainer}>
              <Text style={styles.mediaModalTitle}>Attach Proof Photo 📸</Text>
              <Text style={styles.mediaModalSub}>
                Insert a proof of work, screenshot, or study picture directly into your note.
              </Text>

              <TouchableOpacity
                style={styles.mediaActionRow}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color={THEME.crimson} />
                <Text style={styles.mediaActionText}>Take Camera Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaActionRow}
                onPress={handlePickGallery}
                activeOpacity={0.8}
              >
                <Ionicons name="images" size={20} color={THEME.blueLight} />
                <Text style={styles.mediaActionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              {photoUri && (
                <TouchableOpacity
                  style={[styles.mediaActionRow, { borderColor: 'rgba(255, 0, 63, 0.4)' }]}
                  onPress={() => {
                    setPhotoUri(null);
                    setMediaModalVisible(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color={THEME.crimsonPureRed} />
                  <Text style={[styles.mediaActionText, { color: THEME.crimsonPureRed }]}>
                    Remove Current Photo
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.mediaCancelBtn}
                onPress={() => setMediaModalVisible(false)}
              >
                <Text style={styles.mediaCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    position: 'relative'
  },
  ruledMarginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 42,
    width: 1.5,
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
    zIndex: 2
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 14,
    zIndex: 10
  },
  circleIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  themeTshirtBtn: {
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 60
  },
  titleInput: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 6,
    paddingVertical: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  dateText: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  moodBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1
  },
  moodBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  moodSection: {
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1
  },
  bodyInput: {
    fontSize: 15,
    lineHeight: 25,
    minHeight: 180,
    paddingVertical: 4
  },
  bodyInputLined: {
    lineHeight: 28,
    paddingLeft: 30
  },
  photoCardWrapper: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    height: 220,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  embeddedPhoto: {
    width: '100%',
    height: '100%'
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  photoBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  landscapeFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 125,
    zIndex: 1
  },
  floatingDockWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 32,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  dockIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dockSaveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  themeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  themeModalContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#070d18',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)'
  },
  themeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  themeModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff'
  },
  themeModalSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginBottom: 14
  },
  themeItem: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5
  },
  themeItemSelected: {
    borderWidth: 2
  },
  themeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  themeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  themeItemName: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900'
  },
  themeItemDesc: {
    fontSize: 10.5,
    marginLeft: 18
  },
  mediaModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#070d18',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium
  },
  mediaModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4
  },
  mediaModalSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginBottom: 16
  },
  mediaActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0c1424',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  mediaActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  mediaCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4
  },
  mediaCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700'
  }
});
