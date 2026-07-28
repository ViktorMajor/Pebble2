/* eslint-disable react/no-unknown-property */
import * as Clipboard from 'expo-clipboard';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber/native';
import { memo, useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { Vector2, Vector4, type WebGLRenderer } from 'three';
import {
  applyRepairMode,
  captureRendererBaseline,
  formatDiagnosticReport,
  PACKAGE_VERSIONS,
  quadrantFromNdc,
  REPAIR_MODE_LABELS,
  REPAIR_MODE_OPERATIONS,
  type ProbeObservation,
  type ProbeSize,
  type RendererBaseline,
  type RepairMode,
} from './r3fViewportProbe';

type RendererMetrics = Record<string, string | number | boolean | null>;
type PointerResult = { expected: string; selected: string; x: number; y: number; ndcX: number; ndcY: number } | null;
const EMPTY_SIZE: ProbeSize = { width: 0, height: 0 };
const MODES = Object.keys(REPAIR_MODE_LABELS) as RepairMode[];
const OBSERVATIONS: ProbeObservation[] = ['Full viewport', 'Small rectangle', 'Cropped', 'Offset', 'Blank', 'Crashed/recovered'];
const format = (value: number) => Number.isFinite(value) ? value.toFixed(1) : 'invalid';

function rendererMeasurements(renderer: WebGLRenderer, size: ProbeSize, viewport: { width: number; height: number; aspect: number }, cameraAspect: number, frames: number) {
  const rendererSize = renderer.getSize(new Vector2());
  const drawingBuffer = renderer.getDrawingBufferSize(new Vector2());
  const rendererViewport = renderer.getViewport(new Vector4());
  const scissor = renderer.getScissor(new Vector4());
  const context = renderer.getContext() as ExpoWebGLRenderingContext;
  const domElement = renderer.domElement as unknown as { width?: number; height?: number; clientWidth?: number; clientHeight?: number };
  return {
    'R3F size': `${format(size.width)} × ${format(size.height)}`,
    'R3F viewport': `${format(viewport.width)} × ${format(viewport.height)}`,
    'R3F viewport aspect': format(viewport.aspect),
    'Camera aspect': format(cameraAspect),
    'Renderer DPR': renderer.getPixelRatio().toFixed(3),
    'Renderer size': `${format(rendererSize.x)} × ${format(rendererSize.y)}`,
    'Renderer buffer': `${format(drawingBuffer.x)} × ${format(drawingBuffer.y)}`,
    'Renderer viewport': `${format(rendererViewport.x)},${format(rendererViewport.y)} ${format(rendererViewport.z)} × ${format(rendererViewport.w)}`,
    'Renderer scissor': `${format(scissor.x)},${format(scissor.y)} ${format(scissor.z)} × ${format(scissor.w)}`,
    'Scissor test': renderer.getScissorTest(),
    'domElement': `${domElement.width ?? 'n/a'} × ${domElement.height ?? 'n/a'} (client ${domElement.clientWidth ?? 'n/a'} × ${domElement.clientHeight ?? 'n/a'})`,
    'Expo GL buffer': `${context.drawingBufferWidth} × ${context.drawingBufferHeight}`,
    'Context ID': context.contextId ?? null,
    'Buffer/layout ratio': size.width > 0 && size.height > 0 ? `${(context.drawingBufferWidth / size.width).toFixed(3)} × ${(context.drawingBufferHeight / size.height).toFixed(3)}` : 'n/a',
    'Frame count': frames,
  } satisfies RendererMetrics;
}

function RendererController({ mode, layout, baseline, rerenderNonce, onConfigured, onMetrics, onLifecycle }: {
  mode: RepairMode;
  layout: ProbeSize;
  baseline: RendererBaseline;
  rerenderNonce: number;
  onConfigured: (operations: readonly string[]) => void;
  onMetrics: (metrics: RendererMetrics) => void;
  onLifecycle: (kind: 'mount' | 'dispose') => void;
}) {
  const { gl, size, viewport, camera, invalidate } = useThree();
  const frameCount = useRef(0);
  const sampleNextFrame = useRef(true);
  const initialDefault = useRef(true);

  useEffect(() => {
    onLifecycle('mount');
    return () => onLifecycle('dispose');
  }, [onLifecycle]);

  useEffect(() => {
    const context = gl.getContext() as ExpoWebGLRenderingContext;
    const operations = applyRepairMode({ renderer: gl, context, layout, baseline, mode, initialDefault: mode === 'default' && initialDefault.current });
    initialDefault.current = false;
    onConfigured(operations);
    sampleNextFrame.current = true;
    invalidate();
  }, [baseline, gl, invalidate, layout, mode, onConfigured]);

  useEffect(() => {
    sampleNextFrame.current = true;
    invalidate();
  }, [invalidate, rerenderNonce]);

  useFrame(() => {
    frameCount.current += 1;
    if (!sampleNextFrame.current) return;
    sampleNextFrame.current = false;
    const cameraAspect = 'aspect' in camera && typeof camera.aspect === 'number' ? camera.aspect : size.width / size.height;
    onMetrics(rendererMeasurements(gl, size, viewport, cameraAspect, frameCount.current));
  });
  return null;
}

function TechnicalPattern({ onPointer }: { onPointer: (result: NonNullable<PointerResult>, point: { x: number; y: number }) => void }) {
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const handlePointer = (expected: string) => (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const native = event.nativeEvent as unknown as { locationX?: number; locationY?: number; offsetX?: number; offsetY?: number };
    const x = native.locationX ?? native.offsetX ?? 0;
    const y = native.locationY ?? native.offsetY ?? 0;
    const selected = quadrantFromNdc(event.pointer.x, event.pointer.y);
    setMarker({ x: event.point.x, y: event.point.y });
    onPointer({ expected, selected, x, y, ndcX: event.pointer.x, ndcY: event.pointer.y }, event.point);
  };
  const quadrants = [
    { name: 'top-left', position: [-0.5, 0.5, 0] as const, color: '#FF0000' },
    { name: 'top-right', position: [0.5, 0.5, 0] as const, color: '#00FF00' },
    { name: 'bottom-left', position: [-0.5, -0.5, 0] as const, color: '#0000FF' },
    { name: 'bottom-right', position: [0.5, -0.5, 0] as const, color: '#FFFF00' },
  ];
  return <>
    {quadrants.map((quadrant) => <mesh key={quadrant.name} name={quadrant.name} position={quadrant.position} onPointerDown={handlePointer(quadrant.name)}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={quadrant.color} depthTest={false} depthWrite={false} />
    </mesh>)}
    <mesh position={[0, 0.985, 0.04]}><planeGeometry args={[2, 0.03]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh>
    <mesh position={[0, -0.985, 0.04]}><planeGeometry args={[2, 0.03]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh>
    <mesh position={[-0.985, 0, 0.04]}><planeGeometry args={[0.03, 2]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh>
    <mesh position={[0.985, 0, 0.04]}><planeGeometry args={[0.03, 2]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh>
    <mesh position={[0, 0, 0.04]}><planeGeometry args={[0.018, 2]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh>
    <mesh position={[0, 0, 0.04]}><planeGeometry args={[2, 0.018]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh>
    {marker ? <mesh position={[marker.x, marker.y, 0.08]}><circleGeometry args={[0.075, 24]} /><meshBasicMaterial color="#FFFFFF" depthTest={false} /></mesh> : null}
  </>;
}

function ProbeButton({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.button, selected && styles.selectedButton]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

const ProbeCanvas = memo(function ProbeCanvas({ canvasRef, layout, mode, nonce, baseline, onCanvasLayout, onCreated, onConfigured, onMetrics, onLifecycle, onPointer }: {
  canvasRef: RefObject<View | null>;
  layout: ProbeSize;
  mode: RepairMode;
  nonce: number;
  baseline: RendererBaseline | null;
  onCanvasLayout: (event: LayoutChangeEvent) => void;
  onCreated: (state: { gl: WebGLRenderer }) => void;
  onConfigured: (operations: readonly string[]) => void;
  onMetrics: (metrics: RendererMetrics) => void;
  onLifecycle: (kind: 'mount' | 'dispose') => void;
  onPointer: (result: NonNullable<PointerResult>) => void;
}) {
  return <Canvas
    ref={canvasRef}
    onLayout={onCanvasLayout}
    style={{ ...styles.canvas, width: layout.width, height: layout.height }}
    frameloop="demand"
    orthographic
    camera={{ position: [0, 0, 2], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 }}
    onCreated={onCreated}
  >
    <TechnicalPattern onPointer={onPointer} />
    {baseline ? <RendererController
      mode={mode}
      layout={layout}
      baseline={baseline}
      rerenderNonce={nonce}
      onConfigured={onConfigured}
      onMetrics={onMetrics}
      onLifecycle={onLifecycle}
    /> : null}
  </Canvas>;
});

export function R3FViewportProbeScreen() {
  const window = useWindowDimensions();
  const canvasRef = useRef<View | null>(null);
  const countedRendererRef = useRef<WebGLRenderer | null>(null);
  const countedContextRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const [root, setRoot] = useState<ProbeSize>(EMPTY_SIZE);
  const [parent, setParent] = useState<ProbeSize>(EMPTY_SIZE);
  const [canvasLayout, setCanvasLayout] = useState<ProbeSize>(EMPTY_SIZE);
  const [canvasLayoutSource, setCanvasLayoutSource] = useState('waiting');
  const [baseline, setBaseline] = useState<RendererBaseline | null>(null);
  const [mode, setMode] = useState<RepairMode>('default');
  const [nonce, setNonce] = useState(0);
  const [metrics, setMetrics] = useState<RendererMetrics>({});
  const [operations, setOperations] = useState<readonly string[]>(REPAIR_MODE_OPERATIONS.default);
  const [lastConfiguration, setLastConfiguration] = useState('waiting');
  const [mounts, setMounts] = useState(0);
  const [contexts, setContexts] = useState(0);
  const [renderers, setRenderers] = useState(0);
  const [disposals, setDisposals] = useState(0);
  const [pointer, setPointer] = useState<PointerResult>(null);
  const [report, setReport] = useState('');
  const [expanded, setExpanded] = useState(true);

  const measureCanvas = useCallback(() => {
    requestAnimationFrame(() => canvasRef.current?.measure((_x, _y, width, height) => {
      if (width > 0 && height > 0) {
        setCanvasLayout({ width, height });
        setCanvasLayoutSource('native ref.measure');
      }
    }));
  }, []);
  const onRootLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setRoot({ width, height });
  }, []);
  const onParentLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setParent({ width, height });
    measureCanvas();
  }, [measureCanvas]);
  const onCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasLayout({ width, height });
    setCanvasLayoutSource('Canvas onLayout prop');
  }, []);
  const onCreated = useCallback((state: { gl: WebGLRenderer }) => {
    const context = state.gl.getContext() as ExpoWebGLRenderingContext;
    setBaseline((current) => current ?? captureRendererBaseline(state.gl));
    if (countedContextRef.current !== context) {
      countedContextRef.current = context;
      setContexts((value) => value + 1);
    }
    if (countedRendererRef.current !== state.gl) {
      countedRendererRef.current = state.gl;
      setRenderers((value) => value + 1);
    }
    measureCanvas();
  }, [measureCanvas]);
  const onLifecycle = useCallback((kind: 'mount' | 'dispose') => {
    if (kind === 'mount') setMounts((value) => value + 1);
    else setDisposals((value) => value + 1);
  }, []);
  const onConfigured = useCallback((next: readonly string[]) => {
    setOperations(next);
    setLastConfiguration(new Date().toISOString());
  }, []);
  const onMetrics = useCallback((next: RendererMetrics) => setMetrics(next), []);
  const onPointer = useCallback((result: NonNullable<PointerResult>) => setPointer(result), []);
  const setRepairMode = (next: RepairMode) => {
    setMode(next);
  };
  const createReport = (observation: ProbeObservation) => {
    const next = formatDiagnosticReport({
      mode,
      observation,
      operations,
      measurements: {
        Window: `${format(window.width)} × ${format(window.height)}`,
        Root: `${format(root.width)} × ${format(root.height)}`,
        'Canvas parent': `${format(parent.width)} × ${format(parent.height)}`,
        'Canvas component': `${format(canvasLayout.width)} × ${format(canvasLayout.height)} (${canvasLayoutSource})`,
        'Device DPR': PixelRatio.get(),
        Mounts: mounts,
        Contexts: contexts,
        Renderers: renderers,
        Disposals: disposals,
        'Last configuration': lastConfiguration,
        ...metrics,
        'Pointer expected': pointer?.expected ?? null,
        'Pointer selected': pointer?.selected ?? null,
        'Pointer received': pointer ? `${format(pointer.x)}, ${format(pointer.y)}` : null,
        'Pointer NDC': pointer ? `${pointer.ndcX.toFixed(3)}, ${pointer.ndcY.toFixed(3)}` : null,
      },
    });
    setReport(next);
  };

  const ready = parent.width > 0 && parent.height > 0;
  return <View onLayout={onRootLayout} style={styles.root}>
    <View onLayout={onParentLayout} style={styles.canvasParent}>
      {ready ? <ProbeCanvas
        canvasRef={canvasRef}
        layout={parent}
        mode={mode}
        nonce={nonce}
        baseline={baseline}
        onCanvasLayout={onCanvasLayout}
        onCreated={onCreated}
        onConfigured={onConfigured}
        onMetrics={onMetrics}
        onLifecycle={onLifecycle}
        onPointer={onPointer}
      /> : null}
      <View pointerEvents="none" style={styles.canvasOutline} />
    </View>

    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.overlayHeader}>
        <Text style={styles.title}>R3F Viewport Probe</Text>
        <ProbeButton label={expanded ? 'Hide data' : 'Show data'} onPress={() => setExpanded((value) => !value)} />
      </View>
      {expanded ? <View pointerEvents="box-none">
        <Text style={styles.metric}>Window {format(window.width)}×{format(window.height)} · Root {format(root.width)}×{format(root.height)} · DPR {format(PixelRatio.get())}</Text>
        <Text style={styles.metric}>Parent {format(parent.width)}×{format(parent.height)} · Canvas {format(canvasLayout.width)}×{format(canvasLayout.height)} ({canvasLayoutSource})</Text>
        {Object.entries(metrics).map(([key, value]) => <Text key={key} style={styles.metric}>{key}: {String(value)}</Text>)}
        <Text style={styles.metric}>Mounts {mounts} · Contexts {contexts} · Renderers {renderers} · Disposals {disposals}</Text>
        <Text style={styles.metric}>Mode {REPAIR_MODE_LABELS[mode]} · configured {lastConfiguration}</Text>
        <Text style={styles.metric}>Operations: {operations.join('; ')}</Text>
        <Text style={styles.metric}>Pointer: {pointer ? `${pointer.expected} → ${pointer.selected}; received ${format(pointer.x)},${format(pointer.y)}; NDC ${pointer.ndcX.toFixed(3)},${pointer.ndcY.toFixed(3)}` : 'touch each quadrant'}</Text>
      </View> : null}
      <View style={styles.buttonRow}>{MODES.map((item) => <ProbeButton key={item} label={REPAIR_MODE_LABELS[item]} selected={mode === item} onPress={() => setRepairMode(item)} />)}</View>
      <View style={styles.buttonRow}>
        <ProbeButton label="Rerender" onPress={() => setNonce((value) => value + 1)} />
        <ProbeButton label="Reset to default" onPress={() => setRepairMode('default')} />
        {report ? <ProbeButton label="Copy report" onPress={() => void Clipboard.setStringAsync(report)} /> : null}
      </View>
      <View style={styles.buttonRow}>{OBSERVATIONS.map((item) => <ProbeButton key={item} label={item} onPress={() => createReport(item)} />)}</View>
      {report ? <Text selectable numberOfLines={3} style={styles.report}>Report ready: {report}</Text> : null}
      <Text style={styles.version}>R3F {PACKAGE_VERSIONS.fiber} · expo-gl {PACKAGE_VERSIONS.expoGl} · Three {PACKAGE_VERSIONS.three}</Text>
    </View>
    <View pointerEvents="none" style={styles.rootOutline} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignSelf: 'stretch', position: 'relative', backgroundColor: '#000000' },
  canvasParent: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  canvas: { position: 'absolute', top: 0, left: 0 },
  canvasOutline: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: '#00FFFF' },
  rootOutline: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 2, borderColor: '#FF00FF' },
  overlay: { position: 'absolute', top: 22, left: 6, right: 6, padding: 5, backgroundColor: 'rgba(0,0,0,0.78)', borderWidth: 1, borderColor: '#FFFFFF' },
  overlayHeader: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  metric: { color: '#FFFFFF', fontSize: 8, lineHeight: 10, fontVariant: ['tabular-nums'] },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 3 },
  button: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 6, borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#202020' },
  selectedButton: { backgroundColor: '#555555', borderWidth: 2 },
  buttonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '600' },
  report: { color: '#FFFFFF', fontSize: 7, lineHeight: 9, marginTop: 3 },
  version: { color: '#FFFFFF', fontSize: 7, marginTop: 3 },
});
