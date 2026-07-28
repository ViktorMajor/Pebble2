import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../i18n';
import { colors, fonts } from '../../design/tokens';

export function AppLoadingScreen() { const { t } = useI18n(); return <SafeAreaView style={styles.safe}><ActivityIndicator accessibilityLabel={t('app.loading')} color={colors.textSubdued} /></SafeAreaView>; }
export function AppRetryScreen({ message, onRetry }: { message: string; onRetry: () => void }) { const { t } = useI18n(); return <SafeAreaView style={styles.safe}><View style={styles.content}><Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text><Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>{t('app.retry')}</Text></Pressable></View></SafeAreaView>; }
const styles=StyleSheet.create({safe:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.atmosphere},content:{alignItems:'center',gap:16,padding:28},message:{fontFamily:fonts.system,color:colors.textSubdued,fontSize:16,textAlign:'center'},retry:{minHeight:48,justifyContent:'center',paddingHorizontal:16},retryText:{fontFamily:fonts.systemMedium,color:colors.textPrimary,fontSize:16}});
