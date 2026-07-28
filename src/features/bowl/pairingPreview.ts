import { PEBBLE_FIXED_SCALE } from './bowlLayouts';

export type PreviewPebbleSpec = {
  previewKey: string;
  visualSeed: number;
  visualVariant: number;
};

export type PreviewPebblePlacement = {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: number;
  layer: number;
};

// These visual-only stones explain Pebble before a connection is complete.
// They are deliberately not ownership records and never enter domain state.
export const PAIRING_PREVIEW_PEBBLES: readonly PreviewPebbleSpec[] = [
  { previewKey: 'pairing-preview-limestone', visualSeed: 193_771, visualVariant: 4 },
  { previewKey: 'pairing-preview-clay', visualSeed: 417_203, visualVariant: 2 },
  { previewKey: 'pairing-preview-sage', visualSeed: 628_451, visualVariant: 1 },
];

export const PAIRING_PREVIEW_LAYOUT: readonly PreviewPebblePlacement[] = [
  { position: [-0.78, 0.2, 0.31], rotation: [0.09, -0.34, 0.08], scale: PEBBLE_FIXED_SCALE, layer: 3 },
  { position: [0.78, 0.22, 0.25], rotation: [-0.04, 0.46, -0.09], scale: PEBBLE_FIXED_SCALE, layer: 4 },
  { position: [-0.02, 0.14, -0.57], rotation: [0.13, 0.08, 0.03], scale: PEBBLE_FIXED_SCALE, layer: 2 },
];
