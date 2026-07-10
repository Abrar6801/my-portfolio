'use strict';

/* Mark document as JS-ready */
document.documentElement.classList.add('js-loaded');

/* ===== CUSTOM CURSOR ===== */
(function () {
  var cur = document.getElementById('cursor');
  if (!window.matchMedia('(hover: hover)').matches) return;
  var pending = false;
  document.addEventListener('mousemove', function (e) {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      cur.style.left    = e.clientX + 'px';
      cur.style.top     = e.clientY + 'px';
      cur.style.opacity = '1';
      pending = false;
    });
  });
  document.addEventListener('mouseleave', function () {
    cur.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    cur.style.opacity = '1';
  });
}());

/* ===== SCROLL HANDLER (rAF throttled) ===== */
var navbar     = document.getElementById('navbar');
var scrollTopB = document.getElementById('scrollTop');
var scrPend    = false;

window.addEventListener('scroll', function () {
  if (scrPend) return;
  scrPend = true;
  requestAnimationFrame(function () {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
    scrollTopB.classList.toggle('visible', window.scrollY > 400);
    scrPend = false;
  });
}, { passive: true });

scrollTopB.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== HAMBURGER ===== */
var hamburger  = document.getElementById('hamburger');
var mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', function () {
  var open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
});

mobileMenu.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

/* ============================================================
   DOM HELPERS — all dynamic content goes through textContent.
   Never innerHTML with fetched data (XSS rule; see redesign doc §6.1).
   ============================================================ */
function el(tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class')      node.className = attrs[k];
      else if (k === 'text')  node.textContent = attrs[k];
      else                    node.setAttribute(k, attrs[k]);
    });
  }
  (children || []).forEach(function (c) {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

var SVG_NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, children) {
  var node = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
  }
  (children || []).forEach(function (c) { node.appendChild(c); });
  return node;
}

