import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Fade, Header, IconButton, Label, media, openLink, Photo, s, Screen, T, Tap } from '../../components/ui';
import data from '../../content.json';
import { useClub } from '../../providers/ClubProvider';
import { colors as c } from '../../theme';
function Reel({ path }: { path: string }) {
  const player = useVideoPlayer(media(path));
  return <VideoView player={player} style={{ width: '100%', aspectRatio: .8, borderRadius: 23 }} nativeControls fullscreenOptions={{ enable: true }} contentFit="contain" />;
}
export default function Event() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const event = data.socials.find(item => item.slug === slug);
  const { saved, toggleSaved, ready, storageError } = useClub();
  const [slide, setSlide] = useState(0);
  if (!event) return <Screen modal><Header back /><T serif style={s.title}>Social not found.</T><Button title="Back to past socials" onPress={() => router.replace('/socials')} /></Screen>;
  const current = event.slides[slide] as { src: string; alt: string; video?: string };
  const selected = saved.includes(event.slug);
  return <Screen modal><Header back /><Fade style={{ gap: 14 }}><Label>{event.tags[0]} / Past social</Label><T serif style={[s.title, { fontSize: 48, lineHeight: 49 }]}>{event.title}</T><View style={s.row}><Feather name="calendar" size={15} color={c.muted} /><T style={{ color: c.muted, fontSize: 13 }}>{event.date} · Past social</T></View><View style={s.row}><Feather name="map-pin" size={15} color={c.muted} /><T style={{ color: c.muted, fontSize: 13, flex: 1 }}>{event.place}</T></View></Fade>
    <View style={{ gap: 15 }}>{current.video ? <Reel key={current.video} path={current.video} /> : <Photo key={current.src} path={current.src} alt={current.alt} style={{ aspectRatio: .92 }} />}
      <View style={s.row}><IconButton name="arrow-left" label="Previous photo" onPress={() => setSlide((slide - 1 + event.slides.length) % event.slides.length)} /><T style={{ flex: 1, textAlign: 'center', fontSize: 12, color: c.muted }}>{slide + 1} / {event.slides.length} · {current.video ? 'Film' : 'Photo'}</T><IconButton name="arrow-right" label="Next photo" onPress={() => setSlide((slide + 1) % event.slides.length)} /></View><T style={{ color: c.muted, textAlign: 'center', fontSize: 12 }}>{current.alt}</T>
    </View>
    <View style={[s.card, { backgroundColor: event.color }]}><Label style={{ color: event.ink }}>The cause we supported</Label><T serif style={{ color: event.ink, fontSize: 32, lineHeight: 35 }}>{event.cause}</T><T style={{ color: event.ink, fontSize: 14 }}>{event.blurb}</T></View>
    <Button title={selected ? 'Saved to your collection' : 'Save this social'} icon="bookmark" light disabled={!ready} onPress={() => { void toggleSaved(event.slug); }} />
    {!!storageError && <T accessibilityRole="alert" style={s.message}>{storageError}</T>}
    <View style={{ gap: 13 }}><T serif style={s.sectionTitle}>Join us next time.</T><T style={{ color: c.muted }}>This event has ended. Follow ABT on Instagram for new dates, or ask us about joining the club.</T><Button title="Follow ABT on Instagram" onPress={() => { void openLink(data.site.instagram); }} /><Tap onPress={() => router.push('/join')} style={{ padding: 12 }}><T style={{ textAlign: 'center', textDecorationLine: 'underline' }}>Ask about membership</T></Tap></View>
  </Screen>;
}
