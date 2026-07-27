import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../../i18n';

function Row({ href, title, detail }: { href: '/(app)/settings/profile' | '/(app)/settings/language' | '/(app)/settings/connection' | '/(app)/settings/account'; title: string; detail?: string }) { return <Link href={href} style={styles.row}><Text style={styles.rowTitle}>{title}</Text>{detail ? <Text style={styles.detail}>{detail}</Text> : null}</Link>; }
export function SettingsScreen() {
  const { t } = useI18n(); const [permission, setPermission] = useState<string>('');
  useEffect(() => { void Notifications.getPermissionsAsync().then((result) => setPermission(result.granted ? t('settings.enabled') : t('settings.disabled'))).catch(() => setPermission(t('settings.unavailable'))); }, [t]);
  return <SafeAreaView style={styles.safe}><View style={styles.content}><Text style={styles.heading}>{t('settings.profile')}</Text><Row href="/(app)/settings/profile" title={t('settings.profile')} /><Text style={styles.heading}>{t('settings.language')}</Text><Row href="/(app)/settings/language" title={t('settings.language')} /><Text style={styles.heading}>{t('settings.connection')}</Text><Row href="/(app)/settings/connection" title={t('settings.connection')} /><Text style={styles.heading}>{t('settings.notifications')}</Text><View style={styles.row}><Text style={styles.rowTitle}>{t('settings.permission')}</Text><Text style={styles.detail}>{permission}</Text></View><Text style={styles.heading}>{t('settings.account')}</Text><Row href="/(app)/settings/account" title={t('settings.account')} /></View></SafeAreaView>;
}
const styles = StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F3EC'},content:{padding:28,gap:8},heading:{color:'#776D62',fontSize:13,fontWeight:'700',letterSpacing:0.6,marginTop:16},row:{display:'flex',minHeight:58,justifyContent:'center',borderBottomWidth:1,borderBottomColor:'#E0D7CA',textDecorationLine:'none'},rowTitle:{color:'#403931',fontSize:17},detail:{color:'#776D62',fontSize:14,marginTop:4}});
