import { formatCompact, formatFull, formatShortDate, formatTime, initials } from './format';

describe('formatFull', () => {
  it('adds commas', () => {
    expect(formatFull(0)).toBe('0');
    expect(formatFull(999)).toBe('999');
    expect(formatFull(1284)).toBe('1,284');
    expect(formatFull(12483)).toBe('12,483');
    expect(formatFull(1234567)).toBe('1,234,567');
  });
  it('never shows a negative count', () => {
    expect(formatFull(-3)).toBe('0');
  });
});

describe('formatCompact', () => {
  it('shows the full number under 10,000', () => {
    expect(formatCompact(9999)).toBe('9,999');
  });
  it('uses one decimal and K from 10,000, rounding down', () => {
    expect(formatCompact(10_000)).toBe('10K');
    expect(formatCompact(12_483)).toBe('12.4K');
    expect(formatCompact(12_499)).toBe('12.4K');
    expect(formatCompact(999_999)).toBe('999.9K');
  });
  it('uses M from a million', () => {
    expect(formatCompact(1_250_000)).toBe('1.2M');
  });
});

describe('dates', () => {
  // 13 Dec 2026 is a Sunday. Build it in local time so the test is timezone-proof.
  const iso = new Date(2026, 11, 13, 7, 5).toISOString();
  it('formats a short date', () => {
    expect(formatShortDate(iso)).toBe('Sun 13 Dec');
  });
  it('formats a 12-hour time', () => {
    expect(formatTime(iso)).toBe('7:05 AM');
    expect(formatTime(new Date(2026, 11, 13, 0, 0).toISOString())).toBe('12:00 AM');
    expect(formatTime(new Date(2026, 11, 13, 12, 30).toISOString())).toBe('12:30 PM');
  });
});

describe('initials', () => {
  it('takes first and last initials', () => {
    expect(initials('Asha Naik')).toBe('AN');
    expect(initials('asha')).toBe('A');
    expect(initials('  Rofilio  de  Fernandes ')).toBe('RF');
    expect(initials(null)).toBe('');
  });
});
