import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { I18nProvider } from '../src/i18n';
import { AppSessionProvider } from '../src/features/app/AppSessionProvider';
import { colors, fonts } from '../src/design/tokens';
import { usePebbleFonts } from '../src/design/usePebbleFonts';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = usePebbleFonts();
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);
  if (!fontsLoaded && !fontError) return null;

  return <I18nProvider><AppSessionProvider><Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fonts.systemMedium },
        headerStyle: { backgroundColor: colors.atmosphere },
        contentStyle: { backgroundColor: colors.atmosphere },
      }}
    /></AppSessionProvider></I18nProvider>;
}
