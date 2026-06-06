# Nouvel — Workflows

This document describes the end-to-end workflows of the app, mapping PRD §5 (Core User
Flow) onto the implemented routes and API calls. Each workflow lists the steps, the
backend interactions, and the **positive** (expected) and **negative** (failure/edge)
paths.

---

## Workflow 1 — First-time user onboarding (PRD §5)

```
Splash → Welcome → Sign Up → Profile Setup → Onboarding Intro →
Assessment (10 Q) → Loading → Results (Top 3) → First Prompt → Dashboard
```

**Steps & API calls**
1. `Splash` waits for auth state, routes new users to `/welcome`.
2. `Welcome` → "Begin" → `/signup`.
3. `Sign Up` → `POST /api/auth/signup` → stores JWT, creates empty `user_profiles` row.
4. `Profile Setup` → `PUT /api/profile` (age range, life season, intention).
5. `Onboarding Intro` → "Start Assessment".
6. `Assessment` collects 10 answers, one per screen, with a progress bar.
7. On finish → `POST /api/assessment/submit` → server scores answers, writes a `results`
   row with **exactly 3 focus areas**, sets `assessment_completed = 1`, and returns the
   focus areas + the first personalized prompt.
8. `Loading` shows the breathing animation during the request.
9. `Results` renders the 3 focus areas.
10. `First Prompt` → `POST /api/journal` saves the first entry (with optional mood).
11. Lands on `Dashboard`.

| Positive | Negative |
|----------|----------|
| Valid name/email/password ≥6 chars → 201 + JWT | Invalid email format → 400 "Please enter a valid email." |
| All 10 questions answered → 200, 3 focus areas, first prompt | Submitting <10 answers → 400 "Please answer all 10 questions." |
| Distinct focus titles always returned | An answer label not in the question's options → 400 "Invalid answer…" |
| Duplicate signup email → 409 (user told to log in) | Empty journal text on first prompt → 400 "Journal entry cannot be empty." |

---

## Workflow 2 — Returning user (PRD §5)

```
Splash → (token valid & assessment done) → Dashboard
```

1. `Splash`/`AuthContext` calls `GET /api/me` with the stored JWT.
2. Dashboard loads in parallel: `GET /api/prompt/daily`, `/api/results`,
   `/api/practices`, `/api/progress`.

| Positive | Negative |
|----------|----------|
| Valid token → `/api/me` 200 → Dashboard | Expired/garbage token → 401 → token cleared → redirect to `/welcome` |
| Login with correct credentials → JWT, routed by `assessmentCompleted` | Wrong password → 401 "Invalid email or password." |
| Assessment not yet done → routed to `/profile-setup` | No token on a protected route → 401 |

---

## Workflow 3 — Daily journaling

```
Dashboard "Journal on this" → Journal (write) → Save → History
```

1. Daily prompt comes from `GET /api/prompt/daily` (uses profile + focus areas + recent
   themes).
2. User selects mood-before, writes, adds themes, optionally ticks "AI reflection",
   selects mood-after.
3. `POST /api/journal` (with `reflect: true`) saves the entry and, if a reflection was
   requested, stores `ai_reflection`.
4. History view lists entries, supports `?theme=` filtering and favorite toggling.

| Positive | Negative |
|----------|----------|
| Non-empty entry → 201, appears in history | Whitespace-only entry → 400 |
| `?theme=boundaries` returns only matching entries | Theme with no matches → empty list (not an error) |
| `PATCH /journal/:id/favorite` toggles star | Favorite a non-existent/foreign entry id → 404 |
| Reflection requested → entry has `ai_reflection` | OpenAI error mid-reflection → fallback reflection text (still 201) |

---

## Workflow 4 — AI Guide conversation (PRD §6 Screen 12)

```
AI Guide → type message → POST /api/ai/guide → reply bubble
```

1. Last ≤10 messages sent as `history` for context.
2. Server builds a brand+safety system prompt, profile, and focus areas, then calls
   OpenAI (or returns a grounded fallback reply).

| Positive | Negative |
|----------|----------|
| Message → warm, on-brand reply | Empty message → 400 "Message cannot be empty." |
| Multi-turn context preserved (history) | Network/LLM failure → safe fallback reply, UI stays usable |
| Safety prompt blocks diagnosis/medical/crisis advice | (Guardrail) Crisis language → model encouraged to point to professional help |

---

## Workflow 5 — Practices (PRD §6 Screen 13)

```
Practices → expand a practice → Complete → counts in Progress
```

1. `GET /api/practices` returns the seeded library with parsed `steps`.
2. `POST /api/practices/:id/complete` records a completion.

| Positive | Negative |
|----------|----------|
| Expand → see steps; Complete → 201, button shows ✓ | Complete a non-existent practice id → 404 |
| Completion increments Progress "PRACTICES" | Unauthenticated complete → 401 |

---

## Workflow 6 — Progress & weekly summary (PRD §6 Screen 14)

```
Progress → GET /api/progress + GET /api/progress/weekly-summary
```

- **Streak**: consecutive days (by date) with ≥1 entry; an empty *today* doesn't break a
  prior streak.
- **Themes**: aggregated from entry tags.
- **Mood trend**: last 14 entries' after/before mood.
- **Weekly summary**: LLM (or fallback) over the last 7 days of entries.

| Positive | Negative |
|----------|----------|
| Entries + completions reflected in stats | New user with no data → zeros + gentle empty-state copy |
| Tags surface as "Most common themes" | No tags → "Add themes to your entries…" message |
| Weekly summary generated from entries | No entries in 7 days → friendly "not journaled yet" summary |

---

## Workflow 7 — Profile / Settings (PRD §6 Screen 15)

```
Profile → edit name/intention/notifications/reminder → Save
       → Retake assessment → Log out
```

| Positive | Negative |
|----------|----------|
| Save → `PUT /api/profile` + `/api/settings` → "✓ Saved" | Unauthenticated save → 401 |
| "Retake assessment" routes back to onboarding (overwrites prior answers/results) | — |
| Log out clears token, returns to Welcome | Reusing cleared token → 401 |

---

## Sequence: assessment submission (the personalization core)

```
Client                     Express                  scoring/LLM            SQLite
  │  POST /assessment/submit  │                          │                   │
  │ ───────────────────────▶ │  validate 10 answers     │                   │
  │                          │ ── invalid? 400 ────────▶ │ (no write)        │
  │                          │  DELETE old answers ───────────────────────▶ │
  │                          │  INSERT answers ───────────────────────────▶ │
  │                          │  generateFocusAreas() ──▶ │ (rules or OpenAI) │
  │                          │  INSERT results (3) ───────────────────────▶ │
  │                          │  UPDATE assessment_completed ───────────────▶ │
  │                          │  generatePrompt() ──────▶ │                   │
  │ ◀─ 200 {focusAreas[3],    │                          │                   │
  │      firstPrompt} ────────│                          │                   │
```
