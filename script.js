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

/* ===== LOAD SECTIONS THEN INIT ===== */
var sectionMap = [
  { id: 'sec-hero',         file: 'sections/hero.html' },
  { id: 'sec-skills',       file: 'sections/skills.html' },
  { id: 'sec-experience',   file: 'sections/experience.html' },
  { id: 'sec-projects',     file: 'sections/projects.html' },
  { id: 'sec-education',    file: 'sections/education.html' },
  { id: 'sec-publications', file: 'sections/publications.html' },
  { id: 'sec-contact',      file: 'sections/contact.html' }
];

Promise.all(sectionMap.map(function (s) {
  return fetch(s.file)
    .then(function (r) { return r.text(); })
    .then(function (html) {
      document.getElementById(s.id).innerHTML = html;
    });
})).then(initSections);

function initSections() {

  /* ===== ACTIVE NAV via IntersectionObserver ===== */
  var navAnchors = document.querySelectorAll('.nav-links a[data-sec]');
  var secIds = ['about','skills','experience','projects','education','publications','contact'];
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
    var words  = ['Abrarullah', 'Mohammed'];
    var offset = 0;
    words.forEach(function (word, wi) {
      var el = document.getElementById('heroWord' + (wi + 1));
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

  /* ===== TYPEWRITER ===== */
  (function () {
    var phrases = [
      'NLP Engineer',
      'AI/ML Developer',
      'Full-Stack Engineer',
      'Computer Vision Researcher'
    ];
    var textEl  = document.getElementById('twText');
    var idx = 0, charIdx = 0, deleting = false;
    function tick() {
      var phrase = phrases[idx];
      if (!deleting) {
        charIdx++;
        textEl.textContent = phrase.slice(0, charIdx);
        if (charIdx === phrase.length) { deleting = true; setTimeout(tick, 1800); return; }
      } else {
        charIdx--;
        textEl.textContent = phrase.slice(0, charIdx);
        if (charIdx === 0) { deleting = false; idx = (idx + 1) % phrases.length; setTimeout(tick, 350); return; }
      }
      setTimeout(tick, deleting ? 55 : 95);
    }
    setTimeout(tick, 900);
  }());

  /* ===== OPEN TO WORK DISMISS ===== */
  document.getElementById('otwX').addEventListener('click', function () {
    document.getElementById('otwBadge').style.display = 'none';
  });

  /* ===== RESUME DROPDOWN ===== */
  (function () {
    var btn  = document.getElementById('resumeBtn');
    var drop = document.getElementById('resumeDrop');
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

  /* ===== CAROUSEL FILL ===== */
  (function () {
    var r1 = ['Python','PyTorch','TensorFlow','FastAPI','React.js','PySpark','Flask','SQL','Java','JavaScript','TypeScript','HTML/CSS'];
    var r2 = ['CodeBERT','Hugging Face Transformers','Keras','scikit-learn','PostgreSQL','Pandas','NumPy','OpenCV','VGG16','OpenAI API','Git','Agile/Scrum'];
    function fill(id, items) {
      var track = document.getElementById(id);
      if (!track) return;
      items.concat(items).forEach(function (name) {
        var s = document.createElement('span');
        s.classList.add('spill');
        s.textContent = name;
        track.appendChild(s);
      });
    }
    fill('cr1', r1);
    fill('cr2', r2);
  }());

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
    document.getElementById('fSend').addEventListener('click', function () {
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
        'mailto:abrarullahm2001@gmail.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body='    + encodeURIComponent(body);
    });
  }());
}
