import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EventCard } from '../../components/EventCard';
import { Button, Fade, Header, Label, openLink, s, Screen, T, Tap } from '../../components/ui';
import data from '../../content.json';
import { colors as c, fonts as f } from '../../theme';
const filters = ['All socials', 'Socials', 'Service', 'Wellness'];
export default function Socials() {
  const [filter, setFilter] = useState(0);
  const events = data.socials.filter((event, index) => filter === 0 || index === filter - 1);
  return <Screen><Header /><Fade style={{ gap: 13 }}><Label>Photos, videos and local causes</Label><T serif style={s.title}>Our past{ '\n' }socials<T italic style={s.title}>.</T></T><T style={{ color: c.muted }}>A look at the gatherings and the causes we’ve supported.</T></Fade>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {filters.map((label, index) => <Tap key={label} onPress={() => setFilter(index)} accessibilityState={{ selected: index === filter }} style={{ minHeight: 44, justifyContent: 'center', borderRadius: 23, paddingHorizontal: 17, backgroundColor: index === filter ? c.navy : c.paper }}><T style={{ fontSize: 12, fontFamily: f.medium, color: index === filter ? c.paper : c.navy }}>{label}</T></Tap>)}
    </ScrollView>
    <View key={filter} style={{ gap: 24 }}>{events.map(event => <EventCard key={event.slug} event={event} />)}</View>
    <View style={[s.card, { backgroundColor: c.sky }]}><Label>Upcoming dates</Label><T serif style={s.sectionTitle}>Join us next time.</T><T>These events have ended. Follow ABT on Instagram for new dates and ticket links.</T><Button title="Follow ABT on Instagram" onPress={() => { void openLink(data.site.instagram); }} /></View>
  </Screen>;
}
