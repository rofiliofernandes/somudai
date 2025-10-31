import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors, motion } from '../theme/tokens';
import { imageUrl } from '../lib/images';

type Props = {
  path: string | null;
  aspectRatio?: number;
  size?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
};

/** A cropped, never-stretched photo with a fixed shape so lists don't jump. */
export function PostImage({ path, aspectRatio, size, rounded = 0, style }: Props) {
  const uri = imageUrl(path);
  const shape: ViewStyle = size ? { width: size, height: size } : { width: '100%', aspectRatio };
  return (
    <View style={[shape, { borderRadius: rounded, overflow: 'hidden', backgroundColor: colors.skeleton }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={motion.fade}
          cachePolicy="memory-disk"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}
