import { Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors, fontFamily, type as typeTokens, type TypeVariant } from '../theme/tokens';

export type Tone = 'ink' | 'secondary' | 'accent' | 'danger' | 'onInk';

const toneColor: Record<Tone, string> = {
  ink: colors.ink,
  secondary: colors.inkSecondary,
  accent: colors.accent,
  danger: colors.danger,
  onInk: colors.onInk,
};

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: Tone;
};

/** Typed text using the type tokens. Scales with the phone's font size setting. */
export function Text({ variant = 'body', tone = 'ink', style, ...rest }: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typeTokens[variant],
        { color: toneColor[tone] },
        Platform.OS === 'web' ? { fontFamily: fontFamily.web } : null,
        style,
      ]}
    />
  );
}
