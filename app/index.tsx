import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { OnboardingScreen, ONBOARDING_KEY } from '../src/features/onboarding/OnboardingScreen';
import { useAuthSession } from '../src/features/auth/useAuthSession';
import { useCurrentShore } from '../src/features/pairing/useCurrentShore';

export default function IndexRoute() {
  const auth = useAuthSession();
  const shore = useCurrentShore(Boolean(auth.session));
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  useEffect(() => { void AsyncStorage.getItem(ONBOARDING_KEY).then((value) => setOnboarding(value === 'true')); }, []);
  if (onboarding === null) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>;
  if (!onboarding) return <OnboardingScreen onComplete={() => setOnboarding(true)} />;
  if (auth.isLoading || shore.isLoading) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>;
  if (!auth.session) return <Redirect href="/(auth)" />;
  return <Redirect href={shore.pairId ? '/(app)/shore' : '/(app)/pairing'} />;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EC' } });
