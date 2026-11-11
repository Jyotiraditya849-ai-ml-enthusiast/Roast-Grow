import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform
} from 'react-native';

export const FlipDigitCard = React.memo(({
  digit = '0',
  cardWidth = 54,
  cardHeight = 78,
  fontSize = 48,
  accentColor = '#f43f5e'
}) => {
  const halfHeight = cardHeight / 2;
  const prevDigitRef = useRef(digit);
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animInstance = null;
    if (digit !== prevDigitRef.current) {
      const oldVal = prevDigitRef.current;
      setPrevDigit(oldVal);
      prevDigitRef.current = digit;
      setIsFlipping(true);
      animValue.setValue(0);

      animInstance = Animated.timing(animValue, {
        toValue: 1,
        duration: 260,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: Platform.OS !== 'web'
      });
      animInstance.start(() => {
        setIsFlipping(false);
      });
    }

    return () => {
      if (animInstance) animInstance.stop();
    };
  }, [digit, animValue]);

  // Interpolations for 3D flip animation
  const topRotate = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '90deg'],
    extrapolate: 'clamp'
  });

  const topOpacity = animValue.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
    extrapolate: 'clamp'
  });

  const topShadow = animValue.interpolate({
    inputRange: [0, 0.5],
    outputRange: [0, 0.75],
    extrapolate: 'clamp'
  });

  const bottomRotate = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-90deg', '-90deg', '0deg'],
    extrapolate: 'clamp'
  });

  const bottomOpacity = animValue.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp'
  });

  const bottomShadow = animValue.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.75, 0],
    extrapolate: 'clamp'
  });

  const textStyle = {
    fontSize,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    width: cardWidth,
    height: cardHeight,
    lineHeight: cardHeight,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif'
  };

  return (
    <View style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}>
      {/* 1. Static Top Half (shows current/new digit) */}
      <View
        style={[
          styles.halfCard,
          styles.topHalf,
          { width: cardWidth, height: halfHeight }
        ]}
      >
        <Text style={[textStyle, { top: 0 }]}>{digit}</Text>
        <View style={styles.topInnerShadow} />
      </View>

      {/* 2. Static Bottom Half (shows previous digit until flap lands, or current if not flipping) */}
      <View
        style={[
          styles.halfCard,
          styles.bottomHalf,
          { width: cardWidth, height: halfHeight, top: halfHeight }
        ]}
      >
        <Text style={[textStyle, { top: -halfHeight }]}>
          {isFlipping ? prevDigit : digit}
        </Text>
        <View style={styles.bottomInnerShadow} />
      </View>

      {/* 3. Animated Folding Top Flap (shows prevDigit top, folds 0 -> 90deg) */}
      {isFlipping && (
        <Animated.View
          style={[
            styles.halfCard,
            styles.topHalf,
            styles.animatedFlap,
            {
              width: cardWidth,
              height: halfHeight,
              top: 0,
              zIndex: 20,
              opacity: topOpacity,
              transform: [
                { perspective: 400 },
                { translateY: halfHeight / 2 },
                { rotateX: topRotate },
                { translateY: -halfHeight / 2 }
              ]
            }
          ]}
        >
          <Text style={[textStyle, { top: 0 }]}>{prevDigit}</Text>
          <Animated.View style={[styles.flapShadowOverlay, { opacity: topShadow }]} />
        </Animated.View>
      )}

      {/* 4. Animated Unfolding Bottom Flap (shows digit bottom, unfolds -90 -> 0deg) */}
      {isFlipping && (
        <Animated.View
          style={[
            styles.halfCard,
            styles.bottomHalf,
            styles.animatedFlap,
            {
              width: cardWidth,
              height: halfHeight,
              top: halfHeight,
              zIndex: 25,
              opacity: bottomOpacity,
              transform: [
                { perspective: 400 },
                { translateY: -halfHeight / 2 },
                { rotateX: bottomRotate },
                { translateY: halfHeight / 2 }
              ]
            }
          ]}
        >
          <Text style={[textStyle, { top: -halfHeight }]}>{digit}</Text>
          <Animated.View style={[styles.flapShadowOverlay, { opacity: bottomShadow }]} />
        </Animated.View>
      )}

      {/* 5. Center Split Horizontal Crease Line */}
      <View style={[styles.splitLine, { top: halfHeight - 1, width: cardWidth }]} />

      {/* 6. Mechanical Side Hinge Notches (authentic flip clock pegs) */}
      <View style={[styles.sideNotch, styles.leftNotch, { top: halfHeight - 3 }]} />
      <View style={[styles.sideNotch, styles.rightNotch, { top: halfHeight - 3 }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 9,
    backgroundColor: '#0c111a',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4
  },
  halfCard: {
    position: 'absolute',
    left: 0,
    overflow: 'hidden',
    backgroundColor: '#161f2c',
    borderWidth: 1,
    borderColor: '#253347'
  },
  topHalf: {
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomWidth: 0,
    backgroundColor: '#192231'
  },
  bottomHalf: {
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    borderTopWidth: 0,
    backgroundColor: '#111722'
  },
  animatedFlap: {
    backfaceVisibility: 'hidden'
  },
  topInnerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)'
  },
  bottomInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)'
  },
  flapShadowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000'
  },
  splitLine: {
    position: 'absolute',
    left: 0,
    height: 1.5,
    backgroundColor: '#070a10',
    zIndex: 30
  },
  sideNotch: {
    position: 'absolute',
    width: 4,
    height: 6,
    borderRadius: 2,
    backgroundColor: '#080c14',
    zIndex: 35,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  leftNotch: {
    left: -2
  },
  rightNotch: {
    right: -2
  }
});

