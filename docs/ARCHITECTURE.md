# Nouvel — Architecture

## 1. Overview

Nouvel is a three-tier web application:

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React SPA — Vite)                                       │
│  15 screens · React Router · AuthContext · fetch wrapper (api.js) │
└───────────────┬───────────────────────────────────────────────────┘
                │  HTTPS / JSON  (Authorization: Bearer <JWT>)
                │  Vite dev proxy: /api -> http://localhost:4000
┌───────────────▼───────────────────────────────────────────────────┐
│  Express API (Node.js)                                             │
│  Routes → Auth middleware → Domain logic → LLM service             │
└───────┬───────────────────────────────────────────┬───────────────┘
        │                                           │
┌───────▼─────────────┐                  ┌──────────▼────────────────┐
│  SQLite (node:sqlite)│                  │  LLM service              │
│  8 tables, WAL mode  │                  │  OpenAI  ─or─  rule-based │
└─────────────────────┘                  └───────────────────────────┘
```

### Design principles
- **Personalization-first** (PRD §14): every prompt/result/practice ties back to the
  user's profile + assessment.
- **Graceful AI degradation**: the OpenAI call path and the rule-based path return the
  *same shape*, so the product is fully functional with or without a key.
- **Privacy**: journal data is always scoped by `user_id`; JWT identifies the caller;
  no entry is reachable cross-user.

## 2. Frontend

- **React + Vite SPA.** Phone-width canvas (max 460px) to mirror the mobile PRD while
  shipping as a web app (PRD §11 "Web app version").
- **Routing** (`App.jsx`): public routes (`/`, `/welcome`, `/login`, `/signup`) and
  `Protected` routes that redirect to `/welcome` when unauthenticated. Bottom navigation
  (Home · Journal · Practices · AI Guide · Profile) shows only on main app routes.
- **State**: `AuthContext` holds `user`/`profile`/`token`; the JWT is persisted to
  `localStorage` and attached by `api.js` on every request.
- **Screens** map 1:1 to PRD §6:

  | Route | Screen | PRD |
  |-------|--------|-----|
  | `/` | Splash | 1 |
  | `/welcome` | Welcome | 2 |
  | `/login`, `/signup` | Sign up / Login | 3 |
  | `/profile-setup` | Profile Setup | 4 |
  | `/onboarding` | Onboarding Intro | 5 |
  | `/assessment` | Assessment (10 Q) | 6 |
  | `/loading` | Personalization | 7 |
  | `/results` | Top 3 Focus Areas | 8 |
  | `/first-prompt` | First Prompt | 9 |
  | `/home` | Dashboard | 10 |
  | `/journal` | Journal | 11 |
  | `/guide` | AI Guide | 12 |
  | `/practices` | Practices | 13 |
  | `/progress` | Progress | 14 |
  | `/profile` | Profile / Settings | 15 |

## 3. Backend

- **`app.js`** — Express app factory (exported so tests can run it without a port).
  CORS + JSON body parsing + a catch-all 500 handler.
- **`auth.js`** — `signToken(user)` (30-day JWT) and `requireAuth` middleware that
  populates `req.user = { id, email }`.
- **`db.js`** — opens SQLite (file or `:memory:`), enables WAL + foreign keys, creates
  the schema, and seeds 10 practices on first run.
- **`services/llm.js`** — the only module that talks to OpenAI. Public functions:
  `generateFocusAreas`, `generatePrompt`, `reflectOnEntry`, `guideReply`,
  `weeklySummary`. Each checks `OPENAI_API_KEY`; if absent (or on any error) it returns
  the deterministic rule-based result.

### API surface

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | – | Liveness + AI mode |
| POST | `/api/auth/signup` | – | Create account → JWT |
| POST | `/api/auth/login` | – | Authenticate → JWT |
| GET | `/api/me` | ✓ | User + profile + focus areas |
| PUT | `/api/profile` | ✓ | Update profile fields |
| PUT | `/api/settings` | ✓ | Notification + reminder prefs |
| GET | `/api/assessment/questions` | – | 10 questions (no internal mappings) |
| POST | `/api/assessment/submit` | ✓ | Score → store **exactly 3** focus areas + first prompt |
| GET | `/api/results` | ✓ | Latest focus areas |
| GET | `/api/prompt/daily` | ✓ | Personalized daily prompt |
| GET | `/api/journal` | ✓ | List entries (filter `?theme=`, `?favorite=true`) |
| POST | `/api/journal` | ✓ | Save entry (optional AI reflection) |
| PATCH | `/api/journal/:id/favorite` | ✓ | Toggle favorite |
| GET | `/api/practices` | ✓ | Practices library |
| POST | `/api/practices/:id/complete` | ✓ | Mark practice complete |
| POST | `/api/ai/guide` | ✓ | AI Guide chat reply |
| GET | `/api/progress` | ✓ | Streak, counts, themes, mood trend |
| GET | `/api/progress/weekly-summary` | ✓ | Weekly reflection summary |

## 4. Data model (PRD §9)

```
users (id, name, email⎈unique, password_hash, auth_provider,
       subscription_status, notification_pref, reminder_time, created_at)

user_profiles (user_id⎈PK→users, age_range, life_season, intention,
               guidance_style, assessment_completed)

assessment_answers (id, user_id→users, question_id, answer, category, created_at)

results (id, user_id→users, focus_1_title, focus_1_desc,
         focus_2_title, focus_2_desc, focus_3_title, focus_3_desc, created_at)

journal_entries (id, user_id→users, prompt_text, journal_text, mood_before,
                 mood_after, tags, favorite, ai_reflection, created_at)

practices (id, title, category, duration, description, steps[JSON])

practice_completions (id, user_id→users, practice_id→practices, completed_at)
```

`ON DELETE CASCADE` on all user-owned tables, so deleting a user removes their data.

## 5. The AI / scoring engine

**Rule-based (default):** each assessment option maps to one or more *growth categories*
(`data/assessment.js`). Submitting tallies categories, ranks them, and maps the top
ranked categories to distinct entries in `FOCUS_AREA_CATALOG`. It always pads to
**exactly 3** distinct focus areas (PRD §7 Feature 2 hard requirement).

**OpenAI (when key present):** the same inputs are sent to the model with a JSON schema
request; the response is validated to be exactly 3 `{title, desc}` items, else it falls
back to rule-based. A brand/safety system prompt (PRD §8/§12) constrains all generations.

## 6. Security & privacy

- Passwords hashed with bcrypt (cost 10); never returned.
- All data queries filter by `req.user.id`; cross-user access is impossible by URL guessing.
- JWT secret + OpenAI key come from environment (`.env`), never committed.
- AI Guide system prompt forbids diagnosis, therapy replacement, medical/crisis advice.

## 7. Extensibility

The split between route handlers and `services/llm.js` means swapping the LLM provider,
adding subscription gating, or moving to a hosted DB (Postgres) touches one layer at a
time. Future PRD §11 items (audio, community, Human Design) attach as new route modules.
