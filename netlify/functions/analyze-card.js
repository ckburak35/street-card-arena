const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(501, { error: 'missing_openai_api_key' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const imageUri = String(payload.imageUri || '');
  const selectedKind = payload.selectedKind === 'dog' ? 'dog' : payload.selectedKind === 'cat' ? 'cat' : 'unknown';

  if (!imageUri.startsWith('data:image/')) {
    return json(400, { error: 'invalid_image' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.5',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  'Analyze this photo for a street-animal trading card game.',
                  'Only score visible real cats or dogs. If there is no clear cat/dog, set isAnimal false.',
                  `The user selected: ${selectedKind}. Prefer the visual evidence over the user selection.`,
                  'Return playful game stats, not medical or factual claims.',
                  'Use 0-100 integers. overall should reflect the stats and card quality.',
                  'rarity must be one of: Common, Uncommon, Rare, Epic, Legendary, Mythic.',
                  'Keep Turkish text short and game-like.'
                ].join(' ')
              },
              {
                type: 'input_image',
                image_url: imageUri,
                detail: 'low'
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'animal_card_analysis',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['isAnimal', 'animalKind', 'confidence', 'name', 'rarity', 'stats', 'summary', 'backgroundStyle'],
              properties: {
                isAnimal: { type: 'boolean' },
                animalKind: { type: 'string', enum: ['cat', 'dog', 'unknown'] },
                confidence: { type: 'integer', minimum: 0, maximum: 100 },
                name: { type: 'string', minLength: 2, maxLength: 28 },
                rarity: { type: 'string', enum: rarityOrder },
                stats: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['speed', 'stamina', 'power', 'charm', 'overall'],
                  properties: {
                    speed: { type: 'integer', minimum: 0, maximum: 100 },
                    stamina: { type: 'integer', minimum: 0, maximum: 100 },
                    power: { type: 'integer', minimum: 0, maximum: 100 },
                    charm: { type: 'integer', minimum: 0, maximum: 100 },
                    overall: { type: 'integer', minimum: 0, maximum: 100 }
                  }
                },
                summary: { type: 'string', minLength: 4, maxLength: 120 },
                backgroundStyle: { type: 'string', minLength: 4, maxLength: 80 }
              }
            }
          }
        },
        max_output_tokens: 550
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return json(response.status, { error: 'openai_error', detail: data.error?.message || 'OpenAI request failed' });
    }

    const text = extractOutputText(data);
    const analysis = normalizeAnalysis(JSON.parse(text), selectedKind);
    return json(200, { analysis });
  } catch (error) {
    return json(500, { error: 'analysis_failed', detail: error.message });
  }
};

function extractOutputText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  for (const item of data.output || []) {
    for (const part of item.content || []) {
      if (part.type === 'output_text' && typeof part.text === 'string') return part.text;
    }
  }
  throw new Error('No output text returned');
}

function normalizeAnalysis(raw, selectedKind) {
  const stats = raw.stats || {};
  const normalizedStats = {
    speed: clampInt(stats.speed),
    stamina: clampInt(stats.stamina),
    power: clampInt(stats.power),
    charm: clampInt(stats.charm),
    overall: clampInt(stats.overall)
  };

  const animalKind = ['cat', 'dog', 'unknown'].includes(raw.animalKind) ? raw.animalKind : selectedKind;
  const rarity = rarityOrder.includes(raw.rarity) ? raw.rarity : rarityFromOverall(normalizedStats.overall);

  return {
    isAnimal: Boolean(raw.isAnimal),
    animalKind,
    confidence: clampInt(raw.confidence),
    name: cleanText(raw.name, animalKind === 'dog' ? 'Sokak Dostu' : 'Patili Dost'),
    rarity,
    stats: normalizedStats,
    summary: cleanText(raw.summary, 'AI analizi hazir.'),
    backgroundStyle: cleanText(raw.backgroundStyle, 'parlak sokak karti')
  };
}

function rarityFromOverall(overall) {
  if (overall >= 95) return 'Mythic';
  if (overall >= 88) return 'Legendary';
  if (overall >= 78) return 'Epic';
  if (overall >= 68) return 'Rare';
  if (overall >= 58) return 'Uncommon';
  return 'Common';
}

function cleanText(value, fallback) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function clampInt(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}
