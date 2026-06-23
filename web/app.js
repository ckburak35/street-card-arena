const storageKey = 'street-card-arena.cards.v1';
const accountStorageKey = 'street-card-arena.account-code.v1';
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
let accountCode = loadAccountCode();
let activeCollectionIndex = 0;
let battleFirstId = null;
let battleSecondId = null;
let installPrompt = null;
let syncTimer = null;

const elements = {
  video: document.querySelector('#cameraPreview'),
  canvas: document.querySelector('#captureCanvas'),
  fallback: document.querySelector('#cameraFallback'),
  scanButton: document.querySelector('#scanButton'),
  fileInput: document.querySelector('#fileInput'),
  count: document.querySelector('#cardCount'),
  accountCode: document.querySelector('#accountCode'),
  syncStatus: document.querySelector('#syncStatus'),
  copyCodeButton: document.querySelector('#copyCodeButton'),
  switchCodeButton: document.querySelector('#switchCodeButton'),
  codeLoginPanel: document.querySelector('#codeLoginPanel'),
  codeInput: document.querySelector('#codeInput'),
  loadCodeButton: document.querySelector('#loadCodeButton'),
  collectionList: document.querySelector('#collectionList'),
  emptyCollection: document.querySelector('#emptyCollection'),
  collectionDeck: document.querySelector('#collectionDeck'),
  featuredCard: document.querySelector('#featuredCard'),
  collectionRail: document.querySelector('#collectionRail'),
  prevCardButton: document.querySelector('#prevCardButton'),
  nextCardButton: document.querySelector('#nextCardButton'),
  activeCardIndex: document.querySelector('#activeCardIndex'),
  collectionPower: document.querySelector('#collectionPower'),
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

elements.scanButton.addEventListener('click', captureFromCamera);
elements.fileInput.addEventListener('change', captureFromFile);
elements.copyCodeButton.addEventListener('click', copyAccountCode);
elements.switchCodeButton.addEventListener('click', () => {
  elements.codeLoginPanel.hidden = !elements.codeLoginPanel.hidden;
  elements.codeInput.value = accountCode;
});
elements.loadCodeButton.addEventListener('click', loadCollectionByCode);
elements.prevCardButton.addEventListener('click', () => moveActiveCard(-1));
elements.nextCardButton.addEventListener('click', () => moveActiveCard(1));
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
syncFromCloud();

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
    const analysis = await analyzeLocalImage(imageUri);
    const cardImageUri = await createStickerCardImage(imageUri, analysis);
    cards = [generateAnimalCard(imageUri, cardImageUri, analysis), ...cards].slice(0, 80);
  } catch {
    cards = [generateAnimalCard(imageUri, imageUri, null), ...cards].slice(0, 80);
  }
  activeCollectionIndex = 0;
  saveCards();
  scheduleCloudSave();
  switchView('collectionView');
  render();
  setBusy(false);
}

async function analyzeLocalImage(imageUri) {
  const image = await loadImage(imageUri);
  const maxSide = 180;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let brightness = 0;
  let saturation = 0;
  let colorSpread = 0;
  let contrast = 0;
  let previousLum = null;
  const buckets = new Set();

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    brightness += lum;
    saturation += max === 0 ? 0 : (max - min) / max;
    colorSpread += max - min;
    if (previousLum !== null) contrast += Math.abs(lum - previousLum);
    previousLum = lum;
    buckets.add(`${Math.floor(r / 48)}-${Math.floor(g / 48)}-${Math.floor(b / 48)}`);
  }

  const samples = Math.max(1, Math.floor(data.length / 16));
  const brightnessScore = Math.round((brightness / samples / 255) * 100);
  const saturationScore = Math.round((saturation / samples) * 100);
  const contrastScore = Math.min(100, Math.round((contrast / samples / 42) * 100));
  const colorScore = Math.min(100, Math.round((buckets.size / 54) * 100 + colorSpread / samples / 3));
  const clarityScore = Math.round(contrastScore * 0.68 + saturationScore * 0.22 + (100 - Math.abs(58 - brightnessScore)) * 0.1);

  return {
    brightness: clamp(brightnessScore),
    saturation: clamp(saturationScore),
    contrast: clamp(contrastScore),
    color: clamp(colorScore),
    clarity: clamp(clarityScore)
  };
}

function render() {
  elements.accountCode.textContent = accountCode;
  elements.count.textContent = `${cards.length} kart`;
  renderCollection();
  renderBattle();
}

