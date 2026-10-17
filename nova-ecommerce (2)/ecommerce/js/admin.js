/* =========================================================
   NOVA · Panel de administración — núcleo
   - Layout (sidebar + topbar), búsqueda global, notificaciones
   - Modales, drawers y confirmaciones
   - Gráficos SVG propios (sin librerías externas)
   - Acceso a datos (ficticios + cambios en localStorage)
   ========================================================= */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, esc, money, store } = N;

  /* ---------- Íconos del panel ---------- */
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7.5" height="9" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="5" rx="1.5"/><rect x="13.5" y="11" width="7.5" height="10" rx="1.5"/><rect x="3" y="15" width="7.5" height="6" rx="1.5"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.7 3 2.5 3.5 5.2"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    ticket: '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 5v14" stroke-dasharray="2 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9v.01M18 15v.01"/>',
    cart: '<path d="M3 4h2l2.5 11h11L21 8H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    repeat: '<path d="M4 12V9a3 3 0 0 1 3-3h13l-3-3M20 12v3a3 3 0 0 1-3 3H4l3 3"/>',
    store: '<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>'
  };
  const icon = (name, cls = "icon") => ICONS[name]
    ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`
    : N.icon(name, cls);

  /* ---------- Formatos ---------- */
  const fmtCompact = (n) => n >= 1e6 ? "$" + (n / 1e6).toFixed(1).replace(".", ",") + " M" : n >= 1e3 ? "$" + Math.round(n / 1e3) + " k" : "$" + Math.round(n);
  const fmtNum = (n) => Math.round(n).toLocaleString("es-AR");
  const fmtDate = (d, opts = { day: "2-digit", month: "short" }) => new Date(d).toLocaleDateString("es-AR", opts);
  const fmtDateTime = (d) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const initials = (name) => String(name).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  /* ---------- Estados ---------- */
  const TONES = {
    Pendiente: "warning", Confirmado: "info", Preparando: "info", Enviado: "info", Entregado: "success", Cancelado: "danger",
    Despachado: "info", "En tránsito": "info", Devuelto: "danger",
    Activo: "success", Pausado: "neutral", Vencido: "neutral", Agotado: "warning", Borrador: "neutral", Archivado: "neutral",
    VIP: "info", Nuevo: "success", Inactivo: "neutral"
  };
  const badge = (s) => `<span class="status status--${TONES[s] || "neutral"}">${esc(s)}</span>`;
  const ORDER_STATUSES = ["Pendiente", "Confirmado", "Preparando", "Enviado", "Entregado", "Cancelado"];
  const SHIP_STATUSES = ["Preparando", "Despachado", "En tránsito", "Entregado", "Devuelto"];

  /* ---------- Datos ---------- */
  const data = {
    products: () => N.allProducts(),
    saveProducts(list) { store.set(N.KEYS.products, list); },
    orders: () => N.allOrders(),
    orderStatus: N.orderStatus,
    setOrderStatus: N.setOrderStatus,
    customers() {
      const orders = N.allOrders();
      const base = window.NOVA_CUSTOMERS.map((c) => ({ ...c }));
      // Compradores web (checkout de la demo) se agrupan por email
      orders.filter((o) => o.customer === "WEB").forEach((o) => {
        const id = "W-" + o.email;
        if (!base.some((c) => c.id === id)) {
          const city = (o.address || "").split(",")[1] || "—";
          base.unshift({ id, name: o.customerName, email: o.email, phone: o.phone, city: city.trim(), province: "", since: o.date.slice(0, 10), status: "Nuevo" });
        }
      });
      return base.map((c) => {
        const mine = orders.filter((o) => (o.customer === "WEB" ? "W-" + o.email : o.customer) === c.id);
        const valid = mine.filter((o) => N.orderStatus(o) !== "Cancelado");
        return { ...c, orders: mine, count: mine.length, spent: valid.reduce((n, o) => n + N.orderTotal(o), 0), last: mine.length ? mine.map((o) => o.date).sort().pop() : null };
      });
    },
    customerOf(o) {
      if (o.customer === "WEB") return { id: "W-" + o.email, name: o.customerName, email: o.email, phone: o.phone, city: "", province: "" };
      return window.NOVA_CUSTOMERS.find((c) => c.id === o.customer) || { name: "Cliente", email: "", phone: "" };
    },
    shipments() {
      const over = store.get("nova_ship_status", {});
      const list = window.NOVA_SHIPMENTS.map((s) => ({ ...s, ...(over[s.order] || {}) }));
      // Pedidos web con envío a domicilio generan su envío automáticamente
      store.get(N.KEYS.newOrders, []).filter((o) => o.shipping === "Envío a domicilio").forEach((o, i) => {
        if (!list.some((s) => s.order === o.id)) list.unshift({ order: o.id, carrier: "Andreani", method: "Estándar", tracking: "AND-" + (99232000 + i), status: "Preparando", eta: new Date(new Date(o.date).getTime() + 4 * 864e5).toISOString().slice(0, 10), ...(over[o.id] || {}) });
      });
      return list;
    },
    saveShipment(order, patch) {
      const over = store.get("nova_ship_status", {});
      over[order] = { ...(over[order] || {}), ...patch };
      store.set("nova_ship_status", over);
    },
    coupons: () => N.coupons().map((c) => ({ ...c })),
    saveCoupons(list) { store.set(N.KEYS.coupons, list); },
    categories: () => window.NOVA_CATEGORIES.map((c) => ({ ...c })),
    saveCategories(list) { store.set("nova_categories", list); window.NOVA_CATEGORIES = list; },
    settings: N.settings,
    saveSettings(s) { store.set(N.KEYS.settings, s); }
  };

  /* ---------- Layout ---------- */
  const NAV = [
    { id: "dashboard", href: "index.html", label: "Dashboard", icon: "dashboard" },
    { id: "productos", href: "productos.html", label: "Productos", icon: "box" },
    { id: "categorias", href: "categorias.html", label: "Categorías", icon: "folder" },
    { id: "pedidos", href: "pedidos.html", label: "Pedidos", icon: "receipt", pill: () => data.orders().filter((o) => N.orderStatus(o) === "Pendiente").length },
    { id: "clientes", href: "clientes.html", label: "Clientes", icon: "users" },
    { id: "envios", href: "envios.html", label: "Envíos", icon: "truck", pill: () => data.shipments().filter((s) => s.status === "Preparando").length },
    { id: "cupones", href: "cupones.html", label: "Cupones", icon: "ticket" },
    { id: "estadisticas", href: "estadisticas.html", label: "Estadísticas", icon: "chart" },
    { id: "configuracion", href: "configuracion.html", label: "Configuración", icon: "settings" }
  ];

  function renderLayout() {
    const page = document.body.dataset.admin;
    const s = data.settings();
    const side = $("#admin-sidebar");
    side.innerHTML = `
      <div class="sidebar__brand">
        <a href="index.html" class="logo" aria-label="${esc(s.storeName)} admin">${esc(s.storeName)}<span class="logo__dot" aria-hidden="true"></span></a>
        <span class="sidebar__tag">Admin</span>
      </div>
      <p class="sidebar__label">Tienda</p>
      <nav class="sidebar__nav" aria-label="Administración">
        ${NAV.map((n, i) => {
          const pill = n.pill ? n.pill() : 0;
          return `${i === 7 ? '<p class="sidebar__label">Análisis y ajustes</p>' : ""}<a href="${n.href}" class="sidebar__link${page === n.id ? " is-active" : ""}"${page === n.id ? ' aria-current="page"' : ""}>${icon(n.icon)} ${n.label}${pill ? `<span class="sidebar__pill" aria-label="${pill} pendientes">${pill}</span>` : ""}</a>`;
        }).join("")}
      </nav>
      <div class="sidebar__foot">
        <a href="../index.html" class="sidebar__store" target="_blank" rel="noopener">
          <span class="dot" aria-hidden="true"></span>
          <div><strong>Ver tienda online</strong><span>Abre en una pestaña nueva</span></div>
          ${icon("external", "icon icon--sm")}
        </a>
      </div>`;

    const top = $("#admin-topbar");
    top.innerHTML = `
      <button class="icon-btn topbar__burger" type="button" aria-label="Abrir menú" aria-controls="admin-sidebar" aria-expanded="false">${N.icon("menu")}</button>
      <div class="topbar__search" role="search">
        <label for="admin-search" class="sr-only">Buscar en el panel</label>
        ${N.icon("search")}
        <input id="admin-search" type="search" placeholder="Buscar pedidos, productos, clientes…" autocomplete="off">
        <kbd>/</kbd>
        <div class="topbar__results" hidden></div>
      </div>
      <div class="topbar__actions">
        <div style="position:relative">
          <button class="icon-btn" type="button" id="notif-btn" aria-label="Notificaciones" aria-expanded="false">${icon("bell")}<span class="notif-dot" aria-hidden="true"></span></button>
        </div>
        <a class="icon-btn" href="../index.html" target="_blank" rel="noopener" aria-label="Ver tienda">${icon("store")}</a>
        <div class="topbar__user"><span>Sofía Admin</span><span class="avatar" aria-hidden="true">SA</span></div>
      </div>`;

    // Sidebar mobile
    const burger = $(".topbar__burger", top);
    let backdrop;
    const close = () => { side.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); if (backdrop) backdrop.remove(); };
    burger.addEventListener("click", () => {
      side.classList.add("is-open"); burger.setAttribute("aria-expanded", "true");
      backdrop = document.createElement("div"); backdrop.className = "sidebar-backdrop"; backdrop.addEventListener("click", close);
      document.body.appendChild(backdrop);
      $(".sidebar__link", side).focus();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && side.classList.contains("is-open")) close(); });

    // Búsqueda global
    const input = $("#admin-search");
    const results = $(".topbar__results", top);
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    });
    input.addEventListener("input", () => {
      const q = N.normalize(input.value);
      if (q.length < 2) { results.hidden = true; return; }
      const orders = data.orders().filter((o) => N.normalize(o.id + " " + data.customerOf(o).name).includes(q)).slice(0, 4)
        .map((o) => `<a href="pedidos.html?id=${o.id}"><span>Pedido #${esc(o.id)} · ${esc(data.customerOf(o).name)}</span><small>${money(N.orderTotal(o))}</small></a>`);
      const prods = data.products().filter((p) => N.normalize(p.name + " " + p.sku).includes(q)).slice(0, 4)
        .map((p) => `<a href="productos.html?edit=${encodeURIComponent(p.id)}"><span>${esc(p.name)}</span><small>${esc(p.sku)}</small></a>`);
      const custs = window.NOVA_CUSTOMERS.filter((c) => N.normalize(c.name + " " + c.email).includes(q)).slice(0, 3)
        .map((c) => `<a href="clientes.html?id=${c.id}"><span>${esc(c.name)}</span><small>Cliente</small></a>`);
      const all = orders.concat(prods, custs);
      results.innerHTML = all.length ? all.join("") : `<p>Sin resultados para “${esc(input.value)}”.</p>`;
      results.hidden = false;
    });
    input.addEventListener("blur", () => setTimeout(() => { results.hidden = true; }, 180));

    // Notificaciones
    const nb = $("#notif-btn");
    nb.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = $(".notif-panel");
      if (existing) { existing.remove(); nb.setAttribute("aria-expanded", "false"); return; }
      const pending = data.orders().filter((o) => N.orderStatus(o) === "Pendiente").length;
      const low = data.products().filter((p) => p.stock <= window.NOVA_STATS.lowStockThreshold).length;
      const panel = document.createElement("div");
      panel.className = "notif-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Notificaciones");
      panel.innerHTML = `<h2>Notificaciones <button type="button" data-read>Marcar como leídas</button></h2>
        <a class="notif" href="pedidos.html?estado=Pendiente"><span class="notif__icon" style="background:var(--warning-soft);color:var(--warning)">${icon("receipt")}</span><div><strong>${pending} pedidos pendientes</strong><small>Esperando confirmación de pago</small></div></a>
        <a class="notif" href="productos.html?stock=bajo"><span class="notif__icon" style="background:var(--danger-soft);color:var(--danger)">${icon("alert")}</span><div><strong>${low} productos con stock bajo</strong><small>Revisá y reponé inventario</small></div></a>
        <a class="notif" href="clientes.html"><span class="notif__icon" style="background:var(--success-soft);color:var(--success)">${icon("users")}</span><div><strong>6 clientes nuevos hoy</strong><small>Hace 12 minutos</small></div></a>`;
      nb.parentElement.appendChild(panel);
      nb.setAttribute("aria-expanded", "true");
      $("[data-read]", panel).addEventListener("click", () => { const dot = $(".notif-dot"); if (dot) dot.remove(); panel.remove(); N.toast("Notificaciones marcadas como leídas", "info"); });
      const off = (ev) => { if (!panel.contains(ev.target)) { panel.remove(); nb.setAttribute("aria-expanded", "false"); document.removeEventListener("click", off); } };
      setTimeout(() => document.addEventListener("click", off));
    });
  }

  /* ---------- Modal ---------- */
  function modal({ title, sub = "", body = "", size = "", foot = "", onOpen } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "modal-title");
    wrap.innerHTML = `<div class="modal__backdrop" data-close></div>
      <div class="modal__dialog ${size ? "modal__dialog--" + size : ""}">
        <h2 id="modal-title">${esc(title)}</h2>
        ${sub ? `<p class="modal__sub">${sub}</p>` : ""}
        <button class="icon-btn modal__close" type="button" data-close aria-label="Cerrar">${N.icon("close")}</button>
        <div class="modal__body">${body}</div>
        ${foot ? `<div class="modal__foot">${foot}</div>` : ""}
      </div>`;
    const prev = document.activeElement;
    document.body.appendChild(wrap);
    document.body.classList.add("no-scroll");
    const close = () => {
      wrap.remove();
      if (!$(".modal") && !$(".drawer-right")) document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (prev && prev.focus) prev.focus();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") trapFocus(e, wrap);
    };
    document.addEventListener("keydown", onKey);
    $$("[data-close]", wrap).forEach((b) => b.addEventListener("click", close));
    const first = $("input, select, textarea", $(".modal__body", wrap)) || $(".modal__close", wrap);
    first.focus();
    if (onOpen) onOpen(wrap, close);
    return { el: wrap, close };
  }
  function trapFocus(e, root) {
    const f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', root).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function confirmDialog({ title, text, confirm = "Eliminar", tone = "danger" }) {
    return new Promise((resolve) => {
      let done = false;
      const m = modal({
        title, body: `<p style="color:var(--muted)">${text}</p>`,
        foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn ${tone === "danger" ? "btn--accent" : "btn--dark"}" data-ok>${esc(confirm)}</button>`,
        onOpen(el, close) {
          $("[data-ok]", el).addEventListener("click", () => { done = true; close(); resolve(true); });
          $("[data-ok]", el).focus();
        }
      });
      const obs = new MutationObserver(() => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) resolve(false); } });
      obs.observe(document.body, { childList: true });
    });
  }
  function drawer({ title, sub = "", body = "", foot = "", onOpen }) {
    const wrap = document.createElement("div");
    wrap.className = "drawer-right";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "drawer-title");
    wrap.innerHTML = `<div class="drawer-right__backdrop" data-close></div>
      <aside class="drawer-right__panel">
        <div class="drawer-right__head"><div><h2 id="drawer-title">${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div>
          <button class="icon-btn" type="button" data-close aria-label="Cerrar">${N.icon("close")}</button></div>
        <div class="drawer-right__body">${body}</div>
        ${foot ? `<div class="drawer-right__foot">${foot}</div>` : ""}
      </aside>`;
    const prev = document.activeElement;
    document.body.appendChild(wrap);
    document.body.classList.add("no-scroll");
    const close = () => {
      wrap.remove();
      if (!$(".modal") && !$(".drawer-right")) document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (prev && prev.focus) prev.focus();
    };
    const onKey = (e) => { if (e.key === "Escape" && !$(".modal")) close(); if (e.key === "Tab" && !$(".modal")) trapFocus(e, wrap); };
    document.addEventListener("keydown", onKey);
    $$("[data-close]", wrap).forEach((b) => b.addEventListener("click", close));
    $(".drawer-right__head [data-close]", wrap).focus();
    if (onOpen) onOpen(wrap, close);
    return { el: wrap, close };
  }

  /* Validación simple de formularios de modales */
  function validateFields(root, rules) {
    let firstBad = null;
    Object.entries(rules).forEach(([id, fn]) => {
      const el = $("#" + id, root);
      const ok = fn(el.value, el);
      el.closest(".field").classList.toggle("has-error", !ok);
      el.setAttribute("aria-invalid", !ok);
      if (!ok && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); return false; }
    return true;
  }

  /* ---------- CSV (exportación real, en el navegador) ---------- */
  function downloadCsv(filename, rows) {
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    N.toast(`Exportaste ${rows.length - 1} registros`, "success");
  }

  /* =========================================================
     GRÁFICOS (SVG)
     ========================================================= */
  const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  function niceMax(v) {
    if (v <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / exp;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return nice * exp;
  }
  function tooltip(container) {
    let tip = $(".chart-tip", container);
    if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip"; tip.setAttribute("role", "status"); container.appendChild(tip); }
    return tip;
  }
  // Re-dibuja cuando cambia el ancho del contenedor
  function responsive(container, draw) {
    let last = 0;
    const run = () => { const w = container.clientWidth; if (w && Math.abs(w - last) > 4) { last = w; draw(w); } };
    run();
    if ("ResizeObserver" in window) new ResizeObserver(run).observe(container);
    else window.addEventListener("resize", run);
  }

  /* Línea + área con crosshair y tooltip. Teclado: flechas. */
  function lineChart(container, { labels, values, fmt = money, height = 260, color = "var(--chart-line)", name = "Ventas" }) {
    container.classList.add("chart");
    container.tabIndex = 0;
    container.setAttribute("role", "img");
    container.setAttribute("aria-label", `${name}: ${labels.length} puntos, máximo ${fmt(Math.max(...values))}`);
    let active = -1;
    responsive(container, (W) => {
      const H = W < 480 ? 200 : height;
      const pad = { l: 52, r: 12, t: 12, b: 28 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
      const max = niceMax(Math.max(...values) * 1.05);
      const x = (i) => pad.l + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw);
      const y = (v) => pad.t + ih - (v / max) * ih;
      const pts = values.map((v, i) => [x(i), y(v)]);
      const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const area = line + ` L${x(values.length - 1).toFixed(1)} ${pad.t + ih} L${pad.l} ${pad.t + ih} Z`;
      const ticks = [0, .25, .5, .75, 1];
      const step = Math.ceil(labels.length / Math.max(2, Math.floor(iw / 70)));
      const gid = "lg" + Math.random().toString(36).slice(2, 7);
      container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
        <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".16"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
        ${ticks.map((t) => `<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(max * t)}" y2="${y(max * t)}"/><text x="${pad.l - 10}" y="${y(max * t) + 4}" text-anchor="end">${fmtCompact(max * t)}</text>`).join("")}
        ${labels.map((l, i) => (i % step === 0 || i === labels.length - 1) && !(i !== labels.length - 1 && labels.length - 1 - i < step * .6) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>` : "").join("")}
        <path d="${area}" fill="url(#${gid})"/>
        <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <line class="xh" x1="0" x2="0" y1="${pad.t}" y2="${pad.t + ih}" stroke="var(--chart-axis)" stroke-dasharray="3 3" opacity="0"/>
        <circle class="dot" r="5" fill="${color}" stroke="#fff" stroke-width="2" opacity="0"/>
        <rect class="hit" x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}"/>
      </svg>`;
      const svg = $("svg", container), xh = $(".xh", svg), dot = $(".dot", svg), tip = tooltip(container);
      const show = (i) => {
        active = i;
        const [px, py] = pts[i];
        xh.setAttribute("x1", px); xh.setAttribute("x2", px); xh.setAttribute("opacity", 1);
        dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.setAttribute("opacity", 1);
        tip.innerHTML = `<strong>${fmt(values[i])}</strong><span>${esc(labels[i])}</span>`;
        tip.style.left = Math.min(Math.max(px, 60), W - 60) + "px"; tip.style.top = py + "px";
        tip.classList.add("is-visible");
      };
      const hide = () => { xh.setAttribute("opacity", 0); dot.setAttribute("opacity", 0); tip.classList.remove("is-visible"); };
      const hit = $(".hit", svg);
      const idxFrom = (clientX) => {
        const r = svg.getBoundingClientRect();
        const rel = (clientX - r.left) * (W / r.width) - pad.l;
        return Math.max(0, Math.min(values.length - 1, Math.round((rel / iw) * (values.length - 1))));
      };
      hit.addEventListener("mousemove", (e) => show(idxFrom(e.clientX)));
      hit.addEventListener("touchstart", (e) => show(idxFrom(e.touches[0].clientX)), { passive: true });
      hit.addEventListener("mouseleave", hide);
      container.onkeydown = (e) => {
        if (e.key === "ArrowRight") { show(Math.min(values.length - 1, active + 1)); e.preventDefault(); }
        if (e.key === "ArrowLeft") { show(Math.max(0, active < 0 ? values.length - 1 : active - 1)); e.preventDefault(); }
      };
      container.onblur = hide;
    });
  }

  /* Columnas verticales con tooltip */
  function columnChart(container, { labels, values, fmt = money, height = 240, color = "var(--chart-1)", highlightLast = true }) {
    container.classList.add("chart");
    container.setAttribute("role", "img");
    container.setAttribute("aria-label", labels.map((l, i) => `${l}: ${fmt(values[i])}`).join(", "));
    responsive(container, (W) => {
      const H = W < 480 ? 200 : height;
      const pad = { l: 52, r: 8, t: 12, b: 28 };
      const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
      const max = niceMax(Math.max(...values) * 1.05);
      const slot = iw / values.length;
      const bw = Math.max(6, Math.min(40, slot - Math.max(4, slot * .35)));
      const y = (v) => pad.t + ih - (v / max) * ih;
      container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
        ${[0, .25, .5, .75, 1].map((t) => `<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(max * t)}" y2="${y(max * t)}"/><text x="${pad.l - 10}" y="${y(max * t) + 4}" text-anchor="end">${fmtCompact(max * t)}</text>`).join("")}
        ${values.map((v, i) => {
          const cx = pad.l + slot * i + slot / 2, top = y(v), h = pad.t + ih - top, r = Math.min(4, bw / 2, h);
          const d = `M${cx - bw / 2} ${pad.t + ih} V${top + r} Q${cx - bw / 2} ${top} ${cx - bw / 2 + r} ${top} H${cx + bw / 2 - r} Q${cx + bw / 2} ${top} ${cx + bw / 2} ${top + r} V${pad.t + ih} Z`;
          return `<path d="${d}" fill="${color}" opacity="${highlightLast && i !== values.length - 1 ? .55 : 1}" data-i="${i}"/>
            <rect class="hit" x="${pad.l + slot * i}" y="${pad.t}" width="${slot}" height="${ih}" data-i="${i}"/>
            <text x="${cx}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
        }).join("")}
      </svg>`;
      const tip = tooltip(container);
      $$(".hit", container).forEach((h) => {
        h.addEventListener("mouseenter", () => {
          const i = +h.dataset.i;
          const cx = pad.l + slot * i + slot / 2;
          tip.innerHTML = `<strong>${fmt(values[i])}</strong><span>${esc(labels[i])}</span>`;
          tip.style.left = Math.min(Math.max(cx, 60), W - 60) + "px"; tip.style.top = y(values[i]) + "px";
          tip.classList.add("is-visible");
          $$("path[data-i]", container).forEach((p) => p.setAttribute("opacity", p.dataset.i == i ? 1 : .35));
        });
        h.addEventListener("mouseleave", () => {
          tip.classList.remove("is-visible");
          $$("path[data-i]", container).forEach((p) => p.setAttribute("opacity", highlightLast && +p.dataset.i !== values.length - 1 ? .55 : 1));
        });
      });
    });
  }

  /* Dona con leyenda (valores + %) sincronizada */
  function donutChart(container, { items, fmt = money, centerLabel = "Total", stack = false }) {
    const total = items.reduce((n, it) => n + it.value, 0) || 1;
    const R = 88, r = 60, C = 90, gap = 0.012;
    let a0 = -Math.PI / 2;
    const arcs = items.map((it, i) => {
      const frac = it.value / total;
      const a1 = a0 + frac * Math.PI * 2;
      const s = a0 + (frac > gap * 2 ? gap : 0), e = a1 - (frac > gap * 2 ? gap : 0);
      const large = e - s > Math.PI ? 1 : 0;
      const p = (rad, ang) => [C + rad * Math.cos(ang), C + rad * Math.sin(ang)].map((n) => n.toFixed(2)).join(" ");
      const d = `M${p(R, s)} A${R} ${R} 0 ${large} 1 ${p(R, e)} L${p(r, e)} A${r} ${r} 0 ${large} 0 ${p(r, s)} Z`;
      a0 = a1;
      return { ...it, d, color: it.color || PALETTE[i % PALETTE.length], pct: frac * 100 };
    });
    container.innerHTML = `<div class="donut-wrap${stack ? " donut-wrap--stack" : ""}">
      <div class="donut chart" role="img" aria-label="${esc(items.map((it) => `${it.label}: ${fmt(it.value)}`).join(", "))}">
        <svg viewBox="0 0 180 180" aria-hidden="true">${arcs.map((a, i) => `<path d="${a.d}" fill="${a.color}" data-i="${i}"/>`).join("")}</svg>
        <div class="donut__center"><div><strong>${fmt(total)}</strong><span>${esc(centerLabel)}</span></div></div>
      </div>
      <ul class="legend">${arcs.map((a, i) => `<li class="legend__item" data-i="${i}"><span class="legend__swatch" style="background:${a.color}"></span><span>${esc(a.label)}</span><span class="legend__value">${fmt(a.value)}</span><span class="legend__pct">${a.pct.toFixed(1).replace(".", ",")}%</span></li>`).join("")}</ul>
    </div>`;
    const donut = $(".donut", container), center = $(".donut__center", container);
    const defaultCenter = center.innerHTML;
    const hi = (i) => {
      donut.classList.toggle("is-hover", i !== null);
      $$("path", donut).forEach((p) => p.classList.toggle("is-hover", i !== null && +p.dataset.i === i));
      $$(".legend__item", container).forEach((l) => l.classList.toggle("is-hover", i !== null && +l.dataset.i === i));
      center.innerHTML = i === null ? defaultCenter : `<div><strong>${fmt(arcs[i].value)}</strong><span>${esc(arcs[i].label)} · ${arcs[i].pct.toFixed(0)}%</span></div>`;
    };
    $$("[data-i]", container).forEach((el) => {
      el.addEventListener("mouseenter", () => hi(+el.dataset.i));
      el.addEventListener("mouseleave", () => hi(null));
    });
  }

  /* Barras horizontales (HTML) */
  function barList(container, items, { fmt = fmtNum, color = "var(--chart-1)" } = {}) {
    const max = Math.max(...items.map((i) => i.value), 1);
    container.innerHTML = `<div class="bars">${items.map((it, i) => `<div class="bar" title="${esc(it.label)}: ${esc(fmt(it.value))}">
      <div class="bar__top"><span>${it.prefix || ""}${esc(it.label)}</span><strong>${fmt(it.value)}${it.suffix ? ` <span style="color:var(--muted);font-weight:500">${it.suffix}</span>` : ""}</strong></div>
      <div class="bar__track"><div class="bar__fill" style="width:${(it.value / max) * 100}%;background:${it.color || color};animation-delay:${i * 60}ms"></div></div>
    </div>`).join("")}</div>`;
  }

  /* Sparkline para KPIs */
  function spark(values, color = "var(--chart-line)") {
    const W = 120, H = 36, max = Math.max(...values), min = Math.min(...values);
    const pts = values.map((v, i) => `${((i / (values.length - 1)) * W).toFixed(1)},${(H - 3 - ((v - min) / (max - min || 1)) * (H - 6)).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  /* Series por período para dashboard y estadísticas */
  const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  function seriesFor(period) {
    const S = window.NOVA_STATS;
    const today = new Date(2026, 8, 29);
    const dayLabel = (back) => { const d = new Date(today); d.setDate(d.getDate() - back); return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`; };
    if (period === "hoy") {
      const shape = [2, 1, 0, 0, 0, 1, 2, 4, 7, 9, 11, 12, 10];
      const tot = shape.reduce((a, b) => a + b, 0);
      let acc = 0;
      return { labels: shape.map((_, i) => `${String(i).padStart(2, "0")} h`), values: shape.map((s) => (acc += Math.round(S.periods.hoy.sales * s / tot))), cumulative: true };
    }
    if (period === "7d") return { labels: S.daily.slice(-7).map((_, i) => dayLabel(6 - i)), values: S.daily.slice(-7) };
    if (period === "30d") return { labels: S.daily.map((_, i) => dayLabel(29 - i)), values: S.daily };
    if (period === "90d") {
      const weeks = [812000, 845000, 901000, 876000, 934000, 889000, 952000, 918000, 978000, 1004000, 1051000, 996000, 963400];
      return { labels: weeks.map((_, i) => `Sem ${i + 1}`), values: weeks };
    }
    return { labels: S.monthly.map((_, i) => MONTHS[i]), values: S.monthly };
  }
  const DELTAS = { hoy: [12.4, 8.1, 2.3, 0.6], "7d": [9.8, 6.4, 3.1, 1.2], "30d": [18.2, 11.5, 7.9, 3.4], "90d": [22.6, 17.3, 14.1, 8.8], anio: [34.1, 28.7, 41.2, 19.5] };
  const deltaHtml = (v) => `<span class="delta ${v >= 0 ? "delta--up" : "delta--down"}">${v >= 0 ? "↑" : "↓"} ${Math.abs(v).toFixed(1).replace(".", ",")}%</span>`;

  /* Selector de período reutilizable */
  function periodSelector(container, current, onChange) {
    const P = window.NOVA_STATS.periods;
    container.innerHTML = `<div class="segmented" role="group" aria-label="Período">${Object.entries(P).map(([k, v]) => `<button type="button" data-period="${k}" aria-pressed="${k === current}">${v.label}</button>`).join("")}</div>`;
    $$("[data-period]", container).forEach((b) => b.addEventListener("click", () => {
      $$("[data-period]", container).forEach((x) => x.setAttribute("aria-pressed", x === b));
      onChange(b.dataset.period);
    }));
  }

  /* ---------- API ---------- */
  window.Admin = {
    icon, badge, TONES, ORDER_STATUSES, SHIP_STATUSES, data, modal, drawer, confirmDialog, validateFields, downloadCsv,
    fmtCompact, fmtNum, fmtDate, fmtDateTime, initials,
    lineChart, columnChart, donutChart, barList, spark, seriesFor, DELTAS, deltaHtml, periodSelector, PALETTE, MONTHS
  };

  /* Solo usuarios con rol "admin" pueden entrar al panel (con Supabase activo).
     OJO: esto protege la interfaz; los datos se protegen con las reglas RLS. */
  async function guard() {
    const Auth = window.NovaAuth;
    if (!Auth || !Auth.enabled) return { name: "Admin demo" };
    document.body.style.visibility = "hidden";
    try {
      const page = location.pathname.split("/").pop() || "index.html";
      const u = await Auth.requireUser("admin/" + page);
      if (!u) return null;
      if (u.role !== "admin") {
        document.body.style.visibility = "";
        document.body.innerHTML = `<main class="container" style="max-width:520px;padding:96px 24px;text-align:center">
          <h1 style="font-size:28px">Acceso restringido</h1>
          <p style="color:var(--muted);margin:12px 0 24px">Tu cuenta (${esc(u.email)}) no tiene permisos de administrador.</p>
          <a class="btn btn--dark" href="../index.html">Volver a la tienda</a></main>`;
        return null;
      }
      return u;
    } finally {
      if (document.body.style.visibility === "hidden") document.body.style.visibility = "";
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    let admin;
    try { admin = await guard(); } catch (err) { N.toast(err.message, "error"); return; }
    if (!admin) return;
    renderLayout();
    const who = $(".topbar__user");
    if (who && admin.name) {
      who.innerHTML = `<span>${esc(admin.name)}</span><span class="avatar" aria-hidden="true">${esc(initials(admin.name))}</span>`;
      if (window.NovaAuth && window.NovaAuth.enabled) {
        who.style.cursor = "pointer";
        who.title = "Cerrar sesión";
        who.addEventListener("click", async () => { await window.NovaAuth.signOut(); location.href = "../login.html"; });
      }
    }
    const page = document.body.dataset.admin;
    const init = window.AdminPages && window.AdminPages[page];
    if (init) init();
  });
})();
