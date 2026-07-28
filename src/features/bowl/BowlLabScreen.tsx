import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../design/tokens';
import { BowlScene, type BowlAnimationCommand, type BowlDiagnosticOptions, type BowlSceneMetrics } from './BowlScene';
import { getBowlEnvironment } from './bowlEnvironment';
import { TOTAL_PAIR_PEBBLES, type HeldPebble } from './bowlTypes';

const seeds = [112358, 271828, 314159, 161803, 141421, 173205];
function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.active]}><Text style={styles.chipText}>{label}</Text></Pressable>;
}
function Metric({ label, value }: { label: string; value: string | number }) {
  return <Text style={styles.metric}>{label}: {value}</Text>;
}

export function BowlLabScreen() {
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
  const environment = maximumDarkness ? { ...baseEnvironment, backgroundCenter: '#202B30', backgroundHaze: '#28363C', keyIntensity: 1, rimIntensity: 0.68 } : baseEnvironment;
  const diagnostics = useMemo<BowlDiagnosticOptions>(() => ({ wireframe, unlit, hideBowl, hidePebbles, fixedWhiteLight: whiteLight, cameraHelper, lowQuality }), [cameraHelper, hideBowl, hidePebbles, lowQuality, unlit, whiteLight, wireframe]);
  const animate = (mode: BowlAnimationCommand['mode']) => setCommand({ mode, nonce: command.nonce + 1 });

  return <SafeAreaView style={styles.safe}>
    <View style={[styles.preview, large && styles.small]}>
      <BowlScene pebbles={pebbles} environment={environment} reducedMotion={reduced} forceFallback={fallback} diagnostics={diagnostics} animationCommand={command} onMetrics={setMetrics} onSend={async () => setCount((value) => Math.max(0, value - 1))} onTouch={async () => setTouched(true)} />
      {safeOverlay ? <View pointerEvents="none" style={styles.safeOverlay} /> : null}
      {metrics ? <View pointerEvents="none" style={styles.metrics}>
        <Metric label="Bowl width" value={`${metrics.projectedWidthPercent.toFixed(1)}%`} />
        <Metric label="L/R margin" value={`${metrics.sideMargin.toFixed(1)} px`} />
        <Metric label="Bounds" value={metrics.bowlBounds} />
        <Metric label="Camera" value={metrics.cameraDistance.toFixed(2)} />
        <Metric label="Exposure" value={metrics.exposure.toFixed(2)} />
        <Metric label="Key / rim" value={`${metrics.keyIntensity.toFixed(2)} / ${metrics.rimIntensity.toFixed(2)}`} />
        <Metric label="Frames" value={metrics.activeFrameLoop ? 'active' : 'resting'} />
        <Metric label="Canvases" value={metrics.canvasInstances} />
        <Metric label="Animation" value={metrics.activeAnimation} />
      </View> : null}
    </View>
    <ScrollView contentContainerStyle={styles.controls}>
      <Text style={styles.label}>Held pebbles · initial 3 · all 6</Text>
      <View style={styles.wrap}>{Array.from({ length: TOTAL_PAIR_PEBBLES + 1 }, (_, value) => <Chip key={value} label={String(value)} active={count === value} onPress={() => setCount(value)} />)}</View>
      <Text style={styles.label}>Motion and arrival</Text>
      <View style={styles.wrap}>
        <Chip label="Held" active={command.mode === 'hold'} onPress={() => animate('hold')} />
        <Chip label="Cancelled" active={command.mode === 'cancel'} onPress={() => animate('cancel')} />
        <Chip label="Departure" active={command.mode === 'departure'} onPress={() => animate('departure')} />
        <Chip label="Arrival" active={command.mode === 'arrival'} onPress={() => { if (count === 0) setCount(1); setIncoming(true); setTouched(false); animate('arrival'); }} />
        <Chip label="Incoming" active={incoming && !touched} onPress={() => { setIncoming(true); setTouched(false); }} />
        <Chip label="Touched" active={incoming && touched} onPress={() => { setIncoming(true); setTouched(true); }} />
      </View>
      <Text style={styles.label}>Lighting</Text>
      <View style={styles.wrap}>{[[7, 'Morning'], [12, 'Day'], [18, 'Evening'], [23, 'Night']].map(([value, label]) => <Chip key={label} label={String(label)} active={phase === value} onPress={() => setPhase(Number(value))} />)}<Chip label="Maximum dark" active={maximumDarkness} onPress={() => setMaximumDarkness(!maximumDarkness)} /></View>
      <Text style={styles.label}>Season</Text>
      <View style={styles.wrap}>{[[0, 'Winter'], [3, 'Spring'], [6, 'Summer'], [9, 'Autumn']].map(([value, label]) => <Chip key={label} label={String(label)} active={month === value} onPress={() => setMonth(Number(value))} />)}</View>
      <Text style={styles.label}>Renderer diagnostics</Text>
      <View style={styles.wrap}>
        <Chip label="Wireframe" active={wireframe} onPress={() => setWireframe(!wireframe)} />
        <Chip label="Unlit white" active={unlit} onPress={() => setUnlit(!unlit)} />
        <Chip label="White light" active={whiteLight} onPress={() => setWhiteLight(!whiteLight)} />
        <Chip label="Hide bowl" active={hideBowl} onPress={() => setHideBowl(!hideBowl)} />
        <Chip label="Hide pebbles" active={hidePebbles} onPress={() => setHidePebbles(!hidePebbles)} />
        <Chip label="Camera / axes" active={cameraHelper} onPress={() => setCameraHelper(!cameraHelper)} />
        <Chip label="Safe area" active={safeOverlay} onPress={() => setSafeOverlay(!safeOverlay)} />
        <Chip label="Low-end quality" active={lowQuality} onPress={() => setLowQuality(!lowQuality)} />
        <Chip label="Reduced motion" active={reduced} onPress={() => setReduced(!reduced)} />
        <Chip label="GL fallback" active={fallback} onPress={() => setFallback(!fallback)} />
      </View>
      <Text style={styles.label}>Typography</Text>
      <View style={styles.wrap}><Chip label="English" active={!hungarian} onPress={() => setHungarian(false)} /><Chip label="Magyar" active={hungarian} onPress={() => setHungarian(true)} /><Chip label="Small / large type" active={large} onPress={() => setLarge(!large)} /></View>
      <Text style={[styles.serif, large && styles.large]}>{hungarian ? 'A tál most üres. ő Ő ű Ű' : 'The bowl is empty.'}</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.atmosphere },
  preview: { height: 430 },
  small: { height: 310, marginHorizontal: 42 },
  safeOverlay: { position: 'absolute', inset: 24, borderWidth: 1, borderColor: '#D7A39A' },
  metrics: { position: 'absolute', left: 8, top: 8, maxWidth: '68%', padding: 7, backgroundColor: 'rgba(24,33,38,0.82)', borderRadius: 5 },
  metric: { fontFamily: typography.functionalSecondary.fontFamily, color: colors.textFunctional, fontSize: 10, lineHeight: 13 },
  controls: { padding: spacing.md, paddingBottom: spacing.xxl },
  label: { fontFamily: typography.functionalPrimary.fontFamily, color: colors.textSubdued, fontSize: 13, marginTop: spacing.md, marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  active: { backgroundColor: colors.pressed },
  chipText: { ...typography.functionalSecondary, color: colors.textFunctional },
  serif: { ...typography.relationalHero, color: colors.textPrimary, marginTop: spacing.lg, textAlign: 'center' },
  large: { fontSize: 34, lineHeight: 43 },
});
