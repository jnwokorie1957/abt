import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, Fade, Field, Header, Label, openLink, Photo, s, Screen, SITE, T, Tap } from '../components/ui';
import data from '../content.json';
import { useClub } from '../providers/ClubProvider';
import { colors as c, fonts as f } from '../theme';
export default function Join() {
  const { user } = useClub();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [instagram, setInstagram] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  async function submit() {
    setError('');
    if (!name.trim() || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim()) || !consent) { setError('Add your name, a valid email, and permission for ABT to reply.'); return; }
    setBusy(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(`${SITE}/api/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim(), instagram: instagram.trim(), answers: data.join.quiz.map((question, index) => ({ q: question.q, a: answers[index] })) }), signal: controller.signal });
      if (!response.ok) throw new Error('The inquiry could not be sent. Please try again.');
      setDone(true);
    } catch (failure) { setError(failure instanceof Error && failure.message === 'The inquiry could not be sent. Please try again.' ? failure.message : 'Check your connection and try again.'); }
    finally { clearTimeout(timeout); setBusy(false); }
  }
  return <Screen modal><Header back />{done ? <Fade style={{ gap: 23 }}><View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.sky, justifyContent: 'center', alignItems: 'center' }}><Feather name="check" size={35} color={c.navy} /></View><Label>Your next chapter starts here</Label><T serif style={s.title}>You’re on{ '\n' }our radar<T italic style={s.title}>.</T></T><T>Thanks for introducing yourself. Your inquiry is saved securely for the ABT team to review.</T><Button title="Back to the good things" onPress={() => router.replace('/')} /></Fade> : <>
    <Fade style={{ gap: 14 }}><Label>A little hello goes a long way</Label><T serif style={s.title}>Tell us{ '\n' }about you<T italic style={s.title}>.</T></T><T style={{ color: c.muted }}>Three quick questions. A world of possibility.</T></Fade>
    {Platform.OS === 'web' ? <View style={s.card}><Photo path={data.join.photo} alt="ABT members together" style={{ aspectRatio: 1.6 }} /><T serif style={s.sectionTitle}>Let’s meet.</T><T>The browser preview opens our secure website form. In Expo Go, the full quiz runs right here in the app.</T><Button title="Open the ABT form" onPress={() => { void openLink(`${SITE}/#join`); }} /></View> : <>
      <View style={s.row}>{[0, 1, 2, 3].map(index => <View key={index} style={{ flex: 1, height: 4, borderRadius: 3, backgroundColor: index <= step ? c.navy : c.line }} />)}</View>
      {step < 3 ? <Fade key={step} style={{ gap: 20 }}><Label>0{step + 1} / 03</Label><T serif style={s.sectionTitle}>{data.join.quiz[step].q}</T>{data.join.quiz[step].options.map(option => <Tap key={option} onPress={() => { setAnswers(previous => { const next = [...previous]; next[step] = option; return next; }); setStep(step + 1); }} style={{ padding: 20, minHeight: 60, borderRadius: 19, backgroundColor: answers[step] === option ? c.rose : c.paper, flexDirection: 'row', gap: 12, alignItems: 'center' }}><T style={{ flex: 1, fontFamily: f.medium }}>{option}</T><Feather name="arrow-right" size={19} color={c.navy} /></Tap>)}</Fade> : <Fade style={{ gap: 20 }}><T serif style={s.sectionTitle}>Where can we find you?</T><Field label="Your name" value={name} onChangeText={setName} maxLength={120} autoComplete="name" /><Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={254} /><Field label="Instagram · optional" value={instagram} onChangeText={setInstagram} autoCapitalize="none" autoCorrect={false} maxLength={100} placeholder="@yourhandle" /><Tap accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(!consent)} style={[s.row, { alignItems: 'flex-start', paddingVertical: 8 }]}><View style={{ width: 24, height: 24, borderWidth: 1, borderColor: c.navy, borderRadius: 6, backgroundColor: consent ? c.navy : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{consent && <Feather name="check" size={17} color={c.paper} />}</View><T style={{ flex: 1, fontSize: 12, lineHeight: 20 }}>ABT may store these details and contact me about my inquiry. Please avoid sharing sensitive information.</T></Tap><Button title="Send my hello" busy={busy} onPress={() => { void submit(); }} /></Fade>}
      {!!error && <T accessibilityRole="alert" style={s.message}>{error}</T>}{step > 0 && <Tap disabled={busy} onPress={() => setStep(step - 1)} style={{ padding: 14 }}><T style={{ textAlign: 'center', fontSize: 12 }}>← Previous question</T></Tap>}
    </>}
  </>}</Screen>;
}
