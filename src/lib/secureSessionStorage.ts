import * as SecureStore from 'expo-secure-store';

// Supabase session storage for iOS and Android, kept entirely in the phone's
// secure storage (Keychain / Keystore), never in AsyncStorage.
//
// SecureStore warns above ~2 KB per item, and a Supabase session (with Google
// identity data) can be larger. Supabase's Expo guide solves this by
// encrypting into AsyncStorage; we instead split the value into chunks that
// each fit in SecureStore, so nothing about the session leaves secure storage.

const CHUNK_SIZE = 1800;
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

// SecureStore keys may only contain letters, numbers, ".", "-" and "_".
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');
const countKey = (key: string) => `${safeKey(key)}.chunks`;
const chunkKey = (key: string, i: number) => `${safeKey(key)}.${i}`;

async function removeChunks(key: string) {
  const raw = await SecureStore.getItemAsync(countKey(key), OPTIONS);
  const count = raw ? Number(raw) : 0;
  await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i), OPTIONS)),
  );
  await SecureStore.deleteItemAsync(countKey(key), OPTIONS);
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const raw = await SecureStore.getItemAsync(countKey(key), OPTIONS);
    if (!raw) return null;
    const count = Number(raw);
    const parts = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i), OPTIONS)),
    );
    // A missing chunk means a half-written session: treat it as signed out.
    if (parts.some((p) => p === null)) return null;
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c, OPTIONS)));
    // Write the count last so a crash mid-write never yields a partial session.
    await SecureStore.setItemAsync(countKey(key), String(chunks.length), OPTIONS);
  },

  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
  },
};
