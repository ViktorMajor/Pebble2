import { luminousEnvironment } from './environmentTokens';

export const colors = {
  atmosphere: luminousEnvironment.upperMist,
  atmosphereCentre: luminousEnvironment.centralPearl,
  atmosphereLifted: luminousEnvironment.lowerMineral,
  bowlOutside: luminousEnvironment.bowlExterior,
  bowlInside: luminousEnvironment.bowlInterior,
  bowlRim: luminousEnvironment.bowlRim,
  warmKey: luminousEnvironment.warmAccent,
  coolRim: luminousEnvironment.coolAccent,
  textPrimary: luminousEnvironment.textPrimary,
  relationalPrimary: luminousEnvironment.relationalPrimary,
  textSubdued: luminousEnvironment.textSecondary,
  textFunctional: luminousEnvironment.textPrimary,
  textMuted: luminousEnvironment.textMuted,
  error: luminousEnvironment.error,
  surface: luminousEnvironment.elevatedSurface,
  surfaceSecondary: luminousEnvironment.secondarySurface,
  border: luminousEnvironment.border,
  pressed: luminousEnvironment.sagePressed,
  primary: luminousEnvironment.sage,
  primaryPressed: luminousEnvironment.sagePressed,
  contact: luminousEnvironment.contactTone,
  reflectedInterior: luminousEnvironment.reflectedInterior,
} as const;

export const fonts = {
  relational: 'SourceSerif4_400Regular',
  relationalMedium: 'SourceSerif4_500Medium',
  system: 'SourceSans3_400Regular',
  systemMedium: 'SourceSans3_500Medium',
  systemSemibold: 'SourceSans3_600SemiBold',
} as const;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { input: 12, control: 24, panel: 18 } as const;
export const typography = {
  relationalHero: { fontFamily: fonts.relationalMedium, fontSize: 30, lineHeight: 38, letterSpacing: -0.1 },
  relationalSecondary: { fontFamily: fonts.relational, fontSize: 22, lineHeight: 30 },
  functionalPrimary: { fontFamily: fonts.systemMedium, fontSize: 17, lineHeight: 23 },
  functionalSecondary: { fontFamily: fonts.system, fontSize: 15, lineHeight: 21 },
} as const;
export const motion = { pickup: 210, quick: 180, settle: 460, travel: 820, arrival: 920, caption: 420, captionDelay: 340 } as const;
export const bowlLighting = { exposure: 1.22, ambient: 1.25, key: 1.05, rim: 0.26, fill: 0.75, maxVignette: 0 } as const;
export const bowlLuminanceTargets = { backgroundMinimum: 0.45, bowlSeparation: 1.16, pebbleSeparation: 1.12, contactShadowFloor: 0.72, rimHighlightMaximum: 1.18 } as const;
export const opacity = { quiet: 0.68, secondary: 0.82, disabled: 0.56 } as const;
export const MIN_TOUCH_TARGET = 48;
