import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, MIN_TOUCH_TARGET, spacing, typography } from '../../design/tokens';
import { useAppSession } from '../app/AppSessionProvider';
import { BowlScene, type BowlAnimationCommand, type BowlDiagnosticOptions, type BowlSceneMetrics } from './BowlScene';
import { getBowlEnvironment } from './bowlEnvironment';
import { getBowlDevelopmentDiagnostics, type BowlDevelopmentDiagnostics } from './bowlService';
import { TOTAL_PAIR_PEBBLES, type HeldPebble } from './bowlTypes';

const seeds = [112358, 271828, 314159, 161803, 141421, 173205];

function Chip({ label, active, note, onPress }: { label: string; active?: boolean; note?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(active) }} onPress={onPress} style={[styles.chip, active && styles.active]}>
    <Text style={styles.chipText}>{label}{note ? <Text style={styles.chipNote}> {note}</Text> : null}</Text>
  </Pressable>;
}

function SectionHeading({ children }: { children: string }) {
  return <Text accessibilityRole="header" style={styles.sectionHeading}>{children}</Text>;
}

function Disclosure({ label, expanded, onPress }: { label: string; expanded: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onPress} style={styles.disclosure}>
    <Text style={styles.disclosureText}>{label}</Text><Text style={styles.disclosureArrow}>{expanded ? '−' : '+'}</Text>
  </Pressable>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.metricRow}><Text style={styles.metricLabel}>{label}</Text><Text selectable style={styles.metricValue}>{value}</Text></View>;
}

function ConnectionInspector({ pairId }: { pairId: string | null }) {
  const [state, setState] = useState<{ loading: boolean; value: BowlDevelopmentDiagnostics | null; error: boolean }>({ loading: Boolean(pairId), value: null, error: false });
  const load = () => {
    if (!pairId) { setState({ loading: false, value: null, error: false }); return; }
    setState({ loading: true, value: null, error: false });
    void getBowlDevelopmentDiagnostics(pairId).then((value) => setState({ loading: false, value, error: false })).catch(() => setState({ loading: false, value: null, error: true }));
  };
  useEffect(() => {
    if (!pairId) return;
    let current = true;
    void getBowlDevelopmentDiagnostics(pairId)
      .then((value) => { if (current) setState({ loading: false, value, error: false }); })
      .catch(() => { if (current) setState({ loading: false, value: null, error: true }); });
    return () => { current = false; };
  }, [pairId]);
  if (!pairId) return <Text style={styles.helper}>No active connection.</Text>;
  if (state.loading) return <ActivityIndicator accessibilityLabel="Loading connection diagnostics" color={colors.textSubdued} />;
  if (state.error || !state.value) return <Pressable accessibilityRole="button" onPress={load} style={styles.retry}><Text style={styles.helper}>Diagnostics unavailable · Retry</Text></Pressable>;
  const value = state.value;
  const explanation = value.memberCount < 2
    ? 'Waiting connection: identities are provisioned only after the second member joins.'
    : value.migrationStatus === 'legacy-six-migration-required'
      ? 'Migration review required. Ownership has not been changed.'
      : value.heldCount === 0
        ? 'Legitimate empty bowl: all active identities are held elsewhere.'
        : 'Ready six-pebble connection.';
  return <View style={styles.inspector}>
    <Metric label="Pair ID" value={value.pairId} />
    <Metric label="Connection" value={value.connectionStatus} />
    <Metric label="Migration" value={value.migrationStatus} />
    <Metric label="Members" value={value.memberCount} />
    <Metric label="Active identities" value={value.activeCount} />
    <Metric label="Held by this user" value={value.heldCount} />
    <Metric label="Held elsewhere" value={value.heldElsewhereCount} />
    <Metric label="Retired" value={value.retiredCount} />
    <Text style={styles.helper}>{explanation}</Text>
  </View>;
}

