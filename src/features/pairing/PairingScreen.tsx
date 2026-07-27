import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Pressable, SafeAreaView, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { useI18n } from '../../i18n';

import { createShoreWithInvite, joinShoreWithInvite, type ShoreInvite } from './pairingService';

type PairingScreenProps = {
  onPaired: () => void;
};

export function PairingScreen({ onPaired }: PairingScreenProps) {
  const { t } = useI18n();
  const [inviteToken, setInviteToken] = useState('');
  const [createdInvite, setCreatedInvite] = useState<ShoreInvite | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [copied, setCopied] = useState(false);

  const createShore = async () => {
    setIsPending(true);
    setErrorText(null);

    try {
      setCreatedInvite(await createShoreWithInvite());
    } catch {
      setErrorText(t('pairing.createError'));
    } finally {
      setIsPending(false);
    }
  };

  const joinShore = async () => {
    if (inviteToken.trim().length === 0) {
      return;
    }

    setIsPending(true);
    setErrorText(null);

    try {
      await joinShoreWithInvite(inviteToken);
      onPaired();
    } catch {
      setErrorText(t('pairing.joinError'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('pairing.begin')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pairing.create')}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={createShore}
            style={[styles.primaryButton, isPending && styles.disabled]}
          >
            {isPending ? <ActivityIndicator color="#F7F3EC" /> : <Text style={styles.primaryText}>{t('pairing.create')}</Text>}
          </Pressable>

          {createdInvite ? (
            <View style={styles.inviteBox}>
              <Text selectable style={styles.inviteToken}>
                {createdInvite.inviteToken}
              </Text>
              <Text style={styles.helper}>{t('pairing.shareOnce')}</Text>
              <View style={styles.inviteActions}>
                <Pressable accessibilityRole="button" onPress={() => void Clipboard.setStringAsync(createdInvite.inviteToken).then(() => setCopied(true))}><Text style={styles.link}>{copied ? t('pairing.copied') : t('pairing.copy')}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => void Share.share({ message: createdInvite.inviteToken })}><Text style={styles.link}>{t('pairing.share')}</Text></Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pairing.join')}</Text>
          <TextInput
            accessibilityLabel={t('pairing.invitation')}
            autoCapitalize="none"
            onChangeText={setInviteToken}
            placeholder={t('pairing.invitation')}
            placeholderTextColor="#988C7E"
            style={styles.input}
            value={inviteToken}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isPending || inviteToken.trim().length === 0}
            onPress={joinShore}
            style={[styles.secondaryButton, (isPending || inviteToken.trim().length === 0) && styles.disabled]}
          >
            <Text style={styles.secondaryText}>{t('pairing.join')}</Text>
          </Pressable>
        </View>

        {errorText ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F3EC',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 28,
  },
  header: {
    gap: 8,
  },
  title: {
    color: '#403931',
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    color: '#675D52',
    fontSize: 26,
    lineHeight: 34,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#4D463F',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#4F6A5F',
  },
  primaryText: {
    color: '#F7F3EC',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBBEAE',
    borderRadius: 27,
    backgroundColor: '#F1E9DE',
  },
  secondaryText: {
    color: '#4D463F',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.48,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D4C8B9',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#403931',
    backgroundColor: '#FBF8F2',
    fontSize: 16,
  },
  inviteBox: {
    gap: 8,
    borderWidth: 1,
    borderColor: '#D8CCBE',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FBF8F2',
  },
  inviteToken: {
    color: '#403931',
    fontSize: 14,
    lineHeight: 20,
  },
  helper: {
    color: '#776D62',
    fontSize: 13,
  },
  inviteActions: { flexDirection: 'row', gap: 18 },
  link: { color: '#4F6A5F', fontSize: 14, fontWeight: '600', minHeight: 32 },
  error: {
    color: '#8B3F35',
    fontSize: 13,
    lineHeight: 18,
  },
});
