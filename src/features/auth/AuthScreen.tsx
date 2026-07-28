import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isSupabaseConfigured } from '../../lib/supabase';
import { signInWithEmail, signUpWithProfile } from './authService';
import { useI18n } from '../../i18n';
import { colors, fonts } from '../../design/tokens';

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
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
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
    <SafeAreaView style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safeArea}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.subtitle}>{t('auth.access')}</Text>
        </View>

        <View style={styles.form}>
          {isSignUp ? (
            <TextInput
              accessibilityLabel={t('auth.displayName')}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              maxLength={80}
              onChangeText={setDisplayName}
              placeholder={t('auth.displayName')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={displayName}
            />
          ) : null}

          <TextInput
            accessibilityLabel={t('auth.email')}
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            keyboardType="email-address"
            returnKeyType="next"
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={email}
          />

          <TextInput
            accessibilityLabel={t('auth.password')}
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={() => void submit()}
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
              <ActivityIndicator color={colors.textPrimary} />
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
      </ScrollView></KeyboardAvoidingView></SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.atmosphere,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 36,
    paddingHorizontal: 28,
  },
  header: {
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.systemSemibold,
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textPrimary,
    fontFamily: fonts.relational,
    fontSize: 26,
    lineHeight: 34,
  },
  form: {
    gap: 14,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontFamily: fonts.system,
    fontSize: 16,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.system,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.56,
  },
  primaryButtonText: {
    color: '#17231F',
    fontFamily: fonts.systemSemibold,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textSubdued,
    fontFamily: fonts.systemMedium,
    fontSize: 14,
    fontWeight: '600',
  },
});
