import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { isSupabaseConfigured } from '../../lib/supabase';
import { signInWithEmail, signUpWithProfile } from './authService';
import { useI18n } from '../../i18n';

type AuthMode = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isSignUp = mode === 'sign-up';
  const canSubmit =
    isSupabaseConfigured &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    (!isSignUp || displayName.trim().length > 0) &&
    !isPending;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsPending(true);
    setErrorText(null);

    try {
      if (isSignUp) {
        await signUpWithProfile({ displayName, email, password });
      } else {
        await signInWithEmail({ email, password });
      }
    } catch {
      setErrorText(isSignUp ? t('auth.createError') : t('auth.signInError'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('auth.access')}</Text>
        </View>

        <View style={styles.form}>
          {isSignUp ? (
            <TextInput
              accessibilityLabel={t('auth.displayName')}
              autoCapitalize="words"
              maxLength={80}
              onChangeText={setDisplayName}
              placeholder={t('auth.displayName')}
              placeholderTextColor="#988C7E"
              style={styles.input}
              value={displayName}
            />
          ) : null}

          <TextInput
            accessibilityLabel={t('auth.email')}
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            placeholderTextColor="#988C7E"
            style={styles.input}
            value={email}
          />

          <TextInput
            accessibilityLabel={t('auth.password')}
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            placeholderTextColor="#988C7E"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {errorText ? <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText}</Text> : null}
          {!isSupabaseConfigured ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>{t('app.notConfigured')}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={submit}
            style={[styles.primaryButton, !canSubmit && styles.disabledButton]}
          >
            {isPending ? (
              <ActivityIndicator color="#F7F3EC" />
            ) : (
              <Text style={styles.primaryButtonText}>{isSignUp ? t('auth.createAccount') : t('auth.signIn')}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setErrorText(null);
              setMode(isSignUp ? 'sign-in' : 'sign-up');
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>{isSignUp ? t('auth.existingAccount') : t('auth.createProfile')}</Text>
          </Pressable>
        </View>
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
    gap: 36,
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
  form: {
    gap: 14,
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
  error: {
    color: '#8B3F35',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#4F6A5F',
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#F7F3EC',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#675D52',
    fontSize: 14,
    fontWeight: '600',
  },
});
