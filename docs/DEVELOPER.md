# Rehearse: developer notes

Free, game-like interview practice. Name a job, answer three questions by voice or typing, get a score and one clear fix per answer, then take it again and watch the score move.

This is **Phase 1**: guest mode only, progress saved in the browser.

Live: https://rehearse.sayamdev.workers.dev

## Run it (costs nothing)

```bash
npm install
cp .env.example .env.local   # optional: add a free GROQ_API_KEY
npm run dev
```

Open http://localhost:3000.

**How notes are produced, in order:**
1. **Groq free tier** (`openai/gpt-oss-120b`, strict JSON output) when `GROQ_API_KEY` is set. Create a free key at console.groq.com and turn on **Zero Data Retention** under Data Controls.
2. **Built-in rule-based notes** when there is no key, when the free daily AI quota is used up, or when the AI call fails. These check structure (STAR), detail, ownership, and length. Users see a short "Quick notes" line explaining why.
3. Claude is still wired in (`ANTHROPIC_API_KEY`) for the day donated credits appear. Leave it empty to stay free.

Nobody is ever blocked. Each visitor gets a fair daily share of the free AI quota (`DAILY_GRADE_LIMIT`, default 20). Past it, they get rule-based notes instead of an error.

```bash
npm test           # unit tests (scoring, delivery, rules grader, provider fallback)
npm run typecheck
npm run lint
```

## How it works

| Piece | Where |
|---|---|
| Question generation (AI sets cached per role + level for 7 days) | `src/app/api/questions/route.ts` |
| Engine choice and fallback (Groq, then rules) | `src/lib/ai/provider.ts`, `src/lib/ai/groq.ts` |
| Rule-based notes and question bank | `src/lib/ai/demo.ts` |
| Grading route (rubric JSON, validated with Zod) | `src/app/api/grade/route.ts` |
| Grader prompt, rubric anchors, calibration examples | `src/lib/ai/prompts.ts` |
| Overall score, grade, XP, levels | `src/lib/scoring.ts` |
| Pace and filler words (measured in code, not by AI) | `src/lib/delivery.ts` |
| Voice capture (browser Web Speech API) | `src/lib/use-speech.ts` |
| Remember: key points, recall matching, review schedule | `src/lib/memory.ts` |
| Remember screens (save panel, tab, editor, recall drill) | `src/components/save-answer-panel.tsx`, `remember-view.tsx`, `saved-answer-editor.tsx`, `recall-drill.tsx` |
| Collectibles and unlock rules | `src/lib/collection.ts`, art in `src/components/sticker-art.tsx` |
| Modes and interviewers | `src/lib/game.ts`, `src/components/interviewer-card.tsx`, `persona-avatar.tsx` |
| Daily Challenge question bank | `src/lib/daily.ts` |
| Coach (AI prompt + built-in guide) | `src/lib/ai/coach.ts`, `src/app/api/coach/route.ts` |
| Unlock animation (Lottie) | `public/lottie/sticker-burst.json`, `src/components/lottie-burst.tsx` |
| Guest storage (localStorage) | `src/lib/store.ts` |
| Fair-use limits per IP per day | `src/lib/rate-limit.ts` |

**Scoring.** The AI scores six rubric items from 1 to 10 with a reason each. The overall score is a weighted average computed in code (relevance 20%, structure 20%, specifics 20%, ownership 10%, clarity 15%, role fit 15%). For spoken answers, delivery counts for 10%. Weights are shown to users.

