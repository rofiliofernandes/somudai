import { buttonLabel, countLabel, isEnded, tapAccessibilityLabel, tapState } from './tapWording';

const future = new Date(Date.now() + 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();

describe('honest Tap wording', () => {
  it('uses the exact button words from CLAUDE.md', () => {
    expect(buttonLabel('action', 'ready')).toBe("I'm joining");
    expect(buttonLabel('stance', 'ready')).toBe('I stand with this');
    expect(buttonLabel('action', 'joined')).toBe('Joined');
    expect(buttonLabel('stance', 'standing')).toBe('Standing with this');
    expect(buttonLabel('action', 'ended')).toBe('Event ended');
  });

  it('uses the exact count words', () => {
    expect(countLabel('action', 1284)).toBe('1,284 joined');
    expect(countLabel('stance', 12483)).toBe('12.4K stand with this');
    expect(countLabel('stance', 12483, 'full')).toBe('12,483 stand with this');
  });

  it('never claims attendance', () => {
    const all = [
      buttonLabel('action', 'ready'),
      buttonLabel('action', 'joined'),
      buttonLabel('action', 'ended'),
      buttonLabel('stance', 'ready'),
      buttonLabel('stance', 'standing'),
      countLabel('action', 5),
      countLabel('stance', 5),
      tapAccessibilityLabel({ type: 'action', title: 'X', tap_count: 1 }, 'joined'),
    ].join(' ');
    expect(all).not.toMatch(/participated|attended|showed up/i);
  });
});

describe('tap state', () => {
  it('derives the five states', () => {
    expect(tapState({ type: 'action', starts_at: future, tapped: false })).toBe('ready');
    expect(tapState({ type: 'action', starts_at: future, tapped: true })).toBe('joined');
    expect(tapState({ type: 'stance', starts_at: null, tapped: false })).toBe('ready');
    expect(tapState({ type: 'stance', starts_at: null, tapped: true })).toBe('standing');
    expect(tapState({ type: 'action', starts_at: past, tapped: false })).toBe('ended');
  });

  it('keeps showing my Tap on an ended event', () => {
    expect(tapState({ type: 'action', starts_at: past, tapped: true })).toBe('joined');
  });

  it('stances never end', () => {
    expect(isEnded({ type: 'stance', starts_at: past })).toBe(false);
  });
});

describe('accessibility label', () => {
  it('says the whole thing', () => {
    expect(tapAccessibilityLabel({ type: 'action', title: 'Beach Cleanup at Morjim', tap_count: 1284 }, 'ready')).toBe(
      "I'm joining Beach Cleanup at Morjim. 1,284 joined.",
    );
  });
});
