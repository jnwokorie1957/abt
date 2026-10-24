import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import { type Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c, fonts as f } from '../theme';
import { useClub } from '../providers/ClubProvider';
import { Tap, T } from './ui';

type Props = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
const icons = ['sun', 'calendar', 'bookmark', 'heart', 'user'] as const;
export function TabBar({ state, descriptors, navigation }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { reducedMotion } = useClub();
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const itemWidth = (width - 12) / state.routes.length;
  useEffect(() => {
    const animation = Animated.timing(position, { toValue: state.index * itemWidth, duration: reducedMotion ? 0 : 430, easing: Easing.bezier(.22, .82, .18, 1), useNativeDriver: true });
    animation.start(); return () => animation.stop();
  }, [state.index, itemWidth, position, reducedMotion]);
  return <View style={[styles.wrapper, { bottom: Math.max(bottom, 16) }]}><View style={styles.shell} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <BlurView tint="light" intensity={85} style={StyleSheet.absoluteFill} />
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFDF8C9' }]} />
    {width > 0 && <Animated.View style={[styles.pill, { width: itemWidth, transform: [{ translateX: position }] }]} />}
    {state.routes.map((route, index) => {
      const selected = index === state.index;
      const options = descriptors[route.key].options;
      return <View key={route.key} style={{ flex: 1 }}><Tap accessibilityRole="tab" accessibilityLabel={options.title} accessibilityState={{ selected }} onPress={() => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      }} style={styles.item}><Feather name={icons[index]} size={20} color={c.navy} /><T style={{ fontSize: 10, lineHeight: 14, fontFamily: selected ? f.bold : f.medium }}>{options.title}</T></Tap></View>;
    })}
  </View></View>;
}
const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 18, right: 18, alignItems: 'center' },
  shell: { flexDirection: 'row', width: '100%', maxWidth: 480, padding: 6, borderRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0px 8px 30px #132E471A' },
  pill: { position: 'absolute', left: 6, top: 6, bottom: 6, backgroundColor: c.rose, borderRadius: 28 },
  item: { minHeight: 58, justifyContent: 'center', alignItems: 'center', gap: 4 },
});
