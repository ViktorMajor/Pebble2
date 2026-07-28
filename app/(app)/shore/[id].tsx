import { useLocalSearchParams, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoreScreen } from '../../../src/features/shore/ShoreScreen';
import { useAppSession } from '../../../src/features/app/AppSessionProvider';
import { getShoreStatus } from '../../../src/features/pairing/pairingService';
import { useEffect, useState } from 'react';
export default function HistoricalShoreRoute() { const { id } = useLocalSearchParams<{ id: string }>(); const { session } = useAppSession(); const [status, setStatus] = useState<'active' | 'closed' | null>(null); useEffect(() => { if (id) void getShoreStatus(id).then(setStatus).catch(() => setStatus(null)); }, [id]); if (!session) return <Redirect href="/(auth)" />; if (!id || status === null) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>; return <ShoreScreen currentUserId={session.user.id} pairId={id} shoreStatus={status} />; }
const styles=StyleSheet.create({loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F3EC'}});
