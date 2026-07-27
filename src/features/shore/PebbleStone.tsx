import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, ViewStyle } from 'react-native';

import type { ShorePebbleOrigin } from './shoreTypes';

type PebbleStoneProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  origin: ShorePebbleOrigin;
  size?: number;
  style?: ViewStyle;
  touched?: boolean;
  onPress?: () => void;
};

export function PebbleStone({
  accessibilityLabel,
  disabled = false,
  origin,
  size = 74,
  style,
  touched = false,
  onPress,
}: PebbleStoneProps) {
  const [entrance] = useState(() => new Animated.Value(0));
  const [touchScale] = useState(() => new Animated.Value(1));
  const palette = origin === 'self' ? selfPalette : otherPalette;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const animateTouch = () => {
    Animated.sequence([
      Animated.timing(touchScale, {
        toValue: 0.94,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(touchScale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };

  const translateY = useMemo(
    () =>
      entrance.interpolate({
        inputRange: [0, 1],
        outputRange: origin === 'other' ? [-24, 0] : [16, 0],
      }),
    [entrance, origin],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={disabled || !onPress}
      hitSlop={8}
      onPress={animateTouch}
      style={style}
    >
      <Animated.View
        style={[
          styles.shadow,
          {
            width: size,
            height: size * 0.7,
            borderRadius: size / 2,
            backgroundColor: palette.shadow,
            opacity: entrance,
            transform: [{ translateY }, { scale: touchScale }, { rotate: origin === 'self' ? '-2deg' : '2deg' }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.stone,
            touched && styles.touched,
            {
              width: size,
              height: size * 0.66,
              borderRadius: size / 2,
              backgroundColor: touched ? palette.touched : palette.fill,
              borderColor: palette.edge,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const selfPalette = {
  fill: '#B7C8BE',
  touched: '#A9BBB2',
  edge: '#91A79C',
  shadow: 'rgba(53, 75, 65, 0.12)',
};

const otherPalette = {
  fill: '#CDB49F',
  touched: '#BFA68F',
  edge: '#AD9279',
  shadow: 'rgba(85, 62, 43, 0.12)',
};

const styles = StyleSheet.create({
  shadow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stone: {
    borderWidth: 1,
  },
  touched: {
    opacity: 0.86,
  },
});