/* Only https / same-site links or known-safe schemes may become hrefs. */
function safeHref(url) {
  if (typeof url !== 'string') return '#';
  if (/^https:\/\//i.test(url)) return url;
  if (/^mailto:/i.test(url)) return url;
  if (/^[a-z0-9_\-./#?=]+$/i.test(url) && url.indexOf('//') !== 0) return url; /* relative */
  return '#';
}

function extLink(link, className) {
  var external = /^https:/i.test(link.href || '');
  var attrs = { class: className, href: safeHref(link.href), text: link.label };
  if (link.aria) attrs['aria-label'] = link.aria;
  if (external) { attrs.target = '_blank'; attrs.rel = 'noopener noreferrer'; }
  return el('a', attrs);
}

/* ===== TRUSTED LOCAL CONSTANTS (never from the database) ===== */
var ICON_PATHS = {
  github:   'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
};

function iconSvg(type, size) {
  var path = ICON_PATHS[type];
  if (!path) return document.createTextNode('');
  return svgEl('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
    [svgEl('path', { d: path })]);
}

/* Bespoke exhibit chart SVGs — code-owned template strings keyed by id.
   Projects reference them by name; the strings themselves never come
   from the database, so innerHTML here is safe. */
var VISUALS = {
  'jet-confusion': '<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="110" y="12" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="10" fill="#1a1f3a" letter-spacing="0.05em">CONFUSION MATRIX</text><text x="88" y="26" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070">Pred Jet</text><text x="172" y="26" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070">Pred Other</text><text x="10" y="72" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070" transform="rotate(-90,10,72)">Actual Jet</text><text x="10" y="128" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070" transform="rotate(-90,10,128)">Actual Other</text><rect x="28" y="30" width="84" height="52" fill="rgba(192,57,43,0.88)" rx="4"/><text x="70" y="52" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="rgba(255,255,255,0.7)">TP</text><text x="70" y="68" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="18" fill="#ffffff" font-weight="500">94</text><rect x="118" y="30" width="84" height="52" fill="#e8e0d0" rx="4"/><text x="160" y="52" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070">FP</text><text x="160" y="68" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="18" fill="#1a1f3a" font-weight="500">6</text><rect x="28" y="88" width="84" height="52" fill="#e8e0d0" rx="4"/><text x="70" y="110" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070">FN</text><text x="70" y="126" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="18" fill="#1a1f3a" font-weight="500">4</text><rect x="118" y="88" width="84" height="52" fill="rgba(192,57,43,0.45)" rx="4"/><text x="160" y="110" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="rgba(255,255,255,0.8)">TN</text><text x="160" y="126" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="18" fill="#ffffff" font-weight="500">96</text></svg>',
  'review-performance': '<svg viewBox="0 0 210 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="105" y="13" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="10" fill="#1a1f3a" letter-spacing="0.05em">MODEL PERFORMANCE</text><text x="54" y="35" text-anchor="end" font-family="\'IBM Plex Mono\',monospace" font-size="9" fill="#5a6070">Precision</text><rect x="60" y="22" width="130" height="16" fill="#e8e0d0" rx="2"/><rect x="60" y="22" width="114" height="16" fill="#c0392b" rx="2"/><text x="197" y="34" text-anchor="start" font-family="\'IBM Plex Mono\',monospace" font-size="9" fill="#c0392b">88%</text><text x="54" y="65" text-anchor="end" font-family="\'IBM Plex Mono\',monospace" font-size="9" fill="#5a6070">Recall</text><rect x="60" y="52" width="130" height="16" fill="#e8e0d0" rx="2"/><rect x="60" y="52" width="118" height="16" fill="#c0392b" rx="2"/><text x="197" y="64" text-anchor="start" font-family="\'IBM Plex Mono\',monospace" font-size="9" fill="#c0392b">91%</text><text x="54" y="95" text-anchor="end" font-family="\'IBM Plex Mono\',monospace" font-size="9" fill="#5a6070">F1 Score</text><rect x="60" y="82" width="130" height="16" fill="#e8e0d0" rx="2"/><rect x="60" y="82" width="117" height="16" fill="#c0392b" rx="2"/><text x="197" y="94" text-anchor="start" font-family="\'IBM Plex Mono\',monospace" font-size="9" fill="#c0392b">90%</text></svg>',
  'revenue-forecast': '<svg viewBox="0 0 210 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="105" y="13" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="10" fill="#1a1f3a" letter-spacing="0.05em">REVENUE FORECAST</text><polygon points="10,82 40,62 70,70 100,38 130,52 160,22 185,37 205,30 205,95 10,95" fill="rgba(192,57,43,0.1)"/><polyline points="10,82 40,62 70,70 100,38 130,52 160,22 185,37 205,30" fill="none" stroke="#c0392b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><line x1="10" y1="95" x2="205" y2="95" stroke="#e8e0d0" stroke-width="1"/><circle cx="10" cy="82" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><circle cx="40" cy="62" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><circle cx="70" cy="70" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><circle cx="100" cy="38" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><circle cx="130" cy="52" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><circle cx="160" cy="22" r="4.5" fill="#c0392b" stroke="#c0392b" stroke-width="2"/><circle cx="185" cy="37" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><circle cx="205" cy="30" r="3.5" fill="#ffffff" stroke="#c0392b" stroke-width="2"/><text x="10" y="107" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Q1</text><text x="70" y="107" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Q2</text><text x="130" y="107" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Q3</text><text x="205" y="107" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Q4</text></svg>',
  'task-architecture': '<svg viewBox="0 0 210 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="105" y="13" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="10" fill="#1a1f3a" letter-spacing="0.05em">ARCHITECTURE</text><rect x="8" y="28" width="56" height="36" fill="#f5f0e8" stroke="#c0392b" stroke-width="1.5" rx="4"/><text x="36" y="44" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#1a1f3a">User</text><text x="36" y="56" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Auth</text><line x1="64" y1="46" x2="76" y2="46" stroke="#5a6070" stroke-width="1.5" stroke-dasharray="3,2"/><polygon points="74,42 82,46 74,50" fill="#5a6070"/><rect x="77" y="28" width="56" height="36" fill="#f5f0e8" stroke="#c0392b" stroke-width="1.5" rx="4"/><text x="105" y="44" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#1a1f3a">CRUD</text><text x="105" y="56" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Tasks</text><line x1="133" y1="46" x2="145" y2="46" stroke="#5a6070" stroke-width="1.5" stroke-dasharray="3,2"/><polygon points="143,42 151,46 143,50" fill="#5a6070"/><rect x="146" y="28" width="56" height="36" fill="#1a1f3a" stroke="#1a1f3a" stroke-width="1.5" rx="4"/><text x="174" y="44" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#f5f0e8">AI</text><text x="174" y="56" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Schedule</text><text x="36" y="80" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Google OAuth</text><text x="105" y="80" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">SQLAlchemy</text><text x="174" y="80" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">GPT-4o-mini</text></svg>',
  'paperly-architecture': '<svg viewBox="0 0 210 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="105" y="13" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="10" fill="#1a1f3a" letter-spacing="0.05em">ARCHITECTURE</text><rect x="8" y="28" width="56" height="36" fill="#f5f0e8" stroke="#c0392b" stroke-width="1.5" rx="4"/><text x="36" y="44" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#1a1f3a">Clerk</text><text x="36" y="56" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Auth</text><line x1="64" y1="46" x2="76" y2="46" stroke="#5a6070" stroke-width="1.5" stroke-dasharray="3,2"/><polygon points="74,42 82,46 74,50" fill="#5a6070"/><rect x="77" y="28" width="56" height="36" fill="#f5f0e8" stroke="#c0392b" stroke-width="1.5" rx="4"/><text x="105" y="44" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#1a1f3a">Tiptap</text><text x="105" y="56" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Editor</text><line x1="133" y1="46" x2="145" y2="46" stroke="#5a6070" stroke-width="1.5" stroke-dasharray="3,2"/><polygon points="143,42 151,46 143,50" fill="#5a6070"/><rect x="146" y="28" width="56" height="36" fill="#1a1f3a" stroke="#1a1f3a" stroke-width="1.5" rx="4"/><text x="174" y="44" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#f5f0e8">Live</text><text x="174" y="56" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Sync</text><text x="36" y="80" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Next.js</text><text x="105" y="80" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">18+ Exts.</text><text x="174" y="80" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="#5a6070">Liveblocks</text><text x="105" y="100" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070">TypeScript  ·  Convex  ·  Tailwind</text></svg>',
  'onchain-flow': '<svg viewBox="0 0 210 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><text x="105" y="13" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="10" fill="#1a1f3a" letter-spacing="0.05em">ON-CHAIN FLOW</text><line x1="10" y1="52" x2="200" y2="52" stroke="#e8e0d0" stroke-width="1" stroke-dasharray="2,3"/><rect x="8" y="24" width="44" height="36" fill="#1a1f3a" rx="4"/><text x="30" y="39" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="rgba(245,240,232,0.6)">BLOCK 0</text><text x="30" y="51" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Genesis</text><line x1="52" y1="42" x2="62" y2="42" stroke="#c0392b" stroke-width="2"/><polygon points="60,38 68,42 60,46" fill="#c0392b"/><rect x="62" y="24" width="44" height="36" fill="#1a1f3a" rx="4"/><text x="84" y="39" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="rgba(245,240,232,0.6)">BLOCK 1</text><text x="84" y="51" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Vote 1</text><line x1="106" y1="42" x2="116" y2="42" stroke="#c0392b" stroke-width="2"/><polygon points="114,38 122,42 114,46" fill="#c0392b"/><rect x="116" y="24" width="44" height="36" fill="#1a1f3a" rx="4"/><text x="138" y="39" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="rgba(245,240,232,0.6)">BLOCK 2</text><text x="138" y="51" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#c0392b">Vote 2</text><line x1="160" y1="42" x2="170" y2="42" stroke="#c0392b" stroke-width="2"/><polygon points="168,38 176,42 168,46" fill="#c0392b"/><rect x="170" y="24" width="34" height="36" fill="#c0392b" rx="4"/><text x="187" y="39" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="7" fill="rgba(255,255,255,0.7)">FINAL</text><text x="187" y="51" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#ffffff">Tally</text><text x="105" y="76" text-anchor="middle" font-family="\'IBM Plex Mono\',monospace" font-size="8" fill="#5a6070">Sepolia Testnet  ·  MetaMask  ·  Solidity</text></svg>'
};

/* ============================================================
   CONTENT LOADING — Supabase (when configured) with the committed
   content.json snapshot as guaranteed fallback (redesign doc §4.7)
   ============================================================ */
function loadContent() {
  var snapshot = fetch('content.json').then(function (r) {
    if (!r.ok) throw new Error('snapshot missing');
    return r.json();
  });

  var cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey) return snapshot;

  var remote = fetch(cfg.url + '/rest/v1/content?select=key,data', {
    headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey }
  }).then(function (r) {
    if (!r.ok) throw new Error('supabase ' + r.status);
    return r.json();
  }).then(function (rows) {
    var out = {};
    rows.forEach(function (row) { out[row.key] = row.data; });
    if (!out.profile || !out.projects) throw new Error('incomplete content');
    return out;
  });

  var timeout = new Promise(function (resolve, reject) {
    setTimeout(reject, 2500, new Error('supabase timeout'));
  });

  /* Live data if it answers quickly; the snapshot otherwise. */
  return Promise.race([remote, timeout]).catch(function () { return snapshot; });
}

/* ============================================================
   SECTION RENDERERS
   ============================================================ */
function caseHeader(h) {
  return el('div', { class: 'case-header fi' }, [
    el('span', { class: 'file-tab', text: h.tab }),
    el('span', { class: 'stamp stamp-sm stamp-anim', text: h.stamp }),
    el('p', { class: 'case-note', text: h.note })
  ]);
}

function pinSpan(variant) {
  return el('span', { class: 'pin' + (variant ? ' ' + variant : ''), 'aria-hidden': 'true' });
}

function renderExtras(section, sectionKey, extras) {
  (extras || []).forEach(function (x) {
    if (x.section !== sectionKey) return;
    if (x.type === 'coffee-stain') {
      section.appendChild(el('div', { class: 'coffee-stain ' + (x.variant || ''), 'aria-hidden': 'true' }));
    } else if (x.type === 'sticky-note') {
      section.appendChild(el('p', { class: 'sticky-note prop-note fi', text: x.text || '' }));
    }
  });
}

/* ---- §1 SUBJECT PROFILE ---- */
function renderHero(mount, p) {
  var left = el('div', { class: 'hero-left' });

  left.appendChild(el('p', { class: 'case-open' }, [
    'CASE FILE №2026-AM · SUBJECT PROFILE ',
    el('span', { class: 'stamp stamp-inline stamp-anim', text: 'Confidential' })
  ]));

  var dossier = el('dl', { class: 'dossier' });
  (p.dossier || []).forEach(function (d) {
    dossier.appendChild(el('div', null, [
      el('dt', { text: d.label }),
      el('dd', { text: d.value })
    ]));
  });

  left.appendChild(el('div', { class: 'index-card hero-card rot-a' }, [
    pinSpan(),
    el('p', { class: 'hero-statement', text: p.statement }),
    el('h1', { class: 'hero-name', id: 'heroName', 'aria-label': (p.name || []).join(' ') }, [
      el('span', { class: 'hero-word', id: 'heroWord1' }),
      el('span', { class: 'hero-word', id: 'heroWord2' })
    ]),
    el('p', { class: 'hero-static-sub', text: p.occupation }),
    el('div', { class: 'hero-badge evidence-tag', text: p.badge }),
    dossier,
    el('p', { class: 'hero-bio', text: p.bio })
  ]));

  var drop = el('div', { class: 'resume-drop', id: 'resumeDrop' });
  (p.resumes || []).forEach(function (r) {
    drop.appendChild(el('a', { class: 'resume-opt', href: safeHref(r.href), download: '', text: r.label }));
  });
  left.appendChild(el('div', { class: 'hero-btns' }, [
    el('div', { class: 'resume-wrap' }, [
      el('button', { class: 'btn-p', id: 'resumeBtn', text: '🗂 Personnel File ↓' }),
      drop
    ]),
    el('a', { class: 'btn-s', href: '#projects', text: 'Review Exhibits ↓' })
  ]));

  var soc = el('div', { class: 'hero-soc' });
  (p.socials || []).forEach(function (s) {
    var a = el('a', { class: 'soc-a', href: safeHref(s.href), target: '_blank', rel: 'noopener noreferrer', 'aria-label': s.aria || s.type });
    a.appendChild(iconSvg(s.type, 18));
    soc.appendChild(a);
  });
  left.appendChild(soc);

  if (p.openToWork) {
    left.appendChild(el('div', { class: 'otw', id: 'otwBadge' }, [
      el('span', { class: 'otw-dot', 'aria-hidden': 'true' }),
      el('span', { text: 'Status: Open to Work' }),
      el('button', { class: 'otw-x', id: 'otwX', 'aria-label': 'Dismiss open to work badge', text: '×' })
    ]));
  }

  var photo = p.photo || {};
  var right = el('div', { class: 'hero-right' }, [
    el('figure', { class: 'polaroid rot-c' }, [
      el('span', { class: 'tape tape-tc', 'aria-hidden': 'true' }),
      el('img', { src: safeHref(photo.src || 'photo.jpg'), alt: photo.alt || '', loading: 'eager', width: '380', height: '380' }),
      el('figcaption', { class: 'polaroid-cap', text: photo.caption || '' }),
      el('span', { class: 'stamp photo-stamp stamp-anim', text: 'Subject' })
    ]),
    el('div', { class: 'sticky-note hero-mo rot-b' }, [
      pinSpan('pin--yellow'),
      el('span', { class: 'mo-label', text: 'Modus Operandi' }),
      el('p', { text: p.modusOperandi })
    ])
  ]);

  var canvas = el('canvas', { id: 'neural-canvas', 'aria-hidden': 'true' });
  mount.appendChild(el('section', { id: 'about', class: 'hero-sec' }, [
    canvas,
    el('div', { class: 'hero-inner' }, [left, right])
  ]));
}

/* ---- §2 KNOWN CAPABILITIES ---- */
var RADAR_GRID = [
  '200,168 228,184 228,216 200,232 172,216 172,184',
  '200,136 255,168 255,232 200,264 145,232 145,168',
  '200,104 283,152 283,248 200,296 117,248 117,152',
  '200,72 311,136 311,264 200,328 89,264 89,136',
  '200,40 339,120 339,280 200,360 61,280 61,120'
];
var RADAR_LEVELS = [[204, 196, '2'], [204, 164, '4'], [204, 132, '6'], [204, 100, '8'], [204, 68, '10']];
var RADAR_TIPS   = [[200, 40], [339, 120], [339, 280], [200, 360], [61, 280], [61, 120]];
var RADAR_LABELS = [[200, 22], [330, 104], [330, 302], [200, 384], [70, 302], [70, 104]];

function renderSkills(mount, s, header, extras) {
  var section = el('section', { id: 'skills' });
  section.appendChild(caseHeader(header));

  /* carousels */
  section.appendChild(el('p', { class: 'sub-label fi', text: s.carouselLabel }));
  function track(id, items) {
    var t = el('div', { class: 'car-track ' + (id === 'cr1' ? 'go-l' : 'go-r'), id: id });
    items.concat(items).forEach(function (name) {
      t.appendChild(el('span', { class: 'spill', text: name }));
    });
    return el('div', { class: 'car-row' }, [t]);
  }
  section.appendChild(el('div', { class: 'car-wrap fi', 'aria-hidden': 'true' }, [
    track('cr1', s.carousel.row1 || []),
    track('cr2', s.carousel.row2 || [])
  ]));

  /* radar lab sheet */
  var radar = s.radar || {};
  var svg = svgEl('svg', { viewBox: '0 0 400 400', role: 'img', 'aria-label': 'Capability radar chart showing proficiency across 6 areas' });
  RADAR_GRID.forEach(function (pts) {
    svg.appendChild(svgEl('polygon', { points: pts, fill: 'none', stroke: '#cfc19e', 'stroke-width': '1' }));
  });
  RADAR_LEVELS.forEach(function (lv) {
    svg.appendChild(svgEl('text', { x: lv[0], y: lv[1], 'font-family': "'IBM Plex Mono',monospace", 'font-size': '8', fill: '#b3a582', text: lv[2] }));
  });
  RADAR_TIPS.forEach(function (t) {
    svg.appendChild(svgEl('line', { x1: '200', y1: '200', x2: t[0], y2: t[1], stroke: '#b8ab8c', 'stroke-width': '1' }));
  });
  svg.appendChild(svgEl('polygon', {
    id: 'radar-polygon',
    points: '200,200 200,200 200,200 200,200 200,200 200,200',
    fill: 'rgba(192,57,43,0.14)', stroke: '#c0392b', 'stroke-width': '2.5', 'stroke-linejoin': 'round'
  }));
  (radar.axes || []).forEach(function (a, i) {
    svg.appendChild(svgEl('text', {
      x: RADAR_LABELS[i][0], y: RADAR_LABELS[i][1], 'text-anchor': 'middle',
      class: 'radar-label', 'font-family': "'IBM Plex Mono',monospace",
      'font-size': '11', 'font-weight': '500', fill: '#1c1a17',
      'data-radar-label': a.tip, 'data-radar-skills': a.skills, text: a.label
    }));
  });

  section.appendChild(el('div', { class: 'skills-layout' }, [
    el('div', { class: 'skills-chart-col fi' }, [
      el('div', { class: 'skills-chart-card' }, [
        el('span', { class: 'stamp stamp-sm lab-stamp stamp-anim', text: radar.stamp || 'Lab Use Only' }),
        el('p', { class: 'skills-chart-title', text: radar.title || '' }),
        el('p', { class: 'skills-chart-hint', text: radar.hint || '' }),
        el('div', { class: 'radar-svg-wrap' }, [svg])
      ]),
      el('div', { id: 'radar-tooltip', role: 'tooltip', 'aria-live': 'polite' })
    ]),
    el('div', { class: 'skills-cats-col fi' }, [
      el('div', { class: 'skills-cats-grid' }, (s.cards || []).map(function (c) {
        var width = Math.max(10, Math.min(100, Math.round(c.score * 10)));
        var bar = el('div', { class: 'sk-bar' });
        bar.style.width = width + '%';
        return el('div', { class: 'sk-card' + (c.primary ? ' sk-card--primary' : '') }, [
          el('div', { class: 'sk-card-head' }, [
            el('span', { class: 'sk-card-label', text: c.label }),
            el('span', { class: 'sk-card-score', text: c.score + ' / 10' })
          ]),
          el('div', { class: 'sk-bar-wrap', 'aria-hidden': 'true' }, [bar]),
          el('div', { class: 'sk-pills' }, (c.pills || []).map(function (pl) {
            return el('span', { class: 'sk-pill', text: pl });
          }))
        ]);
      }))
    ])
  ]));

  /* retrieval methodology */
  section.appendChild(el('p', { class: 'sub-label fi', text: s.methodologyLabel }));
  section.appendChild(el('div', { class: 'rag-flow fi' }, (s.methodology || []).map(function (step, i) {
    return el('div', { class: 'rag-step' }, [
      el('span', { class: 'rag-num', text: String(i + 1) }),
      el('h4', { text: step.title }),
      el('p', { class: 'rag-tech', text: step.tech }),
      el('p', { class: 'rag-note', text: step.note })
    ]);
  })));

  section.appendChild(el('p', { class: 'margin-note analyst-note fi', text: s.analystNote }));
  renderExtras(section, 'skills', extras);
  mount.appendChild(section);
}

/* ---- §3 PSYCHOLOGICAL PROFILE ---- */
function renderPhilosophy(mount, items, header, extras) {
  var pins = ['pin--left', 'pin--yellow', 'pin--white pin--right'];
  var section = el('section', { id: 'philosophy' }, [
    caseHeader(header),
    el('div', { class: 'philosophy-grid' }, (items || []).map(function (it, i) {
      return el('div', { class: 'philosophy-card' }, [
        pinSpan(pins[i % pins.length]),
        el('span', { class: 'philosophy-number', text: it.number }),
        el('h3', { text: it.title }),
        el('p', { text: it.body })
      ]);
    }))
  ]);
  renderExtras(section, 'philosophy', extras);
  mount.appendChild(section);
}

/* ---- §4 SURVEILLANCE LOG ---- */
function renderExperience(mount, jobs, header, extras) {
  var rots = ['rot-d', 'rot-e', 'rot-f', 'rot-a'];
  var section = el('section', { id: 'experience', class: 'swrap' }, [
    caseHeader(header),
    el('div', { class: 'timeline' }, (jobs || []).map(function (j, i) {
      var no = (i + 1 < 10 ? '0' : '') + (i + 1);
      return el('article', { class: 'tcard fi ' + rots[i % rots.length] }, [
        el('p', { class: 'sight-line', text: 'Sighting №' + no + ' · ' + j.dates + ' · Status: ' + (j.status || 'Confirmed') }),
        el('div', { class: 'thead' }, [
          el('div', null, [
            el('div', { class: 't-role', text: j.role }),
            el('div', { class: 't-co', text: j.company })
          ]),
          el('div', { class: 't-meta' }, [
            el('div', { text: j.dates }),
            el('div', { text: j.location })
          ])
        ]),
        el('ul', { class: 't-list' }, (j.bullets || []).map(function (b) {
          return el('li', { text: b });
        }))
      ]);
    }))
  ]);
  renderExtras(section, 'experience', extras);
  mount.appendChild(section);
}

/* ---- §5 EXHIBITS ---- */
function renderProjects(mount, pr, header, extras) {
  var pins = ['', 'pin--yellow', 'pin--white'];
  var section = el('section', { id: 'projects', class: 'swrap' });
  section.appendChild(caseHeader(header));

  section.appendChild(el('div', { class: 'proj-stack' }, (pr.major || []).map(function (p, i) {
    var tag = 'Exhibit ' + p.exhibit + ' · ' + p.caseNo + (p.tagExtra ? ' · ' + p.tagExtra : '');
    var links = (p.links || []).map(function (l) { return extLink(l, 'lbtn'); });
    var top = el('div', { class: 'ptop' }, [el('h3', { class: 'ptitle', text: p.title })]);
    if (links.length === 1) top.appendChild(links[0]);
    else if (links.length > 1) top.appendChild(el('div', { class: 'ptop-links' }, links));

    var metrics = el('div', { class: 'metrics' }, (p.metrics || []).map(function (m) {
      var mv;
      if (m.static !== undefined) mv = el('span', { class: 'mv', 'data-static': 'true', text: m.static });
      else mv = el('span', { class: 'mv', 'data-count': String(m.value), 'data-suffix': m.suffix || '', text: '—' });
      return el('div', { class: 'metric' }, [mv, el('span', { class: 'ml', text: m.label })]);
    }));

    var body = el('div', { class: 'pcard-body' }, [
      el('div', { class: 'pcard-content' }, [
        el('p', { class: 'pdesc', text: p.description }),
        metrics
      ])
    ]);
    if (p.visual && VISUALS[p.visual]) {
      var vis = el('div', { class: 'pcard-vis' });
      if (p.visualAria) vis.setAttribute('aria-label', p.visualAria);
      vis.innerHTML = VISUALS[p.visual]; /* trusted local constant */
      body.appendChild(vis);
    }

    return el('article', { class: 'pcard fi' }, [
      pinSpan(pins[i % pins.length]),
      el('div', { class: 'pcard-header' }, [
        el('span', { class: 'evidence-tag', text: tag }),
        el('span', { class: 'pclass', text: 'Classification: ' + p.classification })
      ]),
      top,
      el('div', { class: 'tech-row' }, (p.tech || []).map(function (t) {
        return el('span', { class: 'tp', text: t });
      })),
      body
    ]);
  })));

  section.appendChild(el('p', { class: 'sub-label fi', text: pr.minorLabel || 'Minor Exhibits' }));
  section.appendChild(el('div', { class: 'mini-grid' }, (pr.minor || []).map(function (m) {
    var inner = el('div', { class: 'mcard-inner' }, [
      el('span', { class: 'mcard-tag', text: m.tag }),
      el('h4', { class: 'mtitle', text: m.title }),
      el('div', { class: 'tech-row' }, (m.tech || []).map(function (t) {
        return el('span', { class: 'tp', text: t });
      })),
      el('p', { class: 'mdesc', text: m.description })
    ]);
    if (m.link) inner.appendChild(extLink(m.link, 'lbtn mcard-link'));
    return el('article', { class: 'mcard clip fi' }, [inner]);
  })));

  renderExtras(section, 'projects', extras);
  mount.appendChild(section);
}

/* ---- §6 BACKGROUND CHECK ---- */
function renderEducation(mount, schools, header, extras) {
  var section = el('section', { id: 'education', class: 'swrap' }, [
    caseHeader(header),
    el('div', { class: 'edu-grid' }, (schools || []).map(function (s) {
      return el('article', { class: 'edu-card fi' }, [
        el('p', { class: 'edu-letterhead', text: 'Records Division · Official Transcript · ' + s.record }),
        el('span', { class: 'stamp stamp-sm edu-stamp stamp-anim', text: 'Verified ✓' }),
        el('div', { class: 'edu-icon', 'aria-hidden': 'true', text: '🎓' }),
        el('div', { class: 'edu-deg', text: s.degree }),
        el('div', { class: 'edu-school', text: s.school }),
        el('div', { class: 'edu-meta' }, [
          el('span', { text: s.dates }),
          el('span', { class: 'edu-gpa', text: s.gpa })
        ]),
        el('div', { class: 'edu-cl', text: 'Subjects of Study' }),
        el('div', { class: 'edu-c', text: s.coursework })
      ]);
    }))
  ]);
  renderExtras(section, 'education', extras);
  mount.appendChild(section);
}

/* ---- §7 PUBLISHED FINDINGS ---- */
function renderPublications(mount, pub, header, extras) {
  var section = el('section', { id: 'publications', class: 'swrap' });
  section.appendChild(caseHeader(header));

  section.appendChild(el('p', { class: 'sub-label fi', text: pub.papersLabel || 'Press Clipping' }));
  (pub.papers || []).forEach(function (p) {
    section.appendChild(el('div', { class: 'pub-card fi' }, [
      el('div', null, [
        el('p', { class: 'pub-masthead', text: p.masthead }),
        el('div', { class: 'pub-title', text: p.title }),
        el('div', { class: 'pub-meta', text: p.meta })
      ]),
      p.link ? extLink(p.link, 'lbtn') : null
    ]));
  });

  section.appendChild(el('p', { class: 'sub-label fi', text: pub.certsLabel || 'Credentials on File' }));
  var colors = { gold: 1, blue: 1, orange: 1, green: 1 };
  section.appendChild(el('div', { class: 'cert-grid' }, (pub.certifications || []).map(function (c) {
    var color = colors[c.color] ? c.color : 'blue';
    return el('div', { class: 'cert-card ' + color + ' fi' }, [
      el('div', { class: 'cn', text: c.name }),
      el('div', { class: 'ci', text: c.issuer })
    ]);
  })));

  renderExtras(section, 'publications', extras);
  mount.appendChild(section);
}

/* ---- §8 TIP LINE ---- */
function renderContact(mount, contact, header, extras) {
  var channels = el('div', { class: 'cc-grid' }, (contact.channels || []).map(function (c) {
    var external = /^https:/i.test(c.href || '');
    var attrs = { class: 'cc', href: safeHref(c.href), 'aria-label': c.aria || c.label };
    if (external) { attrs.target = '_blank'; attrs.rel = 'noopener noreferrer'; }
    var ico = el('span', { class: 'cc-ico', 'aria-hidden': 'true' });
    if (c.type === 'email') ico.textContent = '✉';
    else ico.appendChild(iconSvg(c.type, 22));
    return el('a', attrs, [
      ico,
      el('div', { class: 'cc-lbl', text: c.label }),
      el('div', { class: 'cc-val' }, [el('span', { class: 'redacted', text: c.value })]),
      el('span', { class: 'declassify', text: 'hover to declassify ↑' })
    ]);
  }));

  function field(id, errId, label, errText, kind) {
    var input;
    if (kind === 'textarea') input = el('textarea', { id: id, class: 'fi-ta', placeholder: 'State what you know…', maxlength: '2000' });
    else if (kind === 'email') input = el('input', { type: 'email', id: id, class: 'fi-t', placeholder: 'your@email.com', autocomplete: 'email' });
    else input = el('input', { type: 'text', id: id, class: 'fi-t', placeholder: kind, maxlength: id === 'fName' ? '100' : '200' });
    return el('div', { class: 'fg' }, [
      el('label', { class: 'fl', for: id, text: label }),
      input,
      el('div', { class: 'ferr', id: errId, text: errText })
    ]);
  }

  var form = el('div', { class: 'cform fi', role: 'form', 'aria-label': 'Contact form' }, [
    el('div', { class: 'cform-top' }, [
      el('span', { text: 'Witness Statement' }),
      el('span', { class: 'cform-no', text: 'Form 26-B · Case №2026-AM' })
    ]),
    field('fName', 'eN', 'Name of Witness', 'Name is required (max 100 characters).', 'Your name'),
    field('fEmail', 'eE', 'Contact Channel (Email)', 'Please enter a valid email address.', 'email'),
    field('fSubject', 'eS', 'Nature of Tip', 'Subject is required (max 200 characters).', "What's this about?"),
    field('fMsg', 'eM', 'Statement', 'Message is required (max 2000 characters).', 'textarea'),
    el('button', { type: 'button', id: 'fSend', class: 'fsub', text: 'Submit Statement' })
  ]);

  var section = el('section', { id: 'contact', class: 'swrap' }, [
    caseHeader(header),
    el('div', { class: 'contact-layout' }, [
      el('div', { class: 'fi' }, [channels]),
      form
    ])
  ]);
  renderExtras(section, 'contact', extras);
  mount.appendChild(section);
}

/* ============================================================
   LOAD → RENDER → INIT
   ============================================================ */
loadContent().then(function (content) {
  window.CASE_CONTENT = content;
  var h = content.sections || {};
  renderHero(document.getElementById('sec-hero'), content.profile || {});
  renderSkills(document.getElementById('sec-skills'), content.skills || {}, h.skills || {}, content.extras);
  renderPhilosophy(document.getElementById('sec-philosophy'), content.philosophy, h.philosophy || {}, content.extras);
  renderExperience(document.getElementById('sec-experience'), content.experience, h.experience || {}, content.extras);
  renderProjects(document.getElementById('sec-projects'), content.projects || {}, h.projects || {}, content.extras);
  renderEducation(document.getElementById('sec-education'), content.education, h.education || {}, content.extras);
  renderPublications(document.getElementById('sec-publications'), content.publications || {}, h.publications || {}, content.extras);
  renderContact(document.getElementById('sec-contact'), content.contact || {}, h.contact || {}, content.extras);
  initSections(content);
}).catch(function (err) {
  /* Even the snapshot failed — leave a readable trace for debugging. */
  console.error('CASE FILE: content failed to load', err);
});

function initSections(content) {

  /* ===== ACTIVE NAV via IntersectionObserver ===== */
  var navAnchors = document.querySelectorAll('.nav-links a[data-sec]');
  var secIds = ['about','skills','philosophy','experience','projects','education','publications','contact'];
  var navObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navAnchors.forEach(function (a) {
        a.classList.toggle('active', a.dataset.sec === entry.target.id);
      });
    });
  }, { rootMargin: '-30% 0px -65% 0px' });
  secIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) navObs.observe(el);
  });

  /* ===== HERO NAME LETTER ANIMATION ===== */
  (function () {
    var words  = (content.profile && content.profile.name) || ['Abrarullah', 'Mohammed'];
    var offset = 0;
    words.forEach(function (word, wi) {
      var el = document.getElementById('heroWord' + (wi + 1));
      if (!el) return;
      word.split('').forEach(function (ch) {
        var span = document.createElement('span');
        span.classList.add('nl');
        span.textContent = ch;
        span.style.animationDelay = (offset * 0.042) + 's';
        el.appendChild(span);
        offset++;
      });
    });
  }());

  /* ===== OPEN TO WORK DISMISS ===== */
  var otwX = document.getElementById('otwX');
  if (otwX) {
    otwX.addEventListener('click', function () {
      document.getElementById('otwBadge').style.display = 'none';
    });
  }

  /* ===== RESUME DROPDOWN ===== */
  (function () {
    var btn  = document.getElementById('resumeBtn');
    var drop = document.getElementById('resumeDrop');
    if (!btn || !drop) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      drop.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      drop.classList.remove('open');
    });
  }());

  /* ===== FADE-IN OBSERVER ===== */
  var fiObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('on');
      fiObs.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fi').forEach(function (el) { fiObs.observe(el); });

  /* ===== METRIC COUNTERS ===== */
  (function () {
    function animCount(el, target, suffix) {
      var start = performance.now();
      var dur   = 1400;
      function step(now) {
        var t    = Math.min((now - start) / dur, 1);
        var ease = 1 - Math.pow(1 - t, 3);
        var val  = Math.round(ease * target);
        el.textContent = (target >= 1000 ? val.toLocaleString() : String(val)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cntObs.unobserve(entry.target);
        var el = entry.target;
        if (el.dataset.static) return;
        var count  = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || '';
        if (!isNaN(count)) animCount(el, count, suffix);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.mv').forEach(function (el) { cntObs.observe(el); });
  }());

  /* ===== CONTACT FORM ===== */
  (function () {
    function sanitize(str) { return str.replace(/<[^>]*>/g, '').trim(); }
    function setErr(id, show) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle('show', show);
    }
    var fSend = document.getElementById('fSend');
    if (!fSend) return;
    var toEmail = 'abrarullahm2001@gmail.com';
    ((content.contact || {}).channels || []).forEach(function (c) {
      if (c.type === 'email' && c.value) toEmail = c.value;
    });
    fSend.addEventListener('click', function () {
      var name    = sanitize(document.getElementById('fName').value);
      var email   = sanitize(document.getElementById('fEmail').value);
      var subject = sanitize(document.getElementById('fSubject').value);
      var message = sanitize(document.getElementById('fMsg').value);
      var ok      = true;
      if (!name    || name.length    > 100)                       { setErr('eN', true); ok = false; } else { setErr('eN', false); }
      if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('eE', true); ok = false; } else { setErr('eE', false); }
      if (!subject || subject.length > 200)                       { setErr('eS', true); ok = false; } else { setErr('eS', false); }
      if (!message || message.length > 2000)                      { setErr('eM', true); ok = false; } else { setErr('eM', false); }
      if (!ok) return;
      var body = 'Name: ' + name + '\r\nEmail: ' + email + '\r\n\r\n' + message;
      window.location.href =
        'mailto:' + toEmail +
        '?subject=' + encodeURIComponent(subject) +
        '&body='    + encodeURIComponent(body);
    });
  }());

  /* ===== NEURAL CANVAS — red string & pins ===== */
  (function () {
    var canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var nodes = [];
    var NODE_COUNT = 35;
    var MAX_DIST   = 120;
    var animId;

    function resizeCanvas() {
      canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth;
      canvas.height = canvas.offsetHeight || canvas.parentElement.offsetHeight;
    }

    function initNodes() {
      nodes = [];
      for (var i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x:  Math.random() * canvas.width,
          y:  Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4
        });
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var i, j, n, dx, dy, dist, alpha;

      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0)             { n.x = 0;             n.vx *= -1; }
        if (n.x > canvas.width)  { n.x = canvas.width;  n.vx *= -1; }
        if (n.y < 0)             { n.y = 0;             n.vy *= -1; }
        if (n.y > canvas.height) { n.y = canvas.height; n.vy *= -1; }
      }

      ctx.lineWidth = 0.5;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          dx   = nodes[i].x - nodes[j].x;
          dy   = nodes[i].y - nodes[j].y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            alpha = (1 - dist / MAX_DIST) * 0.6;
            ctx.strokeStyle = 'rgba(192,57,43,' + alpha + ')';
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = '#96281b';
      for (i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(drawFrame);
    }

    var resizePend = false;
    window.addEventListener('resize', function () {
      if (resizePend) return;
      resizePend = true;
      requestAnimationFrame(function () {
        resizeCanvas();
        resizePend = false;
      });
    });

    resizeCanvas();
    initNodes();
    drawFrame();
  }());

  /* ===== RADAR CHART ANIMATION (targets computed from content) ===== */
  (function () {
    var polygon = document.getElementById('radar-polygon');
    if (!polygon) return;

    var UNIT = [[0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]];
    var axes = ((content.skills || {}).radar || {}).axes || [];
    var finalPts = axes.map(function (a, i) {
      var r = 160 * (Math.max(0, Math.min(10, a.score)) / 10);
      return { x: 200 + UNIT[i][0] * r, y: 200 + UNIT[i][1] * r };
    });
    if (finalPts.length !== 6) return;
    var centerPts = finalPts.map(function () { return { x: 200, y: 200 }; });

    var startTime = null;
    var DURATION  = 1200;
    var fired     = false;

    function animatePolygon(ts) {
      if (!startTime) startTime = ts;
      var t    = Math.min((ts - startTime) / DURATION, 1);
      var ease = 1 - Math.pow(1 - t, 3);
      var pts  = finalPts.map(function (fp, i) {
        var sx = centerPts[i].x;
        var sy = centerPts[i].y;
        return (sx + (fp.x - sx) * ease) + ',' + (sy + (fp.y - sy) * ease);
      }).join(' ');
      polygon.setAttribute('points', pts);
      if (t < 1) requestAnimationFrame(animatePolygon);
    }

    var skillsSection = document.getElementById('skills');
    if (!skillsSection) {
      requestAnimationFrame(animatePolygon);
      return;
    }

    var radarObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || fired) return;
        fired = true;
        radarObs.unobserve(entry.target);
        requestAnimationFrame(animatePolygon);
      });
    }, { threshold: 0.2 });
    radarObs.observe(skillsSection);
  }());

  /* ===== RADAR TOOLTIPS ===== */
  (function () {
    var tooltip = document.getElementById('radar-tooltip');
    if (!tooltip) return;

    document.querySelectorAll('[data-radar-label]').forEach(function (el) {
      el.addEventListener('mouseenter', function (e) {
        tooltip.textContent = el.getAttribute('data-radar-skills');
        tooltip.style.display = 'block';
        tooltip.style.left    = (e.clientX + 12) + 'px';
        tooltip.style.top     = (e.clientY + 12) + 'px';
      });
      el.addEventListener('mousemove', function (e) {
        tooltip.style.left = (e.clientX + 12) + 'px';
        tooltip.style.top  = (e.clientY + 12) + 'px';
      });
      el.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });
    });
  }());

  /* ===== PHILOSOPHY CARD STAGGER ===== */
  (function () {
    var cards  = document.querySelectorAll('.philosophy-card');
    if (!cards.length) return;
    var delays = [0, 150, 300];

    var philObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        philObs.unobserve(entry.target);
        entry.target.classList.add('phil-on');
      });
    }, { threshold: 0.08 });

    cards.forEach(function (card, i) {
      card.style.transitionDelay = delays[i % delays.length] + 'ms';
      philObs.observe(card);
    });
  }());

  /* ===== RUBBER STAMPS — slam in when scrolled into view ===== */
  (function () {
    var stamps = document.querySelectorAll('.stamp-anim');
    if (!stamps.length) return;
    var stObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        stObs.unobserve(entry.target);
        entry.target.classList.add('stamped');
      });
    }, { threshold: 0.4 });
    stamps.forEach(function (el) { stObs.observe(el); });
  }());

  /* ===== REDACTED TEXT — tap to declassify (touch devices) ===== */
  document.querySelectorAll('.redacted').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!el.classList.contains('revealed')) {
        e.preventDefault();
        el.classList.add('revealed');
      }
    });
  });

  /* ===== RED STRING — draw the thread across the whole board ===== */
  drawStrings();

}

