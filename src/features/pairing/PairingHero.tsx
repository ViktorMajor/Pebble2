import { StyleSheet, View } from 'react-native';
import { BowlScene } from '../bowl/BowlScene';
import type { BowlEnvironment } from '../bowl/bowlEnvironment';
import { PAIRING_PREVIEW_PEBBLES } from '../bowl/pairingPreview';

export function PairingHero({ height, environment, reducedMotion }: { height: number; waiting: boolean; environment: BowlEnvironment; reducedMotion: boolean }) {
  return <View style={[styles.hero, { height, backgroundColor: environment.backgroundEdge }]}><BowlScene pebbles={[]} previewPebbles={PAIRING_PREVIEW_PEBBLES} environment={environment} composition="pairing-single" disabled reducedMotion={reducedMotion} onSend={async () => {}} onTouch={async () => {}} /></View>;
}

const styles = StyleSheet.create({ hero: { width: '100%', alignSelf: 'stretch', minHeight: 240, maxHeight: 360, position: 'relative' } });
