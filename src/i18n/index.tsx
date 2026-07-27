import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { en } from './en';
import { hu } from './hu';

export type LanguagePreference = 'system' | 'en' | 'hu';
export type AppLocale = 'en' | 'hu';
const LANGUAGE_KEY = 'pebble.language-preference';

export function resolveLocale(preference: LanguagePreference, deviceLanguage = getLocales()[0]?.languageCode): AppLocale {
  if (preference === 'en' || preference === 'hu') return preference;
  return deviceLanguage?.toLowerCase() === 'hu' ? 'hu' : 'en';
}

type I18nValue = { locale: AppLocale; preference: LanguagePreference; ready: boolean; setPreference: (preference: LanguagePreference) => Promise<void>; t: (key: string) => string };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setStoredPreference] = useState<LanguagePreference>('system');
  const [ready, setReady] = useState(false);
  useEffect(() => { void AsyncStorage.getItem(LANGUAGE_KEY).then((value) => { if (value === 'en' || value === 'hu' || value === 'system') setStoredPreference(value); }).finally(() => setReady(true)); }, []);
  const locale = resolveLocale(preference);
  const translator = useMemo(() => { const instance = new I18n({ en, hu }); instance.enableFallback = true; instance.defaultLocale = 'en'; instance.locale = locale; return instance; }, [locale]);
  const setPreference = useCallback(async (next: LanguagePreference) => { setStoredPreference(next); await AsyncStorage.setItem(LANGUAGE_KEY, next); }, []);
  const value = useMemo(() => ({ locale, preference, ready, setPreference, t: (key: string) => translator.t(key) }), [locale, preference, ready, setPreference, translator]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() { const value = useContext(I18nContext); if (!value) throw new Error('I18nProvider is required.'); return value; }