/* ===== RED STRING LAYER ===== */
function drawStrings() {
  var main = document.getElementById('main-content');
  if (!main) return;
  var old = document.getElementById('string-layer');
  if (old) old.parentNode.removeChild(old);

  var ids = ['about', 'skills', 'philosophy', 'experience', 'projects', 'education', 'publications', 'contact'];
  var W = main.offsetWidth;
  var H = main.scrollHeight;
  var NS = 'http://www.w3.org/2000/svg';

  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('id', 'string-layer');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('aria-hidden', 'true');

  /* one anchor per section, zigzagging down the board margins */
  var pts = [];
  ids.forEach(function (id, i) {
    var el = document.getElementById(id);
    if (!el) return;
    pts.push({
      x: (i % 2 === 0) ? W * 0.04 : W * 0.96,
      y: el.offsetTop + (id === 'about' ? 100 : 52)
    });
  });
  if (pts.length < 2) return;

  /* sagging thread between pins */
  var d = 'M ' + pts[0].x + ' ' + pts[0].y;
  for (var i = 1; i < pts.length; i++) {
    var mx = (pts[i - 1].x + pts[i].x) / 2;
    var my = (pts[i - 1].y + pts[i].y) / 2 + 90;
    d += ' Q ' + mx + ' ' + my + ' ' + pts[i].x + ' ' + pts[i].y;
  }
  var path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#c0392b');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('opacity', '0.85');
  svg.appendChild(path);

  /* pinheads at each anchor */
  pts.forEach(function (p) {
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', p.x);
    c.setAttribute('cy', p.y);
    c.setAttribute('r', '6');
    c.setAttribute('fill', '#96281b');
    svg.appendChild(c);
    var h = document.createElementNS(NS, 'circle');
    h.setAttribute('cx', p.x - 1.5);
    h.setAttribute('cy', p.y - 1.5);
    h.setAttribute('r', '2');
    h.setAttribute('fill', '#e74c3c');
    svg.appendChild(h);
  });

  main.insertBefore(svg, main.firstChild);
}

