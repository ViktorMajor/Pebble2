import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export type BowlLightPhase = 'morning' | 'day' | 'evening' | 'night';
export type BowlSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type BowlEnvironment = {
  phase: BowlLightPhase;
  season: BowlSeason;
  phaseProgress: number;
  background: string;
  key: string;
  keyIntensity: number;
  rim: string;
  rimIntensity: number;
};

const stops = [
  { hour: 0, phase: 'night' as const, background: '#11161C', key: '#8A725D', keyIntensity: 0.52, rim: '#829BB0', rimIntensity: 0.72 },
  { hour: 6, phase: 'morning' as const, background: '#192028', key: '#B8B9B0', keyIntensity: 0.82, rim: '#9DB2C3', rimIntensity: 0.56 },
  { hour: 11, phase: 'day' as const, background: '#1B2026', key: '#C4B9A5', keyIntensity: 0.94, rim: '#99AAB4', rimIntensity: 0.48 },
  { hour: 17, phase: 'evening' as const, background: '#191C21', key: '#C49B72', keyIntensity: 0.86, rim: '#889EAF', rimIntensity: 0.5 },
  { hour: 21, phase: 'night' as const, background: '#11161C', key: '#8A725D', keyIntensity: 0.52, rim: '#829BB0', rimIntensity: 0.72 },
  { hour: 24, phase: 'night' as const, background: '#11161C', key: '#8A725D', keyIntensity: 0.52, rim: '#829BB0', rimIntensity: 0.72 },
];

function hexToRgb(value: string) { const n = Number.parseInt(value.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixHex(first: string, second: string, progress: number) { const a=hexToRgb(first), b=hexToRgb(second); return `#${a.map((v,i)=>Math.round(v+(b[i]-v)*progress).toString(16).padStart(2,'0')).join('')}`; }
function seasonForMonth(month: number): BowlSeason { return month < 2 || month === 11 ? 'winter' : month < 5 ? 'spring' : month < 8 ? 'summer' : 'autumn'; }

export function getBowlEnvironment(date: Date): BowlEnvironment {
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const index = Math.max(0, stops.findIndex((stop) => stop.hour > hour) - 1);
  const current = stops[index]; const next = stops[index + 1];
  const progress = (hour - current.hour) / (next.hour - current.hour);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
  const seasonalWarmth = Math.sin(((day - 80) / 365) * Math.PI * 2) * 0.035;
  return {
    phase: current.phase,
    season: seasonForMonth(date.getMonth()),
    phaseProgress: progress,
    background: mixHex(current.background, next.background, progress),
    key: mixHex(current.key, next.key, progress),
    keyIntensity: current.keyIntensity + (next.keyIntensity - current.keyIntensity) * progress + seasonalWarmth,
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
