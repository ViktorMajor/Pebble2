export const HOLD_DURATION_MS = 1000;

export type ShorePebbleOrigin = 'self' | 'other';

export type ShorePebble = {
  createdAt: string;
  id: string;
  origin: ShorePebbleOrigin;
  touched: boolean;
};
