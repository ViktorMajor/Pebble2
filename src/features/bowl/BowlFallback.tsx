import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../design/tokens';
import { getBowlLayout } from './bowlLayouts';
import { HOLD_DURATION_MS, type HeldPebble } from './bowlTypes';

type Props = { pebbles: HeldPebble[]; disabled: boolean; reducedMotion: boolean; onSend: (id: string) => Promise<void>; onTouch: (eventId: string) => Promise<void> };

export function BowlFallback({ pebbles, disabled, onSend, onTouch }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completed = useRef(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const layout = getBowlLayout(pebbles.length);
  const begin = (pebble: HeldPebble) => {
    if (disabled || busyId) return;
    completed.current = false; setBusyId(pebble.id);
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    timer.current = setTimeout(() => {
      completed.current = true;
      void onSend(pebble.id).finally(() => setBusyId(null));
    }, HOLD_DURATION_MS);
  };
  const end = (pebble: HeldPebble) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!completed.current && pebble.incoming && !pebble.touched && pebble.transferEventId) void onTouch(pebble.transferEventId).finally(()=>setBusyId(null));
    if (!completed.current) setBusyId(null);
  };
  return <View style={styles.scene}>
    <View style={styles.backRim} /><View style={styles.inside} />
    {pebbles.map((pebble, index) => {
      const item = layout[index]; if (!item) return null;
      return <Pressable key={pebble.id} accessibilityRole="button" onPressIn={() => begin(pebble)} onPressOut={() => end(pebble)}
        style={[styles.pebble, { left: `${50 + item.position[0] * 18}%`, top: `${55 - item.position[2] * 14 - item.position[1] * 9}%`, opacity: busyId === pebble.id ? 0.72 : 1, transform: [{ scale: item.scale }, { rotate: `${item.rotation[2]}rad` }], backgroundColor: pebble.incoming && !pebble.touched ? '#746A5D' : '#4F5452' }]} />;
    })}
    <View pointerEvents="none" style={styles.frontRim} />
  </View>;
}
const styles=StyleSheet.create({scene:{flex:1,minHeight:340,overflow:'hidden'},backRim:{position:'absolute',left:'7%',right:'7%',top:'30%',height:'45%',borderRadius:999,borderWidth:18,borderColor:colors.bowlOutside,backgroundColor:colors.bowlInside},inside:{position:'absolute',left:'13%',right:'13%',top:'36%',height:'34%',borderRadius:999,backgroundColor:'#4A5053'},frontRim:{position:'absolute',left:'7%',right:'7%',top:'30%',height:'45%',borderRadius:999,borderWidth:18,borderTopColor:'transparent',borderLeftColor:colors.bowlOutside,borderRightColor:colors.bowlOutside,borderBottomColor:'#343A3E'},pebble:{position:'absolute',marginLeft:-30,marginTop:-20,width:60,height:43,borderRadius:30,borderWidth:1,borderColor:'#777B76',shadowColor:'#000',shadowOpacity:.32,shadowRadius:12}});
