import { Arrow } from '../../components/Arrow';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Fade, Header, Label, openLink, Photo, s, Screen, T, Tap } from '../../components/ui';
import data from '../../content.json';
import { useClub } from '../../providers/ClubProvider';
import { colors as c, fonts as f } from '../../theme';

export default function Home() {
  const { user } = useClub();
  return <Screen><Header /><Fade style={{ gap: 17 }}>
    <Label style={{ marginTop: 9 }}>Houston social club</Label>
    <T serif style={s.title}>Meet the girls.<T italic style={s.title}>{'\n'}Give back.</T></T>
    <T style={{ color: c.muted, maxWidth: 290 }}>Meet women in Houston through socials, volunteer days and wellness mornings.</T>
    {user?.displayName && <T style={{ fontFamily: f.medium }}>Welcome back, {user.displayName.split(' ')[0]}.</T>}
  </Fade><Fade><View style={{ height: 346, marginHorizontal: -6 }}>
    <View style={{ position: 'absolute', width: '75%', left: 0, top: 8, transform: [{ rotate: '-5deg' }], backgroundColor: c.paper, padding: 9, paddingBottom: 36, borderRadius: 8, boxShadow: '0px 8px 20px #132E4715' }}>
      <Photo path="/media/gal-group-b.webp" alt="ABT members at the Galentine’s Soirée" style={{ height: 245, aspectRatio: undefined, borderRadius: 3 }} />
      <T italic style={{ textAlign: 'center', fontSize: 22, paddingTop: 8 }}>Galentine’s with the girls.</T>
    </View>
    <View style={{ position: 'absolute', right: -1, bottom: 96, width: '43%', transform: [{ rotate: '8deg' }], backgroundColor: c.paper, padding: 7, paddingBottom: 26, borderRadius: 6, boxShadow: '0px 8px 20px #132E4720' }}><Photo path="/media/gal-backdrop.webp" alt="Friends in pink at the ABT social" style={{ height: 170, aspectRatio: undefined, borderRadius: 2 }} /></View>
    <View style={{ position: 'absolute', right: 8, top: 0, backgroundColor: c.sky, width: 75, height: 75, borderRadius: 40, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '13deg' }] }}><Feather name="heart" size={26} color={c.navy} /><Label style={{ fontSize: 8, letterSpacing: 1 }}>with love</Label></View>
  </View><Button title="Introduce yourself" onPress={() => router.push('/join')} /></Fade>
    <View style={[s.card, { backgroundColor: c.navy, padding: 27 }]}>
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden' }}>
        <LinearGradient colors={['#132E47', '#294B61']} style={{ position: 'absolute', inset: 0 }} />
      </View>
      <View style={s.row}><Label style={{ color: c.sky, flex: 1 }}>Our Houston Food Bank service day</Label><Feather name="sun" color={c.rose} size={26} /></View>
      <T serif style={{ color: c.paper, fontSize: 65, lineHeight: 70 }}>~16,000</T>
      <T style={{ color: '#E6ECF0', fontSize: 14 }}>meals packed for Houston families at our Day of Service & Sisterhood.</T>
      <Tap onPress={() => router.push('/event/day-of-service')} style={s.row}><T style={{ color: c.rose, fontFamily: f.bold, flex: 1 }}>See our service day</T><Arrow direction="right" color={c.rose} size={20} /></Tap>
    </View>
    <View style={{ gap: 17 }}><View style={s.row}><T serif style={[s.sectionTitle, { flex: 1 }]}>What we do.</T></View>
      {data.pillars.items.map((pillar, index) => <Tap key={pillar.name} onPress={() => router.push('/socials')} style={{ backgroundColor: [c.blush, c.blue, c.sage][index], padding: 15, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Photo path={pillar.src} alt={pillar.name} style={{ width: 67, height: 73, aspectRatio: undefined, borderRadius: 15 }} /><View style={{ flex: 1 }}><Label style={{ fontSize: 8 }}>0{index + 1} / THE ABT WAY</Label><T serif style={{ fontSize: 25, lineHeight: 28 }}>{pillar.name}</T></View><Arrow size={19} color={c.navy} />
      </Tap>)}
    </View>
    <View style={{ paddingVertical: 15, gap: 15, alignItems: 'center' }}><T italic style={{ fontSize: 31, lineHeight: 35, textAlign: 'center' }}>Here’s to a{ '\n' }better tomorrow.</T><Label>A Better Tomorrow Social</Label><Button title="Follow ABT on Instagram" light onPress={() => { void openLink(data.site.instagram); }} /></View>
  </Screen>;
}
