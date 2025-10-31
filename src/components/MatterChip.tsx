import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, touch } from '../theme/tokens';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** Rounded, selectable matter chip. Selected: accentSoft fill, accent border and tick. */
export function MatterChip({ label, selected = false, onPress }: Props) {
  const content = (
    <View style={styles.row}>
      {selected ? <Ionicons name="checkmark" size={16} color={colors.accent} style={styles.tick} /> : null}
      <Text variant="body" style={{ color: selected ? colors.accent : colors.ink }}>
        {label}
      </Text>
    </View>
  );
  const style = [styles.chip, selected ? styles.selected : styles.idle];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={style}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.minSize,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center' },
  tick: { marginRight: space.xs },
});
