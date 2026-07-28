import { luminousEnvironment } from './environmentTokens';

export const componentTokens = {
  header: { height: 62, background: 'rgba(220,230,229,0.94)', hairline: luminousEnvironment.border },
  primaryButton: { minHeight: 54, radius: 20, background: luminousEnvironment.sage, pressed: luminousEnvironment.sagePressed, text: '#17231F' },
  secondaryButton: { minHeight: 52, radius: 20, background: luminousEnvironment.elevatedSurface, border: luminousEnvironment.border, text: luminousEnvironment.textPrimary },
  input: { minHeight: 54, radius: 16, background: luminousEnvironment.elevatedSurface, border: luminousEnvironment.border, focusBorder: luminousEnvironment.sagePressed },
  invitation: { background: luminousEnvironment.elevatedSurface, border: luminousEnvironment.border, radius: 18 },
} as const;
