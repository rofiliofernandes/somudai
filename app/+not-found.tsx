import { router } from 'expo-router';
import { EmptyState, Screen } from '../src/components';

export default function NotFound() {
  return (
    <Screen>
      <EmptyState message="This page doesn't exist." action={{ label: 'Go to Home', onPress: () => router.replace('/') }} />
    </Screen>
  );
}
