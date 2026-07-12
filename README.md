# CASE FILE №2026-AM — Abrarullah Mohammed

Personal portfolio of Abrarullah Mohammed, AI/ML Engineer (LLM & RAG systems),
designed as a detective's **evidence board**: corkboard, index cards, polaroids,
red string, rubber stamps — the visitor works the case. Built with vanilla HTML,
CSS, and JavaScript. No frameworks, no build step, zero npm dependencies.

**Live site:** deployed on Vercel (auto-deploys from `main`).

The full design/architecture plan lives in
[`EVIDENCE_BOARD_REDESIGN.md`](EVIDENCE_BOARD_REDESIGN.md).

---

## Features

- Evidence-board theme: pinned index cards, polaroid photo, sticky notes,
  evidence tags, rubber-stamp scroll animations, a red-string layer connecting
  every section, coffee stains, and a magnifying-glass cursor
- **View Clean File** toggle — flat, printable, recruiter-friendly mode
  (persisted in localStorage)
- Content rendered from `content.json` — edit the JSON, redeploy, done;
  optionally served live from Supabase (see below)
- Capability radar chart + carousels focused on the LLM/RAG stack
  (RAG, LangChain, LlamaIndex, LangGraph, embeddings, vector search)
- Case timer footer, `whodunit` easter egg, reduced-motion support
- Strict Content-Security-Policy; all dynamic content rendered via
  `textContent` (no innerHTML with fetched data)

---

## Architecture

```
my-portfolio/
├── index.html                  # Static shell — nav, footer, section mounts
├── styles.css                  # Design system (materials, sections, clean mode)
├── script.js                   # Content loader + DOM renderers + interactions
├── config.js                   # Supabase URL + anon key (empty = snapshot only)
├── content.json                # All site content (the snapshot / source of truth)
├── favicon.svg                 # Pushpin favicon
├── photo.jpg / resume-*.pdf    # Assets
├── api/interrogate.js          # Serverless RAG endpoint (Interrogation Room)
├── package.json                # Deps for /api functions only (@anthropic-ai/sdk)
├── supabase/schema.sql         # content table + RLS policies (run in SQL editor)
├── supabase/rag-schema.sql     # pgvector documents + rate limiting (run after)
├── scripts/seed_supabase.py    # Seed/re-sync the database from content.json
├── scripts/build_index.py      # Chunk + embed content.json into the RAG index
└── .github/workflows/
    ├── keepalive.yml           # Pings Supabase every 2 days (free tier never pauses)
    └── snapshot.yml            # Nightly: regenerate content.json from the DB
```

**Content flow:** the site always renders instantly from `content.json`.
If `config.js` contains Supabase credentials, live data is fetched from the
`content` table (public read via Row Level Security; writes require the single
owner account) and used when it answers within 2.5s — otherwise the snapshot
wins. The nightly snapshot workflow keeps `content.json` at most 24h behind
the database, which also makes git the content backup.

### Editing content

- **Without Supabase:** edit `content.json` (even in the GitHub web editor),
  push — Vercel redeploys in about a minute.
- **With Supabase:** update rows in the `content` table (Phase 3 adds an
  in-theme admin panel, "The War Room").

### Enabling Supabase

1. Create a free project at supabase.com; run `supabase/schema.sql` in the
   SQL editor (paste your auth user UUID into the owner policy).
2. Disable sign-ups, create your single user, enable MFA.
3. `python scripts/seed_supabase.py https://YOUR-REF.supabase.co SERVICE_ROLE_KEY`
4. Put the project URL + anon key in `config.js`, and add the project origin
   to `connect-src` in the CSP in `index.html`.
5. Add repo secrets `SUPABASE_URL` / `SUPABASE_ANON_KEY` and repo variable
   `SUPABASE_ENABLED=true` so the keep-alive and snapshot workflows run.

### Enabling the Interrogation Room (live RAG demo)

The "Interrogation Room" section lets visitors ask questions answered by a
real retrieval pipeline over the case file (Voyage embeddings + pgvector +
Claude). Until configured, it shows an in-theme "still being prepared" note.

1. Run `supabase/rag-schema.sql` in the Supabase SQL editor.
2. Get API keys: [Anthropic](https://console.anthropic.com) (set a monthly
   spend cap!) and [Voyage AI](https://voyageai.com) (embeddings; free tier).
3. Build the index:
   `python scripts/build_index.py https://YOUR-REF.supabase.co SERVICE_ROLE_KEY VOYAGE_API_KEY`
   (re-run whenever content changes).
4. In Vercel → Project → Settings → Environment Variables, add:
   `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`; redeploy.

Abuse controls are built in: 300-char questions, 10 questions/hour per IP,
200/day globally, short capped answers — plus whatever spend cap you set in
the provider console (the true backstop).

---

## Running locally

Any static server works (`fetch()` needs HTTP, not `file://`):

```bash
python -m http.server 8080
# or
npx serve .
```

Then open http://localhost:8080.

---

## Contact

- Email: abrarullahm2001@gmail.com
- LinkedIn: [mohammed-abrarullah-92886a193](https://www.linkedin.com/in/mohammed-abrarullah-92886a193)
- GitHub: [Abrar6801](https://github.com/Abrar6801)
