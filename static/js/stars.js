(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var world = document.documentElement.dataset.world || "notebook";
  var STAR_COLORS = ["#c9d4de", "#9fb2c4", "#7592ab", "#b7c6d6", "#4f6a85"];
  var CLOUDS = ["☁️", "🌥️", "⛅"];
  var DISCO_GLYPHS = ["🪩", "record"]; // "record" spawns the hand-drawn vinyl instead of an emoji

  /* ---------------- Cursor trail ---------------- */
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover) {
    var lastSpawn = 0;
    var MIN_INTERVAL = 45; // ms between spawns, keeps DOM churn light

    document.addEventListener("mousemove", function (e) {
      var now = performance.now();
      if (now - lastSpawn < MIN_INTERVAL) return;
      lastSpawn = now;

      var el = document.createElement("div");
      if (world === "recipes") {
        el.className = "cursor-cloud";
        el.textContent = CLOUDS[Math.floor(Math.random() * CLOUDS.length)];
      } else if (world === "bubbles") {
        el.className = "cursor-bubble";
        var bsize = 8 + Math.random() * 12;
        el.style.width = bsize + "px";
        el.style.height = bsize + "px";
      } else if (world === "disco") {
        var pick = DISCO_GLYPHS[Math.floor(Math.random() * DISCO_GLYPHS.length)];
        if (pick === "record") {
          el.className = "cursor-record";
        } else {
          el.className = "cursor-discoball";
          el.textContent = pick;
        }
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

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------------- Background starfield (notebook world) ---------------- */
  function initStarfield() {
    var canvas = document.getElementById("bg-stars");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var stars = [];

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
        var big = Math.random() < 0.12;
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
  }

  /* ---------------- Background bubbles (bubbles world) ----
     Soft translucent orbs drifting upward and wrapping, plus a few twinkles. */
  function initBubblesBg() {
    var canvas = document.getElementById("bg-bubbles");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var orbs = [], twinkles = [];

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      seed();
    }

    function seed() {
      var area = window.innerWidth * window.innerHeight;
      var count = Math.min(26, Math.max(12, Math.round(area / 45000)));
      orbs = [];
      for (var i = 0; i < count; i++) {
        orbs.push(makeOrb(Math.random() * canvas.height));
      }
      var tCount = Math.min(60, Math.max(24, Math.round(area / 16000)));
      twinkles = [];
      for (var j = 0; j < tCount; j++) {
        twinkles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: (0.6 + Math.random() * 1) * dpr,
          phase: Math.random() * Math.PI * 2,
          speed: 0.001 + Math.random() * 0.0015
        });
      }
    }

    function makeOrb(y) {
      var r = (10 + Math.random() * 26) * dpr;
      return {
        x: Math.random() * canvas.width,
        y: y === undefined ? canvas.height + r : y,
        r: r,
        drift: (Math.random() - 0.5) * 0.15,
        speed: (0.12 + Math.random() * 0.22) * dpr,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.0008 + Math.random() * 0.0009,
        alpha: 0.1 + Math.random() * 0.14
      };
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var j = 0; j < twinkles.length; j++) {
        var tw = twinkles[j];
        var a = 0.25 + 0.35 * (Math.sin(t * tw.speed + tw.phase) * 0.5 + 0.5);
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
        ctx.arc(tw.x, tw.y, tw.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (var i = 0; i < orbs.length; i++) {
        var o = orbs[i];
        o.y -= o.speed;
        o.x += Math.sin(t * o.wobbleSpeed + o.wobblePhase) * o.drift;
        if (o.y + o.r < 0) {
          orbs[i] = makeOrb(canvas.height + o.r);
          continue;
        }
        var grad = ctx.createRadialGradient(
          o.x - o.r * 0.3, o.y - o.r * 0.3, o.r * 0.1,
          o.x, o.y, o.r
        );
        grad.addColorStop(0, "rgba(255,255,255," + (o.alpha + 0.18).toFixed(3) + ")");
        grad.addColorStop(0.6, "rgba(230,210,250," + o.alpha.toFixed(3) + ")");
        grad.addColorStop(1, "rgba(200,225,255," + (o.alpha * 0.3).toFixed(3) + ")");
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255," + (o.alpha + 0.15).toFixed(3) + ")";
        ctx.lineWidth = 1 * dpr;
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();
    requestAnimationFrame(draw);
  }

  /* ---------------- Background sparkle field (disco world) ----
     Colorful twinkling points, always on (this world ignores light/dark). */
  function initDiscoBg() {
    var canvas = document.getElementById("bg-disco");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var DISCO_COLORS = ["255,105,180", "186,140,255", "120,180,255", "255,210,120"];
    var points = [];

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      seed();
    }

    function seed() {
      var area = window.innerWidth * window.innerHeight;
      var count = Math.min(260, Math.max(90, Math.round(area / 5500)));
      points = [];
      for (var i = 0; i < count; i++) {
        var big = Math.random() < 0.16;
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: (big ? 1.4 + Math.random() * 1.8 : 0.6 + Math.random() * 1) * dpr,
          color: DISCO_COLORS[Math.floor(Math.random() * DISCO_COLORS.length)],
          glow: big,
          base: big ? 0.7 + Math.random() * 0.3 : 0.35 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0012 + Math.random() * 0.0022
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var twinkle = Math.sin(t * p.speed + p.phase) * 0.5 + 0.5;
        var alpha = p.base * (0.4 + 0.6 * twinkle);
        ctx.beginPath();
        if (p.glow) {
          ctx.shadowBlur = 7 * dpr;
          ctx.shadowColor = "rgba(" + p.color + ", " + (alpha * 0.9).toFixed(3) + ")";
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = "rgba(" + p.color + ", " + alpha.toFixed(3) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize, { passive: true });
    resize();
    requestAnimationFrame(draw);
  }

  if (world === "notebook") initStarfield();
  else if (world === "bubbles") initBubblesBg();
  else if (world === "disco") initDiscoBg();
})();
