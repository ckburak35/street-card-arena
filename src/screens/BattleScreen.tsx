import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameCard } from '../components/GameCard';
import { calculateBattle } from '../services/cardGenerator';
import { AnimalCard } from '../types';

type Props = {
  cards: AnimalCard[];
};

export function BattleScreen({ cards }: Props) {
  const [firstId, setFirstId] = useState<string | null>(null);
  const [secondId, setSecondId] = useState<string | null>(null);

  const first = cards.find((card) => card.id === firstId) ?? null;
  const second = cards.find((card) => card.id === secondId) ?? null;
  const result = useMemo(() => (first && second ? calculateBattle(first, second) : null), [first, second]);

  function chooseCard(card: AnimalCard) {
    if (!firstId || card.id === firstId) {
      setFirstId(card.id);
      return;
    }
    setSecondId(card.id);
  }

  if (cards.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Kapışma için 2 kart gerekli</Text>
        <Text style={styles.emptyText}>İki farklı hayvan kartı oluşturduğunda burada karşılaştırmalı savaş açılır.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.selectorHeader}>
        <Text style={styles.sectionTitle}>Kart Seç</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.resetButton}
          onPress={() => {
            setFirstId(null);
            setSecondId(null);
          }}
        >
          <Text style={styles.resetText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRail}>
        {cards.map((card) => (
          <GameCard key={card.id} card={card} compact selected={card.id === firstId || card.id === secondId} onPress={() => chooseCard(card)} />
        ))}
      </ScrollView>

      {first && second && result ? (
        <View style={styles.resultPanel}>
          <Text style={styles.resultTitle}>
            {result.winnerId === 'draw'
              ? 'Berabere'
              : result.winnerId === first.id
                ? `${first.name} kazandı`
                : `${second.name} kazandı`}
          </Text>
          <Text style={styles.score}>
            {result.firstScore} - {result.secondScore}
          </Text>

          <View style={styles.rounds}>
            {result.rounds.map((round) => (
              <View key={round.label} style={styles.roundRow}>
                <Text style={styles.roundLabel}>{round.label}</Text>
                <Text style={[styles.roundValue, round.winner === 'first' && styles.winningValue]}>{round.first}</Text>
                <Text style={styles.versus}>vs</Text>
                <Text style={[styles.roundValue, round.winner === 'second' && styles.winningValue]}>{round.second}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.hintPanel}>
          <Text style={styles.hintText}>Önce kendi kartını, sonra rakip kartı seç.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 14
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    color: '#fff8ea',
    fontSize: 20,
    fontWeight: '900'
  },
  resetButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: '#232833'
  },
  resetText: {
    color: '#dce4f2',
    fontWeight: '900'
  },
  cardRail: {
    gap: 12,
    paddingRight: 14
  },
  resultPanel: {
    borderRadius: 8,
    padding: 16,
    gap: 12,
    backgroundColor: '#20252f',
    borderWidth: 1,
    borderColor: '#323a48'
  },
  resultTitle: {
    color: '#fff8ea',
    fontSize: 24,
    fontWeight: '900'
  },
  score: {
    color: '#f0b84f',
    fontSize: 34,
    fontWeight: '900'
  },
  rounds: {
    gap: 8
  },
  roundRow: {
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171b23'
  },
  roundLabel: {
    flex: 1,
    color: '#e8edf5',
    fontWeight: '800'
  },
  roundValue: {
    width: 42,
    color: '#aeb8c8',
    fontWeight: '900',
    textAlign: 'center'
  },
  winningValue: {
    color: '#f0b84f'
  },
  versus: {
    width: 28,
    color: '#677386',
    fontWeight: '900',
    textAlign: 'center'
  },
  hintPanel: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#20252f'
  },
  hintText: {
    color: '#b9c3d2',
    lineHeight: 21,
    fontWeight: '700'
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
