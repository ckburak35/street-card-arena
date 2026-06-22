export type AnimalKind = 'cat' | 'dog' | 'unknown';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type CardStats = {
  speed: number;
  stamina: number;
  power: number;
  charm: number;
  overall: number;
};

export type AnimalCard = {
  id: string;
  name: string;
  animalKind: AnimalKind;
  imageUri: string;
  rarity: Rarity;
  stats: CardStats;
  createdAt: string;
};

export type BattleResult = {
  firstScore: number;
  secondScore: number;
  winnerId: string | 'draw';
  rounds: Array<{
    label: string;
    first: number;
    second: number;
    winner: 'first' | 'second' | 'draw';
  }>;
};
