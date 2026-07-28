import PebbleWidget from '../../../widgets/PebbleWidget';

type PebbleWidgetSnapshot = {
  hasWaitingPebble: boolean;
  locale: 'en' | 'hu';
};

export function updatePebbleWidgetSnapshot(snapshot: PebbleWidgetSnapshot): void {
  PebbleWidget.updateSnapshot(snapshot);
}
