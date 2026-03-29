import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorState, PostImage, Screen, Skeleton, Text } from '../../../src/components';
import { useMatters, useMyMatters } from '../../../src/hooks/useMatters';
import type { Matter } from '../../../src/types/db';
import { colors, space, touch } from '../../../src/theme/tokens';

/** One row per matter, your chosen matters first. No filters, grids or search. */
export default function ExploreIndex() {
  const matters = useMatters();
  const mine = useMyMatters();

  const ordered = useMemo(() => {
    const chosen = new Set(mine.data ?? []);
    return [...(matters.data ?? [])].sort((a, b) => Number(chosen.has(b.id)) - Number(chosen.has(a.id)) || a.id - b.id);
  }, [matters.data, mine.data]);

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        What matters to you?
      </Text>
      {matters.isPending ? (
        <>
          <Skeleton variant="row" />
          <Skeleton variant="row" />
          <Skeleton variant="row" />
        </>
      ) : matters.isError ? (
        <ErrorState onRetry={() => matters.refetch()} />
      ) : (
        <FlatList data={ordered} keyExtractor={(m) => String(m.id)} renderItem={({ item }) => <MatterRow matter={item} />} />
      )}
    </Screen>
  );
}

function MatterRow({ matter }: { matter: Matter }) {
  return (
    <Pressable
      onPress={() => router.push(`/explore/${matter.slug}`)}
      accessibilityRole="button"
      accessibilityLabel={`${matter.name}. Open matter.`}
      style={styles.row}
    >
      <PostImage path={matter.image_path} size={56} rounded={16} />
      <Text variant="headline" style={styles.name}>
        {matter.name}
      </Text>
      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color={colors.inkSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: space.md, paddingBottom: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minSize + 24,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { flex: 1 },
  chevron: { width: touch.minSize, alignItems: 'flex-end' },
});
