'use strict';

/* ============================================================
   THE WAR ROOM — owner-only content admin.

   Talks to Supabase over plain REST (no vendored SDK, CSP stays
   script-src 'self'). Writes are authorized by the owner's JWT;
   the database's Row Level Security is the actual boundary —
   this page is just a convenient pen.
   ============================================================ */

var CFG = window.SUPABASE_CONFIG || {};
var SESSION_KEY = 'warRoomSession';

var state = {
  session: null,   /* { access_token, refresh_token, expires_at, email } */
  content: {}      /* key -> { data, updated_at } */
};

/* ---------- tiny DOM helpers ---------- */
function $(id) { return document.getElementById(id); }
function show(node, on) { node.hidden = !on; }
function setStatus(msg) {
  var line = $('statusLine');
  line.textContent = msg;
  show(line, true);
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(function () { show(line, false); }, 4000);
}
function setErr(id, msg) {
  var node = $(id);
  node.textContent = msg || '';
  node.classList.toggle('show', !!msg);
}

/* ---------- session persistence ---------- */
function saveSession() {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(state.session)); } catch (e) {}
}
function loadSession() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    state.session = raw ? JSON.parse(raw) : null;
  } catch (e) { state.session = null; }
}
function clearSession() {
  state.session = null;
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

/* ---------- auth over REST ---------- */
function authRequest(grant, body) {
  return fetch(CFG.url + '/auth/v1/token?grant_type=' + grant, {
    method: 'POST',
    headers: { apikey: CFG.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function (r) {
    return r.json().then(function (data) {
      if (!r.ok) throw new Error(data.error_description || data.msg || ('auth failed (' + r.status + ')'));
      return data;
    });
  });
}

function adoptSession(data) {
  state.session = {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Date.now() + (data.expires_in - 60) * 1000,
    email:         (data.user && data.user.email) || ''
  };
  saveSession();
}

function ensureFreshToken() {
  var s = state.session;
  if (!s) return Promise.reject(new Error('not signed in'));
  if (Date.now() < s.expires_at) return Promise.resolve();
  return authRequest('refresh_token', { refresh_token: s.refresh_token })
    .then(adoptSession)
    .catch(function (e) { clearSession(); throw e; });
}

/* ---------- REST wrapper (auto-refresh once on 401) ---------- */
function api(path, options, retried) {
  options = options || {};
  return ensureFreshToken().then(function () {
    var headers = {
      apikey: CFG.anonKey,
      Authorization: 'Bearer ' + state.session.access_token,
      'Content-Type': 'application/json'
    };
    Object.keys(options.headers || {}).forEach(function (k) { headers[k] = options.headers[k]; });
    return fetch(CFG.url + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }).then(function (r) {
    if (r.status === 401 && !retried) {
      state.session.expires_at = 0; /* force refresh */
      return api(path, options, true);
    }
    if (!r.ok) {
      return r.text().then(function (t) {
        throw new Error('HTTP ' + r.status + ': ' + t.slice(0, 200));
      });
    }
    return r.status === 204 ? null : r.json();
  });
}

/* ---------- content I/O ---------- */
function fetchContent() {
  return api('/rest/v1/content?select=key,data,updated_at&order=key').then(function (rows) {
    state.content = {};
    rows.forEach(function (row) {
      state.content[row.key] = { data: row.data, updated_at: row.updated_at };
    });
  });
}

function saveSection(key, data) {
  return api('/rest/v1/content?on_conflict=key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: [{ key: key, data: data }]
  }).then(function (rows) {
    var row = rows && rows[0];
    state.content[key] = { data: (row && row.data) || data, updated_at: (row && row.updated_at) || new Date().toISOString() };
    renderSections();
  });
}

/* ---------- views ---------- */
function enterApp() {
  show($('loginView'), false);
  show($('appView'), true);
  $('warUser').textContent = 'Badge: ' + (state.session.email || 'owner');
  fetchContent().then(function () {
    renderSections();
    populateSkillCards();
  }).catch(function (e) {
    setStatus('Could not load case file: ' + e.message);
  });
}

function enterLogin() {
  show($('appView'), false);
  show($('loginView'), true);
}

function renderSections() {
  var list = $('sectionList');
  list.textContent = '';
  if (Object.keys(state.content).length === 0) {
    var empty = document.createElement('p');
    empty.className = 'war-hint';
    empty.textContent = 'The case file is empty — the database has not been seeded yet. '
      + 'Run: python scripts/seed_supabase.py <SUPABASE_URL> <SERVICE_ROLE_KEY> '
      + 'then reload this page.';
    list.appendChild(empty);
    return;
  }
  Object.keys(state.content).sort().forEach(function (key) {
    var entry = state.content[key];
    var info = document.createElement('div');
    var name = document.createElement('span');
    name.className = 'sc-key';
    name.textContent = key;
    var date = document.createElement('span');
    date.className = 'sc-date';
    date.textContent = 'updated ' + (entry.updated_at || '').slice(0, 16).replace('T', ' ');
    info.appendChild(name);
    info.appendChild(date);

    var btn = document.createElement('button');
    btn.textContent = 'Open file';
    btn.addEventListener('click', function () { openEditor(key); });

    var card = document.createElement('div');
    card.className = 'section-card';
    card.appendChild(info);
    card.appendChild(btn);
    list.appendChild(card);
  });
}

var editingKey = null;
function openEditor(key) {
  editingKey = key;
  $('editorTitle').textContent = 'Section: ' + key;
  $('editorMeta').textContent = 'updated ' + (state.content[key].updated_at || '').slice(0, 19).replace('T', ' ');
  $('editorArea').value = JSON.stringify(state.content[key].data, null, 2);
  setErr('editorError', '');
  show($('editorPanel'), true);
  $('editorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('editorCancel').addEventListener('click', function () {
  editingKey = null;
  show($('editorPanel'), false);
});

$('editorSave').addEventListener('click', function () {
  if (!editingKey) return;
  var parsed;
  try {
    parsed = JSON.parse($('editorArea').value);
  } catch (e) {
    setErr('editorError', 'Invalid JSON — nothing was saved. ' + e.message);
    return;
  }
  setErr('editorError', '');
  var key = editingKey;
  saveSection(key, parsed).then(function () {
    setStatus('Filed. Section "' + key + '" saved to the case file.');
    show($('editorPanel'), false);
    editingKey = null;
  }).catch(function (e) {
    setErr('editorError', 'Save refused: ' + e.message);
  });
});

/* ---------- quick actions ---------- */
function populateSkillCards() {
  var sel = $('qsCard');
  while (sel.options.length > 1) sel.remove(1);
  var skills = state.content.skills && state.content.skills.data;
  ((skills && skills.cards) || []).forEach(function (c, i) {
    var opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = c.label;
    sel.appendChild(opt);
  });
}

function nextExhibitLetter(majors) {
  return String.fromCharCode(65 + majors.length); /* A, B, C… */
}

var quickActions = {
  project: function () {
    var pr = state.content.projects.data;
    var title = $('qpTitle').value.trim();
    var cls = $('qpClass').value.trim();
    var desc = $('qpDesc').value.trim();
    if (!title || !cls || !desc) throw new Error('Title, classification and description are required.');
    var tech = $('qpTech').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var links = [];
    if ($('qpLive').value.trim()) links.push({ label: 'Inspect Evidence ↗', href: $('qpLive').value.trim(), aria: title + ' live demo' });
    if ($('qpSrc').value.trim())  links.push({ label: 'Source ↗', href: $('qpSrc').value.trim(), aria: title + ' source code' });

    if ($('qpMinor').checked) {
      pr.minor.push({
        tag: 'Exhibit M-' + String(pr.minor.length + 1).padStart(2, '0') + ' · ' + cls,
        title: title, tech: tech, description: desc,
        link: links[0] || undefined
      });
    } else {
      var letter = nextExhibitLetter(pr.major);
      pr.major.push({
        exhibit: letter,
        caseNo: '№2026-AM-P' + String(pr.major.length + 1).padStart(2, '0'),
        classification: cls,
        title: title, links: links, tech: tech, description: desc,
        metrics: []
      });
    }
    return saveSection('projects', pr).then(function () {
      ['qpTitle', 'qpClass', 'qpDesc', 'qpTech', 'qpLive', 'qpSrc'].forEach(function (id) { $(id).value = ''; });
      $('qpMinor').checked = false;
      return 'Exhibit filed. It is live on the board.';
    });
  },

  skill: function () {
    var sk = state.content.skills.data;
    var name = $('qsName').value.trim();
    if (!name) throw new Error('Skill name is required.');
    var row = $('qsRow').value;
    if (row) sk.carousel[row].push(name);
    var cardIdx = $('qsCard').value;
    if (cardIdx !== '') sk.cards[Number(cardIdx)].pills.push(name);
    if (!row && cardIdx === '') throw new Error('Pick a carousel row or a capability card (or both).');
    return saveSection('skills', sk).then(function () {
      $('qsName').value = '';
      populateSkillCards();
      return 'Capability "' + name + '" filed.';
    });
  },

  cert: function () {
    var pub = state.content.publications.data;
    var name = $('qcName').value.trim();
    var issuer = $('qcIssuer').value.trim();
    if (!name || !issuer) throw new Error('Name and issuer are required.');
    pub.certifications.push({ name: name, issuer: issuer, color: $('qcColor').value });
    return saveSection('publications', pub).then(function () {
      $('qcName').value = ''; $('qcIssuer').value = '';
      return 'Credential filed.';
    });
  },

  sighting: function () {
    var exp = state.content.experience.data;
    var role = $('qeRole').value.trim();
    var company = $('qeCompany').value.trim();
    var dates = $('qeDates').value.trim();
    if (!role || !company || !dates) throw new Error('Role, company and dates are required.');
    var bullets = $('qeBullets').value.split('\n').map(function (b) { return b.trim(); }).filter(Boolean);
    exp.push({
      role: role, company: company, dates: dates,
      location: $('qeLoc').value.trim(), status: 'Confirmed', bullets: bullets
    });
    return saveSection('experience', exp).then(function () {
      ['qeRole', 'qeCompany', 'qeDates', 'qeLoc', 'qeBullets'].forEach(function (id) { $(id).value = ''; });
      return 'Sighting logged.';
    });
  },

  extra: function () {
    var extras = (state.content.extras && state.content.extras.data) || [];
    var text = $('qxText').value.trim();
    if (!text) throw new Error('Note text is required.');
    extras.push({ section: $('qxSection').value, type: 'sticky-note', text: text });
    if (!state.content.extras) state.content.extras = { data: extras };
    return saveSection('extras', extras).then(function () {
      $('qxText').value = '';
      return 'Note pinned to the board.';
    });
  }
};

document.querySelectorAll('[data-quick]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var kind = btn.getAttribute('data-quick');
    try {
      Promise.resolve(quickActions[kind]()).then(function (msg) {
        setStatus(msg);
      }).catch(function (e) {
        setStatus('Refused: ' + e.message);
      });
    } catch (e) {
      setStatus('Refused: ' + e.message);
    }
  });
});

