import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useAuthSession } from '../../src/features/auth/useAuthSession';
export default function AuthLayout() { const { session, isLoading } = useAuthSession(); if (isLoading) return <SafeAreaView style={styles.loading}><ActivityIndicator /></SafeAreaView>; if (session) return <Redirect href="/(app)/shore" />; return <Stack screenOptions={{ headerShown: false }} />; }
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EC' } });
