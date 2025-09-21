// Count and date formatting. Pure functions, unit-tested in format.test.ts.

/** 1284 -> "1,284". */
export function formatFull(n: number): string {
  return Math.max(0, Math.trunc(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Counts in lists: full number with commas under 10,000, then one decimal and
 * K/M (12.4K). Detail screens use formatFull instead.
 */
export function formatCompact(n: number): string {
  if (n < 10_000) return formatFull(n);
  if (n < 1_000_000) return `${trimDecimal(Math.floor(n / 100) / 10)}K`;
  return `${trimDecimal(Math.floor(n / 100_000) / 10)}M`;
}

function trimDecimal(x: number): string {
  return x.toFixed(1).replace(/\.0$/, '');
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Sun 13 Dec", in the phone's local time. */
export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "7:30 AM". */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Sunday", for "See you on Sunday." */
export function formatWeekday(iso: string): string {
  return LONG_DAYS[new Date(iso).getDay()] ?? '';
}

/** Initials for the avatar fallback: "Asha Naik" -> "AN". */
export function initials(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** "Environment · North Goa · Sun 13 Dec" (date only for actions). */
export function metaLine(post: {
  matter_name: string;
  area: string | null;
  type: 'action' | 'stance';
  starts_at: string | null;
}): string {
  const parts = [post.matter_name];
  if (post.area) parts.push(post.area);
  if (post.type === 'action' && post.starts_at) parts.push(formatShortDate(post.starts_at));
  return parts.join(' · ');
}
