import type { BowlLayoutSlot } from './bowlTypes';

export const PEBBLE_LAYOUT_SCALE_MULTIPLIER = 1.15;

const slot = (x: number, y: number, z: number, rx: number, ry: number, rz: number, scale = 1, layer = 0): BowlLayoutSlot => ({
  position: [x, y, z],
  rotation: [rx, ry, rz],
  scale: scale * PEBBLE_LAYOUT_SCALE_MULTIPLIER,
  layer,
  arrivalFrom: [x * 0.35, y + 2.25, z - 1.8],
  departureControl: [x * 0.5, y + 1.15, z - 0.65],
  departureEnd: [x * 0.18, y + 2.8, z - 2.4],
});

export const BOWL_LAYOUTS: Readonly<Record<number, readonly BowlLayoutSlot[]>> = {
  0: [],
  1: [slot(-0.19, 0.13, 0.03, 0.08, -0.22, -0.04, 0.98, 2)],
  2: [
    slot(-0.76, 0.25, 0.31, 0.12, -0.38, 0.1, 0.87, 3),
    slot(0.76, 0.28, -0.29, -0.08, 0.5, -0.12, 0.89, 2),
  ],
  3: [
    slot(-0.84, 0.3, 0.36, 0.1, -0.38, 0.09, 0.8, 4),
    slot(0.84, 0.34, 0.31, -0.04, 0.5, -0.1, 0.81, 5),
    slot(0, 0.2, -0.57, 0.15, 0.08, 0.04, 0.83, 2),
  ],
  4: [
    slot(-1, 0.34, 0.12, 0.08, -0.42, 0.1, 0.74, 4),
    slot(1, 0.38, 0.07, -0.03, 0.5, -0.08, 0.75, 5),
    slot(-0.03, 0.22, -0.65, 0.14, -0.14, -0.05, 0.78, 2),
    slot(0.04, 0.25, 0.61, -0.1, 0.28, 0.08, 0.76, 6),
  ],
  5: [
    slot(-1.09, 0.36, 0.35, 0.08, -0.42, 0.1, 0.69, 5),
    slot(0, 0.23, -0.7, -0.03, 0.48, -0.08, 0.73, 2),
    slot(1.09, 0.39, 0.32, 0.14, -0.18, -0.06, 0.7, 6),
    slot(-0.69, 0.32, -0.39, -0.08, 0.28, 0.08, 0.71, 3),
    slot(0.69, 0.35, -0.42, 0.08, 0.1, -0.03, 0.72, 4),
  ],
  6: [
    slot(-1.18, 0.38, 0.43, 0.08, -0.44, 0.1, 0.66, 7),
    slot(0, 0.31, 0.52, -0.03, 0.5, -0.08, 0.69, 8),
    slot(1.18, 0.42, 0.4, 0.14, -0.2, -0.06, 0.66, 9),
    slot(-1.01, 0.35, -0.49, -0.08, 0.3, 0.08, 0.67, 3),
    slot(0.08, 0.28, -0.58, 0.08, 0.12, -0.03, 0.7, 4),
    slot(1.11, 0.4, -0.46, -0.1, -0.24, 0.06, 0.66, 5),
  ],
};

export const IDENTITY_LAYOUT_ORDER = [0, 5, 4, 3, 2, 1] as const;

export function getBowlLayout(count: number): readonly BowlLayoutSlot[] {
  return BOWL_LAYOUTS[Math.max(0, Math.min(6, Math.trunc(count)))] ?? [];
}

export function assignPebblesToLayout<T extends { visualVariant: number }>(pebbles: readonly T[]) {
  const rank = new Map<number, number>(IDENTITY_LAYOUT_ORDER.map((variant, index) => [variant, index]));
  const ordered = [...pebbles].sort((first, second) => {
    const firstRank = rank.get(first.visualVariant) ?? first.visualVariant + IDENTITY_LAYOUT_ORDER.length;
    const secondRank = rank.get(second.visualVariant) ?? second.visualVariant + IDENTITY_LAYOUT_ORDER.length;
    return firstRank - secondRank;
  });
  const layout = getBowlLayout(ordered.length);
  return ordered.map((pebble, slotIndex) => ({ pebble, slot: layout[slotIndex], slotIndex }));
}

export function estimateProjectedFootprintOverlap(layout: readonly BowlLayoutSlot[]) {
  let maximum = 0;
  for (let first = 0; first < layout.length; first += 1) {
    for (let second = first + 1; second < layout.length; second += 1) {
      const a = layout[first];
      const b = layout[second];
      const dx = Math.abs(a.position[0] - b.position[0]);
      const ay = a.position[2] * 0.72 - a.position[1] * 0.3;
      const by = b.position[2] * 0.72 - b.position[1] * 0.3;
      const dy = Math.abs(ay - by);
      const normalized = Math.hypot(dx / ((a.scale + b.scale) * 0.52), dy / ((a.scale + b.scale) * 0.34));
      maximum = Math.max(maximum, Math.max(0, 1 - normalized));
    }
  }
  return maximum;
}
