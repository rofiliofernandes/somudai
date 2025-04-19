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
      // Screens must not talk to Supabase directly; go through src/hooks.
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
]);
