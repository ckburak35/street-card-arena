import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraScreen } from './src/screens/CameraScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { BattleScreen } from './src/screens/BattleScreen';
import { AnimalCard } from './src/types';
import { loadCards, saveCards } from './src/storage/cards';

type Tab = 'capture' | 'collection' | 'battle';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'capture', label: 'Tara' },
  { id: 'collection', label: 'Koleksiyon' },
  { id: 'battle', label: 'Kapıştır' }
];

export default function App() {
  const [tab, setTab] = useState<Tab>('capture');
  const [cards, setCards] = useState<AnimalCard[]>([]);

  useEffect(() => {
    loadCards().then(setCards).catch(() => setCards([]));
  }, []);

  useEffect(() => {
    saveCards(cards).catch(() => undefined);
  }, [cards]);

  const addCard = useCallback((card: AnimalCard) => {
    setCards((current) => [card, ...current]);
    setTab('collection');
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setCards((current) => current.filter((card) => card.id !== cardId));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.shell}>
        <View style={styles.header}>
          <Text style={styles.title}>Street Card Arena</Text>
          <Text style={styles.subtitle}>{cards.length} kart</Text>
        </View>

        <View style={styles.content}>
          {tab === 'capture' && <CameraScreen onCardCreated={addCard} />}
          {tab === 'collection' && <CollectionScreen cards={cards} onDeleteCard={deleteCard} />}
          {tab === 'battle' && <BattleScreen cards={cards} />}
        </View>

        <View style={styles.tabBar}>
          {tabs.map((item) => (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              style={[styles.tabButton, tab === item.id && styles.activeTabButton]}
              onPress={() => setTab(item.id)}
            >
              <Text style={[styles.tabLabel, tab === item.id && styles.activeTabLabel]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111318'
  },
  shell: {
    flex: 1,
    backgroundColor: '#111318'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  title: {
    color: '#f7f3e8',
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: '#95a1b2',
    fontSize: 14,
    fontWeight: '700'
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#252a34',
    backgroundColor: '#171a21'
  },
  tabButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232833'
  },
  activeTabButton: {
    backgroundColor: '#f0b84f'
  },
  tabLabel: {
    color: '#d9dfeb',
    fontWeight: '800'
  },
  activeTabLabel: {
    color: '#16130c'
  }
});
