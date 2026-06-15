/* ============================================================
   PIT-PATCH — Spring 2015 Collection microsite
   Single-page mobile experience. Vanilla JS, no libraries.
   ============================================================ */

/* The collection. Field reference:
     sku     — SKU code from the product sheet
     name    — display name shown beneath the swatch
     base    — dominant swatch colour (descriptive reference only)
     accent  — secondary swatch colour (descriptive reference only)
     disc    — the circular swatch crop revealed through the porthole
     finale  — marks the card that drops the product mask and turns
               into the "call your account executive" sign-off

   Array order is the swipe order (Hubert's running order). The
   Confident Exit stays last — it's the finale sign-off, not a swatch. */
const SWATCHES = [
  { sku: "PP-SW-006", name: "Anchor Management",   base: "#192C4F", accent: "#030B22", disc: "assets/discs/pp-sw-006-anchor-management.webp" },
  { sku: "PP-SW-002", name: "Quarterly Optimism",  base: "#F7CA23", accent: "#55348B", disc: "assets/discs/pp-sw-002-quarterly-optimism.webp" },
  { sku: "PP-SW-007", name: "Emergency Stripe",    base: "#E7E1DF", accent: "#AB0205", disc: "assets/discs/pp-sw-007-emergency-stripe.webp" },
  { sku: "PP-SW-008", name: "Compliance Gray",     base: "#9B989A", accent: "#656265", disc: "assets/discs/pp-sw-008-compliance-grey.webp" },
  { sku: "PP-SW-012", name: "Expense Report Pink", base: "#F294AD", accent: "#D15072", disc: "assets/discs/pp-sw-012-expense-report-pink.webp" },
  { sku: "PP-SW-005", name: "Boardroom Dots",      base: "#E7E3DF", accent: "#1C1D1F", disc: "assets/discs/pp-sw-005-boardroom-dots.webp" },
  { sku: "PP-SW-009", name: "Crypto Exposure",     base: "#EE5B09", accent: "#AB1A00", disc: "assets/discs/pp-sw-009-crypto-exposure.webp" },
  { sku: "PP-SW-003", name: "Bull Market",         base: "#1D4934", accent: "#092E1C", disc: "assets/discs/pp-sw-003-bull-market.webp" },
  { sku: "PP-SW-011", name: "System Failure",      base: "#0E0D0E", accent: "#605C5D", disc: "assets/discs/pp-sw-011-system-failure.webp" },
  { sku: "PP-SW-010", name: "Distress Signal",     base: "#F5E8D4", accent: "#AB2724", disc: "assets/discs/pp-sw-010-distress-signal.webp" },
  { sku: "PP-SW-001", name: "Executive Pinstripe", base: "#EFECE8", accent: "#2E5AB0", disc: "assets/discs/pp-sw-001-executive-pinstripe.webp" },
  { sku: "PP-SW-013", name: "The Confident Exit",  base: "#E6E0D3", accent: "#121212", disc: "assets/discs/pp-sw-013-the-confident-exit.webp", finale: true }
];

/* ------------------------------------------------------------
   Screen manager
   ------------------------------------------------------------ */
const LOADER_DURATION = 3000; // ms — the stitch loop plays for ~3s

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.toggle("is-active", el.id === `screen-${id}`);
  });
}

/* ------------------------------------------------------------
   Loader → cover
   ------------------------------------------------------------ */
function initLoader() {
  window.setTimeout(() => showScreen("cover"), LOADER_DURATION);
}

/* ------------------------------------------------------------
   Cover → browser  (swipe to begin)
   ------------------------------------------------------------ */
function initCover() {
  const cover = document.getElementById("screen-cover");
  const TH = 30;
  let x0 = null, y0 = null, locked = false;
  cover.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; locked = false; });
  cover.addEventListener("pointermove", (e) => {
    if (x0 === null || locked) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) > TH && Math.abs(dx) >= Math.abs(dy)) {
      locked = true;
      revealBrowser();
    }
  });
  const end = () => { x0 = y0 = null; };
  cover.addEventListener("pointerup", end);
  cover.addEventListener("pointercancel", end);
  cover.addEventListener("pointerleave", end);
}

/* Cover → browser: the cover slides away like lifting the top card off
   the swatch stack, revealing the collection beneath it. */
