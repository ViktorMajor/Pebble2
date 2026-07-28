import { Redirect } from 'expo-router';
import { GLLayoutProbeScreen } from '../src/features/bowl/GLLayoutProbeScreen';

export default function GLLayoutProbeRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <GLLayoutProbeScreen />;
}
