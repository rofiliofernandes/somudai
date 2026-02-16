import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, type as typeTokens } from '../../src/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <Ionicons name={name} size={22} color={color as string} />;

/** Three tabs, icon + label. Active in ink, inactive in inkSecondary. No badges. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSecondary,
        tabBarLabelStyle: { fontSize: typeTokens.meta.fontSize },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('compass-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
