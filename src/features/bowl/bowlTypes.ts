export const TOTAL_PAIR_PEBBLES = 8;
export const HOLD_DURATION_MS = 900;

export type HeldPebble = {
  id: string;
  visualSeed: number;
  transferEventId: string | null;
  incoming: boolean;
  touched: boolean;
};
export type BowlLayoutSlot = {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: number;
  layer: number;
};
