/* NOVA · Cuenta del cliente
   Los datos de la cuenta vienen de NovaAuth (js/db.js): Supabase si está
   configurado, o localStorage en modo demo. Los pedidos siguen siendo locales
   hasta el paso 2 (pedidos en la base de datos). */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, esc, money, media, icon, store, KEYS, wishlist, productCard, toast, orderLines, orderTotal, orderStatus, allOrders } = N;

  const DEMO_USER = { name: "Juan Pérez", email: "juan.perez@mail.com", phone: "11 5823-4410", birth: "1992-04-18" };
  const SECTIONS = [
    { id: "resumen", label: "Resumen", icon: "grid" },
    { id: "pedidos", label: "Mis pedidos", icon: "box" },
    { id: "favoritos", label: "Favoritos", icon: "heart" },
    { id: "direcciones", label: "Direcciones", icon: "pin" },
    { id: "datos", label: "Datos personales", icon: "id" }
  ];
  const STATUS_UI = {
    Pendiente: ["Pago pendiente", "warning"], Confirmado: ["Confirmado", "info"], Preparando: ["Preparando", "info"],
    Enviado: ["En camino", "info"], Entregado: ["Entregado", "success"], Cancelado: ["Cancelado", "danger"]
  };
  const FLOW = ["Confirmado", "Preparando", "Enviado", "Entregado"];

  const A = window.NovaAuth;
  // Datos cargados desde NovaAuth; se refrescan con load()
  const ctx = { user: null, addresses: [], loggedIn: false };
  const user = () => ctx.user;
  const addresses = () => ctx.addresses;
  async function load() {
    const u = await A.getUser();
    ctx.loggedIn = !!u;
    ctx.user = u || { ...DEMO_USER };
    ctx.addresses = await A.listAddresses();
  }
  // Ejecuta una acción async mostrando estado de carga y errores amigables
  async function run(btn, fn, okMsg) {
    if (btn) { btn.classList.add("is-loading"); btn.disabled = true; }
    try {
      await fn();
      if (okMsg) toast(okMsg, "success");
      await load();
      render();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      if (btn && document.body.contains(btn)) { btn.classList.remove("is-loading"); btn.disabled = false; }
    }
  }
  // Pedidos del cliente: los hechos desde este navegador + historial de ejemplo de Juan (C-001)
  const myOrders = () => allOrders().filter((o) => o.customer === "WEB" || o.customer === "C-001");

  const badge = (status) => { const [label, tone] = STATUS_UI[status] || [status, "neutral"]; return `<span class="status status--${tone}">${label}</span>`; };
  const fmtDate = (d) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

  function orderRow(o, expandable = true) {
    const lines = orderLines(o);
    const status = orderStatus(o);
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const step = FLOW.indexOf(status === "Pendiente" ? "Confirmado" : status);
    return `<article class="order-row">
      <div class="order-row__id"><strong>Pedido #${esc(o.id)}</strong><span>${fmtDate(o.date)} · ${count} ${count === 1 ? "producto" : "productos"}</span></div>
      <div class="order-row__thumbs" aria-hidden="true">${lines.slice(0, 3).map((l) => `<span>${media(l.product)}</span>`).join("")}</div>
      <div class="order-row__total">${money(orderTotal(o))}</div>
      <div style="display:flex;align-items:center;gap:10px">${badge(status)}
        ${expandable ? `<button type="button" class="btn btn--ghost btn--sm" data-order="${esc(o.id)}" aria-expanded="false">Ver detalle</button>` : ""}</div>
      ${expandable ? `<div class="order-detail" id="od-${esc(o.id)}" hidden>
        ${status === "Cancelado" ? `<div class="alert alert--danger">${icon("close")} Este pedido fue cancelado. Si pagaste, el reintegro se acredita en 5 a 10 días hábiles.</div>`
          : `<ol class="timeline" aria-label="Estado del envío">${FLOW.map((s, i) => `<li class="${i <= step ? "is-done" : ""}">${STATUS_UI[s][0]}</li>`).join("")}</ol>`}
        ${lines.map((l) => `<div class="order-detail__line"><span>${l.qty} × <a class="link" href="producto.html?id=${encodeURIComponent(l.id)}">${esc(l.product.name)}</a>${l.variant ? ` <small style="color:var(--muted)">(${esc(l.variant)})</small>` : ""}</span><span>${money(l.price * l.qty)}</span></div>`).join("")}
        <div class="order-detail__line" style="color:var(--muted)"><span>${esc(o.shipping)} · ${esc(o.payment)}</span><strong style="color:var(--ink)">Total ${money(orderTotal(o))}</strong></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          <button type="button" class="btn btn--outline btn--sm" data-rebuy="${esc(o.id)}">Volver a comprar</button>
          <a href="info.html#contacto" class="btn btn--ghost btn--sm">Necesito ayuda</a>
        </div>
      </div>` : ""}
    </article>`;
  }

  const views = {
    resumen() {
      const orders = myOrders();
      const favs = wishlist.ids().length;
      const addr = addresses();
      return `<h2>Resumen de tu cuenta</h2><p>Todo lo importante, en un vistazo.</p>
        <div class="stat-cards">
          <a href="#pedidos" class="stat-card"><span class="stat-card__icon">${icon("box")}</span><div><strong>${orders.length}</strong><span>Pedidos</span></div></a>
          <a href="#favoritos" class="stat-card"><span class="stat-card__icon">${icon("heart")}</span><div><strong>${favs}</strong><span>Favoritos</span></div></a>
          <a href="#direcciones" class="stat-card"><span class="stat-card__icon">${icon("pin")}</span><div><strong>${addr.length}</strong><span>Direcciones</span></div></a>
          <a href="#datos" class="stat-card"><span class="stat-card__icon">${icon("id")}</span><div><strong style="font-size:17px;padding-top:6px">Completos</strong><span>Datos personales</span></div></a>
        </div>
        <div class="section-head" style="margin-bottom:16px"><h2 style="font-size:20px">Últimos pedidos</h2><a href="#pedidos" class="link-arrow">Ver todos ${icon("arrow")}</a></div>
        <div class="order-list">${orders.slice(0, 3).map((o) => orderRow(o, false)).join("") || emptyOrders()}</div>`;
    },
    pedidos() {
      const orders = myOrders();
      return `<h2>Mis pedidos</h2><p>Seguí el estado de tus compras y revisá el detalle.</p>
        <div class="order-list">${orders.map((o) => orderRow(o)).join("") || emptyOrders()}</div>`;
    },
    favoritos() {
      const list = wishlist.ids().map(N.product).filter(Boolean);
      if (!list.length) return `<h2>Favoritos</h2><p>Guardá productos para comprarlos después.</p>
        <div class="empty"><div class="empty__icon">${icon("heart")}</div><h3>Todavía no tenés favoritos</h3>
        <p>Tocá el corazón en cualquier producto para guardarlo acá.</p><a href="productos.html" class="btn btn--dark">Ver productos</a></div>`;
      return `<div class="section-head" style="margin-bottom:24px"><div><h2>Favoritos</h2><p style="color:var(--muted)">${list.length} ${list.length === 1 ? "producto guardado" : "productos guardados"}</p></div>
        <button type="button" class="btn btn--dark" id="fav-all">Agregar todos al carrito</button></div>
        <div class="product-grid product-grid--3">${list.map(productCard).join("")}</div>`;
    },
    direcciones() {
      return `<h2>Direcciones</h2><p>Administrá dónde recibís tus pedidos.</p>
        <div class="address-grid">
          ${addresses().map((a) => `<div class="address-card">
            ${a.main ? `<span class="badge">Principal</span>` : ""}
            <strong>${esc(a.label)}</strong><p>${esc(a.street)}<br>${esc(a.city)} · CP ${esc(a.zip)}</p>
            <div class="address-card__actions">
              ${a.main ? "" : `<button type="button" class="btn btn--outline btn--sm" data-main="${a.id}">Usar como principal</button>`}
              <button type="button" class="btn btn--ghost btn--sm" data-del-addr="${a.id}">Eliminar</button>
            </div></div>`).join("")}
          <button type="button" class="address-card address-card--new" id="add-addr">+ Agregar dirección</button>
        </div>
        <form class="panel-card" id="addr-form" hidden novalidate style="margin-top:20px">
          <h3 style="font-size:18px;margin-bottom:16px">Nueva dirección</h3>
          <div class="form-grid">
            <div class="field"><label for="a-label">Nombre</label><input class="input" id="a-label" placeholder="Casa, trabajo…" required><span class="field__error">Completá este campo.</span></div>
            <div class="field"><label for="a-zip">Código postal</label><input class="input" id="a-zip" inputmode="numeric" maxlength="4" required><span class="field__error">4 dígitos.</span></div>
            <div class="field span-2"><label for="a-street">Calle y número</label><input class="input" id="a-street" required><span class="field__error">Completá este campo.</span></div>
            <div class="field span-2"><label for="a-city">Ciudad y provincia</label><input class="input" id="a-city" required><span class="field__error">Completá este campo.</span></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn--dark" type="submit">Guardar dirección</button><button class="btn btn--ghost" type="button" id="addr-cancel">Cancelar</button></div>
        </form>`;
    },
    datos() {
      const u = user();
      return `<h2>Datos personales</h2><p>Mantené tus datos actualizados para agilizar tus compras.</p>
        <form class="panel-card" id="profile-form" novalidate>
          <div class="form-grid">
            <div class="field"><label for="p-name">Nombre y apellido</label><input class="input" id="p-name" value="${esc(u.name)}" autocomplete="name" required><span class="field__error">Completá tu nombre.</span></div>
            <div class="field"><label for="p-email">Email</label><input class="input" id="p-email" type="email" value="${esc(u.email)}" autocomplete="email" required><span class="field__error">Email inválido.</span></div>
            <div class="field"><label for="p-phone">Teléfono</label><input class="input" id="p-phone" type="tel" value="${esc(u.phone || "")}" autocomplete="tel"></div>
            <div class="field"><label for="p-birth">Fecha de nacimiento</label><input class="input" id="p-birth" type="date" value="${esc(u.birth || "")}"></div>
          </div>
          <label class="check" style="margin-top:18px;font-size:15px"><input type="checkbox" id="p-news" ${u.newsletter !== false ? "checked" : ""}> Recibir ofertas y novedades por email</label>
          <div style="display:flex;gap:8px;margin-top:22px;flex-wrap:wrap"><button class="btn btn--dark" type="submit">Guardar cambios</button><button class="btn btn--outline" type="button" id="change-pass">Cambiar contraseña</button></div>
        </form>`;
    }
  };

  function emptyOrders() {
    return `<div class="empty"><div class="empty__icon">${icon("box")}</div><h3>Aún no hiciste pedidos</h3><p>Cuando compres algo, lo vas a ver acá.</p><a href="productos.html" class="btn btn--dark">Ver productos</a></div>`;
  }

  function current() {
    const h = location.hash.replace("#", "");
    return SECTIONS.some((s) => s.id === h) ? h : "resumen";
  }

  function render(focus) {
    const u = user();
    const sec = current();
    const first = u.name.split(" ")[0];
    $("#hello").textContent = `Hola, ${first}`;
    if (!ctx.loggedIn) $("#hello-sub").innerHTML = `Estás viendo la cuenta de demostración. <a class="link" href="login.html">Iniciá sesión</a> para usar tus datos.`;

    $("#account-nav").innerHTML = `
      <div class="account-nav__user"><span class="avatar">${esc(u.name.split(" ").map((w) => w[0]).slice(0, 2).join(""))}</span><div><strong>${esc(u.name)}</strong><span>${esc(u.email)}</span></div></div>
      ${SECTIONS.map((s) => {
        const count = s.id === "pedidos" ? myOrders().length : s.id === "favoritos" ? wishlist.ids().length : null;
        return `<button type="button" role="tab" aria-selected="${s.id === sec}" aria-controls="account-panel" data-sec="${s.id}">${icon(s.icon)} ${s.label}${count !== null ? `<span class="count">${count}</span>` : ""}</button>`;
      }).join("")}
      <button type="button" class="logout" id="logout">${icon("logout")} Cerrar sesión</button>`;
    const panel = $("#account-panel");
    panel.innerHTML = views[sec]();
    panel.style.animation = "none"; void panel.offsetWidth; panel.style.animation = "fadeUp .3s var(--ease)";
    if (focus) panel.focus({ preventScroll: true });
    bind(sec);
  }

  function bind(sec) {
    $$("[data-sec]").forEach((b) => b.addEventListener("click", () => { history.replaceState(null, "", "#" + b.dataset.sec); render(true); }));
    $("#logout").addEventListener("click", async () => {
      await A.signOut();
      toast("Cerraste sesión", "info");
      setTimeout(() => { location.href = "login.html"; }, 500);
    });
    $$("[data-order]").forEach((b) => b.addEventListener("click", () => {
      const d = $("#od-" + b.dataset.order);
      d.hidden = !d.hidden;
      b.setAttribute("aria-expanded", !d.hidden);
      b.textContent = d.hidden ? "Ver detalle" : "Ocultar";
    }));
    $$("[data-rebuy]").forEach((b) => b.addEventListener("click", () => {
      const o = myOrders().find((x) => x.id === b.dataset.rebuy);
      let added = 0;
      orderLines(o).forEach((l) => { if (l.product.stock > 0 && N.cart.add(l.id, l.qty, l.variant)) added++; });
      if (added) toast(`${added} ${added === 1 ? "producto agregado" : "productos agregados"} al carrito`, "success", { href: "carrito.html", label: "Ver carrito" });
      else toast("Los productos de este pedido no tienen stock", "error");
    }));
    if (sec === "favoritos") {
      const all = $("#fav-all");
      if (all) all.addEventListener("click", () => {
        let n = 0; wishlist.ids().forEach((id) => { const p = N.product(id); if (p && p.stock > 0 && N.cart.add(id, 1)) n++; });
        toast(n ? `${n} productos agregados al carrito` : "No hay productos con stock", n ? "success" : "error", n ? { href: "carrito.html", label: "Ver carrito" } : null);
      });
    }
    if (sec === "direcciones") {
      const form = $("#addr-form");
      $("#add-addr").addEventListener("click", () => { form.hidden = false; $("#a-label").focus(); });
      $("#addr-cancel").addEventListener("click", () => { form.hidden = true; form.reset(); });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const vals = { label: $("#a-label"), zip: $("#a-zip"), street: $("#a-street"), city: $("#a-city") };
        let ok = true;
        Object.entries(vals).forEach(([k, el]) => {
          const bad = k === "zip" ? !/^\d{4}$/.test(el.value) : el.value.trim().length < 2;
          el.closest(".field").classList.toggle("has-error", bad); if (bad) ok = false;
        });
        if (!ok) return;
        const a = { label: vals.label.value.trim(), street: vals.street.value.trim(), city: vals.city.value.trim(), zip: vals.zip.value };
        run(form.querySelector("[type=submit]"), () => A.addAddress(a), "Dirección guardada");
      });
      $$("[data-main]").forEach((b) => b.addEventListener("click", () => run(b, () => A.setMainAddress(b.dataset.main), "Dirección principal actualizada")));
      $$("[data-del-addr]").forEach((b) => b.addEventListener("click", () => run(b, () => A.deleteAddress(b.dataset.delAddr), "Dirección eliminada")));
    }
    if (sec === "datos") {
      $("#profile-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const n = $("#p-name"), m = $("#p-email");
        const badN = n.value.trim().length < 3, badM = !/^\S+@\S+\.\S+$/.test(m.value);
        n.closest(".field").classList.toggle("has-error", badN);
        m.closest(".field").classList.toggle("has-error", badM);
        if (badN || badM) return;
        const data = { name: n.value.trim(), email: m.value.trim(), phone: $("#p-phone").value.trim(), birth: $("#p-birth").value, newsletter: $("#p-news").checked };
        run(e.submitter || $("#profile-form [type=submit]"), async () => {
          const r = await A.saveProfile(data);
          if (r && r.emailPending) toast("Te enviamos un email para confirmar tu nueva dirección", "info");
        }, "Datos actualizados");
      });
      $("#change-pass").addEventListener("click", (e) => run(e.currentTarget, async () => {
        await A.resetPassword(user().email);
        toast(A.enabled ? `Te enviamos un email a ${user().email} para cambiar la contraseña` : "Te enviamos un email para cambiar la contraseña (simulado)", "info");
      }));
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("#account-panel").innerHTML = `<div class="skeleton" style="height:40px;width:50%"></div><div class="skeleton" style="height:160px;margin-top:20px"></div>`;
    try {
      // Con Supabase activo, sin sesión se redirige al login
      if (A.enabled && !(await A.requireUser("cuenta.html" + location.hash))) return;
      await load();
    } catch (err) {
      $("#account-panel").innerHTML = `<div class="empty"><div class="empty__icon">${icon("close")}</div><h3>No pudimos cargar tu cuenta</h3><p>${esc(err.message)}</p><button class="btn btn--dark" type="button" onclick="location.reload()">Reintentar</button></div>`;
      return;
    }
    render();
    window.addEventListener("hashchange", () => { render(true); window.scrollTo({ top: 0, behavior: "smooth" }); });
    document.addEventListener("wishlist:change", () => render());
  });
})();
