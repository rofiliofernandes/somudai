import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Button, Screen, Text } from '../src/components';
import { completeSignInFromUrl } from '../src/lib/emailSignIn';
import { useSession } from '../src/hooks/useSession';
import { takeReturnTo } from '../src/lib/returnTo';
import { colors, space } from '../src/theme/tokens';

/** Where magic links and web Google sign-in land. */
export default function AuthCallback() {
  const url = Linking.useLinkingURL();
  const { session } = useSession();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // On the web, supabase-js finishes sign-in from the URL by itself.
    if (Platform.OS === 'web' || !url) return;
    completeSignInFromUrl(url).catch(() => setFailed(true));
  }, [url]);

  useEffect(() => {
    if (session) router.replace((takeReturnTo() ?? '/') as never);
  }, [session]);

  if (failed) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text variant="title" style={styles.text}>
            That link didn't work
          </Text>
          <Text variant="body" tone="secondary" style={styles.text}>
            It may have expired, or been opened on a different device. Ask for a new one.
          </Text>
          <Button label="Back to sign in" onPress={() => router.replace('/welcome')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator color={colors.ink} accessibilityLabel="Signing you in" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', gap: space.lg },
  text: { textAlign: 'center' },
});
