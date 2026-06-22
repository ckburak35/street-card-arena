import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimalCard } from '../types';

const storageKey = 'street-card-arena.cards.v1';

export async function loadCards(): Promise<AnimalCard[]> {
  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) return [];
  return JSON.parse(raw) as AnimalCard[];
}

export async function saveCards(cards: AnimalCard[]) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(cards));
}
