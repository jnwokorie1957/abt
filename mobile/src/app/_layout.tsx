import Feather from '@expo/vector-icons/Feather';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClubProvider, useClub } from '../providers/ClubProvider';
import { colors as c } from '../theme';

void SplashScreen.preventAutoHideAsync();
function Routes() {
  const { reducedMotion } = useClub();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.cream }, animation: reducedMotion ? 'none' : 'slide_from_right' }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="event/[slug]" />
    <Stack.Screen name="join" options={{ presentation: 'modal', animation: reducedMotion ? 'none' : 'slide_from_bottom' }} />
  </Stack>;
}
export default function RootLayout() {
  const [loaded, error] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic, ...Feather.font });
  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: c.cream, justifyContent: 'center' }}><ActivityIndicator color={c.navy} /></View>;
  return <SafeAreaProvider><ClubProvider><StatusBar style="dark" /><Routes /></ClubProvider></SafeAreaProvider>;
}
