const storageKey = 'street-card-arena.cards.v1';
const rarityTone = {
  Common: { border: '#8b98a8', fill: '#242a32', text: '#d6dde7' },
  Uncommon: { border: '#53c48b', fill: '#14352c', text: '#b8f4cf' },
  Rare: { border: '#4aa3ff', fill: '#142c4c', text: '#c7e4ff' },
  Epic: { border: '#b36bff', fill: '#311a4f', text: '#ead5ff' },
  Legendary: { border: '#f2b84b', fill: '#4b3510', text: '#ffe0a1' },
  Mythic: { border: '#ff6f91', fill: '#4a1427', text: '#ffd0dc' }
};
const statRows = [
  ['Hiz', 'speed'],
  ['Dayaniklilik', 'stamina'],
  ['Guc', 'power'],
  ['Cekicilik', 'charm'],
  ['Overall', 'overall']
];

let cards = loadCards();
let selectedKind = 'cat';
let battleFirstId = null;
let battleSecondId = null;
let installPrompt = null;

const elements = {
  video: document.querySelector('#cameraPreview'),
  canvas: document.querySelector('#captureCanvas'),
  fallback: document.querySelector('#cameraFallback'),
  scanButton: document.querySelector('#scanButton'),
  fileInput: document.querySelector('#fileInput'),
  count: document.querySelector('#cardCount'),
  collectionList: document.querySelector('#collectionList'),
  emptyCollection: document.querySelector('#emptyCollection'),
  battleEmpty: document.querySelector('#battleEmpty'),
  battleReady: document.querySelector('#battleReady'),
  battleRail: document.querySelector('#battleRail'),
  battleResult: document.querySelector('#battleResult'),
  resetBattleButton: document.querySelector('#resetBattleButton'),
  installButton: document.querySelector('#installButton')
};

document.querySelectorAll('.tab').forEach((button) => {
  button.addEventListener('click', () => switchView(button.dataset.view));
});

document.querySelectorAll('.segment').forEach((button) => {
  button.addEventListener('click', () => {
    selectedKind = button.dataset.kind;
    document.querySelectorAll('.segment').forEach((item) => item.classList.toggle('active', item === button));
  });
});

elements.scanButton.addEventListener('click', captureFromCamera);
elements.fileInput.addEventListener('change', captureFromFile);
elements.resetBattleButton.addEventListener('click', () => {
  battleFirstId = null;
  battleSecondId = null;
  render();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  elements.installButton.hidden = false;
});

elements.installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  elements.installButton.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

startCamera();
render();

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });
    elements.video.srcObject = stream;
    elements.fallback.classList.add('hidden');
  } catch {
    elements.fallback.classList.remove('hidden');
  }
}

function captureFromCamera() {
  const video = elements.video;
  if (!video.videoWidth || !video.videoHeight) {
    elements.fileInput.click();
    return;
  }

  const canvas = elements.canvas;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  createCard(canvas.toDataURL('image/jpeg', 0.86));
}

function captureFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => createCard(String(reader.result));
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function createCard(imageUri) {
  setBusy(true);
  try {
    const cardImageUri = await createStickerCardImage(imageUri, selectedKind);
    cards = [generateAnimalCard(imageUri, cardImageUri, selectedKind), ...cards];
  } catch {
    cards = [generateAnimalCard(imageUri, imageUri, selectedKind), ...cards];
  }
  saveCards();
  switchView('collectionView');
  render();
  setBusy(false);
}

function render() {
  elements.count.textContent = `${cards.length} kart`;
  renderCollection();
  renderBattle();
}

function renderCollection() {
  elements.emptyCollection.hidden = cards.length > 0;
  elements.collectionList.innerHTML = '';
  cards.forEach((card) => {
    const node = cardNode(card);
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-card segment';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Sil';
    deleteButton.addEventListener('click', () => {
      cards = cards.filter((item) => item.id !== card.id);
      if (battleFirstId === card.id) battleFirstId = null;
      if (battleSecondId === card.id) battleSecondId = null;
      saveCards();
      render();
    });
    node.appendChild(deleteButton);
    elements.collectionList.appendChild(node);
  });
}

