import { useLocalSearchParams, Redirect } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { ShoreScreen } from '../../../src/features/shore/ShoreScreen';
import { useAuthSession } from '../../../src/features/auth/useAuthSession';
import { getShoreStatus } from '../../../src/features/pairing/pairingService';
import { useEffect, useState } from 'react';
export default function HistoricalShoreRoute() { const { id } = useLocalSearchParams<{ id: string }>(); const { session } = useAuthSession(); const [status, setStatus] = useState<'active' | 'closed' | null>(null); useEffect(() => { if (id) void getShoreStatus(id).then(setStatus).catch(() => setStatus(null)); }, [id]); if (!session) return <Redirect href="/(auth)" />; if (!id || status === null) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>; return <ShoreScreen currentUserId={session.user.id} pairId={id} shoreStatus={status} />; }
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F3EC'}});
