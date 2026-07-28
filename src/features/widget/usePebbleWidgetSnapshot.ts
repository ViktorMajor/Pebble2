import { useEffect } from 'react';

import { updatePebbleWidgetSnapshot } from './pebbleWidgetService';
import { useI18n } from '../../i18n';

export function usePebbleWidgetSnapshot(hasWaitingPebble: boolean): void {
  const { locale } = useI18n();
  useEffect(() => {
    updatePebbleWidgetSnapshot({ hasWaitingPebble, locale });
  }, [hasWaitingPebble, locale]);

  useEffect(() => {
    return () => {
      updatePebbleWidgetSnapshot({ hasWaitingPebble: false, locale });
    };
  }, [locale]);
}