function renderBattle() {
  const hasBattle = cards.length >= 2;
  elements.battleEmpty.hidden = hasBattle;
  elements.battleReady.hidden = !hasBattle;
  elements.battleRail.innerHTML = '';

  cards.forEach((card) => {
    const node = cardNode(card, { compact: true, selected: card.id === battleFirstId || card.id === battleSecondId });
    node.tabIndex = 0;
    node.role = 'button';
    node.addEventListener('click', () => chooseBattleCard(card.id));
    elements.battleRail.appendChild(node);
  });

  const first = cards.find((card) => card.id === battleFirstId);
  const second = cards.find((card) => card.id === battleSecondId);
  if (!first || !second) {
    elements.battleResult.innerHTML = '<p>Once kendi kartini, sonra rakip karti sec.</p>';
    return;
  }

  const result = calculateBattle(first, second);
  const winnerText = result.winnerId === 'draw' ? 'Berabere' : result.winnerId === first.id ? `${first.name} kazandi` : `${second.name} kazandi`;
  elements.battleResult.innerHTML = `
    <h3>${escapeHtml(winnerText)}</h3>
    <div class="battle-score">${result.firstScore} - ${result.secondScore}</div>
    ${result.rounds.map((round) => `
      <div class="round-row">
        <strong>${round.label}</strong>
        <span class="${round.winner === 'first' ? 'win' : ''}">${round.first}</span>
        <span>vs</span>
        <span class="${round.winner === 'second' ? 'win' : ''}">${round.second}</span>
      </div>
    `).join('')}
  `;
}

function chooseBattleCard(cardId) {
  if (!battleFirstId || battleFirstId === cardId) {
    battleFirstId = cardId;
    if (battleSecondId === cardId) battleSecondId = null;
  } else {
    battleSecondId = cardId;
  }
  render();
}

function cardNode(card, options = {}) {
  const tone = rarityTone[card.rarity];
  const article = document.createElement('article');
  article.className = `game-card${options.compact ? ' compact' : ''}${options.selected ? ' selected' : ''}`;
  article.style.setProperty('--rarity-border', tone.border);
  article.style.setProperty('--rarity-fill', tone.fill);
  article.style.setProperty('--rarity-text', tone.text);
  article.innerHTML = `
    <div class="card-art">
      <img class="card-image" src="${card.cardImageUri || card.imageUri}" alt="${escapeHtml(card.name)}" />
      <div class="card-art-badge">${card.animalKind === 'dog' ? 'Kopek' : 'Kedi'}</div>
    </div>
    <div class="card-top">
      <div>
        <h3 class="card-name">${escapeHtml(card.name)}</h3>
        <div class="rarity">${card.rarity}</div>
      </div>
      <div class="overall-badge">${card.stats.overall}</div>
    </div>
    <div class="stats">
      ${statRows.map(([label, key]) => `
        <div class="stat-row">
          <div class="stat-label">${label}</div>
          <div class="stat-track">
            <div class="stat-fill" style="--stat-width:${card.stats[key]}%"></div>
          </div>
          <div class="stat-value">${card.stats[key]}</div>
        </div>
      `).join('')}
    </div>
  `;
  return article;
}

function generateAnimalCard(imageUri, cardImageUri, animalKind) {
  const seed = hash(`${imageUri}-${Date.now()}`);
  const speciesBoost = animalKind === 'dog' ? [4, 2, 7, -1] : [7, 1, 1, 6];
  const speed = clamp(ranged(seed, 1, 34, 96) + speciesBoost[0]);
  const stamina = clamp(ranged(seed, 2, 34, 96) + speciesBoost[1]);
  const power = clamp(ranged(seed, 3, 34, 96) + speciesBoost[2]);
  const charm = clamp(ranged(seed, 4, 42, 99) + speciesBoost[3]);
  const overall = clamp(Math.round(speed * 0.23 + stamina * 0.22 + power * 0.23 + charm * 0.22 + ranged(seed, 5, 0, 10)));
  const rarity = pickRarity(overall, ranged(seed, 6, 0, 100));
  const names = {
    Common: ['Sokak Karti', 'Mahalle Karti'],
    Uncommon: ['Parlak Sokakli', 'Hizli Dost'],
    Rare: ['Nadir Dost', 'Gece Gezgin'],
    Epic: ['Epik Patili', 'Cadde Sampiyonu'],
    Legendary: ['Efsane Patili', 'Altin Bakis'],
    Mythic: ['Mitik Dost', 'Sehrin Yildizi']
  };
  return {
    id: `${Date.now()}-${seed}`,
    name: names[rarity][seed % names[rarity].length],
    animalKind,
    imageUri,
    cardImageUri,
    rarity,
    stats: { speed, stamina, power, charm, overall },
    createdAt: new Date().toISOString()
  };
}

