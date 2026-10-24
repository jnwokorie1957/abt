import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import { type Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c, fonts as f } from '../theme';
import { useClub } from '../providers/ClubProvider';
import { Tap, T } from './ui';

type Props = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];
type TabBounds = { x: number; width: number };
const icons = ['sun', 'calendar', 'bookmark', 'heart', 'user'] as const;
export function TabBar({ state, descriptors, navigation }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { reducedMotion } = useClub();
  const [bounds, setBounds] = useState<Record<string, TabBounds>>({});
  const [left] = useState(() => new Animated.Value(0));
  const [right] = useState(() => new Animated.Value(0));
  const initialized = useRef(false);
  const previousX = useRef(0);
  const selectedBounds = bounds[state.routes[state.index].key];
  useEffect(() => {
    if (!selectedBounds) return;
    const targetLeft = selectedBounds.x;
    const targetRight = targetLeft + selectedBounds.width;
    if (!initialized.current || reducedMotion) {
      left.setValue(targetLeft);
      right.setValue(targetRight);
      initialized.current = true;
      previousX.current = targetLeft;
      return;
    }
    const movingRight = targetLeft >= previousX.current;
    previousX.current = targetLeft;
    // Lead with one edge, then let the other catch up: stretch, move, compress.
    const edge = (value: Animated.Value, toValue: number, leading: boolean) => Animated.timing(value, {
      toValue,
      duration: leading ? 280 : 400,
      delay: leading ? 0 : 65,
      easing: Easing.bezier(.22, .82, .18, 1),
      useNativeDriver: false,
      isInteraction: false,
    });
    const animation = Animated.parallel([
      edge(left, targetLeft, !movingRight),
      edge(right, targetRight, movingRight),
    ]);
    animation.start();
    return () => animation.stop();
  }, [selectedBounds, left, right, reducedMotion]);
  return <View style={[styles.wrapper, { bottom: Math.max(bottom, 16) }]}><View testID="tab-bar" style={styles.shell}>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.background]}>
      <BlurView tint="light" intensity={85} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFDF8C9' }]} />
    </View>
    {selectedBounds && <Animated.View testID="tab-indicator" pointerEvents="none" style={[styles.pill, { left, width: Animated.subtract(right, left) }]} />}
    {state.routes.map((route, index) => {
      const selected = index === state.index;
      const options = descriptors[route.key].options;
      return <View key={route.key} style={styles.tab} onLayout={event => {
        const { x, width } = event.nativeEvent.layout;
        setBounds(previous => {
          const old = previous[route.key];
          return old && Math.abs(old.x - x) < .25 && Math.abs(old.width - width) < .25
            ? previous : { ...previous, [route.key]: { x, width } };
        });
      }}><Tap accessibilityRole="tab" accessibilityLabel={options.title} accessibilityState={{ selected }} onPress={() => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      }} style={styles.item}><Feather name={icons[index]} size={20} color={c.navy} /><T style={{ fontSize: 10, lineHeight: 14, fontFamily: selected ? f.bold : f.medium }}>{options.title}</T></Tap></View>;
    })}
  </View></View>;
}
const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 18, right: 18, alignItems: 'center' },
  shell: { flexDirection: 'row', width: '100%', maxWidth: 480, padding: 6, borderRadius: 34, borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0px 8px 30px #132E471A' },
  background: { borderRadius: 34, overflow: 'hidden' },
  tab: { flexGrow: 1, flexShrink: 1, minWidth: 44 },
  pill: { position: 'absolute', top: 6, bottom: 6, backgroundColor: c.rose, borderRadius: 28 },
  item: { minHeight: 58, paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center', alignItems: 'center', gap: 4 },
});
