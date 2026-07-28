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
  { position: [-0.51, 0.17, 0.23], rotation: [0.09, -0.34, 0.08], scale: 0.71, layer: 3 },
  { position: [0.5, 0.19, 0.18], rotation: [-0.04, 0.46, -0.09], scale: 0.74, layer: 4 },
  { position: [-0.02, 0.12, -0.42], rotation: [0.13, 0.08, 0.03], scale: 0.72, layer: 2 },
];
