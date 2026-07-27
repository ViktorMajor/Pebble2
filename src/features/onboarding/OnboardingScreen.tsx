import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../i18n';

export const ONBOARDING_KEY = 'pebble.onboarding-complete';
export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useI18n(); const [step, setStep] = useState(0);
  const copy = [t('onboarding.first'), t('onboarding.second'), t('onboarding.third')];
  const complete = async () => { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); onComplete(); };
  return <SafeAreaView style={styles.safe}><View style={styles.content}><Text style={styles.name}>{t('app.name')}</Text><Text style={styles.copy}>{copy[step]}</Text><View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => void complete()} style={styles.skip}><Text style={styles.skipText}>{t('app.skip')}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => step === copy.length - 1 ? void complete() : setStep(step + 1)} style={styles.continue}><Text style={styles.continueText}>{t('app.continue')}</Text></Pressable></View></View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F3EC'},content:{flex:1,justifyContent:'center',padding:28,gap:30},name:{color:'#403931',fontSize:22,fontWeight:'600'},copy:{color:'#675D52',fontSize:28,lineHeight:38},actions:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},skip:{minHeight:48,justifyContent:'center',paddingHorizontal:8},skipText:{color:'#675D52',fontSize:15},continue:{minHeight:52,minWidth:120,alignItems:'center',justifyContent:'center',borderRadius:26,backgroundColor:'#4F6A5F',paddingHorizontal:18},continueText:{color:'#F7F3EC',fontWeight:'600',fontSize:16}});
