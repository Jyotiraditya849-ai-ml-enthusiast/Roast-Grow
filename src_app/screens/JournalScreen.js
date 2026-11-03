import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { useStreak } from '../context/StreakContext';
import { JournalModal } from '../components/Journal/JournalModal';
import { getAllJournalEntries } from '../storage/asyncStorage';
import { Ionicons, Feather } from '@expo/vector-icons';

export const JournalScreen = () => {
  const { todayJournal, saveJournal } = useStreak();
  const [modalVisible, setModalVisible] = useState(false);
  const [allEntries, setAllEntries] = useState([]);

  const loadAll = async () => {
    const list = await getAllJournalEntries();
    setAllEntries(list);
  };

  useEffect(() => {
    loadAll();
  }, [todayJournal, modalVisible]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Action Card */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View>
              <Text style={styles.cardSuperTitle}>TODAY'S LOG</Text>
              <Text style={styles.cardTitle}>Mindset & Proof of Work</Text>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name={todayJournal ? 'edit-2' : 'plus'} size={14} color="#ffffff" />
              <Text style={styles.editBtnText}>{todayJournal ? 'Edit Log' : 'New Log'}</Text>
            </TouchableOpacity>
          </View>

          {todayJournal ? (
            <View style={styles.todayBody}>
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
            </View>
          ) : (
            <View style={styles.emptyPrompt}>
              <Ionicons name="camera-outline" size={32} color="#6e7681" />
              <Text style={styles.emptyPromptText}>No journal entry logged today yet.</Text>
              <Text style={styles.emptyPromptSub}>Capture a photo proof and reflect on your progress.</Text>
            </View>
          )}
        </View>

        {/* Timeline of Previous Entries */}
        <View style={styles.feedSection}>
          <Text style={styles.feedTitle}>Journal History ({allEntries.length})</Text>

          {allEntries.map((entry, index) => (
            <View key={index} style={styles.feedCard}>
              <View style={styles.feedCardHeader}>
                <View style={styles.feedDateGroup}>
                  <Text style={styles.feedMood}>{entry.mood}</Text>
                  <Text style={styles.feedDate}>{entry.date}</Text>
                </View>
              </View>

              {entry.text ? <Text style={styles.feedText}>{entry.text}</Text> : null}

              {entry.photoUri && (
                <Image source={{ uri: entry.photoUri }} style={styles.feedPhoto} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Editor Modal */}
      <JournalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialData={todayJournal}
        onSave={async (data) => {
          await saveJournal(data);
          await loadAll();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d14'
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    paddingBottom: 40
  },
  todayCard: {
    backgroundColor: '#111620',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    marginBottom: 20,
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    color: '#38bdf8',
    letterSpacing: 1.2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f8fafc',
    marginTop: 2
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38bdf8',
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
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic'
  },
  todayPhotoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: '#30363d'
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
    color: '#f0f6fc',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8
  },
  emptyPromptSub: {
    color: '#8b949e',
    fontSize: 12,
    marginTop: 4
  },
  feedSection: {
    marginTop: 4
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f0f6fc',
    marginBottom: 12
  },
  feedCard: {
    backgroundColor: '#111620',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e2636'
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
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
    color: '#8b949e',
    fontSize: 12,
    fontWeight: '700'
  },
  feedText: {
    color: '#e6edf3',
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

