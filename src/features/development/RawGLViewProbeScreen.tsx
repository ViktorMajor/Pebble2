import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';

type Size = { width: number; height: number };
type BufferSize = { width: number; height: number };
type Observation = 'not recorded' | 'A: fills layout' | 'B: small rectangle' | 'C: cropped quadrants' | 'D: zero layout';

const EMPTY_SIZE: Size = { width: 0, height: 0 };
const EMPTY_BUFFER: BufferSize = { width: 0, height: 0 };
const format = (value: number) => Number.isFinite(value) ? value.toFixed(1) : 'invalid';

function renderQuadrants(gl: ExpoWebGLRenderingContext) {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const boundary = Math.max(4, Math.round(Math.min(width, height) * 0.01));
  const innerWidth = Math.max(0, width - boundary * 2);
  const innerHeight = Math.max(0, height - boundary * 2);
  const leftWidth = Math.floor(innerWidth / 2);
  const rightWidth = innerWidth - leftWidth;
  const bottomHeight = Math.floor(innerHeight / 2);
  const topHeight = innerHeight - bottomHeight;
  const clearRegion = (x: number, y: number, regionWidth: number, regionHeight: number, color: readonly [number, number, number, number]) => {
    gl.scissor(x, y, regionWidth, regionHeight);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  gl.viewport(0, 0, width, height);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, 0, width, height);
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  clearRegion(boundary, boundary + bottomHeight, leftWidth, topHeight, [1, 0, 0, 1]);
  clearRegion(boundary + leftWidth, boundary + bottomHeight, rightWidth, topHeight, [0, 1, 0, 1]);
  clearRegion(boundary, boundary, leftWidth, bottomHeight, [0, 0, 1, 1]);
  clearRegion(boundary + leftWidth, boundary, rightWidth, bottomHeight, [1, 1, 0, 1]);
  gl.disable(gl.SCISSOR_TEST);
  gl.endFrameEXP();
}

function RawGLSurface({ width, height, onLayout, onContext, onMount, onUnmount }: {
  width: number;
  height: number;
  onLayout: (event: LayoutChangeEvent) => void;
  onContext: (gl: ExpoWebGLRenderingContext) => void;
  onMount: () => void;
  onUnmount: () => void;
}) {
  useEffect(() => {
    onMount();
    return onUnmount;
  }, [onMount, onUnmount]);

  return <GLView
    onLayout={onLayout}
    onContextCreate={onContext}
    style={[styles.glView, { width, height }]}
  />;
}

