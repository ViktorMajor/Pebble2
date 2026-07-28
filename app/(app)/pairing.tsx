import { Redirect } from 'expo-router';
import { PairingScreen } from '../../src/features/pairing/PairingScreen';
import { useAppSession } from '../../src/features/app/AppSessionProvider';
import { AppLoadingScreen, AppRetryScreen } from '../../src/features/app/AppStateScreen';
import { useI18n } from '../../src/i18n';
export default function PairingRoute() { const appSession = useAppSession(); const { t } = useI18n(); if (appSession.isLoading) return <AppLoadingScreen />; if (appSession.shoreErrorText) return <AppRetryScreen message={t('app.shoreError')} onRetry={() => void appSession.shoreRefresh()} />; if (!appSession.session) return <Redirect href="/(auth)" />; if (appSession.shoreId) return <Redirect href="/(app)/shore" />; return <PairingScreen onPaired={appSession.shoreRefresh} />; }
