import { StyleSheet, View } from 'react-native';
import { aspect, colors, radius, space } from '../theme/tokens';

type Props = { variant: 'card' | 'row' | 'detail' };

const Block = ({ w, h, r = 6 }: { w: number | `${number}%`; h: number; r?: number }) => (
  <View style={{ width: w, height: h, borderRadius: r, backgroundColor: colors.skeleton }} />
);

/** Grey placeholder blocks in the shape of the real content. No spinners. */
export function Skeleton({ variant }: Props) {
  if (variant === 'row') {
    return (
      <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Block w={56} h={56} r={radius.photo / 2} />
        <View style={styles.rowText}>
          <Block w="80%" h={16} />
          <Block w="40%" h={12} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ aspectRatio: variant === 'detail' ? aspect.detail : aspect.card, backgroundColor: colors.skeleton, borderRadius: variant === 'detail' ? 0 : radius.photo }} />
      <View style={styles.cardText}>
        <Block w="45%" h={12} />
        <Block w="85%" h={18} />
        <Block w="100%" h={14} />
        <Block w="70%" h={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.xl },
  cardText: { gap: space.sm, paddingTop: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowText: { flex: 1, gap: space.sm },
});
