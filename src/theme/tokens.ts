// Somudai design tokens. Every colour, size and radius in the app comes from here.
// Never hard-code a colour or size in a screen.

export const colors = {
  bg: '#FAFAF8', // screen background
  surface: '#FFFFFF', // cards, sheets
  ink: '#111111', // main text, primary button fill
  inkSecondary: '#6B6B66', // counts, meta lines, hints
  border: '#E7E5E0', // card borders, dividers
  accent: '#2F7D4F', // selected matter chips, the "joined" tick
  accentSoft: '#E8F2EC', // selected chip background, joined button background
  danger: '#B3261E', // errors, delete account
  onInk: '#FFFFFF', // text on the black button
  skeleton: '#EFEDE8', // loading placeholders (derived from border)
} as const;

export type ColorToken = keyof typeof colors;

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '600' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;

export type TypeVariant = keyof typeof type;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const screenPadding = space.lg;

export const radius = {
  card: 16,
  photo: 16,
  pill: 999,
} as const;

export const touch = {
  minSize: 44,
} as const;

export const aspect = {
  card: 4 / 3,
  detail: 16 / 10,
} as const;

export const motion = {
  fade: 180,
  press: 120,
  pressScale: 0.97,
} as const;

export const fontFamily = {
  // System font: San Francisco on iOS, Roboto on Android, Inter on web.
  web: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;
