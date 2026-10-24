import { Arrow } from './Arrow';
import { router } from 'expo-router';
import { View } from 'react-native';
import data from '../content.json';
import { useClub } from '../providers/ClubProvider';
import { colors as c } from '../theme';
import { Fade, IconButton, Label, Photo, s, T, Tap } from './ui';
export type Social = typeof data.socials[number];
export function EventCard({ event }: { event: Social }) {
  const { saved, toggleSaved, ready } = useClub();
  const selected = saved.includes(event.slug);
  return <Fade style={{ gap: 15, paddingBottom: 12 }}><View>
    <Tap accessibilityLabel={`View ${event.title}`} onPress={() => router.push({ pathname: '/event/[slug]', params: { slug: event.slug } })}>
      <Photo path={event.slides[0].src} alt={event.slides[0].alt} style={{ aspectRatio: 1.28 }} />
      <View style={{ position: 'absolute', top: 14, left: 14, borderRadius: 15, backgroundColor: c.paper, paddingHorizontal: 12, paddingVertical: 7 }}><Label style={{ fontSize: 9 }}>Past social</Label></View>
    </Tap>
    <View style={{ position: 'absolute', right: 13, bottom: 13 }}><IconButton name="bookmark" selected={selected} disabled={!ready} label={`${selected ? 'Unsave' : 'Save'} ${event.title}`} onPress={() => { void toggleSaved(event.slug); }} /></View>
  </View><Tap accessibilityLabel={`Read ${event.title}`} onPress={() => router.push({ pathname: '/event/[slug]', params: { slug: event.slug } })} style={{ gap: 7 }}>
    <Label style={{ color: c.muted, letterSpacing: 1 }}>{event.date} · {event.tags[0]}</Label>
    <View style={s.row}><T serif style={{ fontSize: 31, lineHeight: 33, flex: 1 }}>{event.title}</T><Arrow size={23} color={c.navy} /></View>
    <T style={{ color: c.muted, fontSize: 13 }}>{event.cause}</T>
  </Tap></Fade>;
}
