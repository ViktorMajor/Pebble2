export const colors = {
  atmosphere: '#15191E',
  atmosphereLifted: '#1D232A',
  bowlInside: '#62676A',
  bowlOutside: '#3E4448',
  warmKey: '#C9A982',
  coolRim: '#91A6B8',
  textPrimary: '#EEEAE2',
  textSubdued: '#A8ADB0',
  error: '#D7A39A',
  surface: '#20262C',
  border: '#343C43',
  pressed: '#2A3239',
} as const;

export const fonts = {
  relational: 'SourceSerif4_400Regular',
  relationalMedium: 'SourceSerif4_600SemiBold',
  system: 'SourceSans3_400Regular',
  systemMedium: 'SourceSans3_500Medium',
  systemSemibold: 'SourceSans3_600SemiBold',
} as const;

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { input: 12, control: 24, panel: 18 } as const;
export const motion = { quick: 160, settle: 420, travel: 760, caption: 900 } as const;
export const opacity = { quiet: 0.58, secondary: 0.76, disabled: 0.42 } as const;
export const MIN_TOUCH_TARGET = 48;
