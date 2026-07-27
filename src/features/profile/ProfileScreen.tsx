import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { useI18n } from '../../i18n';
import { getOwnProfile, normalizeDisplayName, updateOwnDisplayName } from './profileService';

export function ProfileScreen() {
  const { t } = useI18n();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { void getOwnProfile().then((profile) => { setName(profile.displayName); setEmail(profile.email); }).catch(() => setNotice(t('settings.loadError'))).finally(() => setLoading(false)); }, [t]);
  const save = async () => { if (!normalizeDisplayName(name) || saving) return; setSaving(true); setNotice(null); try { await updateOwnDisplayName(name); setName(name.trim()); setNotice(t('settings.saved')); } catch { setNotice(t('settings.profileError')); } finally { setSaving(false); } };
  return <SafeAreaView style={styles.safe}><Stack.Screen options={{ title: t('settings.profile') }} /><View style={styles.content}>{loading ? <ActivityIndicator /> : <><Text style={styles.label}>{t('settings.displayName')}</Text><TextInput accessibilityLabel={t('settings.displayName')} value={name} onChangeText={setName} maxLength={80} style={styles.input} /><Text style={styles.label}>{t('settings.accountEmail')}</Text><Text style={styles.email}>{email}</Text><Pressable accessibilityRole="button" disabled={!normalizeDisplayName(name) || saving} onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>{saving ? '…' : t('settings.save')}</Text></Pressable>{notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}</>}</View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F3EC'},content:{padding:28,gap:10},label:{color:'#675D52',fontSize:13,fontWeight:'600',marginTop:12},input:{minHeight:52,borderWidth:1,borderColor:'#D4C8B9',borderRadius:12,paddingHorizontal:14,color:'#403931',backgroundColor:'#FBF8F2',fontSize:16},email:{minHeight:52,paddingVertical:16,color:'#403931',fontSize:16},save:{marginTop:20,minHeight:52,borderRadius:26,alignItems:'center',justifyContent:'center',backgroundColor:'#4F6A5F'},saveText:{color:'#F7F3EC',fontWeight:'600',fontSize:16},notice:{color:'#675D52',textAlign:'center',marginTop:8} });
