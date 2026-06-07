import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, space, touch } from '../theme/tokens';
import { Screen } from './Screen';
import { Text } from './Text';

/** Plain page for /privacy, /terms and /contact. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen scroll>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color={colors.ink} />
      </Pressable>
      <Text variant="display" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text variant="body">{children}</Text>;
}

export function H({ children }: { children: ReactNode }) {
  return (
    <Text variant="headline" accessibilityRole="header" style={styles.h}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  back: { width: touch.minSize, height: touch.minSize, justifyContent: 'center', marginTop: space.sm },
  title: { marginTop: space.md },
  body: { gap: space.md, paddingVertical: space.xl, maxWidth: 680 },
  h: { marginTop: space.md },
});
