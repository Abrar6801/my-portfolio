# CASE FILE №2026-AM — "The Evidence Board" Redesign

> Transforming the portfolio into an investigator's evidence board / subject dossier:
> the visitor is the detective, **Abrarullah Mohammed is the subject under investigation**,
> and every section of the site is a piece of evidence pinned to the board.
>
> **Positioning:** the case is unambiguous — the subject is an **AI/ML Engineer
> specializing in LLM systems and Retrieval-Augmented Generation**. Every piece of
> copy, every exhibit, every capability entry reinforces that identity. The metaphor
> is load-bearing: an evidence board *is* a RAG pipeline — documents are ingested,
> cut into pieces, indexed, and retrieved by relevance, with red string standing in
> for vector similarity. The site's theme demonstrates the subject's specialty.

---

## Table of Contents

1. [Concept & Creative Direction](#1-concept--creative-direction)
2. [Visual Design System](#2-visual-design-system)
3. [Section-by-Section Redesign](#3-section-by-section-redesign)
4. [Dynamic Content Architecture (no-code updates)](#4-dynamic-content-architecture-no-code-updates)
5. [Authentication (owner-only writes)](#5-authentication-owner-only-writes)
6. [Security Hardening](#6-security-hardening)
7. [File-by-File Change List](#7-file-by-file-change-list)
8. [Implementation Phases](#8-implementation-phases)

---

## 1. Concept & Creative Direction

### The Narrative

The site opens like a detective walking into a dimly lit investigation room. A corkboard
fills the screen. Pinned to it: a subject photograph, index cards, polaroids, torn
notebook pages, manila folders — all connected by **red string**. The visitor "works the
case," and by the time they reach the bottom, they've pieced together the subject's
entire profile: who he is, what he can do, where he's been, and what he's built.

### Renaming Everything In-Universe

| Current section | Becomes | Framing |
|---|---|---|
| Hero / About | **SUBJECT PROFILE** | Mugshot-style photo, vital stats card, "LAST KNOWN LOCATION" |
| Skills | **KNOWN CAPABILITIES** | Lab-report / capability assessment sheet |
| Philosophy | **PSYCHOLOGICAL PROFILE** | Analyst's notes, handwritten annotations |
| Experience | **SURVEILLANCE LOG** | Timeline of "sightings" at each employer |
| Projects | **EXHIBITS A–F** | Evidence bags / tagged exhibits with case numbers |
| Education | **BACKGROUND CHECK** | Records-office documents with stamps |
| Publications | **PUBLISHED FINDINGS** | Newspaper clippings |
| Contact | **TIP LINE** | "Have information about this subject? Report it." |
| Navbar | **CASE INDEX** | Tab dividers of a case folder |
| Footer | Chain-of-custody line | "File last accessed: <date> · Case №2026-AM" |

### Signature Interactions

- **Red string physics** — SVG lines connect pinned items across the board; they subtly
  sway (CSS keyframe on `stroke-dashoffset` / small rotation) and redraw on resize.
- **Pinned entrance** — items don't fade in; they get *pinned*: drop in with a slight
  rotation settle + a pushpin appears with a tiny "thunk" scale bounce.
- **Rubber stamps** — sections get stamped as you scroll past them: `REVIEWED`,
  `VERIFIED`, `CONFIRMED HIRE?` slams down at ~12° rotation with a stamp-press animation.
- **Flashlight mode (hero)** — before the board "lights up," the cursor is a flashlight
  spotlight over a dark board (radial-gradient mask following the existing custom cursor).
  A pull-cord / light-switch click turns the lights on. Respect `prefers-reduced-motion`.
- **Evidence inspection** — clicking a polaroid/exhibit opens it in a magnifying-glass
  lightbox: enlarged, straightened, with the "case notes" (project details) on the back
  — a card-flip reveals the reverse side.
- **Redacted text** — sensitive-looking bits (email, phone in contact) rendered as
  ██████ redaction bars that reveal on hover/click ("declassify").
- **Case timer** — tiny "TIME ON CASE: 00:04:32" counter in the corner (session timer).
- **Konami-style easter egg** — typing `whodunit` stamps the whole board `CASE CLOSED —
  HE'S HIRED` in red.

---

## 2. Visual Design System

### Palette — "Investigation Room at Night"

```css
:root {
  --board-cork:      #8b6b4a;   /* corkboard base */
  --board-cork-dark: #6e523a;   /* cork vignette edges */
  --paper:           #f4eeDF;   /* aged paper / index cards */
  --paper-shadow:    #d8cfb8;   /* paper edge shading */
  --manila:          #e8d9a8;   /* folder tabs */
  --ink:             #1c1a17;   /* typewriter ink */
  --ink-faded:       #4a443c;   /* secondary text */
  --string-red:      #c0392b;   /* the red string + stamps */
  --evidence-tag:    #d4a017;   /* manila evidence tags */
  --polaroid:        #fdfdf8;   /* polaroid frames */
  --sticky-yellow:   #f7e98e;   /* sticky notes */
  --lamp-glow:       #ffd98e;   /* desk lamp warm light */
  --shadow-hard:     rgba(0,0,0,.45);
}
```

Dark room + warm lamp glow. The corkboard is a repeating CSS/SVG noise texture
(generated inline as a `data:` URI — **no external images**, keeps CSP strict).

### Typography

| Role | Font | Usage |
|---|---|---|
| Case headers / stamps | `Special Elite` (typewriter) | Section titles, labels, stamps |
| Body / notes | `Courier Prime` | Report text, logs |
| Handwritten annotations | `Caveat` or `Shadows Into Light` | Margin notes, sticky notes, string labels |
| Existing `IBM Plex Mono` | keep | Code snippets, metadata lines |

All via Google Fonts (already allowlisted in the CSP `style-src`/`font-src`).

### Material Library (reusable CSS components)

Build these once as classes; every section composes them:

- `.pin` — pushpin (pure CSS radial gradient sphere + shadow), colors: red/yellow/white
- `.polaroid` — white frame, bottom caption strip, random slight rotation via
  `--rot` custom property, hard drop shadow
- `.index-card` — ruled lines (repeating-linear-gradient), red top rule
- `.sticky-note` — yellow, one folded corner (clip-path), handwriting font
- `.manila-folder` — tab on top, opens on click (`details`/`summary` styled)
- `.evidence-bag` — translucent plastic look (subtle white gradient + border),
  "EVIDENCE" printed header + item visible "inside"
- `.evidence-tag` — manila tag with hole + string, holds case numbers/dates
- `.stamp` — bordered, rotated, semi-transparent red text: `CONFIRMED`, `CLASSIFIED`
- `.tape` — translucent tape strips holding paper corners
- `.torn-edge` — clip-path zigzag bottom on paper pieces
- `.string` — SVG `<line>`/`<path>` layer (`#string-layer`, absolutely positioned,
  `pointer-events:none`) drawn between element anchor points computed in JS
- `.redacted` — black bar over text, reveals on interaction
- `.paperclip`, `.coffee-stain` (radial-gradient ring), `.fingerprint` (SVG watermark)

### Layout Principles

- The whole `<main>` is **one continuous corkboard** — no flat white sections.
  Sections are *clusters of evidence* on the board separated by string runs and
  manila divider tabs, not by background changes.
- Deliberate imperfection: every pinned item gets `--rot` between −3° and 3°
  (assigned deterministically from item id — stable between visits, no layout shift).
- Mobile: the board becomes a **vertical case file** — string simplifies to a single
  red thread running down the left margin connecting the pins; rotations reduced;
  flashlight mode disabled.

---

## 3. Section-by-Section Redesign

### 3.1 SUBJECT PROFILE (hero)

- Large **polaroid of `photo.jpg`**, taped at a slight angle, caption handwritten:
  *"The Subject — last seen shipping an LLM pipeline to production."*
- Beside it an **index card**: NAME / ALIAS (`AM_`) / OCCUPATION (**AI/ML Engineer —
  LLM & RAG Systems**) / STATUS (`OPEN TO WORK` — as a paper tag pinned on, keep the
  dismissible badge) / LAST KNOWN LOCATION.
- A second smaller card, **MODUS OPERANDI**, typewritten: *"Ingests unstructured
  documents. Chunks, embeds, and indexes them. Retrieves exactly what matters and
  makes language models tell the truth about it."* — the AI/ML elevator pitch,
  in-universe.
- The letter-by-letter name animation becomes **typewriter keystrokes** — same code,
  new sound-less "struck key" styling (letters stamp in with slight vertical jitter).
- Resume dropdown → a **manila folder marked `PERSONNEL FILE — TAKE A COPY`** with two
  paper sheets peeking out (SWE / AI-ML PDFs).
- Neural canvas: **keep it** but restyle as the red-string layer for the hero — nodes
  become pins, edges become string (reuse the existing canvas code, swap colors).

### 3.2 KNOWN CAPABILITIES (skills)

- The radar chart becomes a **"CAPABILITY ASSESSMENT" lab sheet** — same SVG polygon,
  restyled onto graph paper with typewriter axis labels and a `LAB USE ONLY` stamp.
- **Radar axes rebalanced for the AI/ML focus** (replaces the current
  Languages/ML–AI/Data-Eng/Backend/Frontend/Research split):

  | Axis | Covers |
  |---|---|
  | LLM & GenAI Systems | RAG, LangChain, LlamaIndex, LangGraph, prompt engineering |
  | Deep Learning | PyTorch, TensorFlow, Keras, Transformers, CodeBERT |
  | Data & Retrieval Engineering | document loaders, chunking, embeddings, vector stores, PySpark, SQL |
  | Classical ML & Science | scikit-learn, Pandas, NumPy, OpenCV |
  | Software Engineering | Python, Java, FastAPI, Flask, React, Git/GitHub |
  | Research & Communication | publications, experimentation, evaluation |

- Skill carousels → two rows of **evidence tags on strings**, still infinitely
  scrolling (keep the carousel logic, restyle items as `.evidence-tag`). Updated
  contents, LLM stack first:
  - **Row 1 — "PRIMARY TOOLKIT" (GenAI/ML):** RAG · LangChain · LlamaIndex ·
    LangGraph · Prompt Engineering · Embeddings · Vector Search · Document Loaders ·
    Chunking Strategies · Hugging Face Transformers · PyTorch · TensorFlow · OpenAI API
  - **Row 2 — "SUPPORTING TOOLKIT" (engineering):** Python · FastAPI · Flask ·
    PySpark · SQL / PostgreSQL · scikit-learn · Pandas · NumPy · OpenCV · Git ·
    GitHub · React.js · Agile/Scrum
- **New sub-cluster: "RETRIEVAL METHODOLOGY"** — a pinned flow of five index cards
  connected by red string, doubling as a literal RAG-pipeline diagram *and* the
  investigation metaphor:
  `INTAKE (document loaders) → DISSECTION (chunking) → INDEXING (embeddings →
  vector store) → RETRIEVAL (similarity search) → TESTIMONY (LLM generation,
  prompt-engineered)`. Each card carries a one-line handwritten note explaining
  the technique — recruiters see the skills, engineers see that the subject
  actually understands the pipeline.
- Add analyst margin note in handwriting: *"Subject has recently expanded operations
  into retrieval-augmented generation. Connections multiplying. Recommend immediate
  recruitment before a competing agency finds this board."*

### 3.3 PSYCHOLOGICAL PROFILE (philosophy)

- Three philosophy cards → **sticky notes + a torn notebook page**, each stamped
  `ANALYST NOTE`. Keep the stagger animation; change the entrance to "slapped on."

### 3.4 SURVEILLANCE LOG (experience)

- Vertical timeline → **red string running down the board**, each job a pinned
  index card + polaroid clipped together.
- Card header styled like a log entry:
  `SIGHTING №04 — [Company] — [dates] — STATUS: CONFIRMED`.
- Metric counters keep their animation but render inside a **"FIELD MEASUREMENTS"**
  strip on each card.

### 3.5 EXHIBITS A–F (projects)

- Each project = an **evidence bag** with an exhibit tag: `EXHIBIT A`, `EXHIBIT B`…
- Tag shows: case number (auto: `№2026-AM-P01`), date logged, one-line description.
- Tech stack = small **fingerprint-card chips** on the bag.
- **Ordering favors the AI/ML narrative:** LLM/RAG and deep-learning projects take
  Exhibits A–C (top of the board, thickest red string); web/other work files behind
  them. As new RAG/LangChain/LangGraph projects are built, they enter through the
  admin panel and take the front exhibits — `sort_order` makes this a drag, not a
  code change.
- Exhibit tags carry an extra `CLASSIFICATION` line for AI work, e.g.
  `CLASSIFICATION: RETRIEVAL SYSTEM`, `CLASSIFICATION: NLP`, `CLASSIFICATION:
  COMPUTER VISION` — doubles as a filter chip row ("view by classification").
- Live demo / GitHub links = `INSPECT EVIDENCE ↗` and `SOURCE OF EVIDENCE ↗`
  stamped buttons.
- Clicking opens the magnifying-glass lightbox with full case notes (flip animation).

### 3.6 BACKGROUND CHECK (education)

- Degrees as **official records documents**: letterhead, serial number, embossed-seal
  CSS effect, `VERIFIED ✓` stamp, paperclipped GPA note.

### 3.7 PUBLISHED FINDINGS (publications)

- Papers/certs as **newspaper clippings**: headline in condensed serif, torn edges,
  yellowed paper, pinned with tape. Certifications get a wax-seal-style badge.

### 3.8 TIP LINE (contact)

- Form restyled as a **WITNESS STATEMENT** carbon-copy form: ruled lines, typewriter
  input font, `SUBMIT STATEMENT` stamp button. Keep the existing mailto flow +
  validation (or upgrade to a serverless `/api/contact` — see §4.5).
- Email / LinkedIn / GitHub as **redacted lines** that declassify on hover.

### 3.9 THE INTERROGATION ROOM (live RAG demo) ⭐

The centerpiece proof-of-skill: recruiters don't read that the subject knows RAG —
**they use a RAG system he built, live on the board.**

- A pinned **two-way-mirror window** ("INTERROGATION ROOM — AUTHORIZED QUESTIONS
  ONLY") with a chat transcript styled as a typewritten interview log:
  `INTERVIEWER:` / `SUBJECT:` turns, timestamped.
- Visitors ask anything — *"Has he worked with PySpark?"*, *"Tell me about
  Paperly"*, *"Why should we hire him?"* — and answers are generated by an LLM
  retrieving over the subject's own case file: resume text, project case notes,
  experience entries, publications (all already in the database).
- Suggested question chips styled as **prepared interrogation cards** so nobody
  faces a blank input.
- Each answer cites its evidence: small `SOURCE: EXHIBIT C` tags linking to the
  pinned item it retrieved from — literally showing retrieval working.
- Empty/failure state stays in-theme: *"Subject has invoked the right to remain
  silent (rate limit reached — try again in a minute)."*

**Architecture** (details in §4.6): static chat UI → Vercel serverless
`/api/interrogate` (holds the API key, never exposed) → embeddings search over
pre-chunked content → LLM answer with citations. The pipeline uses the exact
skills on the capability sheet: document loaders, chunking, embeddings, vector
retrieval, prompt engineering.

### 3.10 Nav, Footer, Meta

- Navbar → **case-folder tab dividers** across the top; active tab pulls forward.
  Scrolled state: folder edge shadow. Hamburger → a paperclip icon.
- Footer → `CHAIN OF CUSTODY: file accessed <date> · © 2026 A. Mohammed · CASE №2026-AM`.
- `<title>` → `CASE FILE №2026-AM | Abrarullah Mohammed`; matching OG description:
  *"CONFIDENTIAL: Subject profile of an AI/ML engineer. Review the evidence."*
- Favicon → red pushpin or fingerprint SVG.
- Custom cursor → magnifying glass (flashlight in hero dark mode).
- `404.html` → **"MISSING EVIDENCE"** poster page (creative freebie).

---

## 4. Dynamic Content Architecture (no-code updates)

### Goal

Add a new project, job, publication, skill, or sticky note **from a web form — no
code, no commit, no redeploy**. Public visitors get read-only data.

### 4.1 Recommended Stack: Supabase + Vercel (keeps the site vanilla)

**Why:** free tier, hosted Postgres, built-in auth, and — critically — **Row Level
Security (RLS)** gives us "everyone reads, only the owner writes" *enforced at the
database level*, not just in UI code. No framework migration; the site stays
vanilla HTML/CSS/JS, now fetching JSON instead of HTML fragments.

```
┌────────────┐   read-only JSON    ┌───────────────┐
│  Visitors   │ ─────────────────► │   Supabase    │
│ (index.html)│                    │   Postgres    │
└────────────┘                    │  + RLS rules  │
┌────────────┐  authed writes      │  + Auth      │
│  /admin     │ ─────────────────► │  + Storage   │
│ (you only)  │                    └───────────────┘
└────────────┘
```

### 4.2 Data Model (tables)

Every content type gets a table; all share: `id uuid pk`, `sort_order int`,
`is_published bool default true`, `created_at`, `updated_at`.

| Table | Fields (beyond shared) |
|---|---|
| `profile` | single row: name, alias, tagline, status_badge, location, photo_url, resume URLs |
| `skills` | name, category (`carousel_row_1`/`carousel_row_2`/`radar`), radar_score (0–10), radar_axis |
| `philosophy_notes` | title, body, note_style (`sticky`/`torn-page`) |
| `experience` | company, role, start_date, end_date (null = present), location, bullets `jsonb`, metrics `jsonb` (`[{label, value, suffix}]`) |
| `projects` | title, exhibit_letter (auto), summary, case_notes (long), tech_stack `text[]`, demo_url, source_url, image_url, date_logged |
| `education` | institution, degree, field, start/end, gpa, highlights `jsonb` |
| `publications` | title, venue, date, url, type (`paper`/`certification`) |
| `board_extras` | type (`sticky_note`/`stamp`/`string_label`/`coffee_stain`), content, section_anchor, position hints — **lets you pin arbitrary new notes anywhere on the board without touching code** |
| `tips` (optional) | name, email, message — contact-form submissions if you outgrow mailto |

`board_extras` is the creativity escape hatch: future ideas ("pin a note that says
*currently reading X*") become a form entry, not a feature request.

### 4.2b Content Refresh at Migration (skills learned since last update)

When seeding the database in Phase 2, the skills content is not copied verbatim —
it's refreshed to reflect the current AI/ML focus. New entries to add:

| Skill | Carousel row | Radar axis |
|---|---|---|
| RAG (Retrieval-Augmented Generation) | 1 | LLM & GenAI Systems |
| LangChain | 1 | LLM & GenAI Systems |
| LlamaIndex | 1 | LLM & GenAI Systems |
| LangGraph | 1 | LLM & GenAI Systems |
| Prompt Engineering | 1 | LLM & GenAI Systems |
| Document Loaders | 1 | Data & Retrieval Engineering |
| Chunking Strategies | 1 | Data & Retrieval Engineering |
| Embeddings / Vector Representations | 1 | Data & Retrieval Engineering |
| Vector Search / Similarity Retrieval | 1 | Data & Retrieval Engineering |
| Git | 2 | Software Engineering |
| GitHub | 2 | Software Engineering |

Also at seed time: hero occupation/tagline updated to the LLM & RAG positioning
(§3.1), radar axes replaced per §3.2, and the "RETRIEVAL METHODOLOGY" cards seeded
as `board_extras` rows so the pipeline diagram is itself editable without code.

### 4.3 Public Read Path

- `script.js` replaces `fetch('sections/*.html')` with `fetch` to Supabase REST
  (`GET /rest/v1/projects?is_published=eq.true&order=sort_order`) using the **anon key**
  (safe to ship client-side *because RLS only allows `SELECT` on published rows*).
- Client-side **template renderers** per section build DOM via `createElement` +
  `textContent` (never `innerHTML` with remote data — see §6).
- **Fallback:** keep a `content-snapshot.json` committed in the repo; if the API is
  unreachable, render from the snapshot so the site never shows an empty board.
  (Optionally regenerate the snapshot on a schedule via a GitHub Action.)
- Cache: `sessionStorage` with a short TTL so repeat navigation is instant.

### 4.4 Admin Panel — `/admin.html` ("THE WAR ROOM")

A single hidden page, itself styled in-theme — you're the *lead investigator*:

- Login screen = **badge check**: "AUTHORIZED PERSONNEL ONLY" + email/password
  (Supabase Auth; see §5).
- After login: tabs per table, each a simple CRUD form
  (add / edit / reorder via drag = `sort_order` / publish–unpublish / delete).
- Adding a project auto-assigns the next exhibit letter and case number.
- Image upload → Supabase Storage bucket (public-read, owner-write policy);
  store returned URL in the row.
- Preview button opens the live site with `?preview=1` which also fetches
  `is_published=false` rows *only when a valid session exists*.
- No framework needed — it's forms + fetch; ~1 file of vanilla JS.
- `admin.html` gets `<meta name="robots" content="noindex">` and is excluded from
  the sitemap. (Obscurity is not the security layer — RLS is — but no need to
  advertise it.)

### 4.5 Contact Form Upgrade (optional, phase 2)

Replace `mailto:` with a Vercel serverless function `POST /api/contact`:
validates + length-caps input server-side, rate-limits by IP, inserts into `tips`
table (insert-only RLS policy for anon), optionally emails you via Resend.
Until then, the current mailto approach is fine and has zero attack surface.

### 4.6 The Interrogation Room — RAG backend

The demo is a real, minimal RAG pipeline — built the way you'd build it at work:

```
content rows ──(on publish)──► chunk ──► embed ──► pgvector column in Supabase
                                                        ▲
visitor question ► /api/interrogate (Vercel fn) ── embed question, similarity search
                        │
                        └─► LLM (question + top-k chunks) ─► answer + source tags
```

- **Ingestion:** when content changes in the admin panel, an "REBUILD INDEX" button
  chunks all published content (projects, experience, publications, resume text
  stored in a `documents` table), embeds each chunk, and stores vectors in Supabase
  **pgvector** (free, already in the same database — no separate vector store
  needed). Chunking + loading logic is exactly the document-loader/chunking skill
  set, demonstrated in production.
- **Serving:** `POST /api/interrogate` — the only place API keys live (Vercel env
  vars). Embeds the question, runs a pgvector cosine similarity search (top 4–6
  chunks), and prompts the LLM with a strict system prompt: answer only from
  retrieved context, cite exhibit tags, stay in the investigator persona, refuse
  off-topic questions.
- **Model choice:** Claude Haiku (cheap, fast) or any small model — answers are
  short and grounded, so a small model is plenty.
- **Cost & abuse controls (non-negotiable):**
  - Per-IP rate limit (e.g. 10 questions/hour) + global daily cap (e.g. 200/day);
    both enforced in the function, counters in Supabase.
  - Hard cap on question length (300 chars) and answer tokens.
  - Provider-side monthly spend limit set in the console — the true backstop.
  - When any cap trips, the UI shows the in-theme "right to remain silent" message.
- **Prompt-injection stance:** the system only ever reads public portfolio content
  and has no tools, no write access, and no secrets in context — the worst a
  hostile prompt can achieve is a silly answer. Still: retrieved chunks are wrapped
  in delimiters and the system prompt instructs the model to treat them as data.

### 4.7 Supabase free-tier pause — required countermeasures

Free-tier projects pause after ~7 days with **zero API activity**, and a paused
project does **not** auto-wake on request — it returns errors until manually
restored from the dashboard. The site itself (Vercel) always loads; only the data
calls fail. Two measures make this a non-issue:

1. **Keep-alive cron:** a GitHub Action (or Vercel cron) performs one trivial
   `select` every 2 days. The project therefore never goes idle. (Normal visitor
   traffic also counts as activity — the cron covers dead weeks.)
2. **Snapshot-first rendering (upgraded from "fallback" to the default):** the
   committed `content-snapshot.json` renders immediately on load, then live data
   hydrates over it when the API responds. Visitors never see an empty board and
   never wait on the API — this also fixes SEO (crawlers see full content) and
   perceived performance. A GitHub Action regenerates the snapshot nightly from
   the database, so "stale" is at most 24 hours.

---

## 5. Authentication (owner-only writes)

### Model: one owner, everyone else read-only

- **Supabase Auth, email + password**, with **sign-ups disabled** in the Supabase
  dashboard. Exactly one account exists: yours. There is no registration surface
  to attack.
- Enable **MFA (TOTP)** on your account in Supabase Auth settings.
- Session: Supabase issues short-lived JWTs with auto-refresh; the admin page uses
  `supabase-js` which stores the session and refreshes silently.

### RLS Policies (the actual security boundary)

For every content table:

```sql
alter table projects enable row level security;

-- Public: read published rows only
create policy "public read published"
  on projects for select
  using (is_published = true);

-- Owner: full control (match your user id, not just "authenticated")
create policy "owner writes"
  on projects for all
  using (auth.uid() = 'YOUR-USER-UUID')
  with check (auth.uid() = 'YOUR-USER-UUID');

-- Owner can also read unpublished (for preview)
create policy "owner reads all"
  on projects for select
  using (auth.uid() = 'YOUR-USER-UUID');
```

Key property: even if someone extracts the anon key (it's public by design), reads
the admin page source, or crafts raw REST calls — **the database refuses every
write that isn't authenticated as your UUID**. The `service_role` key is never
used client-side, never committed, and only lives in Vercel env vars if a
serverless function ever needs it.

### Why not roll-your-own password check?

A hand-written "if password matches, unhide the form" is client-side theater —
anyone can bypass it in DevTools. Real rule: **the write permission must be
enforced by the server/database, never the browser.** Supabase RLS gives that
for free; the alternative (custom serverless auth with signed HTTP-only cookies,
bcrypt, CSRF tokens, rate limiting) is more code to get wrong.

---

## 6. Security Hardening

### 6.1 XSS — the #1 risk once content is dynamic

Your content now round-trips through a database and back into the DOM. Rules:

- **Never `innerHTML` with fetched data.** All renderers use `createElement` +
  `textContent`. (The current section-fragment `innerHTML` injection goes away
  along with the HTML fragments.)
- URLs from the database (`demo_url`, `source_url`, `image_url`) are validated
  before becoming `href`/`src`: allow only `https:` scheme (blocks
  `javascript:` URLs).
- Admin inputs are length-capped and typed both client-side and by Postgres
  column constraints (`varchar(n)`, `check` constraints).

### 6.2 Content Security Policy (tighten the existing one)

```
default-src 'none';
script-src 'self';
style-src 'self' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
img-src 'self' data: https://<project>.supabase.co;
connect-src 'self' https://<project>.supabase.co;
base-uri 'none';
form-action 'self';
frame-ancestors 'none';
object-src 'none';
upgrade-insecure-requests;
```

Move it from the `<meta>` tag to **real HTTP headers via `vercel.json`** (headers
cover more directives, apply to all responses, and can't be stripped by DOM
manipulation). Add alongside:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `X-Frame-Options: DENY` (redundant with frame-ancestors, kept for old browsers)

### 6.3 Supabase-side

- RLS enabled on **every** table (Supabase warns if not — don't dismiss it).
- Sign-ups disabled; MFA on; strong unique password from a password manager.
- Storage bucket: public `SELECT`, owner-only `INSERT/UPDATE/DELETE`; cap upload
  size; restrict MIME types to images.
- Auth rate limiting is on by default (brute-force protection) — leave it on.
- Point-in-time backups / regular `pg_dump` export so content can't be lost.

### 6.4 Repo & deploy hygiene

- No secrets in the repo: anon key is public-by-design; service key only in
  Vercel env vars (if used at all). Add a `.env*` line to `.gitignore` anyway.
- Enable GitHub 2FA + Vercel 2FA (the deploy pipeline is part of the attack surface).
- Dependencies: the site has **zero npm runtime deps** — keep it that way.
  `supabase-js` can be self-hosted as a single vendored file (`/vendor/supabase.js`)
  so `script-src 'self'` still holds and no CDN is trusted.
- The contact form keeps client validation but treats it as UX only; any future
  serverless endpoint re-validates everything server-side.

### 6.5 What *not* to worry about

- The anon key being visible — that's its design; RLS is the lock.
- `/admin.html` being discoverable — it's an empty shell without a valid session.
- Read-only visitors "hacking" content — there is no unauthenticated write path.

---

## 7. File-by-File Change List

| File | Action |
|---|---|
| `index.html` | Rewrite copy/structure to case-file theme; new fonts; CSP moves to headers; new title/OG/favicon; add `#string-layer` SVG; keep skeleton + section mounts |
| `styles.css` | Major rewrite: palette, cork texture, full material library (§2), stamp/pin/string animations, `prefers-reduced-motion` guards, mobile vertical-file layout |
| `script.js` | Replace fragment-fetch with Supabase JSON fetch + renderers; keep/restyle: cursor (→ magnifier/flashlight), IntersectionObserver pins & stamps, counters, carousel (→ evidence tags), radar (→ lab sheet), neural canvas (→ pins & string); add string-layer drawing, lightbox, redaction reveals, easter egg |
| `sections/*.html` | **Deleted** — content lives in the database (keep one commit as historical reference; content migrated via admin panel) |
| `admin.html` + `admin.js` | **New** — the War Room CRUD panel (§4.4) |
| `vendor/supabase.js` | **New** — vendored supabase-js (keeps CSP `script-src 'self'`) |
| `content-snapshot.json` | **New** — offline/API-down fallback content |
| `vercel.json` | **New** — security headers (§6.2), clean-URL config |
| `api/interrogate.js` | **New** — RAG serverless function (§4.6): embed question, pgvector search, LLM call, rate limits |
| `.github/workflows/keepalive.yml` | **New** — cron ping so Supabase never pauses (§4.7) |
| `.github/workflows/snapshot.yml` | **New** — nightly regeneration of `content-snapshot.json` (§4.7) |
| `404.html` | **New** — "MISSING EVIDENCE" page |
| `favicon.svg` | Replace with pushpin / fingerprint mark |
| `photo.jpg` | Keep; rendered inside hero polaroid |
| `README.md` | Update architecture, admin instructions, env setup |
| Supabase project | **New (external)** — tables, RLS policies, auth config, storage bucket |

## 8. Implementation Phases

Each phase ships independently — the site is never broken in between.

1. **Phase 1 — The Board (pure visual).** New CSS design system + rethemed sections,
   still static HTML fragments. Biggest visible win, zero risk.
2. **Phase 2 — The Database.** Create Supabase project, tables, RLS; migrate current
   content into rows; switch `script.js` to JSON fetch with snapshot fallback.
3. **Phase 3 — The War Room.** Build `admin.html` CRUD + auth + image upload;
   keep-alive cron + nightly snapshot workflows (§4.7).
4. **Phase 4 — The Interrogation Room.** `documents` table + pgvector, chunk/embed
   ingestion, `/api/interrogate` with rate limits and spend caps, chat UI (§3.9, §4.6).
5. **Phase 5 — Hardening & polish.** `vercel.json` headers, 404 page, lightbox,
   flashlight mode, easter egg, Lighthouse + accessibility pass
   (reduced-motion, contrast on paper textures, focus states on all pins).

---

*Filed by: Lead Investigator A.M. · Status: AWAITING APPROVAL · This document will
self-update as the case develops.*
