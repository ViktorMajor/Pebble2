import { Redirect } from 'expo-router';
import { RawGLViewProbeScreen } from '../src/features/development/RawGLViewProbeScreen';

export default function RawGLViewProbeRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <RawGLViewProbeScreen />;
}
