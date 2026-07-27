import { useEffect } from 'react';

import { updatePebbleWidgetSnapshot } from './pebbleWidgetService';

export function usePebbleWidgetSnapshot(hasWaitingPebble: boolean): void {
  useEffect(() => {
    updatePebbleWidgetSnapshot({ hasWaitingPebble });
  }, [hasWaitingPebble]);

  useEffect(() => {
    return () => {
      updatePebbleWidgetSnapshot({ hasWaitingPebble: false });
    };
  }, []);
}
