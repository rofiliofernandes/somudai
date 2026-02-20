import { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, PostCard, Skeleton, Text } from '../../src/components';
import { usePosts } from '../../src/hooks/usePosts';
import { usePostViewTracking } from '../../src/hooks/usePostViewTracking';
import type { FeedPost } from '../../src/types/db';
import { colors, screenPadding, space } from '../../src/theme/tokens';

export default function Home() {
  const posts = usePosts();
  const items = useMemo(() => posts.data?.pages.flat() ?? [], [posts.data]);
  const viewTracking = usePostViewTracking();

  const open = useCallback((post: FeedPost) => router.push(`/post/${post.id}`), []);
  const renderItem = useCallback(({ item }: { item: FeedPost }) => <PostCard post={item} onOpen={open} source="home" />, [open]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.root}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          Somudai
        </Text>
      </View>

      {posts.isPending ? (
        <View style={styles.list}>
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </View>
      ) : posts.isError ? (
        <View style={styles.list}>
          <ErrorState onRetry={() => posts.refetch()} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          onEndReachedThreshold={0.6}
          onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
          refreshControl={
            <RefreshControl refreshing={posts.isRefetching && !posts.isFetchingNextPage} onRefresh={() => posts.refetch()} tintColor={colors.inkSecondary} />
          }
          ListFooterComponent={posts.isFetchingNextPage ? <Skeleton variant="card" /> : null}
          ListEmptyComponent={
            <EmptyState
              message="Nothing near you yet. New matters are added every week."
              action={{ label: 'Explore matters', onPress: () => router.push('/explore') }}
            />
          }
          {...viewTracking}
        />
      )}
    </SafeAreaView>
  );
}

const Separator = () => <View style={{ height: space.xl }} />;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: screenPadding, paddingVertical: space.md },
  list: { paddingHorizontal: screenPadding, paddingBottom: space.xxl, paddingTop: space.sm },
});
