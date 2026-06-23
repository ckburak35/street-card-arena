const { getStore } = require('@netlify/blobs');

const maxCards = 80;

exports.handler = async (event) => {
  const code = cleanCode(event.queryStringParameters?.code || readCodeFromBody(event.body));
  if (!code) return json(400, { error: 'invalid_code' });

  const store = getStore('street-card-collections');

  if (event.httpMethod === 'GET') {
    const data = await store.get(code, { type: 'json' });
    return json(200, data || { code, cards: [], updatedAt: null });
  }

  if (event.httpMethod === 'POST') {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'invalid_json' });
    }

    const cards = Array.isArray(payload.cards) ? payload.cards.slice(0, maxCards) : [];
    const record = {
      code,
      cards,
      updatedAt: new Date().toISOString()
    };

    await store.setJSON(code, record);
    return json(200, { ok: true, updatedAt: record.updatedAt });
  }

  return json(405, { error: 'method_not_allowed' });
};

function readCodeFromBody(body) {
  try {
    return JSON.parse(body || '{}').code;
  } catch {
    return '';
  }
}

function cleanCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^SCA-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) ? code : '';
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
