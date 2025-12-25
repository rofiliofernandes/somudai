import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, PostImage, Text } from '../../src/components';
import { signInWithGoogle } from '../../src/lib/googleSignIn';
import { isValidEmail, sendMagicLink } from '../../src/lib/emailSignIn';
import { setReturnTo } from '../../src/lib/returnTo';
import { privacyUrl, termsUrl } from '../../src/config/site';
import { colors, radius, screenPadding, space, touch, type as typeTokens } from '../../src/theme/tokens';

// The coastal photo lives in the post-images bucket so no photo is bundled
// in the app. Upload it to post-images/welcome/coast.jpg (about 1600 px wide).
const WELCOME_PHOTO = 'welcome/coast.jpg';
const RESEND_AFTER_SECONDS = 30;

type Mode = 'choose' | 'email' | 'sent';

export default function Welcome() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (returnTo) setReturnTo(returnTo);
  }, [returnTo]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const google = async () => {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
      // The gate moves us on once the session arrives.
    } catch {
      setError("That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const sendLink = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy('email');
    try {
      await sendMagicLink(email);
      setMode('sent');
      setResendIn(RESEND_AFTER_SECONDS);
    } catch {
      setError("That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={styles.photoWrap}>
            <PostImage path={WELCOME_PHOTO} style={StyleSheet.absoluteFill} />
          </View>
          <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.content}>
            {mode === 'choose' && (
              <>
                <Text variant="display" accessibilityRole="header">
                  See what matters. Connect. Tap.
                </Text>
                <Text variant="body" tone="secondary" style={styles.sub}>
                  Turn care into action.
                </Text>
                <View style={styles.actions}>
                  <Button label="Continue with Google" onPress={google} loading={busy === 'google'} />
                  <Button
                    label="Continue with email"
                    variant="secondary"
                    onPress={() => {
                      setError(null);
                      setMode('email');
                    }}
                    disabled={busy !== null}
                  />
                </View>
              </>
            )}

            {mode === 'email' && (
              <>
                <Text variant="display" accessibilityRole="header">
                  Sign in with email
                </Text>
                <Text variant="body" tone="secondary" style={styles.sub}>
                  We'll send you a link. No password needed.
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.inkSecondary}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={sendLink}
                  accessibilityLabel="Email address"
                  style={styles.input}
                />
                <View style={styles.actions}>
                  <Button label="Send me a link" onPress={sendLink} loading={busy === 'email'} />
                  <TextLink label="Back" onPress={() => setMode('choose')} />
                </View>
              </>
            )}

            {mode === 'sent' && (
              <>
                <Text variant="display" accessibilityRole="header">
                  Check your inbox
                </Text>
                <Text variant="body" tone="secondary" style={styles.sub}>
                  We sent a sign-in link to {email.trim()}. Open it on this device.
                </Text>
                <View style={styles.actions}>
                  {resendIn > 0 ? (
                    <Text variant="meta" tone="secondary" style={styles.center}>
                      You can resend the link in {resendIn}s
                    </Text>
                  ) : (
                    <TextLink label="Resend the link" onPress={sendLink} />
                  )}
                  <TextLink label="Use a different email" onPress={() => setMode('email')} />
                </View>
              </>
            )}

            {error ? (
              <Text variant="meta" tone="danger" style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            <Text variant="meta" tone="secondary" style={styles.legal}>
              By continuing you agree to our{' '}
              <Text variant="meta" style={styles.link} onPress={() => Linking.openURL(termsUrl)} accessibilityRole="link">
                Terms
              </Text>{' '}
              and{' '}
              <Text variant="meta" style={styles.link} onPress={() => Linking.openURL(privacyUrl)} accessibilityRole="link">
                Privacy Policy
              </Text>
            </Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.textLink}>
      <Text variant="headline">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  photoWrap: { height: '60%', minHeight: 280, backgroundColor: colors.skeleton },
  content: { flex: 1, paddingHorizontal: screenPadding, paddingTop: space.xl, paddingBottom: space.xl },
  sub: { marginTop: space.sm },
  actions: { marginTop: space.xl, gap: space.md },
  input: {
    ...typeTokens.body,
    marginTop: space.xl,
    minHeight: touch.minSize + 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  textLink: { minHeight: touch.minSize, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  error: { marginTop: space.md, textAlign: 'center' },
  legal: { marginTop: 'auto', paddingTop: space.xl, textAlign: 'center' },
  link: { textDecorationLine: 'underline', color: colors.inkSecondary },
});
