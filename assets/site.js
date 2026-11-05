// E-PtAi site: hero carousel, move tabs, follow-class builder, entrances. No dependencies.
(function () {
  var root = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dir = root.dir === 'rtl' ? -1 : 1;
  if (still) root.classList.add('still');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Carousel: one number (pos) drives every phone. Drag, arrows, keys and the timer set its target.
  var stage = $('.stage'), phones = $$('.ph'), fill = $('.track span'), cap = $('.cap'), autoBtn = $('.auto');
  var caps = $$('i', $('#caps').content), heroVid = $('.ph video');
  var n = phones.length, pos = 0, target = 0, active = 0, w = 200, narrow = false;
  var STEP = 3500, playing = true, hold = false, t0 = performance.now(), elapsed = 0, seen = true, raf = 0;

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
    if (playing && !hold && !window.__entryOpen && !(heroVid && !heroVid.paused && !heroVid.ended) && !(window.__lesson && window.__lesson.busy())) {
      elapsed += Math.min(dt, 100);
      if (elapsed >= STEP) { elapsed = 0; target = Math.round(target) + 1; }
    }
    pos = still ? target : pos + (target - pos) * (1 - Math.exp(-dt / 130));
    if (Math.abs(target - pos) < .001) pos = target;
    apply(); bar();
    raf = requestAnimationFrame(frame);
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
      var p = video.play(); if (p) p.catch(function () {});
    });
  });

  // Tabbed pages: a pressed tab shows every element of its pane (text and picture) and hides the other pane.
  $$('[data-seg]').forEach(function (seg) {
    var page = seg.closest('.sec');
    $$('button', seg).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $$('[data-pane]', page).forEach(function (p) { if (p.tagName !== 'BUTTON') p.hidden = p.dataset.pane !== b.dataset.pane; });
      });
    });
  });
  // Questions page: one question open, its answer in the card.
  $$('.faq-w').forEach(function (w) {
    var qs = $$('.faq-q button', w), ans = $('.faq-a', w), src = $$('.faq-src p', w);
    function pick(i) { qs.forEach(function (q, k) { q.setAttribute('aria-selected', k === i); }); ans.innerHTML = src[i].innerHTML; }
    qs.forEach(function (q, i) { q.addEventListener('click', function () { pick(i); }); });
    pick(0);
  });

  // One-to-one AI lesson video, in three places (first page, lessons page, AI Coach page).
  // It tries to start with sound; when the browser refuses, it starts muted and the first touch, click or key turns the sound on
  // and restarts it. One video at a time; it stops when its page leaves the screen. Reduced motion: no autoplay.
  // Welcome voice: set by assets/audio/welcome-<lang>.mp3 (set window.__WELCOME = true, or the constant below, once the files exist).
  var lessonVideos = $$('video[data-lesson]');
  if (lessonVideos.length) (function () {
    var WELCOME = window.__WELCOME !== undefined ? window.__WELCOME : true;
    var vids = lessonVideos, userMuted = false, wa = null, welcomeDone = false, busy = false, heroOn = false;
    var hv = heroVid;
    // Sound is on when the site opens (owner 05.11.2026); only the visitor's own mute is remembered for this tab. Browsers still hold sound back until the first touch or key, which starts it.
    function rememberMute(on) { try { if (on) sessionStorage.setItem('e-muted', '1'); else sessionStorage.removeItem('e-muted'); } catch (e) {} }
    try { if (sessionStorage.getItem('e-muted')) { userMuted = true; welcomeDone = true; } } catch (e) {}
    // A spoken round that ends or is cut short (page change) is over: back to muted.
    function hush(v) { if (!v.muted) { userMuted = true; v.muted = true; } }
    window.__lesson = { busy: function () { return busy; }, vids: vids, wa: function () { return wa; } };
    function ctl(v) { return v.closest('.lesson-demo') || $('.hero-vctl'); }
    function sync(v) {
      var c = ctl(v), pl = $('.v-play', c), sn = $('.v-snd', c);
      pl.classList.toggle('on', !v.paused); pl.setAttribute('aria-label', v.paused ? pl.dataset.play : pl.dataset.pause);
      sn.classList.toggle('on', !v.muted); sn.setAttribute('aria-label', v.muted ? sn.dataset.on : sn.dataset.off);
      sn.classList.toggle('need', v.muted && !userMuted && !v.paused);
    }
    function start(v, fromZero) {
      if (v._user || document.hidden || (v === hv && busy)) return;
      if (v.ended || fromZero) v.currentTime = 0;
      vids.forEach(function (o) { if (o !== v) o.pause(); });
      v.volume = 1; v.muted = userMuted;
      var p = v.play();
      if (p) p.catch(function () {
        if (userMuted) return;
        v.muted = true; var q = v.play(); if (q) q.catch(function () {}); sync(v);
      });
    }
    // Entry screen: shown only when the browser refuses the welcome voice (no earlier interaction with the site). One tap anywhere starts the sound; the small link continues muted.
    // Browsers allow nothing more: sound before the first tap works only where the visitor's own autoplay permission already exists.
    var ENTRY = {
      tr: ['Sesli başla', 'Sessiz devam et'], en: ['Start with sound', 'Continue muted'], es: ['Empezar con sonido', 'Continuar sin sonido'],
      ru: ['Начать со звуком', 'Продолжить без звука'], ar: ['ابدأ بالصوت', 'تابع بدون صوت']
    };
    var entryEl = null, entryFrom = null, entryKids = [];
    function openEntry() {
      var seenKey = false; try { seenKey = !!sessionStorage.getItem('e-entered'); } catch (e) {}
      if (entryEl || seenKey || userMuted) return;
      var t = ENTRY[root.lang] || ENTRY.tr;
      entryKids = $$('body > *').filter(function (x) { return x.tagName !== 'SCRIPT'; });
      entryEl = document.createElement('div'); entryEl.className = 'entry';
      entryEl.setAttribute('role', 'dialog'); entryEl.setAttribute('aria-modal', 'true'); entryEl.setAttribute('aria-label', 'E-PtAi');
      entryEl.innerHTML = '<span class="entry-logo"><img class="mark" src="/assets/img/logo-mark.svg" width="96" height="96" alt=""><span class="word" dir="ltr">E-Pt<span>Ai</span></span></span>' +
        '<button type="button" class="entry-go"></button><button type="button" class="entry-mute"></button>';
      $('.entry-go', entryEl).textContent = t[0]; $('.entry-mute', entryEl).textContent = t[1];
      document.body.appendChild(entryEl);
      entryKids.forEach(function (x) { x.inert = true; });
      window.__entryOpen = true; entryFrom = document.activeElement;
      $('.entry-go', entryEl).focus({ preventScroll: true });
      entryEl.addEventListener('click', function (e) { enter(!e.target.closest('.entry-mute')); });
      entryEl.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); enter(false); }
        else if (e.key === 'Tab') { e.preventDefault(); var a = $('.entry-go', entryEl), b = $('.entry-mute', entryEl); (document.activeElement === a ? b : a).focus(); }
      });
    }
    function enter(sound) {
      if (!entryEl) return;
      try { sessionStorage.setItem('e-entered', '1'); } catch (e) {}
      entryKids.forEach(function (x) { x.inert = false; });
      entryEl.parentNode.removeChild(entryEl); entryEl = null; window.__entryOpen = false;
      if (entryFrom && entryFrom.focus) try { entryFrom.focus({ preventScroll: true }); } catch (e) {}
      if (!sound) { userMuted = true; rememberMute(true); welcomeDone = true; vids.forEach(function (v) { v.muted = true; sync(v); }); return; }
      userMuted = false; rememberMute(false);
      if (hv && heroOn && WELCOME && !welcomeDone) { hv._user = false; done = true; playWelcome(); return; }
      var v = vids.filter(function (x) { return !x.paused; })[0] || hv;
      v._user = false; v.muted = false; v.volume = 1; v.currentTime = 0; done = true;
      var p = v.play(); if (p) p.catch(function () { v.muted = true; v.play(); done = false; }); sync(v);
    }
    function hideCap() {}
    function finish() { welcomeDone = true; busy = false; hideCap(); hv._user = false; start(hv, true); }
    function playWelcome() {
      if (!WELCOME || welcomeDone || !hv || (wa && busy)) return false;
      if (!wa) {
        wa = new Audio('/assets/audio/welcome-' + (root.lang || 'tr') + '.mp3'); wa.preload = 'auto';
        wa.addEventListener('ended', finish);
        wa.addEventListener('error', function () { welcomeDone = true; busy = false; hideCap(); start(hv, true); });
      }
      busy = true; hv.pause(); hv.currentTime = 0; wa.currentTime = 0;
      var p = wa.play();
      if (p) p.catch(function (e) { if (e && e.name !== 'NotAllowedError') return; busy = false; done = false; hideCap(); start(hv); openEntry(); });   // blocked: the muted video starts and the entry asks for one tap
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
        if (v.muted) { userMuted = false; rememberMute(false); v.muted = false; v.volume = 1; if (v.paused) { v._user = false; start(v); } }
        else { userMuted = true; rememberMute(true); v.muted = true; }
        vids.forEach(sync);
      });
      ['play', 'pause', 'ended', 'volumechange'].forEach(function (t) { v.addEventListener(t, function () { sync(v); }); });
      // End of a round: sound off for good (until the button is pressed again), then keep going silently like a loop.
      v.addEventListener('ended', function () {
        hush(v); sync(v);
        if (v._user || (v === hv && busy)) return;
        v.currentTime = 0; var q = v.play(); if (q) q.catch(function () {});
      });
      v.addEventListener('play', function () { vids.forEach(function (o) { if (o !== v) o.pause(); }); });
      new IntersectionObserver(function (es) {
        var on = es[0].isIntersecting;
        if (v === hv) { heroOn = on; if (!on && wa && busy) { wa.pause(); busy = false; welcomeDone = true; hideCap(); } }
        if (!on) { v.pause(); hush(v); sync(v); return; }
        if (v === hv && playWelcome()) return;
        start(v);
      }, { threshold: .4 }).observe(v);
      sync(v);
    });
    // The first touch, click or key: the sound comes on (the welcome voice first on the first page); the click itself is left alone.
    function unlock(e) {
      if (done || window.__entryOpen || (e.target.closest && e.target.closest('.vctl'))) return;
      if (hv && heroOn && WELCOME && !welcomeDone) { done = true; playWelcome(); return; }
      var v = vids.filter(function (x) { return !x.paused && x.muted; })[0];
      if (v && !userMuted) { done = true; v.muted = false; v.volume = 1; v.currentTime = 0; var p = v.play(); if (p) p.catch(function () { v.muted = true; v.play(); done = false; }); sync(v); }
    }
    var done = false;
    ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'].forEach(function (t) { document.addEventListener(t, unlock, { capture: true, passive: true }); });
    root.addEventListener('heroslide', function (e) {
      if (!hv) return;
      if (e.detail !== 0) { hv.pause(); hush(hv); if (wa && busy) { wa.pause(); busy = false; welcomeDone = true; hideCap(); } }
      else if (heroOn) { if (!playWelcome()) start(hv); }
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { vids.forEach(function (v) { v.pause(); }); if (wa && busy) { wa.pause(); busy = false; hideCap(); } } });
  })();

  // Web only: the hero screens lean a little toward the pointer (not with reduced motion).
  if (!still && matchMedia('(hover:hover) and (min-width:980px)').matches) {
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); stage.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3)); stage.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3)); });
    hero.addEventListener('pointerleave', function () { stage.style.setProperty('--mx', 0); stage.style.setProperty('--my', 0); });
  }

  // Download button. Store links live in this one line; empty until the app is published (then the button opens the store for the visitor's system).
  var STORE = { ios: '', android: '', other: '' };
  (function () {
    var m = $('.dl-msg');
    $$('[data-dl]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ua = navigator.userAgent, os = b.dataset.dl || (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(ua) ? 'android' : 'other');
        var url = STORE[os] || STORE.other;
        if (url) window.open(url, '_blank', 'noopener'); else m.hidden = false;
      });
    });
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
    var pv = $('.pg-prev', nav), nx = $('.pg-next', nav), num = $('.pg-n', nav);
    pv.setAttribute('aria-label', $('.arrow.prev').getAttribute('aria-label'));
    nx.setAttribute('aria-label', $('.arrow.next').getAttribute('aria-label'));
    // Pictures load for the page on screen and the next three; the first screen stays light.
    function warm(i) { for (var k = i - 1; k <= i + 3; k++) { if (panels[k]) $$('img[loading=lazy]', panels[k]).forEach(function (im) { if (!im.closest('[hidden]')) im.loading = 'eager'; }); } }
    function paint() {
      warm(cur);
      num.textContent = (cur + 1) + ' / ' + panels.length;
      root.dataset.pg = cur;
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
      if (window.__entryOpen) { shownAt = Date.now(); return; }
      if (!playing || document.hidden || cur === panels.length - 1 || Date.now() - userAt < 20000) return;
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
    pv.addEventListener('click', function () { to(cur - 1); });
    nx.addEventListener('click', function () { to(cur + 1); });
    var pio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cur = panels.indexOf(e.target); paint(); } });
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


  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    seen = es[0].isIntersecting;
    if (seen) wake();
  }).observe(stage);

  // Clips play only while on screen (also with reduced motion: that setting only removes big animation and depth).
  {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); } else e.target.pause();
      });
    }, { threshold: .3 });
    $$('video').forEach(function (v) { if (!v.hasAttribute('data-lesson')) io.observe(v); });

    // Entrances exist only after this script ran, so a script failure never hides content.
    if (!still) {
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
  }
})();
