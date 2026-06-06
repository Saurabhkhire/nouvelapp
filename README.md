# Nouvel — MVP

> A guided space for self-mastery, clarity, and becoming.

A personalized journaling & self-mastery web app built from the Nouvel Product
Requirements Document. This repository contains the **MVP scope** (PRD §10): brand
onboarding, a 10-question self-mastery assessment, AI/rule-based **Top 3 Focus Areas**,
personalized journaling prompts, a journal with mood tracking, a practices library,
an AI Guide, progress tracking, and profile/settings.

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18 + Vite + React Router |
| Backend  | Node.js + Express |
| Database | SQLite (Node's built-in `node:sqlite`) |
| LLM      | OpenAI (`gpt-4o-mini` by default) with a deterministic **rule-based fallback** |
| Auth     | JWT (Bearer) + bcrypt password hashing |

> The app runs **fully offline** without an OpenAI key — the rule-based engine
> generates focus areas, prompts, reflections, and AI Guide replies. Add a key to
> unlock true LLM personalization. This honors PRD §14: "Even if the first version
> uses a simple scoring system instead of full AI, the experience should feel deeply personal."

## Project layout

```
nouvelapp/
├── backend/                # Express API + SQLite + LLM service
│   ├── src/
│   │   ├── app.js          # Express app factory + all routes
│   │   ├── server.js       # HTTP entry point
│   │   ├── db.js           # Schema + seed data (node:sqlite)
│   │   ├── auth.js         # JWT sign/verify middleware
│   │   ├── data/assessment.js   # 10 questions + focus-area catalog
│   │   └── services/llm.js # OpenAI + rule-based fallback
│   └── tests/api.test.js   # 23 positive/negative API tests
├── frontend/               # React app (15 PRD screens)
│   └── src/pages/ ...
└── docs/
    ├── ARCHITECTURE.md     # System design, data model, request flow
    ├── WORKFLOWS.md        # End-to-end user & system workflows
    └── TEST_CASES.md       # Positive & negative test cases
```

## Run it (one command)

From the repo root:
```bash
npm run setup     # first time only: installs root + backend + frontend
npm run dev       # starts BOTH backend (:4000) and frontend (:5173) together
```

Open http://localhost:5173 and tap **Begin**. Press `Ctrl+C` once to stop both.

> `npm run dev` uses `concurrently` to launch the Express API and the Vite dev server
> in a single terminal, with colored `BACKEND` / `FRONTEND` log prefixes.

**Optional — enable real OpenAI personalization:**
```bash
cd backend && copy .env.example .env   # then add your OPENAI_API_KEY
```
Without a key the app runs on the offline rule-based engine.

### Or run each side separately
```bash
npm --prefix backend start     # http://localhost:4000
npm --prefix frontend run dev  # http://localhost:5173  (proxies /api -> :4000)
```

## Test

```bash
cd backend
npm test                   # 23 tests: 11 positive, 12 negative (no key needed)
```

## Share it with testers (hosted, invite-only)

The app has email accounts built in, so "sharing" = giving it a **public URL** and
controlling **who may register** via an email allowlist.

### A. Deploy once to Render (always-on, free)
1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Blueprint** → select your repo.
   Render reads [`render.yaml`](render.yaml) and configures everything (Express serves
   the built React app and the API on one URL).
3. When prompted, set env vars:
   - `ALLOWED_EMAILS` → the testers you approve, e.g. `nysa@example.com, friend@example.com`
   - `OPENAI_API_KEY` → optional (blank = rule-based AI)
4. Deploy. You get a link like `https://nouvel.onrender.com`.
5. Send the link. Each approved person taps **Begin**, signs up **with their own email**,
   and gets their own private space. Emails not on the list get a polite 403.

To add another tester later: edit `ALLOWED_EMAILS` in the Render dashboard → save (it
redeploys). No code change needed.

> Free tier notes: the service sleeps after ~15 min idle (first hit takes ~30s to wake),
> and SQLite storage is **ephemeral** (resets on redeploy) — perfect for testing, not for
> permanent data. For durable data, attach a paid disk or move to Postgres.

### B. Instant temporary link (no deploy)
Keep `npm run dev` running, then in a third terminal expose port 5173:
```bash
npx cloudflared tunnel --url http://localhost:5173    # or: npx localtunnel --port 5173
```
Share the printed https URL. Works only while your PC and the tunnel stay on. The
frontend is already configured to accept tunnel hosts.

### C. Same Wi-Fi
Run `npm run dev` and share `http://<your-LAN-IP>:5173` (find it with `ipconfig`).
Already enabled — no extra setup.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/WORKFLOWS.md](docs/WORKFLOWS.md)
- [docs/TEST_CASES.md](docs/TEST_CASES.md)

## Notes & safety

- Journal entries are stored privately, scoped per-user, never shared (PRD §14).
- The AI Guide is constrained by a system prompt that forbids diagnosis, therapy
  replacement, and medical/crisis advice (PRD §8).
- This is an MVP: native mobile, subscriptions, audio, community, and deep
  analytics are intentionally out of scope (PRD §10 "Can Exclude for Later").
# nouvelapp
