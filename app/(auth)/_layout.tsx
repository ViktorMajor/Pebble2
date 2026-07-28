import { Redirect, Stack } from 'expo-router';
import { useAppSession } from '../../src/features/app/AppSessionProvider';
import { AppLoadingScreen, AppRetryScreen } from '../../src/features/app/AppStateScreen';
export default function AuthLayout() { const appSession = useAppSession(); if (appSession.isLoading) return <AppLoadingScreen />; if (appSession.authErrorText) return <AppRetryScreen message={appSession.authErrorText} onRetry={() => void appSession.refresh()} />; if (appSession.session) return <Redirect href={appSession.connectionId && appSession.connectionComplete ? '/(app)/bowl' : '/(app)/pairing'} />; return <Stack screenOptions={{ headerShown: false }} />; }
