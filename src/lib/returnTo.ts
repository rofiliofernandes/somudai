import { Platform } from 'react-native';

// Where to go after sign-in (e.g. the post someone was about to Tap).
// Kept in sessionStorage on the web because Google sign-in leaves the page.
// Only in-app paths are accepted, so this can never redirect off-site.

const KEY = 'somudai.returnTo';
let memory: string | null = null;

const isSafePath = (p: string) => /^\/(?!\/)[A-Za-z0-9/_-]*$/.test(p);

export function setReturnTo(path: string | null | undefined) {
  const value = path && isSafePath(path) ? path : null;
  memory = value;
  if (Platform.OS === 'web') {
    try {
      if (value) window.sessionStorage.setItem(KEY, value);
      else window.sessionStorage.removeItem(KEY);
    } catch {
      // Storage can be unavailable (private mode); memory still works.
    }
  }
}

/** Read and clear. */
export function takeReturnTo(): string | null {
  let value = memory;
  if (!value && Platform.OS === 'web') {
    try {
      value = window.sessionStorage.getItem(KEY);
    } catch {
      value = null;
    }
  }
  setReturnTo(null);
  return value && isSafePath(value) ? value : null;
}