function revealBrowser() {
  const cover = document.getElementById("screen-cover");
  const br = document.getElementById("screen-browser");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    showScreen("browser");
    return;
  }

  // browser sits beneath at full opacity (no fade), so the cover wipes
  // cleanly across to reveal it
  br.classList.add("is-active");
  br.style.transition = "none";
  br.style.opacity = "1";

  // slide the cover off (CSS handles the easing + lifted-edge shadow)
  cover.classList.add("is-sliding");

  window.setTimeout(() => {
    // hide instantly so it can't snap back to centre while fading
    cover.style.transition = "none";
    cover.classList.remove("is-active", "is-sliding");
    br.style.transition = "";
    br.style.opacity = "";
    requestAnimationFrame(() => { cover.style.transition = ""; });
  }, 560);
}

/* ------------------------------------------------------------
   Touch-cursor — a finger-like circle on pointer devices
   ------------------------------------------------------------ */
function initTouchCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const cur = document.getElementById("touch-cursor");
  if (!cur) return;
  document.body.classList.add("cursor-sim");
  window.addEventListener("mousemove", (e) => {
    cur.classList.add("is-visible");
    cur.style.setProperty("--x", e.clientX - 20 + "px");
    cur.style.setProperty("--y", e.clientY - 20 + "px");
  });
  window.addEventListener("mousedown", () => cur.classList.add("is-pressing"));
  window.addEventListener("mouseup", () => cur.classList.remove("is-pressing"));
  document.addEventListener("mouseleave", () => cur.classList.remove("is-visible"));
}

/* ------------------------------------------------------------
   Browser — the swipe/fade mechanic
   ------------------------------------------------------------ */
const browser = {
  i: 0,
  discs: [],
  el: {},

  build() {
    this.el = {
      screen:  document.getElementById("screen-browser"),
      porthole: document.getElementById("porthole"),
      area:    document.getElementById("info-area"),
      info:    document.getElementById("info"),
      name:    document.getElementById("sw-name"),
      add:     document.getElementById("add-btn"),
      prev:    document.getElementById("nav-prev"),
      next:    document.getElementById("nav-next"),
      cur:     document.getElementById("counter-cur"),
      total:   document.getElementById("counter-total"),
      hint:    document.getElementById("swipe-hint"),
    };

    // disc images stacked behind the frame
    SWATCHES.forEach((s, idx) => {
      const img = document.createElement("img");
      img.className = "disc";
      img.src = s.disc;
      img.alt = s.name;
      img.decoding = "async";
      img.draggable = false;            // no native image-drag ghost
      if (idx === 0) img.classList.add("is-on");
      this.el.porthole.appendChild(img);
      this.discs.push(img);
    });

    this.el.total.textContent = String(SWATCHES.length);

    this.el.prev.addEventListener("click", () => this.go(this.i - 1));
    this.el.next.addEventListener("click", () => this.go(this.i + 1));
    this.el.add.addEventListener("click", () => this.addCurrent());
    this.bindSwipe();
    this.render(0, true);
  },

  go(n) {
    n = Math.max(0, Math.min(SWATCHES.length - 1, n));
    if (n === this.i) return;
    this.render(n, false);
  },

  render(n, immediate) {
    this.i = n;
    const s = SWATCHES[n];

    // cross-fade the disc
    this.discs.forEach((d, idx) => d.classList.toggle("is-on", idx === n));

    // fade the info/finale block, swap content at the midpoint
    const swap = () => {
      this.el.name.textContent = s.name;
      this.el.cur.textContent = String(n + 1).padStart(2, "0");
      this.el.add.textContent = "Add to cart";
      this.el.add.classList.remove("is-added");
      this.el.area.classList.toggle("is-finale", !!s.finale);
      // hide the keep-swiping hint once there's nothing left to swipe to
      this.el.hint.classList.toggle("is-hidden", n >= SWATCHES.length - 1);
    };
    if (immediate) {
      swap();
    } else {
      // only the swatch name fades; the button stays anchored
      this.el.name.style.opacity = "0";
      window.setTimeout(() => { swap(); this.el.name.style.opacity = "1"; }, 150);
    }

    this.el.prev.disabled = n === 0;
    this.el.next.disabled = n === SWATCHES.length - 1;
  },

  addCurrent() {
    cart.add(SWATCHES[this.i]);
    this.el.add.textContent = "Added to bag";
    this.el.add.classList.add("is-added");
  },

  bindSwipe() {
    const stage = this.el.screen;
    const TH = 40;
    let x0 = null, y0 = null, locked = false;

    stage.addEventListener("pointerdown", (e) => {
      x0 = e.clientX; y0 = e.clientY; locked = false;
    });
    stage.addEventListener("pointermove", (e) => {
      if (x0 === null || locked) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) > TH && Math.abs(dx) > Math.abs(dy)) {
        locked = true;
        this.go(this.i + (dx < 0 ? 1 : -1));
      }
    });
    const end = () => { x0 = y0 = null; };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("pointerleave", end);

    window.addEventListener("keydown", (e) => {
      if (instructions.isOpen) return;            // instructions overlay owns the keys when up
      if (!this.el.screen.classList.contains("is-active")) return;
      if (e.key === "ArrowRight") this.go(this.i + 1);
      if (e.key === "ArrowLeft") this.go(this.i - 1);
    });
  },
};

