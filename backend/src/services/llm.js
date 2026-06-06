// LLM service. Uses OpenAI when OPENAI_API_KEY is set; otherwise falls back to a
// deterministic rule-based engine so the whole app runs offline (PRD §14 allows
// a simple scoring system for the MVP).
import OpenAI from 'openai';
import { QUESTIONS, FOCUS_AREA_CATALOG } from '../data/assessment.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const hasKey = () => Boolean(process.env.OPENAI_API_KEY);

let client = null;
function openai() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export function aiEnabled() {
  return hasKey();
}

// System prompt encodes the brand voice and the safety boundaries from PRD §8/§12.
const SYSTEM_PROMPT = `You are the AI Guide inside "Nouvel", a luxury self-mastery and journaling app.
Voice: warm, wise, grounded, emotionally intelligent, calm, premium — encouraging but never overly casual.
You must NOT: diagnose mental health conditions, claim to replace therapy, give medical/legal advice, or make extreme spiritual or manipulative claims.
If a user expresses crisis or self-harm, gently encourage them to reach out to a professional or emergency services.
Keep responses concise, personal, and reflective. Speak directly to the user.`;

async function chat(messages, { json = false, maxTokens = 500 } = {}) {
  const res = await openai().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.8,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });
  return res.choices[0].message.content.trim();
}

// ---------------- Rule-based scoring ----------------
// Tally categories from the user's answers and map the top 3 to focus areas.
function scoreCategories(answers) {
  const tally = {};
  for (const a of answers) {
    const q = QUESTIONS.find((x) => x.id === a.question_id);
    if (!q) continue;
    const opt = q.options.find((o) => o.label === a.answer);
    const cats = opt?.categories || (a.category ? [a.category] : []);
    for (const c of cats) tally[c] = (tally[c] || 0) + 1;
  }
  return tally;
}

function ruleFocusAreas(answers) {
  const tally = scoreCategories(answers);
  const ranked = Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([c]) => c);

  // Map ranked categories to distinct focus areas; always return exactly 3.
  const chosen = [];
  const seenTitles = new Set();
  for (const cat of ranked) {
    const fa = FOCUS_AREA_CATALOG[cat];
    if (fa && !seenTitles.has(fa.title)) {
      chosen.push(fa);
      seenTitles.add(fa.title);
    }
    if (chosen.length === 3) break;
  }
  // Pad from the catalog if fewer than 3 distinct areas emerged.
  for (const fa of Object.values(FOCUS_AREA_CATALOG)) {
    if (chosen.length === 3) break;
    if (!seenTitles.has(fa.title)) {
      chosen.push(fa);
      seenTitles.add(fa.title);
    }
  }
  return chosen.slice(0, 3);
}

// ---------------- Public API ----------------

// Always returns exactly 3 { title, desc } focus areas (PRD §7 Feature 2).
export async function generateFocusAreas({ profile, answers }) {
  if (!hasKey()) return ruleFocusAreas(answers);
  try {
    const answerText = answers.map((a) => `Q${a.question_id}: ${a.answer}`).join('\n');
    const content = await chat(
      [
        {
          role: 'user',
          content: `User profile: ${JSON.stringify(profile)}.
Assessment answers:
${answerText}

Return JSON: {"focusAreas":[{"title":"...","desc":"..."},{...},{...}]}.
Return EXACTLY 3 focus areas. Each title is 3-6 words. Each desc is 1-2 warm sentences written directly to the user ("You may...").`,
        },
      ],
      { json: true, maxTokens: 500 }
    );
    const parsed = JSON.parse(content);
    const areas = (parsed.focusAreas || []).slice(0, 3).filter((a) => a.title && a.desc);
    if (areas.length === 3) return areas;
    return ruleFocusAreas(answers); // fall back if the model returned a bad shape
  } catch (err) {
    console.error('generateFocusAreas LLM error, using fallback:', err.message);
    return ruleFocusAreas(answers);
  }
}

