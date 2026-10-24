import { Arrow } from '../../components/Arrow';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { Button, Fade, Header, Label, openLink, Photo, s, Screen, T, Tap } from '../../components/ui';
import data from '../../content.json';
import { useClub } from '../../providers/ClubProvider';
import { colors as c, fonts as f } from '../../theme';
function Answer({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const { reducedMotion } = useClub();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(value, { toValue: open ? 1 : 0, duration: reducedMotion ? 0 : 250, useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [open, reducedMotion, value]);
  return <View style={{ backgroundColor: [c.blush, c.sky, c.sage][index % 3], padding: 22, borderRadius: 23, gap: 12, transform: [{ rotate: index % 2 ? '1deg' : '-1deg' }] }}>
    <Tap accessibilityLabel={question} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ gap: 12 }}>
      <View style={s.row}><Label style={{ flex: 1 }}>A little question / 0{index + 1}</Label><Animated.View style={{ transform: [{ rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }}><Feather name="plus" size={22} color={c.navy} /></Animated.View></View>
      <T serif style={{ fontSize: 28, lineHeight: 31 }}>{question}</T>
    </Tap>{open && <Fade><T style={{ fontSize: 14, lineHeight: 23 }}>{answer}</T></Fade>}
  </View>;
}
export default function Club() {
  return <Screen><Header /><Fade style={{ gap: 13 }}><Label>About the club</Label><T serif style={s.title}>We gather.{ '\n' }We give back<T italic style={s.title}>.</T></T><T style={{ color: c.muted }}>{data.story.lead}</T></Fade>
    <Photo path="/media/service-4.webp" alt="ABT sisterhood lunch" style={{ aspectRatio: 1.15 }} />
    <View style={{ gap: 16 }}>{data.story.body.map(paragraph => <T key={paragraph} style={{ color: c.muted }}>{paragraph}</T>)}</View>
    <View style={{ gap: 12 }}><Label>Why join us?</Label>{data.whyJoin.cards.map((card, index) => <View key={card.title} style={[s.row, { alignItems: 'flex-start', paddingVertical: 12 }]}><View style={{ width: 43, height: 43, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: [c.rose, c.sky, c.sage, c.blush][index] }}><Feather name={(['users', 'heart', 'star', 'globe'] as const)[index]} size={20} color={c.navy} /></View><View style={{ flex: 1, gap: 5 }}><T style={{ fontFamily: f.bold }}>{card.title}</T><T style={{ color: c.muted, fontSize: 13, lineHeight: 21 }}>{card.text}</T></View></View>)}</View>
    <View style={[s.card, { backgroundColor: c.navy }]}><T serif style={{ color: c.rose, fontSize: 53, lineHeight: 40 }}>“</T><T italic style={{ color: c.paper, fontSize: 26, lineHeight: 31 }}>{data.testimonial.quote}</T><Label style={{ color: c.sky }}>{data.testimonial.by}</Label></View>
    <View style={{ gap: 20 }}><Label>Before you join us</Label><T serif style={s.sectionTitle}>A few{ '\n' }questions<T italic style={s.sectionTitle}>.</T></T>{data.faq.items.map((item, index) => <Answer key={item.q} question={item.q} answer={item.a} index={index} />)}</View>
    <View style={{ gap: 16 }}><T serif style={s.sectionTitle}>Say hello to ABT.</T><T style={{ color: c.muted }}>Ask about membership, volunteering or partnering with the club. We’d love to hear from you.</T><Button title="Get in touch" onPress={() => router.push('/join')} /><Tap onPress={() => { void openLink(data.site.instagram); }} style={[s.row, { justifyContent: 'center', padding: 10 }]}><T style={{ textAlign: 'center', fontSize: 12 }}>{data.site.handle}</T><Arrow size={16} /></Tap></View>
  </Screen>;
}
