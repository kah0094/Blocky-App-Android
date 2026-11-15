import React from 'react';
import { View, StyleSheet } from 'react-native';

const SHIRT_COLORS = {
  shirt_blue: '#3498db',
  shirt_red: '#e74c3c',
  shirt_green: '#2ecc71',
  shirt_black: '#222222',
};

const HAIR_COLORS = {
  black: '#171717',
  brown: '#6b3f20',
  blonde: '#f5c542',
};

const resolveColor = (value, fallback, palette) => {
  if (!value) return fallback;
  return palette[value] || value;
};

export default function BlockyAvatar({ config = {}, size = 120 }) {
  const skin = config.skin || config.skin_color || '#f1c40f';
  const shirt = resolveColor(config.shirt, '#3498db', SHIRT_COLORS);
  const hair = resolveColor(config.hair, '#171717', HAIR_COLORS);
  const scale = size / 120;

  return (
    <View style={[styles.avatar, { width: size, height: size * 1.35 }]} accessibilityLabel="Avatar">
      <View style={[styles.head, { width: 38 * scale, height: 38 * scale, backgroundColor: skin }]}>
        <View style={[styles.hair, { width: 40 * scale, height: 10 * scale, backgroundColor: hair }]} />
        <View style={[styles.eye, { left: 10 * scale, top: 20 * scale }]} />
        <View style={[styles.eye, { right: 10 * scale, top: 20 * scale }]} />
      </View>
      <View style={styles.bodyRow}>
        <View style={[styles.arm, { width: 14 * scale, height: 45 * scale, backgroundColor: shirt }]} />
        <View style={[styles.torso, { width: 42 * scale, height: 48 * scale, backgroundColor: shirt }]} />
        <View style={[styles.arm, { width: 14 * scale, height: 45 * scale, backgroundColor: shirt }]} />
      </View>
      <View style={styles.legs}>
        <View style={[styles.leg, { width: 18 * scale, height: 40 * scale }]} />
        <View style={[styles.leg, { width: 18 * scale, height: 40 * scale }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'flex-start' },
  head: { marginBottom: 2, alignItems: 'center', position: 'relative' },
  hair: { position: 'absolute', top: -2, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  eye: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#111' },
  bodyRow: { flexDirection: 'row', alignItems: 'flex-start' },
  torso: { marginHorizontal: 2 },
  arm: { borderRadius: 2 },
  legs: { flexDirection: 'row', gap: 4 },
  leg: { backgroundColor: '#34495e', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
});
