import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';

import { HOLD_DURATION_MS } from './shoreTypes';

type HoldPebbleProps = {
  onSend: () => Promise<void>;
};

export function HoldPebble({ onSend }: HoldPebbleProps) {
  const [isSending, setIsSending] = useState(false);
  const [holdProgress] = useState(() => new Animated.Value(0));
  const [departure] = useState(() => new Animated.Value(0));
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completed = useRef(false);
  const sending = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
    };
  }, []);

  const progressScale = useMemo(
    () =>
      holdProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.08, 1],
      }),
    [holdProgress],
  );

  const pebbleOpacity = departure.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const pebbleTranslateY = departure.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -170],
  });

  const subtleImpact = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const completionImpact = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (completed.current) {
      return;
    }

    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const resetAfterFailure = () => {
    setIsSending(false);
    sending.current = false;
    completed.current = false;
    holdProgress.setValue(0);
    departure.setValue(0);
  };

  const animateDeparture = () => {
    completed.current = true;

    Animated.timing(departure, {
      toValue: 1,
      duration: 560,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSending(false);
      sending.current = false;
      completed.current = false;
      holdProgress.setValue(0);
      departure.setValue(0);
    });

    void completionImpact();
  };

  const completeHold = () => {
    completed.current = true;
    holdTimer.current = null;

    onSend()
      .then(animateDeparture)
      .catch(resetAfterFailure);
  };

  const beginHold = () => {
    if (sending.current) {
      return;
    }

    completed.current = false;
    sending.current = true;
    setIsSending(true);
    void subtleImpact();

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    holdTimer.current = setTimeout(completeHold, HOLD_DURATION_MS);
  };

  const endHold = () => {
    if (!completed.current) {
      setIsSending(false);
      cancelHold();
    }
  };

  return (
    <Pressable
      accessibilityHint="Hold for about one second. Release early to cancel."
      accessibilityLabel="Send a pebble"
      accessibilityRole="button"
      disabled={isSending}
      onPressIn={beginHold}
      onPressOut={endHold}
      style={styles.pressable}
    >
      <View style={styles.progressShell}>
        <Animated.View style={[styles.progressFill, { transform: [{ scale: progressScale }] }]} />
      </View>
      <Animated.View
        style={[
          styles.pebbleShadow,
          {
            opacity: pebbleOpacity,
            transform: [{ translateY: pebbleTranslateY }, { rotate: '-3deg' }],
          },
        ]}
      >
        <View style={styles.pebble} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 154,
    height: 154,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressShell: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 1,
    borderColor: '#DED3C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressFill: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(176, 194, 184, 0.22)',
  },
  pebbleShadow: {
    width: 100,
    height: 70,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(66, 54, 42, 0.11)',
  },
  pebble: {
    width: 98,
    height: 64,
    borderRadius: 49,
    borderWidth: 1,
    borderColor: '#A99782',
    backgroundColor: '#C5B39E',
  },
});
