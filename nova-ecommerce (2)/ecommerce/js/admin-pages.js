/* =========================================================
   NOVA · Panel de administración — páginas
   Cada función se ejecuta según <body data-admin="...">
   ========================================================= */
(function () {
  "use strict";
  const N = window.Nova;
  const A = window.Admin;
  const { $, $$, esc, money, media, toast, store } = N;
  const { icon, badge, data } = A;
  const qs = N.params();
  const cat = (id) => (N.category(id) || { name: id }).name;
  const productStatus = (p) => (p.status && p.status !== "Activo" ? p.status : p.stock <= 0 ? "Agotado" : "Activo");
  const STREETS = ["Av. Rivadavia", "Calle 14", "San Martín", "Belgrano", "Av. Colón", "Mitre", "Sarmiento", "Av. Libertador", "Moreno", "Urquiza"];
  function addressOf(o) {
    if (o.address) return o.address;
    const c = data.customerOf(o);
    const n = parseInt(o.id.replace(/\D/g, ""), 10);
    return `${STREETS[n % STREETS.length]} ${(n * 7) % 3000 + 100}, ${c.city}, ${c.province}`;
  }
  const statusSelect = (value, options, attrs = "") =>
    `<select class="select-status status--${A.TONES[value] || "neutral"}" ${attrs}>${options.map((o) => `<option${o === value ? " selected" : ""}>${o}</option>`).join("")}</select>`;
  const paginate = (list, page, size) => list.slice((page - 1) * size, page * size);
  function pager(container, total, page, size, onGo) {
    const pages = Math.max(1, Math.ceil(total / size));
    const from = total ? (page - 1) * size + 1 : 0, to = Math.min(total, page * size);
    container.innerHTML = `<span>Mostrando ${from}–${to} de ${total}</span>
      <div class="pager"><button type="button" data-go="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Página anterior">‹</button>
      ${Array.from({ length: pages }, (_, i) => `<button type="button" data-go="${i + 1}" ${i + 1 === page ? 'aria-current="true"' : ""}>${i + 1}</button>`).join("")}
      <button type="button" data-go="${page + 1}" ${page >= pages ? "disabled" : ""} aria-label="Página siguiente">›</button></div>`;
    $$("[data-go]", container).forEach((b) => b.addEventListener("click", () => onGo(+b.dataset.go)));
  }
  const ICON_OPTIONS = ["headphones", "watch", "speaker", "keyboard", "mouse", "camera", "tablet", "bolt", "jacket", "hoodie", "tshirt", "shirt", "pants", "cap", "sneaker", "runner", "boot", "slide", "backpack", "glasses", "wallet", "bottle", "bag", "sleeve", "lamp", "mug", "diffuser", "blanket", "plant", "chair", "tag"];

  const Pages = {};

  /* =========================================================
     DASHBOARD
     ========================================================= */
  Pages.dashboard = function () {
    let period = "30d";
    const P = window.NOVA_STATS.periods;
    A.periodSelector($("#head-actions"), period, (p) => { period = p; render(); });

    function render() {
      const cur = P[period];
      const d = A.DELTAS[period];
      const series = A.seriesFor(period);
      const orders = data.orders();
      const products = data.products();
      const pending = orders.filter((o) => data.orderStatus(o) === "Pendiente").length;
      const low = products.filter((p) => p.stock <= window.NOVA_STATS.lowStockThreshold).sort((a, b) => a.stock - b.stock);
      const ratio = cur.sales / P["30d"].sales;
      const kpis = [
        { label: "Ventas", value: money(cur.sales), icon: "money", delta: d[0], spark: series.values },
        { label: "Pedidos", value: A.fmtNum(cur.orders), icon: "cart", delta: d[1], spark: series.values.map((v, i) => v * (0.9 + ((i * 7) % 5) / 20)) },
        { label: "Clientes", value: A.fmtNum(cur.customers), icon: "users", delta: d[2], spark: [1100, 1130, 1150, 1170, 1190, 1215, 1240, 1262, 1284] },
        { label: "Productos", value: A.fmtNum(cur.products), icon: "box", delta: d[3], spark: [300, 304, 309, 311, 315, 318, 320, 323, 326] }
      ];
      const statusMix = { Pendiente: .076, Preparando: .12, Enviado: .168, Entregado: .592, Cancelado: .044 };
      $("#page").innerHTML = `
        <div class="grid grid--kpi">
          ${kpis.map((k) => `<section class="card kpi" aria-label="${k.label}">
            <div class="kpi__top"><span class="kpi__label">${k.label}</span><span class="kpi__icon">${icon(k.icon)}</span></div>
            <div class="kpi__value">${k.value}</div>
            <div class="kpi__foot">${A.deltaHtml(k.delta)} vs. período anterior</div>
            <div class="kpi__spark">${A.spark(k.spark, k.delta >= 0 ? "var(--success)" : "var(--danger)")}</div>
          </section>`).join("")}
        </div>
        <div class="grid grid--3">
          <section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--ok">${icon("money")}</span><div><strong>${money(P.hoy.sales)}</strong><span>Ventas de hoy · ${P.hoy.orders} pedidos</span></div><a href="estadisticas.html">Ver más</a></section>
          <section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--warn">${icon("clock")}</span><div><strong>${pending}</strong><span>Pedidos pendientes</span></div><a href="pedidos.html?estado=Pendiente">Revisar</a></section>
          <section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--bad">${icon("alert")}</span><div><strong>${low.length}</strong><span>Productos con stock bajo</span></div><a href="productos.html?stock=bajo">Reponer</a></section>
        </div>
        <div class="grid grid--2-1">
          <section class="card">
            <div class="card__head"><div><h2>Ventas</h2><p>${period === "hoy" ? "Acumulado por hora" : period === "anio" ? "Por mes" : period === "90d" ? "Por semana" : "Por día"} · ${cur.label.toLowerCase()}</p></div><button type="button" class="table-toggle" id="sales-table-btn" aria-expanded="false">Ver tabla</button></div>
            <div class="chart-summary"><strong>${money(cur.sales)}</strong>${A.deltaHtml(d[0])}</div>
            <div id="sales-chart"></div>
            <div id="sales-table" hidden></div>
          </section>
          <section class="card">
            <div class="card__head"><div><h2>Ventas por categoría</h2><p>${cur.label}</p></div></div>
            <div id="cat-chart"></div>
          </section>
        </div>
        <div class="grid grid--2-1">
          <section class="card card--flush">
            <div class="card__head"><div><h2>Últimos pedidos</h2><p>Actualizado hace 2 minutos</p></div><a href="pedidos.html" class="btn btn--outline btn--sm">Ver todos</a></div>
            <div class="table-wrap" style="margin-top:14px"><table class="table table--stack">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th class="num">Total</th><th>Estado</th></tr></thead>
              <tbody>${orders.slice(0, 6).map((o) => { const c = data.customerOf(o); return `<tr class="is-clickable" data-href="pedidos.html?id=${o.id}" tabindex="0">
                <td class="td-main" data-label="Pedido"><strong>#${esc(o.id)}</strong></td>
                <td data-label="Cliente"><div class="cell-user"><span class="avatar">${A.initials(c.name)}</span>${esc(c.name)}</div></td>
                <td data-label="Fecha" class="muted">${A.fmtDateTime(o.date)}</td>
                <td data-label="Total" class="num"><strong>${money(N.orderTotal(o))}</strong></td>
                <td data-label="Estado">${badge(data.orderStatus(o))}</td></tr>`; }).join("")}</tbody>
            </table></div>
          </section>
          <section class="card">
            <div class="card__head"><div><h2>Pedidos por estado</h2><p>${A.fmtNum(cur.orders)} pedidos · ${cur.label.toLowerCase()}</p></div></div>
            <div id="status-chart"></div>
          </section>
        </div>
        <div class="grid grid--1-1">
          <section class="card">
            <div class="card__head"><div><h2>Productos más vendidos</h2><p>Unidades vendidas históricas</p></div><a href="estadisticas.html" class="btn btn--ghost btn--sm">Estadísticas</a></div>
            <div class="list">${products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5).map((p, i) => `<div class="list__item">
              <span style="width:18px;color:var(--muted);font-weight:700">${i + 1}</span><span class="cell-product__img">${media(p)}</span>
              <div class="list__main"><strong>${esc(p.name)}</strong><small>${esc(cat(p.category))} · ${money(p.price)}</small></div>
              <div class="list__end">${A.fmtNum(p.sold || 0)}<small>unidades</small></div></div>`).join("")}</div>
          </section>
          <section class="card">
            <div class="card__head"><div><h2>Stock bajo</h2><p>Productos con ${window.NOVA_STATS.lowStockThreshold} unidades o menos</p></div><a href="productos.html?stock=bajo" class="btn btn--ghost btn--sm">Ver todos</a></div>
            <div class="list">${low.slice(0, 5).map((p) => `<div class="list__item">
              <span class="cell-product__img">${media(p)}</span>
              <div class="list__main"><strong>${esc(p.name)}</strong><small>${esc(p.sku)}</small></div>
              <span class="stock-cell ${p.stock <= 0 ? "stock-cell--out" : "stock-cell--low"}">${p.stock} u.</span>
              <button type="button" class="btn btn--outline btn--sm" data-restock="${esc(p.id)}">Reponer</button></div>`).join("") || `<p class="muted">Todo el inventario está en orden.</p>`}</div>
          </section>
        </div>`;

      A.lineChart($("#sales-chart"), { labels: series.labels, values: series.values, name: "Ventas" });
      const tbtn = $("#sales-table-btn");
      tbtn.addEventListener("click", () => {
        const t = $("#sales-table");
        t.hidden = !t.hidden;
        tbtn.setAttribute("aria-expanded", !t.hidden);
        tbtn.textContent = t.hidden ? "Ver tabla" : "Ocultar tabla";
        t.innerHTML = `<table class="data-table-mini"><thead><tr><th>Período</th><th>Ventas</th></tr></thead><tbody>${series.labels.map((l, i) => `<tr><td>${esc(l)}</td><td>${money(series.values[i])}</td></tr>`).join("")}</tbody></table>`;
      });
      A.donutChart($("#cat-chart"), { items: Object.entries(window.NOVA_STATS.byCategory).map(([label, v]) => ({ label, value: Math.round(v * ratio) })), fmt: A.fmtCompact, centerLabel: "Ventas", stack: true });
      A.barList($("#status-chart"), Object.entries(statusMix).map(([label, f]) => ({ label, value: Math.round(cur.orders * f) })));
      $$("[data-href]").forEach((tr) => {
        tr.addEventListener("click", () => { location.href = tr.dataset.href; });
        tr.addEventListener("keydown", (e) => { if (e.key === "Enter") location.href = tr.dataset.href; });
      });
      $$("[data-restock]").forEach((b) => b.addEventListener("click", () => restockModal(b.dataset.restock, render)));
    }
    render();
  };

  function restockModal(id, after) {
    const list = data.products();
    const p = list.find((x) => x.id === id);
    A.modal({
      title: "Reponer stock", sub: `${esc(p.name)} · stock actual: <strong>${p.stock}</strong>`,
      body: `<div class="field"><label for="rs-qty">Unidades a agregar</label><input class="input" id="rs-qty" type="number" min="1" value="20"><span class="field__error">Ingresá una cantidad mayor a 0.</span></div>`,
      foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-ok>Guardar stock</button>`,
      onOpen(el, close) {
        $("[data-ok]", el).addEventListener("click", () => {
          if (!A.validateFields(el, { "rs-qty": (v) => Number(v) > 0 })) return;
          p.stock += Number($("#rs-qty", el).value);
          data.saveProducts(list);
          close();
          toast(`Stock actualizado: ${p.name} (${p.stock} u.)`, "success");
          after && after();
        });
      }
    });
  }

  /* =========================================================
     PRODUCTOS
     ========================================================= */
  Pages.productos = function () {
    const state = { q: "", cat: "", status: "", stock: qs.get("stock") === "bajo" ? "bajo" : "", photo: "", page: 1, selected: new Set() };
    const SIZE = 10;
    $("#head-actions").innerHTML = `<button type="button" class="btn btn--outline" id="export">${icon("download")} Exportar CSV</button>
      <button type="button" class="btn btn--outline" id="import">${icon("download")} Importar Excel</button>
      <button type="button" class="btn btn--dark" id="add">+ Agregar producto</button>`;
    $("#page").innerHTML = `<section class="card card--flush">
      <div class="table-tools">
        <div class="search-box">${N.icon("search")}<label for="p-q" class="sr-only">Buscar productos</label><input class="input" id="p-q" type="search" placeholder="Buscar por nombre o SKU"></div>
        <label for="p-cat" class="sr-only">Categoría</label>
        <select class="select" id="p-cat"><option value="">Todas las categorías</option>${window.NOVA_CATEGORIES.filter((c) => !c.virtual).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>
        <label for="p-status" class="sr-only">Estado</label>
        <select class="select" id="p-status"><option value="">Todos los estados</option><option>Activo</option><option>Agotado</option><option>Borrador</option><option>Archivado</option></select>
        <label for="p-stock" class="sr-only">Stock</label>
        <select class="select" id="p-stock"><option value="">Todo el stock</option><option value="bajo">Stock bajo (≤ ${window.NOVA_STATS.lowStockThreshold})</option><option value="sin">Sin stock</option></select>
        <label for="p-photo" class="sr-only">Fotos</label>
        <select class="select" id="p-photo"><option value="">Con y sin fotos</option><option value="sin">Sin fotos</option><option value="con">Con fotos</option></select>
      </div>
      <div id="bulk"></div>
      <div class="table-wrap"><table class="table table--stack">
        <thead><tr><th class="td-check"><input type="checkbox" id="check-all" aria-label="Seleccionar todos"></th><th>Producto</th><th>SKU</th><th>Categoría</th><th class="num">Precio</th><th class="num">Stock</th><th>Estado</th><th class="num">Acciones</th></tr></thead>
        <tbody id="rows"></tbody>
      </table></div>
      <div class="table-foot" id="foot"></div>
    </section>`;
    $("#p-stock").value = state.stock;

    function filtered() {
      const q = N.normalize(state.q);
      const th = window.NOVA_STATS.lowStockThreshold;
      return data.products().filter((p) =>
        (!q || N.normalize(p.name + " " + p.sku + " " + p.brand).includes(q)) &&
        (!state.cat || p.category === state.cat) &&
        (!state.status || productStatus(p) === state.status) &&
        (!state.stock || (state.stock === "bajo" ? p.stock <= th : p.stock <= 0)) &&
        (!state.photo || (state.photo === "sin") === !(Array.isArray(p.images) && p.images.some(Boolean))));
    }
    function render() {
      const list = filtered();
      const pages = Math.max(1, Math.ceil(list.length / SIZE));
      if (state.page > pages) state.page = pages;
      const rows = paginate(list, state.page, SIZE);
      $("#rows").innerHTML = rows.length ? rows.map((p) => {
        const st = productStatus(p);
        const stockCls = p.stock <= 0 ? "stock-cell--out" : p.stock <= window.NOVA_STATS.lowStockThreshold ? "stock-cell--low" : "";
        return `<tr>
          <td class="td-check"><input type="checkbox" data-sel="${esc(p.id)}" ${state.selected.has(p.id) ? "checked" : ""} aria-label="Seleccionar ${esc(p.name)}"></td>
          <td class="td-main" data-label="Producto"><div class="cell-product"><span class="cell-product__img">${media(p)}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.brand || "")}${Array.isArray(p.images) && p.images.some(Boolean) ? "" : ` · <span style="color:var(--warning)">Sin fotos</span>`}</small></div></div></td>
          <td data-label="SKU" class="muted">${esc(p.sku)}</td>
          <td data-label="Categoría">${esc(cat(p.category))}</td>
          <td data-label="Precio" class="num"><strong>${money(p.price)}</strong>${p.oldPrice ? `<br><small class="muted" style="text-decoration:line-through">${money(p.oldPrice)}</small>` : ""}</td>
          <td data-label="Stock" class="num"><span class="stock-cell ${stockCls}">${p.stock}</span></td>
          <td data-label="Estado">${badge(st)}</td>
          <td data-label="Acciones"><div class="row-actions">
            <a href="../producto.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener" aria-label="Ver ${esc(p.name)} en la tienda" title="Ver">${icon("eye")}</a>
            <button type="button" data-edit="${esc(p.id)}" aria-label="Editar ${esc(p.name)}" title="Editar">${icon("edit")}</button>
            <button type="button" data-dup="${esc(p.id)}" aria-label="Duplicar ${esc(p.name)}" title="Duplicar">${icon("copy")}</button>
            <button type="button" class="danger" data-del="${esc(p.id)}" aria-label="Eliminar ${esc(p.name)}" title="Eliminar">${N.icon("trash")}</button>
          </div></td></tr>`;
      }).join("") : `<tr><td colspan="8" class="table-empty">No hay productos que coincidan con los filtros. <button type="button" class="link" style="background:none;border:0" id="reset">Limpiar filtros</button></td></tr>`;
      pager($("#foot"), list.length, state.page, SIZE, (p) => { state.page = p; render(); });
      renderBulk();
      const reset = $("#reset");
      if (reset) reset.addEventListener("click", () => { Object.assign(state, { q: "", cat: "", status: "", stock: "", photo: "" }); ["#p-q", "#p-cat", "#p-status", "#p-stock", "#p-photo"].forEach((s) => { $(s).value = ""; }); render(); });
      $$("[data-sel]").forEach((c) => c.addEventListener("change", () => { c.checked ? state.selected.add(c.dataset.sel) : state.selected.delete(c.dataset.sel); renderBulk(); }));
      $$("[data-edit]").forEach((b) => b.addEventListener("click", () => productForm(b.dataset.edit)));
      $$("[data-dup]").forEach((b) => b.addEventListener("click", () => duplicate(b.dataset.dup)));
      $$("[data-del]").forEach((b) => b.addEventListener("click", () => remove([b.dataset.del])));
      $("#check-all").checked = rows.length && rows.every((p) => state.selected.has(p.id));
    }
    function renderBulk() {
      const n = state.selected.size;
      $("#bulk").innerHTML = n ? `<div class="bulk-bar"><span>${n} ${n === 1 ? "seleccionado" : "seleccionados"}</span>
        <button type="button" class="btn btn--light btn--sm" data-bulk="Activo">Activar</button>
        <button type="button" class="btn btn--light btn--sm" data-bulk="Borrador">Pasar a borrador</button>
        <button type="button" class="btn btn--accent btn--sm" data-bulk="del">Eliminar</button>
        <button type="button" class="btn btn--ghost btn--sm" style="color:#fff;margin-left:auto" data-bulk="none">Cancelar</button></div>` : "";
      $$("[data-bulk]").forEach((b) => b.addEventListener("click", () => {
        const act = b.dataset.bulk;
        if (act === "none") { state.selected.clear(); render(); return; }
        if (act === "del") { remove([...state.selected]); return; }
        const list = data.products().map((p) => state.selected.has(p.id) ? { ...p, status: act } : p);
        data.saveProducts(list);
        toast(`${n} productos actualizados`, "success");
        state.selected.clear(); render();
      }));
    }
    function duplicate(id) {
      const list = data.products();
      const i = list.findIndex((p) => p.id === id);
      const src = list[i];
      let n = 2; while (list.some((p) => p.id === `${src.id}-${n}`)) n++;
      const copy = { ...src, id: `${src.id}-${n}`, sku: `${src.sku}-${n}`, name: `${src.name} (copia)`, status: "Borrador", sold: 0, reviews: 0, featured: false, createdAt: new Date().toISOString().slice(0, 10) };
      list.splice(i + 1, 0, copy);
      data.saveProducts(list);
      toast("Producto duplicado como borrador", "success");
      render();
    }
    async function remove(ids) {
      const one = ids.length === 1 ? data.products().find((p) => p.id === ids[0]) : null;
      const ok = await A.confirmDialog({ title: one ? "Eliminar producto" : `Eliminar ${ids.length} productos`, text: one ? `¿Seguro que querés eliminar <strong>${esc(one.name)}</strong>? Esta acción no se puede deshacer.` : "Los productos seleccionados se eliminarán del catálogo." });
      if (!ok) return;
      data.saveProducts(data.products().filter((p) => !ids.includes(p.id)));
      ids.forEach((id) => state.selected.delete(id));
      toast(ids.length === 1 ? "Producto eliminado" : `${ids.length} productos eliminados`, "info");
      render();
    }

    function productForm(id) {
      const list = data.products();
      const editing = id ? list.find((p) => p.id === id) : null;
      const p = editing || { name: "", sku: "", category: "tecnologia", brand: "Nova", price: "", oldPrice: "", stock: "", description: "", status: "Activo", icon: "tag", hue: 220 };
      const MAX_PHOTOS = 6;
      let photos = editing && Array.isArray(editing.images) ? editing.images.filter(Boolean).slice() : [];
      const photoSrc = (s) => (/^(data:|https?:|\/|\.\.\/)/.test(s) ? s : (window.NOVA_BASE || "") + s);
      const preview = () => N.art({ icon: $("#f-icon") ? $("#f-icon").value : p.icon, hue: $("#f-hue") ? $("#f-hue").value : p.hue, name: "" });
      // Reduce la foto (máx. 1000 px, JPEG) para que entren varias en el almacenamiento del navegador
      const compress = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("read"));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error("img"));
          img.onload = () => {
            const k = Math.min(1, 1000 / Math.max(img.width, img.height));
            const c = document.createElement("canvas");
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            const g = c.getContext("2d");
            g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
            g.drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL("image/jpeg", 0.82));
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
      A.modal({
        title: editing ? "Editar producto" : "Agregar producto", size: "lg",
        sub: editing ? `SKU ${esc(p.sku)} · los cambios se ven en la tienda al instante` : "Completá los datos para publicarlo en la tienda.",
        body: `<form id="product-form" novalidate><div class="form-grid">
          <div class="field span-2"><label for="f-name">Nombre</label><input class="input" id="f-name" value="${esc(p.name)}" required><span class="field__error">Ingresá un nombre (mín. 3 caracteres).</span></div>
          <div class="field"><label for="f-sku">SKU</label><input class="input" id="f-sku" value="${esc(p.sku)}" placeholder="NV-XXX-000" required><span class="field__error">SKU obligatorio y único.</span></div>
          <div class="field"><label for="f-cat">Categoría</label><select class="select" id="f-cat">${window.NOVA_CATEGORIES.filter((c) => !c.virtual).map((c) => `<option value="${c.id}"${c.id === p.category ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
          <div class="field"><label for="f-price">Precio</label><div class="input-prefix"><span>$</span><input class="input" id="f-price" type="number" min="0" value="${esc(p.price)}" required></div><span class="field__error">Ingresá un precio válido.</span></div>
          <div class="field"><label for="f-old">Precio anterior <small style="font-weight:400;color:var(--muted)">(opcional)</small></label><div class="input-prefix"><span>$</span><input class="input" id="f-old" type="number" min="0" value="${esc(p.oldPrice || "")}"></div><span class="field__error">Debe ser mayor al precio actual.</span></div>
          <div class="field"><label for="f-stock">Stock</label><input class="input" id="f-stock" type="number" min="0" value="${esc(p.stock)}" required><span class="field__error">Ingresá el stock.</span></div>
          <div class="field"><label for="f-brand">Marca</label><select class="select" id="f-brand">${window.NOVA_BRANDS.map((b) => `<option${b === p.brand ? " selected" : ""}>${esc(b)}</option>`).join("")}</select></div>
          <div class="field span-2"><label for="f-desc">Descripción</label><textarea class="textarea" id="f-desc" required>${esc(p.description)}</textarea><span class="field__error">Escribí una descripción (mín. 10 caracteres).</span></div>
          <div class="field span-2"><span class="label">Fotos <small style="font-weight:400;color:var(--muted)">(hasta ${MAX_PHOTOS} · la primera es la principal)</small></span>
            <div class="photo-grid" id="f-photos"></div>
            <div class="img-drop"><div class="img-drop__preview" id="f-preview"></div>
              <div style="display:grid;gap:8px;flex:1">
                <label for="f-file" class="sr-only">Subir fotos</label><input type="file" id="f-file" accept="image/*" multiple>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label for="f-icon" style="font-size:13px;color:var(--muted)">Sin fotos, se usa esta ilustración:</label>
                  <select class="select" id="f-icon" style="width:auto;min-height:36px;font-size:13px">${ICON_OPTIONS.map((i) => `<option${i === p.icon ? " selected" : ""}>${i}</option>`).join("")}</select>
                  <label for="f-hue" class="sr-only">Tono</label><input type="range" id="f-hue" min="0" max="360" value="${p.hue}" aria-label="Tono de color" style="accent-color:var(--ink)"></div>
                <small style="color:var(--muted)">Podés elegir varias fotos a la vez. Se achican solas y se guardan solo en este navegador (demo).</small>
              </div></div></div>
          <div class="field"><label for="f-status">Estado</label><select class="select" id="f-status">${["Activo", "Borrador", "Archivado"].map((s) => `<option${s === (p.status || "Activo") ? " selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field" style="justify-content:flex-end"><label class="check" style="min-height:48px"><input type="checkbox" id="f-featured" ${p.featured ? "checked" : ""}> Mostrar en destacados</label></div>
        </div></form>`,
        foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-save>${editing ? "Guardar cambios" : "Crear producto"}</button>`,
        onOpen(el, close) {
          const grid = $("#f-photos", el);
          const refresh = () => {
            $("#f-preview", el).innerHTML = preview();
            $(".img-drop", el).hidden = false;
            grid.hidden = !photos.length;
            grid.innerHTML = photos.map((s, i) => `<div class="photo-grid__item">
              <img src="${esc(photoSrc(s))}" alt="Foto ${i + 1}">
              ${i === 0 ? `<span class="photo-grid__tag">Principal</span>` : `<button type="button" class="photo-grid__btn photo-grid__main" data-main="${i}" title="Hacer principal" aria-label="Hacer principal la foto ${i + 1}">★</button>`}
              <button type="button" class="photo-grid__btn photo-grid__rm" data-rm="${i}" title="Quitar" aria-label="Quitar la foto ${i + 1}">✕</button></div>`).join("");
            $("#f-file", el).disabled = photos.length >= MAX_PHOTOS;
          };
          refresh();
          grid.addEventListener("click", (e) => {
            const rm = e.target.closest("[data-rm]"), mn = e.target.closest("[data-main]");
            if (rm) photos.splice(+rm.dataset.rm, 1);
            else if (mn) photos.unshift(photos.splice(+mn.dataset.main, 1)[0]);
            else return;
            refresh();
          });
          $("#f-icon", el).addEventListener("change", refresh);
          $("#f-hue", el).addEventListener("input", refresh);
          $("#f-file", el).addEventListener("change", async (e) => {
            const files = Array.from(e.target.files || []);
            e.target.value = "";
            if (!files.length) return;
            const room = MAX_PHOTOS - photos.length;
            if (files.length > room) toast(`Solo entran ${MAX_PHOTOS} fotos: se agregaron ${room}.`, "info");
            for (const file of files.slice(0, room)) {
              if (!file.type.startsWith("image/")) { toast(`“${file.name}” no es una imagen`, "error"); continue; }
              try { photos.push(await compress(file)); } catch (err) { toast(`No se pudo leer “${file.name}”`, "error"); }
            }
            refresh();
          });
          $$(".input, .textarea", el).forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("has-error")));
          $("[data-save]", el).addEventListener("click", () => {
            const price = Number($("#f-price", el).value);
            const ok = A.validateFields(el, {
              "f-name": (v) => v.trim().length >= 3,
              "f-sku": (v) => v.trim().length >= 3 && !list.some((x) => x.sku.toLowerCase() === v.trim().toLowerCase() && x !== editing),
              "f-price": (v) => v !== "" && Number(v) > 0,
              "f-old": (v) => !v || Number(v) > price,
              "f-stock": (v) => v !== "" && Number(v) >= 0,
              "f-desc": (v) => v.trim().length >= 10
            });
            if (!ok) { toast("Revisá los campos marcados", "error"); return; }
            const name = $("#f-name", el).value.trim();
            const values = {
              name, sku: $("#f-sku", el).value.trim().toUpperCase(), category: $("#f-cat", el).value, brand: $("#f-brand", el).value,
              price, oldPrice: Number($("#f-old", el).value) || undefined, stock: Number($("#f-stock", el).value),
              description: $("#f-desc", el).value.trim(), status: $("#f-status", el).value, featured: $("#f-featured", el).checked,
              icon: $("#f-icon", el).value, hue: Number($("#f-hue", el).value)
            };
            values.images = photos.length ? photos.slice() : undefined;
            if (editing) Object.assign(editing, values);
            else {
              let slug = N.normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "producto";
              while (list.some((x) => x.id === slug)) slug += "-1";
              list.unshift({ id: slug, rating: 0, reviews: 0, sold: 0, createdAt: new Date().toISOString().slice(0, 10), features: [], specs: {}, ...values });
            }
            try { data.saveProducts(list); } catch (e) { toast("No se pudo guardar (almacenamiento lleno)", "error"); return; }
            close();
            toast(editing ? "Producto actualizado" : "Producto creado", "success");
            render();
          });
        }
      });
    }

    let t;
    $("#p-q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; state.page = 1; render(); }, 200); });
    $("#p-cat").addEventListener("change", (e) => { state.cat = e.target.value; state.page = 1; render(); });
    $("#p-status").addEventListener("change", (e) => { state.status = e.target.value; state.page = 1; render(); });
    $("#p-stock").addEventListener("change", (e) => { state.stock = e.target.value; state.page = 1; render(); });
    $("#p-photo").addEventListener("change", (e) => { state.photo = e.target.value; state.page = 1; render(); });
    $("#check-all").addEventListener("change", (e) => {
      paginate(filtered(), state.page, SIZE).forEach((p) => e.target.checked ? state.selected.add(p.id) : state.selected.delete(p.id));
      render();
    });

    /* ---------- Importar desde Excel ---------- */
    function importExcel() {
      let result = null;
      A.modal({
        title: "Importar productos desde Excel", size: "lg",
        sub: "Cargá todo el catálogo de una vez. Las fotos las agregás después, producto por producto.",
        body: `<div style="display:grid;gap:14px">
          <ol style="margin:0;padding-left:20px;display:grid;gap:6px;color:var(--muted);font-size:14px">
            <li><a class="link" href="${(window.NOVA_BASE || "")}assets/plantilla-productos.xlsx" download>Descargá la plantilla de Excel</a> y completá una fila por producto.</li>
            <li>Si el SKU ya existe, se <strong>actualiza</strong> ese producto; si no, se <strong>crea</strong>.</li>
            <li>Subí el archivo (.xlsx o .csv): vas a ver una vista previa antes de importar.</li>
          </ol>
          <div class="field"><label for="imp-file">Archivo</label><input type="file" id="imp-file" accept=".xlsx,.xlsm,.csv,.txt"></div>
          <div id="imp-out" aria-live="polite"></div></div>`,
        foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-import-go disabled>Importar</button>`,
        onOpen(el, close) {
          const out = $("#imp-out", el), go = $("[data-import-go]", el);
          $("#imp-file", el).addEventListener("change", async (e) => {
            const file = e.target.files[0];
            result = null; go.disabled = true; go.textContent = "Importar";
            if (!file) { out.innerHTML = ""; return; }
            out.innerHTML = `<div class="alert alert--info">Leyendo “${esc(file.name)}”…</div>`;
            let rows;
            try { rows = await window.NovaImport.readFile(file); }
            catch (err) {
              const m = { format: "Formato no soportado: usá un archivo .xlsx o .csv.", nosupport: "Tu navegador es muy viejo para leer .xlsx. Guardalo como .csv o usá Chrome/Edge/Firefox actualizado." }[err.message] || "No pude leer el archivo. Verificá que sea un .xlsx válido (no uno con contraseña).";
              out.innerHTML = `<div class="alert alert--danger">${m}</div>`; return;
            }
            const r = window.NovaImport.parse(rows, data.products(), window.NOVA_CATEGORIES);
            result = r;
            const nNew = r.items.filter((x) => x.isNew).length, nUpd = r.items.length - nNew;
            out.innerHTML = `
              ${r.fatal ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                <span class="status status--success">${nNew} nuevos</span><span class="status status--info">${nUpd} a actualizar</span>
                <span class="status status--${r.errors.length ? "danger" : "neutral"}">${r.errors.length} con errores</span></div>`}
              ${r.errors.length ? `<div class="alert alert--danger" style="margin-bottom:12px"><div><strong>${r.fatal ? "No se puede importar" : "Estas filas se van a saltear:"}</strong>
                <ul style="margin:6px 0 0;padding-left:18px;max-height:140px;overflow:auto">${r.errors.map((x) => `<li>Fila ${x.row}${x.sku ? ` (${esc(x.sku)})` : ""}: ${esc(x.msg)}</li>`).join("")}</ul></div></div>` : ""}
              ${r.items.length ? `<div class="table-wrap" style="max-height:220px;overflow:auto"><table class="table"><thead><tr><th>Fila</th><th>SKU</th><th>Producto</th><th>Categoría</th><th class="num">Precio</th><th class="num">Stock</th><th></th></tr></thead><tbody>
                ${r.items.slice(0, 50).map((x) => `<tr><td>${x.row}</td><td>${esc(x.values.sku)}</td><td>${esc(x.values.name)}</td><td>${esc(cat(x.values.category))}</td><td class="num">${money(x.values.price)}</td><td class="num">${x.values.stock}</td><td>${x.isNew ? "Nuevo" : "Actualiza"}</td></tr>`).join("")}
                </tbody></table></div>${r.items.length > 50 ? `<small class="muted">Mostrando 50 de ${r.items.length}.</small>` : ""}` : ""}`;
            if (r.items.length) { go.disabled = false; go.textContent = `Importar ${r.items.length} producto${r.items.length === 1 ? "" : "s"}`; }
          });
          go.addEventListener("click", () => {
            if (!result || !result.items.length) return;
            const list = data.products();
            const today = new Date().toISOString().slice(0, 10);
            let created = 0, updated = 0;
            result.items.forEach((it) => {
              const c = window.NOVA_CATEGORIES.find((x) => x.id === it.values.category) || {};
              if (!it.isNew) { Object.assign(list.find((p) => p.id === it.prevId), it.values); updated++; return; }
              let slug = N.normalize(it.values.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "producto";
              while (list.some((x) => x.id === slug)) slug += "-1";
              list.unshift({ id: slug, rating: 0, reviews: 0, sold: 0, createdAt: today, features: [], specs: {}, icon: c.icon || "tag", hue: c.hue ?? 220, ...it.values });
              created++;
            });
            try { data.saveProducts(list); } catch (e) { toast("No se pudo guardar (almacenamiento lleno)", "error"); return; }
            close();
            window.NOVA_BRANDS = Array.from(new Set(window.NOVA_BRANDS.concat(list.map((p) => p.brand).filter(Boolean))));
            Object.assign(state, { q: "", cat: "", status: "", stock: "", photo: "sin", page: 1 });
            ["#p-q", "#p-cat", "#p-status", "#p-stock"].forEach((s) => { $(s).value = ""; });
            $("#p-photo").value = "sin";
            toast(`Importación lista: ${created} nuevos, ${updated} actualizados. Ahora agregales las fotos.`, "success");
            render();
          });
        }
      });
    }
    $("#import").addEventListener("click", importExcel);
    $("#add").addEventListener("click", () => productForm(null));
    $("#export").addEventListener("click", () => A.downloadCsv("nova-productos.csv", [["SKU", "Producto", "Categoría", "Marca", "Precio", "Precio anterior", "Stock", "Estado"]]
      .concat(filtered().map((p) => [p.sku, p.name, cat(p.category), p.brand, p.price, p.oldPrice || "", p.stock, productStatus(p)]))));
    render();
    if (qs.get("edit")) productForm(qs.get("edit"));
  };

  /* =========================================================
     CATEGORÍAS
     ========================================================= */
  Pages.categorias = function () {
    $("#head-actions").innerHTML = `<button type="button" class="btn btn--dark" id="add">+ Nueva categoría</button>`;
    const sales = window.NOVA_STATS.byCategory;
    function render() {
      const products = data.products();
      $("#page").innerHTML = `<div class="cat-admin">${data.categories().map((c) => {
        const count = c.virtual ? products.filter((p) => N.discountPct(p) > 0).length : products.filter((p) => p.category === c.id).length;
        const stock = products.filter((p) => p.category === c.id).reduce((n, p) => n + p.stock, 0);
        return `<article class="card cat-admin__card">
          <div class="cat-admin__media">${N.art({ icon: c.icon, hue: c.hue, name: c.name }, c.virtual ? 1 : 0)}</div>
          <div class="cat-admin__body">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><h2>${esc(c.name)}</h2>${c.virtual ? badge("Automática") : badge("Activo")}</div>
            <p>${esc(c.description || "")}</p>
            <div class="cat-admin__meta"><span><strong>${count}</strong> productos</span>${c.virtual ? "<span>Productos con descuento</span>" : `<span><strong>${A.fmtNum(stock)}</strong> u. en stock</span>`}${sales[c.name] ? `<span><strong>${A.fmtCompact(sales[c.name])}</strong> (30 d)</span>` : ""}</div>
          </div>
          <div class="cat-admin__foot">
            <a class="btn btn--outline btn--sm" href="../productos.html?${c.virtual ? "ofertas=1" : "cat=" + c.id}" target="_blank" rel="noopener">${icon("eye", "icon icon--sm")} Ver en tienda</a>
            <button type="button" class="btn btn--ghost btn--sm" data-edit="${c.id}">${icon("edit", "icon icon--sm")} Editar</button>
            ${c.virtual ? "" : `<button type="button" class="btn btn--ghost btn--sm" data-del="${c.id}" style="margin-left:auto" aria-label="Eliminar ${esc(c.name)}">${N.icon("trash", "icon icon--sm")}</button>`}
          </div></article>`;
      }).join("")}</div>`;
      $$("[data-edit]").forEach((b) => b.addEventListener("click", () => form(b.dataset.edit)));
      $$("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        const c = data.categories().find((x) => x.id === b.dataset.del);
        const count = data.products().filter((p) => p.category === c.id).length;
        if (count) { A.modal({ title: "No se puede eliminar", body: `<p style="color:var(--muted)">La categoría <strong>${esc(c.name)}</strong> tiene ${count} productos. Mové o eliminá esos productos primero.</p>`, foot: `<a class="btn btn--dark" href="productos.html">Ir a productos</a>` }); return; }
        if (!(await A.confirmDialog({ title: "Eliminar categoría", text: `¿Eliminar <strong>${esc(c.name)}</strong>?` }))) return;
        data.saveCategories(data.categories().filter((x) => x.id !== c.id));
        toast("Categoría eliminada", "info"); render();
      }));
    }
    function form(id) {
      const list = data.categories();
      const c = id ? list.find((x) => x.id === id) : { name: "", description: "", icon: "tag", hue: 200 };
      A.modal({
        title: id ? "Editar categoría" : "Nueva categoría",
        body: `<div style="display:grid;gap:16px">
          <div class="img-drop"><div class="img-drop__preview" id="c-prev"></div><div style="display:grid;gap:8px;flex:1">
            <label for="c-icon" class="label">Ilustración</label><select class="select" id="c-icon">${ICON_OPTIONS.map((i) => `<option${i === c.icon ? " selected" : ""}>${i}</option>`).join("")}</select>
            <input type="range" id="c-hue" min="0" max="360" value="${c.hue}" aria-label="Tono de color" style="accent-color:var(--ink)"></div></div>
          <div class="field"><label for="c-name">Nombre</label><input class="input" id="c-name" value="${esc(c.name)}"><span class="field__error">Ingresá un nombre único.</span></div>
          <div class="field"><label for="c-desc">Descripción</label><textarea class="textarea" id="c-desc">${esc(c.description || "")}</textarea></div>
        </div>`,
        foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-save>Guardar</button>`,
        onOpen(el, close) {
          const prev = () => { $("#c-prev", el).innerHTML = N.art({ icon: $("#c-icon", el).value, hue: $("#c-hue", el).value, name: "" }); };
          prev();
          $("#c-icon", el).addEventListener("change", prev);
          $("#c-hue", el).addEventListener("input", prev);
          $("[data-save]", el).addEventListener("click", () => {
            const name = $("#c-name", el).value.trim();
            if (!A.validateFields(el, { "c-name": (v) => v.trim().length >= 2 && !list.some((x) => x !== c && N.normalize(x.name) === N.normalize(v)) })) return;
            const vals = { name, description: $("#c-desc", el).value.trim(), icon: $("#c-icon", el).value, hue: Number($("#c-hue", el).value) };
            if (id) Object.assign(c, vals);
            else list.splice(list.length - 1, 0, { id: N.normalize(name).replace(/[^a-z0-9]+/g, "-"), ...vals });
            data.saveCategories(list);
            close(); toast(id ? "Categoría actualizada" : "Categoría creada", "success"); render();
          });
        }
      });
    }
    $("#add").addEventListener("click", () => form(null));
    render();
  };

  /* =========================================================
     PEDIDOS
     ========================================================= */
  Pages.pedidos = function () {
    const state = { status: qs.get("estado") || "", q: "", pay: "", page: 1 };
    const SIZE = 10;
    $("#head-actions").innerHTML = `<button type="button" class="btn btn--outline" id="export">${icon("download")} Exportar CSV</button>`;
    $("#page").innerHTML = `<section class="card card--flush">
      <div class="tabs-inline" role="tablist" id="tabs"></div>
      <div class="table-tools">
        <div class="search-box">${N.icon("search")}<label for="o-q" class="sr-only">Buscar pedidos</label><input class="input" id="o-q" type="search" placeholder="Buscar por número o cliente"></div>
        <label for="o-pay" class="sr-only">Medio de pago</label>
        <select class="select" id="o-pay"><option value="">Todos los pagos</option><option>Mercado Pago</option><option>Tarjeta</option><option>Transferencia</option></select>
      </div>
      <div class="table-wrap"><table class="table table--stack">
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th class="num">Productos</th><th class="num">Total</th><th>Pago</th><th>Envío</th><th>Estado</th><th class="num">Acciones</th></tr></thead>
        <tbody id="rows"></tbody></table></div>
      <div class="table-foot" id="foot"></div></section>`;

    const all = () => data.orders();
    function filtered() {
      const q = N.normalize(state.q);
      return all().filter((o) => (!state.status || data.orderStatus(o) === state.status) && (!state.pay || o.payment === state.pay) &&
        (!q || N.normalize(o.id + " " + data.customerOf(o).name + " " + data.customerOf(o).email).includes(q)));
    }
    function renderTabs() {
      const list = all();
      $("#tabs").innerHTML = [["", "Todos", list.length]].concat(A.ORDER_STATUSES.map((s) => [s, s, list.filter((o) => data.orderStatus(o) === s).length]))
        .map(([v, l, n]) => `<button type="button" role="tab" aria-selected="${state.status === v}" data-status="${v}">${l}<span>${n}</span></button>`).join("");
      $$("[data-status]").forEach((b) => b.addEventListener("click", () => { state.status = b.dataset.status; state.page = 1; renderTabs(); render(); }));
    }
    function render() {
      const list = filtered();
      const rows = paginate(list, state.page, SIZE);
      $("#rows").innerHTML = rows.length ? rows.map((o) => {
        const c = data.customerOf(o);
        const st = data.orderStatus(o);
        const items = N.orderLines(o).reduce((n, l) => n + l.qty, 0);
        return `<tr class="is-clickable" data-open="${o.id}">
          <td class="td-main" data-label="Pedido"><strong>#${esc(o.id)}</strong></td>
          <td data-label="Cliente"><div class="cell-user"><span class="avatar">${A.initials(c.name)}</span><div>${esc(c.name)}<small>${esc(c.email)}</small></div></div></td>
          <td data-label="Fecha" class="muted">${A.fmtDateTime(o.date)}</td>
          <td data-label="Productos" class="num">${items}</td>
          <td data-label="Total" class="num"><strong>${money(N.orderTotal(o))}</strong></td>
          <td data-label="Pago">${esc(o.payment)}</td>
          <td data-label="Envío" class="muted">${esc(o.shipping)}</td>
          <td data-label="Estado" data-stop><label class="sr-only" for="st-${o.id}">Estado del pedido ${o.id}</label>${statusSelect(st, A.ORDER_STATUSES, `id="st-${o.id}" data-status-of="${o.id}"`)}</td>
          <td data-label="Acciones" data-stop><div class="row-actions"><button type="button" data-view="${o.id}" aria-label="Ver detalle del pedido ${o.id}" title="Ver detalle">${icon("eye")}</button></div></td>
        </tr>`;
      }).join("") : `<tr><td colspan="9" class="table-empty">No hay pedidos con estos filtros.</td></tr>`;
      pager($("#foot"), list.length, state.page, SIZE, (p) => { state.page = p; render(); });
      $$("[data-open]").forEach((tr) => tr.addEventListener("click", (e) => { if (!e.target.closest("[data-stop]")) openOrder(tr.dataset.open); }));
      $$("[data-view]").forEach((b) => b.addEventListener("click", () => openOrder(b.dataset.view)));
      $$("[data-status-of]").forEach((s) => s.addEventListener("change", () => {
        data.setOrderStatus(s.dataset.statusOf, s.value);
        s.className = `select-status status--${A.TONES[s.value]}`;
        toast(`Pedido #${s.dataset.statusOf} → ${s.value}`, "success");
        renderTabs();
      }));
    }

    function history(o, st) {
      const flow = ["Pendiente", "Confirmado", "Preparando", "Enviado", "Entregado"];
      const idx = st === "Cancelado" ? -1 : flow.indexOf(st);
      const base = new Date(o.date).getTime();
      const steps = [
        ["Pedido creado", `Canal: tienda online · ${esc(o.payment)}`],
        ["Pago confirmado", o.payment === "Transferencia" ? "Comprobante validado" : "Aprobado por el procesador (simulado)"],
        ["En preparación", "Armado en depósito"],
        ["Enviado", o.shipping === "Retiro en local" ? "Listo para retirar" : "Entregado al transportista"],
        ["Entregado", "Recibido por el cliente"]
      ];
      return `<ol class="history">${steps.map(([t, s], i) => {
        const done = i <= idx || (i === 0);
        const cls = st === "Cancelado" ? (i === 0 ? "is-done" : "") : i < idx ? "is-done" : i === idx ? "is-current" : "";
        return `<li class="${cls}"><strong style="${!done && st !== "Cancelado" ? "color:var(--muted);font-weight:500" : ""}">${t}</strong><small>${done && st !== "Cancelado" || i === 0 ? A.fmtDateTime(base + i * 18 * 36e5) + " · " + s : "Pendiente"}</small></li>`;
      }).join("")}${st === "Cancelado" ? `<li class="is-current"><strong style="color:var(--danger)">Pedido cancelado</strong><small>Se notificó al cliente y se liberó el stock</small></li>` : ""}</ol>`;
    }

    function openOrder(id) {
      const o = all().find((x) => x.id === id);
      if (!o) { toast("Pedido no encontrado", "error"); return; }
      const c = data.customerOf(o);
      const st = data.orderStatus(o);
      const lines = N.orderLines(o);
      const sub = lines.reduce((n, l) => n + l.price * l.qty, 0);
      const total = N.orderTotal(o);
      A.drawer({
        title: `Pedido #${o.id}`, sub: `${A.fmtDateTime(o.date)} · ${lines.length} ${lines.length === 1 ? "producto" : "productos"}`,
        body: `
          <div class="detail-block" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <label for="d-status" class="label">Estado</label>${statusSelect(st, A.ORDER_STATUSES, 'id="d-status"')}
          </div>
          <div class="detail-block"><h3>Cliente</h3><div class="detail-grid">
            <div><span>Nombre</span><strong>${esc(c.name)}</strong></div><div><span>Email</span><a class="link" href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>
            <div><span>Teléfono</span>${esc(c.phone || "—")}</div><div><span>Cliente desde</span>${c.since ? A.fmtDate(c.since, { month: "long", year: "numeric" }) : "Hoy"}</div></div></div>
          <div class="detail-block"><h3>Productos</h3><div class="list">${lines.map((l) => `<div class="list__item"><span class="cell-product__img">${media(l.product)}</span>
            <div class="list__main"><strong>${esc(l.product.name)}</strong><small>${l.qty} × ${money(l.price)}${l.variant ? " · " + esc(l.variant) : ""} · ${esc(l.product.sku)}</small></div><div class="list__end">${money(l.price * l.qty)}</div></div>`).join("")}</div></div>
          <div class="detail-block"><h3>Entrega y pago</h3><div class="detail-grid">
            <div style="grid-column:1/-1"><span>Dirección</span>${esc(addressOf(o))}</div>
            <div><span>Envío</span>${esc(o.shipping)}</div><div><span>Pago</span>${esc(o.payment)} · ${st === "Pendiente" ? "pendiente" : st === "Cancelado" ? "reintegrado" : "aprobado"}</div></div></div>
          <div class="detail-block"><h3>Resumen</h3><div class="totals">
            <div><span>Subtotal</span><span>${money(o.subtotal ?? sub)}</span></div>
            <div><span>Descuentos</span><span>${o.discount ? "−" + money(o.discount) : "$0"}</span></div>
            <div><span>Envío</span><span>${o.shippingCost ? money(o.shippingCost) : "Gratis"}</span></div>
            <div class="grand"><span>Total</span><span>${money(total)}</span></div></div></div>
          <div class="detail-block"><h3>Historial</h3>${history(o, st)}</div>`,
        foot: `<button type="button" class="btn btn--outline" data-mail>Enviar email al cliente</button><button type="button" class="btn btn--outline" data-print>Imprimir remito</button><button type="button" class="btn btn--dark" data-save>Guardar cambios</button>`,
        onOpen(el, close) {
          const sel = $("#d-status", el);
          sel.addEventListener("change", () => { sel.className = `select-status status--${A.TONES[sel.value]}`; });
          $("[data-save]", el).addEventListener("click", () => {
            data.setOrderStatus(o.id, sel.value);
            close(); toast(`Pedido #${o.id} actualizado a “${sel.value}”`, "success"); renderTabs(); render();
          });
          $("[data-mail]", el).addEventListener("click", () => toast(`Email enviado a ${c.email} (simulado)`, "success"));
          $("[data-print]", el).addEventListener("click", () => toast(`Remito del pedido #${o.id} generado (simulado)`, "info"));
        }
      });
    }

    let t;
    $("#o-q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; state.page = 1; render(); }, 200); });
    $("#o-pay").addEventListener("change", (e) => { state.pay = e.target.value; state.page = 1; render(); });
    $("#export").addEventListener("click", () => A.downloadCsv("nova-pedidos.csv", [["Pedido", "Cliente", "Email", "Fecha", "Total", "Pago", "Envío", "Estado"]]
      .concat(filtered().map((o) => { const c = data.customerOf(o); return [o.id, c.name, c.email, o.date.replace("T", " "), N.orderTotal(o), o.payment, o.shipping, data.orderStatus(o)]; }))));
    renderTabs(); render();
    if (qs.get("id")) openOrder(qs.get("id"));
  };

  /* =========================================================
     CLIENTES
     ========================================================= */
  Pages.clientes = function () {
    const state = { q: "", status: "", sort: "spent" };
    $("#head-actions").innerHTML = `<button type="button" class="btn btn--outline" id="export">${icon("download")} Exportar CSV</button>`;
    const S = window.NOVA_STATS.periods["30d"];
    $("#page").innerHTML = `
      <div class="grid grid--kpi">
        <section class="card kpi"><span class="kpi__label">Clientes totales</span><div class="kpi__value">${A.fmtNum(S.customers)}</div><div class="kpi__foot">${A.deltaHtml(7.9)} últimos 30 días</div></section>
        <section class="card kpi"><span class="kpi__label">Clientes nuevos</span><div class="kpi__value">${S.newCustomers}</div><div class="kpi__foot">${A.deltaHtml(12.3)} últimos 30 días</div></section>
        <section class="card kpi"><span class="kpi__label">Tasa de recompra</span><div class="kpi__value">${Math.round((S.returning / S.orders) * 100)}%</div><div class="kpi__foot">${A.deltaHtml(2.1)} vs. mes anterior</div></section>
        <section class="card kpi"><span class="kpi__label">Ticket promedio</span><div class="kpi__value">${money(S.ticket)}</div><div class="kpi__foot">${A.deltaHtml(4.6)} vs. mes anterior</div></section>
      </div>
      <section class="card card--flush" style="margin-top:20px">
        <div class="table-tools">
          <div class="search-box">${N.icon("search")}<label for="c-q" class="sr-only">Buscar clientes</label><input class="input" id="c-q" type="search" placeholder="Buscar por nombre, email o ciudad"></div>
          <label for="c-status" class="sr-only">Estado</label>
          <select class="select" id="c-status"><option value="">Todos los estados</option><option>Activo</option><option>VIP</option><option>Nuevo</option><option>Inactivo</option></select>
          <div class="table-tools__right"><label for="c-sort" class="sr-only">Ordenar</label>
          <select class="select" id="c-sort"><option value="spent">Mayor gasto</option><option value="orders">Más pedidos</option><option value="last">Compra más reciente</option><option value="name">Nombre A–Z</option></select></div>
        </div>
        <div class="table-wrap"><table class="table table--stack">
          <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th class="num">Pedidos</th><th class="num">Total gastado</th><th>Última compra</th><th>Estado</th></tr></thead>
          <tbody id="rows"></tbody></table></div>
        <div class="table-foot" id="foot"></div>
      </section>`;
    function filtered() {
      const q = N.normalize(state.q);
      const sorters = { spent: (a, b) => b.spent - a.spent, orders: (a, b) => b.count - a.count, last: (a, b) => String(b.last).localeCompare(String(a.last)), name: (a, b) => a.name.localeCompare(b.name) };
      return data.customers().filter((c) => (!state.status || c.status === state.status) && (!q || N.normalize(`${c.name} ${c.email} ${c.city}`).includes(q))).sort(sorters[state.sort]);
    }
    function render() {
      const list = filtered();
      $("#rows").innerHTML = list.length ? list.map((c) => `<tr class="is-clickable" data-open="${esc(c.id)}" tabindex="0">
        <td class="td-main" data-label="Nombre"><div class="cell-user"><span class="avatar">${A.initials(c.name)}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.city)}</small></div></div></td>
        <td data-label="Email">${esc(c.email)}</td>
        <td data-label="Teléfono" class="muted">${esc(c.phone || "—")}</td>
        <td data-label="Pedidos" class="num">${c.count}</td>
        <td data-label="Total gastado" class="num"><strong>${money(c.spent)}</strong></td>
        <td data-label="Última compra" class="muted">${c.last ? A.fmtDate(c.last, { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
        <td data-label="Estado">${badge(c.status)}</td></tr>`).join("") : `<tr><td colspan="7" class="table-empty">No encontramos clientes con esos filtros.</td></tr>`;
      $("#foot").innerHTML = `<span>${list.length} de ${data.customers().length} clientes (muestra de la base de datos)</span>`;
      $$("[data-open]").forEach((tr) => {
        tr.addEventListener("click", () => openCustomer(tr.dataset.open));
        tr.addEventListener("keydown", (e) => { if (e.key === "Enter") openCustomer(tr.dataset.open); });
      });
    }
    function openCustomer(id) {
      const c = data.customers().find((x) => x.id === id);
      if (!c) return;
      const avg = c.count ? c.spent / Math.max(1, c.orders.filter((o) => data.orderStatus(o) !== "Cancelado").length) : 0;
      A.drawer({
        title: c.name, sub: `${esc(c.email)} · ${badge(c.status)}`,
        body: `
          <div class="grid grid--3" style="gap:12px">
            <div class="card" style="padding:16px"><span class="kpi__label">Pedidos</span><div class="kpi__value" style="font-size:24px">${c.count}</div></div>
            <div class="card" style="padding:16px"><span class="kpi__label">Total gastado</span><div class="kpi__value" style="font-size:24px">${money(c.spent)}</div></div>
            <div class="card" style="padding:16px"><span class="kpi__label">Ticket promedio</span><div class="kpi__value" style="font-size:24px">${money(avg)}</div></div>
          </div>
          <div class="detail-block"><h3>Información</h3><div class="detail-grid">
            <div><span>Email</span><a class="link" href="mailto:${esc(c.email)}">${esc(c.email)}</a></div><div><span>Teléfono</span>${esc(c.phone || "—")}</div>
            <div><span>Ubicación</span>${esc(c.city)}${c.province ? ", " + esc(c.province) : ""}</div><div><span>Cliente desde</span>${A.fmtDate(c.since, { day: "numeric", month: "long", year: "numeric" })}</div></div></div>
          <div class="detail-block"><h3>Pedidos y compras</h3><div class="list">${c.orders.length ? c.orders.map((o) => `<div class="list__item">
            <div class="list__main"><strong><a class="link" href="pedidos.html?id=${o.id}">#${esc(o.id)}</a></strong><small>${A.fmtDateTime(o.date)} · ${N.orderLines(o).map((l) => esc(l.product.name)).join(", ")}</small></div>
            <div class="list__end">${money(N.orderTotal(o))}<small>${badge(data.orderStatus(o))}</small></div></div>`).join("") : `<p class="muted">Este cliente todavía no tiene pedidos en la muestra.</p>`}</div></div>`,
        foot: `<button type="button" class="btn btn--outline" data-coupon>Enviar cupón</button><a class="btn btn--dark" href="mailto:${esc(c.email)}">Contactar</a>`,
        onOpen(el) {
          $("[data-coupon]", el).addEventListener("click", () => {
            const active = data.coupons().filter((x) => x.status === "Activo");
            A.modal({
              title: "Enviar cupón", sub: `Para ${esc(c.name)}`,
              body: `<div class="field"><label for="send-c">Cupón</label><select class="select" id="send-c">${active.map((x) => `<option>${esc(x.code)}</option>`).join("")}</select></div>`,
              foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-send>Enviar</button>`,
              onOpen(m, close) { $("[data-send]", m).addEventListener("click", () => { close(); toast(`Cupón ${$("#send-c", m).value} enviado a ${c.email} (simulado)`, "success"); }); }
            });
          });
        }
      });
    }
    let t;
    $("#c-q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 200); });
    $("#c-status").addEventListener("change", (e) => { state.status = e.target.value; render(); });
    $("#c-sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
    $("#export").addEventListener("click", () => A.downloadCsv("nova-clientes.csv", [["Nombre", "Email", "Teléfono", "Ciudad", "Pedidos", "Total gastado", "Última compra", "Estado"]]
      .concat(filtered().map((c) => [c.name, c.email, c.phone, c.city, c.count, c.spent, c.last ? c.last.slice(0, 10) : "", c.status]))));
    render();
    if (qs.get("id")) openCustomer(qs.get("id"));
  };

  /* =========================================================
     ENVÍOS
     ========================================================= */
  Pages.envios = function () {
    const state = { status: "", q: "" };
    $("#head-actions").innerHTML = `<button type="button" class="btn btn--outline" id="labels">${icon("download")} Etiquetas del día</button>`;
    $("#page").innerHTML = `<div class="grid grid--kpi-5" id="ship-kpis"></div>
      <section class="card card--flush" style="margin-top:20px">
        <div class="tabs-inline" role="tablist" id="tabs"></div>
        <div class="table-tools"><div class="search-box">${N.icon("search")}<label for="s-q" class="sr-only">Buscar envíos</label><input class="input" id="s-q" type="search" placeholder="Buscar por pedido, cliente o tracking"></div></div>
        <div class="table-wrap"><table class="table table--stack">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Transportista</th><th>Método</th><th>Tracking</th><th>Estado</th><th>Fecha estimada</th><th class="num">Acciones</th></tr></thead>
          <tbody id="rows"></tbody></table></div>
        <div class="table-foot" id="foot"></div>
      </section>`;
    const orderOf = (id) => data.orders().find((o) => o.id === id);
    function render() {
      const all = data.shipments();
      const icons = { Preparando: "box", Despachado: "truck", "En tránsito": "truck", Entregado: "check", Devuelto: "repeat" };
      $("#ship-kpis").innerHTML = A.SHIP_STATUSES.map((s) => `<section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--${s === "Entregado" ? "ok" : s === "Devuelto" ? "bad" : "warn"}">${icon(icons[s])}</span><div><strong>${all.filter((x) => x.status === s).length}</strong><span>${s}</span></div></section>`).join("");
      $("#tabs").innerHTML = [["", "Todos", all.length]].concat(A.SHIP_STATUSES.map((s) => [s, s, all.filter((x) => x.status === s).length]))
        .map(([v, l, n]) => `<button type="button" role="tab" aria-selected="${state.status === v}" data-status="${v}">${l}<span>${n}</span></button>`).join("");
      $$("[data-status]").forEach((b) => b.addEventListener("click", () => { state.status = b.dataset.status; render(); }));
      const q = N.normalize(state.q);
      const list = all.filter((s) => {
        const o = orderOf(s.order);
        const c = o ? data.customerOf(o) : { name: "" };
        return (!state.status || s.status === state.status) && (!q || N.normalize(`${s.order} ${c.name} ${s.tracking}`).includes(q));
      });
      $("#rows").innerHTML = list.length ? list.map((s) => {
        const o = orderOf(s.order);
        const c = o ? data.customerOf(o) : { name: "—" };
        const late = s.status !== "Entregado" && s.status !== "Devuelto" && s.eta < "2026-09-29";
        return `<tr>
          <td class="td-main" data-label="Pedido"><a class="link" href="pedidos.html?id=${s.order}"><strong>#${esc(s.order)}</strong></a></td>
          <td data-label="Cliente">${esc(c.name)}</td>
          <td data-label="Transportista">${esc(s.carrier)}</td>
          <td data-label="Método" class="muted">${esc(s.method)}</td>
          <td data-label="Tracking"><code style="font-size:13px">${esc(s.tracking)}</code></td>
          <td data-label="Estado">${badge(s.status)}</td>
          <td data-label="Fecha estimada" class="${late ? "" : "muted"}" style="${late ? "color:var(--danger);font-weight:600" : ""}">${A.fmtDate(s.eta + "T12:00", { day: "2-digit", month: "short" })}${late ? " · demorado" : ""}</td>
          <td data-label="Acciones"><div class="row-actions"><button type="button" class="btn btn--outline btn--sm" style="width:auto" data-edit="${esc(s.order)}">Actualizar</button></div></td></tr>`;
      }).join("") : `<tr><td colspan="8" class="table-empty">No hay envíos con este estado.</td></tr>`;
      $("#foot").innerHTML = `<span>${list.length} envíos</span><span>Transportistas: Andreani · OCA · Correo Argentino</span>`;
      $$("[data-edit]").forEach((b) => b.addEventListener("click", () => edit(b.dataset.edit)));
    }
    function edit(orderId) {
      const s = data.shipments().find((x) => x.order === orderId);
      A.modal({
        title: `Envío del pedido #${orderId}`, sub: `${esc(s.carrier)} · ${esc(s.method)}`,
        body: `<div class="form-grid">
          <div class="field span-2"><label for="e-status">Estado del envío</label><select class="select" id="e-status">${A.SHIP_STATUSES.map((x) => `<option${x === s.status ? " selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="field"><label for="e-carrier">Transportista</label><select class="select" id="e-carrier">${["Andreani", "OCA", "Correo Arg."].map((x) => `<option${x === s.carrier ? " selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="field"><label for="e-eta">Fecha estimada</label><input class="input" type="date" id="e-eta" value="${esc(s.eta)}"><span class="field__error">Elegí una fecha.</span></div>
          <div class="field span-2"><label for="e-track">Código de seguimiento</label><input class="input" id="e-track" value="${esc(s.tracking)}"><span class="field__error">Ingresá el tracking.</span></div>
          <label class="check span-2"><input type="checkbox" id="e-notify" checked> Notificar al cliente por email</label>
        </div>`,
        foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-save>Guardar</button>`,
        onOpen(el, close) {
          $("[data-save]", el).addEventListener("click", () => {
            if (!A.validateFields(el, { "e-track": (v) => v.trim().length >= 4, "e-eta": (v) => !!v })) return;
            const status = $("#e-status", el).value;
            data.saveShipment(orderId, { status, carrier: $("#e-carrier", el).value, eta: $("#e-eta", el).value, tracking: $("#e-track", el).value.trim() });
            // Sincroniza el estado del pedido
            const map = { Despachado: "Enviado", "En tránsito": "Enviado", Entregado: "Entregado", Preparando: "Preparando" };
            if (map[status]) data.setOrderStatus(orderId, map[status]);
            close();
            toast(`Envío actualizado a “${status}”${$("#e-notify", el).checked ? " · cliente notificado" : ""}`, "success");
            render();
          });
        }
      });
    }
    let t;
    $("#s-q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; render(); }, 200); });
    $("#labels").addEventListener("click", () => {
      const prep = data.shipments().filter((s) => s.status === "Preparando");
      A.downloadCsv("nova-etiquetas.csv", [["Pedido", "Transportista", "Tracking", "Dirección"]].concat(prep.map((s) => { const o = orderOf(s.order); return [s.order, s.carrier, s.tracking, o ? addressOf(o) : ""]; })));
    });
    render();
  };

  /* =========================================================
     CUPONES
     ========================================================= */
  Pages.cupones = function () {
    $("#head-actions").innerHTML = `<button type="button" class="btn btn--dark" id="add">+ Nuevo cupón</button>`;
    function valueLabel(c) { return c.type === "Porcentaje" ? `${c.value}%` : c.type === "Monto fijo" ? money(c.value) : "Envío gratis"; }
    function render() {
      const list = data.coupons();
      const active = list.filter((c) => c.status === "Activo");
      const uses = list.reduce((n, c) => n + c.uses, 0);
      $("#page").innerHTML = `
        <div class="grid grid--3">
          <section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--ok">${icon("ticket")}</span><div><strong>${active.length}</strong><span>Cupones activos</span></div></section>
          <section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--warn">${icon("repeat")}</span><div><strong>${A.fmtNum(uses)}</strong><span>Usos totales</span></div></section>
          <section class="card mini-kpi"><span class="mini-kpi__icon mini-kpi__icon--ok">${icon("money")}</span><div><strong>${money(uses * 4210)}</strong><span>Descuento otorgado (estimado)</span></div></section>
        </div>
        <section class="card card--flush" style="margin-top:20px">
          <div class="table-wrap"><table class="table table--stack">
            <thead><tr><th>Código</th><th>Tipo</th><th class="num">Valor</th><th>Usos</th><th>Vencimiento</th><th>Estado</th><th class="num">Acciones</th></tr></thead>
            <tbody>${list.map((c, i) => `<tr>
              <td class="td-main" data-label="Código"><code style="font-weight:700;font-size:14px;letter-spacing:.04em;color:var(--ink)">${esc(c.code)}</code></td>
              <td data-label="Tipo">${esc(c.type)}</td>
              <td data-label="Valor" class="num"><strong>${valueLabel(c)}</strong></td>
              <td data-label="Usos"><div style="min-width:140px"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${A.fmtNum(c.uses)}</span><span class="muted">${c.limit ? "de " + A.fmtNum(c.limit) : "ilimitado"}</span></div>
                ${c.limit ? `<div class="bar__track" style="height:5px;margin-top:5px"><div class="bar__fill" style="width:${Math.min(100, (c.uses / c.limit) * 100)}%"></div></div>` : ""}</div></td>
              <td data-label="Vencimiento" class="muted">${A.fmtDate(c.expires + "T12:00", { day: "2-digit", month: "short", year: "numeric" })}</td>
              <td data-label="Estado">${badge(c.status)}</td>
              <td data-label="Acciones"><div class="row-actions">
                ${c.status === "Activo" || c.status === "Pausado" ? `<button type="button" class="btn btn--ghost btn--sm" style="width:auto" data-toggle="${i}">${c.status === "Activo" ? "Pausar" : "Activar"}</button>` : ""}
                <button type="button" data-copy="${esc(c.code)}" aria-label="Copiar código ${esc(c.code)}" title="Copiar">${icon("copy")}</button>
                <button type="button" data-edit="${i}" aria-label="Editar ${esc(c.code)}" title="Editar">${icon("edit")}</button>
                <button type="button" class="danger" data-del="${i}" aria-label="Eliminar ${esc(c.code)}" title="Eliminar">${N.icon("trash")}</button>
              </div></td></tr>`).join("")}</tbody></table></div>
          <div class="table-foot"><span>${list.length} cupones</span><span>Los cupones activos funcionan en el carrito de la tienda.</span></div>
        </section>`;
      $$("[data-toggle]").forEach((b) => b.addEventListener("click", () => {
        const l = data.coupons(); const c = l[+b.dataset.toggle];
        c.status = c.status === "Activo" ? "Pausado" : "Activo";
        data.saveCoupons(l); toast(`Cupón ${c.code} ${c.status === "Activo" ? "activado" : "pausado"}`, "success"); render();
      }));
      $$("[data-copy]").forEach((b) => b.addEventListener("click", () => {
        const code = b.dataset.copy;
        (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast(`Código ${code} copiado`, "success"), () => toast(`Código: ${code}`, "info"));
      }));
      $$("[data-edit]").forEach((b) => b.addEventListener("click", () => form(+b.dataset.edit)));
      $$("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        const l = data.coupons(); const c = l[+b.dataset.del];
        if (!(await A.confirmDialog({ title: "Eliminar cupón", text: `¿Eliminar el cupón <strong>${esc(c.code)}</strong>? Dejará de funcionar en la tienda.` }))) return;
        l.splice(+b.dataset.del, 1); data.saveCoupons(l); toast("Cupón eliminado", "info"); render();
      }));
    }
    function form(index) {
      const list = data.coupons();
      const editing = index !== null ? list[index] : null;
      const c = editing || { code: "", type: "Porcentaje", value: 10, limit: 100, expires: "2026-12-31", status: "Activo", uses: 0 };
      A.modal({
        title: editing ? `Editar ${c.code}` : "Nuevo cupón",
        body: `<div class="form-grid">
          <div class="field span-2"><label for="k-code">Código</label><div style="display:flex;gap:8px"><input class="input" id="k-code" value="${esc(c.code)}" style="text-transform:uppercase;letter-spacing:.04em" placeholder="EJ: VERANO15"><button type="button" class="btn btn--outline" id="k-gen">Generar</button></div><span class="field__error">Código de 4 a 16 caracteres (letras y números), único.</span></div>
          <div class="field"><label for="k-type">Tipo</label><select class="select" id="k-type">${["Porcentaje", "Monto fijo", "Envío gratis"].map((x) => `<option${x === c.type ? " selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="field"><label for="k-value">Valor</label><input class="input" id="k-value" type="number" min="0" value="${c.value}"><span class="field__error">Porcentaje entre 1 y 90, o monto mayor a 0.</span></div>
          <div class="field"><label for="k-limit">Límite de usos</label><input class="input" id="k-limit" type="number" min="0" value="${c.limit}"><span class="field__hint">0 = ilimitado</span></div>
          <div class="field"><label for="k-exp">Vencimiento</label><input class="input" id="k-exp" type="date" value="${c.expires}"><span class="field__error">Elegí una fecha.</span></div>
          <div class="field span-2"><label for="k-status">Estado</label><select class="select" id="k-status">${["Activo", "Pausado"].map((x) => `<option${x === c.status ? " selected" : ""}>${x}</option>`).join("")}</select></div>
        </div>`,
        foot: `<button type="button" class="btn btn--outline" data-close>Cancelar</button><button type="button" class="btn btn--dark" data-save>${editing ? "Guardar" : "Crear cupón"}</button>`,
        onOpen(el, close) {
          const typeSel = $("#k-type", el), val = $("#k-value", el);
          const sync = () => { val.disabled = typeSel.value === "Envío gratis"; if (val.disabled) val.value = 0; };
          typeSel.addEventListener("change", sync); sync();
          $("#k-gen", el).addEventListener("click", () => { $("#k-code", el).value = "NOVA" + Math.random().toString(36).slice(2, 7).toUpperCase(); });
          $("[data-save]", el).addEventListener("click", () => {
            const code = $("#k-code", el).value.trim().toUpperCase();
            const type = typeSel.value;
            const ok = A.validateFields(el, {
              "k-code": () => /^[A-Z0-9]{4,16}$/.test(code) && !list.some((x) => x !== editing && x.code === code),
              "k-value": (v) => type === "Envío gratis" || (type === "Porcentaje" ? Number(v) >= 1 && Number(v) <= 90 : Number(v) > 0),
              "k-exp": (v) => !!v
            });
            if (!ok) return;
            const vals = { code, type, value: Number(val.value), limit: Number($("#k-limit", el).value) || 0, expires: $("#k-exp", el).value, status: $("#k-status", el).value };
            if (editing) Object.assign(editing, vals); else list.unshift({ uses: 0, ...vals });
            data.saveCoupons(list);
            close(); toast(editing ? "Cupón actualizado" : `Cupón ${code} creado · ya podés usarlo en la tienda`, "success"); render();
          });
        }
      });
    }
    $("#add").addEventListener("click", () => form(null));
    render();
  };

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */
  Pages.estadisticas = function () {
    let period = "30d";
    const P = window.NOVA_STATS.periods;
    A.periodSelector($("#head-actions"), period, (p) => { period = p; render(); });
    function render() {
      const cur = P[period];
      const d = A.DELTAS[period];
      const s = A.seriesFor(period);
      const ratio = cur.sales / P["30d"].sales;
      const kpis = [
        ["Ventas", money(cur.sales), d[0]], ["Pedidos", A.fmtNum(cur.orders), d[1]], ["Ticket promedio", money(cur.ticket), (d[0] - d[1]).toFixed(1) * 1],
        ["Clientes nuevos", A.fmtNum(cur.newCustomers), d[2]], ["Clientes recurrentes", A.fmtNum(cur.returning), d[3] + 2], ["Productos vendidos", A.fmtNum(cur.units), d[1] + 1.4]
      ];
      const products = data.products().slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 6);
      const maxSold = products[0] ? products[0].sold : 1;
      $("#page").innerHTML = `
        <div class="grid grid--kpi-6">${kpis.map(([l, v, dl]) => `<section class="card kpi"><span class="kpi__label">${l}</span><div class="kpi__value" style="font-size:24px">${v}</div><div class="kpi__foot">${A.deltaHtml(dl)}</div></section>`).join("")}</div>
        <div class="grid grid--2-1">
          <section class="card"><div class="card__head"><div><h2>Evolución de ventas</h2><p>${cur.label}</p></div></div><div id="st-line"></div></section>
          <section class="card"><div class="card__head"><div><h2>Clientes nuevos vs. recurrentes</h2><p>Pedidos del período</p></div></div><div id="st-cust"></div></section>
        </div>
        <div class="grid grid--1-1">
          <section class="card"><div class="card__head"><div><h2>Ventas mensuales</h2><p>2026 · el mes actual resaltado</p></div></div><div id="st-cols"></div></section>
          <section class="card"><div class="card__head"><div><h2>Ventas por categoría</h2><p>${cur.label}</p></div></div><div id="st-cat"></div></section>
        </div>
        <div class="grid grid--1-1">
          <section class="card"><div class="card__head"><div><h2>Embudo de conversión</h2><p>${cur.label} · tasa de conversión ${(cur.orders / (cur.orders * 29.9) * 100).toFixed(1).replace(".", ",")}%</p></div></div><div id="st-funnel"></div></section>
          <section class="card"><div class="card__head"><div><h2>Medios de pago</h2><p>Participación en ventas</p></div></div><div id="st-pay"></div></section>
        </div>
        <section class="card card--flush" style="margin-top:20px">
          <div class="card__head"><div><h2>Productos más vendidos</h2><p>Unidades acumuladas</p></div></div>
          <div class="table-wrap" style="margin-top:14px"><table class="table table--stack"><thead><tr><th>Producto</th><th>Categoría</th><th class="num">Precio</th><th>Unidades</th><th class="num">Facturación</th></tr></thead>
          <tbody>${products.map((p) => `<tr><td class="td-main" data-label="Producto"><div class="cell-product"><span class="cell-product__img">${media(p)}</span><strong>${esc(p.name)}</strong></div></td>
            <td data-label="Categoría">${esc(cat(p.category))}</td><td data-label="Precio" class="num">${money(p.price)}</td>
            <td data-label="Unidades"><div style="display:flex;align-items:center;gap:10px;min-width:160px"><div class="bar__track" style="flex:1"><div class="bar__fill" style="width:${(p.sold / maxSold) * 100}%"></div></div><span style="font-variant-numeric:tabular-nums;min-width:44px;text-align:right">${A.fmtNum(p.sold)}</span></div></td>
            <td data-label="Facturación" class="num"><strong>${A.fmtCompact(p.sold * p.price)}</strong></td></tr>`).join("")}</tbody></table></div>
        </section>`;
      A.lineChart($("#st-line"), { labels: s.labels, values: s.values, name: "Ventas" });
      A.donutChart($("#st-cust"), { items: [{ label: "Nuevos", value: cur.newCustomers }, { label: "Recurrentes", value: cur.returning }], fmt: A.fmtNum, centerLabel: "Pedidos", stack: true });
      A.columnChart($("#st-cols"), { labels: window.NOVA_STATS.monthly.map((_, i) => A.MONTHS[i]), values: window.NOVA_STATS.monthly });
      A.barList($("#st-cat"), Object.entries(window.NOVA_STATS.byCategory).map(([label, v]) => ({ label, value: Math.round(v * ratio) })), { fmt: money });
      const visits = Math.round(cur.orders * 29.9);
      A.barList($("#st-funnel"), [
        { label: "Visitas", value: visits, suffix: "100%" },
        { label: "Vieron un producto", value: Math.round(visits * .46), suffix: "46%" },
        { label: "Agregaron al carrito", value: Math.round(visits * .128), suffix: "12,8%" },
        { label: "Iniciaron el checkout", value: Math.round(visits * .052), suffix: "5,2%" },
        { label: "Compraron", value: cur.orders, suffix: (cur.orders / visits * 100).toFixed(1).replace(".", ",") + "%" }
      ], { color: "var(--chart-1)" });
      A.donutChart($("#st-pay"), { items: [{ label: "Mercado Pago", value: Math.round(cur.sales * .52) }, { label: "Tarjeta", value: Math.round(cur.sales * .33) }, { label: "Transferencia", value: Math.round(cur.sales * .15) }], fmt: A.fmtCompact, centerLabel: "Ventas" });
    }
    render();
  };

  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */
  Pages.configuracion = function () {
    let s = data.settings();
    const sw = (id, checked, title, desc, lead = "") => `<div class="switch-row"><div class="switch-row__lead">${lead}<div><strong id="${id}-l">${title}</strong><span>${desc}</span></div></div>
      <label class="switch"><input type="checkbox" id="${id}" ${checked ? "checked" : ""} aria-labelledby="${id}-l"><span></span></label></div>`;
    $("#page").innerHTML = `<div class="settings">
      <nav class="settings__nav" aria-label="Secciones de configuración">
        <a href="#tienda" class="is-active">Tienda</a><a href="#envios">Envíos</a><a href="#pagos">Pagos</a><a href="#redes">Redes</a><a href="#avanzado">Avanzado</a>
      </nav>
      <form id="settings-form" novalidate>
        <section class="card settings-section" id="tienda" aria-labelledby="h-tienda">
          <div class="card__head"><div><h2 id="h-tienda">Tienda</h2><p>Datos básicos visibles para tus clientes.</p></div></div>
          <div class="form-grid">
            <div class="field"><label for="s-name">Nombre de la tienda</label><input class="input" id="s-name" value="${esc(s.storeName)}" maxlength="24"><span class="field__error">Ingresá un nombre.</span></div>
            <div class="field"><span class="label">Logo</span><div class="logo-upload"><div class="logo-upload__preview" id="s-logo-prev">${s.logo ? `<img src="${esc(s.logo)}" alt="Logo actual">` : `<span class="logo" style="font-size:18px">${esc(s.storeName)}<span class="logo__dot"></span></span>`}</div>
              <div style="display:grid;gap:6px"><label for="s-logo" class="sr-only">Subir logo</label><input type="file" id="s-logo" accept="image/*" style="font-size:13px">${s.logo ? `<button type="button" class="link" id="s-logo-rm" style="background:none;border:0;padding:0;text-align:left;font-size:13px">Quitar logo</button>` : `<small style="color:var(--muted)">PNG o SVG, fondo transparente.</small>`}</div></div></div>
            <div class="field"><label for="s-email">Email de contacto</label><input class="input" id="s-email" type="email" value="${esc(s.email)}"><span class="field__error">Email inválido.</span></div>
            <div class="field"><label for="s-phone">Teléfono</label><input class="input" id="s-phone" type="tel" value="${esc(s.phone)}"></div>
          </div>
        </section>
        <section class="card settings-section" id="envios" aria-labelledby="h-envios">
          <div class="card__head"><div><h2 id="h-envios">Envíos</h2><p>Costos y métodos disponibles en el checkout.</p></div></div>
          <div class="form-grid">
            <div class="field"><label for="s-ship">Costo de envío</label><div class="input-prefix"><span>$</span><input class="input" id="s-ship" type="number" min="0" value="${s.shippingCost}"></div><span class="field__error">Ingresá un monto válido.</span></div>
            <div class="field"><label for="s-free">Envío gratis desde</label><div class="input-prefix"><span>$</span><input class="input" id="s-free" type="number" min="0" value="${s.freeShippingFrom}"></div><span class="field__error">Ingresá un monto válido.</span></div>
          </div>
          <div style="margin-top:12px">
            ${sw("s-m-dom", s.methods.domicilio, "Envío a domicilio", "Andreani, OCA y Correo Argentino")}
            ${sw("s-m-ret", s.methods.retiro, "Retiro en local", "Av. Corrientes 1234, CABA")}
          </div>
        </section>
        <section class="card settings-section" id="pagos" aria-labelledby="h-pagos">
          <div class="card__head"><div><h2 id="h-pagos">Pagos</h2><p>Medios habilitados. En esta demo no se conecta ningún proveedor real.</p></div></div>
          ${sw("s-p-mp", s.payments.mercadopago, "Mercado Pago", "Checkout Pro · dinero en cuenta y tarjetas", '<span class="pay-logo pay-logo--mp">MP</span>')}
          ${sw("s-p-tr", s.payments.transferencia, "Transferencia bancaria", "Con descuento por pago anticipado", `<span class="pay-logo pay-logo--transfer">${s.transferDiscount}%</span>`)}
          ${sw("s-p-tc", s.payments.tarjeta, "Tarjeta de crédito y débito", "Visa, Mastercard, Amex", '<span class="pay-logo pay-logo--card">VISA</span>')}
          <div class="form-grid" style="margin-top:16px">
            <div class="field"><label for="s-disc">Descuento por transferencia</label><div class="input-prefix"><span>%</span><input class="input" id="s-disc" type="number" min="0" max="50" value="${s.transferDiscount}"></div><span class="field__error">Entre 0 y 50.</span></div>
            <div class="field"><label for="s-inst">Cuotas sin interés</label><select class="select" id="s-inst">${[1, 3, 6, 12].map((n) => `<option value="${n}"${n === s.installments ? " selected" : ""}>${n === 1 ? "Sin cuotas" : n + " cuotas"}</option>`).join("")}</select></div>
          </div>
        </section>
        <section class="card settings-section" id="redes" aria-labelledby="h-redes">
          <div class="card__head"><div><h2 id="h-redes">Redes</h2><p>Se muestran en el pie de página de la tienda.</p></div></div>
          <div class="form-grid">
            <div class="field"><label for="s-ig">Instagram</label><input class="input" id="s-ig" value="${esc(s.instagram)}" placeholder="@usuario"></div>
            <div class="field"><label for="s-fb">Facebook</label><input class="input" id="s-fb" value="${esc(s.facebook)}"></div>
            <div class="field span-2"><label for="s-wa">WhatsApp</label><input class="input" id="s-wa" type="tel" value="${esc(s.whatsapp)}"></div>
          </div>
        </section>
        <section class="card settings-section" id="avanzado" aria-labelledby="h-avanzado">
          <div class="card__head"><div><h2 id="h-avanzado">Datos de la demo</h2><p>Los cambios del panel se guardan en este navegador (localStorage).</p></div></div>
          <div class="switch-row"><div><strong>Restablecer datos de ejemplo</strong><span>Borra productos editados, pedidos de prueba, cupones, carrito y configuración.</span></div><button type="button" class="btn btn--outline" id="reset-demo" style="color:var(--danger);border-color:var(--danger)">Restablecer</button></div>
        </section>
        <div class="save-bar" id="save-bar" hidden><span>Tenés cambios sin guardar</span><div style="display:flex;gap:8px"><button type="button" class="btn btn--ghost btn--sm" id="discard" style="color:#fff">Descartar</button><button type="submit" class="btn btn--light btn--sm">Guardar cambios</button></div></div>
      </form></div>`;

    const form = $("#settings-form");
    const bar = $("#save-bar");
    let logo = s.logo || null;
    form.addEventListener("input", () => { bar.hidden = false; });
    form.addEventListener("change", () => { bar.hidden = false; });
    $("#s-logo").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 500 * 1024) { toast("El logo debe pesar menos de 500 KB", "error"); e.target.value = ""; return; }
      const r = new FileReader();
      r.onload = () => { logo = r.result; $("#s-logo-prev").innerHTML = `<img src="${logo}" alt="Vista previa del logo">`; };
      r.readAsDataURL(f);
    });
    const rm = $("#s-logo-rm");
    if (rm) rm.addEventListener("click", () => { logo = null; $("#s-logo-prev").innerHTML = `<span class="logo" style="font-size:18px">${esc(s.storeName)}<span class="logo__dot"></span></span>`; bar.hidden = false; });
    $("#discard").addEventListener("click", () => { Pages.configuracion(); toast("Cambios descartados", "info"); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = A.validateFields(form, {
        "s-name": (v) => v.trim().length >= 2, "s-email": (v) => /^\S+@\S+\.\S+$/.test(v),
        "s-ship": (v) => v !== "" && Number(v) >= 0, "s-free": (v) => v !== "" && Number(v) >= 0, "s-disc": (v) => Number(v) >= 0 && Number(v) <= 50
      });
      if (!ok) { toast("Revisá los campos marcados", "error"); return; }
      const methods = { domicilio: $("#s-m-dom").checked, retiro: $("#s-m-ret").checked };
      const payments = { mercadopago: $("#s-p-mp").checked, transferencia: $("#s-p-tr").checked, tarjeta: $("#s-p-tc").checked };
      if (!methods.domicilio && !methods.retiro) { toast("Tenés que habilitar al menos un método de envío", "error"); return; }
      if (!Object.values(payments).some(Boolean)) { toast("Tenés que habilitar al menos un medio de pago", "error"); return; }
      s = {
        ...s, storeName: $("#s-name").value.trim(), email: $("#s-email").value.trim(), phone: $("#s-phone").value.trim(), logo,
        shippingCost: Number($("#s-ship").value), freeShippingFrom: Number($("#s-free").value), methods, payments,
        transferDiscount: Number($("#s-disc").value), installments: Number($("#s-inst").value),
        instagram: $("#s-ig").value.trim(), facebook: $("#s-fb").value.trim(), whatsapp: $("#s-wa").value.trim()
      };
      try { data.saveSettings(s); } catch (err) { toast("No se pudo guardar", "error"); return; }
      bar.hidden = true;
      toast("Configuración guardada · ya se aplica en la tienda", "success");
      const brand = $(".sidebar__brand .logo");
      if (brand) brand.innerHTML = `${esc(s.storeName)}<span class="logo__dot" aria-hidden="true"></span>`;
    });
    $("#reset-demo").addEventListener("click", async () => {
      if (!(await A.confirmDialog({ title: "Restablecer demo", text: "Se borrarán todos los cambios guardados en este navegador y se volverá a los datos de ejemplo.", confirm: "Restablecer" }))) return;
      try { Object.keys(localStorage).filter((k) => k.startsWith("nova_")).forEach((k) => localStorage.removeItem(k)); } catch (err) { /* noop */ }
      toast("Datos restablecidos", "success");
      setTimeout(() => location.reload(), 700);
    });
    // Resalta la sección visible en el índice lateral
    const links = $$(".settings__nav a");
    links.forEach((a) => a.addEventListener("click", () => { links.forEach((x) => x.classList.toggle("is-active", x === a)); }));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((ens) => ens.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
      }), { rootMargin: "-30% 0px -60% 0px" });
      $$(".settings-section").forEach((sec) => io.observe(sec));
    }
  };

  window.AdminPages = Pages;
})();
