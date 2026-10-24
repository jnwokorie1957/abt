import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { Button, Fade, Header, Label, s, Screen, T } from '../../components/ui';
import data from '../../content.json';
import { useClub } from '../../providers/ClubProvider';
import { colors as c } from '../../theme';
export default function Saved() {
  const { saved, ready, storageError } = useClub();
  const events = data.socials.filter(event => saved.includes(event.slug));
  return <Screen><Header /><Fade style={{ gap: 13 }}><Label>A little collection of good things</Label><T serif style={s.title}>For keeps<T italic style={s.title}>.</T></T><T style={{ color: c.muted }}>Your bookmarked ABT moments, saved on this device.</T></Fade>
    {!!storageError && <T accessibilityRole="alert" style={s.message}>{storageError}</T>}
    {!ready ? <ActivityIndicator color={c.navy} /> : events.length ? <View style={{ gap: 26 }}>{events.map(event => <EventCard event={event} key={event.slug} />)}</View> : <Fade style={[s.card, { alignItems: 'center', paddingVertical: 45, backgroundColor: c.blush }]}><View style={{ height: 88, width: 88, borderRadius: 44, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }] }}><Feather name="bookmark" size={33} color={c.navy} /></View><T serif style={{ fontSize: 35, lineHeight: 38, textAlign: 'center' }}>Something worth{ '\n' }coming back to.</T><T style={{ color: c.muted, textAlign: 'center' }}>Tap the bookmark on a social to start your collection.</T><Button title="Explore the scrapbook" onPress={() => router.push('/socials')} /></Fade>}
  </Screen>;
}
