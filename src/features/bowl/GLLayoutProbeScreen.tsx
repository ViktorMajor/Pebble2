import { useState } from 'react';
import { PixelRatio, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { BowlScene, type BowlSceneMetrics } from './BowlScene';
import { getBowlEnvironment } from './bowlEnvironment';
import type { HeldPebble } from './bowlTypes';

type Size = { width: number; height: number };

const MOCK_PEBBLES: HeldPebble[] = [
  { id: 'gl-probe-1', visualSeed: 112358, visualVariant: 0, transferEventId: null, incoming: false, touched: true },
  { id: 'gl-probe-2', visualSeed: 271828, visualVariant: 3, transferEventId: null, incoming: false, touched: true },
  { id: 'gl-probe-3', visualSeed: 314159, visualVariant: 5, transferEventId: null, incoming: false, touched: true },
];

const environment = getBowlEnvironment(new Date(2026, 6, 15, 12));
const emptySize: Size = { width: 0, height: 0 };
const format = (value: number) => Number.isFinite(value) ? value.toFixed(1) : 'invalid';

function measure(setter: (size: Size) => void) {
  return (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setter({ width, height });
  };
}

export function GLLayoutProbeScreen() {
  const window = useWindowDimensions();
  const [root, setRoot] = useState<Size>(emptySize);
  const [bowlParent, setBowlParent] = useState<Size>(emptySize);
  const [metrics, setMetrics] = useState<BowlSceneMetrics | null>(null);
  const status = metrics?.fallbackActive ? 'fallback' : metrics?.glReady ? 'GL ready' : 'GL loading';

  return <View onLayout={measure(setRoot)} style={styles.root}>
    <View onLayout={measure(setBowlParent)} style={styles.bowlParent}>
      <BowlScene
        pebbles={MOCK_PEBBLES}
        environment={environment}
        disabled
        reducedMotion
        diagnostics={{ layoutProbe: true }}
        onMetrics={setMetrics}
        onSend={async () => {}}
        onTouch={async () => {}}
      />
    </View>
    <View pointerEvents="none" style={styles.overlay}>
      <Text style={styles.title}>GL Layout Probe</Text>
      <Text style={styles.metric}>Window {format(window.width)} × {format(window.height)}</Text>
      <Text style={styles.metric}>Root red {format(root.width)} × {format(root.height)}</Text>
      <Text style={styles.metric}>Bowl parent green {format(bowlParent.width)} × {format(bowlParent.height)}</Text>
      <Text style={styles.metric}>Scene parent {format(metrics?.parentWidth ?? 0)} × {format(metrics?.parentHeight ?? 0)}</Text>
      <Text style={styles.metric}>Canvas RN blue {format(metrics?.canvasWidth ?? 0)} × {format(metrics?.canvasHeight ?? 0)}</Text>
      <Text style={styles.metric}>R3F size {format(metrics?.r3fWidth ?? 0)} × {format(metrics?.r3fHeight ?? 0)}</Text>
      <Text style={styles.metric}>GL buffer {format(metrics?.glDrawingBufferWidth ?? 0)} × {format(metrics?.glDrawingBufferHeight ?? 0)}</Text>
      <Text style={styles.metric}>Native DPR {format(metrics?.nativeSurfacePixelRatio ?? PixelRatio.get())}</Text>
      <Text style={styles.metric}>Renderer DPR {format(metrics?.rendererPixelRatio ?? 0)}</Text>
      <Text style={styles.metric}>Expo GL buffer {format(metrics?.expoGLDrawingBufferWidth ?? 0)} × {format(metrics?.expoGLDrawingBufferHeight ?? 0)}</Text>
      <Text style={styles.metric}>Renderer buffer {format(metrics?.rendererDrawingBufferWidth ?? 0)} × {format(metrics?.rendererDrawingBufferHeight ?? 0)}</Text>
      <Text style={styles.metric}>Native surface {metrics?.completeNativeSurfaceCovered ? 'complete' : 'mismatch'}</Text>
      <Text style={styles.metric}>Camera aspect {format(metrics?.cameraAspectRatio ?? 0)}</Text>
      <Text style={styles.metric}>Renderer mounts {metrics?.rendererMounts ?? 0}</Text>
      <Text style={styles.metric}>Status {status}</Text>
    </View>
    <View pointerEvents="none" style={[styles.corner, styles.topLeft]} />
    <View pointerEvents="none" style={[styles.corner, styles.topRight]} />
    <View pointerEvents="none" style={[styles.corner, styles.bottomLeft]} />
    <View pointerEvents="none" style={[styles.corner, styles.bottomRight]} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignSelf: 'stretch', position: 'relative', borderWidth: 2, borderColor: '#FF0000' },
  bowlParent: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: '#00A000' },
  overlay: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.78)', borderRadius: 4 },
  title: { color: '#FFFFFF', fontSize: 12, lineHeight: 15, fontWeight: '700' },
  metric: { color: '#FFFFFF', fontSize: 10, lineHeight: 13, fontVariant: ['tabular-nums'] },
  corner: { position: 'absolute', width: 12, height: 12, backgroundColor: '#FF00FF', borderWidth: 1, borderColor: '#FFFFFF' },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0 },
  bottomLeft: { bottom: 0, left: 0 },
  bottomRight: { bottom: 0, right: 0 },
});
