import { ShoreScreen } from '../src/features/shore/ShoreScreen';
import { AuthScreen } from '../src/features/auth/AuthScreen';
import { useAuthSession } from '../src/features/auth/useAuthSession';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { PairingScreen } from '../src/features/pairing/PairingScreen';
import { useCurrentShore } from '../src/features/pairing/useCurrentShore';
import { usePushNotifications } from '../src/features/notifications/usePushNotifications';
import { AccountDeletionButton } from '../src/features/lifecycle/AccountDeletionButton';

export default function IndexRoute() {
  const { errorText: authErrorText, isLoading, refresh: refreshSession, session } = useAuthSession();
  const shore = useCurrentShore(Boolean(session));
  usePushNotifications(session && shore.pairId ? session.user.id : null, shore.refresh);

  if (isLoading || shore.isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading Pebble" color="#4F6A5F" />
      </SafeAreaView>
    );
  }

  if (!session) {
    if (authErrorText) {
      return <RecoveryScreen message={authErrorText} onRetry={refreshSession} />;
    }

    return <AuthScreen />;
  }

  if (shore.errorText) {
    return <RecoveryScreen message={shore.errorText} onRetry={shore.refresh} />;
  }

  if (!shore.pairId) {
    return <PairingScreen onPaired={shore.refresh} accountLifecycle={<AccountDeletionButton />} />;
  }

  return <ShoreScreen currentUserId={session.user.id} pairId={shore.pairId} shoreStatus={shore.status ?? 'closed'} />;
}

function RecoveryScreen({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <SafeAreaView style={styles.loading}>
      <View style={styles.recovery}>
        <Text accessibilityLiveRegion="polite" style={styles.recoveryText}>{message}</Text>
        <Pressable accessibilityRole="button" onPress={() => void onRetry()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F3EC',
  },
  recovery: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 28,
  },
  recoveryText: {
    color: '#675D52',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryText: {
    color: '#4F6A5F',
    fontSize: 15,
    fontWeight: '600',
  },
});
