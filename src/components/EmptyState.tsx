import { StyleSheet, View } from 'react-native';
import { space } from '../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  message: string;
  action?: { label: string; onPress: () => void };
};

/** One honest sentence and one helpful action. Never fill gaps with invented content. */
export function EmptyState({ message, action }: Props) {
  return (
    <View style={styles.root}>
      <Text variant="body" tone="secondary" style={styles.message}>
        {message}
      </Text>
      {action ? <Button label={action.label} variant="secondary" onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: space.xxxl, gap: space.xl, alignItems: 'stretch' },
  message: { textAlign: 'center' },
});
