import { Redirect } from 'expo-router';
import { ShoreScreen } from '../../src/features/shore/ShoreScreen';
import { useAppSession } from '../../src/features/app/AppSessionProvider';
import { AppLoadingScreen, AppRetryScreen } from '../../src/features/app/AppStateScreen';
import { useI18n } from '../../src/i18n';
export default function ShoreRoute() { const appSession = useAppSession(); const { t } = useI18n(); if (appSession.isLoading) return <AppLoadingScreen />; if (appSession.shoreErrorText) return <AppRetryScreen message={t('app.shoreError')} onRetry={() => void appSession.shoreRefresh()} />; if (!appSession.session) return <Redirect href="/(auth)" />; if (!appSession.shoreId) return <Redirect href="/(app)/pairing" />; return <ShoreScreen currentUserId={appSession.session.user.id} pairId={appSession.shoreId} shoreStatus="active" />; }
