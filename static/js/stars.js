(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var STAR_COLORS = ["#c9d4de", "#9fb2c4", "#7592ab", "#b7c6d6", "#4f6a85"];

  /* ---------------- Cursor star trail ---------------- */
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover) {
    var lastSpawn = 0;
    var MIN_INTERVAL = 45; // ms between sparkles, keeps DOM churn light

    document.addEventListener("mousemove", function (e) {
      var now = performance.now();
      if (now - lastSpawn < MIN_INTERVAL) return;
      lastSpawn = now;

      var star = document.createElement("div");
      star.className = "cursor-star";
      star.style.left = e.clientX + "px";
      star.style.top = e.clientY + "px";
      var size = 6 + Math.random() * 8;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.backgroundColor = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      document.body.appendChild(star);

      star.addEventListener("animationend", function () {
        star.remove();
      });
    }, { passive: true });
  }

  /* ---------------- Background starfield ---------------- */
  var canvas = document.getElementById("bg-stars");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var stars = [];
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    seedStars();
  }

  function seedStars() {
    var area = window.innerWidth * window.innerHeight;
    var count = Math.min(180, Math.max(50, Math.round(area / 9000)));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (0.5 + Math.random() * 1.4) * dpr,
        base: 0.15 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0006 + Math.random() * 0.0009
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = Math.sin(t * s.speed + s.phase) * 0.5 + 0.5;
      var alpha = s.base * (0.35 + 0.65 * twinkle);
      ctx.beginPath();
      ctx.fillStyle = "rgba(201, 212, 222, " + alpha.toFixed(3) + ")";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  function syncVisibility() {
    canvas.classList.toggle("is-visible", isDark());
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  syncVisibility();
  requestAnimationFrame(draw);

  var observer = new MutationObserver(syncVisibility);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
