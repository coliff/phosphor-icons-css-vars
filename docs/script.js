(function () {
  if (typeof Prism !== "undefined") Prism.highlightAll();
})();

(function () {
  const grid = document.getElementById("grid");
  const searchInput = document.getElementById("search");
  const styleSelect = document.getElementById("style");
  const countEl = document.querySelector(".count");

  let allNames = [];
  let filtered = [];

  function matchesStyle(name, style) {
    if (style === "regular") {
      return !/-(?:thin|light|bold|fill|duotone)$/.test(name);
    }
    return name.endsWith("-" + style);
  }

  function applyStyleFilter(names, style) {
    return names.filter((n) => matchesStyle(n, style));
  }

  function render() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < filtered.length; i++) {
      const name = filtered[i];
      const varName = "--ph-icon-" + name;
      const div = document.createElement("div");
      div.className = "grid-item";
      div.title = "Click to copy name";
      const icon = document.createElement("span");
      icon.className = "icon";
      icon.style.setProperty("--icon-var", "var(" + varName + ")");
      const label = document.createElement("span");
      label.textContent = name;
      div.appendChild(icon);
      div.appendChild(label);
      fragment.appendChild(div);
    }
    grid.textContent = "";
    grid.appendChild(fragment);
  }

  function updateCount() {
    const style = styleSelect.value;
    const byStyle = applyStyleFilter(allNames, style);
    const q = searchInput.value.trim();
    if (q.length < 3) {
      countEl.textContent = byStyle.length + " " + style + " icons. Type 3 or more characters to search.";
    } else {
      countEl.textContent = filtered.length + " icons.";
    }
  }

  function applySearch() {
    const style = styleSelect.value;
    const byStyle = applyStyleFilter(allNames, style);
    const q = searchInput.value.trim().toLowerCase();
    filtered = q.length >= 3 ? byStyle.filter((n) => n.toLowerCase().includes(q)) : [];
    updateCount();
    render();
  }

  function syncUrlFromSearch() {
    const q = searchInput.value.trim();
    const url = new URL(location.href);
    if (q.length >= 3) {
      url.searchParams.set("q", q);
    } else {
      url.searchParams.delete("q");
    }
    history.replaceState(null, "", url);
  }

  searchInput.addEventListener("input", () => {
    applySearch();
    syncUrlFromSearch();
  });

  styleSelect.addEventListener("change", () => {
    applySearch();
  });

  (function () {
    const styleSelectEl = document.getElementById("style-select");
    const styleTrigger = document.getElementById("style-trigger");
    const styleList = document.getElementById("style-list");
    const nativeSelect = document.getElementById("style");
    const optionEls = styleList.querySelectorAll(".style-select__option");

    function getLabel(value) {
      return nativeSelect.querySelector('option[value="' + value + '"]').textContent;
    }

    function syncTrigger() {
      const value = nativeSelect.value;
      const label = styleTrigger.querySelector(".style-select__label");
      const icon = styleTrigger.querySelector(".style-select__icon");
      label.textContent = getLabel(value);
      icon.className = "style-select__icon style-select__icon--" + value;
      styleList.querySelectorAll(".style-select__option").forEach((opt) => {
        opt.setAttribute("aria-selected", opt.getAttribute("data-value") === value);
      });
    }

    function open() {
      styleList.hidden = false;
      requestAnimationFrame(() => {
        styleSelectEl.setAttribute("data-open", "true");
        styleTrigger.setAttribute("aria-expanded", "true");
        const current = styleList.querySelector("[aria-selected=\"true\"]");
        if (current) current.focus();
      });
    }

    function close() {
      styleSelectEl.setAttribute("data-open", "false");
      styleTrigger.setAttribute("aria-expanded", "false");
      styleList.addEventListener("transitionend", () => {
        styleList.hidden = true;
        styleTrigger.focus();
      }, { once: true });
    }

    function choose(value) {
      nativeSelect.value = value;
      syncTrigger();
      nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      close();
    }

    styleTrigger.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = styleSelectEl.getAttribute("data-open") === "true";
      if (isOpen) close();
      else open();
    });

    optionEls.forEach((opt) => {
      opt.addEventListener("click", () => choose(opt.getAttribute("data-value")));
      opt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choose(opt.getAttribute("data-value"));
        }
        if (e.key === "Escape") close();
        if (e.key === "ArrowDown" && opt.nextElementSibling) {
          e.preventDefault();
          opt.nextElementSibling.focus();
        }
        if (e.key === "ArrowUp" && opt.previousElementSibling) {
          e.preventDefault();
          opt.previousElementSibling.focus();
        }
      });
    });

    styleTrigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (styleSelectEl.getAttribute("data-open") !== "true") open();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (styleSelectEl.getAttribute("data-open") !== "true") open();
      }
    });

    document.addEventListener("mousedown", (e) => {
      if (styleSelectEl.getAttribute("data-open") === "true" && !styleSelectEl.contains(e.target)) {
        close();
      }
    });

    syncTrigger();
  })();

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
    }
  });

  grid.addEventListener("click", (e) => {
    const item = e.target.closest(".grid-item");
    if (!item) return;
    const label = item.querySelector("span:last-child");
    const name = label.textContent;
    if (name === "Copied!") return;
    navigator.clipboard.writeText(name).then(
      () => {
        const original = name;
        label.textContent = "Copied!";
        setTimeout(() => {
          label.textContent = original;
        }, 1500);
      },
      () => { }
    );
  });

  const docDir = location.pathname.replace(/\/[^/]*$/, "/") || "/";
  fetch(docDir + "icon-list.json")
    .then((r) => r.json())
    .then((names) => {
      allNames = names;
      const urlParam = new URLSearchParams(location.search).get("q");
      if (urlParam) {
        searchInput.value = urlParam;
      }
      applySearch();
      syncUrlFromSearch();
    })
    .catch((e) => {
      countEl.textContent = "Could not load icon list. Run npm run build first.";
      console.error(e);
    });
})();

(function () {
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;
  function setLabel() {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.textContent = isDark ? "☀️" : "🌙";
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
  setLabel();
  var prismDark = document.getElementById("prism-dark");
  if (prismDark) prismDark.media = document.documentElement.getAttribute("data-theme") === "dark" ? "all" : "none";
  toggle.addEventListener("click", function () {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    var next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    var prismDark = document.getElementById("prism-dark");
    if (prismDark) prismDark.media = next === "dark" ? "all" : "none";
    setLabel();
  });
})();