function renderCollection() {
  elements.emptyCollection.hidden = cards.length > 0;
  elements.collectionDeck.hidden = cards.length === 0;
  elements.featuredCard.innerHTML = '';
  elements.collectionRail.innerHTML = '';

  if (cards.length === 0) return;

  activeCollectionIndex = Math.max(0, Math.min(activeCollectionIndex, cards.length - 1));
  const activeCard = cards[activeCollectionIndex];
  const featured = cardNode(activeCard);
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-card segment';
  deleteButton.type = 'button';
  deleteButton.textContent = 'Karti sil';
  deleteButton.addEventListener('click', () => deleteCard(activeCard.id));
  featured.appendChild(deleteButton);
  elements.featuredCard.appendChild(featured);

  elements.activeCardIndex.textContent = `${activeCollectionIndex + 1} / ${cards.length}`;
  elements.collectionPower.textContent = `Koleksiyon gucu ${collectionPower()}`;

  cards.forEach((card, index) => {
    const button = document.createElement('button');
    button.className = `mini-card${index === activeCollectionIndex ? ' active' : ''}`;
    button.type = 'button';
    button.innerHTML = `
      <img src="${card.cardImageUri || card.imageUri}" alt="${escapeHtml(card.name)}" />
      <span>${escapeHtml(card.name)}</span>
      <strong>${card.stats.overall}</strong>
    `;
    button.addEventListener('click', () => {
      activeCollectionIndex = index;
      renderCollection();
    });
    elements.collectionRail.appendChild(button);
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
      <div class="card-art-badge">${card.aiAnalyzed ? 'Analizli' : 'Yerel analiz'}</div>
    </div>
    <div class="card-top">
      <div>
        <h3 class="card-name">${escapeHtml(card.name)}</h3>
        <div class="rarity">${card.rarity}</div>
      </div>
      <div class="overall-badge">${card.stats.overall}</div>
    </div>
    ${card.summary ? `<p class="card-summary">${escapeHtml(card.summary)}</p>` : ''}
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

function generateAnimalCard(imageUri, cardImageUri, analysis = null) {
  const seed = hash(`${imageUri}-${Date.now()}`);
  const metrics = analysis || { brightness: 50, saturation: 50, contrast: 50, color: 50, clarity: 50 };
  const speed = clamp(Math.round(28 + metrics.clarity * 0.48 + metrics.contrast * 0.22 + ranged(seed, 1, 0, 16)));
  const stamina = clamp(Math.round(30 + (100 - Math.abs(58 - metrics.brightness)) * 0.34 + metrics.contrast * 0.22 + ranged(seed, 2, 0, 18)));
  const power = clamp(Math.round(26 + metrics.contrast * 0.42 + metrics.clarity * 0.24 + ranged(seed, 3, 0, 20)));
  const charm = clamp(Math.round(34 + metrics.color * 0.34 + metrics.saturation * 0.32 + ranged(seed, 4, 0, 18)));
  const rawOverall = clamp(Math.round(speed * 0.24 + stamina * 0.22 + power * 0.22 + charm * 0.24 + metrics.clarity * 0.08));
  const overall = shapeOverall(rawOverall, metrics, seed);
  const rarity = pickRarity(overall);
  const names = {
    Common: ['Sokak Ruhu', 'Mahalle Dostu', 'Minik Kasif'],
    Uncommon: ['Parlak Gezgin', 'Canli Bakis', 'Hizli Siluet'],
    Rare: ['Nadir Karsilasma', 'Gece Yildizi', 'Renkli Efsane'],
    Epic: ['Epik Yabani', 'Cadde Sampiyonu', 'Kral Bakis'],
    Legendary: ['Efsane Canli', 'Altin Iz', 'Sehrin Gururu'],
    Mythic: ['Mitik Karsilasma', 'Dogal Mucize', 'Sakli Efsane']
  };
  const summary = makeSummary(metrics, rarity);
  return {
    id: `${Date.now()}-${seed}`,
    name: names[rarity][seed % names[rarity].length],
    animalKind: 'animal',
    imageUri,
    cardImageUri,
    rarity,
    stats: { speed, stamina, power, charm, overall },
    summary,
    backgroundStyle: 'yerel analiz sahnesi',
    analysis: metrics,
    aiAnalyzed: false,
    createdAt: new Date().toISOString()
  };
}

function makeSummary(metrics, rarity) {
  const traits = [];
  if (metrics.clarity >= 70) traits.push('net goruntu');
  if (metrics.color >= 68) traits.push('renkli aura');
  if (metrics.contrast >= 68) traits.push('guclu siluet');
  if (metrics.brightness >= 62) traits.push('parlak sahne');
  if (traits.length === 0) traits.push('sakin sokak enerjisi');
  return `${rarity} kart: ${traits.slice(0, 2).join(', ')}.`;
}

async function createStickerCardImage(imageUri, analysis = null) {
  const image = await loadImage(imageUri);
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  const hue = analysis ? Math.round(analysis.color * 2.4 + analysis.contrast * 1.2) % 360 : 42;
  const palette = [
    `hsl(${hue} 82% 58%)`,
    `hsl(${(hue + 48) % 360} 90% 64%)`,
    `hsl(${(hue + 142) % 360} 72% 52%)`
  ];

  drawCoverImage(ctx, image, 0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = 'blur(18px) saturate(1.35) brightness(0.72)';
  drawCoverImage(ctx, image, -34, -34, canvas.width + 68, canvas.height + 68);
  ctx.restore();

  const gradient = ctx.createRadialGradient(480, 390, 80, 480, 480, 650);
  gradient.addColorStop(0, alphaColor(palette[1], 0.8));
  gradient.addColorStop(0.42, alphaColor(palette[0], 0.48));
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

function alphaColor(hsl, alpha) {
  return hsl.replace('hsl(', 'hsla(').replace(')', ` / ${alpha})`);
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

function shapeOverall(rawOverall, metrics, seed) {
  const photoQuality = Math.round(
    rawOverall * 0.5 +
    metrics.clarity * 0.18 +
    metrics.contrast * 0.14 +
    metrics.color * 0.1 +
    metrics.saturation * 0.08
  );
  const qualityShift = Math.max(-18, Math.min(22, photoQuality - 66));
  const roll = ranged(seed, 7, 0, 999) / 10 + qualityShift * 0.72;
  let min = 50;
  let max = 59;

  if (roll < 7) {
    min = 42; max = 49;
  } else if (roll < 35) {
    min = 50; max = 59;
  } else if (roll < 70) {
    min = 60; max = 69;
  } else if (roll < 90) {
    min = 70; max = 79;
  } else if (roll < 98) {
    min = 80; max = 89;
  } else if (roll < 99.6) {
    min = 90; max = 96;
  } else {
    if (roll >= 109 && photoQuality >= 88) return 100;
    min = 97; max = 99;
  }

  const withinBand = ranged(seed, 8, 0, max - min);
  const qualityNudge = Math.round((photoQuality - 66) / 11);
  return Math.max(min, Math.min(max, min + withinBand + qualityNudge));
}

function pickRarity(overall) {
  if (overall >= 97) return 'Mythic';
  if (overall >= 90) return 'Legendary';
  if (overall >= 82) return 'Epic';
  if (overall >= 72) return 'Rare';
  if (overall >= 60) return 'Uncommon';
  return 'Common';
}

function switchView(viewId) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === viewId));
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
}

function moveActiveCard(direction) {
  if (cards.length === 0) return;
  activeCollectionIndex = (activeCollectionIndex + direction + cards.length) % cards.length;
  renderCollection();
}

function deleteCard(cardId) {
  cards = cards.filter((item) => item.id !== cardId);
  if (battleFirstId === cardId) battleFirstId = null;
  if (battleSecondId === cardId) battleSecondId = null;
  activeCollectionIndex = Math.max(0, Math.min(activeCollectionIndex, cards.length - 1));
  saveCards();
  scheduleCloudSave();
  render();
}

function collectionPower() {
  return cards.reduce((total, card) => total + (card.stats?.overall || 0), 0);
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

function loadAccountCode() {
  const saved = localStorage.getItem(accountStorageKey);
  if (isValidCode(saved)) return saved;
  const code = generateAccountCode();
  localStorage.setItem(accountStorageKey, code);
  return code;
}

function generateAccountCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let first = '';
  let second = '';
  const values = new Uint8Array(8);
  crypto.getRandomValues(values);
  values.forEach((value, index) => {
    if (index < 4) first += alphabet[value % alphabet.length];
    else second += alphabet[value % alphabet.length];
  });
  return `SCA-${first}-${second}`;
}

function isValidCode(code) {
  return /^SCA-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(code || '').trim().toUpperCase());
}

async function copyAccountCode() {
  try {
    await navigator.clipboard.writeText(accountCode);
    setSyncStatus('Kod kopyalandi');
  } catch {
    setSyncStatus('Kod: ' + accountCode);
  }
}

async function loadCollectionByCode() {
  const code = String(elements.codeInput.value || '').trim().toUpperCase();
  if (!isValidCode(code)) {
    setSyncStatus('Kod formati hatali');
    return;
  }
  accountCode = code;
  localStorage.setItem(accountStorageKey, accountCode);
  await syncFromCloud(true);
  elements.codeLoginPanel.hidden = true;
  render();
}

function scheduleCloudSave() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(saveToCloud, 650);
}

async function syncFromCloud(replaceLocal = false) {
  setSyncStatus('Bulut kontrol ediliyor');
  try {
    const response = await fetch(`/api/cards?code=${encodeURIComponent(accountCode)}`);
    if (!response.ok) throw new Error('load failed');
    const data = await response.json();
    if (Array.isArray(data.cards) && (replaceLocal || data.cards.length > cards.length)) {
      cards = data.cards;
      activeCollectionIndex = 0;
      saveCards();
      setSyncStatus('Koleksiyon yuklendi');
    } else {
      setSyncStatus('Koleksiyon hazir');
      if (cards.length > 0 && !data.updatedAt) scheduleCloudSave();
    }
    render();
  } catch {
    setSyncStatus('Cevrimdisi kayit');
  }
}

async function saveToCloud() {
  setSyncStatus('Kaydediliyor');
  try {
    const response = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: accountCode, cards })
    });
    if (!response.ok) throw new Error('save failed');
    setSyncStatus('Buluta kaydedildi');
  } catch {
    setSyncStatus('Telefona kaydedildi');
  }
}

function setSyncStatus(message) {
  elements.syncStatus.textContent = message;
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
