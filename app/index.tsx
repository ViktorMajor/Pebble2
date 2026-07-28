import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { OnboardingScreen, ONBOARDING_KEY } from '../src/features/onboarding/OnboardingScreen';
import { useAppSession } from '../src/features/app/AppSessionProvider';
import { AppLoadingScreen, AppRetryScreen } from '../src/features/app/AppStateScreen';
import { useI18n } from '../src/i18n';

export default function IndexRoute() {
  const appSession = useAppSession();
  const { t } = useI18n();
  const [onboarding, setOnboarding] = useState<boolean | null>(null);
  useEffect(() => { void AsyncStorage.getItem(ONBOARDING_KEY).then((value) => setOnboarding(value === 'true')); }, []);
  if (onboarding === null || appSession.isLoading) return <AppLoadingScreen />;
  if (!onboarding) return <OnboardingScreen onComplete={() => setOnboarding(true)} />;
  if (appSession.authErrorText) return <AppRetryScreen message={appSession.authErrorText} onRetry={() => void appSession.refresh()} />;
  if (appSession.connectionErrorText) return <AppRetryScreen message={t('app.connectionError')} onRetry={() => void appSession.connectionRefresh()} />;
  if (!appSession.session) return <Redirect href="/(auth)" />;
  return <Redirect href={appSession.connectionId && appSession.connectionComplete ? '/(app)/bowl' : '/(app)/pairing'} />;
}
