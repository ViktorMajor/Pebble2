import PebbleWidget from '../../../widgets/PebbleWidget';

type PebbleWidgetSnapshot = {
  hasWaitingPebble: boolean;
};

export function updatePebbleWidgetSnapshot(snapshot: PebbleWidgetSnapshot): void {
  PebbleWidget.updateSnapshot(snapshot);
}
