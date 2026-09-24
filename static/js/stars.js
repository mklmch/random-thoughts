(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var world = document.documentElement.dataset.world || "notebook";
  var STAR_COLORS = ["#c9d4de", "#9fb2c4", "#7592ab", "#b7c6d6", "#4f6a85"];
  var FRUITS = ["🍓", "🍊", "🍋", "🍇", "🫐", "🍒", "🍉", "🥝"]; // strawberry, orange, lemon, grapes, blueberries, cherries, watermelon, kiwi

  /* ---------------- Cursor trail (stars, or fruit in the recipes world) ---------------- */
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover) {
    var lastSpawn = 0;
    var MIN_INTERVAL = 45; // ms between sparkles, keeps DOM churn light

    document.addEventListener("mousemove", function (e) {
      var now = performance.now();
      if (now - lastSpawn < MIN_INTERVAL) return;
      lastSpawn = now;

      var el = document.createElement("div");
      if (world === "recipes") {
        el.className = "cursor-fruit";
        el.textContent = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      } else {
        el.className = "cursor-star";
        var size = 6 + Math.random() * 8;
        el.style.width = size + "px";
        el.style.height = size + "px";
        el.style.backgroundColor = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
      }
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
      document.body.appendChild(el);

      el.addEventListener("animationend", function () {
        el.remove();
      });
    }, { passive: true });
  }

  /* ---------------- Background starfield (notebook world only) ---------------- */
  if (world !== "notebook") return;
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
    var count = Math.min(420, Math.max(140, Math.round(area / 3200)));
    stars = [];
    for (var i = 0; i < count; i++) {
      var big = Math.random() < 0.12; // a handful of standout bright stars
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (big ? 1.6 + Math.random() * 1.6 : 0.7 + Math.random() * 1.1) * dpr,
        base: big ? 0.75 + Math.random() * 0.25 : 0.45 + Math.random() * 0.4,
        glow: big,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0006 + Math.random() * 0.0011
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = Math.sin(t * s.speed + s.phase) * 0.5 + 0.5;
      var alpha = s.base * (0.55 + 0.45 * twinkle);
      ctx.beginPath();
      if (s.glow) {
        ctx.shadowBlur = 6 * dpr;
        ctx.shadowColor = "rgba(215, 226, 235, " + (alpha * 0.9).toFixed(3) + ")";
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = "rgba(215, 226, 235, " + alpha.toFixed(3) + ")";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
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
