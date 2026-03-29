import { useCallback, useEffect, useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, ErrorState, PostRow, Screen, Skeleton, Text } from '../../../src/components';
import { useMatters } from '../../../src/hooks/useMatters';
import { useProfile } from '../../../src/hooks/useProfile';
import { usePosts } from '../../../src/hooks/usePosts';
import { usePostViewTracking } from '../../../src/hooks/usePostViewTracking';
import { track } from '../../../src/lib/analytics';
import type { FeedPost } from '../../../src/types/db';
import { colors, space, touch } from '../../../src/theme/tokens';

export default function MatterScreen() {
  const { matter: slug } = useLocalSearchParams<{ matter: string }>();
  const matters = useMatters();
  const profile = useProfile();
  const matter = matters.data?.find((m) => m.slug === slug);

  useEffect(() => {
    if (matter) track('matter_opened', { matter_id: matter.id });
  }, [matter]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.titles}>
          <Text variant="title" accessibilityRole="header" numberOfLines={1}>
            {matter?.name ?? ''}
          </Text>
          {profile.data?.area ? (
            <Text variant="meta" tone="secondary">
              Near you · {profile.data.area}
            </Text>
          ) : null}
        </View>
      </View>

      {matters.isPending ? (
        <Skeleton variant="row" />
      ) : matters.isError ? (
        <ErrorState onRetry={() => matters.refetch()} />
      ) : !matter ? (
        <EmptyState message="We couldn't find this matter." action={{ label: 'Back to Explore', onPress: () => router.replace('/explore') }} />
      ) : (
        <MatterPosts matterId={matter.id} matterName={matter.name} />
      )}
    </Screen>
  );
}

function MatterPosts({ matterId, matterName }: { matterId: number; matterName: string }) {
  const posts = usePosts({ matterId });
  const items = useMemo(() => posts.data?.pages.flat() ?? [], [posts.data]);
  const viewTracking = usePostViewTracking();
  const open = useCallback((post: FeedPost) => router.push(`/post/${post.id}`), []);

  if (posts.isPending) {
    return (
      <>
        <Skeleton variant="row" />
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </>
    );
  }
  if (posts.isError) return <ErrorState onRetry={() => posts.refetch()} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PostRow post={item} onOpen={open} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
      refreshControl={
        <RefreshControl refreshing={posts.isRefetching && !posts.isFetchingNextPage} onRefresh={() => void posts.refetch()} tintColor={colors.inkSecondary} />
      }
      ListFooterComponent={posts.isFetchingNextPage ? <Skeleton variant="row" /> : undefined}
      ListEmptyComponent={<EmptyState message={`Nothing in ${matterName} near you yet.`} />}
      {...viewTracking}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  back: { width: touch.minSize, height: touch.minSize, justifyContent: 'center', marginLeft: -space.sm, paddingLeft: space.sm },
  titles: { flex: 1 },
});
