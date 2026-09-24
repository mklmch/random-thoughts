(function () {
  "use strict";

  /* ---------------- Ingredient checkboxes (persisted) ---------------- */
  var list = document.getElementById("ingredient-list");
  if (list) {
    var recipeId = list.dataset.recipeId || location.pathname;
    var storeKey = "recipe-checked:" + recipeId;
    var checked = [];
    try {
      checked = JSON.parse(localStorage.getItem(storeKey) || "[]");
    } catch (e) {
      checked = [];
    }

    var items = list.querySelectorAll("li");
    items.forEach(function (li, i) {
      var box = li.querySelector('input[type="checkbox"]');
      if (!box) return;
      if (checked.indexOf(i) !== -1) {
        box.checked = true;
        li.classList.add("is-checked");
      }
      box.addEventListener("change", function () {
        li.classList.toggle("is-checked", box.checked);
        var idx = checked.indexOf(i);
        if (box.checked && idx === -1) checked.push(i);
        if (!box.checked && idx !== -1) checked.splice(idx, 1);
        try {
          localStorage.setItem(storeKey, JSON.stringify(checked));
        } catch (e) {
          /* ignore — private browsing etc. */
        }
      });
    });
  }

  /* ---------------- Servings scaling ---------------- */
  var control = document.querySelector(".servings-control");
  if (control && list) {
    var base = parseFloat(control.dataset.baseServings) || 1;
    var current = base;
    var countEl = document.getElementById("servings-count");

    function formatAmount(n) {
      if (!isFinite(n) || n <= 0) return "";
      var whole = Math.floor(n);
      var frac = n - whole;
      var fracStr = "";
      var fractions = [
        [0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"],
        [0.375, "⅜"], [0.5, "½"], [0.625, "⅝"],
        [0.667, "⅔"], [0.75, "¾"], [0.875, "⅞"]
      ];
      var best = null;
      for (var i = 0; i < fractions.length; i++) {
        if (Math.abs(frac - fractions[i][0]) < 0.03) { best = fractions[i][1]; break; }
      }
      if (frac < 0.03) {
        fracStr = "";
      } else if (best) {
        fracStr = best;
      } else {
        return (Math.round(n * 100) / 100).toString();
      }
      if (whole === 0 && fracStr) return fracStr;
      return whole + (fracStr ? " " + fracStr : "");
    }

    function rescale() {
      var ratio = current / base;
      list.querySelectorAll("li[data-base-amount]").forEach(function (li) {
        var baseAmount = parseFloat(li.dataset.baseAmount);
        var unit = li.dataset.unit || "";
        var amountEl = li.querySelector(".ingredient-amount");
        if (!amountEl || !baseAmount) return;
        var scaled = baseAmount * ratio;
        amountEl.textContent = formatAmount(scaled) + (unit ? " " + unit : "");
      });
      if (countEl) countEl.textContent = (Math.round(current * 100) / 100).toString();
    }

    control.querySelectorAll(".servings-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var step = parseFloat(btn.dataset.step) || 0;
        current = Math.max(1, current + step);
        rescale();
      });
    });
  }

  /* ---------------- Recipe list: search + tag filter ---------------- */
  var grid = document.getElementById("recipe-grid");
  if (grid) {
    var search = document.getElementById("recipe-search");
    var chipRow = document.getElementById("recipe-tag-chips");
    var empty = document.getElementById("recipe-empty");
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".recipe-card"));
    var activeTags = [];

    function apply() {
      var q = (search && search.value || "").trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var matchesSearch = !q || (card.dataset.search || "").indexOf(q) !== -1;
        var cardTags = (card.dataset.tags || "").split(",");
        var matchesTags = activeTags.every(function (t) { return cardTags.indexOf(t) !== -1; });
        var show = matchesSearch && matchesTags;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (empty) empty.style.display = visible === 0 ? "" : "none";
    }

    if (search) search.addEventListener("input", apply);
    if (chipRow) {
      chipRow.querySelectorAll(".recipe-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          var tag = chip.dataset.tag;
          var idx = activeTags.indexOf(tag);
          if (idx === -1) {
            activeTags.push(tag);
            chip.classList.add("is-active");
          } else {
            activeTags.splice(idx, 1);
            chip.classList.remove("is-active");
          }
          apply();
        });
      });
    }
  }
})();
