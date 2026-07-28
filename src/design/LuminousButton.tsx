import { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { componentTokens } from './componentTokens';
import { colors, fonts, MIN_TOUCH_TARGET, opacity, spacing } from './tokens';

type Props = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'quiet'; disabled?: boolean; reducedMotion?: boolean; accessibilityLabel?: string };

export function LuminousButton({ label, onPress, variant = 'primary', disabled = false, reducedMotion = false, accessibilityLabel }: Props) {
  const scale = useState(() => new Animated.Value(1))[0];
  const animate = (toValue: number, duration: number) => Animated.timing(scale, { toValue, duration, useNativeDriver: true }).start();
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} onPressIn={() => { if (!reducedMotion) animate(0.98, 120); }} onPressOut={() => { if (!reducedMotion) animate(1, 160); }} style={[styles.base, variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.quiet, disabled && styles.disabled]}><Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>{label}</Text></Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  base: { minHeight: MIN_TOUCH_TARGET, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  primary: { minHeight: componentTokens.primaryButton.minHeight, borderRadius: componentTokens.primaryButton.radius, backgroundColor: componentTokens.primaryButton.background, borderWidth: 1, borderColor: '#6F887E', elevation: 1 },
  secondary: { minHeight: componentTokens.secondaryButton.minHeight, borderRadius: componentTokens.secondaryButton.radius, backgroundColor: componentTokens.secondaryButton.background, borderWidth: 1, borderColor: componentTokens.secondaryButton.border },
  quiet: { alignSelf: 'center', backgroundColor: 'transparent' },
  disabled: { opacity: opacity.disabled },
  label: { fontFamily: fonts.systemMedium, fontSize: 16, lineHeight: 22 },
  primaryLabel: { color: componentTokens.primaryButton.text },
  secondaryLabel: { color: colors.textPrimary },
});
