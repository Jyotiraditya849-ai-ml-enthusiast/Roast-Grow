import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../../theme';
import {
  getVisionBoard,
  updateVisionBoardItem
} from '../../storage/asyncStorage';
import {
  pickRoadmapFileOrPhoto,
  pickPhotoFromGallery,
  takeRoadmapPhoto
} from '../../services/mediaPickerService';
import { showGlobalCyberNotification } from '../../context/NotificationContext';

export const REALITY_CHECK_QUESTIONS = [
  {
    id: 1,
    number: '01',
    title: 'What are you avoiding for a long time?',
    prompt:
      'Think deeply, then write. Konsa aisa mushkil kaam, conversation, ya sach hai jisse tum mahino se bhaag rahe ho? Stop lying to yourself. Write the raw truth without fear.',
    tag: 'DEEP REFLECTION'
  },
  {
    id: 2,
    number: '02',
    title: 'What is your next step?',
    prompt:
      'Khud hi khud ka dost bano aur apne dost ko sahi rasta dikhao. Agar tumhara pyara dost is bhatke huye haal mein hota, toh tum use kya clear next step lene ko kehte? Vahi rasta khud ko dikhao.',
    tag: 'BE YOUR BEST FRIEND'
  },
  {
    id: 3,
    number: '03',
    title: 'Write your WHY — How badly do you want it?',
    prompt:
      'A strong reason that makes excuses feel shameful. Tumhe ye kyu chahiye? Agar ye nahi mila toh tumhari aatma shant nahi hogi — vo primal, burning reason kagaz par utaro.',
    tag: 'THE BURNING CORE'
  },
  {
    id: 4,
    number: '04',
    title: 'Decide a structure (Day-to-day routine)',
    prompt:
      'A proper, non-negotiable structure for your daily routine. Subah kitne baje uthoge, pehle kya karoge, workout kab hoga, deep work kab hoga. Hope is not a plan; a schedule is.',
    tag: 'DAILY ARCHITECTURE'
  },
  {
    id: 5,
    number: '05',
    title: 'How to make it easy & frictionless?',
    prompt:
      'Shuru karne ki hichkichahat ko khatam karo. Friction ko zero banao: kapde raat ko nikal kar rakho, book desk par open rakho, distractions ko kamre se bahar feko. How will you make starting effortless?',
    tag: 'ZERO FRICTION'
  },
  {
    id: 6,
    number: '06',
    title: 'Write your destination precisely',
    prompt:
      'Write precisely where you are going. 1 saal baad tum kahan khade hoge? Tumhari physique, tumhara bank account, tumhara standard of living aur tumhara self-respect kaisa hoga? Be surgically exact.',
    tag: 'EXACT DESTINATION'
  },
  {
    id: 7,
    number: '07',
    title: 'Check your environment (Audit the poison)',
    prompt:
      'Kaun se log, kaun si digital apps, aur kaun sa mahaul tumhari willpower ko choos leta hai? Jo environment tumhe weak banata hai, usko kagaz par identify karo aur ruthless ban kar door karo.',
    tag: 'ENVIRONMENT AUDIT'
  },
  {
    id: 8,
    number: '08',
    title: 'How to track your progress daily?',
    prompt:
      'If you cannot measure it, you cannot manage it. Har roz raat ko sone se pehle khud ko kaise measure karoge? No guessing. Only hard data and daily check-ins on this app.',
    tag: 'ACCOUNTABILITY TRACK'
  },
  {
    id: 9,
    number: '09',
    title: 'What is the ABSOLUTE COST if you achieve nothing?',
    prompt:
      'Lastly, feel the deepest pain: Agar 5 saal guzar gaye aur tum wahi rahe — wahi excuses, wahi laachari, wahi regret. Sab aage nikal gaye aur tum piche chhoot gaye. Feel that shame right now and write down the brutal cost of giving up.',
    tag: 'THE ABSOLUTE COST'
  }
];

