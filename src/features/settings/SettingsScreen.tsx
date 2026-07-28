import * as Notifications from 'expo-notifications';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../design/tokens';
import { useI18n } from '../../i18n';
import { loadSoundPreference, setSoundEnabled } from '../sound/bowlSoundService';

type Href =
  | '/(app)/settings/profile'
  | '/(app)/settings/language'
  | '/(app)/settings/connection'
  | '/(app)/settings/account'
  | '/(app)/bowl-lab';

function Row({ href, title }: { href: Href; title: string }) {
  return (
    <Link href={href} style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.arrow}>›</Text>
    </Link>
  );
}

export function SettingsScreen() {
  const { t } = useI18n();
  const [permission, setPermission] = useState('');
  const [sounds, setSounds] = useState(false);

  useEffect(() => {
    void Notifications.getPermissionsAsync()
      .then((result) => setPermission(result.granted ? t('settings.enabled') : t('settings.disabled')))
      .catch(() => setPermission(t('settings.unavailable')));
    void loadSoundPreference().then(setSounds);
  }, [t]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.heading}>{t('settings.profile')}</Text>
        <Row href="/(app)/settings/profile" title={t('settings.profile')} />

        <Text style={styles.heading}>{t('settings.language')}</Text>
        <Row href="/(app)/settings/language" title={t('settings.language')} />

        <Text style={styles.heading}>{t('settings.connection')}</Text>
        <Row href="/(app)/settings/connection" title={t('settings.connection')} />

        <Text style={styles.heading}>{t('settings.notifications')}</Text>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.rowTitle}>{t('settings.permission')}</Text>
            <Text style={styles.detail}>{permission}</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.grow}>
            <Text style={styles.rowTitle}>{t('settings.sounds')}</Text>
            <Text style={styles.detail}>{t('settings.soundsDetail')}</Text>
          </View>
          <Switch
            accessibilityLabel={t('settings.sounds')}
            value={sounds}
            onValueChange={(value) => {
              setSounds(value);
              void setSoundEnabled(value);
            }}
            trackColor={{ false: colors.border, true: '#69736F' }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {__DEV__ ? (
          <>
            <Text style={styles.heading}>{t('settings.development')}</Text>
            <Row href="/(app)/bowl-lab" title={t('settings.bowlLab')} />
          </>
        ) : null}

        <Text style={styles.heading}>{t('settings.account')}</Text>
        <Row href="/(app)/settings/account" title={t('settings.account')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.atmosphere },
  content: { padding: spacing.lg },
  heading: {
    fontFamily: fonts.systemSemibold,
    color: colors.textSubdued,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
  },
  row: {
    display: 'flex',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    textDecorationLine: 'none',
  },
  statusRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontFamily: fonts.system, color: colors.textPrimary, fontSize: 17 },
  arrow: { fontFamily: fonts.system, color: colors.textSubdued, fontSize: 24 },
  detail: { fontFamily: fonts.system, color: colors.textSubdued, fontSize: 13, marginTop: 3, maxWidth: 270 },
  grow: { flex: 1 },
});
