import { StyleSheet, Text, View } from 'react-native';
import { LuminousButton } from '../../design/LuminousButton';
import { colors, spacing, typography } from '../../design/tokens';

export function PairingInitialState({ title, createLabel, joinLabel, pending, reducedMotion, onCreate, onJoin }: { title: string; createLabel: string; joinLabel: string; pending: boolean; reducedMotion: boolean; onCreate: () => void; onJoin: () => void }) {
  return <View style={styles.content}><Text accessibilityRole="header" style={styles.title}>{title}</Text><View style={styles.actions}><LuminousButton label={pending ? '…' : createLabel} disabled={pending} reducedMotion={reducedMotion} onPress={onCreate} /><LuminousButton label={joinLabel} variant="secondary" disabled={pending} reducedMotion={reducedMotion} onPress={onJoin} /></View></View>;
}

const styles = StyleSheet.create({ content: { gap: spacing.xl }, title: { ...typography.relationalHero, color: colors.relationalPrimary, textAlign: 'center' }, actions: { gap: spacing.sm } });
