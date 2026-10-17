/* =========================================================
   NOVA · Núcleo compartido de la tienda
   - Almacenamiento (localStorage)
   - Catálogo, formato de precios
   - Imágenes placeholder en SVG (sin dependencias externas)
   - Carrito, cupones, favoritos
   - Toast, header, footer, product card
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Storage seguro ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* noop */ }
    }
  };

  const KEYS = {
    cart: "nova_cart",
    coupon: "nova_coupon",
    wishlist: "nova_wishlist",
    user: "nova_user",
    products: "nova_products",      // catálogo editado desde el admin
    coupons: "nova_coupons",        // cupones editados desde el admin
    settings: "nova_settings",      // configuración editada desde el admin
    newOrders: "nova_new_orders",   // pedidos hechos desde el checkout
    lastOrder: "nova_last_order"
  };

  const DEFAULT_SETTINGS = {
    storeName: "NOVA",
    email: "hola@nova.store",
    phone: "11 4000-6682",
    shippingCost: 6990,
    freeShippingFrom: 150000,
    installments: 6,
    methods: { domicilio: true, retiro: true },
    payments: { mercadopago: true, transferencia: true, tarjeta: true },
    transferDiscount: 10,
    instagram: "@nova.store",
    facebook: "nova.store",
    whatsapp: "11 4000-6682"
  };

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Math.round(n).toLocaleString("es-AR");
  const params = () => new URLSearchParams(location.search);

  // Categorías editadas desde el admin reemplazan a las del archivo de datos
  const editedCats = store.get("nova_categories", null);
  if (Array.isArray(editedCats) && editedCats.length) window.NOVA_CATEGORIES = editedCats;

  function settings() {
    return Object.assign({}, DEFAULT_SETTINGS, store.get(KEYS.settings, {}));
  }

  /* ---------- Catálogo ---------- */
  function products() {
    const edited = store.get(KEYS.products, null);
    const list = Array.isArray(edited) ? edited : window.NOVA_PRODUCTS;
    return list.filter((p) => p.status !== "Borrador" && p.status !== "Archivado");
  }
  function allProducts() {
    const edited = store.get(KEYS.products, null);
    return Array.isArray(edited) ? edited : window.NOVA_PRODUCTS.slice();
  }
  // Las marcas nuevas (p. ej. cargadas por Excel) también aparecen en filtros y formularios
  window.NOVA_BRANDS = Array.from(new Set([].concat(window.NOVA_BRANDS || [], allProducts().map((p) => p.brand).filter(Boolean))));
  const product = (id) => allProducts().find((p) => p.id === id);
  const category = (id) => window.NOVA_CATEGORIES.find((c) => c.id === id);
  const discountPct = (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  function categoryCount(id) {
    const list = products();
    return id === "ofertas" ? list.filter((p) => discountPct(p) > 0).length : list.filter((p) => p.category === id).length;
  }

  /* ---------- Imágenes placeholder (SVG) ----------
     Si el producto tiene `images`, se usan esas fotos. Si no, se
     genera una ilustración vectorial con el ícono y el tono del producto. */
  const ICONS = {
    headphones: '<path d="M14 40v-8a18 18 0 0 1 36 0v8"/><rect x="9" y="37" width="10" height="17" rx="4"/><rect x="45" y="37" width="10" height="17" rx="4"/>',
    watch: '<path d="M24 18l2-10h12l2 10M24 46l2 10h12l2-10"/><rect x="19" y="17" width="26" height="30" rx="8"/><path d="M32 25v7l4 3"/>',
    speaker: '<rect x="18" y="8" width="28" height="48" rx="9"/><circle cx="32" cy="38" r="9"/><circle cx="32" cy="38" r="3"/><circle cx="32" cy="19" r="3"/>',
    keyboard: '<rect x="6" y="20" width="52" height="26" rx="5"/><path d="M13 28h2M20 28h2M27 28h2M34 28h2M41 28h2M48 28h3M13 34h2M20 34h2M27 34h2M34 34h2M41 34h2M48 34h3M20 40h24"/>',
    mouse: '<rect x="20" y="9" width="24" height="44" rx="12"/><path d="M32 9v13"/><rect x="30" y="15" width="4" height="7" rx="2"/>',
    camera: '<path d="M22 20l3-6h14l3 6"/><rect x="9" y="20" width="46" height="32" rx="6"/><circle cx="32" cy="36" r="10"/><circle cx="32" cy="36" r="4"/><circle cx="48" cy="27" r="1.5"/>',
    tablet: '<rect x="13" y="7" width="38" height="50" rx="6"/><rect x="18" y="12" width="28" height="36" rx="2"/><path d="M29 52h6"/>',
    bolt: '<path d="M26 6v8M38 6v8"/><rect x="17" y="14" width="30" height="38" rx="7"/><path d="M34 22l-7 10h9l-7 11"/>',
    jacket: '<path d="M24 9l8 6 8-6 12 6 5 29h-9v14H16V44H7l5-29z"/><path d="M32 15v43M24 34h4M36 34h4"/>',
    hoodie: '<path d="M22 11c1 8 19 8 20 0l12 8 4 23h-9v16H15V42H6l4-23z"/><path d="M26 15c0 6 12 6 12 0M22 43h20v8H22z"/>',
    tshirt: '<path d="M22 10l-14 8 5 10 7-3v31h24V25l7 3 5-10-14-8c-2 5-6 7-10 7s-8-2-10-7z"/>',
    shirt: '<path d="M22 9l-14 8 4 31h8v8h24v-8h8l4-31-14-8-6 7-4-3-4 3z"/><path d="M32 16v40"/><circle cx="35" cy="26" r="1"/><circle cx="35" cy="34" r="1"/><circle cx="35" cy="42" r="1"/>',
    pants: '<path d="M19 8h26l4 50H38l-6-32-6 32H15z"/><path d="M19 16h26M24 16v6M40 16v6"/>',
    cap: '<path d="M10 40c0-14 10-24 22-24s22 10 22 24z"/><path d="M32 16v24M40 40h18c0 3-4 6-12 6"/><circle cx="32" cy="15" r="2"/>',
    sneaker: '<path d="M6 46V30l11-3 7 6 13 3 15 4c4 1 7 4 7 8v4H8z"/><path d="M6 48h53M21 31l3 3M26 29l3 3M31 30l3 3"/>',
    runner: '<path d="M10 46V32l10-4 7 6 12 3 13 4c4 1 7 4 7 7v4H12z"/><path d="M10 48h49M2 26h8M0 33h8M4 40h6"/>',
    boot: '<path d="M18 8h18v26l14 6c4 2 7 5 7 9v5H18z"/><path d="M18 50h39M22 15h10M22 21h10M22 27h10"/>',
    slide: '<path d="M6 46c0-4 4-6 8-6h36c4 0 8 2 8 6v3H6z"/><path d="M18 40c1-10 27-10 28 0"/>',
    backpack: '<path d="M17 24c0-9 6-14 15-14s15 5 15 14v29a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4z"/><path d="M24 10a8 8 0 0 1 16 0M23 36h18v13H23zM23 41h18"/>',
    glasses: '<circle cx="18" cy="34" r="10"/><circle cx="46" cy="34" r="10"/><path d="M28 32c2-3 6-3 8 0M8 31L5 22M56 31l3-9"/>',
    wallet: '<path d="M12 18l30-8 4 8"/><rect x="8" y="18" width="48" height="34" rx="6"/><path d="M40 30h16v11H40z"/><circle cx="45" cy="35.5" r="1.5"/>',
    bottle: '<path d="M26 5h12v7l4 6v38a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V18l4-6z"/><path d="M22 28h20M22 46h20"/>',
    bag: '<path d="M8 24h48l-4 31H12z"/><path d="M22 24c0-11 20-11 20 0M8 34h48"/>',
    sleeve: '<rect x="8" y="16" width="48" height="36" rx="7"/><rect x="16" y="28" width="32" height="15" rx="3"/><path d="M8 23h48"/>',
    lamp: '<path d="M21 8h22l9 21H12z"/><path d="M32 29v21M20 56h24M24 50h16"/>',
    mug: '<path d="M14 18h30v28a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z"/><path d="M44 24h4a6 6 0 0 1 0 12h-4M24 5c-2 3 2 5 0 8M32 5c-2 3 2 5 0 8"/>',
    diffuser: '<path d="M20 30h24l-4 26H24z"/><path d="M32 30v-5M26 20c0-4 12-4 12-9M28 13c0-3 8-4 8-8"/>',
    blanket: '<rect x="10" y="12" width="44" height="38" rx="3"/><path d="M10 21h44M10 30h44M10 39h44M15 50v6M22 50v6M29 50v6M36 50v6M43 50v6M50 50v6"/>',
    plant: '<path d="M20 38h24l-3 18H23z"/><path d="M32 38V24M32 27c-10 0-14-8-14-15 8 0 14 5 14 15zM32 31c8 0 13-6 13-13-7 0-13 4-13 13z"/>',
    chair: '<path d="M22 6h20l-2 24H24z"/><path d="M17 30h30v6H17zM20 36l-4 22M44 36l4 22M25 36l-2 14M39 36l2 14"/>',
    tag: '<path d="M8 32V10h22l26 26-22 22z"/><circle cx="19" cy="21" r="4"/>'
  };
  let artSeq = 0;
  function art(p, variant = 0) {
    const h = p.hue ?? 220;
    const icon = ICONS[p.icon] || ICONS.tag;
    const id = "g" + (++artSeq);
    let bg, fg, fill, deco, tf;
    if (variant === 1) { // alternativa oscura (hover / galería)
      bg = `<stop offset="0" stop-color="hsl(${h} 28% 24%)"/><stop offset="1" stop-color="hsl(${h} 32% 12%)"/>`;
      fg = `hsl(${h} 70% 92%)`; fill = `hsl(${h} 30% 30%)`;
      deco = `<circle cx="300" cy="90" r="120" fill="hsl(${h} 60% 60% / .14)"/><circle cx="80" cy="330" r="70" fill="hsl(${h} 60% 70% / .10)"/>`;
      tf = "translate(200 205) rotate(-12) scale(4.2) translate(-32 -32)";
    } else if (variant === 2) { // detalle / primer plano
      bg = `<stop offset="0" stop-color="hsl(${h} 35% 90%)"/><stop offset="1" stop-color="hsl(${h} 45% 80%)"/>`;
      fg = `hsl(${h} 35% 20%)`; fill = `hsl(${h} 50% 96%)`;
      deco = `<rect x="0" y="260" width="400" height="140" fill="hsl(${h} 40% 72% / .35)"/>`;
      tf = "translate(230 230) scale(6.2) translate(-32 -32)";
    } else if (variant === 3) { // patrón
      bg = `<stop offset="0" stop-color="hsl(${h} 30% 96%)"/><stop offset="1" stop-color="hsl(${h} 30% 92%)"/>`;
      fg = `hsl(${h} 35% 25%)`; fill = `hsl(${h} 60% 98%)`;
      deco = [0, 1, 2].map((r) => [0, 1, 2].map((c) =>
        `<g transform="translate(${38 + c * 124} ${38 + r * 124}) scale(1.3)" fill="${(r + c) % 2 ? `hsl(${h} 60% 88%)` : "none"}" stroke="hsl(${h} 35% 40% / .45)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon}</g>`).join("")).join("");
      tf = null;
    } else { // principal
      bg = `<stop offset="0" stop-color="hsl(${h} 42% 96%)"/><stop offset="1" stop-color="hsl(${h} 40% 88%)"/>`;
      fg = `hsl(${h} 38% 18%)`; fill = `hsl(${h} 60% 98%)`;
      deco = `<circle cx="200" cy="190" r="128" fill="hsl(${h} 55% 80% / .45)"/><ellipse cx="200" cy="330" rx="104" ry="12" fill="hsl(${h} 30% 40% / .14)"/>`;
      tf = "translate(200 192) scale(3.6) translate(-32 -32)";
    }
    // Solo las formas cerradas (rect/circle) llevan relleno; los trazos abiertos quedan en línea
    const filled = icon.replace(/<(rect|circle) /g, `<$1 fill="${fill}" `);
    const iconG = tf ? `<g transform="${tf}" fill="none" stroke="${fg}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${filled}</g>` : "";
    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${bg}</linearGradient></defs><rect width="400" height="400" fill="url(#${id})"/>${deco}${iconG}</svg>`;
  }
  /* Devuelve <img> real si hay fotos; si no, el SVG */
  function media(p, variant = 0) {
    const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    if (imgs.length) {
      // Con fotos reales nunca se mezclan ilustraciones: si falta esa posición, se usa la principal
      let src = imgs[variant] || imgs[0];
      // Rutas relativas a la raíz (assets/...) funcionan también desde /admin
      if (!/^(data:|https?:|\/|\.\.\/)/.test(src)) src = (window.NOVA_BASE || "") + src;
      return `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`;
    }
    return art(p, variant);
  }

  /* ---------- Cupones ---------- */
  function coupons() {
    const edited = store.get(KEYS.coupons, null);
    return Array.isArray(edited) ? edited : window.NOVA_COUPONS;
  }
  function findCoupon(code) {
    const c = coupons().find((x) => x.code.toUpperCase() === String(code).trim().toUpperCase());
    if (!c) return { error: "El cupón no existe." };
    if (c.status !== "Activo") return { error: `El cupón ${c.code} no está disponible (${c.status.toLowerCase()}).` };
    return { coupon: c };
  }

  /* ---------- Carrito ---------- */
  const cart = {
    items() {
      // Se descartan líneas cuyo producto ya no exista
      return store.get(KEYS.cart, []).filter((l) => product(l.id));
    },
    save(items) { store.set(KEYS.cart, items); updateBadges(); document.dispatchEvent(new CustomEvent("cart:change")); },
    add(id, qty = 1, variant) {
      const p = product(id);
      if (!p) return false;
      if (p.stock <= 0) { toast("Producto sin stock", "error"); return false; }
      const v = variant || (p.variants ? p.variants.options[0] : "");
      const items = this.items();
      const line = items.find((l) => l.id === id && l.variant === v);
      if (line) line.qty = Math.min(p.stock, line.qty + qty);
      else items.push({ id, variant: v, qty: Math.min(p.stock, qty) });
      this.save(items);
      return true;
    },
    setQty(index, qty) {
      const items = this.items();
      if (!items[index]) return;
      const p = product(items[index].id);
      items[index].qty = Math.max(1, Math.min(p.stock || 99, qty));
      this.save(items);
    },
    remove(index) {
      const items = this.items();
      items.splice(index, 1);
      this.save(items);
    },
    clear() { this.save([]); store.remove(KEYS.coupon); },
    count() { return this.items().reduce((n, l) => n + l.qty, 0); },
    /* Totales: shippingMethod "domicilio" | "retiro"; paymentMethod opcional */
    totals(shippingMethod = "domicilio", paymentMethod) {
      const s = settings();
      const lines = this.items().map((l) => ({ ...l, product: product(l.id) }));
      const subtotal = lines.reduce((n, l) => n + l.product.price * l.qty, 0);
      const savings = lines.reduce((n, l) => n + ((l.product.oldPrice || l.product.price) - l.product.price) * l.qty, 0);
      const code = store.get(KEYS.coupon, null);
      const found = code ? findCoupon(code) : null;
      const coupon = found && found.coupon ? found.coupon : null;
      let discount = 0, freeShip = false;
      if (coupon) {
        if (coupon.type === "Porcentaje") discount = Math.round(subtotal * coupon.value / 100);
        else if (coupon.type === "Monto fijo") discount = Math.min(subtotal, coupon.value);
        else if (coupon.type === "Envío gratis") freeShip = true;
      }
      let transfer = 0;
      if (paymentMethod === "transferencia" && s.transferDiscount) transfer = Math.round((subtotal - discount) * s.transferDiscount / 100);
      let shipping = 0;
      if (shippingMethod === "domicilio" && subtotal > 0 && !freeShip && subtotal < s.freeShippingFrom) shipping = s.shippingCost;
      const total = Math.max(0, subtotal - discount - transfer + shipping);
      return { lines, subtotal, savings, discount, transfer, shipping, total, coupon, freeShipFrom: s.freeShippingFrom,
               missingForFree: Math.max(0, s.freeShippingFrom - subtotal) };
    }
  };

  /* ---------- Favoritos ---------- */
  const wishlist = {
    ids() { return store.get(KEYS.wishlist, []).filter((id) => product(id)); },
    has(id) { return this.ids().includes(id); },
    toggle(id) {
      const ids = this.ids();
      const i = ids.indexOf(id);
      if (i >= 0) { ids.splice(i, 1); toast("Producto quitado de favoritos", "info"); }
      else { ids.push(id); toast("Producto agregado a favoritos", "success"); }
      store.set(KEYS.wishlist, ids);
      updateBadges();
      syncWishButtons();
      document.dispatchEvent(new CustomEvent("wishlist:change"));
      return i < 0;
    }
  };

  /* ---------- Toast ---------- */
  const TOAST_ICONS = {
    success: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    error: '<path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/>'
  };
  function toast(message, type = "success", action) {
    let region = $("#toast-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "toast-region";
      region.className = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<svg class="toast__icon" viewBox="0 0 24 24" aria-hidden="true">${TOAST_ICONS[type] || TOAST_ICONS.info}</svg>
      <span class="toast__msg">${esc(message)}</span>
      ${action ? `<a class="toast__action" href="${esc(action.href)}">${esc(action.label)}</a>` : ""}
      <button class="toast__close" type="button" aria-label="Cerrar notificación">×</button>`;
    region.appendChild(el);
    const close = () => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 250); };
    el.querySelector(".toast__close").addEventListener("click", close);
    setTimeout(close, 3600);
  }

  /* ---------- Íconos de interfaz ---------- */
  const UI = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.4 3.6 4 7 4c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 15.4 12 20 12 20z"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4.5h-4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".8"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-1 .8c-1-.4-1.8-1.2-2.2-2.2l.8-1-1-2z"/>',
    tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.6 2.2 4.2 5 4.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 16c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4M15 10h3M15 13h3"/>'
  };
  const icon = (name, cls = "icon") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${UI[name] || ""}</svg>`;

  function stars(rating, showValue = true) {
    rating = Number(rating) || 0;
    const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
    return `<span class="stars" role="img" aria-label="Valoración ${rating} de 5">
      <span class="stars__track">★★★★★</span><span class="stars__fill" style="width:${pct}%">★★★★★</span></span>${showValue ? `<span class="stars__value">${rating.toFixed(1).replace(".", ",")}</span>` : ""}`;
  }

  /* ---------- Product card ---------- */
  function productCard(p) {
    const d = discountPct(p);
    const out = p.stock <= 0;
    const cat = category(p.category);
    const fav = wishlist.has(p.id);
    const s = settings();
    return `<article class="product-card${out ? " is-out" : ""}" data-product="${esc(p.id)}">
      <div class="product-card__media">
        <a href="producto.html?id=${encodeURIComponent(p.id)}" class="product-card__link" aria-label="Ver ${esc(p.name)}" tabindex="-1">
          <span class="product-card__img product-card__img--main">${media(p, 0)}</span>
          <span class="product-card__img product-card__img--alt" aria-hidden="true">${media(p, 1)}</span>
        </a>
        <div class="product-card__badges">
          ${d ? `<span class="badge badge--sale">-${d}%</span>` : ""}
          ${out ? `<span class="badge badge--out">Agotado</span>` : (p.stock <= 5 ? `<span class="badge badge--low">Últimas ${p.stock}</span>` : "")}
          ${isNew(p) && !d ? `<span class="badge badge--new">Nuevo</span>` : ""}
        </div>
        <button class="wish-btn${fav ? " is-active" : ""}" type="button" data-wish="${esc(p.id)}" aria-pressed="${fav}" aria-label="${fav ? "Quitar de" : "Agregar a"} favoritos: ${esc(p.name)}">${icon("heart")}</button>
        <button class="quick-add" type="button" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "Sin stock" : icon("plus") + " Agregar"}</button>
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${esc(cat ? cat.name : "")}</span>
        <h3 class="product-card__title"><a href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <div class="product-card__rating">${stars(p.rating)}<span class="product-card__reviews">(${p.reviews})</span></div>
        <div class="price">
          <span class="price__now">${money(p.price)}</span>
          ${d ? `<span class="price__old">${money(p.oldPrice)}</span><span class="price__off">${d}% OFF</span>` : ""}
        </div>
        <p class="product-card__installments">${s.installments} cuotas sin interés de ${money(p.price / s.installments)}</p>
        <button class="btn btn--dark btn--block product-card__cta" type="button" data-add="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "Agotado" : "Agregar al carrito"}</button>
      </div>
    </article>`;
  }
  function isNew(p) {
    return p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 1000 * 60 * 60 * 24 * 30;
  }

  /* Delegación global para "agregar" y "favoritos" */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add && !add.disabled) {
      e.preventDefault();
      const id = add.getAttribute("data-add");
      if (cart.add(id, 1)) {
        toast("Producto agregado al carrito", "success", { href: "carrito.html", label: "Ver carrito" });
        pulseCart();
      }
      return;
    }
    const wish = e.target.closest("[data-wish]");
    if (wish) {
      e.preventDefault();
      wishlist.toggle(wish.getAttribute("data-wish"));
    }
  });

  function syncWishButtons() {
    $$("[data-wish]").forEach((b) => {
      const on = wishlist.has(b.getAttribute("data-wish"));
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on);
    });
  }
  function pulseCart() {
    $$(".cart-link").forEach((el) => { el.classList.remove("is-pulse"); void el.offsetWidth; el.classList.add("is-pulse"); });
  }
  function updateBadges() {
    const c = cart.count();
    $$("[data-cart-count]").forEach((el) => { el.textContent = c; el.hidden = c === 0; });
    const w = wishlist.ids().length;
    $$("[data-wish-count]").forEach((el) => { el.textContent = w; el.hidden = w === 0; });
  }

  /* ---------- Header ---------- */
  function renderHeader() {
    const slot = $("#site-header");
    if (!slot) return;
    const page = document.body.dataset.page || "";
    const s = settings();
    const user = store.get(KEYS.user, null);
    const cats = window.NOVA_CATEGORIES;
    const navItem = (href, label, key) => `<a href="${href}" class="nav__link${page === key ? " is-active" : ""}"${page === key ? ' aria-current="page"' : ""}>${label}</a>`;
    slot.innerHTML = `
      <div class="announce"><div class="container announce__inner">
        <span>${icon("truck")} Envío gratis desde ${money(s.freeShippingFrom)}</span>
        <span class="announce__sep" aria-hidden="true">·</span>
        <span>${s.installments} cuotas sin interés</span>
        <span class="announce__sep hide-sm" aria-hidden="true">·</span>
        <span class="hide-sm">10% OFF con el cupón <strong>NOVA10</strong></span>
      </div></div>
      <div class="header-bar"><div class="container header-bar__inner">
        <button class="icon-btn burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="mobile-drawer">${icon("menu")}</button>
        <a href="index.html" class="logo" aria-label="${esc(s.storeName)} — Inicio">${s.logo ? `<img src="${esc(s.logo)}" alt="" style="height:32px;width:auto">` : `${esc(s.storeName)}<span class="logo__dot" aria-hidden="true"></span>`}</a>
        <nav class="nav" aria-label="Principal">
          ${navItem("index.html", "Inicio", "home")}
          ${navItem("productos.html", "Productos", "productos")}
          <div class="nav__dropdown">
            <a href="index.html#categorias" class="nav__link${page === "categorias" ? " is-active" : ""}" aria-haspopup="true">Categorías <svg class="icon icon--xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a>
            <div class="mega" role="menu">
              ${cats.map((c) => `<a role="menuitem" href="productos.html?${c.id === "ofertas" ? "ofertas=1" : "cat=" + c.id}" class="mega__item">
                <span class="mega__thumb">${art({ icon: c.icon, hue: c.hue, name: c.name })}</span>
                <span><strong>${c.name}</strong><small>${categoryCount(c.id)} productos</small></span></a>`).join("")}
            </div>
          </div>
          ${navItem("productos.html?ofertas=1", "Ofertas", "ofertas")}
        </nav>
        <form class="search" role="search" action="productos.html" method="get">
          <label class="sr-only" for="header-search">Buscar productos</label>
          ${icon("search", "icon search__icon")}
          <input id="header-search" name="q" type="search" placeholder="Buscar productos, marcas…" autocomplete="off" value="${esc(params().get("q") || "")}">
          <div class="search__suggest" hidden></div>
        </form>
        <div class="header-actions">
          <a href="${user ? "cuenta.html" : "login.html"}" class="icon-btn account-link" aria-label="${user ? "Mi cuenta" : "Iniciar sesión"}">${icon("user")}</a>
          <a href="cuenta.html#favoritos" class="icon-btn wish-link" aria-label="Favoritos">${icon("heart")}<span class="count-badge" data-wish-count hidden>0</span></a>
          <a href="carrito.html" class="icon-btn cart-link" aria-label="Carrito">${icon("bag")}<span class="count-badge count-badge--accent" data-cart-count hidden>0</span></a>
        </div>
      </div></div>
      <div class="drawer" id="mobile-drawer" hidden>
        <div class="drawer__backdrop" data-close-drawer></div>
        <aside class="drawer__panel" aria-label="Menú">
          <div class="drawer__head">
            <a href="index.html" class="logo">${esc(s.storeName)}<span class="logo__dot" aria-hidden="true"></span></a>
            <button class="icon-btn" type="button" data-close-drawer aria-label="Cerrar menú">${icon("close")}</button>
          </div>
          <nav class="drawer__nav" aria-label="Menú móvil">
            <a href="index.html">Inicio ${icon("chevron")}</a>
            <a href="productos.html">Productos ${icon("chevron")}</a>
            <a href="productos.html?ofertas=1">Ofertas ${icon("chevron")}</a>
            <p class="drawer__label">Categorías</p>
            <div class="drawer__cats">
              ${cats.map((c) => `<a href="productos.html?${c.id === "ofertas" ? "ofertas=1" : "cat=" + c.id}"><span class="drawer__thumb">${art({ icon: c.icon, hue: c.hue, name: c.name })}</span>${c.name}</a>`).join("")}
            </div>
            <p class="drawer__label">Mi cuenta</p>
            <a href="${user ? "cuenta.html" : "login.html"}">${user ? "Mi cuenta" : "Iniciar sesión"} ${icon("chevron")}</a>
            <a href="cuenta.html#favoritos">Favoritos ${icon("chevron")}</a>
            <a href="cuenta.html#pedidos">Mis pedidos ${icon("chevron")}</a>
            <a href="info.html#ayuda">Ayuda ${icon("chevron")}</a>
          </nav>
        </aside>
      </div>`;

    // Drawer mobile
    const burger = $(".burger", slot);
    const drawer = $("#mobile-drawer");
    const open = () => { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add("is-open")); burger.setAttribute("aria-expanded", "true"); document.body.classList.add("no-scroll"); $(".drawer__nav a", drawer).focus(); };
    const close = () => { drawer.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("no-scroll"); setTimeout(() => { drawer.hidden = true; }, 250); };
    burger.addEventListener("click", open);
    $$("[data-close-drawer]", drawer).forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) close(); });

    // Sugerencias de búsqueda
    const input = $("#header-search");
    const box = $(".search__suggest", slot);
    input.addEventListener("input", () => {
      const q = normalize(input.value);
      if (q.length < 2) { box.hidden = true; return; }
      const hits = products().filter((p) => normalize(p.name + " " + p.brand + " " + p.category).includes(q)).slice(0, 5);
      box.innerHTML = hits.length
        ? hits.map((p) => `<a href="producto.html?id=${encodeURIComponent(p.id)}" class="suggest__item"><span class="suggest__thumb">${media(p)}</span><span class="suggest__name">${esc(p.name)}</span><span class="suggest__price">${money(p.price)}</span></a>`).join("") +
          `<a href="productos.html?q=${encodeURIComponent(input.value)}" class="suggest__all">Ver todos los resultados ${icon("arrow")}</a>`
        : `<p class="suggest__empty">Sin resultados para “${esc(input.value)}”</p>`;
      box.hidden = false;
    });
    input.addEventListener("blur", () => setTimeout(() => { box.hidden = true; }, 180));
    input.addEventListener("focus", () => { if (input.value.length >= 2) input.dispatchEvent(new Event("input")); });

    // Sombra al hacer scroll
    const bar = $(".header-bar", slot);
    const onScroll = () => bar.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const slot = $("#site-footer");
    if (!slot) return;
    const s = settings();
    slot.innerHTML = `
      <section class="perks" aria-label="Beneficios"><div class="container perks__grid">
        <div class="perk">${icon("truck")}<div><strong>Envío gratis</strong><span>En compras desde ${money(s.freeShippingFrom)}</span></div></div>
        <div class="perk">${icon("card")}<div><strong>${s.installments} cuotas sin interés</strong><span>Con todas las tarjetas</span></div></div>
        <div class="perk">${icon("refresh")}<div><strong>Cambios sin cargo</strong><span>Hasta 30 días después</span></div></div>
        <div class="perk">${icon("shield")}<div><strong>Compra protegida</strong><span>Tus datos siempre seguros</span></div></div>
      </div></section>
      <div class="footer"><div class="container">
        <div class="footer__top">
          <div class="footer__brand">
            <a href="index.html" class="logo logo--light">${esc(s.storeName)}<span class="logo__dot" aria-hidden="true"></span></a>
            <p>Productos seleccionados, envíos a todo el país y atención real. Todo en un solo lugar.</p>
            <form class="newsletter" data-newsletter novalidate>
              <label for="nl-email" class="newsletter__label">Recibí novedades y ofertas exclusivas</label>
              <div class="newsletter__row">
                <input id="nl-email" type="email" placeholder="tu@email.com" required autocomplete="email">
                <button class="btn btn--accent" type="submit">Suscribirme</button>
              </div>
            </form>
          </div>
          <nav class="footer__col" aria-label="Tienda"><h2>Tienda</h2>
            <a href="productos.html">Productos</a><a href="productos.html?ofertas=1">Ofertas</a><a href="index.html#categorias">Categorías</a><a href="cuenta.html">Mi cuenta</a></nav>
          <nav class="footer__col" aria-label="Ayuda"><h2>Ayuda</h2>
            <a href="info.html#faq">Preguntas frecuentes</a><a href="info.html#envios">Envíos</a><a href="info.html#cambios">Cambios</a><a href="info.html#contacto">Contacto</a></nav>
          <nav class="footer__col" aria-label="Empresa"><h2>Empresa</h2>
            <a href="info.html#nosotros">Nosotros</a><a href="info.html#terminos">Términos</a><a href="info.html#privacidad">Privacidad</a><a href="admin/index.html">Panel admin</a></nav>
        </div>
        <div class="footer__mid">
          <div class="socials" aria-label="Redes sociales">
            <a href="info.html#contacto" aria-label="Instagram ${esc(s.instagram)}">${icon("instagram")}</a>
            <a href="info.html#contacto" aria-label="Facebook">${icon("facebook")}</a>
            <a href="info.html#contacto" aria-label="TikTok">${icon("tiktok")}</a>
            <a href="info.html#contacto" aria-label="WhatsApp ${esc(s.whatsapp)}">${icon("whatsapp")}</a>
          </div>
          <ul class="payments" aria-label="Métodos de pago">
            <li>Mercado Pago</li><li>Visa</li><li>Mastercard</li><li>Amex</li><li>Transferencia</li>
          </ul>
        </div>
        <div class="footer__bottom">
          <p>© ${new Date().getFullYear()} ${esc(s.storeName)}. Todos los derechos reservados.</p>
          <p>Demo frontend · Datos ficticios · Sin pagos reales</p>
        </div>
      </div></div>`;
    const nl = $("[data-newsletter]", slot);
    nl.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("input", nl);
      if (!/^\S+@\S+\.\S+$/.test(input.value)) { toast("Ingresá un email válido", "error"); input.focus(); return; }
      input.value = "";
      toast("¡Listo! Te suscribiste al newsletter", "success");
    });
  }

  /* ---------- Animaciones de aparición ---------- */
  function initReveal(root = document) {
    const els = $$(".reveal:not(.is-visible)", root);
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Pedidos ----------
     items: [id, cantidad, precioUnitario?, variante?] */
  function orderLines(o) {
    return (o.items || []).map(([id, qty, price, variant]) => {
      const p = product(id);
      return { id, qty, variant, product: p, price: price ?? (p ? p.price : 0) };
    }).filter((l) => l.product);
  }
  function orderTotal(o) {
    if (typeof o.total === "number") return o.total;
    return orderLines(o).reduce((n, l) => n + l.price * l.qty, 0);
  }
  /* Estado actual (el admin puede modificarlo; se guarda en localStorage) */
  function orderStatus(o) {
    return store.get("nova_order_status", {})[o.id] || o.status;
  }
  function setOrderStatus(id, status) {
    const map = store.get("nova_order_status", {});
    map[id] = status;
    store.set("nova_order_status", map);
  }
  /* Pedidos hechos desde el checkout + pedidos de ejemplo */
  function allOrders() {
    const fresh = store.get(KEYS.newOrders, []).map((o) => ({ ...o, customer: o.customer || "WEB" }));
    return fresh.concat(window.NOVA_ORDERS || []);
  }

  function normalize(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  }

  /* ---------- API pública ---------- */
  window.Nova = {
    store, KEYS, settings, $, $$, esc, money, params, normalize,
    products, allProducts, product, category, categoryCount, discountPct, isNew,
    art, media, icon, stars, productCard, coupons, findCoupon,
    cart, wishlist, toast, updateBadges, syncWishButtons, initReveal, pulseCart, orderLines, orderTotal, orderStatus, setOrderStatus, allOrders
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    updateBadges();
    initReveal();
  });
})();
