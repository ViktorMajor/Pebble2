import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fonts, MIN_TOUCH_TARGET, spacing, typography } from '../../design/tokens';
import { componentTokens } from '../../design/componentTokens';
import { useI18n } from '../../i18n';
import { useAppSession } from '../app/AppSessionProvider';
import { useReducedMotion } from '../bowl/useReducedMotion';
import { navigationMotion } from './navigationMotion';

function MotionPress({ label, onPress, children, style, reducedMotion }: { label: string; onPress: () => void; children: ReactNode; style?: object; reducedMotion: boolean }) {
  const scale = useState(() => new Animated.Value(1))[0];
  const animate = (value: number, duration: number) => Animated.timing(scale, { toValue: value, duration, useNativeDriver: true }).start();
  return <Animated.View style={[style, { transform: [{ scale }] }]}><Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} onPressIn={() => { if (!reducedMotion) animate(navigationMotion.pressedScale, navigationMotion.pressIn); }} onPressOut={() => { if (!reducedMotion) animate(1, navigationMotion.pressOut); }} style={styles.pressTarget}>{children}</Pressable></Animated.View>;
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { t } = useI18n();
  const session = useAppSession();
  const entrance = useState(() => new Animated.Value(1))[0];
  const isRoot = pathname === '/bowl' || pathname === '/pairing';
  const home = session.connectionId && session.connectionComplete ? '/(app)/bowl' : '/(app)/pairing';
  const title = useMemo(() => {
    if (pathname === '/settings/profile') return t('settings.profile');
    if (pathname === '/settings/language') return t('settings.language');
    if (pathname === '/settings/connection') return t('settings.connection');
    if (pathname === '/settings/account') return t('settings.account');
    if (pathname === '/bowl-lab') return 'Bowl Lab';
    if (pathname.startsWith('/bowl/')) return t('settings.statusClosed');
    return t('settings.title');
  }, [pathname, t]);
  useEffect(() => {
    entrance.stopAnimation();
    entrance.setValue(reducedMotion ? 1 : 0);
    Animated.timing(entrance, { toValue: 1, duration: reducedMotion ? 0 : navigationMotion.headerEntrance, useNativeDriver: true }).start();
  }, [entrance, pathname, reducedMotion]);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace(home); };
  return <Animated.View style={[styles.header, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
    {isRoot ? <Text accessibilityRole="header" style={styles.wordmark}>{t('app.name')}</Text> : <MotionPress label={t('app.back')} onPress={back} reducedMotion={reducedMotion} style={styles.side}><Text style={styles.back}>‹</Text></MotionPress>}
    {!isRoot ? <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</Text> : <View style={styles.flex} />}
    {isRoot ? <MotionPress label={t('app.settings')} onPress={() => router.push('/(app)/settings')} reducedMotion={reducedMotion} style={[styles.settings, __DEV__ && styles.developmentClearance]}><Text style={styles.settingsIcon}>⚙︎</Text>{width >= 350 ? <Text style={styles.settingsText}>{t('app.settings')}</Text> : null}</MotionPress> : <MotionPress label={t('app.bowlHome')} onPress={() => router.replace(home)} reducedMotion={reducedMotion} style={styles.side}><Text style={styles.homeMark}>●</Text></MotionPress>}
  </Animated.View>;
}

const styles = StyleSheet.create({
  header: { height: componentTokens.header.height, width: '100%', flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg, paddingRight: spacing.md, backgroundColor: componentTokens.header.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: componentTokens.header.hairline, zIndex: 20 },
  wordmark: { fontFamily: fonts.systemSemibold, color: colors.textPrimary, fontSize: 18, letterSpacing: 0.2 },
  flex: { flex: 1 },
  side: { width: MIN_TOUCH_TARGET, height: MIN_TOUCH_TARGET },
  settings: { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET, marginLeft: 'auto' },
  developmentClearance: { marginRight: 54 },
  pressTarget: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  settingsIcon: { fontFamily: fonts.system, color: colors.textPrimary, fontSize: 18 },
  settingsText: { ...typography.functionalSecondary, color: colors.textPrimary },
  back: { fontFamily: fonts.relational, color: colors.textPrimary, fontSize: 34, lineHeight: 40 },
  homeMark: { color: colors.primaryPressed, fontSize: 16 },
  title: { flex: 1, ...typography.functionalPrimary, color: colors.textPrimary, textAlign: 'center', paddingHorizontal: spacing.sm },
});
