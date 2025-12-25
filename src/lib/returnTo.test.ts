import { setReturnTo, takeReturnTo } from './returnTo';

it('returns an in-app path once', () => {
  setReturnTo('/post/10000000-0000-0000-0000-000000000001');
  expect(takeReturnTo()).toBe('/post/10000000-0000-0000-0000-000000000001');
  expect(takeReturnTo()).toBeNull();
});

it('refuses anything that could leave the app', () => {
  for (const bad of ['https://evil.example', '//evil.example', 'javascript:alert(1)', '/post?x=https://a']) {
    setReturnTo(bad);
    expect(takeReturnTo()).toBeNull();
  }
});
