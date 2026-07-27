import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { HoldPebble } from './HoldPebble';
import { PebbleStone } from './PebbleStone';
import { ShoreFoundation } from './ShoreFoundation';
import { useShoreEnvironment } from './shoreEnvironment';
import { usePebbleWidgetSnapshot } from '../widget/usePebbleWidgetSnapshot';
import { createSendRequestKey, sendPebble } from './sendPebbleService';
import { touchPebble } from './touchPebbleService';
import { useShorePebbles } from './useShorePebbles';
import { requestPebblePushDelivery } from '../notifications/pushTokenService';
import { AccountDeletionButton } from '../lifecycle/AccountDeletionButton';
import { closeShore } from '../lifecycle/lifecycleService';

type ShoreScreenProps = {
  currentUserId: string;
  pairId: string;
  shoreStatus: 'active' | 'closed';
};

export function ShoreScreen({ currentUserId, pairId, shoreStatus }: ShoreScreenProps) {
  const isClosed = shoreStatus === 'closed';
  const environment = useShoreEnvironment();
  const { errorText: loadErrorText, foundationDensity, isLoading, pebbles, refresh } = useShorePebbles(pairId, currentUserId, isClosed);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [touchingPebbleIds, setTouchingPebbleIds] = useState<string[]>([]);
  usePebbleWidgetSnapshot(!isClosed && pebbles.some((pebble) => pebble.origin === 'other' && !pebble.touched));

  const addSentPebble = async () => {
    setErrorText(null);

    try {
      const sentPebble = await sendPebble(createSendRequestKey());
      await refresh();
      void requestPebblePushDelivery(sentPebble.id).catch(() => undefined);
    } catch (error) {
      setErrorText('Could not send pebble.');
      throw error;
    }
  };

  const touchIncoming = async (id: string) => {
    if (isClosed || touchingPebbleIds.includes(id)) {
      return;
    }

    setErrorText(null);
    setTouchingPebbleIds((current) => [...current, id]);

    try {
      await touchPebble(id);
      await refresh();

      if (Platform.OS !== 'web') {
        await Haptics.selectionAsync();
      }
    } catch {
      setErrorText('Could not touch pebble.');
    } finally {
      setTouchingPebbleIds((current) => current.filter((pebbleId) => pebbleId !== id));
    }
  };

  const confirmClose = () => {
    Alert.alert('Close this shore?', 'Pebbles will remain here, but no new pebbles or touches can be added.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close shore',
        style: 'destructive',
        onPress: () => {
          void closeShore(pairId)
            .then(refresh)
            .catch(() => setErrorText('Could not close shore.'));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: environment.pageBackground }]}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: environment.title }]}>Pebble</Text>
          <Text style={[styles.subtitle, { color: environment.subtitle }]}>A quiet shore.</Text>
        </View>

        <View style={[styles.shore, { backgroundColor: environment.shoreBackground }]} accessibilityLabel="Shared shore" accessible>
          <View style={[styles.horizon, { backgroundColor: environment.horizon }]} />
          <ShoreFoundation color={environment.foundation} density={foundationDensity} />
          <View style={[styles.waterline, { backgroundColor: environment.waterline }]} />
          <View style={styles.pebbleField}>
            {pebbles.map((pebble) => (
              <PebbleStone
                key={pebble.id}
                accessibilityLabel={pebble.origin === 'other' ? 'Incoming pebble' : 'Sent pebble'}
                disabled={isClosed || pebble.origin !== 'other' || pebble.touched || touchingPebbleIds.includes(pebble.id)}
                origin={pebble.origin}
                size={pebble.origin === 'other' ? 76 : 68}
                touched={pebble.touched}
                onPress={pebble.origin === 'other' ? () => void touchIncoming(pebble.id) : undefined}
              />
            ))}
            {isLoading ? <ActivityIndicator accessibilityLabel="Loading shore" color="#4F6A5F" /> : null}
          </View>
        </View>

        {isClosed ? <Text style={styles.closedNote}>This shore is closed.</Text> : <View style={styles.sender}><HoldPebble onSend={addSentPebble} /></View>}

        {errorText || loadErrorText ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>{errorText ?? loadErrorText}</Text>
        ) : null}
        {!isClosed ? (
          <Pressable accessibilityRole="button" onPress={confirmClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close this shore</Text>
          </Pressable>
        ) : null}
        <AccountDeletionButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    color: '#403931',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: '#73675C',
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 38,
  },
  shore: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '22%',
    height: 1,
    opacity: 0.72,
  },
  waterline: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: '36%',
    height: 2,
    borderRadius: 1,
    backgroundColor: '#E2D8CA',
  },
  pebbleField: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    paddingHorizontal: 14,
  },
  sender: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  error: {
    color: '#8B3F35',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  closedNote: {
    color: '#73675C',
    fontSize: 14,
    textAlign: 'center',
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  closeButtonText: {
    color: '#675C50',
    fontSize: 13,
    fontWeight: '600',
  },
});
