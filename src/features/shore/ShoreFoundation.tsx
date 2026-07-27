import { StyleSheet, View, type ViewStyle } from 'react-native';

import { MAX_FOUNDATION_PEBBLES } from './shoreMemoryService';

type ShoreFoundationProps = {
  color: string;
  density: number;
};

function foundationPosition(index: number): ViewStyle {
  const column = index % 12;
  const row = Math.floor(index / 12);
  const variation = ((index * 37) % 13) - 6;

  return {
    bottom: `${8 + row * 10 + ((index * 19) % 5)}%` as `${number}%`,
    height: 9 + ((index * 11) % 7),
    left: `${3 + column * 8 + variation * 0.18}%` as `${number}%`,
    opacity: 0.16 + (index % 4) * 0.04,
    transform: [{ rotate: `${((index * 17) % 18) - 9}deg` }],
    width: 13 + ((index * 7) % 10),
  };
}

export function ShoreFoundation({ color, density }: ShoreFoundationProps) {
  const visiblePebbles = Math.min(MAX_FOUNDATION_PEBBLES, density);

  return (
    <View accessible={false} pointerEvents="none" style={styles.foundation}>
      {Array.from({ length: visiblePebbles }, (_, index) => (
        <View key={index} style={[styles.pebble, foundationPosition(index), { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  foundation: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pebble: {
    position: 'absolute',
    backgroundColor: '#8E9589',
    borderRadius: 999,
  },
});