/* ------------------------------------------------------------
   Instructions — the how-to reel (Treatment B)
   Reuses the porthole/swipe mechanic: each step is a circular
   disc revealed through the same leather frame.
   ------------------------------------------------------------ */
const INSTRUCTIONS = [
  { title: "Act quickly",         body: "Ask for PIT-PATCH PACK immediately after noticing perspiration in the underarm area.", disc: "assets/instructions/step-1.webp" },
  { title: "Select style",        body: "Match PIT-PATCH design with shirt.",                                                    disc: "assets/instructions/step-2.webp" },
  { title: "Measure sweat",       body: "Measure contaminated area. Trim PIT-PATCH accordingly.",                                disc: "assets/instructions/step-3.webp" },
  { title: "Sew outside shirt",   body: "PIT-PATCH is made from cheap synthetic fabric, and may cause irritation to the skin.",  disc: "assets/instructions/step-4.webp" },
  { title: "Enjoy the confidence", body: "Even though your company is about to breakdown due to running an expired Windows OS, you sure won’t show it.", disc: "assets/instructions/step-5.webp" },
];

const instructions = {
  i: 0,
  isOpen: false,
  discs: [],
  el: {},

  build() {
    this.el = {
      overlay:  document.getElementById("instr"),
      porthole: document.getElementById("instr-porthole"),
      title:    document.getElementById("instr-title"),
      body:     document.getElementById("instr-body"),
      info:     document.getElementById("instr-info"),
      cta:      document.getElementById("instr-cta"),
      prev:     document.getElementById("instr-prev"),
      next:     document.getElementById("instr-next"),
      dots:     document.getElementById("instr-dots"),
      hint:     document.getElementById("instr-hint"),
      open:     document.getElementById("instr-open"),
      close:    document.getElementById("instr-close"),
    };

    // disc + dot per step
    INSTRUCTIONS.forEach((s, idx) => {
      const img = document.createElement("img");
      img.className = "disc";
      img.src = s.disc;
      img.alt = s.title;
      img.decoding = "async";
      img.draggable = false;
      if (idx === 0) img.classList.add("is-on");
      this.el.porthole.appendChild(img);
      this.discs.push(img);

      const dot = document.createElement("span");
      if (idx === 0) dot.classList.add("is-on");
      this.el.dots.appendChild(dot);
    });

    this.el.open.addEventListener("click", () => this.openOverlay());
    this.el.close.addEventListener("click", () => this.closeOverlay());
    this.el.cta.addEventListener("click", () => this.closeOverlay());
    this.el.prev.addEventListener("click", () => this.go(this.i - 1));
    this.el.next.addEventListener("click", () => this.go(this.i + 1));
    this.bindSwipe();

    window.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      if (e.key === "Escape") this.closeOverlay();
      if (e.key === "ArrowRight") this.go(this.i + 1);
      if (e.key === "ArrowLeft") this.go(this.i - 1);
    });

    this.render(0, true);
  },

  openOverlay() {
    this.isOpen = true;
    this.render(0, true);          // always start at step 1
    this.el.overlay.classList.add("is-open");
    this.el.overlay.setAttribute("aria-hidden", "false");
  },
  closeOverlay() {
    this.isOpen = false;
    this.el.overlay.classList.remove("is-open");
    this.el.overlay.setAttribute("aria-hidden", "true");
  },

  go(n) {
    n = Math.max(0, Math.min(INSTRUCTIONS.length - 1, n));
    if (n === this.i) return;
    this.render(n, false);
  },

  render(n, immediate) {
    this.i = n;
    const s = INSTRUCTIONS[n];

    this.discs.forEach((d, idx) => d.classList.toggle("is-on", idx === n));
    Array.from(this.el.dots.children).forEach((d, idx) => d.classList.toggle("is-on", idx === n));

    const swap = () => {
      this.el.title.textContent = s.title;
      this.el.body.textContent = s.body;
      this.el.info.classList.toggle("is-last", n === INSTRUCTIONS.length - 1);
      this.el.hint.classList.toggle("is-hidden", n >= INSTRUCTIONS.length - 1);
    };
    if (immediate) {
      swap();
      this.el.info.style.opacity = "1";
    } else {
      this.el.info.style.opacity = "0";
      window.setTimeout(() => { swap(); this.el.info.style.opacity = "1"; }, 150);
    }

    this.el.prev.disabled = n === 0;
    this.el.next.disabled = n === INSTRUCTIONS.length - 1;
  },

  bindSwipe() {
    const stage = this.el.overlay;
    const TH = 40;
    let x0 = null, y0 = null, locked = false;
    stage.addEventListener("pointerdown", (e) => { x0 = e.clientX; y0 = e.clientY; locked = false; });
    stage.addEventListener("pointermove", (e) => {
      if (x0 === null || locked) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > TH && Math.abs(dx) > Math.abs(dy)) {
        locked = true;
        this.go(this.i + (dx < 0 ? 1 : -1));
      } else if (dy < -TH && Math.abs(dy) > Math.abs(dx)) {
        locked = true;
        this.closeOverlay();
      }
    });
    const end = () => { x0 = y0 = null; };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    stage.addEventListener("pointerleave", end);
  },
};