export const MistakesVsDreamCard = () => {
  const [boardData, setBoardData] = useState({
    mistakesNotePhotoUri: null,
    mistakesNoteName: null,
    mistakesNoteUpdatedAt: null,
    dreamVisionPhotoUri: null,
    dreamVisionName: null,
    dreamVisionUpdatedAt: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Full-screen viewer state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeViewType, setActiveViewType] = useState(null); // 'mistakes' | 'dream'

  // Humble 9-Questions Guide Modal state
  const [guideModalVisible, setGuideModalVisible] = useState(false);

  // Triple-tap blur & reveal state (both photos blurred by default per user directive)
  const [isMistakesRevealed, setIsMistakesRevealed] = useState(false);
  const [mistakesTapCount, setMistakesTapCount] = useState(0);
  const mistakesTimeoutRef = useRef(null);

  const [isDreamRevealed, setIsDreamRevealed] = useState(false);
  const [dreamTapCount, setDreamTapCount] = useState(0);
  const dreamTimeoutRef = useRef(null);

  // Spring animation values for tactile tap feedback
  const mistakesScaleAnim = useRef(new Animated.Value(1)).current;
  const dreamScaleAnim = useRef(new Animated.Value(1)).current;
  const mistakesFadeAnim = useRef(new Animated.Value(1)).current;
  const dreamFadeAnim = useRef(new Animated.Value(1)).current;

  // Triple-Tap handler to reveal blurred photos with spring feedback
  const handlePhotoTap = (type) => {
    if (type === 'mistakes') {
      if (isMistakesRevealed) {
        openFullscreen('mistakes');
        return;
      }

      // Tap spring pulse animation
      Animated.sequence([
        Animated.timing(mistakesScaleAnim, {
          toValue: 1.15,
          duration: 90,
          useNativeDriver: true
        }),
        Animated.spring(mistakesScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true
        })
      ]).start();

      const nextCount = mistakesTapCount + 1;
      setMistakesTapCount(nextCount);

      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(
            nextCount === 3
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Light
          );
        } catch (e) {}
      }

      if (nextCount >= 3) {
        setIsMistakesRevealed(true);
        setMistakesTapCount(0);
        Animated.timing(mistakesFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true
        }).start();

        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        showGlobalCyberNotification({
          type: 'success',
          title: 'Handwritten Note Revealed 👁️',
          message: 'Never forget the exact reasons that broke your consistency.',
          hudTag: '[REALITY // UNBLURRED]'
        });
      } else {
        if (mistakesTimeoutRef.current) clearTimeout(mistakesTimeoutRef.current);
        mistakesTimeoutRef.current = setTimeout(() => {
          setMistakesTapCount(0);
        }, 2500);
      }
    } else {
      if (isDreamRevealed) {
        openFullscreen('dream');
        return;
      }

      // Tap spring pulse animation
      Animated.sequence([
        Animated.timing(dreamScaleAnim, {
          toValue: 1.15,
          duration: 90,
          useNativeDriver: true
        }),
        Animated.spring(dreamScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true
        })
      ]).start();

      const nextCount = dreamTapCount + 1;
      setDreamTapCount(nextCount);

      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(
            nextCount === 3
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Light
          );
        } catch (e) {}
      }

      if (nextCount >= 3) {
        setIsDreamRevealed(true);
        setDreamTapCount(0);
        Animated.timing(dreamFadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true
        }).start();

        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
        }
        showGlobalCyberNotification({
          type: 'success',
          title: 'Dream Vision Revealed 👑',
          message: 'This is the prize you are fighting for daily.',
          hudTag: '[VISION // UNBLURRED]'
        });
      } else {
        if (dreamTimeoutRef.current) clearTimeout(dreamTimeoutRef.current);
        dreamTimeoutRef.current = setTimeout(() => {
          setDreamTapCount(0);
        }, 2500);
      }
    }
  };

  // Load vision board data on mount
  const loadBoard = useCallback(async () => {
    try {
      const data = await getVisionBoard();
      setBoardData(data);
    } catch (e) {
      console.warn('Failed to load vision board:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Handle picking photo from gallery/files
  const handleUploadPhoto = async (type) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    setIsUploading(true);
    try {
      // First try dedicated gallery image picker for speed & smoothness
      let result = await pickPhotoFromGallery();
      if (!result) {
        // Fallback to document/file picker
        result = await pickRoadmapFileOrPhoto();
      }

      if (result && result.uri) {
        const updated = await updateVisionBoardItem(type, {
          uri: result.uri,
          name: result.name
        });
        setBoardData({ ...updated });
        setGuideModalVisible(false);

        showGlobalCyberNotification({
          type: 'success',
          title: type === 'mistakes' ? 'Reality Check Updated 💀' : 'Dream Vision Locked 👑',
          message:
            type === 'mistakes'
              ? 'Handwritten mistakes note secured. Remember the pain of inconsistency.'
              : 'Dream vision anchored. Focus on what you are fighting for.',
          hudTag: type === 'mistakes' ? '[VISION // REALITY_CHECK]' : '[VISION // PRIZE_LOCKED]'
        });
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      showGlobalCyberNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Could not attach image. Please try again.',
        hudTag: '[VISION // ERROR]'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Camera alternative
  const handleCameraCapture = async (type) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    setIsUploading(true);
    try {
      const result = await takeRoadmapPhoto();
      if (result && result.uri) {
        const updated = await updateVisionBoardItem(type, {
          uri: result.uri,
          name: result.name
        });
        setBoardData({ ...updated });
        setGuideModalVisible(false);

        showGlobalCyberNotification({
          type: 'success',
          title: type === 'mistakes' ? 'Reality Check Captured 📸' : 'Dream Vision Captured 📸',
          message:
            type === 'mistakes'
              ? 'Handwritten note saved to dashboard.'
              : 'Dream vision picture locked.',
          hudTag: '[VISION // CAPTURED]'
        });
      }
    } catch (err) {
      console.error('Camera capture error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Safe launcher from Humble Guide Modal with transition delay for Android Activity
  const handleCameraFromGuide = (type) => {
    setGuideModalVisible(false);
    setTimeout(() => {
      handleCameraCapture(type);
    }, 280);
  };

  const handleGalleryFromGuide = (type) => {
    setGuideModalVisible(false);
    setTimeout(() => {
      handleUploadPhoto(type);
    }, 280);
  };

  // Open full-screen modal
  const openFullscreen = (type) => {
    setActiveViewType(type);
    setModalVisible(true);
  };

  // Remove photo
  const handleRemovePhoto = async (type) => {
    try {
      const updated = await updateVisionBoardItem(type, { uri: null, name: null });
      setBoardData({ ...updated });
      setModalVisible(false);
      showGlobalCyberNotification({
        type: 'info',
        title: 'Photo Removed',
        message: type === 'mistakes' ? 'Mistakes note reset.' : 'Dream vision reset.',
        hudTag: '[VISION // CLEARED]'
      });
    } catch (e) {
      console.error('Failed to remove photo:', e);
    }
  };

  const mistakesUri = boardData.mistakesNotePhotoUri;
  const dreamUri = boardData.dreamVisionPhotoUri;

  const activePhotoUri = activeViewType === 'mistakes' ? mistakesUri : dreamUri;
  const activeTitle =
    activeViewType === 'mistakes'
      ? 'WHY I FAILED // HANDWRITTEN NOTE'
      : 'THE ULTIMATE PRIZE // DREAM VISION';
  const activeSubtitle =
    activeViewType === 'mistakes'
      ? 'Handwritten mistakes & the exact reasons you broke consistency in the past.'
      : 'The life, target, and vision you are waking up to conquer every single day.';

  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={THEME.marigold} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.hudBadge}>
            <View style={styles.hudDot} />
            <Text style={styles.hudBadgeText}>PAIN & PRIZE COCKPIT</Text>
          </View>
          <Text style={styles.sectionTitle}>Reality Check vs Dream Vision</Text>
          <Text style={styles.sectionSubtitle}>
            Your past mistakes on the left • The dream you are chasing on the right
          </Text>
        </View>
      </View>

      {/* 📜 Humble Guide Blueprint Prompt Banner */}
      <TouchableOpacity
        style={styles.guidePromptBanner}
        onPress={() => setGuideModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.guidePromptLeft}>
          <View style={styles.guidePromptIconWrap}>
            <MaterialCommunityIcons name="feather" size={20} color={THEME.marigoldLight} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, minWidth: 0 }}>
              <Text style={styles.guidePromptTitle} numberOfLines={2}>
                ✍️ Humble Guide: What to write on paper?
              </Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>9 QUESTIONS</Text>
              </View>
            </View>
            <Text style={styles.guidePromptSubtitle}>
              Sit in silence with a blank paper & pen. Answer these 9 deep questions honestly before taking a photo.
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={THEME.marigoldLight} />
      </TouchableOpacity>

      {/* Dual Cards Side-by-Side */}
      <View style={styles.dualRow}>
        {/* ============================================================== */}
        {/* LEFT CARD: WHY I FAILED (Handwritten Mistakes Note)            */}
        {/* ============================================================== */}
        <View style={[styles.card, styles.mistakesCard]}>
          {/* Card Top Pill */}
          <View style={[styles.cardTopPill, styles.mistakesTopPill]}>
            <FontAwesome5 name="skull" size={11} color={THEME.crimsonPureRed} />
            <Text style={styles.mistakesPillText}>WHY I FAILED</Text>
          </View>

          {/* Image Display or Upload Dropzone */}
          {mistakesUri ? (
            <TouchableOpacity
              style={styles.imageBox}
              activeOpacity={0.9}
              onPress={() => handlePhotoTap('mistakes')}
            >
              <Image
                source={{ uri: mistakesUri }}
                style={[
                  styles.previewImage,
                  !isMistakesRevealed && (Platform.OS === 'web' ? { filter: 'blur(16px)', transform: [{ scale: 1.05 }] } : {})
                ]}
                blurRadius={!isMistakesRevealed ? (Platform.OS === 'ios' ? 20 : 6) : 0}
                resizeMode="cover"
              />

              {/* Blurred Secret Lock Overlay (Triple-tap to reveal) */}
              {!isMistakesRevealed && (
                <View style={styles.blurCoverOverlay} pointerEvents="none">
                  <Animated.View
                    style={[
                      styles.blurLockBadge,
                      styles.mistakesBlurBadge,
                      { transform: [{ scale: mistakesScaleAnim }] }
                    ]}
                  >
                    <FontAwesome5
                      name={mistakesTapCount > 0 ? "unlock-alt" : "lock"}
                      size={15}
                      color={THEME.crimsonPureRed}
                    />
                    <Text style={styles.blurLockTitle} numberOfLines={1}>
                      {mistakesTapCount > 0
                        ? `TAP ${3 - mistakesTapCount} MORE TO UNBLUR`
                        : 'TAP 3X TO REVEAL'}
                    </Text>
                    {/* 3-Dot indicator */}
                    <View style={styles.tapDotsRow}>
                      <View style={[styles.tapDot, mistakesTapCount >= 1 && styles.tapDotCrimsonActive]} />
                      <View style={[styles.tapDot, mistakesTapCount >= 2 && styles.tapDotCrimsonActive]} />
                      <View style={[styles.tapDot, mistakesTapCount >= 3 && styles.tapDotCrimsonActive]} />
                    </View>
                  </Animated.View>
                </View>
              )}

              {/* Image Overlay Bar */}
              <View style={styles.imageOverlayBar}>
                <Text style={styles.overlayText} numberOfLines={1}>
                  {isMistakesRevealed ? 'Handwritten Note 👁️' : 'Classified Note 🔒'}
                </Text>
                <View style={styles.overlayIcons}>
                  {isMistakesRevealed && (
                    <TouchableOpacity
                      style={styles.smallActionBtn}
                      onPress={() => setIsMistakesRevealed(false)}
                      activeOpacity={0.7}
                      title="Hide & Blur"
                    >
                      <Ionicons name="eye-off-outline" size={13} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.smallActionBtn}
                    onPress={() => handleUploadPhoto('mistakes')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera" size={13} color="#ffffff" />
                  </TouchableOpacity>
                  {isMistakesRevealed && (
                    <TouchableOpacity
                      style={styles.smallActionBtn}
                      onPress={() => openFullscreen('mistakes')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="expand" size={13} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, styles.mistakesUploadBox]}
              onPress={() => setGuideModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.uploadIconCircleCrimson}>
                <MaterialCommunityIcons name="notebook-edit-outline" size={24} color={THEME.crimson} />
              </View>
              <Text style={styles.uploadPromptTitleCrimson}>Handwritten Mistakes Note</Text>
              <Text style={styles.uploadPromptSub}>
                Why did you fail? What excuses broke consistency? Sit down and write answers to the 9 questions.
              </Text>
              <View style={styles.uploadBtnCrimson}>
                <Ionicons name="create-outline" size={14} color="#ffffff" />
                <Text style={styles.uploadBtnText}>Read 9 Questions & Upload</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Quick Action: Read 9 Questions / Update Note */}
          <TouchableOpacity
            style={styles.readUpdateBtnCrimson}
            onPress={() => setGuideModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="feather" size={12} color={THEME.crimsonPureRed} />
            <Text style={styles.readUpdateBtnTextCrimson} numberOfLines={1}>
              {mistakesUri ? 'Read 9 Questions & Update' : 'Read 9 Questions'}
            </Text>
          </TouchableOpacity>

          {/* Bottom Card Footer */}
          <Text style={styles.cardFooterHintCrimson} numberOfLines={1}>
            {mistakesUri
              ? isMistakesRevealed
                ? 'Tap photo to zoom • Never repeat past mistakes'
                : '🔒 Blurred • Tap 3 times to reveal note'
              : 'Tap to read the 9 questions'}
          </Text>
        </View>

        {/* ============================================================== */}
        {/* RIGHT CARD: THE DREAM VISION (Ultimate Target Picture)        */}
        {/* ============================================================== */}
        <View style={[styles.card, styles.dreamCard]}>
          {/* Card Top Pill */}
          <View style={[styles.cardTopPill, styles.dreamTopPill]}>
            <Ionicons name="trophy" size={12} color={THEME.marigoldLight} />
            <Text style={styles.dreamPillText}>DREAM VISION</Text>
          </View>

          {/* Image Display or Upload Dropzone */}
          {dreamUri ? (
            <TouchableOpacity
              style={styles.imageBox}
              activeOpacity={0.9}
              onPress={() => handlePhotoTap('dream')}
            >
              <Image
                source={{ uri: dreamUri }}
                style={[
                  styles.previewImage,
                  !isDreamRevealed && (Platform.OS === 'web' ? { filter: 'blur(16px)', transform: [{ scale: 1.05 }] } : {})
                ]}
                blurRadius={!isDreamRevealed ? (Platform.OS === 'ios' ? 20 : 6) : 0}
                resizeMode="cover"
              />

              {/* Blurred Secret Lock Overlay (Triple-tap to reveal) */}
              {!isDreamRevealed && (
                <View style={styles.blurCoverOverlay} pointerEvents="none">
                  <Animated.View
                    style={[
                      styles.blurLockBadge,
                      styles.dreamBlurBadge,
                      { transform: [{ scale: dreamScaleAnim }] }
                    ]}
                  >
                    <FontAwesome5
                      name={dreamTapCount > 0 ? "unlock-alt" : "lock"}
                      size={15}
                      color={THEME.marigoldLight}
                    />
                    <Text style={styles.blurLockTitleGold} numberOfLines={1}>
                      {dreamTapCount > 0
                        ? `TAP ${3 - dreamTapCount} MORE TO UNBLUR`
                        : 'TAP 3X TO REVEAL'}
                    </Text>
                    {/* 3-Dot indicator */}
                    <View style={styles.tapDotsRow}>
                      <View style={[styles.tapDot, dreamTapCount >= 1 && styles.tapDotGoldActive]} />
                      <View style={[styles.tapDot, dreamTapCount >= 2 && styles.tapDotGoldActive]} />
                      <View style={[styles.tapDot, dreamTapCount >= 3 && styles.tapDotGoldActive]} />
                    </View>
                  </Animated.View>
                </View>
              )}

              {/* Image Overlay Bar */}
              <View style={[styles.imageOverlayBar, styles.dreamOverlayBar]}>
                <Text style={styles.overlayText} numberOfLines={1}>
                  {isDreamRevealed ? 'The Prize 👑' : 'Secret Vision 🔒'}
                </Text>
                <View style={styles.overlayIcons}>
                  {isDreamRevealed && (
                    <TouchableOpacity
                      style={styles.smallActionBtn}
                      onPress={() => setIsDreamRevealed(false)}
                      activeOpacity={0.7}
                      title="Hide & Blur"
                    >
                      <Ionicons name="eye-off-outline" size={13} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.smallActionBtn}
                    onPress={() => handleUploadPhoto('dream')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera" size={13} color="#ffffff" />
                  </TouchableOpacity>
                  {isDreamRevealed && (
                    <TouchableOpacity
                      style={styles.smallActionBtn}
                      onPress={() => openFullscreen('dream')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="expand" size={13} color="#ffffff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBox, styles.dreamUploadBox]}
              onPress={() => handleUploadPhoto('dream')}
              activeOpacity={0.8}
            >
              <View style={styles.uploadIconCircleGold}>
                <Ionicons name="trophy-outline" size={24} color={THEME.marigoldLight} />
              </View>
              <Text style={styles.uploadPromptTitleGold}>Dream Vision</Text>
              <Text style={styles.uploadPromptSub}>
                Upload photo of your dream goal, target life, idol, physique, or final milestone.
              </Text>
              <View style={styles.uploadBtnGold}>
                <Ionicons name="add" size={14} color="#000000" />
                <Text style={styles.uploadBtnTextGold}>+ Add Dream Pic</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Quick Action: Update Dream Vision Button */}
          <TouchableOpacity
            style={styles.readUpdateBtnGold}
            onPress={() => handleUploadPhoto('dream')}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={12} color={THEME.marigoldLight} />
            <Text style={styles.readUpdateBtnTextGold} numberOfLines={1}>
              {dreamUri ? 'Update Dream Vision' : '+ Add Dream Pic'}
            </Text>
          </TouchableOpacity>

          {/* Bottom Card Footer */}
          <Text style={styles.cardFooterHintGold} numberOfLines={1}>
            {dreamUri
              ? isDreamRevealed
                ? 'Tap picture to zoom • The price is paid daily'
                : '🔒 Blurred • Tap 3 times to reveal picture'
              : 'Set the prize you fight for'}
          </Text>
        </View>
      </View>

      {/* Cyber Motivation Anchor Bar */}
      <View style={styles.anchorBar}>
        <Ionicons name="shield-checkmark" size={14} color={THEME.blueLight} />
        <Text style={styles.anchorText}>
          Pain of Regret <Text style={{ color: THEME.crimson }}>[Left]</Text> vs Prize of Discipline{' '}
          <Text style={{ color: THEME.marigoldLight }}>[Right]</Text>
        </Text>
      </View>

      {/* ============================================================== */}
      {/* 📜 9-QUESTIONS HUMBLE REALITY CHECK GUIDE MODAL                */}
      {/* ============================================================== */}
      <Modal
        visible={guideModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGuideModalVisible(false)}
      >
        <View style={styles.guideModalBackdrop}>
          <View style={styles.guideModalContainer}>
            {/* Modal Top Header */}
            <View style={styles.guideModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.hudBadge}>
                  <View style={[styles.hudDot, { backgroundColor: THEME.marigold }]} />
                  <Text style={styles.hudBadgeText}>HUMBLE REALITY CHECK // BLUEPRINT</Text>
                </View>
                <Text style={styles.guideModalMainTitle}>
                  Ek Khula Khat Apne Aap Ke Naam 📜
                </Text>
                <Text style={styles.guideModalSub}>
                  Take a blank paper and a pen right now. Sit alone in silence. No typing — write your raw truth to these 9 questions.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setGuideModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Questions List */}
            <ScrollView
              style={styles.guideQuestionsScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Emotional Intro Box */}
              <View style={styles.introLetterBox}>
                <Text style={styles.introLetterText}>
                  "Bhai / Dost, stop running from your truth. Kitni baar tumne shuru kiya aur beech mein chhod diya?
                  Kitni baar khud se jhooth bola ki 'kal se pakka karunga'?
                  Koi app ya video tumhe consistent nahi bana sakti jab tak tum apne andar ke excuses ka samna nahi karte.
                  {'\n\n'}
                  Aaj ek blank white sheet of paper uthao. Sit in silence for 15 minutes. Bina kisi filter ke apne hatho se in 9 sawalon ka jawab likho:"
                </Text>
              </View>

              {/* 9 Deep Questions */}
              {REALITY_CHECK_QUESTIONS.map((q) => (
                <View key={q.id} style={styles.questionCard}>
                  <View style={styles.questionCardHeader}>
                    <View style={styles.qNumBox}>
                      <Text style={styles.qNumText}>{q.number}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.qTitle}>{q.title}</Text>
                      <View style={styles.qTag}>
                        <Text style={styles.qTagText}>{q.tag}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.qPrompt}>{q.prompt}</Text>
                </View>
              ))}

              {/* Actionable Closing Call to Action */}
              <View style={styles.closingCallBox}>
                <Text style={styles.closingCallTitle}>Abhi Kagaz Par Likho Aur Photo Khincho 📸</Text>
                <Text style={styles.closingCallText}>
                  Jab pura likh lo, toh us paper ki ek saaf photo click karo aur yahan upload karke permanently lock kardo.
                  Jab bhi tumhara aalas tumhe ghere, ye note tumhe yaad dilayega ki tumne khud se kya wada kiya tha.
                </Text>

                <View style={styles.closingBtnsRow}>
                  <TouchableOpacity
                    style={styles.guideCameraBtn}
                    onPress={() => handleCameraFromGuide('mistakes')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={18} color="#ffffff" />
                    <Text style={styles.guideCameraBtnText}>Take Photo with Camera 📸</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.guideGalleryBtn}
                    onPress={() => handleGalleryFromGuide('mistakes')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="images-outline" size={18} color={THEME.marigoldLight} />
                    <Text style={styles.guideGalleryBtnText}>Choose from Gallery 📁</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* FULLSCREEN IMAGE MODAL                                        */}
      {/* ============================================================== */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color:
                        activeViewType === 'mistakes' ? THEME.crimsonPureRed : THEME.marigoldLight
                    }
                  ]}
                >
                  {activeTitle}
                </Text>
                <Text style={styles.modalSubtitle}>{activeSubtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Image Area */}
            <View style={styles.modalImageContainer}>
              {activePhotoUri ? (
                <Image
                  source={{ uri: activePhotoUri }}
                  style={styles.modalFullImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: THEME.textMuted }}>No photo selected.</Text>
              )}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[
                  styles.modalActionBtn,
                  {
                    backgroundColor:
                      activeViewType === 'mistakes' ? THEME.crimson : THEME.marigold
                  }
                ]}
                onPress={() => {
                  handleUploadPhoto(activeViewType);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={activeViewType === 'mistakes' ? '#ffffff' : '#000000'}
                />
                <Text
                  style={[
                    styles.modalActionBtnText,
                    { color: activeViewType === 'mistakes' ? '#ffffff' : '#000000' }
                  ]}
                >
                  Replace Photo 📷
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={() => handleRemovePhoto(activeViewType)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={17} color={THEME.crimsonPureRed} />
                <Text style={styles.modalDeleteBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 12
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center'
  },
  sectionHeader: {
    marginBottom: 8
  },
  headerLeft: {
    flex: 1
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.crimson
  },
  hudBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: THEME.textMuted
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textWhite,
    letterSpacing: 0.3
  },
  sectionSubtitle: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2
  },
  guidePromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12
  },
  guidePromptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8
  },
  guidePromptIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    flexShrink: 0
  },
  guidePromptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.marigoldLight,
    flexShrink: 1
  },
  guidePromptSubtitle: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginTop: 2,
    lineHeight: 14
  },
  newBadge: {
    backgroundColor: THEME.crimson,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900'
  },
  dualRow: {
    flexDirection: 'row',
    gap: 12
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: THEME.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 10,
    overflow: 'hidden'
  },
  mistakesCard: {
    borderColor: 'rgba(225, 29, 72, 0.4)',
    shadowColor: THEME.crimson,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  dreamCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    shadowColor: THEME.marigold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  cardTopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8
  },
  mistakesTopPill: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)'
  },
  mistakesPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.crimsonPureRed,
    letterSpacing: 0.6
  },
  dreamTopPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)'
  },
  dreamPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.marigoldLight,
    letterSpacing: 0.6
  },
  imageBox: {
    height: 185,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#040711'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  imageOverlayBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8, 13, 24, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)'
  },
  dreamOverlayBar: {
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  overlayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1
  },
  overlayIcons: {
    flexDirection: 'row',
    gap: 6
  },
  blurCoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(4, 7, 17, 0.78)'
  },
  readUpdateBtnCrimson: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 6
  },
  readUpdateBtnTextCrimson: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.crimsonPureRed,
    letterSpacing: 0.3
  },
  readUpdateBtnGold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 6
  },
  readUpdateBtnTextGold: {
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.marigoldLight,
    letterSpacing: 0.3
  },
  blurLockBadge: {
    backgroundColor: 'rgba(5, 9, 18, 0.9)',
    borderRadius: 12,
    borderWidth: 1.2,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    width: '92%'
  },
  mistakesBlurBadge: {
    borderColor: 'rgba(225, 29, 72, 0.65)'
  },
  dreamBlurBadge: {
    borderColor: 'rgba(245, 158, 11, 0.65)'
  },
  blurLockTitle: {
    color: THEME.crimsonPureRed,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 5,
    textAlign: 'center'
  },
  blurLockTitleGold: {
    color: THEME.marigoldLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 5,
    textAlign: 'center'
  },
  tapDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5
  },
  tapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  tapDotCrimsonActive: {
    backgroundColor: THEME.crimsonPureRed
  },
  tapDotGoldActive: {
    backgroundColor: THEME.marigold
  },
  smallActionBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadBox: {
    minHeight: 185,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    paddingVertical: 12
  },
  mistakesUploadBox: {
    backgroundColor: 'rgba(22, 6, 12, 0.5)',
    borderColor: 'rgba(225, 29, 72, 0.5)'
  },
  dreamUploadBox: {
    backgroundColor: 'rgba(20, 14, 5, 0.5)',
    borderColor: 'rgba(245, 158, 11, 0.5)'
  },
  uploadIconCircleCrimson: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  uploadIconCircleGold: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  uploadPromptTitleCrimson: {
    fontSize: 11.5,
    fontWeight: '800',
    color: THEME.crimson,
    marginBottom: 3,
    textAlign: 'center'
  },
  uploadPromptTitleGold: {
    fontSize: 11.5,
    fontWeight: '800',
    color: THEME.marigoldLight,
    marginBottom: 3,
    textAlign: 'center'
  },
  uploadPromptSub: {
    fontSize: 9,
    color: THEME.textMuted,
    textAlign: 'center',
    lineHeight: 12.5,
    marginBottom: 8
  },
  uploadBtnCrimson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.crimson,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  uploadBtnGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.marigold,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8
  },
  uploadBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff'
  },
  uploadBtnTextGold: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000000'
  },
  cardFooterHintCrimson: {
    fontSize: 8.5,
    color: THEME.crimson,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600'
  },
  cardFooterHintGold: {
    fontSize: 8.5,
    color: THEME.marigold,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600'
  },
  anchorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#070f1e',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.blueBorder
  },
  anchorText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  // Guide Modal Styles
  guideModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12
  },
  guideModalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: THEME.bgCardElevated,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: THEME.borderHighlight,
    padding: 16
  },
  guideModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: THEME.borderSubtle,
    paddingBottom: 10
  },
  guideModalMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.marigoldLight,
    letterSpacing: 0.3
  },
  guideModalSub: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 4,
    lineHeight: 15
  },
  guideQuestionsScroll: {
    flex: 1
  },
  introLetterBox: {
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3.5,
    borderColor: THEME.crimson,
    marginBottom: 14
  },
  introLetterText: {
    fontSize: 11.5,
    color: '#e2e8f0',
    lineHeight: 17,
    fontStyle: 'italic'
  },
  questionCard: {
    backgroundColor: '#060a14',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  questionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6
  },
  qNumBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qNumText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.marigoldLight,
    fontFamily: 'monospace'
  },
  qTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.textWhite
  },
  qTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 3
  },
  qTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.textMuted,
    letterSpacing: 0.6
  },
  qPrompt: {
    fontSize: 11,
    color: THEME.textSecondary,
    lineHeight: 16,
    marginTop: 2
  },
  closingCallBox: {
    backgroundColor: '#081020',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: THEME.marigold,
    marginTop: 8
  },
  closingCallTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.marigoldLight,
    marginBottom: 4,
    textAlign: 'center'
  },
  closingCallText: {
    fontSize: 11,
    color: THEME.textSecondary,
    lineHeight: 15.5,
    textAlign: 'center',
    marginBottom: 12
  },
  closingBtnsRow: {
    flexDirection: 'row',
    gap: 10
  },
  guideCameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.crimson,
    paddingVertical: 10,
    borderRadius: 12
  },
  guideCameraBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800'
  },
  guideGalleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.2,
    borderColor: THEME.marigold,
    paddingVertical: 10,
    borderRadius: 12
  },
  guideGalleryBtnText: {
    color: THEME.marigoldLight,
    fontSize: 11.5,
    fontWeight: '800'
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: THEME.bgCardElevated,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: THEME.borderHighlight,
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  modalSubtitle: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 3,
    lineHeight: 15
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  modalImageContainer: {
    height: 340,
    backgroundColor: '#000000',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  modalFullImage: {
    width: '100%',
    height: '100%'
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '800'
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 0, 63, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 63, 0.35)'
  },
  modalDeleteBtnText: {
    color: THEME.crimsonPureRed,
    fontSize: 12,
    fontWeight: '700'
  }
});