export function RawGLViewProbeScreen() {
  const window = useWindowDimensions();
  const context = useRef<ExpoWebGLRenderingContext | null>(null);
  const [root, setRoot] = useState<Size>(EMPTY_SIZE);
  const [measured, setMeasured] = useState<Size>(EMPTY_SIZE);
  const [glLayout, setGLLayout] = useState<Size>(EMPTY_SIZE);
  const [buffer, setBuffer] = useState<BufferSize>(EMPTY_BUFFER);
  const [contextId, setContextId] = useState<number | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [mountCount, setMountCount] = useState(0);
  const [contextCount, setContextCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [observation, setObservation] = useState<Observation>('not recorded');

  const onRootLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setRoot({ width, height });
  }, []);
  const onMeasuredLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) setMeasured({ width, height });
  }, []);
  const onGLLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setGLLayout({ width, height });
  }, []);
  const draw = useCallback((gl: ExpoWebGLRenderingContext) => {
    renderQuadrants(gl);
    setBuffer({ width: gl.drawingBufferWidth, height: gl.drawingBufferHeight });
    setRenderCount((value) => value + 1);
  }, []);
  const onContext = useCallback((gl: ExpoWebGLRenderingContext) => {
    context.current = gl;
    setContextId(gl.contextId);
    setContextCount((value) => value + 1);
    draw(gl);
  }, [draw]);
  const onMount = useCallback(() => setMountCount((value) => value + 1), []);
  const onUnmount = useCallback(() => { context.current = null; }, []);
  const rerender = () => { if (context.current) draw(context.current); };
  const remount = () => {
    context.current = null;
    setContextId(null);
    setBuffer(EMPTY_BUFFER);
    setGLLayout(EMPTY_SIZE);
    setMountKey((value) => value + 1);
  };
  const ratioX = glLayout.width > 0 ? buffer.width / glLayout.width : 0;
  const ratioY = glLayout.height > 0 ? buffer.height / glLayout.height : 0;

  return <View onLayout={onRootLayout} style={styles.root}>
    <View onLayout={onMeasuredLayout} style={styles.measured}>
      {measured.width > 0 && measured.height > 0 ? <RawGLSurface
        key={mountKey}
        width={measured.width}
        height={measured.height}
        onLayout={onGLLayout}
        onContext={onContext}
        onMount={onMount}
        onUnmount={onUnmount}
      /> : null}
      <View pointerEvents="none" style={styles.glOutline} />
    </View>

    <View style={styles.overlay}>
      <Text style={styles.title}>Raw GLView Probe</Text>
      <Text style={styles.metric}>Window {format(window.width)} × {format(window.height)}</Text>
      <Text style={styles.metric}>Root {format(root.width)} × {format(root.height)}</Text>
      <Text style={styles.metric}>GLView layout {format(glLayout.width)} × {format(glLayout.height)}</Text>
      <Text style={styles.metric}>GL buffer {buffer.width} × {buffer.height}</Text>
      <Text style={styles.metric}>Device DPR {format(PixelRatio.get())}</Text>
      <Text style={styles.metric}>Buffer/layout {format(ratioX)} × {format(ratioY)}</Text>
      <Text style={styles.metric}>Context ID {contextId ?? 'waiting'}</Text>
      <Text style={styles.metric}>Mounts {mountCount} · Contexts {contextCount} · Draws {renderCount}</Text>
      <Text style={styles.metric}>Observation {observation}</Text>
      <View style={styles.actions}>
        <ProbeButton label="Rerender" onPress={rerender} />
        <ProbeButton label="Remount" onPress={remount} />
      </View>
      <View style={styles.outcomes}>
        <ProbeButton label="A Full" onPress={() => setObservation('A: fills layout')} />
        <ProbeButton label="B Small" onPress={() => setObservation('B: small rectangle')} />
        <ProbeButton label="C Crop" onPress={() => setObservation('C: cropped quadrants')} />
        <ProbeButton label="D Zero" onPress={() => setObservation('D: zero layout')} />
      </View>
    </View>

    <View pointerEvents="none" style={[styles.corner, styles.topLeft]} />
    <View pointerEvents="none" style={[styles.corner, styles.topRight]} />
    <View pointerEvents="none" style={[styles.corner, styles.bottomLeft]} />
    <View pointerEvents="none" style={[styles.corner, styles.bottomRight]} />
    <View pointerEvents="none" style={styles.rootOutline} />
  </View>;
}

function ProbeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignSelf: 'stretch', position: 'relative', backgroundColor: '#000000' },
  measured: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  glView: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  glOutline: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: '#00FFFF' },
  rootOutline: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: '#FF00FF' },
  overlay: { position: 'absolute', top: 24, left: 10, right: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.82)', borderWidth: 1, borderColor: '#FFFFFF' },
  title: { color: '#FFFFFF', fontSize: 13, lineHeight: 16, fontWeight: '700' },
  metric: { color: '#FFFFFF', fontSize: 10, lineHeight: 13, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 6, marginTop: 6 },
  outcomes: { flexDirection: 'row', gap: 4, marginTop: 4 },
  button: { minHeight: 44, minWidth: 62, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#202020' },
  buttonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  corner: { position: 'absolute', width: 14, height: 14, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: '#000000' },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0 },
  bottomLeft: { bottom: 0, left: 0 },
  bottomRight: { bottom: 0, right: 0 },
});
