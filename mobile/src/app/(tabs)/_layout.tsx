import { Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';
import { useClub } from '../../providers/ClubProvider';
import { colors } from '../../theme';
export default function TabLayout() {
  const { reducedMotion } = useClub();
  return <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade', sceneStyle: { backgroundColor: colors.cream } }}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="socials" options={{ title: 'Socials' }} />
    <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    <Tabs.Screen name="club" options={{ title: 'The club' }} />
    <Tabs.Screen name="you" options={{ title: 'You' }} />
  </Tabs>;
}
