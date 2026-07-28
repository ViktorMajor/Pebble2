import { Redirect } from 'expo-router';
import { R3FViewportProbeScreen } from '../src/features/development/R3FViewportProbeScreen';

export default function R3FViewportProbeRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <R3FViewportProbeScreen />;
}
