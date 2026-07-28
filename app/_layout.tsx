import { Stack } from 'expo-router';
import { I18nProvider } from '../src/i18n';
import { AppSessionProvider } from '../src/features/app/AppSessionProvider';

export default function RootLayout() {
  return <I18nProvider><AppSessionProvider><Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F7F3EC' },
      }}
    /></AppSessionProvider></I18nProvider>;
}
