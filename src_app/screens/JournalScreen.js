import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { useStreak } from '../context/StreakContext';
import { JournalModal } from '../components/Journal/JournalModal';
import { getAllJournalEntries } from '../storage/asyncStorage';
import { Ionicons, Feather } from '@expo/vector-icons';
import { THEME } from '../theme';

export const JournalScreen = React.memo(() => {
  const { todayJournal, saveJournal } = useStreak();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [allEntries, setAllEntries] = useState([]);

  const loadAll = async () => {
    const list = await getAllJournalEntries();
    setAllEntries(list);
  };

  useEffect(() => {
    loadAll();
  }, [todayJournal, modalVisible]);

  const handleOpenEditor = (entry = null) => {
    setSelectedEntry(entry || todayJournal);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Action Card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View>
              <Text style={styles.cardSuperTitle}>[DISCIPLINE_ARCHIVE // DAILY_LOG]</Text>
              <Text style={styles.cardTitle}>Mindset & Proof of Work</Text>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleOpenEditor()}
              activeOpacity={0.8}
            >
              <Feather name={todayJournal ? 'edit-2' : 'plus'} size={14} color="#ffffff" />
              <Text style={styles.editBtnText}>{todayJournal ? 'Edit Log' : 'New Log'}</Text>
            </TouchableOpacity>
          </View>

          {todayJournal ? (
            <TouchableOpacity
              style={styles.todayBody}
              onPress={() => handleOpenEditor(todayJournal)}
              activeOpacity={0.85}
            >
              {todayJournal.title ? (
                <Text style={styles.todayNoteTitle}>{todayJournal.title}</Text>
              ) : null}

              <View style={styles.todayMoodRow}>
                <Text style={styles.moodLarge}>{todayJournal.mood}</Text>
                <Text style={styles.todayTextSnippet}>
                  "{todayJournal.text || 'Photo proof attached.'}"
                </Text>
              </View>

              {todayJournal.photoUri && (
                <View style={styles.todayPhotoContainer}>
                  <Image source={{ uri: todayJournal.photoUri }} style={styles.todayPhoto} />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyPrompt}
              onPress={() => handleOpenEditor()}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={32} color={THEME.marigoldLight} />
              <Text style={styles.emptyPromptText}>No journal entry logged today yet.</Text>
              <Text style={styles.emptyPromptSub}>Tap to write your reflection & attach proof.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timeline of Previous Entries */}
        <View style={styles.feedSection}>
          <Text style={styles.feedTitle}>Journal History ({allEntries.length})</Text>

          {allEntries.map((entry, index) => (
            <TouchableOpacity
              key={index}
              style={styles.feedCard}
              onPress={() => handleOpenEditor(entry)}
              activeOpacity={0.85}
            >
              <View style={styles.feedCardHeader}>
                <View style={styles.feedDateGroup}>
                  <Text style={styles.feedMood}>{entry.mood}</Text>
                  <Text style={styles.feedDate}>{entry.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={THEME.textMuted} />
              </View>

              {entry.title ? (
                <Text style={styles.feedCardTitle}>{entry.title}</Text>
              ) : null}

              {entry.text ? <Text style={styles.feedText}>{entry.text}</Text> : null}

              {entry.photoUri && (
                <Image source={{ uri: entry.photoUri }} style={styles.feedPhoto} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Editor Modal */}
      <JournalModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedEntry(null);
        }}
        initialData={selectedEntry || todayJournal}
        onSave={async (data) => {
          await saveJournal(data);
          await loadAll();
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgApp
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    paddingBottom: 40
  },
  todayCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: THEME.borderMedium,
    marginBottom: 20,
    shadowColor: THEME.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  cardSuperTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.marigoldLight,
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textWhite,
    marginTop: 2
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.crimson,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.marigold,
    gap: 6
  },
  editBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800'
  },
  todayBody: {
    marginTop: 4
  },
  todayNoteTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.textWhite,
    marginBottom: 8,
    letterSpacing: -0.2
  },
  todayMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  moodLarge: {
    fontSize: 32
  },
  todayTextSnippet: {
    flex: 1,
    color: THEME.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic'
  },
  todayPhotoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  todayPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  emptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  emptyPromptText: {
    color: THEME.textWhite,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8
  },
  emptyPromptSub: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 4
  },
  feedSection: {
    marginTop: 4
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.textWhite,
    marginBottom: 12
  },
  feedCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.borderMedium
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  feedCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.textWhite,
    marginBottom: 4,
    letterSpacing: -0.2
  },
  feedDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  feedMood: {
    fontSize: 18
  },
  feedDate: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  feedText: {
    color: THEME.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10
  },
  feedPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    resizeMode: 'cover'
  }
});

