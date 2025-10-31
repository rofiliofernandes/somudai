import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/tokens';
import { initials } from '../lib/format';
import { Text } from './Text';

type Props = { name: string | null | undefined; uri?: string | null; size?: number };

/** Google photo when we have one, otherwise initials. */
export function Avatar({ name, uri, size = 64 }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={shape} contentFit="cover" accessibilityLabel={name ?? 'Profile photo'} />;
  }
  return (
    <View style={[shape, styles.fallback]} accessibilityLabel={name ?? 'Profile'}>
      <Text variant="title" tone="secondary">
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
