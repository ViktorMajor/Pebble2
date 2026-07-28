export const colors = {
  atmosphere: '#182126',
  atmosphereCentre: '#27343A',
  atmosphereLifted: '#314147',
  bowlOutside: '#626B6B',
  bowlInside: '#7A817D',
  bowlRim: '#8B918C',
  warmKey: '#CFC4B8',
  coolRim: '#BAC5C6',
  textPrimary: '#F0ECE4',
  textSubdued: '#BFC5C2',
  textFunctional: '#D9DDDA',
  textMuted: '#929B98',
  error: '#D7A39A',
  surface: '#222D32',
  border: '#465359',
  pressed: '#344248',
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
export const bowlLighting = { exposure: 1.12, ambient: 0.78, key: 1.16, rim: 0.72, fill: 0.44, maxVignette: 0.12 } as const;
export const bowlLuminanceTargets = { edge: 1, centre: 1.28, bowlOuter: 1.76, bowlInner: 2.02, pebbleLitFace: 2.58, contactShadowFloor: 0.6, rimHighlightMaximum: 1.25 } as const;
export const opacity = { quiet: 0.58, secondary: 0.76, disabled: 0.42 } as const;
export const MIN_TOUCH_TARGET = 48;
