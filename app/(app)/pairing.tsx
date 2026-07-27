import { Redirect } from 'expo-router';
import { PairingScreen } from '../../src/features/pairing/PairingScreen';
import { useAuthSession } from '../../src/features/auth/useAuthSession';
import { useCurrentShore } from '../../src/features/pairing/useCurrentShore';
export default function PairingRoute() { const { session } = useAuthSession(); const shore = useCurrentShore(Boolean(session)); if (!session) return <Redirect href="/(auth)" />; if (shore.pairId) return <Redirect href="/(app)/shore" />; return <PairingScreen onPaired={shore.refresh} />; }
