'use strict';

/* ============================================================
   REBUILD INDEX — /api/reindex (Vercel function, owner-only)

   Called from the War Room. Reads the LIVE content from the
   Supabase `content` table (so admin edits are picked up),
   re-chunks it into case-file documents, re-embeds via Voyage,
   replaces the `documents` table, and clears the answer cache.

   Authorization: the caller must present a Supabase JWT whose
   user id matches the owner. The database's RLS remains the
   ultimate boundary for content writes; this check just keeps
   randoms from burning your embedding quota.
   ============================================================ */

/* Owner's auth user id — public identifier, same one in the RLS policies. */
const OWNER_ID = 'bbc11068-828e-4235-a723-f3b4bb8e198b';

function sbHeaders(cfg, extra) {
  return Object.assign({
    apikey: cfg.serviceKey,
    Authorization: `Bearer ${cfg.serviceKey}`,
    'Content-Type': 'application/json'
  }, extra || {});
}

/* Mirrors scripts/build_index.py::build_documents */
function buildDocuments(content) {
  const docs = [];
  const add = (sourceKey, label, anchor, text) => {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (clean) docs.push({ source_key: sourceKey, label, anchor, content: clean });
  };
  const pad = (n) => String(n).padStart(2, '0');

  const p = content.profile || {};
  const facts = (p.dossier || []).map((d) => `${d.label}: ${d.value}`).join(' · ');
  add('profile', 'SUBJECT PROFILE', '#about',
    `Subject: ${(p.name || []).join(' ')}. ${p.occupation || ''}. ${p.bio || ''} ` +
    `Modus operandi: ${p.modusOperandi || ''} ${facts}`);

  const sk = content.skills || {};
  for (const card of sk.cards || []) {
    add('skills', 'CAPABILITY SHEET', '#skills',
      `Capability: ${card.label} rated ${card.score}/10. Skills: ${(card.pills || []).join(', ')}.`);
  }
  const steps = (sk.methodology || [])
    .map((s) => `${s.title} (${s.tech}): ${s.note}`).join('; ');
  add('skills', 'RETRIEVAL METHODOLOGY', '#skills',
    `His RAG / retrieval pipeline methodology: ${steps}`);

  for (const note of content.philosophy || []) {
    add('philosophy', 'PSYCH PROFILE', '#philosophy',
      `Engineering philosophy ${note.title}: ${note.body}`);
  }

  (content.experience || []).forEach((job, i) => {
    add('experience', `SIGHTING №${pad(i + 1)}`, '#experience',
      `Work experience: ${job.role} at ${job.company} (${job.dates}, ${job.location || ''}). ` +
      (job.bullets || []).join(' '));
  });

  const pr = content.projects || {};
  for (const proj of pr.major || []) {
    const metrics = (proj.metrics || [])
      .map((m) => `${m.static !== undefined ? m.static : m.value}${m.suffix || ''} ${m.label}`)
      .join('; ');
    add('projects', `EXHIBIT ${proj.exhibit}`, '#projects',
      `Project: ${proj.title} (${proj.classification}). Tech: ${(proj.tech || []).join(', ')}. ` +
      `${proj.description} Results: ${metrics}.`);
  }
  for (const m of pr.minor || []) {
    add('projects', String(m.tag || 'MINOR EXHIBIT').split(' · ')[0].toUpperCase(), '#projects',
      `Minor project: ${m.title}. Tech: ${(m.tech || []).join(', ')}. ${m.description}`);
  }

  for (const s of content.education || []) {
    add('education', String(s.record || '').toUpperCase(), '#education',
      `Education: ${s.degree}, ${s.school} (${s.dates}, ${s.gpa}). Coursework: ${s.coursework}`);
  }

  const pub = content.publications || {};
  for (const paper of pub.papers || []) {
    add('publications', 'PUBLISHED FINDINGS', '#publications',
      `Publication: ${paper.title} — ${paper.meta}.`);
  }
  const certs = (pub.certifications || [])
    .map((c) => `${c.name} (${c.issuer})`).join('; ');
  add('publications', 'CREDENTIALS ON FILE', '#publications', `Certifications held: ${certs}.`);

  const channels = ((content.contact || {}).channels || [])
    .map((c) => `${c.label}: ${c.value}`).join('; ');
  add('contact', 'TIP LINE', '#contact', `Contact channels: ${channels}`);

  for (const note of (content.confidential || {}).notes || []) {
    add('confidential', 'ADMINISTRATIVE NOTE', '#contact', note);
  }

  return docs;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only.' });
  }

  const cfg = {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  if (!cfg.url || !cfg.serviceKey || !process.env.VOYAGE_API_KEY) {
    return res.status(503).json({ error: 'Reindex is not configured (missing env vars).' });
  }

  try {
    /* --- authorize: only the owner's badge may rebuild --- */
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'No badge presented.' });

    const who = await fetch(`${cfg.url}/auth/v1/user`, {
      headers: { apikey: cfg.serviceKey, Authorization: `Bearer ${token}` }
    });
    if (!who.ok) return res.status(401).json({ error: 'Badge rejected.' });
    const user = await who.json();
    if (!user || user.id !== OWNER_ID) {
      return res.status(403).json({ error: 'Authorized personnel only.' });
    }

    /* --- load live content from the database --- */
    const contentResp = await fetch(`${cfg.url}/rest/v1/content?select=key,data`, {
      headers: sbHeaders(cfg)
    });
    if (!contentResp.ok) throw new Error(`content fetch ${contentResp.status}`);
    const rows = await contentResp.json();
    const content = {};
    for (const row of rows) content[row.key] = row.data;

    const docs = buildDocuments(content);
    if (docs.length === 0) throw new Error('no documents produced');

    /* --- embed --- */
    const embResp = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.EMBED_MODEL || 'voyage-3.5-lite',
        input: docs.map((d) => d.content),
        input_type: 'document'
      })
    });
    if (!embResp.ok) throw new Error(`voyage ${embResp.status}`);
    const embData = (await embResp.json()).data
      .sort((a, b) => a.index - b.index);
    docs.forEach((d, i) => { d.embedding = embData[i].embedding; });

    /* --- replace the index --- */
    const del = await fetch(`${cfg.url}/rest/v1/documents?id=not.is.null`, {
      method: 'DELETE',
      headers: sbHeaders(cfg, { Prefer: 'return=minimal' })
    });
    if (!del.ok) throw new Error(`delete ${del.status}`);
    const ins = await fetch(`${cfg.url}/rest/v1/documents`, {
      method: 'POST',
      headers: sbHeaders(cfg, { Prefer: 'return=minimal' }),
      body: JSON.stringify(docs)
    });
    if (!ins.ok) throw new Error(`insert ${ins.status}`);

    /* --- stale answers must go (best-effort; table may not exist) --- */
    await fetch(`${cfg.url}/rest/v1/answer_cache?question_hash=not.is.null`, {
      method: 'DELETE',
      headers: sbHeaders(cfg, { Prefer: 'return=minimal' })
    }).catch(() => {});

    return res.status(200).json({ indexed: docs.length });
  } catch (err) {
    console.error('reindex error:', err);
    return res.status(500).json({ error: 'Reindex failed — check the function logs.' });
  }
};
