import { useEffect } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, ErrorState, PostImage, Skeleton, TapButton, Text } from '../../src/components';
import { usePost } from '../../src/hooks/usePosts';
import { useTap } from '../../src/hooks/useTap';
import { markPostViewed } from '../../src/hooks/usePostViewTracking';
import { formatShortDate, formatTime } from '../../src/lib/format';
import { confirmationLine, countLabel, isEnded, tapState } from '../../src/lib/tapWording';
import { track } from '../../src/lib/analytics';
import { postUrl } from '../../src/config/site';
import type { FeedPost } from '../../src/types/db';
import { aspect, colors, radius, screenPadding, space, touch } from '../../src/theme/tokens';

/** Post detail. Open to anyone with a link; Tapping asks signed-out visitors to sign in. */
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { post, isPending, isError, refetch } = usePost(id);

  useEffect(() => {
    if (post) markPostViewed(post);
  }, [post]);

  if (isPending) {
    return (
      <View style={styles.root}>
        <Skeleton variant="detail" />
      </View>
    );
  }
  if (isError) {
    return (
      <SafeAreaView style={[styles.root, styles.padded]}>
        <ErrorState onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }
  if (!post) {
    return (
      <SafeAreaView style={[styles.root, styles.padded]}>
        <EmptyState message="This post isn't available." action={{ label: 'Go to Home', onPress: () => router.replace('/') }} />
      </SafeAreaView>
    );
  }
  return <PostDetailContent post={post} />;
}

function PostDetailContent({ post }: { post: FeedPost }) {
  const insets = useSafeAreaInsets();
  const tap = useTap();
  const state = tapState(post);
  // No "See you on Sunday" once the event has started.
  const showConfirmation = (state === 'joined' || state === 'standing') && !isEnded(post);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const share = async () => {
    const url = postUrl(post.id);
    try {
      const result = await Share.share({ title: post.title, message: `${post.title}\nJoin on Somudai\n${url}`, url });
      if (result.action === Share.sharedAction) track('share', { post_id: post.id });
    } catch {
      // The share sheet was closed or unavailable; nothing to do.
    }
  };

  const undo = () =>
    tap.mutate(
      { postId: post.id, tapped: true },
      { onSuccess: () => track('untap', { post_id: post.id, post_type: post.type }) },
    );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxxl }}>
        <View>
          <PostImage path={post.image_path} aspectRatio={aspect.detail} />
          <View style={[styles.floating, { top: insets.top + space.sm }]}>
            <FloatingButton icon="arrow-back" label="Back" onPress={goBack} />
            <FloatingButton icon="share-outline" label="Share" onPress={share} />
          </View>
        </View>

        <View style={styles.body}>
          <Text variant="meta" tone="secondary">
            {post.matter_name} · {post.type === 'action' ? 'Action' : 'Stance'}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {post.title}
          </Text>

          {post.type === 'action' && post.starts_at ? (
            <View style={styles.facts}>
              <Fact icon="calendar-outline" text={`${formatShortDate(post.starts_at)} · ${formatTime(post.starts_at)}`} />
              {post.place ? <Fact icon="location-outline" text={post.place} /> : null}
            </View>
          ) : null}
          <Text variant="meta" tone="secondary">
            By {post.organiser_name}
          </Text>

          {post.description ? (
            <Text variant="body" style={styles.description}>
              {post.description}
            </Text>
          ) : (
            <Text variant="body" style={styles.description}>
              {post.summary}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        {showConfirmation ? (
          <View style={styles.confirmation} accessibilityLiveRegion="polite">
            <Text variant="meta" style={styles.confirmationText}>
              {confirmationLine(post)}
            </Text>
            <Pressable onPress={undo} accessibilityRole="button" accessibilityLabel="Undo" style={styles.undo} hitSlop={8}>
              <Text variant="meta" tone="secondary" style={styles.undoText}>
                Undo
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.barRow}>
          <Text variant="meta" tone="secondary" style={styles.count}>
            {countLabel(post.type, post.tap_count, 'full')}
          </Text>
          <TapButton post={post} size="lg" source="detail" />
        </View>
      </View>
    </View>
  );
}

function FloatingButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.floatingButton}>
      <Ionicons name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={colors.inkSecondary} />
      <Text variant="body" style={styles.factText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: screenPadding },
  floating: {
    position: 'absolute',
    left: screenPadding,
    right: screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButton: {
    width: touch.minSize,
    height: touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: screenPadding, paddingTop: space.lg, gap: space.sm },
  facts: { gap: space.xs, marginTop: space.xs },
  fact: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  factText: { flex: 1 },
  description: { marginTop: space.md },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: screenPadding,
    paddingTop: space.md,
    gap: space.sm,
  },
  confirmation: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  confirmationText: { flex: 1, color: colors.accent },
  undo: { minHeight: touch.minSize, minWidth: touch.minSize, alignItems: 'center', justifyContent: 'center' },
  undoText: { textDecorationLine: 'underline' },
  barRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  count: { flexShrink: 1 },
});
