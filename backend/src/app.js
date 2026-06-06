// Express application factory. Exported separately from server.js so tests can
// import the app without binding a port.
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import db from './db.js';
import { signToken, requireAuth } from './auth.js';
import { QUESTIONS } from './data/assessment.js';
import {
  aiEnabled,
  generateFocusAreas,
  generatePrompt,
  reflectOnEntry,
  guideReply,
  weeklySummary,
} from './services/llm.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Email allowlist (PRD-style invite control). When ALLOWED_EMAILS is empty,
// signup is open; when it lists addresses (comma-separated), only those can register.
function emailAllowed(email) {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw || !raw.trim()) return true;
  const list = raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(String(email).toLowerCase());
}

// Build a focusAreas array [{title, desc}] from the latest results row.
function latestFocusAreas(userId) {
  const r = db
    .prepare('SELECT * FROM results WHERE user_id = ? ORDER BY id DESC LIMIT 1')
    .get(userId);
  if (!r) return [];
  return [
    { title: r.focus_1_title, desc: r.focus_1_desc },
    { title: r.focus_2_title, desc: r.focus_2_desc },
    { title: r.focus_3_title, desc: r.focus_3_desc },
  ].filter((f) => f.title);
}

function getProfile(userId) {
  return db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) || {};
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) =>
    res.json({ ok: true, ai: aiEnabled() ? 'openai' : 'rule-based' })
  );

  // ---------------- Auth (PRD Screen 3) ----------------
  app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (!emailAllowed(email))
      return res
        .status(403)
        .json({ error: 'This email is not on the invite list yet. Ask the owner to add you.' });
    if (String(password).length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email.toLowerCase(), hash);
    const userId = info.lastInsertRowid;
    db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(userId);

    const user = { id: Number(userId), name, email: email.toLowerCase() };
    res.status(201).json({ token: signToken(user), user });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
    if (!user || !user.password_hash)
      return res.status(401).json({ error: 'Invalid email or password.' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
    const profile = getProfile(user.id);
    res.json({
      token: signToken(user),
      user: { id: user.id, name: user.name, email: user.email },
      assessmentCompleted: Boolean(profile.assessment_completed),
    });
  });

  // ---------------- Profile (PRD Screen 4 & 15) ----------------
  app.get('/api/me', requireAuth, (req, res) => {
    const user = db
      .prepare('SELECT id, name, email, notification_pref, reminder_time, subscription_status FROM users WHERE id = ?')
      .get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const profile = getProfile(req.user.id);
    res.json({ user, profile, focusAreas: latestFocusAreas(req.user.id) });
  });

  app.put('/api/profile', requireAuth, (req, res) => {
    const { age_range, life_season, intention, guidance_style, name } = req.body || {};
    if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
    db.prepare(
      `UPDATE user_profiles
       SET age_range = COALESCE(?, age_range),
           life_season = COALESCE(?, life_season),
           intention = COALESCE(?, intention),
           guidance_style = COALESCE(?, guidance_style)
       WHERE user_id = ?`
    ).run(age_range ?? null, life_season ?? null, intention ?? null, guidance_style ?? null, req.user.id);
    res.json({ profile: getProfile(req.user.id) });
  });

  app.put('/api/settings', requireAuth, (req, res) => {
    const { notification_pref, reminder_time } = req.body || {};
    db.prepare(
      'UPDATE users SET notification_pref = COALESCE(?, notification_pref), reminder_time = COALESCE(?, reminder_time) WHERE id = ?'
    ).run(notification_pref ?? null, reminder_time ?? null, req.user.id);
    res.json({ ok: true });
  });

  // ---------------- Assessment (PRD Screen 6) ----------------
  app.get('/api/assessment/questions', (req, res) => {
    // Strip internal category mappings from the public payload.
    res.json({
      questions: QUESTIONS.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options.map((o) => o.label),
      })),
    });
  });

  // Submit answers -> generate & persist Top 3 Focus Areas (always exactly 3).
  app.post('/api/assessment/submit', requireAuth, async (req, res) => {
    const { answers } = req.body || {};
    if (!Array.isArray(answers) || answers.length !== QUESTIONS.length)
      return res
        .status(400)
        .json({ error: `Please answer all ${QUESTIONS.length} questions.` });

    for (const a of answers) {
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      if (!q) return res.status(400).json({ error: `Unknown question id ${a.questionId}.` });
      if (!q.options.some((o) => o.label === a.answer))
        return res.status(400).json({ error: `Invalid answer for question ${a.questionId}.` });
    }

    // Reset prior answers, then store fresh ones.
    db.prepare('DELETE FROM assessment_answers WHERE user_id = ?').run(req.user.id);
    const ins = db.prepare(
      'INSERT INTO assessment_answers (user_id, question_id, answer, category) VALUES (?, ?, ?, ?)'
    );
    const normalized = answers.map((a) => {
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      ins.run(req.user.id, a.questionId, a.answer, q.category);
      return { question_id: a.questionId, answer: a.answer, category: q.category };
    });

    const profile = getProfile(req.user.id);
    const areas = await generateFocusAreas({ profile, answers: normalized });

    db.prepare(
      `INSERT INTO results
       (user_id, focus_1_title, focus_1_desc, focus_2_title, focus_2_desc, focus_3_title, focus_3_desc)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.user.id,
      areas[0].title, areas[0].desc,
      areas[1].title, areas[1].desc,
      areas[2].title, areas[2].desc
    );
    db.prepare('UPDATE user_profiles SET assessment_completed = 1 WHERE user_id = ?').run(req.user.id);

    // First personalized prompt (PRD Screen 9).
    const firstPrompt = await generatePrompt({ profile, focusAreas: areas });
    res.json({ focusAreas: areas, firstPrompt });
  });

  app.get('/api/results', requireAuth, (req, res) => {
    res.json({ focusAreas: latestFocusAreas(req.user.id) });
  });

  // ---------------- Prompts ----------------
  app.get('/api/prompt/daily', requireAuth, async (req, res) => {
    const profile = getProfile(req.user.id);
    const focusAreas = latestFocusAreas(req.user.id);
    const recent = db
      .prepare('SELECT tags FROM journal_entries WHERE user_id = ? ORDER BY id DESC LIMIT 5')
      .all(req.user.id)
      .map((r) => r.tags)
      .filter(Boolean);
    const prompt = await generatePrompt({ profile, focusAreas, recentThemes: recent });
    res.json({ prompt });
  });

  // ---------------- Journal (PRD Screen 11) ----------------
  app.get('/api/journal', requireAuth, (req, res) => {
    const { theme, favorite } = req.query;
    let sql = 'SELECT * FROM journal_entries WHERE user_id = ?';
    const args = [req.user.id];
    if (theme) {
      sql += ' AND tags LIKE ?';
      args.push(`%${theme}%`);
    }
    if (favorite === 'true') sql += ' AND favorite = 1';
    sql += ' ORDER BY id DESC';
    res.json({ entries: db.prepare(sql).all(...args) });
  });

  app.post('/api/journal', requireAuth, async (req, res) => {
    const { prompt_text, journal_text, mood_before, mood_after, tags, reflect } = req.body || {};
    if (!journal_text || !String(journal_text).trim())
      return res.status(400).json({ error: 'Journal entry cannot be empty.' });

    let ai_reflection = null;
    if (reflect) {
      ai_reflection = await reflectOnEntry({
        entryText: journal_text,
        focusAreas: latestFocusAreas(req.user.id),
      });
    }
    const info = db
      .prepare(
        `INSERT INTO journal_entries (user_id, prompt_text, journal_text, mood_before, mood_after, tags, ai_reflection)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        prompt_text ?? null,
        journal_text,
        mood_before ?? null,
        mood_after ?? null,
        tags ?? null,
        ai_reflection
      );
    res.status(201).json({ entry: db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(info.lastInsertRowid) });
  });

  app.patch('/api/journal/:id/favorite', requireAuth, (req, res) => {
    const entry = db
      .prepare('SELECT * FROM journal_entries WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    const next = entry.favorite ? 0 : 1;
    db.prepare('UPDATE journal_entries SET favorite = ? WHERE id = ?').run(next, entry.id);
    res.json({ favorite: Boolean(next) });
  });

  // ---------------- Practices (PRD Screen 13) ----------------
  app.get('/api/practices', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT * FROM practices ORDER BY id').all();
    res.json({
      practices: rows.map((p) => ({ ...p, steps: JSON.parse(p.steps || '[]') })),
    });
  });

  app.post('/api/practices/:id/complete', requireAuth, (req, res) => {
    const practice = db.prepare('SELECT id FROM practices WHERE id = ?').get(req.params.id);
    if (!practice) return res.status(404).json({ error: 'Practice not found.' });
    db.prepare('INSERT INTO practice_completions (user_id, practice_id) VALUES (?, ?)').run(
      req.user.id,
      practice.id
    );
    res.status(201).json({ ok: true });
  });

  // ---------------- AI Guide (PRD Screen 12) ----------------
  app.post('/api/ai/guide', requireAuth, async (req, res) => {
    const { message, history } = req.body || {};
    if (!message || !String(message).trim())
      return res.status(400).json({ error: 'Message cannot be empty.' });
    const reply = await guideReply({
      message,
      history: Array.isArray(history) ? history.slice(-10) : [],
      profile: getProfile(req.user.id),
      focusAreas: latestFocusAreas(req.user.id),
    });
    res.json({ reply });
  });

  // ---------------- Progress (PRD Screen 14) ----------------
  app.get('/api/progress', requireAuth, async (req, res) => {
    const uid = req.user.id;
    const entries = db
      .prepare('SELECT journal_text, mood_before, mood_after, tags, created_at FROM journal_entries WHERE user_id = ? ORDER BY id DESC')
      .all(uid);
    const completions = db
      .prepare('SELECT COUNT(*) AS c FROM practice_completions WHERE user_id = ?')
      .get(uid).c;

    // Journaling streak: consecutive days (by local date) with at least one entry.
    const days = new Set(entries.map((e) => e.created_at.slice(0, 10)));
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (days.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else if (streak === 0 && key === new Date().toISOString().slice(0, 10)) {
        // allow today to be empty without breaking a prior streak
        d.setDate(d.getDate() - 1);
      } else break;
    }

    // Most common themes from tags.
    const themeCount = {};
    for (const e of entries) {
      (e.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => (themeCount[t] = (themeCount[t] || 0) + 1));
    }
    const topThemes = Object.entries(themeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t);

    res.json({
      entryCount: entries.length,
      completedPractices: completions,
      streak,
      topThemes,
      moodTrend: entries.slice(0, 14).reverse().map((e) => e.mood_after || e.mood_before).filter(Boolean),
    });
  });

  app.get('/api/progress/weekly-summary', requireAuth, async (req, res) => {
    const entries = db
      .prepare("SELECT journal_text FROM journal_entries WHERE user_id = ? AND created_at >= datetime('now', '-7 days') ORDER BY id DESC")
      .all(req.user.id);
    const summary = await weeklySummary({ entries, focusAreas: latestFocusAreas(req.user.id) });
    res.json({ summary });
  });

  // ---- Serve the built React SPA (production / single-URL deploy) ----
  // In dev the Vite server handles the UI; in production Express serves
  // frontend/dist so the whole app lives on one origin (no CORS, no proxy).
  const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Fallback error handler.
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  });

  return app;
}

export default createApp;
