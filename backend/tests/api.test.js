// API tests covering positive (happy-path) and negative (error/edge) cases.
// Runs entirely on an in-memory SQLite DB with the rule-based AI fallback,
// so no OpenAI key or network is required: `npm test` from the backend folder.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Configure environment BEFORE importing modules that read it at load time.
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';
delete process.env.OPENAI_API_KEY; // force deterministic rule-based engine

const { createApp } = await import('../src/app.js');

let server;
let base;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server && server.close());

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

// ---------------------------------------------------------------------------
// POSITIVE: full happy path — signup, profile, assessment, journal, practices
// ---------------------------------------------------------------------------
test('POSITIVE: health endpoint reports rule-based mode', async () => {
  const { status, json } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(json.ai, 'rule-based');
});

let token;

test('POSITIVE: user can sign up', async () => {
  const { status, json } = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Nysa', email: 'nysa@example.com', password: 'secret123' },
  });
  assert.equal(status, 201);
  assert.ok(json.token, 'returns a JWT');
  assert.equal(json.user.email, 'nysa@example.com');
  token = json.token;
});

test('POSITIVE: user can update profile', async () => {
  const { status, json } = await api('/api/profile', {
    method: 'PUT',
    token,
    body: { age_range: '25-34', life_season: 'I am ready to grow', intention: 'Clarity', guidance_style: 'A mix of all' },
  });
  assert.equal(status, 200);
  assert.equal(json.profile.life_season, 'I am ready to grow');
});

test('POSITIVE: assessment returns exactly 3 focus areas + a first prompt', async () => {
  const { json: q } = await api('/api/assessment/questions');
  assert.equal(q.questions.length, 10);

  // Choose the first option of every question.
  const answers = q.questions.map((qq) => ({ questionId: qq.id, answer: qq.options[0] }));
  const { status, json } = await api('/api/assessment/submit', { method: 'POST', token, body: { answers } });
  assert.equal(status, 200);
  assert.equal(json.focusAreas.length, 3, 'always exactly 3 focus areas');
  // Titles must be distinct.
  const titles = new Set(json.focusAreas.map((f) => f.title));
  assert.equal(titles.size, 3);
  assert.ok(json.firstPrompt && json.firstPrompt.length > 0);
});

test('POSITIVE: daily prompt is personalized & non-empty', async () => {
  const { status, json } = await api('/api/prompt/daily', { token });
  assert.equal(status, 200);
  assert.ok(json.prompt.length > 0);
});

let entryId;
test('POSITIVE: user can save a journal entry with mood + tags', async () => {
  const { status, json } = await api('/api/journal', {
    method: 'POST',
    token,
    body: {
      prompt_text: 'Where are you craving more clarity?',
      journal_text: 'I want more emotional safety and stronger boundaries.',
      mood_before: 'anxious',
      mood_after: 'calm',
      tags: 'boundaries, clarity',
    },
  });
  assert.equal(status, 201);
  assert.equal(json.entry.mood_after, 'calm');
  entryId = json.entry.id;
});

test('POSITIVE: journal can be filtered by theme', async () => {
  const { status, json } = await api('/api/journal?theme=boundaries', { token });
  assert.equal(status, 200);
  assert.equal(json.entries.length, 1);
});

test('POSITIVE: favoriting an entry toggles it on', async () => {
  const { status, json } = await api(`/api/journal/${entryId}/favorite`, { method: 'PATCH', token });
  assert.equal(status, 200);
  assert.equal(json.favorite, true);
});

test('POSITIVE: practices are seeded and completable', async () => {
  const { json } = await api('/api/practices', { token });
  assert.ok(json.practices.length >= 5);
  assert.ok(Array.isArray(json.practices[0].steps));
  const { status } = await api(`/api/practices/${json.practices[0].id}/complete`, { method: 'POST', token });
  assert.equal(status, 201);
});

test('POSITIVE: AI guide returns a supportive reply', async () => {
  const { status, json } = await api('/api/ai/guide', {
    method: 'POST',
    token,
    body: { message: 'I keep feeling anxious about my future.' },
  });
  assert.equal(status, 200);
  assert.ok(json.reply.length > 0);
});

test('POSITIVE: progress reflects activity (streak + completions)', async () => {
  const { status, json } = await api('/api/progress', { token });
  assert.equal(status, 200);
  assert.equal(json.entryCount, 1);
  assert.equal(json.completedPractices, 1);
  assert.ok(json.streak >= 1);
  assert.ok(json.topThemes.includes('boundaries'));
});

// ---------------------------------------------------------------------------
// NEGATIVE: validation, auth, and not-found handling
// ---------------------------------------------------------------------------
test('NEGATIVE: signup rejects invalid email', async () => {
  const { status, json } = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'X', email: 'not-an-email', password: 'secret123' },
  });
  assert.equal(status, 400);
  assert.match(json.error, /valid email/i);
});

test('NEGATIVE: signup rejects short password', async () => {
  const { status } = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'X', email: 'x2@example.com', password: '123' },
  });
  assert.equal(status, 400);
});

test('NEGATIVE: duplicate email is rejected with 409', async () => {
  const { status } = await api('/api/auth/signup', {
    method: 'POST',
    body: { name: 'Nysa', email: 'nysa@example.com', password: 'secret123' },
  });
  assert.equal(status, 409);
});

test('NEGATIVE: login with wrong password fails with 401', async () => {
  const { status } = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'nysa@example.com', password: 'wrongpass' },
  });
  assert.equal(status, 401);
});

test('NEGATIVE: protected route without token returns 401', async () => {
  const { status } = await api('/api/me');
  assert.equal(status, 401);
});

test('NEGATIVE: protected route with garbage token returns 401', async () => {
  const { status } = await api('/api/me', { token: 'garbage.token.value' });
  assert.equal(status, 401);
});

test('NEGATIVE: assessment with too few answers is rejected', async () => {
  const { status, json } = await api('/api/assessment/submit', {
    method: 'POST',
    token,
    body: { answers: [{ questionId: 1, answer: 'My emotions' }] },
  });
  assert.equal(status, 400);
  assert.match(json.error, /all 10/i);
});

test('NEGATIVE: assessment with an invalid answer label is rejected', async () => {
  const { json: q } = await api('/api/assessment/questions');
  const answers = q.questions.map((qq) => ({ questionId: qq.id, answer: qq.options[0] }));
  answers[0].answer = 'totally made up option';
  const { status, json } = await api('/api/assessment/submit', { method: 'POST', token, body: { answers } });
  assert.equal(status, 400);
  assert.match(json.error, /invalid answer/i);
});

test('NEGATIVE: empty journal entry is rejected', async () => {
  const { status } = await api('/api/journal', { method: 'POST', token, body: { journal_text: '   ' } });
  assert.equal(status, 400);
});

test('NEGATIVE: empty AI guide message is rejected', async () => {
  const { status } = await api('/api/ai/guide', { method: 'POST', token, body: { message: '' } });
  assert.equal(status, 400);
});

test('NEGATIVE: completing a non-existent practice returns 404', async () => {
  const { status } = await api('/api/practices/99999/complete', { method: 'POST', token });
  assert.equal(status, 404);
});

test('NEGATIVE: favoriting another concept that does not exist returns 404', async () => {
  const { status } = await api('/api/journal/99999/favorite', { method: 'PATCH', token });
  assert.equal(status, 404);
});
