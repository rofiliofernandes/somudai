import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, RadioRow, Screen, Text } from '../../src/components';
import { useProfile, useUpdateProfile } from '../../src/hooks/useProfile';
import { useMyMatters } from '../../src/hooks/useMatters';
import { track } from '../../src/lib/analytics';
import { AREAS, type Area } from '../../src/config/areas';
import { space } from '../../src/theme/tokens';

/** Step 2 of 2: where are you? Saves profiles.area and opens Home. */
export default function YourArea() {
  const profile = useProfile();
  const update = useUpdateProfile();
  const myMatters = useMyMatters();
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = profile.data?.area;
    if (current && (AREAS as readonly string[]).includes(current)) setArea(current as Area);
  }, [profile.data?.area]);

  const onGo = () => {
    if (!area) return;
    setError(null);
    update.mutate(
      { area },
      {
        onSuccess: () => {
          track('onboarding_done', { matters_count: myMatters.data?.length ?? 0 });
          router.replace('/');
        },
        onError: () => setError("That didn't save. Try again."),
      },
    );
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="meta" tone="secondary">
          Step 2 of 2
        </Text>
        <Text variant="display" accessibilityRole="header">
          Where are you?
        </Text>
        <Text variant="body" tone="secondary">
          We'll show what's happening near you first.
        </Text>
      </View>

      <View accessibilityRole="radiogroup">
        {AREAS.map((a) => (
          <RadioRow key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text variant="meta" tone="secondary" style={styles.note}>
          We measure how Somudai is used (never what you say or who you are) to make it better.
        </Text>
        {error ? (
          <Text variant="meta" tone="danger" style={styles.note}>
            {error}
          </Text>
        ) : null}
        <Button label="Let's go" onPress={onGo} disabled={!area} loading={update.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, paddingTop: space.xxl, paddingBottom: space.xl },
  footer: { marginTop: 'auto', paddingTop: space.xxl, paddingBottom: space.xl, gap: space.md },
  note: { textAlign: 'center' },
});