/* ---------- login / logout ---------- */
$('loginBtn').addEventListener('click', function () {
  var email = $('loginEmail').value.trim();
  var password = $('loginPassword').value;
  if (!email || !password) { setErr('loginError', 'Badge ID and passphrase are both required.'); return; }
  setErr('loginError', '');
  $('loginBtn').disabled = true;
  authRequest('password', { email: email, password: password }).then(function (data) {
    adoptSession(data);
    $('loginPassword').value = '';
    enterApp();
  }).catch(function (e) {
    setErr('loginError', 'Access denied: ' + e.message);
  }).then(function () {
    $('loginBtn').disabled = false;
  });
});

$('loginPassword').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') $('loginBtn').click();
});

$('logoutBtn').addEventListener('click', function () {
  var token = state.session && state.session.access_token;
  if (token) {
    fetch(CFG.url + '/auth/v1/logout', {
      method: 'POST',
      headers: { apikey: CFG.anonKey, Authorization: 'Bearer ' + token }
    }).catch(function () { /* best effort */ });
  }
  clearSession();
  enterLogin();
});

/* ---------- boot ---------- */
(function boot() {
  if (!CFG.url || !CFG.anonKey) {
    show($('configNotice'), true);
    $('loginBtn').disabled = true;
    return;
  }
  loadSession();
  if (state.session) {
    ensureFreshToken().then(enterApp).catch(enterLogin);
  }
}());
