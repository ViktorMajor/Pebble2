import * as Haptics from 'expo-haptics';
import { Link, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, MIN_TOUCH_TARGET, motion, spacing, typography } from '../../design/tokens';
import { useI18n } from '../../i18n';
import { requestPebblePushDelivery } from '../notifications/pushTokenService';
import { playBowlSound } from '../sound/bowlSoundService';
import { usePebbleWidgetSnapshot } from '../widget/usePebbleWidgetSnapshot';
import { BowlScene } from './BowlScene';
import { sendHeldPebble, touchArrival } from './bowlService';
import { useBowlEnvironment } from './bowlEnvironment';
import { useHeldPebbles } from './useHeldPebbles';
import { useReducedMotion } from './useReducedMotion';
import { createTransferRequestKey } from './requestKey';

type Props = { pairId: string; connectionStatus: 'active' | 'closed'; forceFallback?: boolean; previewPebbles?: ReturnType<typeof useHeldPebbles>['pebbles'] };

export function BowlScreen({ pairId, connectionStatus, forceFallback, previewPebbles }: Props) {
  const { t } = useI18n(); const closed=connectionStatus==='closed'; const environment=useBowlEnvironment(); const reducedMotion=useReducedMotion();
  const { width } = useWindowDimensions();
  const focused=useIsFocused();const[appActive,setAppActive]=useState(AppState.currentState==='active');
  const state=useHeldPebbles(pairId,closed); const pebbles=previewPebbles??state.pebbles;
  const [error,setError]=useState<string|null>(null); const [busy,setBusy]=useState(false); const [emptyOpacity]=useState(()=>new Animated.Value(0));
  const knownArrivals=useRef<Set<string>|null>(null);
  usePebbleWidgetSnapshot(!closed&&pebbles.some((p)=>p.incoming&&!p.touched));
  useEffect(()=>{const subscription=AppState.addEventListener('change',(value)=>setAppActive(value==='active'));return()=>subscription.remove();},[]);
  useEffect(()=>{emptyOpacity.stopAnimation();emptyOpacity.setValue(0);if(pebbles.length!==0||state.isLoading)return;const animation=Animated.timing(emptyOpacity,{toValue:1,duration:reducedMotion?0:motion.caption,delay:reducedMotion?0:motion.captionDelay,useNativeDriver:true});animation.start();return()=>animation.stop();},[emptyOpacity,pebbles.length,reducedMotion,state.isLoading]);
  useEffect(()=>{const current=new Set(pebbles.filter((item)=>item.incoming&&!item.touched).map((item)=>item.id));if(knownArrivals.current){if([...current].some((id)=>!knownArrivals.current?.has(id)))void playBowlSound('arrival');}knownArrivals.current=current;},[pebbles]);
  const send=async(id:string)=>{if(closed||busy)return;setBusy(true);setError(null);try{const result=await sendHeldPebble(createTransferRequestKey(),id);if(Platform.OS!=='web')await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);await playBowlSound('send');await state.refresh();void requestPebblePushDelivery(result.transferEventId).catch(()=>undefined);}catch{setError(t('bowl.sendError'));throw new Error('transfer failed');}finally{setBusy(false);}};
  const touch=async(eventId:string)=>{if(closed||busy)return;setBusy(true);setError(null);try{await touchArrival(eventId);if(Platform.OS!=='web')await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);await playBowlSound('touch');await state.refresh();}catch{setError(t('bowl.touchError'));}finally{setBusy(false);}};
  const relationalHeroSize=Math.max(28,Math.min(34,width/12));
  return <SafeAreaView style={[styles.safe,{backgroundColor:environment.backgroundEdge}]}><StatusBar style="light"/>{!closed?<Link href="/(app)/settings" accessibilityRole="button" accessibilityLabel={t('app.settings')} style={styles.settings}>{t('app.settings')}</Link>:null}
    <View style={styles.scene} accessibilityLabel={t('bowl.accessibility')}>
      {state.isLoading && !previewPebbles ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel={t('bowl.loading')} color={colors.textSubdued} />
        </View>
      ) : focused && appActive ? (
        <BowlScene pebbles={pebbles} environment={environment} disabled={closed || busy} reducedMotion={reducedMotion} forceFallback={forceFallback} onSend={send} onTouch={touch} />
      ) : (
        <View style={styles.loading} />
      )}
      {!state.isLoading&&pebbles.length===0?<Animated.Text accessibilityLiveRegion="polite" style={[styles.empty,{fontSize:relationalHeroSize,lineHeight:Math.round(relationalHeroSize*1.26),opacity:emptyOpacity}]}>{t('bowl.empty')}</Animated.Text>:null}
      {!closed?<View pointerEvents="box-none" style={styles.a11yActions}>{pebbles.map((pebble)=><Pressable key={pebble.id} accessibilityRole="button" accessibilityLabel={pebble.incoming&&!pebble.touched?t('bowl.incoming'):t('bowl.held')} accessibilityHint={pebble.incoming&&!pebble.touched?t('bowl.touchAccessibilityHint'):t('bowl.sendAccessibilityHint')} disabled={busy} delayLongPress={900} onLongPress={()=>void send(pebble.id)} onPress={pebble.incoming&&!pebble.touched&&pebble.transferEventId?()=>void touch(pebble.transferEventId as string):undefined} style={styles.a11yAction}/>)}</View>:null}
    </View>
    {closed?<Text style={styles.closed}>{t('bowl.closed')}</Text>:<Text style={styles.hint}>{pebbles.length?t('bowl.holdHint'):''}</Text>}
    {error||state.errorText?<View style={styles.errorRow}><Text accessibilityLiveRegion="polite" style={styles.error}>{error??t('bowl.loadError')}</Text><Pressable accessibilityRole="button" onPress={()=>void state.refresh()} style={styles.retry}><Text style={styles.retryText}>{t('app.retry')}</Text></Pressable></View>:null}
  </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1},settings:{position:'absolute',right:spacing.lg,top:2,zIndex:5,...typography.functionalSecondary,color:colors.textSubdued,minWidth:MIN_TOUCH_TARGET,minHeight:MIN_TOUCH_TARGET,textAlign:'right',paddingVertical:13,textDecorationLine:'none'},scene:{flex:1,minHeight:380},loading:{flex:1,alignItems:'center',justifyContent:'center'},empty:{position:'absolute',left:'7%',right:'7%',top:'7%',...typography.relationalHero,color:colors.textPrimary,textAlign:'center'},a11yActions:{position:'absolute',width:1,height:1,opacity:.01},a11yAction:{width:1,height:1},hint:{height:48,...typography.functionalSecondary,color:colors.textSubdued,textAlign:'center',paddingHorizontal:spacing.xl},closed:{height:48,fontFamily:fonts.relationalMedium,fontSize:21,lineHeight:28,color:colors.textPrimary,textAlign:'center'},errorRow:{paddingHorizontal:spacing.lg,paddingBottom:spacing.md,alignItems:'center'},error:{...typography.functionalSecondary,color:colors.error,textAlign:'center'},retry:{minHeight:MIN_TOUCH_TARGET,justifyContent:'center'},retryText:{...typography.functionalPrimary,color:colors.textPrimary}});
