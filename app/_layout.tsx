import { useEffect } from 'react';
import { Stack, router, useGlobalSearchParams, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../src/lib/queryClient';
import { SessionProvider, useSession } from '../src/hooks/useSession';
import { useProfile } from '../src/hooks/useProfile';
import { useMyMatters } from '../src/hooks/useMatters';
import { takeReturnTo } from '../src/lib/returnTo';
import { colors } from '../src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Routes anyone can open, signed in or not.
const PUBLIC_ROUTES = new Set(['post', 'auth-callback', 'privacy', 'terms', 'contact', '+not-found']);

/**
 * The sign-in gate. No session → Welcome. Session but no matters → matters.
 * No area → area. Otherwise → tabs. /post/[id] is open to anyone.
 */
function Gate() {
  const { session, loading } = useSession();
  const profile = useProfile();
  const myMatters = useMyMatters();
  const segments = useSegments();
  const params = useGlobalSearchParams<{ edit?: string }>();

  const signedIn = !!session;
  const checking = loading || (signedIn && (profile.isPending || myMatters.isPending));
  const needsMatters = signedIn && (myMatters.data?.length ?? 0) === 0;
  const needsArea = signedIn && !needsMatters && !profile.data?.area;

  useEffect(() => {
    if (checking) return;
    SplashScreen.hideAsync().catch(() => {});

    const root = segments[0] ?? '';
    const isPublic = PUBLIC_ROUTES.has(root);
    const inAuth = root === '(auth)';
    const inOnboarding = root === '(onboarding)';
    const leaf = segments[segments.length - 1];

    if (!signedIn) {
      if (!inAuth && !isPublic) router.replace('/welcome');
      return;
    }

    // Just signed in: go back to where they were (e.g. a shared post).
    if (inAuth) {
      const back = takeReturnTo();
      if (back) {
        router.replace(back as never);
        return;
      }
    }
    if (isPublic) return;

    if (needsMatters) {
      if (leaf !== 'matters') router.replace('/matters');
    } else if (needsArea) {
      if (leaf !== 'area') router.replace('/area');
    } else if (inAuth || (inOnboarding && params.edit !== '1')) {
      router.replace('/');
    }
  }, [checking, signedIn, needsMatters, needsArea, segments, params.edit]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style="dark" />
          <Gate />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="edit-profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
