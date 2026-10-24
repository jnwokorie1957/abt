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
  return <Screen><Header /><Fade style={{ gap: 13 }}><Label>Your bookmarks</Label><T serif style={s.title}>Saved socials<T italic style={s.title}>.</T></T><T style={{ color: c.muted }}>The socials you’ve bookmarked are saved on this device.</T></Fade>
    {!!storageError && <T accessibilityRole="alert" style={s.message}>{storageError}</T>}
    {!ready ? <ActivityIndicator color={c.navy} /> : events.length ? <View style={{ gap: 26 }}>{events.map(event => <EventCard event={event} key={event.slug} />)}</View> : <Fade style={[s.card, { alignItems: 'center', paddingVertical: 45, backgroundColor: c.blush }]}><View style={{ height: 88, width: 88, borderRadius: 44, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }] }}><Feather name="bookmark" size={33} color={c.navy} /></View><T serif style={{ fontSize: 35, lineHeight: 38, textAlign: 'center' }}>No saved{ '\n' }socials yet.</T><T style={{ color: c.muted, textAlign: 'center' }}>Tap the bookmark on any social to find it here.</T><Button title="Browse past socials" onPress={() => router.push('/socials')} /></Fade>}
  </Screen>;
}
