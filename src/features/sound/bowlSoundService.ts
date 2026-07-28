import AsyncStorage from '@react-native-async-storage/async-storage';
import { setIsAudioActiveAsync } from 'expo-audio';

export type BowlSound = 'send' | 'arrival' | 'touch';
const SOUND_KEY = 'pebble.sounds-enabled';
let enabled = false;

export async function loadSoundPreference() {
  enabled = (await AsyncStorage.getItem(SOUND_KEY)) === 'true';
  await setIsAudioActiveAsync(enabled);
  return enabled;
}

export async function setSoundEnabled(value: boolean) {
  enabled = value;
  await AsyncStorage.setItem(SOUND_KEY, String(value));
  await setIsAudioActiveAsync(value);
}

export async function playBowlSound(_sound: BowlSound) {
  // Deliberately silent until appropriately recorded, licensed assets are supplied.
  // The preference, lifecycle boundary, and interaction integration points are ready.
  if (!enabled) return;
}

export async function setSoundLifecycleActive(active: boolean) {
  await setIsAudioActiveAsync(enabled && active);
}
