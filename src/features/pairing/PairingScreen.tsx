import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../design/tokens';
import { useI18n } from '../../i18n';
import { requireSupabaseClient } from '../../lib/supabase';
import { useBowlEnvironment } from '../bowl/bowlEnvironment';
import { useReducedMotion } from '../bowl/useReducedMotion';
import { navigationMotion } from '../navigation/navigationMotion';
import { createConnectionWithInvite, getLocalInvitation, joinConnectionWithInvite, type ConnectionInvite } from './connectionService';
import { PairingHero } from './PairingHero';
import { PairingInitialState } from './PairingInitialState';
import { PairingJoinState } from './PairingJoinState';
import { PairingWaitingState } from './PairingWaitingState';

type PairingFlow = 'initial' | 'waiting' | 'joining';

export function PairingScreen({ existingPairId, onPaired }: { existingPairId?: string | null; onPaired: () => void }) {
  const { t } = useI18n();
  const environment = useBowlEnvironment();
  const reducedMotion = useReducedMotion();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [flow, setFlow] = useState<PairingFlow>(existingPairId ? 'waiting' : 'initial');
  const [code, setCode] = useState('');
  const [created, setCreated] = useState<ConnectionInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focused, setFocused] = useState(false);
  const transition = useState(() => new Animated.Value(1))[0];
  const heroHeight = Math.max(240, Math.min(360, window.height * 0.34));

  useEffect(() => {
    if (!existingPairId || created) return;
    void getLocalInvitation(existingPairId).then((inviteToken) => { if (inviteToken) setCreated({ pairId: existingPairId, inviteToken, expiresAt: '' }); });
  }, [created, existingPairId]);
  useEffect(() => {
    const pairId = created?.pairId ?? existingPairId;
    if (!pairId) return;
    const client = requireSupabaseClient();
    const check = async () => { const { count } = await client.from('pair_members').select('user_id', { count: 'exact', head: true }).eq('pair_id', pairId); if ((count ?? 0) >= 2) onPaired(); };
    const channel = client.channel(`connection-join:${pairId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pair_members', filter: `pair_id=eq.${pairId}` }, () => void check()).subscribe((status) => { if (status === 'SUBSCRIBED') void check(); });
    return () => { void client.removeChannel(channel); };
  }, [created?.pairId, existingPairId, onPaired]);
  useEffect(() => {
    transition.stopAnimation(); transition.setValue(reducedMotion ? 1 : 0);
    Animated.timing(transition, { toValue: 1, duration: reducedMotion ? 0 : navigationMotion.contentTransition, useNativeDriver: true }).start();
  }, [flow, reducedMotion, transition]);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 2200); return () => clearTimeout(timer); }, [copied]);

  const create = async () => { setPending(true); setError(null); try { const invitation = await createConnectionWithInvite(); setCreated(invitation); setFlow('waiting'); } catch { setError(t('pairing.createError')); } finally { setPending(false); } };
  const join = async () => { if (!code.trim() || pending) return; setPending(true); setError(null); try { await joinConnectionWithInvite(code); onPaired(); } catch { setError(t('pairing.joinError')); } finally { setPending(false); } };
  const copy = () => { if (!created?.inviteToken) return; void Clipboard.setStringAsync(created.inviteToken).then(() => setCopied(true)); };
  const share = () => { if (created?.inviteToken) void Share.share({ message: created.inviteToken }); };
  const returnFromJoin = () => { setError(null); setCode(''); setFlow(created || existingPairId ? 'waiting' : 'initial'); };
  const contentStyle = { opacity: transition, transform: [{ translateY: transition.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] };

  return <SafeAreaView edges={['left', 'right']} style={[styles.safe, { backgroundColor: environment.backgroundHaze }]}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.safe}><ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xl + insets.bottom }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <PairingHero height={heroHeight} waiting={flow === 'waiting'} environment={environment} reducedMotion={reducedMotion} />
    <Animated.View accessibilityLiveRegion="polite" style={[styles.content, contentStyle]}>
      {flow === 'initial' ? <PairingInitialState title={t('pairing.begin')} createLabel={t('pairing.create')} joinLabel={t('pairing.joinChoice')} pending={pending} reducedMotion={reducedMotion} onCreate={() => void create()} onJoin={() => setFlow('joining')} /> : null}
      {flow === 'waiting' ? <PairingWaitingState title={t('pairing.waitingTitle')} secondary={t('pairing.waitingSecondary')} token={created?.inviteToken ?? null} helper={t('pairing.shareOnce')} copyLabel={t('pairing.copy')} shareLabel={t('pairing.share')} copiedMessage={copied ? t('pairing.copied') : null} alternativeLabel={t('pairing.useOther')} pending={pending} reducedMotion={reducedMotion} onCopy={copy} onShare={share} onAlternative={() => setFlow('joining')} /> : null}
      {flow === 'joining' ? <PairingJoinState title={t('pairing.joinTitle')} inputLabel={t('pairing.invitation')} code={code} pending={pending} focused={focused} joinLabel={t('pairing.joinAction')} cancelLabel={t('settings.cancel')} reducedMotion={reducedMotion} onCode={setCode} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onJoin={() => void join()} onCancel={returnFromJoin} /> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </Animated.View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, scroll: { flexGrow: 1 }, content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }, error: { ...typography.functionalSecondary, color: colors.error, textAlign: 'center' } });
