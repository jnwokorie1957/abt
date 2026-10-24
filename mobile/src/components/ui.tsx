import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c, fonts as f } from '../theme';
import { useClub } from '../providers/ClubProvider';

export const SITE = 'https://abettertomorrow.web.app';
export const media = (path: string) => `${SITE}${path}`;
export function T({ children, style, serif = false, italic = false, ...rest }: React.ComponentProps<typeof Text> & { serif?: boolean; italic?: boolean }) {
  return <Text {...rest} style={[{ fontFamily: italic ? f.italic : serif ? f.serif : f.body, color: c.navy, fontSize: 15, lineHeight: 23 }, style]}>{children}</Text>;
}
export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <T style={[{ fontFamily: f.bold, fontSize: 10, lineHeight: 16, letterSpacing: 2, textTransform: 'uppercase' }, style]}>{children}</T>;
}
export function Tap({ children, style, onPress, ...props }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const [scale] = useState(() => new Animated.Value(1));
  const { reducedMotion } = useClub();
  const animate = (value: number) => { Animated.timing(scale, { toValue: value, duration: reducedMotion ? 0 : 150, useNativeDriver: true }).start(); };
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable {...props} accessibilityRole={props.accessibilityRole ?? 'button'} onPressIn={() => animate(.97)} onPressOut={() => animate(1)} onPress={event => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    onPress?.(event);
  }} style={[style, props.disabled && { opacity: .48 }]}>{children}</Pressable></Animated.View>;
}
export function Button({ title, onPress, light = false, busy = false, disabled = false, icon = 'arrow-up-right' }: { title: string; onPress: () => void; light?: boolean; busy?: boolean; disabled?: boolean; icon?: React.ComponentProps<typeof Feather>['name'] }) {
  return <Tap disabled={disabled || busy} onPress={onPress} style={[s.button, { backgroundColor: light ? c.paper : c.navy }]}>
    <T style={{ color: light ? c.navy : c.paper, fontFamily: f.bold, flex: 1 }}>{title}</T>
    {busy ? <ActivityIndicator color={light ? c.navy : c.paper} /> : <Feather name={icon} size={19} color={light ? c.navy : c.paper} />}
  </Tap>;
}
export function IconButton({ name, label, onPress, selected = false, disabled = false }: { name: React.ComponentProps<typeof Feather>['name']; label: string; onPress: () => void; selected?: boolean; disabled?: boolean }) {
  return <Tap accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[s.iconButton, selected && { backgroundColor: c.rose }]}><Feather name={name} size={20} color={c.navy} /></Tap>;
}
export function Fade({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { reducedMotion } = useClub();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(value, { toValue: 1, duration: reducedMotion ? 0 : 420, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [reducedMotion, value]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [reducedMotion ? 0 : 12, 0] }) }] }]}>{children}</Animated.View>;
}
export function Screen({ children, modal = false }: { children: React.ReactNode; modal?: boolean }) {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, backgroundColor: c.cream }}><LinearGradient colors={[c.cream, '#F8EBEE', '#EAF3F5', c.cream]} locations={[0, .37, .72, 1]} style={StyleSheet.absoluteFill} />
    <ScrollView
      style={{ flex: 1 }}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : Platform.OS === 'android' ? 'on-drag' : 'none'}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: modal ? insets.bottom + 32 : insets.bottom + 120, paddingHorizontal: 24, gap: 28, width: '100%', maxWidth: 600, alignSelf: 'center' }}
      showsVerticalScrollIndicator={false}
    >{children}</ScrollView>
  </View>;
}
export function Header({ title = 'a better\ntomorrow', back = false }: { title?: string; back?: boolean }) {
  return <View style={s.row}>{back ? <IconButton name="arrow-left" label="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /> : <T serif style={{ fontSize: 25, lineHeight: 23, letterSpacing: -1 }}>{title}<T style={{ fontSize: 10 }}> ®</T></T>}
    <View style={{ flex: 1 }} />{back ? <Label>ABT SOCIAL CLUB</Label> : <View style={s.city}><View style={{ width: 5, height: 5, borderRadius: 4, backgroundColor: c.navy }} /><Label style={{ fontSize: 9, letterSpacing: 1 }}>Houston, TX</Label></View>}
  </View>;
}
export function Photo({ path, alt, style }: { path: string; alt: string; style?: React.ComponentProps<typeof Image>['style'] }) {
  const { reducedMotion } = useClub();
  return <Image source={media(path)} accessibilityLabel={alt} style={[{ width: '100%', aspectRatio: 1, borderRadius: 24, backgroundColor: c.blush }, style]} contentFit="cover" transition={reducedMotion ? 0 : 200} cachePolicy="memory-disk" />;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 7 }}><Label>{label}</Label><TextInput {...props} accessibilityLabel={label} placeholderTextColor={c.muted} style={s.input} /></View>;
}
export async function openLink(url: string) {
  try { await Linking.openURL(url); } catch { /* Visible fallback link remains available on the screen. */ }
}
export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { minHeight: 56, paddingHorizontal: 22, paddingVertical: 15, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.paper, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFFFFF90' },
  city: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: c.line, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  title: { fontSize: 55, lineHeight: 55, letterSpacing: -1.8 },
  sectionTitle: { fontSize: 38, lineHeight: 40, letterSpacing: -1 },
  card: { backgroundColor: c.paper, borderRadius: 26, padding: 24, gap: 16 },
  input: { backgroundColor: c.paper, color: c.navy, fontFamily: f.body, fontSize: 16, borderColor: c.line, borderWidth: 1, borderRadius: 16, paddingHorizontal: 17, paddingVertical: 16, minHeight: 54 },
  message: { padding: 16, borderRadius: 16, backgroundColor: c.blue },
});
