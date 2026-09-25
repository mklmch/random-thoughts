(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var world = document.documentElement.dataset.world || "notebook";
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var STAR_COLORS = ["#c9d4de", "#9fb2c4", "#7592ab", "#b7c6d6", "#4f6a85"];
  var SPARK_GLYPHS = ["✦", "✧", "✱", "٭"];
  var BEE_GLYPH = "🐝"; // 🐝
  var BEE_INTERVAL = 320; // ms between bee sightings — the sparkles carry the trail
  var DISCO_GLYPHS = ["🪩", "record"]; // "record" spawns the hand-drawn vinyl instead of an emoji

  // The recipes background is still flowers even with reduced motion — it just doesn't twinkle.
  if (world === "recipes") initNightBloomBg(reduceMotion);
  if (reduceMotion) return;

  /* ---------------- Cursor trail ---------------- */
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (canHover) {
    var lastSpawn = 0;
    var lastBee = 0;
    var MIN_INTERVAL = 45; // ms between spawns, keeps DOM churn light

    document.addEventListener("mousemove", function (e) {
      var now = performance.now();
      if (now - lastSpawn < MIN_INTERVAL) return;
      lastSpawn = now;

      var el = document.createElement("div");
      if (world === "recipes") {
        el.className = "cursor-spark";
        el.textContent = SPARK_GLYPHS[Math.floor(Math.random() * SPARK_GLYPHS.length)];
        el.style.fontSize = (10 + Math.random() * 10) + "px";
        if (now - lastBee >= BEE_INTERVAL) {
          lastBee = now;
          var bee = document.createElement("div");
          bee.className = "cursor-bee";
          bee.textContent = BEE_GLYPH;
          bee.style.left = e.clientX + "px";
          bee.style.top = e.clientY + "px";
          document.body.appendChild(bee);
          bee.addEventListener("animationend", function () { bee.remove(); });
        }
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

  /* ---------------- Background "night bloom" (recipes world) ----
     Detailed white flowers (soft round blossoms + little star-lilies) scattered
     over the dark mauve-green page, with fine twinkling dust between them.
     Most flowers are drawn once to an offscreen canvas; only the dust and a
     handful of glowing "hero" blooms are redrawn each frame to twinkle. */
  function initNightBloomBg(still) {
    var canvas = document.getElementById("bg-nightbloom");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var base = document.createElement("canvas");
    var bctx = base.getContext("2d");
    var dust = [], heroes = [];
    var lastW = 0, lastH = 0;

    // deterministic PRNG, so the "garden" is laid out the same way on every page
    function makeRng(seed) {
      var s = seed >>> 0;
      return function () {
        s = (s + 0x6D2B79F5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function drawFlower(c, x, y, r, rot, petals, pointed, alpha, glow) {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.globalAlpha = alpha;
      if (glow > 0) {
        c.shadowBlur = r * 2.4 * glow;
        c.shadowColor = "rgba(247,244,238,0.6)";
      }
      for (var i = 0; i < petals; i++) {
        c.save();
        c.rotate((i / petals) * Math.PI * 2);
        var len = pointed ? r * 0.95 : r;
        c.beginPath();
        if (pointed) {
          // narrow lily/star petal, anchored at the center so petals overlap there
          c.moveTo(0, 0);
          c.quadraticCurveTo(r * 0.4, len * 0.4, 0, len);
          c.quadraticCurveTo(-r * 0.4, len * 0.4, 0, 0);
          c.closePath();
        } else {
          c.ellipse(0, r * 0.5, r * 0.42, r * 0.5, 0, 0, Math.PI * 2);
        }
        var g = c.createLinearGradient(0, 0, 0, len);
        g.addColorStop(0, "rgba(222,216,204,0.6)");
        g.addColorStop(1, "rgba(255,253,248,0.98)");
        c.fillStyle = g;
        c.fill();
        c.strokeStyle = "rgba(180,170,155,0.3)";
        c.lineWidth = Math.max(0.4, r * 0.025);
        c.stroke();
        c.restore();
      }
      c.shadowBlur = 0;
      var cg = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.32);
      cg.addColorStop(0, "rgba(255,247,222,0.95)");
      cg.addColorStop(1, "rgba(214,175,90,0.5)");
      c.fillStyle = cg;
      c.beginPath();
      c.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function drawGlint(c, x, y, r, alpha) {
      var arm = r * 3.2;
      c.save();
      c.translate(x, y);
      c.globalAlpha = alpha;
      c.fillStyle = "rgb(247,244,238)";
      c.beginPath();
      c.moveTo(0, -arm);
      c.quadraticCurveTo(r * 0.4, -r * 0.4, arm, 0);
      c.quadraticCurveTo(r * 0.4, r * 0.4, 0, arm);
      c.quadraticCurveTo(-r * 0.4, r * 0.4, -arm, 0);
      c.quadraticCurveTo(-r * 0.4, -r * 0.4, 0, -arm);
      c.fill();
      c.restore();
    }

    function build() {
      var w = Math.round(window.innerWidth * dpr);
      var h = Math.round(window.innerHeight * dpr);
      canvas.width = base.width = w;
      canvas.height = base.height = h;
      var area = window.innerWidth * window.innerHeight; // in CSS px
      var rng = makeRng(8181);
      bctx.clearRect(0, 0, w, h);

      // faint sprigs tucked beneath the blooms
      var sprigs = Math.round(area / 11000);
      bctx.strokeStyle = "rgba(190,196,178,0.14)";
      bctx.lineWidth = 1 * dpr;
      bctx.lineCap = "round";
      for (var s = 0; s < sprigs; s++) {
        var sx = rng() * w, sy = rng() * h;
        var sl = (8 + rng() * 14) * dpr;
        var sa = -Math.PI / 2 + (rng() - 0.5) * 0.5;
        bctx.beginPath();
        bctx.moveTo(sx, sy);
        bctx.lineTo(sx + Math.cos(sa) * sl, sy + Math.sin(sa) * sl);
        bctx.stroke();
      }

      // the blooms: mixed petal counts and shapes; ~1 in 6 is a glowing "hero" that twinkles
      heroes = [];
      var count = Math.min(170, Math.max(20, Math.round(area / 18000)));
      for (var i = 0; i < count; i++) {
        var f = {
          x: rng() * w,
          y: rng() * h,
          hero: rng() < 0.16,
          rot: rng() * Math.PI * 2,
          petals: 4 + Math.floor(rng() * 5),
          pointed: rng() < 0.5
        };
        f.r = (f.hero ? 9 + rng() * 6 : 4 + rng() * 5) * dpr;
        f.alpha = f.hero ? 0.95 : 0.6 + rng() * 0.35;
        if (f.hero) {
          f.phase = Math.random() * Math.PI * 2;
          f.speed = 0.0005 + Math.random() * 0.0007;
          heroes.push(f);
        } else {
          drawFlower(bctx, f.x, f.y, f.r, f.rot, f.petals, f.pointed, f.alpha, 0);
        }
      }

      // fine twinkling dust between the flowers
      dust = [];
      var dCount = Math.min(360, Math.round(area / 9000));
      for (var d = 0; d < dCount; d++) {
        var big = rng() < 0.1;
        dust.push({
          x: rng() * w,
          y: rng() * h,
          r: (big ? 1.6 + rng() * 1.4 : 0.6 + rng() * 0.9) * dpr,
          big: big,
          glint: big && rng() < 0.4,
          base: 0.45 + rng() * 0.4,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0008 + Math.random() * 0.0016
        });
      }
    }

    function frame(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);

      for (var i = 0; i < dust.length; i++) {
        var p = dust[i];
        var tw = Math.sin(t * p.speed + p.phase) * 0.5 + 0.5;
        var a = p.base * (0.35 + 0.65 * tw);
        if (p.big) {
          ctx.shadowBlur = 5 * dpr;
          ctx.shadowColor = "rgba(247,244,238," + (a * 0.8).toFixed(3) + ")";
        }
        if (p.glint) {
          drawGlint(ctx, p.x, p.y, p.r, a);
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = "rgb(247,244,238)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.shadowBlur = 0;
      }

      for (var j = 0; j < heroes.length; j++) {
        var f = heroes[j];
        var hw = Math.sin(t * f.speed + f.phase) * 0.5 + 0.5;
        drawFlower(ctx, f.x, f.y, f.r, f.rot, f.petals, f.pointed, 0.8 + 0.2 * hw, 0.4 + 0.6 * hw);
      }

      if (!still) requestAnimationFrame(frame);
    }

    function onResize(force) {
      var w = window.innerWidth, h = window.innerHeight;
      // mobile browsers resize on scroll as the URL bar shows/hides — ignore small height changes
      if (!force && Math.abs(w - lastW) < 1 && Math.abs(h - lastH) < 150) return;
      lastW = w;
      lastH = h;
      build();
      if (still) frame(performance.now());
    }

    window.addEventListener("resize", function () { onResize(false); }, { passive: true });
    onResize(true);
    if (!still) requestAnimationFrame(frame);
  }

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
