import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type ShoreLight = 'morning' | 'day' | 'sunset' | 'night';
export type ShoreSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export type ShoreEnvironment = {
  foundation: string;
  horizon: string;
  light: ShoreLight;
  pageBackground: string;
  shoreBackground: string;
  season: ShoreSeason;
  subtitle: string;
  title: string;
  waterline: string;
};

const seasonalAccents: Record<ShoreSeason, { foundation: string; waterline: string }> = {
  autumn: { foundation: '#9B8C7C', waterline: '#D8BFA5' },
  spring: { foundation: '#829D8C', waterline: '#B9D6C8' },
  summer: { foundation: '#8E9A91', waterline: '#BBD7DA' },
  winter: { foundation: '#8E98A1', waterline: '#C6D1DF' },
};

const lightPalettes: Record<ShoreLight, Omit<ShoreEnvironment, 'foundation' | 'season' | 'waterline'>> = {
  day: {
    horizon: '#E7E6D6',
    light: 'day',
    pageBackground: '#F6F4EE',
    shoreBackground: '#F1F2E8',
    subtitle: '#667268',
    title: '#3F4B42',
  },
  morning: {
    horizon: '#EBDCC9',
    light: 'morning',
    pageBackground: '#F8F1E8',
    shoreBackground: '#F5EDE2',
    subtitle: '#806D5D',
    title: '#4F463B',
  },
  night: {
    horizon: '#D7D8E1',
    light: 'night',
    pageBackground: '#ECECF0',
    shoreBackground: '#E5E6EC',
    subtitle: '#626978',
    title: '#3D4350',
  },
  sunset: {
    horizon: '#E7CBB9',
    light: 'sunset',
    pageBackground: '#F7EEE8',
    shoreBackground: '#F2E4DE',
    subtitle: '#7C625C',
    title: '#51423F',
  },
};

export function getShoreEnvironment(date: Date): ShoreEnvironment {
  const month = date.getMonth();
  const hour = date.getHours();
  const season: ShoreSeason = month === 11 || month <= 1 ? 'winter' : month <= 4 ? 'spring' : month <= 7 ? 'summer' : 'autumn';
  const light: ShoreLight = hour < 6 || hour >= 20 ? 'night' : hour < 10 ? 'morning' : hour < 17 ? 'day' : 'sunset';

  return {
    ...lightPalettes[light],
    ...seasonalAccents[season],
    season,
  };
}

export function useShoreEnvironment() {
  const [environment, setEnvironment] = useState(() => getShoreEnvironment(new Date()));

  useEffect(() => {
    const refreshEnvironment = () => setEnvironment(getShoreEnvironment(new Date()));
    const interval = setInterval(refreshEnvironment, 15 * 60 * 1000);
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshEnvironment();
      }
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, []);

  return environment;
}
