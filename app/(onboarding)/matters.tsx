import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, ErrorState, MatterChip, Screen, Skeleton, Text } from '../../src/components';
import { useMatters, useMyMatters, useSaveMyMatters } from '../../src/hooks/useMatters';
import { space } from '../../src/theme/tokens';

/** Step 1 of 2: pick at least one matter. Also reused from Profile (?edit=1). */
export default function ChooseMatters() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const matters = useMatters();
  const mine = useMyMatters();
  const save = useSaveMyMatters();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Start from what they already chose.
  useEffect(() => {
    if (mine.data) setSelected(new Set(mine.data));
  }, [mine.data]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onContinue = () => {
    setError(null);
    save.mutate([...selected], {
      onSuccess: () => {
        if (editing) router.back();
        else router.replace('/area');
      },
      onError: () => setError("That didn't save. Try again."),
    });
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        {!editing && (
          <Text variant="meta" tone="secondary">
            Step 1 of 2
          </Text>
        )}
        <Text variant="display" accessibilityRole="header">
          What matters to you?
        </Text>
        <Text variant="body" tone="secondary">
          Pick at least one. You can change this anytime.
        </Text>
      </View>

      {matters.isPending ? (
        <Skeleton variant="row" />
      ) : matters.isError ? (
        <ErrorState onRetry={() => matters.refetch()} />
      ) : (
        <View style={styles.chips}>
          {matters.data.map((m) => (
            <MatterChip key={m.id} label={m.name} selected={selected.has(m.id)} onPress={() => toggle(m.id)} />
          ))}
        </View>
      )}

      <View style={styles.footer}>
        {error ? (
          <Text variant="meta" tone="danger" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label={editing ? 'Save' : 'Continue'}
          onPress={onContinue}
          disabled={selected.size === 0}
          loading={save.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, paddingTop: space.xxl, paddingBottom: space.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  footer: { marginTop: 'auto', paddingTop: space.xxl, paddingBottom: space.xl, gap: space.md },
  error: { textAlign: 'center' },
});
