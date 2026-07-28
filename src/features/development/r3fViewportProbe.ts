import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { Vector2, Vector4, type WebGLRenderer } from 'three';

export type RepairMode = 'default' | 'reset-scissor' | 'resync-logical' | 'resync-buffer' | 'native-dpr';
export type ProbeObservation = 'Full viewport' | 'Small rectangle' | 'Cropped' | 'Offset' | 'Blank' | 'Crashed/recovered';
export type ProbeSize = { width: number; height: number };

export const CAPPED_RENDERER_DPR = 1.35;
export const PACKAGE_VERSIONS = {
  fiber: '9.6.1',
  expoGl: '57.0.2',
  react: '19.2.3',
  reactNative: '0.86.0',
  three: '0.182.0',
} as const;

export const REPAIR_MODE_LABELS: Record<RepairMode, string> = {
  default: 'Default',
  'reset-scissor': 'Reset scissor',
  'resync-logical': 'Resync logical size',
  'resync-buffer': 'Resync drawing buffer',
  'native-dpr': 'Source-informed candidate',
};

export const REPAIR_MODE_OPERATIONS: Record<RepairMode, readonly string[]> = {
  default: ['Initial entry: preserve R3F native Canvas configuration', 'Return entry: restore captured renderer baseline'],
  'reset-scissor': ['setScissorTest(false)', 'setScissor(0, 0, renderer logical width, renderer logical height)', 'setViewport(0, 0, renderer logical width, renderer logical height)'],
  'resync-logical': [`setPixelRatio(${CAPPED_RENDERER_DPR})`, 'setSize(measured logical width, measured logical height, false)', 'disable scissor; reset logical scissor and viewport'],
  'resync-buffer': [`expected buffer = floor(layout × ${CAPPED_RENDERER_DPR})`, 'setPixelRatio(capped DPR)', 'setSize(expected buffer / capped DPR, false)', 'disable scissor; reset viewport using derived logical dimensions'],
  'native-dpr': ['derive native DPR from Expo GL drawing buffer / measured layout', 'setPixelRatio(native surface DPR)', 'setSize(measured logical width, measured logical height, false)', 'disable scissor; reset logical scissor and viewport'],
};

export type RendererBaseline = {
  pixelRatio: number;
  size: ProbeSize;
  viewport: [number, number, number, number];
  scissor: [number, number, number, number];
  scissorTest: boolean;
};

export function isValidSize(size: ProbeSize) {
  return Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0;
}

export function expectedDrawingBuffer(size: ProbeSize, dpr = CAPPED_RENDERER_DPR): ProbeSize {
  return { width: Math.floor(size.width * dpr), height: Math.floor(size.height * dpr) };
}

export function nativeSurfaceDpr(size: ProbeSize, buffer: ProbeSize) {
  if (!isValidSize(size) || !isValidSize(buffer)) return 1;
  return ((buffer.width / size.width) + (buffer.height / size.height)) / 2;
}

export function pointerToNdc(x: number, y: number, size: ProbeSize) {
  if (!isValidSize(size)) return { x: 0, y: 0 };
  return { x: (x / size.width) * 2 - 1, y: -(y / size.height) * 2 + 1 };
}

export function quadrantFromNdc(x: number, y: number) {
  return `${y >= 0 ? 'top' : 'bottom'}-${x < 0 ? 'left' : 'right'}`;
}

export function captureRendererBaseline(renderer: WebGLRenderer): RendererBaseline {
  const size = renderer.getSize(new Vector2());
  const viewport = renderer.getViewport(new Vector4());
  const scissor = renderer.getScissor(new Vector4());
  return {
    pixelRatio: renderer.getPixelRatio(),
    size: { width: size.x, height: size.y },
    viewport: [viewport.x, viewport.y, viewport.z, viewport.w],
    scissor: [scissor.x, scissor.y, scissor.z, scissor.w],
    scissorTest: renderer.getScissorTest(),
  };
}

