import Svg, { Path } from 'react-native-svg';
import { Platform } from 'react-native';
import { colors } from '../theme';

const paths = {
  right: 'M5 12h14m-6-6 6 6-6 6',
  left: 'M19 12H5m6-6-6 6 6 6',
  'up-right': 'M6 18 18 6M6 6h12v12',
} as const;

export function Arrow({ direction = 'up-right', size = 20, color = colors.navy }: {
  direction?: keyof typeof paths;
  size?: number;
  color?: string;
}) {
  const accessibility = Platform.OS === 'web'
    ? { 'aria-hidden': true as const, focusable: false as const }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  return <Svg {...accessibility} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
    <Path d={paths[direction]} />
  </Svg>;
}
