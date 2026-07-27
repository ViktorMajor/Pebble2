import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useAuthSession } from '../src/features/auth/useAuthSession';
import { useCurrentShore } from '../src/features/pairing/useCurrentShore';

export default function IndexRoute() {
  const auth = useAuthSession();
  const shore = useCurrentShore(Boolean(auth.session));
  if (auth.isLoading || shore.isLoading) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>;
  if (!auth.session) return <Redirect href="/(auth)" />;
  return <Redirect href={shore.pairId ? '/(app)/shore' : '/(app)/pairing'} />;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EC' } });
