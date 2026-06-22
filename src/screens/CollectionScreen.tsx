import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { GameCard } from '../components/GameCard';
import { AnimalCard } from '../types';

type Props = {
  cards: AnimalCard[];
  onDeleteCard: (cardId: string) => void;
};

export function CollectionScreen({ cards, onDeleteCard }: Props) {
  if (cards.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Henüz kart yok</Text>
        <Text style={styles.emptyText}>Tara ekranından bir kedi veya köpek fotoğrafı çekerek ilk kartını oluştur.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={cards}
      keyExtractor={(card) => card.id}
      renderItem={({ item }) => <GameCard card={item} onDelete={() => onDeleteCard(item.id)} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 14,
    gap: 14
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28
  },
  emptyTitle: {
    color: '#fff8ea',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center'
  },
  emptyText: {
    color: '#aeb8c8',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  }
});
