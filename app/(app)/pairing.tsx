import { Redirect } from 'expo-router';
import { PairingScreen } from '../../src/features/pairing/PairingScreen';
import { useAppSession } from '../../src/features/app/AppSessionProvider';
import { AppLoadingScreen, AppRetryScreen } from '../../src/features/app/AppStateScreen';
import { useI18n } from '../../src/i18n';
export default function PairingRoute() { const appSession = useAppSession(); const { t } = useI18n(); if (appSession.isLoading) return <AppLoadingScreen />; if (appSession.connectionErrorText) return <AppRetryScreen message={t('app.connectionError')} onRetry={() => void appSession.connectionRefresh()} />; if (!appSession.session) return <Redirect href="/(auth)" />; if (appSession.connectionId) return <Redirect href="/(app)/bowl" />; return <PairingScreen onPaired={appSession.connectionRefresh} />; }