async function createStickerCardImage(imageUri, animalKind) {
  const image = await loadImage(imageUri);
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  const palette = animalKind === 'dog'
    ? ['#2f80ed', '#f2b84b', '#19c37d']
    : ['#b36bff', '#f0b84f', '#ff6f91'];

  drawCoverImage(ctx, image, 0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = 'blur(18px) saturate(1.35) brightness(0.72)';
  drawCoverImage(ctx, image, -34, -34, canvas.width + 68, canvas.height + 68);
  ctx.restore();

  const gradient = ctx.createRadialGradient(480, 390, 80, 480, 480, 650);
  gradient.addColorStop(0, `${palette[1]}cc`);
  gradient.addColorStop(0.42, `${palette[0]}77`);
  gradient.addColorStop(1, '#101319ee');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.42;
  for (let i = 0; i < 13; i += 1) {
    const x = 80 + ((i * 157) % 820);
    const y = 92 + ((i * 211) % 760);
    ctx.beginPath();
    ctx.arc(x, y, 10 + ((i * 7) % 38), 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? palette[2] : palette[1];
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(480, 515);
  ctx.rotate(-0.035);
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 46;
  ctx.shadowOffsetY = 36;
  roundedImage(ctx, image, -310, -310, 620, 620, 58);
  ctx.restore();

  ctx.save();
  ctx.translate(480, 515);
  ctx.rotate(-0.035);
  ctx.lineWidth = 20;
  ctx.strokeStyle = '#fff8ea';
  roundRect(ctx, -320, -320, 640, 640, 68);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = palette[1];
  roundRect(ctx, -338, -338, 676, 676, 76);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const shine = ctx.createLinearGradient(160, 80, 820, 720);
  shine.addColorStop(0, '#ffffff00');
  shine.addColorStop(0.47, '#ffffff30');
  shine.addColorStop(0.55, '#ffffff00');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.9);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function roundedImage(ctx, image, x, y, width, height, radius) {
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  drawCoverImage(ctx, image, x, y, width, height);
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function setBusy(isBusy) {
  elements.scanButton.disabled = isBusy;
  elements.scanButton.textContent = isBusy ? 'Isleniyor' : 'Tara';
}

function calculateBattle(first, second) {
  let firstScore = 0;
  let secondScore = 0;
  const rounds = statRows.map(([label, key]) => {
    const firstValue = first.stats[key];
    const secondValue = second.stats[key];
    const winner = firstValue === secondValue ? 'draw' : firstValue > secondValue ? 'first' : 'second';
    if (winner === 'first') firstScore += 1;
    if (winner === 'second') secondScore += 1;
    return { label, first: firstValue, second: secondValue, winner };
  });
  return {
    firstScore,
    secondScore,
    winnerId: firstScore === secondScore ? 'draw' : firstScore > secondScore ? first.id : second.id,
    rounds
  };
}

function pickRarity(overall, luck) {
  const boosted = overall + Math.round(luck / 8);
  if (boosted >= 95) return 'Mythic';
  if (boosted >= 88) return 'Legendary';
  if (boosted >= 78) return 'Epic';
  if (boosted >= 68) return 'Rare';
  if (boosted >= 58) return 'Uncommon';
  return 'Common';
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === viewId));
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
}

function saveCards() {
  localStorage.setItem(storageKey, JSON.stringify(cards));
}

function loadCards() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

function ranged(seed, salt, min, max) {
  const next = Math.abs(Math.sin(seed * (salt + 3)) * 10000);
  return Math.floor(min + (next % (max - min + 1)));
}

function hash(input) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}