**Game layer.**
- **Modes:** Quick Round (3 questions), Daily Challenge (one shared question a day), Speed Round (5 questions, 60 seconds each, level 2), and Boss Round (level 5, beat Mr. Grant with an average of 7+).
- **Interviewers:** Sam, Priya (level 3) and Mr. Grant (level 5). They read questions aloud using the browser's free speech voices, and ask a follow-up based on your answer.
- **Collection:** 24 stickers: 9 skills, 12 achievements, and 3 legendary foil characters. They're shown on the homepage with how to earn each one, and every unlock gets a one-time celebration with a Lottie burst.
- **Coach:** `/coach` chat. It uses Groq when a key is set, and a built-in guide otherwise.
- **Question packs:** `/prepare/packs`, 12 hand-written packs (retail, care, hospitality, warehouse, office, tech, creative, trades, leadership and more). No AI needed; they also feed the built-in question bank.
- **Interview countdown:** on Get ready. Add the date for a day-by-day plan, and download a calendar file with two reminders (no accounts or notifications needed).
- **Progress:** Me shows a score line over time, average per skill, and the weakest skill with a one-tap focused round (`/practice/new?focus=specificity`). A progress card image can be shared; it's drawn on the device and shows no job titles or answers.
- **Other languages:** Me > Settings > Practise in. Questions, notes and Cobi reply in 12 languages via the same free Groq model. The main menus and buttons are translated too (src/lib/i18n.ts; other screens stay English). Arabic uses Groq's free Arabic voice, other languages the device voice; Live Interview is English only.
- **Ollama (optional, local):** set `OLLAMA_URL` in `.env.local` and all text AI (questions, notes, Cobi, CV helper, Live reactions) runs on your own computer first, free and unlimited, with Groq as backup. Speech still uses Groq or the on-device voice.
- **Tests:** `npm test` (unit), `npm run test:e2e` (Playwright in your installed Chrome: a full Live Interview with a fake mic, plus axe accessibility checks on 22 pages in light and dark mode).
- **Installable and offline:** `app/manifest.ts` and `public/sw.js` (production only). Offline, rounds use built-in questions and notes, and Remember, Calm corner and Get ready keep working.

**Voices.** Interviewers try three voices in order: **Kokoro** (`src/lib/kokoro.ts`), an open-source voice that runs in a Web Worker in the browser after a one-time ~90MB download; then Groq's Orpheus voices when a key is set (clips cached per line); then the most natural device voice. Kokoro downloads by itself only on capable devices (4+ GB memory, 4+ cores) on an unmetered connection; on mobile data or Data Saver, users download it from Me. `next.config.ts` sets COOP/COEP headers so Kokoro can use several threads. On Cloudflare, static files skip those headers, so `public/_headers` repeats them; without it Chrome blocks the Kokoro worker script (`ERR_BLOCKED_BY_RESPONSE`). `kokoro.ts` fails a load (so the UI offers a retry) if the worker can't start, if nothing arrives within 45s, or if a started download is silent for 5 minutes.

**Welcome guide** (`src/components/welcome-guide.tsx`). Brand-new visitors (no sessions, `profile.welcomed` unset) get a one-time dialog from Sam: a one-tap Kokoro download with a safety note, mic tips, and a quiet-spot tip. Closing it any way sets `welcomed`; the download keeps going after it closes. On mobile data it suggests waiting for Wi-Fi. `checkKokoroCache()` (run once from `SettingsEffects`) looks for the Kokoro model file in the browser's `transformers-cache`; when it's there, the guide and Me say it's already installed, and it loads even on mobile data since that costs nothing. `kokoroState()` returns one object that is replaced on every change, so every screen reads the latest status (including the cache check). Progress is summed in bytes across all model files in the worker (`kokoro.worker.ts`), against an expected ~92MB until real sizes arrive, and held under 100% until the voice has warmed up. `voiceProgressText()` turns that into the bar's words (MB so far, time left, a running clock when the browser gives no progress, as Firefox does, and "Almost ready" while warming up); it has unit tests in `kokoro.test.ts`.

**Light or dark** (Me > Settings > Easier to use). `settings.theme` is `system`, `light` or `dark`. A tiny inline script in `layout.tsx` sets `data-theme` on `<html>` before the first paint; `SettingsEffects` keeps it in sync. The dark colours in `globals.css` apply under `prefers-color-scheme: dark` unless `data-theme="light"`, and always under `data-theme="dark"`. The sun/moon button in the top bar (`theme-toggle.tsx`) flips whatever is showing and saves Light or Dark.

**Remember.** Save any take or the stronger version, edit it into your own words, and keep 1 to 5 key points. Recall practice shows only the question; you answer from memory and see which key points you hit (matched by shared words, and you can correct any result). Review timing follows five boxes (1, 2, 4, 7, 14 days): hitting every point moves an answer up, half or more holds it, less sends it back to tomorrow. No AI involved, so it's always free.

**Get ready** (`/prepare`, content in `src/lib/prepare.ts`). A full **Mock Interview** mode wraps the job-specific questions in a fixed opener ("Tell me about yourself") and closer ("Do you have any questions for me?"), with no follow-ups on those two. The **"Tell me about yourself" builder** guides three short parts, estimates speaking time, saves the result to Remember, and starts a one-question practice. **Questions to ask them** is a starred list stored in the profile; stars appear as hints on the closing question. The "Stuck?" helper shows the saved intro on the opener. All of it is built in, so it costs nothing.

