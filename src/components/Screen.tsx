import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, screenPadding } from '../theme/tokens';

type Props = {
  children: ReactNode;
  /** Wrap content in a ScrollView. Never use this for lists of posts. */
  scroll?: boolean;
  /** Drop the side padding (e.g. for full-width lists that pad themselves). */
  bleed?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
};

/** Safe-area wrapper with the bg colour and 16 side padding. */
export function Screen({ children, scroll, bleed, edges = ['top', 'left', 'right'], style }: Props) {
  const padding = bleed ? null : styles.padded;
  return (
    <SafeAreaView edges={edges} style={styles.root}>
      {scroll ? (
        <ScrollView contentContainerStyle={[padding, styles.scrollContent, style]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, padding, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: screenPadding },
  scrollContent: { flexGrow: 1 },
});
