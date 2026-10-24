import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Button, Fade, Field, Header, Label, openLink, s, Screen, T, Tap } from '../../components/ui';
import data from '../../content.json';
import { auth } from '../../lib/firebase';
import { authMessage } from '../../lib/auth-errors';
import { useClub } from '../../providers/ClubProvider';
import { colors as c, fonts as f } from '../../theme';

export default function You() {
  const { user, authReady, saved } = useClub();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  async function submit() {
    setMessage('');
    if (!email.trim() || (mode !== 'reset' && !password) || (mode === 'signup' && !name.trim())) { setMessage('Please complete the fields above.'); return; }
    if (mode === 'signup' && password.length < 6) { setMessage('Choose a password with at least 6 characters.'); return; }
    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('If an account exists for this email, a reset link is on its way.');
      } else if (mode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        try { await sendEmailVerification(result.user); setVerificationSent(true); }
        catch { setMessage('Account created. You can request a confirmation email below.'); }
        setPassword('');
      } else { await signInWithEmailAndPassword(auth, email.trim(), password); setPassword(''); }
    } catch (error) { setMessage(authMessage(error)); }
    finally { setBusy(false); }
  }
  async function verify() {
    if (!user) return;
    setBusy(true);
    try { await sendEmailVerification(user); setVerificationSent(true); setMessage('Confirmation email sent. Check your inbox.'); }
    catch (error) { setMessage(authMessage(error)); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true);
    try { await signOut(auth); setMessage(''); setVerificationSent(false); }
    catch (error) { setMessage(authMessage(error)); }
    finally { setBusy(false); }
  }
  return <Screen><Header /><Fade style={{ gap: 13 }}><Label>Your own little corner</Label><T serif style={s.title}>{user ? 'Hello, lovely.' : 'Come as you are'}<T italic style={s.title}>{user ? '' : '.'}</T></T><T style={{ color: c.muted }}>{user ? 'Good things happen when we show up together.' : 'Explore freely. Create an account whenever you feel at home.'}</T></Fade>
    {!authReady ? <ActivityIndicator color={c.navy} /> : user ? <Fade style={s.card}>
      <View style={[s.row, { alignItems: 'flex-start' }]}><View style={{ backgroundColor: c.blush, height: 62, width: 62, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}><T serif style={{ fontSize: 34, lineHeight: 40 }}>{(user.displayName || user.email || 'A')[0].toUpperCase()}</T></View><View style={{ flex: 1, gap: 5 }}><T serif style={{ fontSize: 29, lineHeight: 32 }}>{user.displayName || 'ABT friend'}</T><T style={{ color: c.muted, fontSize: 12 }}>{user.email}</T></View></View>
      <View style={{ backgroundColor: c.blue, padding: 16, borderRadius: 17, gap: 5 }}><Label>{user.emailVerified ? 'Email confirmed' : 'Confirm your email'}</Label><T style={{ fontSize: 13 }}>{user.emailVerified ? 'Your account is ready.' : verificationSent ? 'A confirmation link is in your inbox. After confirming, reopen the app.' : 'Send a confirmation link to your inbox.'}</T>{!user.emailVerified && <Button title={verificationSent ? 'Resend confirmation' : 'Send confirmation'} busy={busy} light onPress={() => { void verify(); }} />}</View>
      <T style={{ color: c.muted, fontSize: 13 }}>An account is separate from club membership. Your saved moments stay on this device.</T>
      <Button title="Sign out" busy={busy} light icon="log-out" onPress={() => { void logout(); }} />
    </Fade> : <Fade style={[s.card, { gap: 19 }]}>
      <View style={s.row}>{(['signin', 'signup'] as const).map(value => <View key={value} style={{ flex: 1 }}><Tap onPress={() => { setMode(value); setMessage(''); }} accessibilityState={{ selected: value === mode }} style={{ padding: 12, borderRadius: 20, backgroundColor: mode === value ? c.blush : c.cream }}><T style={{ textAlign: 'center', fontFamily: f.bold, fontSize: 13 }}>{value === 'signin' ? 'Welcome back' : 'I’m new here'}</T></Tap></View>)}</View>
      <T serif style={{ fontSize: 30, lineHeight: 33 }}>{mode === 'reset' ? 'A fresh start.' : mode === 'signup' ? 'Make yourself at home.' : 'Lovely to see you.'}</T>
      {mode === 'signup' && <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={120} />}
      <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={254} />
      {mode !== 'reset' && <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />}
      {mode === 'signup' && <T style={{ fontSize: 11, color: c.muted, lineHeight: 17 }}>Use at least 6 characters. This creates an ABT account and sends an email confirmation.</T>}
      <Button title={mode === 'reset' ? 'Send reset link' : mode === 'signup' ? 'Create my account' : 'Sign in'} busy={busy} onPress={() => { void submit(); }} />
      <Tap onPress={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setMessage(''); }} style={{ padding: 8 }}><T style={{ textAlign: 'center', fontSize: 12, textDecorationLine: 'underline' }}>{mode === 'reset' ? 'Back to sign in' : 'Forgot your password?'}</T></Tap>
    </Fade>}
    {!!message && <T accessibilityRole="alert" style={s.message}>{message}</T>}
    <Tap onPress={() => router.push('/saved')} style={[s.card, s.row, { backgroundColor: c.sky }]}><Feather name="bookmark" size={22} color={c.navy} /><View style={{ flex: 1 }}><Label>Your collection</Label><T serif style={{ fontSize: 27, lineHeight: 32 }}>{saved.length} saved {saved.length === 1 ? 'moment' : 'moments'}</T></View><Feather name="arrow-up-right" size={22} color={c.navy} /></Tap>
    <Button title="Inquire about membership" onPress={() => router.push('/join')} />
    <Tap onPress={() => { void openLink(data.site.instagram); }} style={{ padding: 10 }}><T style={{ textAlign: 'center', fontSize: 12 }}>{data.site.handle} ↗</T></Tap>
  </Screen>;
}