/* ------------------------------------------------------------
   Cart
   ------------------------------------------------------------ */
const cart = {
  items: new Map(),   // sku -> { s, qty }
  el: {},

  build() {
    this.el = {
      drawer:  document.getElementById("cart-drawer"),
      overlay: document.getElementById("cart-overlay"),
      open:    document.getElementById("cart-btn"),
      close:   document.getElementById("cart-close"),
      list:    document.getElementById("cart-list"),
      badge:   document.getElementById("cart-count"),
      total:   document.getElementById("cart-total-count"),
      checkout: document.getElementById("cart-checkout"),
    };
    this.el.open.addEventListener("click", () => this.openDrawer());
    this.el.close.addEventListener("click", () => this.closeDrawer());
    this.el.overlay.addEventListener("click", () => this.closeDrawer());

    // delegate qty / remove
    this.el.list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const sku = btn.closest(".cart-item").dataset.sku;
      const entry = this.items.get(sku);
      if (!entry) return;
      const act = btn.dataset.act;
      if (act === "inc") this.setQty(sku, entry.qty + 1);
      else if (act === "dec") this.setQty(sku, entry.qty - 1);
      else if (act === "rm") this.setQty(sku, 0);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.el.drawer.classList.contains("is-open")) this.closeDrawer();
    });

    this.sync();
  },

  add(s) {
    const e = this.items.get(s.sku);
    if (e) e.qty += 1;
    else this.items.set(s.sku, { s, qty: 1 });
    this.sync();
  },

  setQty(sku, q) {
    if (q <= 0) this.items.delete(sku);
    else this.items.get(sku).qty = q;
    this.sync();
  },

  count() {
    let n = 0;
    this.items.forEach((e) => (n += e.qty));
    return n;
  },

  openDrawer() { this.el.drawer.classList.add("is-open"); this.el.drawer.setAttribute("aria-hidden", "false"); },
  closeDrawer() { this.el.drawer.classList.remove("is-open"); this.el.drawer.setAttribute("aria-hidden", "true"); },

  sync() {
    const n = this.count();
    this.el.badge.textContent = String(n);
    this.el.total.textContent = n === 1 ? "1 item" : `${n} items`;
    this.el.checkout.disabled = n === 0;
    this.renderList();
  },

  renderList() {
    const list = this.el.list;
    list.innerHTML = "";
    if (this.items.size === 0) {
      const empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Your bag is empty.";
      list.appendChild(empty);
      return;
    }
    this.items.forEach(({ s, qty }) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.dataset.sku = s.sku;
      row.innerHTML = `
        <div class="cart-thumb"><img src="${s.disc}" alt=""></div>
        <div class="cart-meta"><strong>${s.name}</strong></div>
        <div class="cart-qty">
          <button type="button" data-act="dec" aria-label="Decrease">&minus;</button>
          <span>${qty}</span>
          <button type="button" data-act="inc" aria-label="Increase">+</button>
        </div>
        <button type="button" class="cart-remove" data-act="rm">Remove</button>`;
      list.appendChild(row);
    });
  },
};

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  // kill any native drag ghost (e.g. dragging the swatch image)
  document.addEventListener("dragstart", (e) => e.preventDefault());
  initLoader();
  initCover();
  initTouchCursor();
  cart.build();
  browser.build();
  instructions.build();
});
