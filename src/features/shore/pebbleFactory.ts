import type { ShorePebble, ShorePebbleOrigin } from './shoreTypes';

export function createLocalPebble(id: string, origin: ShorePebbleOrigin): ShorePebble {
  return {
    createdAt: '',
    id,
    origin,
    touched: false,
  };
}

export function touchIncomingPebble(pebble: ShorePebble): ShorePebble {
  if (pebble.origin !== 'other' || pebble.touched) {
    return pebble;
  }

  return {
    ...pebble,
    touched: true,
  };
}
