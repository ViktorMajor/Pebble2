import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LuminousButton } from '../../design/LuminousButton';
import { componentTokens } from '../../design/componentTokens';
import { colors, spacing, typography } from '../../design/tokens';

export function PairingJoinState({ title, inputLabel, code, pending, focused, joinLabel, cancelLabel, reducedMotion, onCode, onFocus, onBlur, onJoin, onCancel }: { title: string; inputLabel: string; code: string; pending: boolean; focused: boolean; joinLabel: string; cancelLabel: string; reducedMotion: boolean; onCode: (value: string) => void; onFocus: () => void; onBlur: () => void; onJoin: () => void; onCancel: () => void }) {
  const disabled = pending || !code.trim();
  return <View style={styles.content}><Text accessibilityRole="header" style={styles.title}>{title}</Text><View><Text style={styles.label}>{inputLabel}</Text><TextInput accessibilityLabel={inputLabel} autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={onJoin} onChangeText={onCode} onFocus={onFocus} onBlur={onBlur} placeholder={inputLabel} placeholderTextColor={colors.textMuted} selectionColor={colors.primaryPressed} style={[styles.input, focused && styles.inputFocused]} value={code} /></View><LuminousButton label={pending ? '…' : joinLabel} disabled={disabled} reducedMotion={reducedMotion} onPress={onJoin} /><LuminousButton label={cancelLabel} variant="quiet" disabled={pending} reducedMotion={reducedMotion} onPress={onCancel} /></View>;
}

const styles = StyleSheet.create({ content: { gap: spacing.md }, title: { ...typography.relationalHero, color: colors.relationalPrimary, textAlign: 'center' }, label: { ...typography.functionalSecondary, color: colors.textSubdued, marginBottom: spacing.xs }, input: { minHeight: componentTokens.input.minHeight, borderRadius: componentTokens.input.radius, borderWidth: 1, borderColor: componentTokens.input.border, backgroundColor: componentTokens.input.background, paddingHorizontal: spacing.md, color: colors.textPrimary, fontFamily: typography.functionalPrimary.fontFamily, fontSize: 16 }, inputFocused: { borderColor: componentTokens.input.focusBorder, borderWidth: 2 } });
