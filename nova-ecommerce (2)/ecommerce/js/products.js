/* NOVA · Catálogo: búsqueda, filtros, ordenamiento y paginación */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, esc, money, products, productCard, discountPct, normalize, category } = N;

  const PAGE_SIZE = 12;
  const qs = N.params();
  if (qs.get("ofertas")) document.body.dataset.page = "ofertas";

  // Estado inicial desde la URL (URLs compartibles: ?cat=calzado&q=zapa&orden=precio-asc)
  const state = {
    q: qs.get("q") || "",
    cats: qs.get("cat") ? qs.get("cat").split(",") : [],
    brands: qs.get("marca") ? qs.get("marca").split(",") : [],
    min: qs.get("min") || "",
    max: qs.get("max") || "",
    stock: qs.get("stock") === "1",
    discount: qs.get("ofertas") ? 1 : Number(qs.get("desc") || 0),
    rating: Number(qs.get("rating") || 0),
    sort: qs.get("orden") || "relevancia",
    page: 1
  };

  const PRICE_PRESETS = [
    { label: "Hasta $30.000", min: "", max: 30000 },
    { label: "$30.000 a $80.000", min: 30000, max: 80000 },
    { label: "$80.000 a $150.000", min: 80000, max: 150000 },
    { label: "Más de $150.000", min: 150000, max: "" }
  ];

  function filtered() {
    const q = normalize(state.q);
    const min = Number(state.min) || 0;
    const max = Number(state.max) || Infinity;
    let list = products().filter((p) => {
      if (q) {
        const hay = normalize(`${p.name} ${p.brand} ${(category(p.category) || {}).name} ${p.description}`);
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      if (state.cats.length && !state.cats.includes(p.category)) return false;
      if (state.brands.length && !state.brands.includes(p.brand)) return false;
      if (p.price < min || p.price > max) return false;
      if (state.stock && p.stock <= 0) return false;
      if (state.discount && discountPct(p) < state.discount) return false;
      if (state.rating && p.rating < state.rating) return false;
      return true;
    });
    const sorters = {
      relevancia: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.rating * Math.log(b.reviews + 1)) - (a.rating * Math.log(a.reviews + 1)),
      nuevos: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      "precio-asc": (a, b) => a.price - b.price,
      "precio-desc": (a, b) => b.price - a.price,
      vendidos: (a, b) => (b.sold || 0) - (a.sold || 0)
    };
    list.sort(sorters[state.sort] || sorters.relevancia);
    // Productos agotados siempre al final
    list.sort((a, b) => (a.stock <= 0) - (b.stock <= 0));
    return list;
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cats.length) p.set("cat", state.cats.join(","));
    if (state.brands.length) p.set("marca", state.brands.join(","));
    if (state.min) p.set("min", state.min);
    if (state.max) p.set("max", state.max);
    if (state.stock) p.set("stock", "1");
    if (state.discount === 1) p.set("ofertas", "1"); else if (state.discount) p.set("desc", state.discount);
    if (state.rating) p.set("rating", state.rating);
    if (state.sort !== "relevancia") p.set("orden", state.sort);
    const url = location.pathname + (p.toString() ? "?" + p.toString() : "");
    try { history.replaceState(null, "", url); } catch (e) { /* file:// en algunos navegadores */ }
  }

  function renderHeading() {
    const title = $("#catalog-title");
    const desc = $("#catalog-desc");
    const crumb = $("#breadcrumb");
    let name = "Todos los productos";
    let text = "Tecnología, indumentaria, calzado, accesorios y hogar. Todo en un solo lugar.";
    if (state.cats.length === 1) {
      const c = category(state.cats[0]);
      if (c) { name = c.name; text = c.description; }
    } else if (state.discount === 1 && !state.cats.length) {
      name = "Ofertas"; text = "Descuentos por tiempo limitado en productos seleccionados.";
    }
    if (state.q) { name = `Resultados para “${state.q}”`; }
    title.textContent = name;
    desc.textContent = text;
    document.title = `${name} · NOVA`;
    crumb.innerHTML = `<a href="index.html">Inicio</a><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>` +
      (name === "Todos los productos" ? `<span aria-current="page">Productos</span>`
        : `<a href="productos.html">Productos</a><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg><span aria-current="page">${esc(name)}</span>`);
  }

  function renderChips() {
    const chips = [];
    if (state.q) chips.push({ label: `“${state.q}”`, clear: () => { state.q = ""; $("#catalog-q").value = ""; } });
    state.cats.forEach((c) => chips.push({ label: (category(c) || {}).name || c, clear: () => { state.cats = state.cats.filter((x) => x !== c); } }));
    state.brands.forEach((b) => chips.push({ label: b, clear: () => { state.brands = state.brands.filter((x) => x !== b); } }));
    if (state.min || state.max) chips.push({ label: `${state.min ? money(state.min) : "$0"} – ${state.max ? money(state.max) : "sin tope"}`, clear: () => { state.min = state.max = ""; } });
    if (state.stock) chips.push({ label: "Con stock", clear: () => { state.stock = false; } });
    if (state.discount) chips.push({ label: state.discount === 1 ? "Con descuento" : `${state.discount}% OFF o más`, clear: () => { state.discount = 0; } });
    if (state.rating) chips.push({ label: `${String(state.rating).replace(".", ",")} ★ o más`, clear: () => { state.rating = 0; } });
    const box = $("#chips");
    box.innerHTML = chips.map((c, i) => `<span class="chip">${esc(c.label)}<button type="button" data-chip="${i}" aria-label="Quitar filtro ${esc(c.label)}">×</button></span>`).join("") +
      (chips.length > 1 ? `<button type="button" class="chip chip--clear" id="chips-clear">Limpiar todo</button>` : "");
    $$("[data-chip]", box).forEach((b) => b.addEventListener("click", () => { chips[+b.dataset.chip].clear(); update(); }));
    const all = $("#chips-clear");
    if (all) all.addEventListener("click", reset);
  }

  function syncControls() {
    $$("#f-categories input").forEach((i) => { i.checked = state.cats.includes(i.value); });
    $$("#f-brands input").forEach((i) => { i.checked = state.brands.includes(i.value); });
    $("#f-min").value = state.min;
    $("#f-max").value = state.max;
    $("#f-stock").checked = state.stock;
    $$('input[name="f-discount"]').forEach((i) => { i.checked = Number(i.value) === state.discount; });
    $$('input[name="f-rating"]').forEach((i) => { i.checked = Number(i.value) === state.rating; });
    $$('input[name="f-price"]').forEach((i) => { const pr = PRICE_PRESETS[+i.value]; i.checked = String(pr.min) === String(state.min) && String(pr.max) === String(state.max); });
    $("#sort").value = state.sort;
    $("#catalog-q").value = state.q;
  }

  function render() {
    const list = filtered();
    const grid = $("#catalog-grid");
    const visible = list.slice(0, state.page * PAGE_SIZE);
    $("#result-count").innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? "producto" : "productos"}`;
    $("#filters-close").textContent = `Ver ${list.length} resultados`;
    if (!list.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <div class="empty__icon"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M8.5 11h5"/></svg></div>
        <h2>No encontramos resultados</h2>
        <p>Probá con otros términos o quitá algunos filtros para ver más productos.</p>
        <button type="button" class="btn btn--dark" id="empty-reset">Limpiar filtros</button>
      </div>`;
      $("#empty-reset").addEventListener("click", reset);
    } else {
      grid.innerHTML = visible.map(productCard).join("");
    }
    const more = $("#load-more");
    more.hidden = visible.length >= list.length;
    more.textContent = `Cargar más productos (${list.length - visible.length})`;
  }

  function update(resetPage = true) {
    if (resetPage) state.page = 1;
    syncControls();
    renderHeading();
    renderChips();
    render();
    syncUrl();
  }

  function reset() {
    Object.assign(state, { q: "", cats: [], brands: [], min: "", max: "", stock: false, discount: 0, rating: 0, page: 1 });
    update();
  }

  function buildFilters() {
    const all = products();
    const cats = window.NOVA_CATEGORIES.filter((c) => !c.virtual);
    $("#f-categories").innerHTML = cats.map((c) =>
      `<label class="check"><input type="checkbox" value="${c.id}"> ${c.name} <small>${all.filter((p) => p.category === c.id).length}</small></label>`).join("");
    $("#f-brands").innerHTML = window.NOVA_BRANDS.map((b) =>
      `<label class="check"><input type="checkbox" value="${esc(b)}"> ${esc(b)} <small>${all.filter((p) => p.brand === b).length}</small></label>`).join("");
    $("#f-price-presets").innerHTML = PRICE_PRESETS.map((p, i) =>
      `<label class="check"><input type="radio" name="f-price" value="${i}"> ${p.label}</label>`).join("");

    $$("#f-categories input").forEach((i) => i.addEventListener("change", () => {
      state.cats = $$("#f-categories input:checked").map((x) => x.value); update();
    }));
    $$("#f-brands input").forEach((i) => i.addEventListener("change", () => {
      state.brands = $$("#f-brands input:checked").map((x) => x.value); update();
    }));
    $$('input[name="f-price"]').forEach((i) => i.addEventListener("change", () => {
      const pr = PRICE_PRESETS[+i.value]; state.min = pr.min; state.max = pr.max; update();
    }));
    let t;
    ["#f-min", "#f-max"].forEach((sel) => $(sel).addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { state.min = $("#f-min").value; state.max = $("#f-max").value; update(); }, 400);
    }));
    $("#f-stock").addEventListener("change", (e) => { state.stock = e.target.checked; update(); });
    $$('input[name="f-discount"]').forEach((i) => i.addEventListener("change", () => { state.discount = Number(i.value); update(); }));
    $$('input[name="f-rating"]').forEach((i) => i.addEventListener("change", () => { state.rating = Number(i.value); update(); }));
    $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; update(); });
    let tq;
    $("#catalog-q").addEventListener("input", (e) => { clearTimeout(tq); tq = setTimeout(() => { state.q = e.target.value.trim(); update(); }, 250); });
    $("#clear-filters").addEventListener("click", reset);
    $("#filters-reset-m").addEventListener("click", reset);
    $("#load-more").addEventListener("click", () => { state.page++; render(); });

    // Filtros como panel lateral en mobile
    const panel = $("#filters");
    const applyBar = $("#filters-apply");
    const toggle = $("#filter-toggle");
    let backdrop;
    const open = () => {
      panel.classList.add("is-open"); applyBar.classList.add("is-open"); toggle.setAttribute("aria-expanded", "true");
      backdrop = document.createElement("div"); backdrop.className = "filters-backdrop"; backdrop.addEventListener("click", close);
      document.body.appendChild(backdrop); document.body.classList.add("no-scroll");
    };
    const close = () => {
      panel.classList.remove("is-open"); applyBar.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false");
      if (backdrop) backdrop.remove(); document.body.classList.remove("no-scroll");
    };
    toggle.addEventListener("click", open);
    $("#filters-close").addEventListener("click", () => { close(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("is-open")) close(); });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildFilters();
    // Loading inicial
    $("#catalog-grid").innerHTML = Array.from({ length: 6 }, () => `<div class="skeleton-card" aria-hidden="true"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`).join("");
    setTimeout(() => update(), 250);
  });
})();
