import type { BowlLayoutSlot } from './bowlTypes';

const slot = (x: number, y: number, z: number, rx: number, ry: number, rz: number, scale = 1, layer = 0): BowlLayoutSlot => ({
  position: [x, y, z],
  rotation: [rx, ry, rz],
  scale,
  layer,
  arrivalFrom: [x * 0.35, y + 2.25, z - 1.8],
  departureControl: [x * 0.5, y + 1.15, z - 0.65],
  departureEnd: [x * 0.18, y + 2.8, z - 2.4],
});

export const BOWL_LAYOUTS: Readonly<Record<number, readonly BowlLayoutSlot[]>> = {
  0: [],
  1: [slot(0.02, 0.57, 0.02, 0.08, -0.22, -0.04, 1.04, 2)],
  2: [
    slot(-0.55, 0.52, 0.17, 0.12, -0.35, 0.08, 0.95, 2),
    slot(0.56, 0.55, -0.02, -0.08, 0.5, -0.12, 0.99, 3),
  ],
  3: [
    slot(-0.68, 0.5, 0.38, 0.1, -0.35, 0.08, 0.9, 3),
    slot(0.67, 0.53, 0.31, -0.04, 0.52, -0.1, 0.93, 4),
    slot(-0.04, 0.64, -0.5, 0.16, 0.1, 0.04, 0.96, 2),
  ],
  4: [
    slot(-0.65, 0.49, 0.38, 0.08, -0.4, 0.1, 0.84, 4),
    slot(0.64, 0.51, 0.34, -0.03, 0.48, -0.08, 0.87, 5),
    slot(-0.48, 0.59, -0.39, 0.14, -0.14, -0.05, 0.89, 2),
    slot(0.48, 0.61, -0.42, -0.1, 0.28, 0.08, 0.9, 3),
  ],
  5: [
    slot(-0.72, 0.47, 0.4, 0.08, -0.42, 0.1, 0.79, 5),
    slot(0.7, 0.49, 0.38, -0.03, 0.5, -0.08, 0.81, 6),
    slot(-0.64, 0.57, -0.34, 0.14, -0.18, -0.06, 0.82, 2),
    slot(0.62, 0.59, -0.37, -0.08, 0.28, 0.08, 0.84, 3),
    slot(0, 0.65, 0.01, 0.08, 0.1, -0.03, 0.9, 4),
  ],
  6: [
    slot(-0.75, 0.46, 0.42, 0.08, -0.42, 0.1, 0.76, 6),
    slot(0.73, 0.48, 0.4, -0.03, 0.5, -0.08, 0.78, 7),
    slot(-0.68, 0.56, -0.37, 0.14, -0.18, -0.06, 0.78, 2),
    slot(0.66, 0.58, -0.39, -0.08, 0.28, 0.08, 0.8, 3),
    slot(-0.25, 0.64, 0.03, 0.08, 0.1, -0.03, 0.84, 4),
    slot(0.32, 0.67, -0.08, -0.1, -0.22, 0.06, 0.82, 5),
  ],
};

export function getBowlLayout(count: number): readonly BowlLayoutSlot[] {
  return BOWL_LAYOUTS[Math.max(0, Math.min(6, Math.trunc(count)))] ?? [];
}
