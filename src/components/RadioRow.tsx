import { Pressable, StyleSheet, View } from 'react-native';
import { colors, space, touch } from '../theme/tokens';
import { Text } from './Text';

type Props = { label: string; selected: boolean; onPress: () => void };

/** One row in a single-choice list. */
export function RadioRow({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={styles.row}
    >
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      <View style={[styles.ring, selected && styles.ringOn]}>{selected ? <View style={styles.dot} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: touch.minSize + 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: space.md,
  },
  label: { flex: 1 },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOn: { borderColor: colors.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});
