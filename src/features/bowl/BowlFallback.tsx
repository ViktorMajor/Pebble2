import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, motion } from '../../design/tokens';
import { assignPebblesToLayout } from './bowlLayouts';
import type { BowlEnvironment } from './bowlEnvironment';
import type { PreviewPebbleSpec } from './pairingPreview';
import { HOLD_DURATION_MS, type HeldPebble } from './bowlTypes';

type Props = { pebbles: HeldPebble[]; previewPebbles?: readonly PreviewPebbleSpec[]; environment: BowlEnvironment; composition?: 'bowl' | 'pairing-single' | 'pairing-two'; disabled: boolean; reducedMotion: boolean; onSend: (id: string) => Promise<void>; onTouch: (eventId: string) => Promise<void> };
const FALLBACK_COLORS = ['#9B9285', '#718078', '#8E6F61', '#596766', '#A18D70', '#4E5958'];
const PREVIEW_POSITIONS = [
  { left: '39%', top: '45%', rotate: '-8deg' },
  { left: '61%', top: '45%', rotate: '7deg' },
  { left: '50%', top: '32%', rotate: '2deg' },
] as const;

export function BowlFallback({ pebbles, previewPebbles = [], environment, composition = 'bowl', disabled, reducedMotion, onSend, onTouch }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completed = useRef(false);
  const [travel] = useState(() => new Animated.Value(0));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sceneWidth, setSceneWidth] = useState(360);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); travel.stopAnimation(); }, [travel]);
  const assignments = useMemo(() => assignPebblesToLayout(pebbles), [pebbles]);
  const bowlWidth = Math.min(sceneWidth * 0.74, sceneWidth - 48);
  const bowlHeight = bowlWidth * 0.52;
  const begin = (pebble: HeldPebble) => {
    if (disabled || busyId) return;
    completed.current = false; setBusyId(pebble.id); travel.setValue(0);
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    timer.current = setTimeout(() => {
      timer.current = null; completed.current = true;
      if (reducedMotion) {
        void onSend(pebble.id).finally(() => setBusyId(null));
        return;
      }
      Animated.timing(travel, { toValue: 1, duration: motion.travel, useNativeDriver: true }).start(({ finished }) => {
        if (finished) void onSend(pebble.id).finally(() => { travel.setValue(0); setBusyId(null); });
      });
    }, HOLD_DURATION_MS);
  };
  const end = (pebble: HeldPebble) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!completed.current) {
      Animated.timing(travel, { toValue: 0, duration: reducedMotion ? 0 : motion.pickup, useNativeDriver: true }).start();
      if (pebble.incoming && !pebble.touched && pebble.transferEventId) void onTouch(pebble.transferEventId).finally(() => setBusyId(null));
      else setBusyId(null);
    }
  };
  const selectedTransform = useMemo(() => ({
    transform: [
      { translateY: travel.interpolate({ inputRange: [0, 1], outputRange: [-15, -190] }) },
      { translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }) },
      { rotate: travel.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '7deg'] }) },
    ],
    opacity: travel.interpolate({ inputRange: [0, 0.78, 1], outputRange: [1, 1, 0] }),
  }), [travel]);

  return <View style={[styles.scene, { backgroundColor: environment.backgroundEdge }]} onLayout={(event) => setSceneWidth(event.nativeEvent.layout.width)}>
    <View pointerEvents="none" style={[styles.haze, { backgroundColor: environment.backgroundCenter }]} />
    <View style={[styles.bowl, composition !== 'bowl' && styles.pairingBowl, { width: bowlWidth, height: bowlHeight, marginLeft: -bowlWidth / 2, marginTop: -bowlHeight * 0.42 }]}>
      <View style={styles.backRim} />
      <View style={styles.inside} />
      {assignments.map(({ pebble, slot: item }) => {
        const isBusy = busyId === pebble.id;
        return <Animated.View key={pebble.id} style={[styles.pebbleWrap, {
          left: `${50 + item.position[0] * 25}%`,
          top: `${47 - item.position[2] * 24 - (item.position[1] - 0.46) * 20}%`,
          transform: [{ scale: item.scale }, { rotate: `${item.rotation[2]}rad` }, ...(isBusy ? selectedTransform.transform : [])],
          opacity: isBusy ? selectedTransform.opacity : 1,
        }]}>
          <View style={styles.contactPenumbra} />
          <View style={styles.contactCore} />
          <Pressable accessibilityRole="button" onPressIn={() => begin(pebble)} onPressOut={() => end(pebble)} style={[styles.pebble, {
            backgroundColor: pebble.incoming && !pebble.touched ? '#B9AFA3' : FALLBACK_COLORS[pebble.visualVariant] ?? FALLBACK_COLORS[0],
          }]} />
        </Animated.View>;
      })}
      {composition !== 'bowl' ? <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>{previewPebbles.slice(0, 3).map((pebble, index) => {
        const placement = PREVIEW_POSITIONS[index];
        if (!placement) return null;
        return <View key={pebble.previewKey} style={[styles.previewPebbleWrap, { left: placement.left, top: placement.top, transform: [{ rotate: placement.rotate }] }]}>
          <View style={styles.previewPenumbra} />
          <View style={styles.previewCore} />
          <View style={[styles.previewPebble, { backgroundColor: FALLBACK_COLORS[pebble.visualVariant] ?? FALLBACK_COLORS[0] }]} />
        </View>;
      })}</View> : null}
      <View pointerEvents="none" style={styles.frontRim} />
    </View>
    {composition === 'pairing-two' ? <View pointerEvents="none" style={[styles.secondBowl, { width: bowlWidth * 0.56, height: bowlHeight * 0.56 }]}><View style={styles.backRim} /><View style={styles.inside} /><View style={styles.frontRim} /></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  scene: { width: '100%', alignSelf: 'stretch', flex: 1, overflow: 'hidden', backgroundColor: colors.atmosphere },
  haze: { position: 'absolute', left: '-12%', right: '-12%', top: '16%', height: '64%', borderRadius: 999, backgroundColor: colors.atmosphereCentre, opacity: 0.9 },
  bowl: { position: 'absolute', left: '50%', top: '58%' },
  pairingBowl: { transform: [{ scale: 0.84 }] },
  secondBowl: { position: 'absolute', right: '6%', top: '54%', opacity: 0.62 },
  backRim: { position: 'absolute', inset: 0, borderRadius: 999, borderWidth: 17, borderColor: '#C5C1B5', backgroundColor: '#96988F' },
  inside: { position: 'absolute', left: '9%', right: '9%', top: '15%', bottom: '22%', borderRadius: 999, backgroundColor: '#96988F' },
  frontRim: { position: 'absolute', inset: 0, borderRadius: 999, borderWidth: 17, borderTopColor: 'transparent', borderLeftColor: '#8F928B', borderRightColor: '#8F928B', borderBottomColor: '#858A83' },
  pebbleWrap: { position: 'absolute', marginLeft: -30, marginTop: -21, width: 60, height: 46 },
  contactPenumbra: { position: 'absolute', left: 1, right: 1, bottom: -7, height: 17, borderRadius: 20, backgroundColor: '#817D74', opacity: 0.07 },
  contactCore: { position: 'absolute', left: 11, right: 11, bottom: -3, height: 8, borderRadius: 12, backgroundColor: '#77746C', opacity: 0.17 },
  pebble: { width: 60, height: 43, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, borderColor: '#AEA99F', shadowColor: colors.contact, shadowOpacity: 0.16, shadowRadius: 6, elevation: 3 },
  previewPebbleWrap: { position: 'absolute', marginLeft: -22, marginTop: -15, width: 44, height: 32 },
  previewPenumbra: { position: 'absolute', left: 2, right: 2, bottom: -5, height: 11, borderRadius: 18, backgroundColor: '#817D74', opacity: 0.06 },
  previewCore: { position: 'absolute', left: 10, right: 10, bottom: -2, height: 5, borderRadius: 10, backgroundColor: '#77746C', opacity: 0.16 },
  previewPebble: { width: 44, height: 30, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: '#AEA99F' },
});
