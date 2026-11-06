// E-PtAi site, Spor Hocası and Spor Salonu pages: the page clip plays only while it is on screen, and not at all with reduced motion (the poster stays).
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { var p = e.target.play(); if (p) p.catch(function () {}); } else e.target.pause();
    });
  }, { threshold: 0.3 });
  Array.prototype.forEach.call(document.querySelectorAll('video'), function (v) { io.observe(v); });
})();
