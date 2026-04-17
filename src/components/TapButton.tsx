import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, space, touch } from '../theme/tokens';
import { useTap } from '../hooks/useTap';
import { useSession } from '../hooks/useSession';
import { buttonLabel, tapAccessibilityLabel, tapState } from '../lib/tapWording';
import { track } from '../lib/analytics';
import type { FeedPost } from '../types/db';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type TapSource = 'home' | 'explore' | 'detail';

type Props = {
  post: FeedPost;
  size?: 'sm' | 'lg';
  source: TapSource;
  /** Called once the server has confirmed a Tap or un-Tap. */
  onConfirmed?: (result: { tapped: boolean }) => void;
};

/**
 * The one Tap button, with five honest states:
 * ready (action/stance), joined, standing, and ended.
 */
export function TapButton({ post, size = 'sm', source, onConfirmed }: Props) {
  const { session } = useSession();
  const tap = useTap();
  const state = tapState(post);
  const label = buttonLabel(post.type, state);
  const done = state === 'joined' || state === 'standing';
  const ended = state === 'ended';

  const onPress = () => {
    if (!session) {
      // Signed-out visitors (from a shared link) sign in, then come back here.
      router.push({ pathname: '/welcome', params: { returnTo: `/post/${post.id}` } });
      return;
    }
    if (ended) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    tap.mutate(
      { postId: post.id, tapped: post.tapped },
      {
        // Analytics only after the server confirms, never on press.
        onSuccess: () => {
          if (post.tapped) track('untap', { post_id: post.id, post_type: post.type });
          else track('tap', { post_id: post.id, post_type: post.type, source });
          onConfirmed?.({ tapped: !post.tapped });
        },
      },
    );
  };

  return (
    <PressableScale
      onPress={onPress}
      disabled={ended}
      accessibilityRole="button"
      accessibilityLabel={tapAccessibilityLabel(post, state)}
      accessibilityState={{ disabled: ended, selected: done }}
      hitSlop={size === 'sm' ? 4 : 0}
      style={[styles.base, size === 'lg' ? styles.lg : styles.sm, done ? styles.done : ended ? styles.ended : styles.ready]}
    >
      <View style={styles.row} testID={`tap-${post.id}`}>
        {done ? <Ionicons name="checkmark" size={16} color={colors.accent} style={styles.tick} /> : null}
        <Text
          variant={size === 'lg' ? 'headline' : 'meta'}
          numberOfLines={1}
          style={[styles.label, { color: done ? colors.accent : ended ? colors.inkSecondary : colors.onInk }]}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sm: { minHeight: touch.minSize, paddingHorizontal: space.lg },
  lg: { minHeight: touch.minSize + 8, paddingHorizontal: space.xl },
  ready: { backgroundColor: colors.ink, borderColor: colors.ink },
  done: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  ended: { backgroundColor: 'transparent', borderColor: colors.border, borderStyle: 'dashed' },
  row: { flexDirection: 'row', alignItems: 'center' },
  tick: { marginRight: space.xs },
  label: { fontWeight: '600' },
});
