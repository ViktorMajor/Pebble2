import { Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { ShoreScreen } from '../../src/features/shore/ShoreScreen';
import { useAuthSession } from '../../src/features/auth/useAuthSession';
import { useCurrentShore } from '../../src/features/pairing/useCurrentShore';
export default function ShoreRoute() { const { session } = useAuthSession(); const shore = useCurrentShore(Boolean(session)); if (shore.isLoading) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>; if (!session) return <Redirect href="/(auth)" />; if (!shore.pairId) return <Redirect href="/(app)/pairing" />; return <ShoreScreen currentUserId={session.user.id} pairId={shore.pairId} shoreStatus="active" />; }
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EC' } });
