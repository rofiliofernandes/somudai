import type { FeedPost, PostType } from '../types/db';
import { formatCompact, formatFull, formatShortDate, formatWeekday } from './format';

// The only place Tap wording lives (CLAUDE.md rule 3). Never "participated",
// "attended" or "showed up": we cannot measure those.

export type TapState = 'ready' | 'joined' | 'standing' | 'ended';

/** Has this action already started? Stances never end. */
export function isEnded(post: Pick<FeedPost, 'type' | 'starts_at'>, now = Date.now()): boolean {
  return post.type === 'action' && !!post.starts_at && new Date(post.starts_at).getTime() <= now;
}

export function tapState(post: Pick<FeedPost, 'type' | 'starts_at' | 'tapped'>, now = Date.now()): TapState {
  if (post.tapped) return post.type === 'action' ? 'joined' : 'standing';
  if (isEnded(post, now)) return 'ended';
  return 'ready';
}

export function buttonLabel(type: PostType, state: TapState): string {
  switch (state) {
    case 'joined':
      return 'Joined';
    case 'standing':
      return 'Standing with this';
    case 'ended':
      return 'Event ended';
    case 'ready':
      return type === 'action' ? "I'm joining" : 'I stand with this';
  }
}

/** "1,284 joined" / "12.4K stand with this". compact = lists, full = detail. */
export function countLabel(type: PostType, n: number, style: 'compact' | 'full' = 'compact'): string {
  const num = style === 'compact' ? formatCompact(n) : formatFull(n);
  return type === 'action' ? `${num} joined` : `${num} stand with this`;
}

/** The whole thing, for screen readers: "I'm joining Beach Cleanup. 1,284 joined." */
export function tapAccessibilityLabel(post: Pick<FeedPost, 'type' | 'title' | 'tap_count'>, state: TapState): string {
  const count = countLabel(post.type, post.tap_count, 'full');
  switch (state) {
    case 'ready':
      return `${buttonLabel(post.type, state)} ${post.title}. ${count}.`;
    case 'joined':
      return `You're joining ${post.title}. ${count}. Double tap to undo.`;
    case 'standing':
      return `You stand with ${post.title}. ${count}. Double tap to undo.`;
    case 'ended':
      return `${post.title} has ended. ${count}.`;
  }
}

/**
 * The line above the detail Tap bar after someone Taps.
 * Action: "You're joining. See you on Sunday."
 * Stance: "You stand with this, alongside 12,483 people." (everyone else)
 */
export function confirmationLine(
  post: Pick<FeedPost, 'type' | 'starts_at' | 'tap_count'>,
  now = Date.now(),
): string {
  if (post.type === 'action') {
    if (!post.starts_at) return "You're joining.";
    const start = new Date(post.starts_at);
    const days = (start.getTime() - now) / 86_400_000;
    const when = days < 6 ? formatWeekday(post.starts_at) : formatShortDate(post.starts_at);
    return `You're joining. See you on ${when}.`;
  }
  const others = Math.max(0, post.tap_count - 1);
  if (others === 0) return "You're the first to stand with this.";
  return `You stand with this, alongside ${formatFull(others)} ${others === 1 ? 'person' : 'people'}.`;
}
