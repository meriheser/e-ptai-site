// E-PtAi site: hero carousel, move tabs, follow-class builder, entrances. No dependencies.
(function () {
  var root = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dir = root.dir === 'rtl' ? -1 : 1;
  if (still) root.classList.add('still');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };


  // Colour theme dots: turquoise (default) or the logo's black and neon green; kept in localStorage, no cookie.
  (function () {
    var btns = $$('[data-theme-set]'), meta = $('meta[name=theme-color]');
    function paint(t) {
      if (t) root.dataset.theme = t; else delete root.dataset.theme;
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.themeSet === t); });
      if (meta) meta.setAttribute('content', t ? '#000000' : '#040A0C');
    }
    paint(root.dataset.theme || '');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        paint(b.dataset.themeSet);
        try { if (b.dataset.themeSet) localStorage.setItem('e-theme', b.dataset.themeSet); else localStorage.removeItem('e-theme'); } catch (e) {}
      });
    });
  })();

  // Carousel: one number (pos) drives every phone. Drag, arrows, keys and the timer set its target.
  var stage = $('.stage'), phones = $$('.ph'), fill = $('.track span'), cap = $('.cap'), autoBtn = $('.auto');
  var caps = $$('i', $('#caps').content), heroVid = $('.ph video');
  var n = phones.length, pos = 0, target = 0, active = 0, w = 200, narrow = false;
  var STEP = 3500, playing = !still, hold = false, t0 = performance.now(), elapsed = 0, seen = true, raf = 0;

  function measure() { w = phones[phones.length > 1 ? 1 : 0].offsetWidth; narrow = innerWidth < 760; }
  function apply() {
    phones.forEach(function (p, i) {
      var d = ((i - pos + n / 2) % n + n) % n - n / 2, a = Math.abs(d);
      var t = d * 34 * Math.PI / 180, R = w * (narrow ? 1.45 : 1.75);
      var x = dir * R * Math.sin(t), z = R * (Math.cos(t) - 1) - Math.min(a, 1) * w * .3;
      p.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + (dir * d * 30).toFixed(2) + 'deg)';
      p.style.opacity = a > 2.15 ? Math.max(0, 2.5 - a) / .35 : 1;
      p.style.zIndex = 10 - Math.round(a);
      p.style.setProperty('--dim', Math.min(a * .42, .8).toFixed(2));
    });
    var r = ((Math.round(pos) % n) + n) % n;
    if (r !== active) { active = r; cap.textContent = caps[r].textContent; stage.classList.toggle('vid-off', r !== 0); root.dispatchEvent(new CustomEvent('heroslide', { detail: r })); }
  }
  function bar() {
    var f = playing ? Math.min(1, elapsed / STEP) : 1;
    var idx = ((Math.round(target) % n) + n) % n;
    fill.style.transform = 'scaleX(' + ((idx + f) / n).toFixed(4) + ')';
  }
  function frame(now) {
    raf = 0;
    if (!seen) return;
    var dt = now - t0; t0 = now;
    if (playing && !hold && !(heroVid && !heroVid.paused && !heroVid.ended) && !(window.__lesson && window.__lesson.busy())) {
      elapsed += Math.min(dt, 100);
      if (elapsed >= STEP) { elapsed = 0; target = Math.round(target) + 1; }
    }
    pos = still ? target : pos + (target - pos) * (1 - Math.exp(-dt / 130));
    if (Math.abs(target - pos) < .001) pos = target;
    apply(); bar();
    if (!still || pos !== target) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); } }
  function go(by) { target = Math.round(target) + by; elapsed = 0; wake(); }
  function setPlaying(v) {
    playing = v; elapsed = 0;
    root.classList.toggle('paused', !v);
    autoBtn.setAttribute('aria-label', v ? autoBtn.dataset.pause : autoBtn.dataset.play);
    wake();
  }
  $('.prev').addEventListener('click', function () { go(-1); });
  $('.next').addEventListener('click', function () { go(1); });
  autoBtn.addEventListener('click', function () { setPlaying(!playing); });
  stage.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    go((k === 'ArrowRight' ? 1 : -1) * dir);
  });
  var sx = 0, sp = 0, pid = null, moved = false;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button || e.target.closest('button')) return;
    pid = e.pointerId; sx = e.clientX; sp = target; moved = false;
  });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerId !== pid) return;
    var dx = e.clientX - sx;
    if (!moved && Math.abs(dx) < 8) return;
    if (!moved) { moved = true; hold = true; stage.setPointerCapture(pid); stage.classList.add('drag'); }
    target = sp - dir * dx / (w * 1.1);
    wake();
  });
  function end(e) {
    if (e.pointerId !== pid) return;
    pid = null;
    if (!moved) return;
    stage.classList.remove('drag');
    target = Math.round(target); elapsed = 0; hold = false; t0 = performance.now();
    wake();
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  addEventListener('resize', function () { measure(); apply(); });
  measure(); apply(); bar();
  if (still) setPlaying(false);

  // Move library tabs: thumbs and the phone's clip follow the chosen style.
  var video = $('.clip-phone video'), clips = video.dataset.clips.split(',');
  $$('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = +b.dataset.tab;
      $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('[data-group]').forEach(function (g) { g.hidden = +g.dataset.group !== i; });
      video.poster = '/assets/img/clips/' + clips[i] + '.webp';
      $('source', video).src = '/assets/img/clips/' + clips[i] + '.mp4';
      video.load();
      if (!still) { var p = video.play(); if (p) p.catch(function () {}); }
    });
  });

  // Tabbed pages: a button shows its pane inside the same section.
  $$('[data-seg]').forEach(function (seg) {
    var body = $('.duo-body', seg.closest('.sec'));
    $$('button', seg).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $$(':scope > .pane', body).forEach(function (p) { p.hidden = p.dataset.pane !== b.dataset.pane; });
      });
    });
  });

  // One-to-one AI lesson video, in three places (first page, lessons page, AI Coach page).
  // It tries to start with sound; when the browser refuses, it starts muted and the first touch, click or key turns the sound on
  // and restarts it. One video at a time; it stops when its page leaves the screen. Reduced motion: no autoplay.
  // Welcome voice: set by assets/audio/welcome-<lang>.mp3 (set window.__WELCOME = true, or the constant below, once the files exist).
  var lessonVideos = $$('video[data-lesson]');
  if (lessonVideos.length) (function () {
    var WELCOME = window.__WELCOME !== undefined ? window.__WELCOME : true;
    var vids = lessonVideos, userMuted = false, wa = null, welcomeDone = false, busy = false, heroOn = false;
    var hv = heroVid, wcap = $('.welcome-cap');
    window.__lesson = { busy: function () { return busy; }, vids: vids, wa: function () { return wa; } };
    function ctl(v) { return v.closest('.lesson-demo') || $('.hero-vctl'); }
    function sync(v) {
      var c = ctl(v), pl = $('.v-play', c), sn = $('.v-snd', c);
      pl.classList.toggle('on', !v.paused); pl.setAttribute('aria-label', v.paused ? pl.dataset.play : pl.dataset.pause);
      sn.classList.toggle('on', !v.muted); sn.setAttribute('aria-label', v.muted ? sn.dataset.on : sn.dataset.off);
      sn.classList.toggle('need', v.muted && !userMuted && !v.paused);
    }
    function start(v, fromZero) {
      if (still || v._user || document.hidden || (v === hv && busy)) return;
      if (v.ended || fromZero) v.currentTime = 0;
      vids.forEach(function (o) { if (o !== v) o.pause(); });
      v.volume = 1; v.muted = userMuted;
      var p = v.play();
      if (p) p.catch(function () {
        if (userMuted) return;
        v.muted = true; var q = v.play(); if (q) q.catch(function () {}); sync(v);
      });
    }
    function hideCap() { if (wcap) wcap.hidden = true; }
    function finish() { welcomeDone = true; busy = false; hideCap(); hv._user = false; start(hv, true); }
    function playWelcome() {
      if (!WELCOME || welcomeDone || still || !hv || (wa && busy)) return false;
      if (!wa) {
        wa = new Audio('/assets/audio/welcome-' + (root.lang || 'tr') + '.mp3'); wa.preload = 'auto';
        wa.addEventListener('ended', finish);
        wa.addEventListener('playing', function () { if (wcap) wcap.hidden = false; });
        wa.addEventListener('error', function () { welcomeDone = true; busy = false; hideCap(); start(hv, true); });
      }
      busy = true; hv.pause(); hv.currentTime = 0; wa.currentTime = 0;
      var p = wa.play();
      if (p) p.catch(function (e) { if (e && e.name !== 'NotAllowedError') return; busy = false; done = false; hideCap(); start(hv); });   // blocked: the muted video starts, the voice waits for the first touch
      return true;
    }
    vids.forEach(function (v) {
      var c = ctl(v), pl = $('.v-play', c), sn = $('.v-snd', c);
      pl.addEventListener('click', function () {
        if (busy && v === hv) { wa.pause(); busy = false; welcomeDone = true; hideCap(); }
        if (v.paused) { v._user = false; start(v); } else { v._user = true; v.pause(); }
      });
      sn.addEventListener('click', function () {
        if (busy && v === hv) { wa.pause(); busy = false; welcomeDone = true; hideCap(); }
        if (v.muted) { userMuted = false; v.muted = false; v.volume = 1; if (v.paused) { v._user = false; start(v); } }
        else { userMuted = true; v.muted = true; }
        vids.forEach(sync);
      });
      ['play', 'pause', 'ended', 'volumechange'].forEach(function (t) { v.addEventListener(t, function () { sync(v); }); });
      v.addEventListener('play', function () { vids.forEach(function (o) { if (o !== v) o.pause(); }); });
      new IntersectionObserver(function (es) {
        var on = es[0].isIntersecting;
        if (v === hv) { heroOn = on; if (!on && wa && busy) { wa.pause(); busy = false; hideCap(); } }
        if (!on) { v.pause(); return; }
        if (v === hv && playWelcome()) return;
        start(v);
      }, { threshold: .4 }).observe(v);
      sync(v);
    });
    // The first touch, click or key: the sound comes on (the welcome voice first on the first page); the click itself is left alone.
    function unlock(e) {
      if (done || (e.target.closest && e.target.closest('.vctl'))) return;
      if (hv && heroOn && WELCOME && !welcomeDone && !still) { done = true; playWelcome(); return; }
      var v = vids.filter(function (x) { return !x.paused && x.muted; })[0];
      if (v && !userMuted && !still) { done = true; v.muted = false; v.volume = 1; v.currentTime = 0; var p = v.play(); if (p) p.catch(function () { v.muted = true; v.play(); done = false; }); sync(v); }
    }
    var done = false;
    ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'].forEach(function (t) { document.addEventListener(t, unlock, { capture: true, passive: true }); });
    root.addEventListener('heroslide', function (e) {
      if (!hv) return;
      if (e.detail !== 0) { hv.pause(); if (wa && busy) { wa.pause(); busy = false; hideCap(); } }
      else if (heroOn) { if (!playWelcome()) start(hv); }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { vids.forEach(function (v) { v.pause(); }); if (wa && busy) { wa.pause(); busy = false; hideCap(); } } });
  })();

  // Follow-class builder: same numbers as components/follow-class.ts (fitness timing).
  var sec = $('.cls'), form = $('.builder'), out = $('.out', form), T = [[30, 30], [40, 20], [45, 15]];
  form.addEventListener('change', function () {
    var m = +form.elements.len.value, p = T[+form.elements.int.value];
    var c = Math.max(3, Math.round((m * 60 - 10 + p[1]) / (p[0] + p[1])));
    out.textContent = sec.dataset.out.replace('{n}', c).replace('{w}', p[0]).replace('{r}', p[1]);
  });


  // Horizontal pages: one panel per section; wheel, keys and the pill move sideways, a tall panel scrolls itself first.
  (function () {
    var hs = $('#hs'); if (!hs) return;
    var panels = $$('.hero,.sec,.foot', hs), cur = 0, last = 0, line = $('.scrollbar');
    var nav = document.createElement('nav'); nav.className = 'pager'; nav.setAttribute('aria-label', document.title);
    nav.innerHTML = '<button type="button" class="pg-prev"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><span class="pg-n" aria-live="polite"></span><button type="button" class="pg-auto"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="ic-pause" d="M8 5v14M16 5v14"/><path class="ic-play" d="M8 5l11 7-11 7z"/></svg></button><button type="button" class="pg-next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
    document.body.appendChild(nav);
    var sweep = document.createElement('i'); sweep.className = 'sweep'; sweep.setAttribute('aria-hidden', 'true'); document.body.appendChild(sweep);
    var pv = $('.pg-prev', nav), nx = $('.pg-next', nav), num = $('.pg-n', nav);
    pv.setAttribute('aria-label', $('.arrow.prev').getAttribute('aria-label'));
    nx.setAttribute('aria-label', $('.arrow.next').getAttribute('aria-label'));
    function paint() {
      num.textContent = (cur + 1) + ' / ' + panels.length;
      pv.disabled = cur === 0; nx.disabled = cur === panels.length - 1;
      if (line) line.style.transform = 'scaleX(' + ((cur + 1) / panels.length).toFixed(3) + ')';
    }
    function to(i) {
      i = Math.max(0, Math.min(panels.length - 1, i));
      panels[i].scrollIntoView({ behavior: still ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
    }
    var pa = $('.pg-auto', nav);
    pa.setAttribute('aria-label', autoBtn.getAttribute('aria-label'));
    pa.addEventListener('click', function () { setPlaying(!playing); pa.setAttribute('aria-label', autoBtn.getAttribute('aria-label')); });
    // Auto page change: the phones first, then one page at a time; any touch, key or wheel holds it for 20 s; stops on the last page.
    var userAt = 0, shownAt = Date.now(), seenCur = 0;
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (t) {
      addEventListener(t, function () { userAt = Date.now(); }, { passive: true });
    });
    setInterval(function () {
      if (cur !== seenCur) { seenCur = cur; shownAt = Date.now(); }
      if (!playing || still || document.hidden || cur === panels.length - 1 || Date.now() - userAt < 20000) return;
      var p = panels[cur], tall = p.scrollHeight > p.clientHeight + 2;
      var need = cur === 0 ? 14000 : tall ? 16000 : 9000, held = Date.now() - shownAt;
      var lv = window.__lesson && window.__lesson.vids.filter(function (v) { return p.contains(v) && v.offsetParent; })[0];
      if (lv) {
        need = Math.max(need, 16000);
        if (window.__lesson.busy()) need = Infinity;
        else if (!lv.paused && !lv.ended && (!lv.muted || held < 34000)) need = Infinity;
      }
      if (held >= need) { shownAt = Date.now(); to(cur + 1); }
    }, 500);
    var cue = document.createElement('button'); cue.type = 'button'; cue.className = 'cue';
    cue.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    cue.setAttribute('aria-label', 'v'); document.body.appendChild(cue);
    function cueCheck() { var p = panels[cur]; cue.classList.toggle('on', p.scrollHeight > p.clientHeight + 8 && p.scrollTop + p.clientHeight < p.scrollHeight - 12); }
    cue.addEventListener('click', function () { var p = panels[cur]; p.scrollBy({ top: p.clientHeight * .7, behavior: still ? 'auto' : 'smooth' }); });
    panels.forEach(function (p) { p.addEventListener('scroll', cueCheck, { passive: true }); });
    addEventListener('resize', cueCheck); setInterval(cueCheck, 600);
    pv.addEventListener('click', function () { to(cur - 1); });
    nx.addEventListener('click', function () { to(cur + 1); });
    var pio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var was = cur; cur = panels.indexOf(e.target); paint(); if (was !== cur && !still) { sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go'); } } });
    }, { root: hs, threshold: .55 });
    panels.forEach(function (p) { pio.observe(p); });
    hs.addEventListener('wheel', function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var p = panels[cur], down = e.deltaY > 0;
      var room = down ? p.scrollHeight - p.clientHeight - p.scrollTop : p.scrollTop;
      if (room > 2) return;
      e.preventDefault();
      var now = Date.now();
      if (Math.abs(e.deltaY) < 8 || now - last < 650) return;
      last = now; to(cur + (down ? 1 : -1));
    }, { passive: false });
    addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input,select,textarea,summary')) return;
      var k = e.key, fwd = dir === 1 ? 'ArrowRight' : 'ArrowLeft', bwd = dir === 1 ? 'ArrowLeft' : 'ArrowRight';
      if (k === fwd || k === 'PageDown') { e.preventDefault(); to(cur + 1); }
      else if (k === bwd || k === 'PageUp') { e.preventDefault(); to(cur - 1); }
      else if (k === 'Home') { e.preventDefault(); to(0); }
      else if (k === 'End') { e.preventDefault(); to(panels.length - 1); }
    });
    addEventListener('resize', function () { to(cur); });
    paint();
  })();

  // Copy deterrent for the home pages: no right-click menu, drag, selection or copy, except the footer's contact details.
  (function () {
    var free = function (e) { return e.target.closest && e.target.closest('.foot'); };
    ['contextmenu', 'dragstart', 'copy', 'cut', 'selectstart'].forEach(function (t) {
      document.addEventListener(t, function (e) { if (!free(e)) e.preventDefault(); });
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && /^[supc]$/i.test(e.key) && !free(e)) e.preventDefault();
    });
  })();

  // Pages sit side by side, so native lazy loading can miss them: once the first screen is done, load every picture.
  addEventListener('load', function () { setTimeout(function () { $$('img').forEach(function (i) { i.loading = 'eager'; if (i.decode) i.decode().catch(function () {}); }); }, 400); });

  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    seen = es[0].isIntersecting;
    if (seen) wake();
  }).observe(stage);

  // Clips play only while on screen; reduced motion keeps the posters.
  if (!still) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); } else e.target.pause();
      });
    }, { threshold: .3 });
    $$('video').forEach(function (v) { if (!v.hasAttribute('data-lesson')) io.observe(v); });

    // Entrances exist only after this script ran, so a script failure never hides content.
    root.classList.add('rv-on');
    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        rv.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.sec').forEach(function (s) {
      $$('.rv', s).forEach(function (el, i) { el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms'); rv.observe(el); });
    });
  }
})();
