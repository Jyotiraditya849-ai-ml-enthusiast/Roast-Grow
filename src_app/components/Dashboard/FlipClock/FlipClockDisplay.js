import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { FlipDigitCard } from './FlipDigitCard';

export const FlipClockDisplay = ({
  secondsLeft = 0,
  isRunning = false,
  accentColor = '#f43f5e',
  mode = 'pomodoro'
}) => {
  const totalSeconds = Math.max(0, secondsLeft);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hasHours = hours > 0;
  const h1 = String(Math.floor(hours / 10));
  const h2 = String(hours % 10);
  const m1 = String(Math.floor(minutes / 10));
  const m2 = String(minutes % 10);
  const s1 = String(Math.floor(seconds / 10));
  const s2 = String(seconds % 10);

  // Colon pulse animation when running
  const colonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim;
    if (isRunning) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(colonOpacity, {
            toValue: 0.25,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web'
          }),
          Animated.timing(colonOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web'
          })
        ])
      );
      anim.start();
    } else {
      colonOpacity.setValue(1);
    }

    return () => {
      if (anim) anim.stop();
    };
  }, [isRunning, colonOpacity]);

  // Card sizing: compact if hours exist, full size if standard MM:SS
  const cardWidth = hasHours ? 40 : 54;
  const cardHeight = hasHours ? 62 : 78;
  const fontSize = hasHours ? 36 : 48;
  const cardGap = hasHours ? 4 : 6;

  return (
    <View style={styles.clockContainer}>
      {/* Background Soft Aura Glow */}
      <View
        style={[
          styles.glowAura,
          {
            backgroundColor: accentColor,
            shadowColor: accentColor
          }
        ]}
      />

      <View style={styles.clockRow}>
        {/* HOURS PAIR (Only when hours > 0) */}
        {hasHours && (
          <>
            <View style={styles.unitGroup}>
              <View style={[styles.digitsPairRow, { gap: cardGap }]}>
                <FlipDigitCard
                  digit={h1}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  fontSize={fontSize}
                  accentColor={accentColor}
                />
                <FlipDigitCard
                  digit={h2}
                  cardWidth={cardWidth}
                  cardHeight={cardHeight}
                  fontSize={fontSize}
                  accentColor={accentColor}
                />
              </View>
              <Text style={styles.unitLabel}>HOURS</Text>
            </View>

            {/* Colon Divider */}
            <View style={[styles.colonContainer, { height: cardHeight }]}>
              <Animated.View
                style={[
                  styles.colonDot,
                  {
                    backgroundColor: isRunning ? accentColor : '#94a3b8',
                    opacity: colonOpacity
                  }
                ]}
              />
              <Animated.View
                style={[
                  styles.colonDot,
                  {
                    backgroundColor: isRunning ? accentColor : '#94a3b8',
                    opacity: colonOpacity
                  }
                ]}
              />
            </View>
          </>
        )}

        {/* MINUTES PAIR */}
        <View style={styles.unitGroup}>
          <View style={[styles.digitsPairRow, { gap: cardGap }]}>
            <FlipDigitCard
              digit={m1}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              fontSize={fontSize}
              accentColor={accentColor}
            />
            <FlipDigitCard
              digit={m2}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              fontSize={fontSize}
              accentColor={accentColor}
            />
          </View>
          <Text style={styles.unitLabel}>MINUTES</Text>
        </View>

        {/* Colon Divider */}
        <View style={[styles.colonContainer, { height: cardHeight }]}>
          <Animated.View
            style={[
              styles.colonDot,
              {
                backgroundColor: isRunning ? accentColor : '#94a3b8',
                opacity: colonOpacity
              }
            ]}
          />
          <Animated.View
            style={[
              styles.colonDot,
              {
                backgroundColor: isRunning ? accentColor : '#94a3b8',
                opacity: colonOpacity
              }
            ]}
          />
        </View>

        {/* SECONDS PAIR */}
        <View style={styles.unitGroup}>
          <View style={[styles.digitsPairRow, { gap: cardGap }]}>
            <FlipDigitCard
              digit={s1}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              fontSize={fontSize}
              accentColor={accentColor}
            />
            <FlipDigitCard
              digit={s2}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              fontSize={fontSize}
              accentColor={accentColor}
            />
          </View>
          <Text style={styles.unitLabel}>SECONDS</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
    paddingVertical: 6
  },
  glowAura: {
    position: 'absolute',
    width: 220,
    height: 90,
    borderRadius: 45,
    opacity: 0.08,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 0
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unitGroup: {
    alignItems: 'center'
  },
  digitsPairRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  unitLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1.4,
    marginTop: 7,
    textTransform: 'uppercase'
  },
  colonContainer: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 3,
    marginBottom: 16
  },
  colonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2
  }
});

