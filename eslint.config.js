// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'coverage/*', 'supabase/functions/*', '.expo/*'],
  },
  {
    rules: {
      // React Native <Text> renders apostrophes and quotes as-is.
      'react/no-unescaped-entities': 'off',
      // The auth session lives in SecureStore, never AsyncStorage.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message: 'Store the session with expo-secure-store (see src/lib/secureSessionStorage.ts).',
            },
          ],
        },
      ],
    },
  },
  {
    // Screens never call Supabase directly; they go through src/hooks.
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: '@react-native-async-storage/async-storage', message: 'Use expo-secure-store for anything sensitive.' }],
          patterns: [{ group: ['**/lib/supabase'], message: 'Screens call hooks in src/hooks, not Supabase.' }],
        },
      ],
    },
  },
]);
