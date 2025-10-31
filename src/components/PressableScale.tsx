import { useRef } from 'react';
import { Animated, Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { motion } from '../theme/tokens';
import { useReduceMotion } from '../hooks/useReduceMotion';

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

/** A Pressable with the gentle press scale (0.97 for 120 ms), skipped under reduce motion. */
export function PressableScale({ style, onPressIn, onPressOut, children, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduce = useReduceMotion();

  const to = (value: number) => {
    if (reduce) return;
    Animated.timing(scale, {
      toValue: value,
      duration: motion.press,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        to(motion.pressScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
    >
      {(state) => (
        <Animated.View style={[style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
