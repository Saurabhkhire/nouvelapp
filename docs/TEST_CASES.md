# Nouvel — Test Cases

Automated tests live in `backend/tests/api.test.js` and run with the built-in Node test
runner against an **in-memory SQLite DB** using the **rule-based AI fallback** — no
OpenAI key or network needed.

```bash
cd backend
npm test
```

Current result: **23 passing — 11 positive, 12 negative.**

```
✔ POSITIVE: health endpoint reports rule-based mode
✔ POSITIVE: user can sign up
✔ POSITIVE: user can update profile
✔ POSITIVE: assessment returns exactly 3 focus areas + a first prompt
✔ POSITIVE: daily prompt is personalized & non-empty
✔ POSITIVE: user can save a journal entry with mood + tags
✔ POSITIVE: journal can be filtered by theme
✔ POSITIVE: favoriting an entry toggles it on
✔ POSITIVE: practices are seeded and completable
✔ POSITIVE: AI guide returns a supportive reply
✔ POSITIVE: progress reflects activity (streak + completions)
✔ NEGATIVE: signup rejects invalid email
✔ NEGATIVE: signup rejects short password
✔ NEGATIVE: duplicate email is rejected with 409
✔ NEGATIVE: login with wrong password fails with 401
✔ NEGATIVE: protected route without token returns 401
✔ NEGATIVE: protected route with garbage token returns 401
✔ NEGATIVE: assessment with too few answers is rejected
✔ NEGATIVE: assessment with an invalid answer label is rejected
✔ NEGATIVE: empty journal entry is rejected
✔ NEGATIVE: empty AI guide message is rejected
✔ NEGATIVE: completing a non-existent practice returns 404
✔ NEGATIVE: favoriting an entry that does not exist returns 404
```

---

## Positive test cases

| # | Area | Scenario | Expected |
|---|------|----------|----------|
| P1 | Health | `GET /api/health` | 200, `ai` = `rule-based` (or `openai`) |
| P2 | Auth | Sign up with valid name/email/password | 201, JWT returned, user echoed |
| P3 | Profile | `PUT /api/profile` with season/intention | 200, profile reflects update |
| P4 | Assessment | Submit all 10 valid answers | 200, **exactly 3 distinct focus areas** + non-empty first prompt |
| P5 | Prompts | `GET /api/prompt/daily` | 200, non-empty personalized prompt |
| P6 | Journal | Save entry with prompt, text, moods, tags | 201, entry persisted with mood/tags |
| P7 | Journal | Filter `GET /api/journal?theme=boundaries` | 200, only matching entries |
| P8 | Journal | `PATCH /journal/:id/favorite` | 200, `favorite = true` |
| P9 | Practices | List then `POST /practices/:id/complete` | seeded list ≥5; completion 201 |
| P10 | AI Guide | `POST /ai/guide` with a message | 200, non-empty supportive reply |
| P11 | Progress | After 1 entry + 1 completion | `entryCount=1`, `completedPractices=1`, `streak≥1`, theme present |

## Negative test cases

| # | Area | Scenario | Expected |
|---|------|----------|----------|
| N1 | Auth | Sign up with malformed email | 400, "valid email" |
| N2 | Auth | Sign up with password < 6 chars | 400 |
| N3 | Auth | Sign up with an already-used email | 409 |
| N4 | Auth | Login with wrong password | 401 |
| N5 | Auth | Call `GET /api/me` with no token | 401 |
| N6 | Auth | Call `GET /api/me` with a garbage token | 401 |
| N7 | Assessment | Submit fewer than 10 answers | 400, "all 10" |
| N8 | Assessment | Submit an answer label not in the option set | 400, "invalid answer" |
| N9 | Journal | Save a whitespace-only entry | 400 |
| N10 | AI Guide | Send an empty message | 400 |
| N11 | Practices | Complete a non-existent practice id | 404 |
| N12 | Journal | Favorite a non-existent entry id | 404 |

---

## Manual / exploratory test checklist (UI)

These complement the automated API tests and verify the React experience.

**Positive**
- [ ] Splash → Welcome appears within ~1.6s for a logged-out user.
- [ ] Full onboarding reaches the Results screen showing 3 focus areas.
- [ ] "Begin My First Prompt" saves an entry and lands on the Dashboard.
- [ ] Dashboard greeting changes by time of day; streak/entries/practices show real values.
- [ ] Journal history reflects newly saved entries; favorite star toggles and persists on reload.
- [ ] Practices expand/collapse; "Complete" disables and shows ✓.
- [ ] AI Guide keeps conversation context across several turns.
- [ ] Progress shows themes, mood trend, and a weekly summary.
- [ ] Refreshing the page keeps the user logged in (JWT in localStorage).

**Negative / edge**
- [ ] Submitting login with empty fields shows an inline error, not a crash.
- [ ] Visiting `/home` while logged out redirects to `/welcome`.
- [ ] Logging out then pressing Back does not expose authenticated screens.
- [ ] Empty journal "Save" shows "Your entry cannot be empty." and does not POST.
- [ ] Brand-new account's Progress shows graceful empty states (no NaN/blank).
- [ ] With the backend stopped, the UI surfaces a friendly error instead of hanging.

---

## How AI behavior is tested deterministically

Because the test suite deletes `OPENAI_API_KEY`, every LLM function uses its rule-based
branch, which returns **stable, schema-correct output**. This lets CI assert structure
(e.g. *exactly 3 focus areas*, *non-empty prompt*) without flaky model calls. When a key
**is** present, the same assertions hold because the OpenAI path validates shape and
falls back on any deviation or error.