**Live Interview** (mode `live`, `src/components/live-interview.tsx`). Hands-free: the interviewer asks out loud, the browser's speech recognition listens, a natural pause ends the answer (1.6s, or 2.6s for short answers, then a 0.7s grace that new speech cancels), an instant spoken "okay" covers the moment it takes to prepare the reaction, and `/api/react` returns one short reaction plus, at most twice per interview, one follow-up when the answer is missing an action or result. Reactions use Groq's small `openai/gpt-oss-20b` (its own free daily allowance, capped at 950 site-wide and 60 per visitor) with built-in fallbacks (`src/lib/live.ts`). The next question is prepared while the current one is answered. Notes are written at the end, like after a real interview.

**Calm and nerves** (`/calm`, content in `src/lib/calm.ts`). Guided breathing (long breath out, or box breathing) with a sticker circle that grows and shrinks, a 5-4-3-2-1 grounding exercise, lines to say if your mind goes blank, reframes, and a day-of checklist. During practice, "Need a moment?" opens a three-breath pause (not in Speed Round). Each round asks how nervous you feel before and after, and Me shows how often you ended calmer. Finishing a breathing exercise earns the Cool head sticker.

**Confidence tools.** Warm-up round (`/practice/warmup`): three everyday questions with Sam, not scored or saved. Soft mode (Me) hides scores until the round summary. Keep recordings (Me, off by default) saves spoken answers in IndexedDB on the device (`src/lib/recordings.ts`, best 10 kept) so the Calm corner can replay your best. Camera check in the answer box shows a mirrored self-view with an eye-line guide and an on-device light check; nothing is recorded. Body language guide (`/prepare/body`). Printable interview-day card (`/prepare/card`, print CSS in `globals.css`). Accessibility: larger text, simpler words (sent to the AI as `plain`), and a Slowest speaking speed.

**Also, when stuck.** Under every answer box: what the interviewer wants, a step-by-step answer shape with starter lines, and idea prompts (`src/lib/helpers.ts`). A quiet spell while speaking gets a gentle nudge toward the next step.

**Cost safety.** Groq calls have site-wide daily ceilings just under the free plan (`src/lib/rate-limit.ts`). Claude only runs with `ALLOW_PAID_AI=yes` as well as a key.

**XP.** 10 for answering, plus up to 20 from the score, plus 12 per point improved over your previous best on that question. Retakes that improve earn the most.

**Safety.** Answers are wrapped in `<answer>` tags and the grader is told to treat them as data only. Non-answers are flagged and scored 1. The question writer refuses discriminatory topics. Answers are limited to 4,000 characters.

## Staying free

- Groq's free tier allows about 1,000 AI requests a day for `gpt-oss-120b`, shared by all visitors. When it runs out, rule-based notes take over until the next day.
- AI-written question sets are cached per role, so most of the quota goes to scoring.
- Host free on Cloudflare Workers with the OpenNext adapter: see [DEPLOY.md](DEPLOY.md) (`npm run cf:deploy`). Vercel's free plan is for non-commercial use; check it fits your project.
- Do not use Gemini's free tier for this app: Google may use free-tier prompts to improve its products and have humans review them (outside the UK/EEA/Switzerland), and it requires every user to be 18 or older.

## Known limits (Phase 1)

- Voice needs Chrome, Edge, or Safari. Firefox users type (the app switches automatically).
- Progress lives in one browser. Accounts and sync (Supabase) arrive in Phase 2.
- No prep timer, avatar, or read-aloud yet.
- The grader's consistency target (±0.5 on repeat grading) still needs a test set of about 30 answers run against the real AI.
- Chrome and Edge send voice to Google or Microsoft for transcription. The privacy page says so; typing avoids it.

## Next phases

Phase 2: accounts with guest upgrade, templates, progress dashboard, badges, Daily Challenge, Full Mock, PDF export.
Phase 3: Follow-up Gauntlet, interviewer personas, skill map, shareable templates, leaderboards, the Lab, translations.

## Ownership

© 2026 Sayam Ajmal. All rights reserved. See [LICENSE](../LICENSE). No one may copy, reuse or
redistribute this code or content without written permission. Hosting it with a provider
(Cloudflare or any other) does not transfer ownership.
