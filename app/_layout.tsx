import { Stack } from 'expo-router';
import { I18nProvider } from '../src/i18n';

export default function RootLayout() {
  return <I18nProvider><Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F7F3EC' },
      }}
    /></I18nProvider>;
}
