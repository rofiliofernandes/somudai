import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button, ErrorState, MatterChip, Screen, Skeleton, Text } from '../../src/components';
import { useSession } from '../../src/hooks/useSession';
import { useProfile } from '../../src/hooks/useProfile';
import { useMatters, useMyMatters } from '../../src/hooks/useMatters';
import { useMyTaps } from '../../src/hooks/useMyTaps';
import { signOut, useDeleteAccount } from '../../src/hooks/useAccount';
import { GRIEVANCE_EMAIL, privacyUrl, termsUrl } from '../../src/config/site';
import { colors, space, touch } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const { user } = useSession();
  const profile = useProfile();
  const matters = useMatters();
  const mine = useMyMatters();
  const taps = useMyTaps();

  const name = profile.data?.display_name ?? (user?.user_metadata?.full_name as string | undefined) ?? null;
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const myMatters = (matters.data ?? []).filter((m) => mine.data?.includes(m.id));

  if (profile.isPending) {
    return (
      <Screen>
        <Skeleton variant="row" />
      </Screen>
    );
  }
  if (profile.isError) {
    return (
      <Screen>
        <ErrorState onRetry={() => profile.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.top}>
        <Avatar name={name} uri={avatarUrl} size={72} />
        <View style={styles.topText}>
          <Text variant="title">{name ?? 'Your profile'}</Text>
          {profile.data?.area ? (
            <Text variant="meta" tone="secondary">
              {profile.data.area}
            </Text>
          ) : null}
        </View>
        <LinkButton label="Edit" onPress={() => router.push('/edit-profile')} />
      </View>
      {profile.data?.bio ? <Text variant="body">{profile.data.bio}</Text> : null}

      <Section title="My matters" action={{ label: 'Edit', onPress: () => router.push({ pathname: '/matters', params: { edit: '1' } }) }}>
        <View style={styles.chips}>
          {myMatters.map((m) => (
            <MatterChip key={m.id} label={m.name} selected />
          ))}
        </View>
      </Section>

      <Section title="Joined and standing with" note="Only you can see this.">
        {taps.isPending ? (
          <Skeleton variant="row" />
        ) : taps.isError ? (
          <ErrorState onRetry={() => taps.refetch()} />
        ) : taps.data.length === 0 ? (
          <Text variant="body" tone="secondary">
            Nothing yet. When you join something or stand with it, it shows up here.
          </Text>
        ) : (
          taps.data.map((t) =>
            t.post ? (
              <Pressable
                key={t.post_id}
                onPress={() => router.push(`/post/${t.post_id}`)}
                accessibilityRole="button"
                style={styles.tapRow}
              >
                <Text variant="body" style={styles.flex} numberOfLines={2}>
                  {t.post.title}
                </Text>
                <Text variant="meta" tone="secondary">
                  {t.post.type === 'action' ? 'Joined' : 'Standing with'}
                </Text>
              </Pressable>
            ) : null,
          )
        )}
      </Section>

      <View style={styles.links}>
        <ListLink label="Privacy policy" onPress={() => Linking.openURL(privacyUrl)} />
        <ListLink label="Terms" onPress={() => Linking.openURL(termsUrl)} />
        <ListLink label="Contact" onPress={() => Linking.openURL(`mailto:${GRIEVANCE_EMAIL}`)} />
        <ListLink label="Sign out" onPress={() => void signOut()} />
      </View>

      <DeleteAccount />
    </Screen>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteAccount();

  if (!confirming) {
    return (
      <View style={styles.danger}>
        <ListLink label="Delete account" danger onPress={() => setConfirming(true)} />
      </View>
    );
  }
  return (
    <View style={[styles.danger, styles.confirmBox]}>
      <Text variant="body">This deletes your profile and every Tap. It can't be undone.</Text>
      {del.isError ? (
        <Text variant="meta" tone="danger">
          That didn't work. Try again.
        </Text>
      ) : null}
      <Button label="Delete my account" variant="danger" loading={del.isPending} onPress={() => del.mutate()} />
      <Button label="Keep my account" variant="secondary" onPress={() => setConfirming(false)} disabled={del.isPending} />
    </View>
  );
}

function Section({
  title,
  note,
  action,
  children,
}: {
  title: string;
  note?: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.flex}>
          <Text variant="headline" accessibilityRole="header">
            {title}
          </Text>
          {note ? (
            <Text variant="meta" tone="secondary">
              {note}
            </Text>
          ) : null}
        </View>
        {action ? <LinkButton label={action.label} onPress={action.onPress} /> : null}
      </View>
      {children}
    </View>
  );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.linkButton} hitSlop={4}>
      <Text variant="meta" style={styles.underline}>
        {label}
      </Text>
    </Pressable>
  );
}

function ListLink({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.listLink}>
      <Text variant="body" tone={danger ? 'danger' : 'ink'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingTop: space.xl, paddingBottom: space.md },
  topText: { flex: 1, gap: 2 },
  section: { marginTop: space.xxl, gap: space.md },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touch.minSize + 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  links: { marginTop: space.xxl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  listLink: {
    minHeight: touch.minSize + 8,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  danger: { marginTop: space.xl, marginBottom: space.xxxl },
  confirmBox: { gap: space.md },
  linkButton: { minHeight: touch.minSize, minWidth: touch.minSize, alignItems: 'flex-end', justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
});
