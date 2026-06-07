import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, RadioRow, Screen, Text } from '../src/components';
import { useProfile, useUpdateProfile } from '../src/hooks/useProfile';
import { AREAS } from '../src/config/areas';
import { colors, radius, space, touch, type as typeTokens } from '../src/theme/tokens';

const BIO_MAX = 160; // matches the check in 0001_init.sql

/** A simple form: name, one-line bio, area. */
export default function EditProfile() {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [area, setArea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    setName(profile.data.display_name ?? '');
    setBio(profile.data.bio ?? '');
    setArea(profile.data.area);
  }, [profile.data]);

  const save = () => {
    setError(null);
    update.mutate(
      { display_name: name.trim() || null, bio: bio.trim() || null, area },
      {
        onSuccess: () => router.back(),
        onError: () => setError("That didn't save. Try again."),
      },
    );
  };

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        Edit profile
      </Text>

      <Field label="Name">
        <TextInput value={name} onChangeText={setName} maxLength={60} autoComplete="name" accessibilityLabel="Name" style={styles.input} />
      </Field>

      <Field label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
        <TextInput value={bio} onChangeText={setBio} maxLength={BIO_MAX} accessibilityLabel="Bio" style={styles.input} />
      </Field>

      <Field label="Area">
        <View accessibilityRole="radiogroup">
          {AREAS.map((a) => (
            <RadioRow key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
          ))}
        </View>
      </Field>

      <View style={styles.footer}>
        {error ? (
          <Text variant="meta" tone="danger" style={styles.center}>
            {error}
          </Text>
        ) : null}
        <Button label="Save" onPress={save} loading={update.isPending} />
        <Button label="Cancel" variant="secondary" onPress={() => router.back()} disabled={update.isPending} />
      </View>
    </Screen>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <Text variant="meta" tone="secondary">
          {label}
        </Text>
        {hint ? (
          <Text variant="meta" tone="secondary">
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: space.xl, paddingBottom: space.md },
  field: { marginTop: space.lg, gap: space.sm },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between' },
  input: {
    ...typeTokens.body,
    minHeight: touch.minSize + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  footer: { marginTop: space.xxl, paddingBottom: space.xl, gap: space.md },
  center: { textAlign: 'center' },
});