export function BowlLabScreen() {
  const appSession = useAppSession();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const previewHeight = Math.max(300, Math.min(430, window.height * 0.42));
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState(12);
  const [month, setMonth] = useState(6);
  const [maximumDarkness, setMaximumDarkness] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [incoming, setIncoming] = useState(false);
  const [touched, setTouched] = useState(false);
  const [large, setLarge] = useState(false);
  const [hungarian, setHungarian] = useState(false);
  const [safeOverlay, setSafeOverlay] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [unlit, setUnlit] = useState(false);
  const [hideBowl, setHideBowl] = useState(false);
  const [hidePebbles, setHidePebbles] = useState(false);
  const [whiteLight, setWhiteLight] = useState(false);
  const [cameraHelper, setCameraHelper] = useState(false);
  const [lowQuality, setLowQuality] = useState(false);
  const [diagnosticsExpanded, setDiagnosticsExpanded] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [command, setCommand] = useState<BowlAnimationCommand>({ mode: 'rest', nonce: 0 });
  const [metrics, setMetrics] = useState<BowlSceneMetrics | null>(null);
  const pebbles = useMemo<HeldPebble[]>(() => seeds.slice(0, count).map((visualSeed, index) => ({
    id: `lab-${visualSeed}`,
    visualSeed,
    visualVariant: index,
    transferEventId: index === count - 1 && incoming ? 'lab-event' : null,
    incoming: index === count - 1 && incoming,
    touched: index === count - 1 && incoming ? touched : true,
  })), [count, incoming, touched]);
  const baseEnvironment = getBowlEnvironment(new Date(2026, month, 15, phase));
  const environment = maximumDarkness ? { ...baseEnvironment, backgroundEdge: '#A6B3B6', backgroundCenter: '#BEC6C4', backgroundHaze: '#C1B6AE', textPrimary: '#26302E', keyIntensity: 0.95, rimIntensity: 0.22 } : baseEnvironment;
  const diagnostics = useMemo<BowlDiagnosticOptions>(() => ({ wireframe, unlit, hideBowl, hidePebbles, fixedWhiteLight: whiteLight, cameraHelper, lowQuality }), [cameraHelper, hideBowl, hidePebbles, lowQuality, unlit, whiteLight, wireframe]);
  const animate = (mode: BowlAnimationCommand['mode']) => setCommand((current) => ({ mode, nonce: current.nonce + 1 }));

  return <SafeAreaView edges={['left', 'right']} style={styles.safe}>
    <View style={[styles.preview, { height: previewHeight }]}>
      <BowlScene pebbles={pebbles} environment={environment} reducedMotion={reduced} forceFallback={fallback} diagnostics={diagnostics} animationCommand={command} onMetrics={setMetrics} onSend={async () => setCount((value) => Math.max(0, value - 1))} onTouch={async () => setTouched(true)} />
      {safeOverlay ? <View pointerEvents="none" style={styles.safeOverlay} /> : null}
    </View>
    <ScrollView contentContainerStyle={[styles.controls, { paddingBottom: spacing.xxl + insets.bottom }]} showsVerticalScrollIndicator={false}>
      <SectionHeading>Pebble count</SectionHeading>
      <View accessibilityRole="radiogroup" style={styles.segmented}>{Array.from({ length: TOTAL_PAIR_PEBBLES + 1 }, (_, value) => <Chip key={value} label={String(value)} note={value === 3 ? 'initial' : value === 6 ? 'total' : undefined} active={count === value} onPress={() => setCount(value)} />)}</View>

      <SectionHeading>Motion and arrival</SectionHeading>
      <View style={styles.wrap}>
        <Chip label="Hold" active={command.mode === 'hold'} onPress={() => animate('hold')} />
        <Chip label="Cancel" active={command.mode === 'cancel'} onPress={() => animate('cancel')} />
        <Chip label="Departure" active={command.mode === 'departure'} onPress={() => animate('departure')} />
        <Chip label="Arrival" active={command.mode === 'arrival'} onPress={() => { if (count === 0) setCount(1); setIncoming(true); setTouched(false); animate('arrival'); }} />
        <Chip label="Incoming" active={incoming && !touched} onPress={() => { setIncoming(true); setTouched(false); }} />
        <Chip label="Touched" active={incoming && touched} onPress={() => { setIncoming(true); setTouched(true); }} />
      </View>

      <SectionHeading>Lighting and season</SectionHeading>
      <Text style={styles.groupLabel}>Time</Text><View style={styles.wrap}>{[[7, 'Morning'], [12, 'Day'], [18, 'Evening'], [23, 'Night']].map(([value, label]) => <Chip key={label} label={String(label)} active={phase === value} onPress={() => setPhase(Number(value))} />)}<Chip label="Maximum dark" active={maximumDarkness} onPress={() => setMaximumDarkness((value) => !value)} /></View>
      <Text style={styles.groupLabel}>Season</Text><View style={styles.wrap}>{[[0, 'Winter'], [3, 'Spring'], [6, 'Summer'], [9, 'Autumn']].map(([value, label]) => <Chip key={label} label={String(label)} active={month === value} onPress={() => setMonth(Number(value))} />)}</View>

      <SectionHeading>Renderer diagnostics</SectionHeading>
      <Disclosure label="Diagnostic controls" expanded={diagnosticsExpanded} onPress={() => setDiagnosticsExpanded((value) => !value)} />
      {diagnosticsExpanded ? <View style={styles.wrap}>
        <Chip label="Wireframe" active={wireframe} onPress={() => setWireframe((value) => !value)} />
        <Chip label="Unlit" active={unlit} onPress={() => setUnlit((value) => !value)} />
        <Chip label="White light" active={whiteLight} onPress={() => setWhiteLight((value) => !value)} />
        <Chip label="Hide bowl" active={hideBowl} onPress={() => setHideBowl((value) => !value)} />
        <Chip label="Hide pebbles" active={hidePebbles} onPress={() => setHidePebbles((value) => !value)} />
        <Chip label="Camera / axes" active={cameraHelper} onPress={() => setCameraHelper((value) => !value)} />
        <Chip label="Safe area" active={safeOverlay} onPress={() => setSafeOverlay((value) => !value)} />
        <Chip label="Low-end quality" active={lowQuality} onPress={() => setLowQuality((value) => !value)} />
        <Chip label="Reduced motion" active={reduced} onPress={() => setReduced((value) => !value)} />
        <Chip label="GL fallback" active={fallback} onPress={() => setFallback((value) => !value)} />
      </View> : null}
      <Disclosure label={metrics ? `${metrics.canvasWidth.toFixed(0)}×${metrics.canvasHeight.toFixed(0)} · Bowl ${metrics.projectedWidthPercent.toFixed(1)}% · ${metrics.glReady ? 'GL' : 'loading'}` : 'Viewport metrics'} expanded={metricsExpanded} onPress={() => setMetricsExpanded((value) => !value)} />
      {metricsExpanded && metrics ? <View style={styles.metricsPanel}>
        <Metric label="Parent viewport" value={`${metrics.parentWidth.toFixed(1)} × ${metrics.parentHeight.toFixed(1)}`} />
        <Metric label="Canvas viewport" value={`${metrics.canvasWidth.toFixed(1)} × ${metrics.canvasHeight.toFixed(1)}`} />
        <Metric label="Window" value={`${metrics.windowWidth.toFixed(1)} × ${metrics.windowHeight.toFixed(1)}`} />
        <Metric label="Safe area T/R/B/L" value={`${metrics.safeAreaInsets.top}/${metrics.safeAreaInsets.right}/${metrics.safeAreaInsets.bottom}/${metrics.safeAreaInsets.left}`} />
        <Metric label="Aspect" value={metrics.viewportAspectRatio.toFixed(3)} />
        <Metric label="Bowl width" value={`${metrics.projectedWidthPercent.toFixed(1)}%`} />
        <Metric label="L/R margin" value={`${metrics.sideMargin.toFixed(1)} px`} />
        <Metric label="Bounds" value={metrics.bowlBounds} />
        <Metric label="Camera distance" value={metrics.cameraDistance.toFixed(2)} />
        <Metric label="Exposure" value={metrics.exposure.toFixed(2)} />
        <Metric label="Key / rim" value={`${metrics.keyIntensity.toFixed(2)} / ${metrics.rimIntensity.toFixed(2)}`} />
        <Metric label="Frame loop" value={metrics.activeFrameLoop ? 'active' : 'resting'} />
        <Metric label="Canvas instances" value={metrics.canvasInstances} />
        <Metric label="Renderer mounts" value={metrics.rendererMounts} />
        <Metric label="Renderer" value={metrics.fallbackActive ? 'fallback' : metrics.glReady ? 'GL ready' : 'loading'} />
        <Metric label="Animation" value={metrics.activeAnimation} />
      </View> : null}

      <SectionHeading>Typography and accessibility</SectionHeading>
      <View style={styles.wrap}><Chip label="English" active={!hungarian} onPress={() => setHungarian(false)} /><Chip label="Magyar" active={hungarian} onPress={() => setHungarian(true)} /><Chip label="Large type" active={large} onPress={() => setLarge((value) => !value)} /></View>
      <View style={styles.typePreview}><Text style={[styles.serif, large && styles.large]}>{hungarian ? 'A tál most üres. ő Ő ű Ű' : 'The bowl is empty.'}</Text></View>

      <SectionHeading>Data / connection inspector</SectionHeading>
      <Text style={styles.helper}>Development-only member-safe aggregates. No partner identity is returned.</Text>
      <ConnectionInspector pairId={appSession.connectionId} />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.atmosphere },
  preview: { width: '100%', alignSelf: 'stretch', minHeight: 300, position: 'relative', backgroundColor: colors.atmosphere },
  safeOverlay: { position: 'absolute', top: 24, right: 24, bottom: 24, left: 24, borderWidth: 1, borderColor: '#D7A39A' },
  controls: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sectionHeading: { ...typography.functionalPrimary, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  groupLabel: { ...typography.functionalSecondary, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.pressed, borderColor: colors.textMuted },
  chipText: { ...typography.functionalSecondary, color: colors.textFunctional },
  chipNote: { color: colors.textMuted, fontSize: 11 },
  disclosure: { minHeight: MIN_TOUCH_TARGET, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  disclosureText: { ...typography.functionalSecondary, color: colors.textFunctional },
  disclosureArrow: { ...typography.functionalPrimary, color: colors.textSubdued },
  metricsPanel: { paddingVertical: spacing.sm },
  metricRow: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  metricLabel: { fontFamily: typography.functionalSecondary.fontFamily, color: colors.textMuted, fontSize: 13 },
  metricValue: { flexShrink: 1, fontFamily: typography.functionalSecondary.fontFamily, color: colors.textFunctional, fontSize: 13, textAlign: 'right' },
  typePreview: { minHeight: 150, alignItems: 'center', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginTop: spacing.md },
  serif: { ...typography.relationalHero, color: colors.textPrimary, textAlign: 'center' },
  large: { fontSize: 34, lineHeight: 43 },
  helper: { ...typography.functionalSecondary, color: colors.textMuted, marginBottom: spacing.sm },
  inspector: { gap: spacing.xs },
  retry: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
});
