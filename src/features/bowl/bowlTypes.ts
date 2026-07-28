export const TOTAL_PAIR_PEBBLES = 6;
export const HOLD_DURATION_MS = 900;

export type HeldPebble = {
  id: string;
  visualSeed: number;
  visualVariant: number;
  transferEventId: string | null;
  incoming: boolean;
  touched: boolean;
};
export type BowlLayoutSlot = {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: number;
  layer: number;
  arrivalFrom: readonly [number, number, number];
  departureControl: readonly [number, number, number];
  departureEnd: readonly [number, number, number];
};