// A single personalized journaling prompt.
export async function generatePrompt({ profile, focusAreas, recentThemes = [], mood = null }) {
  const primary = focusAreas?.[0]?.title || 'self-awareness';
  if (!hasKey()) {
    const pool = [
      `Where in your life are you craving more emotional safety, clarity, or truth — and what would change if you honored that need today?`,
      `Thinking about ${primary.toLowerCase()}: what is one small, honest step you could take this week?`,
      `What feeling has been asking for your attention lately, and what might it be trying to protect?`,
      `If the next version of you were writing today's entry, what would they want you to remember?`,
    ];
    // Deterministic pick based on number of recent themes so it varies over time.
    return pool[recentThemes.length % pool.length];
  }
  try {
    return await chat(
      [
        {
          role: 'user',
          content: `Write ONE journaling prompt (1-2 sentences) for this user.
Profile: ${JSON.stringify(profile)}.
Top focus area: ${primary}.
Recent journal themes: ${recentThemes.join(', ') || 'none yet'}.
Current mood: ${mood || 'unknown'}.
Return only the prompt text, no quotes.`,
        },
      ],
      { maxTokens: 120 }
    );
  } catch (err) {
    console.error('generatePrompt LLM error, using fallback:', err.message);
    return `Thinking about ${primary.toLowerCase()}: what is one honest truth you are ready to face today?`;
  }
}

// A short reflection after a journal entry (PRD §7 Feature 4 optional AI).
export async function reflectOnEntry({ entryText, focusAreas = [] }) {
  if (!hasKey()) {
    return `Your entry shows a desire for more honesty and alignment. A powerful next step may be naming what you need before trying to make others comfortable.`;
  }
  try {
    return await chat(
      [
        {
          role: 'user',
          content: `Reflect back the themes in this journal entry in 2-3 warm sentences. Offer one gentle next step. Do not diagnose.
Focus areas: ${focusAreas.map((f) => f.title).join(', ')}.
Entry: """${entryText}"""`,
        },
      ],
      { maxTokens: 180 }
    );
  } catch (err) {
    console.error('reflectOnEntry LLM error, using fallback:', err.message);
    return `Thank you for being honest with yourself. Notice what feels most alive in what you wrote, and let that guide one small step today.`;
  }
}

// Free-form AI Guide conversation (PRD §6 Screen 12).
export async function guideReply({ message, history = [], profile, focusAreas = [] }) {
  if (!hasKey()) {
    return `It sounds like something meaningful is moving in you. Let's slow down together — what feels most unknown or unsettled right now, and what would feel supportive in this moment?`;
  }
  try {
    const msgs = [
      {
        role: 'user',
        content: `Context — profile: ${JSON.stringify(profile)}; focus areas: ${focusAreas
          .map((f) => f.title)
          .join(', ')}.`,
      },
      ...history.map((h) => ({ role: h.role === 'ai' ? 'assistant' : 'user', content: h.content })),
      { role: 'user', content: message },
    ];
    return await chat(msgs, { maxTokens: 350 });
  } catch (err) {
    console.error('guideReply LLM error, using fallback:', err.message);
    return `I'm here with you. Tell me a little more about what's present for you right now.`;
  }
}

// Weekly growth summary (PRD §6 Screen 14).
export async function weeklySummary({ entries = [], focusAreas = [] }) {
  if (entries.length === 0) {
    return 'You have not journaled yet this period. When you are ready, even a few honest minutes can reveal a meaningful pattern.';
  }
  if (!hasKey()) {
    return `This period, your reflections centered around emotional safety, self-trust, and creating stronger boundaries. Your next growth edge may be expressing your needs more clearly without overexplaining.`;
  }
  try {
    const text = entries.map((e) => e.journal_text).join('\n---\n').slice(0, 4000);
    return await chat(
      [
        {
          role: 'user',
          content: `Summarize the emotional themes across these journal entries in 2-3 sentences and name one growth edge. Warm, non-clinical.
Focus areas: ${focusAreas.map((f) => f.title).join(', ')}.
Entries:\n${text}`,
        },
      ],
      { maxTokens: 200 }
    );
  } catch (err) {
    console.error('weeklySummary LLM error, using fallback:', err.message);
    return 'This period your writing returned to themes of clarity and self-trust. A gentle next step may be honoring one need without overexplaining it.';
  }
}