/* redraw once everything (fonts, images) has settled, and on resize */
window.addEventListener('load', drawStrings);
(function () {
  var pending = false;
  window.addEventListener('resize', function () {
    if (pending) return;
    pending = true;
    setTimeout(function () { drawStrings(); pending = false; }, 200);
  });
}());

/* ===== CASE TIMER ===== */
(function () {
  var el = document.getElementById('caseTimer');
  if (!el) return;
  var t0 = Date.now();
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  setInterval(function () {
    var s = Math.floor((Date.now() - t0) / 1000);
    el.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  }, 1000);
}());

/* ===== EASTER EGG — type "whodunit" to close the case ===== */
(function () {
  var overlay = document.getElementById('caseClosed');
  if (!overlay) return;
  var code = 'whodunit';
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-code.length);
    if (buf === code) {
      overlay.classList.add('show');
      setTimeout(function () { overlay.classList.remove('show'); }, 3500);
    }
  });
}());

/* ===== CLEAN FILE MODE TOGGLE ===== */
(function () {
  var btn = document.getElementById('cleanToggle');
  if (!btn) return;
  function setClean(on) {
    document.body.classList.toggle('clean-mode', on);
    btn.textContent = on ? 'View Evidence Board' : 'View Clean File';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try { localStorage.setItem('cleanMode', on ? '1' : '0'); } catch (e) { /* private mode */ }
  }
  var saved = null;
  try { saved = localStorage.getItem('cleanMode'); } catch (e) { /* private mode */ }
  if (saved === '1') setClean(true);
  btn.addEventListener('click', function () {
    setClean(!document.body.classList.contains('clean-mode'));
  });
}());
