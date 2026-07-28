import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { colors } from '../../design/tokens';

export type BowlLightPhase = 'morning' | 'day' | 'evening' | 'night';
export type BowlSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type BowlEnvironment = {
  phase: BowlLightPhase;
  season: BowlSeason;
  phaseProgress: number;
  backgroundEdge: string;
  backgroundCenter: string;
  backgroundHaze: string;
  key: string;
  keyIntensity: number;
  rim: string;
  rimIntensity: number;
};

const stops = [
  { hour: 0, phase: 'night' as const, centre: '#243137', haze: '#2D3C42', key: '#C9C0B7', keyIntensity: 1.04, rim: '#B9C3C4', rimIntensity: 0.76 },
  { hour: 6, phase: 'morning' as const, centre: '#29373D', haze: '#32434A', key: '#CBC4BC', keyIntensity: 1.13, rim: '#BBC6C7', rimIntensity: 0.7 },
  { hour: 11, phase: 'day' as const, centre: '#2B383D', haze: '#34444A', key: '#CFC6BD', keyIntensity: 1.18, rim: '#BDC6C6', rimIntensity: 0.68 },
  { hour: 17, phase: 'evening' as const, centre: '#28353B', haze: '#314147', key: '#CDC4BA', keyIntensity: 1.14, rim: '#BAC4C5', rimIntensity: 0.7 },
  { hour: 21, phase: 'night' as const, centre: '#243137', haze: '#2D3C42', key: '#C9C0B7', keyIntensity: 1.04, rim: '#B9C3C4', rimIntensity: 0.76 },
  { hour: 24, phase: 'night' as const, centre: '#243137', haze: '#2D3C42', key: '#C9C0B7', keyIntensity: 1.04, rim: '#B9C3C4', rimIntensity: 0.76 },
];

function hexToRgb(value: string) {
  const number = Number.parseInt(value.slice(1), 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255] as const;
}
function mixHex(first: string, second: string, progress: number) {
  const a = hexToRgb(first); const b = hexToRgb(second);
  return `#${a.map((value, index) => Math.round(value + (b[index] - value) * progress).toString(16).padStart(2, '0')).join('')}`;
}
function seasonForMonth(month: number): BowlSeason {
  return month < 2 || month === 11 ? 'winter' : month < 5 ? 'spring' : month < 8 ? 'summer' : 'autumn';
}
export function relativeLuminance(value: string) {
  const channels = hexToRgb(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrastRatio(first: string, second: string) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}
export function hslSaturation(value: string) {
  const channels = hexToRgb(value).map((channel) => channel / 255);
  const maximum = Math.max(...channels); const minimum = Math.min(...channels);
  const lightness = (maximum + minimum) / 2;
  return maximum === minimum ? 0 : (maximum - minimum) / (1 - Math.abs(2 * lightness - 1));
}

export function getBowlEnvironment(date: Date): BowlEnvironment {
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const index = Math.max(0, stops.findIndex((stop) => stop.hour > hour) - 1);
  const current = stops[index]; const next = stops[index + 1];
  const progress = (hour - current.hour) / (next.hour - current.hour);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
  const seasonalDrift = Math.sin(((day - 80) / 365) * Math.PI * 2) * 0.025;
  return {
    phase: current.phase,
    season: seasonForMonth(date.getMonth()),
    phaseProgress: progress,
    backgroundEdge: colors.atmosphere,
    backgroundCenter: mixHex(current.centre, next.centre, progress),
    backgroundHaze: mixHex(current.haze, next.haze, progress),
    key: mixHex(current.key, next.key, progress),
    keyIntensity: current.keyIntensity + (next.keyIntensity - current.keyIntensity) * progress + seasonalDrift,
    rim: mixHex(current.rim, next.rim, progress),
    rimIntensity: current.rimIntensity + (next.rimIntensity - current.rimIntensity) * progress,
  };
}

export function useBowlEnvironment(now = () => new Date()) {
  const [value, setValue] = useState(() => getBowlEnvironment(now()));
  useEffect(() => {
    const refresh = () => setValue(getBowlEnvironment(now()));
    const interval = setInterval(refresh, 60_000);
    const appState = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { clearInterval(interval); appState.remove(); };
  }, [now]);
  return value;
}
