import type { ReactNode } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { createShoreWithInvite, joinShoreWithInvite, type ShoreInvite } from './pairingService';

type PairingScreenProps = {
  accountLifecycle: ReactNode;
  onPaired: () => void;
};

export function PairingScreen({ accountLifecycle, onPaired }: PairingScreenProps) {
  const [inviteToken, setInviteToken] = useState('');
  const [createdInvite, setCreatedInvite] = useState<ShoreInvite | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const createShore = async () => {
    setIsPending(true);
    setErrorText(null);

    try {
      setCreatedInvite(await createShoreWithInvite());
    } catch {
      setErrorText('Could not create shore.');
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
      setErrorText('Could not join shore.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pebble</Text>
          <Text style={styles.subtitle}>Begin with one private shore.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create a shore</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={createShore}
            style={[styles.primaryButton, isPending && styles.disabled]}
          >
            {isPending ? <ActivityIndicator color="#F7F3EC" /> : <Text style={styles.primaryText}>Create a shore</Text>}
          </Pressable>

          {createdInvite ? (
            <View style={styles.inviteBox}>
              <Text selectable style={styles.inviteToken}>
                {createdInvite.inviteToken}
              </Text>
              <Text style={styles.helper}>Share this invitation once.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join a shore</Text>
          <TextInput
            accessibilityLabel="Invitation token"
            autoCapitalize="none"
            onChangeText={setInviteToken}
            placeholder="Invitation"
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
            <Text style={styles.secondaryText}>Join a shore</Text>
          </Pressable>
        </View>

        {errorText ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText}</Text> : null}
        {accountLifecycle}
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
  error: {
    color: '#8B3F35',
    fontSize: 13,
    lineHeight: 18,
  },
});
