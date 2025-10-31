import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, space, touch } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

/** Primary (black), secondary (outline) or danger. Full width by default. */
export function Button({ label, onPress, variant = 'primary', loading, disabled, accessibilityLabel, accessibilityHint }: Props) {
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? colors.onInk : variant === 'danger' ? colors.danger : colors.ink;
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[styles.base, styles[variant], disabled && styles.disabled]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <Text variant="headline" style={{ color: fg }}>
            {label}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.minSize + 8,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    borderWidth: 1,
  },
  inner: { alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.ink, borderColor: colors.ink },
  secondary: { backgroundColor: colors.surface, borderColor: colors.ink },
  danger: { backgroundColor: colors.surface, borderColor: colors.danger },
  disabled: { opacity: 0.4 },
});
