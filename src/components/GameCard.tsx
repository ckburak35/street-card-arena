import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnimalCard, Rarity } from '../types';

type Props = {
  card: AnimalCard;
  compact?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
};

const rarityStyle: Record<Rarity, { border: string; fill: string; text: string }> = {
  Common: { border: '#8b98a8', fill: '#242a32', text: '#d6dde7' },
  Uncommon: { border: '#53c48b', fill: '#14352c', text: '#b8f4cf' },
  Rare: { border: '#4aa3ff', fill: '#142c4c', text: '#c7e4ff' },
  Epic: { border: '#b36bff', fill: '#311a4f', text: '#ead5ff' },
  Legendary: { border: '#f2b84b', fill: '#4b3510', text: '#ffe0a1' },
  Mythic: { border: '#ff6f91', fill: '#4a1427', text: '#ffd0dc' }
};

const statRows = [
  ['Hız', 'speed'],
  ['Dayanıklılık', 'stamina'],
  ['Güç', 'power'],
  ['Çekicilik', 'charm'],
  ['Overall', 'overall']
] as const;

export function GameCard({ card, compact = false, selected = false, onPress, onDelete }: Props) {
  const tone = rarityStyle[card.rarity];
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[
        styles.card,
        { borderColor: selected ? '#ffffff' : tone.border, backgroundColor: tone.fill },
        compact && styles.compactCard
      ]}
    >
      <Image source={{ uri: card.imageUri }} style={[styles.image, compact && styles.compactImage]} />
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.name, compact && styles.compactName]} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={[styles.rarity, { color: tone.text }]}>{card.rarity}</Text>
        </View>
        <View style={[styles.overallBadge, { borderColor: tone.border }]}>
          <Text style={styles.overallValue}>{card.stats.overall}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        {statRows.map(([label, key]) => (
          <View key={key} style={styles.statRow}>
            <Text style={styles.statLabel}>{label}</Text>
            <View style={styles.statTrack}>
              <View style={[styles.statFill, { width: `${card.stats[key]}%`, backgroundColor: tone.border }]} />
            </View>
            <Text style={styles.statValue}>{card.stats[key]}</Text>
          </View>
        ))}
      </View>

      {onDelete && (
        <TouchableOpacity accessibilityRole="button" onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Sil</Text>
        </TouchableOpacity>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    gap: 12
  },
  compactCard: {
    width: 180,
    minHeight: 320
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
    backgroundColor: '#0f1116'
  },
  compactImage: {
    aspectRatio: 1.1
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center'
  },
  name: {
    color: '#fff8ea',
    fontSize: 22,
    fontWeight: '900',
    maxWidth: 210
  },
  compactName: {
    fontSize: 16,
    maxWidth: 110
  },
  rarity: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2
  },
  overallBadge: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101319'
  },
  overallValue: {
    color: '#fff8ea',
    fontSize: 22,
    fontWeight: '900'
  },
  stats: {
    gap: 8
  },
  statRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statLabel: {
    width: 88,
    color: '#e8edf5',
    fontSize: 12,
    fontWeight: '800'
  },
  statTrack: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden'
  },
  statFill: {
    height: '100%',
    borderRadius: 8
  },
  statValue: {
    width: 28,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right'
  },
  deleteButton: {
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#351d22'
  },
  deleteText: {
    color: '#ffb7c2',
    fontWeight: '900'
  }
});
