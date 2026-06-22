import { AnimalCard, AnimalKind, BattleResult, CardStats, Rarity } from '../types';

const rarityPalette: Record<Rarity, { floor: number; names: string[] }> = {
  Common: { floor: 0, names: ['Sokak Kartı', 'Mahalle Kartı'] },
  Uncommon: { floor: 58, names: ['Parlak Sokaklı', 'Hızlı Dost'] },
  Rare: { floor: 68, names: ['Nadir Dost', 'Gece Gezgin'] },
  Epic: { floor: 78, names: ['Epik Patili', 'Cadde Şampiyonu'] },
  Legendary: { floor: 88, names: ['Efsane Patili', 'Altın Bakış'] },
  Mythic: { floor: 95, names: ['Mitik Dost', 'Şehrin Yıldızı'] }
};

const statLabels: Array<{ key: keyof CardStats; label: string }> = [
  { key: 'speed', label: 'Hız' },
  { key: 'stamina', label: 'Dayanıklılık' },
  { key: 'power', label: 'Güç' },
  { key: 'charm', label: 'Çekicilik' },
  { key: 'overall', label: 'Overall' }
];

export function generateAnimalCard(imageUri: string, animalKind: AnimalKind = 'unknown'): AnimalCard {
  const seed = hash(`${imageUri}-${Date.now()}`);
  const base = [
    ranged(seed, 1, 34, 96),
    ranged(seed, 2, 34, 96),
    ranged(seed, 3, 34, 96),
    ranged(seed, 4, 42, 99)
  ];

  const speciesBoost = animalKind === 'dog' ? [4, 2, 7, -1] : animalKind === 'cat' ? [7, 1, 1, 6] : [2, 2, 2, 2];
  const speed = clamp(base[0] + speciesBoost[0]);
  const stamina = clamp(base[1] + speciesBoost[1]);
  const power = clamp(base[2] + speciesBoost[2]);
  const charm = clamp(base[3] + speciesBoost[3]);
  const overall = clamp(Math.round(speed * 0.23 + stamina * 0.22 + power * 0.23 + charm * 0.22 + ranged(seed, 5, 0, 10)));
  const stats = { speed, stamina, power, charm, overall };
  const rarity = pickRarity(overall, ranged(seed, 6, 0, 100));
  const namePool = rarityPalette[rarity].names;

  return {
    id: `${Date.now()}-${seed}`,
    name: namePool[seed % namePool.length],
    animalKind,
    imageUri,
    rarity,
    stats,
    createdAt: new Date().toISOString()
  };
}

export function calculateBattle(first: AnimalCard, second: AnimalCard): BattleResult {
  let firstScore = 0;
  let secondScore = 0;

  const rounds = statLabels.map(({ key, label }) => {
    const firstValue = first.stats[key];
    const secondValue = second.stats[key];
    const winner: 'first' | 'second' | 'draw' = firstValue === secondValue ? 'draw' : firstValue > secondValue ? 'first' : 'second';
    if (winner === 'first') firstScore += 1;
    if (winner === 'second') secondScore += 1;

    return {
      label,
      first: firstValue,
      second: secondValue,
      winner
    };
  });

  return {
    firstScore,
    secondScore,
    winnerId: firstScore === secondScore ? 'draw' : firstScore > secondScore ? first.id : second.id,
    rounds
  };
}

function pickRarity(overall: number, luck: number): Rarity {
  const boosted = overall + Math.round(luck / 8);
  if (boosted >= rarityPalette.Mythic.floor) return 'Mythic';
  if (boosted >= rarityPalette.Legendary.floor) return 'Legendary';
  if (boosted >= rarityPalette.Epic.floor) return 'Epic';
  if (boosted >= rarityPalette.Rare.floor) return 'Rare';
  if (boosted >= rarityPalette.Uncommon.floor) return 'Uncommon';
  return 'Common';
}

function ranged(seed: number, salt: number, min: number, max: number) {
  const next = Math.abs(Math.sin(seed * (salt + 3)) * 10000);
  return Math.floor(min + (next % (max - min + 1)));
}

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