function resetBounds(renderer: WebGLRenderer, width: number, height: number) {
  renderer.setScissorTest(false);
  renderer.setScissor(0, 0, width, height);
  renderer.setViewport(0, 0, width, height);
}

export function applyRepairMode(options: {
  renderer: WebGLRenderer;
  context: ExpoWebGLRenderingContext;
  layout: ProbeSize;
  baseline: RendererBaseline;
  mode: RepairMode;
  initialDefault: boolean;
}) {
  const { renderer, context, layout, baseline, mode, initialDefault } = options;
  if (!isValidSize(layout)) return ['Ignored: measured Canvas size is not valid'];

  if (mode === 'default') {
    if (initialDefault) return ['No corrective renderer calls'];
    renderer.setPixelRatio(baseline.pixelRatio);
    renderer.setSize(baseline.size.width, baseline.size.height, false);
    renderer.setScissorTest(baseline.scissorTest);
    renderer.setScissor(...baseline.scissor);
    renderer.setViewport(...baseline.viewport);
    return ['Restored captured pixel ratio, logical size, scissor, viewport, and scissor-test state'];
  }

  if (mode === 'reset-scissor') {
    const current = renderer.getSize(new Vector2());
    resetBounds(renderer, current.x, current.y);
    return [`Scissor disabled; scissor and viewport reset to ${current.x.toFixed(1)} × ${current.y.toFixed(1)} logical units`];
  }

  if (mode === 'resync-logical') {
    renderer.setPixelRatio(CAPPED_RENDERER_DPR);
    renderer.setSize(layout.width, layout.height, false);
    resetBounds(renderer, layout.width, layout.height);
    return [`Pixel ratio ${CAPPED_RENDERER_DPR}; renderer size and bounds set to ${layout.width.toFixed(1)} × ${layout.height.toFixed(1)} logical units`];
  }

  if (mode === 'resync-buffer') {
    const expected = expectedDrawingBuffer(layout);
    const logicalWidth = expected.width / CAPPED_RENDERER_DPR;
    const logicalHeight = expected.height / CAPPED_RENDERER_DPR;
    renderer.setPixelRatio(CAPPED_RENDERER_DPR);
    renderer.setSize(logicalWidth, logicalHeight, false);
    resetBounds(renderer, logicalWidth, logicalHeight);
    return [`Expected buffer ${expected.width} × ${expected.height}; derived Three.js logical size ${logicalWidth.toFixed(2)} × ${logicalHeight.toFixed(2)}`];
  }

  const surfaceDpr = nativeSurfaceDpr(layout, { width: context.drawingBufferWidth, height: context.drawingBufferHeight });
  renderer.setPixelRatio(surfaceDpr);
  renderer.setSize(layout.width, layout.height, false);
  resetBounds(renderer, layout.width, layout.height);
  return [`Native surface DPR ${surfaceDpr.toFixed(3)} derived from Expo GL buffer; renderer size and bounds resynchronized in logical units`];
}

export type DiagnosticReportInput = {
  mode: RepairMode;
  observation: ProbeObservation;
  measurements: Record<string, string | number | boolean | null>;
  operations: readonly string[];
};

export function formatDiagnosticReport(input: DiagnosticReportInput) {
  const values = Object.entries(input.measurements).map(([key, value]) => `${key}: ${value ?? 'unavailable'}`);
  return [
    'Pebble R3F Viewport Probe',
    `Mode: ${REPAIR_MODE_LABELS[input.mode]}`,
    `Observation: ${input.observation}`,
    `Operations: ${input.operations.join('; ')}`,
    `Packages: R3F ${PACKAGE_VERSIONS.fiber}; expo-gl ${PACKAGE_VERSIONS.expoGl}; React ${PACKAGE_VERSIONS.react}; React Native ${PACKAGE_VERSIONS.reactNative}; Three ${PACKAGE_VERSIONS.three}`,
    ...values,
  ].join('\n');
}
