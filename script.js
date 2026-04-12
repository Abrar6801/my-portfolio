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
  { id: 'sec-philosophy',   file: 'sections/philosophy.html' },
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
    var words  = ['Abrarullah', 'Mohammed'];
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

  /* ===== TYPEWRITER (no-op — replaced with static subtitle in HTML) ===== */
  /* The typewriter cycling animation has been replaced with a static .hero-static-sub element.
     The twText element no longer exists in the DOM; this block is intentionally left empty
     to preserve the code structure while removing the cycling animation. */

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
    var fSend = document.getElementById('fSend');
    if (!fSend) return;
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
        'mailto:abrarullahm2001@gmail.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body='    + encodeURIComponent(body);
    });
  }());

  /* ===== NEURAL CANVAS ===== */
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

      /* Update positions */
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0)             { n.x = 0;             n.vx *= -1; }
        if (n.x > canvas.width)  { n.x = canvas.width;  n.vx *= -1; }
        if (n.y < 0)             { n.y = 0;             n.vy *= -1; }
        if (n.y > canvas.height) { n.y = canvas.height; n.vy *= -1; }
      }

      /* Draw edges */
      ctx.lineWidth = 0.5;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          dx   = nodes[i].x - nodes[j].x;
          dy   = nodes[i].y - nodes[j].y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            alpha = (1 - dist / MAX_DIST) * 0.6;
            ctx.strokeStyle = 'rgba(200,105,10,' + alpha + ')';
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      /* Draw nodes */
      ctx.fillStyle = '#1a1f3a';
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

  /* ===== RADAR CHART ANIMATION ===== */
  (function () {
    var polygon = document.getElementById('radar-polygon');
    if (!polygon) return;

    var finalPts = [
      { x: 200, y: 72  },  /* Languages: 8/10 × 160 = 128 */
      { x: 325, y: 128 },  /* ML/AI: 9/10 × 160 = 144 */
      { x: 311, y: 264 },  /* Data Engineering: 8/10 × 160 = 128 */
      { x: 200, y: 312 },  /* Backend: 7/10 × 160 = 112 */
      { x: 117, y: 248 },  /* Frontend: 6/10 × 160 = 96 */
      { x: 89,  y: 136 }   /* Research: 8/10 × 160 = 128 */
    ];
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
      card.style.transitionDelay = delays[i] + 'ms';
      philObs.observe(card);
    });
  }());

}
