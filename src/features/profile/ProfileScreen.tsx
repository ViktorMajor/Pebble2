import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../i18n';
import { getOwnProfile, normalizeDisplayName, updateOwnDisplayName } from './profileService';
import { colors, fonts } from '../../design/tokens';

export function ProfileScreen() {
  const { t } = useI18n();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { void getOwnProfile().then((profile) => { setName(profile.displayName); setEmail(profile.email); }).catch(() => setNotice(t('settings.loadError'))).finally(() => setLoading(false)); }, [t]);
  const save = async () => { if (!normalizeDisplayName(name) || saving) return; setSaving(true); setNotice(null); try { await updateOwnDisplayName(name); setName(name.trim()); setNotice(t('settings.saved')); } catch { setNotice(t('settings.profileError')); } finally { setSaving(false); } };
  return <SafeAreaView edges={['left','right','bottom']} style={styles.safe}><View style={styles.content}>{loading ? <ActivityIndicator /> : <><Text style={styles.label}>{t('settings.displayName')}</Text><TextInput accessibilityLabel={t('settings.displayName')} value={name} onChangeText={setName} maxLength={80} style={styles.input} /><Text style={styles.label}>{t('settings.accountEmail')}</Text><Text style={styles.email}>{email}</Text><Pressable accessibilityRole="button" disabled={!normalizeDisplayName(name) || saving} onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>{saving ? '…' : t('settings.save')}</Text></Pressable>{notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}</>}</View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:colors.atmosphere},content:{padding:28,gap:10},label:{fontFamily:fonts.systemMedium,color:colors.textSubdued,fontSize:13,marginTop:12},input:{minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:16,paddingHorizontal:14,color:colors.textPrimary,backgroundColor:colors.surface,fontFamily:fonts.system,fontSize:16},email:{minHeight:52,paddingVertical:16,color:colors.textPrimary,fontFamily:fonts.system,fontSize:16},save:{marginTop:20,minHeight:54,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary},saveText:{fontFamily:fonts.systemSemibold,color:'#17231F',fontSize:16},notice:{fontFamily:fonts.system,color:colors.textSubdued,textAlign:'center',marginTop:8} });
