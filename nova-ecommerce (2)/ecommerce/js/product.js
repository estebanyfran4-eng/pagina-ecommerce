/* NOVA · Detalle de producto */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, esc, money, product, products, category, discountPct, media, icon, stars, productCard, cart, wishlist, toast, store, settings } = N;

  const REVIEWERS = ["Carla M.", "Diego R.", "Paula S.", "Matías G.", "Florencia L.", "Ignacio T.", "Rocío V.", "Joaquín P."];
  const REVIEW_TEXTS = [
    ["Excelente calidad", "Superó mis expectativas. La terminación es muy buena y llegó antes de lo previsto."],
    ["Muy recomendable", "Lo uso todos los días y funciona perfecto. La relación precio-calidad es muy buena."],
    ["Tal cual las fotos", "Es exactamente lo que se ve en la publicación. El empaque vino impecable."],
    ["Buena compra", "Cumple con lo que promete. Le pondría 5 estrellas si el envío hubiera sido un poco más rápido."],
    ["Me encantó", "Segunda vez que compro en NOVA y la experiencia fue excelente otra vez."],
    ["Correcto", "Está bien por el precio. La atención por WhatsApp resolvió mis dudas rápido."]
  ];

  // Reseñas ficticias determinísticas + las que agrega el usuario
  function reviewsFor(p) {
    const seed = p.id.length + p.reviews;
    const base = Array.from({ length: 4 }, (_, i) => {
      const t = REVIEW_TEXTS[(seed + i) % REVIEW_TEXTS.length];
      const r = i === 3 && p.rating < 4.6 ? 4 : 5 - ((seed + i) % 5 === 0 ? 1 : 0);
      const d = new Date(2026, 8, 25 - i * 6 - (seed % 5));
      return { name: REVIEWERS[(seed + i * 3) % REVIEWERS.length], rating: r, title: t[0], text: t[1], date: d.toISOString().slice(0, 10), verified: true };
    });
    return store.get("nova_reviews_" + p.id, []).concat(base);
  }

  function openModal(title, html) {
    const wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", title);
    wrap.innerHTML = `<div class="modal__backdrop" data-close></div><div class="modal__dialog"><h2>${esc(title)}</h2>
      <button class="icon-btn modal__close" type="button" data-close aria-label="Cerrar">${icon("close")}</button>${html}</div>`;
    document.body.appendChild(wrap);
    document.body.classList.add("no-scroll");
    const prev = document.activeElement;
    const close = () => { wrap.remove(); document.body.classList.remove("no-scroll"); document.removeEventListener("keydown", onKey); if (prev) prev.focus(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    $$("[data-close]", wrap).forEach((b) => b.addEventListener("click", close));
    $(".modal__close", wrap).focus();
  }

  function renderNotFound(root) {
    $("#breadcrumb").innerHTML = `<a href="index.html">Inicio</a>${icon("chevron")}<a href="productos.html">Productos</a>`;
    root.innerHTML = `<div class="empty" style="margin-bottom:96px">
      <div class="empty__icon">${icon("box")}</div>
      <h1 style="font-size:24px">No encontramos este producto</h1>
      <p>Puede que el enlace esté mal escrito o que el producto ya no esté disponible.</p>
      <a href="productos.html" class="btn btn--dark">Ver productos</a>
    </div>`;
  }

  function render(p) {
    const root = $("#pdp-root");
    const s = settings();
    const cat = category(p.category);
    const d = discountPct(p);
    const out = p.stock <= 0;
    const reviews = reviewsFor(p);
    let variant = p.variants ? p.variants.options[0] : "";
    let qty = 1;
    let current = 0;

    document.title = `${p.name} · NOVA`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", `${p.name} a ${money(p.price)}. ${p.description}`);

    $("#breadcrumb").innerHTML = `<a href="index.html">Inicio</a>${icon("chevron")}<a href="productos.html">Productos</a>${icon("chevron")}
      <a href="productos.html?cat=${p.category}">${esc(cat ? cat.name : "")}</a>${icon("chevron")}<span aria-current="page">${esc(p.name)}</span>`;

    const stockHtml = out ? `<span class="stock stock--out">Sin stock</span>`
      : p.stock <= 5 ? `<span class="stock stock--low">¡Últimas ${p.stock} unidades!</span>`
      : `<span class="stock">En stock · ${p.stock} disponibles</span>`;

    const dist = [5, 4, 3, 2, 1].map((st) => {
      const pct = st === 5 ? Math.round(p.rating * 15) : st === 4 ? Math.round((5 - p.rating) * 60) : st === 3 ? 4 : st === 2 ? 2 : 1;
      return { st, pct: Math.min(pct, 100) };
    });

    // Con fotos propias se muestran solo esas; sin fotos, las 4 ilustraciones de ejemplo
    const realImgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
    const galleryCount = realImgs.length || 4;

    root.innerHTML = `
      <div class="pdp">
        <div class="gallery">
          <div class="gallery__thumbs" role="tablist" aria-label="Imágenes del producto"${galleryCount < 2 ? " hidden" : ""}>
            ${Array.from({ length: galleryCount }, (_, i) => i).map((i) => `<button type="button" class="gallery__thumb${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" aria-label="Imagen ${i + 1}" data-img="${i}">${media(p, i)}</button>`).join("")}
          </div>
          <div class="gallery__main" id="gallery-main" title="Click para ampliar">
            <span>${media(p, 0)}</span>
            <div class="product-card__badges">${d ? `<span class="badge badge--sale">-${d}%</span>` : ""}${out ? `<span class="badge badge--out">Agotado</span>` : ""}</div>
            <div class="gallery__nav"${galleryCount < 2 ? " hidden" : ""}>
              <button type="button" data-step="-1" aria-label="Imagen anterior">${icon("chevron")}</button>
              <button type="button" data-step="1" aria-label="Imagen siguiente">${icon("chevron")}</button>
            </div>
          </div>
        </div>

        <div class="pdp__info">
          <div>
            <span class="pdp__brand"><a href="productos.html?marca=${encodeURIComponent(p.brand)}">${esc(p.brand)}</a> · SKU ${esc(p.sku || "")}</span>
            <h1>${esc(p.name)}</h1>
            <div class="pdp__meta" style="margin-top:12px">${stars(p.rating)}<a href="#tab-reviews" data-go-reviews>${p.reviews + reviews.length - 4} reseñas</a><span>·</span><span>+${(p.sold || 0).toLocaleString("es-AR")} vendidos</span></div>
          </div>

          <div class="pdp__price">
            <div class="price">
              <span class="price__now">${money(p.price)}</span>
              ${d ? `<span class="price__old">${money(p.oldPrice)}</span><span class="price__off">${d}% OFF</span>` : ""}
            </div>
            <p class="pdp__installments">${s.installments} cuotas sin interés de <strong>${money(p.price / s.installments)}</strong> · <a href="#" id="see-payments">Ver medios de pago</a></p>
            ${s.transferDiscount ? `<p style="font-size:14px;color:var(--muted);margin-top:4px">${money(p.price * (1 - s.transferDiscount / 100))} pagando con transferencia (${s.transferDiscount}% OFF)</p>` : ""}
          </div>

          <p class="pdp__desc">${esc(p.description)}</p>

          ${p.variants ? `<div class="variant-group">
            <p class="label" id="variant-label">${esc(p.variants.label)}: <span id="variant-value">${esc(variant)}</span></p>
            <div class="variants" role="radiogroup" aria-labelledby="variant-label">
              ${p.variants.options.map((o, i) => `<button type="button" class="variant" role="radio" aria-checked="${i === 0}" data-variant="${esc(o)}">${esc(o)}</button>`).join("")}
            </div></div>` : ""}

          <div>${stockHtml}</div>

          <div class="buy-row">
            <div class="qty" aria-label="Cantidad">
              <button type="button" id="qty-minus" aria-label="Restar uno" disabled>${icon("minus")}</button>
              <label for="qty-input" class="sr-only">Cantidad</label>
              <input id="qty-input" type="number" value="1" min="1" max="${p.stock}" inputmode="numeric" ${out ? "disabled" : ""}>
              <button type="button" id="qty-plus" aria-label="Sumar uno" ${out || p.stock <= 1 ? "disabled" : ""}>${icon("plus")}</button>
            </div>
            <button type="button" class="btn btn--dark btn--lg" id="add-to-cart" ${out ? "disabled" : ""}>${out ? "Producto agotado" : "Agregar al carrito"}</button>
            <button type="button" class="wish-lg${wishlist.has(p.id) ? " is-active" : ""}" data-wish="${esc(p.id)}" aria-pressed="${wishlist.has(p.id)}" aria-label="Agregar a favoritos">${icon("heart")}</button>
          </div>
          ${out ? `<form class="ship-calc" id="notify-form" novalidate><label for="notify-email" class="sr-only">Email para aviso de stock</label><input class="input" id="notify-email" type="email" placeholder="Tu email para avisarte cuando vuelva"><button class="btn btn--outline" type="submit">Avisarme</button></form>`
            : `<button type="button" class="btn btn--accent btn--lg btn--block" id="buy-now">Comprar ahora</button>`}

          <ul class="pdp__features" aria-label="Características principales">
            ${(p.features || []).map((f) => `<li>${icon("check")}<span>${esc(f)}</span></li>`).join("")}
          </ul>

          <div>
            <p class="label" style="margin-bottom:8px">Calculá el costo de envío</p>
            <form class="ship-calc" id="ship-calc" novalidate>
              <label for="zip" class="sr-only">Código postal</label>
              <input class="input" id="zip" inputmode="numeric" maxlength="4" placeholder="Código postal (ej. 1884)">
              <button class="btn btn--outline" type="submit">Calcular</button>
            </form>
            <div class="ship-calc__result" id="ship-result" aria-live="polite"></div>
          </div>

          <div class="pdp__assurances">
            <div>${icon("truck")}<div><strong>Envío gratis</strong><span>Desde ${money(s.freeShippingFrom)}</span></div></div>
            <div>${icon("refresh")}<div><strong>Devolución gratis</strong><span>Tenés 30 días</span></div></div>
            <div>${icon("shield")}<div><strong>Compra protegida</strong><span>Recibí lo que pediste</span></div></div>
            <div>${icon("card")}<div><strong>Cuotas sin interés</strong><span>Con todas las tarjetas</span></div></div>
          </div>
        </div>
      </div>

      <section class="pdp-tabs" aria-label="Información del producto" style="padding-bottom:40px">
        <div class="tabs" role="tablist">
          <button class="tab" role="tab" id="t-desc" aria-controls="tab-desc" aria-selected="true">Descripción</button>
          <button class="tab" role="tab" id="t-specs" aria-controls="tab-specs" aria-selected="false" tabindex="-1">Especificaciones</button>
          <button class="tab" role="tab" id="t-reviews" aria-controls="tab-reviews" aria-selected="false" tabindex="-1">Reseñas (${reviews.length})</button>
        </div>
        <div class="tab-panel" role="tabpanel" id="tab-desc" aria-labelledby="t-desc">
          <p>${esc(p.description)}</p>
          <p>Diseñado por ${esc(p.brand)} para acompañarte todos los días. Todos nuestros productos tienen garantía oficial y se despachan dentro de las 24 h hábiles desde nuestro centro de distribución.</p>
          <ul class="pdp__features" style="margin-top:20px">${(p.features || []).map((f) => `<li>${icon("check")}<span>${esc(f)}</span></li>`).join("")}</ul>
        </div>
        <div class="tab-panel" role="tabpanel" id="tab-specs" aria-labelledby="t-specs" hidden>
          <table class="specs"><caption class="sr-only">Especificaciones técnicas</caption><tbody>
            <tr><th scope="row">Marca</th><td>${esc(p.brand)}</td></tr>
            <tr><th scope="row">Categoría</th><td>${esc(cat ? cat.name : "")}</td></tr>
            ${Object.entries(p.specs || {}).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}
            <tr><th scope="row">SKU</th><td>${esc(p.sku || "")}</td></tr>
          </tbody></table>
        </div>
        <div class="tab-panel" role="tabpanel" id="tab-reviews" aria-labelledby="t-reviews" hidden>
          <div class="reviews">
            <div>
              <div class="reviews__score">${(Number(p.rating) || 0).toFixed(1).replace(".", ",")}</div>
              ${stars(p.rating, false)}
              <p style="color:var(--muted);font-size:14px">Basado en ${p.reviews} reseñas</p>
              <div class="review-bars">${dist.map((x) => `<div class="review-bar"><span>${x.st} ★</span><div class="review-bar__track"><div class="review-bar__fill" style="width:${x.pct}%"></div></div><span>${x.pct}%</span></div>`).join("")}</div>
            </div>
            <div>
              <div id="review-list">${reviews.map(reviewHtml).join("")}</div>
              <form class="review-form" id="review-form" novalidate>
                <h3 style="font-size:17px">Escribí tu reseña</h3>
                <fieldset style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:6px">Tu valoración</legend>
                  <div class="rating-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rv-rating" id="rv-${n}" value="${n}"${n === 5 ? " checked" : ""}><label for="rv-${n}" title="${n} estrellas">★<span class="sr-only">${n} estrellas</span></label>`).join("")}</div>
                </fieldset>
                <div class="field"><label for="rv-name">Nombre</label><input class="input" id="rv-name" required placeholder="Tu nombre"><span class="field__error">Ingresá tu nombre.</span></div>
                <div class="field"><label for="rv-text">Comentario</label><textarea class="textarea" id="rv-text" required placeholder="¿Qué te pareció el producto?"></textarea><span class="field__error">Escribí un comentario de al menos 10 caracteres.</span></div>
                <button class="btn btn--dark" type="submit" style="justify-self:start">Publicar reseña</button>
              </form>
            </div>
          </div>
        </div>
      </section>`;

    /* Galería */
    const main = $("#gallery-main");
    const show = (i) => {
      current = (i + galleryCount) % galleryCount;
      main.querySelector("span").outerHTML = `<span>${media(p, current)}</span>`;
      $$(".gallery__thumb").forEach((t, k) => { t.classList.toggle("is-active", k === current); t.setAttribute("aria-selected", k === current); });
    };
    $$(".gallery__thumb").forEach((t) => t.addEventListener("click", () => show(+t.dataset.img)));
    $$("[data-step]", main).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); show(current + Number(b.dataset.step)); }));
    main.addEventListener("click", () => main.classList.toggle("is-zoom"));

    /* Variantes */
    $$("[data-variant]").forEach((b) => b.addEventListener("click", () => {
      variant = b.dataset.variant;
      $$("[data-variant]").forEach((x) => x.setAttribute("aria-checked", x === b));
      $("#variant-value").textContent = variant;
    }));

    /* Cantidad */
    const input = $("#qty-input");
    const setQty = (n) => {
      qty = Math.max(1, Math.min(p.stock || 1, Number(n) || 1));
      input.value = qty;
      $("#qty-minus").disabled = qty <= 1;
      $("#qty-plus").disabled = qty >= p.stock;
    };
    $("#qty-minus").addEventListener("click", () => setQty(qty - 1));
    $("#qty-plus").addEventListener("click", () => setQty(qty + 1));
    input.addEventListener("change", () => setQty(input.value));

    /* Compra */
    const add = () => {
      if (cart.add(p.id, qty, variant)) {
        toast(`${qty > 1 ? qty + " unidades agregadas" : "Producto agregado"} al carrito`, "success", { href: "carrito.html", label: "Ver carrito" });
        N.pulseCart();
        return true;
      }
      return false;
    };
    const addBtn = $("#add-to-cart");
    if (addBtn) addBtn.addEventListener("click", () => {
      addBtn.classList.add("is-loading");
      setTimeout(() => { addBtn.classList.remove("is-loading"); add(); }, 350);
    });
    const buyNow = $("#buy-now");
    if (buyNow) buyNow.addEventListener("click", () => { if (add()) location.href = "checkout.html"; });
    const notify = $("#notify-form");
    if (notify) notify.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("#notify-email").value;
      if (!/^\S+@\S+\.\S+$/.test(v)) { toast("Ingresá un email válido", "error"); return; }
      toast("Te avisaremos cuando vuelva a haber stock", "success");
      notify.reset();
    });

    /* Cuotas */
    $("#see-payments").addEventListener("click", (e) => {
      e.preventDefault();
      const rows = [1, 3, 6, 12].map((n) => {
        const rate = n === 12 ? 1.28 : 1;
        const label = n <= s.installments ? "sin interés" : "con interés";
        return `<tr><th scope="row">${n} ${n === 1 ? "pago" : "cuotas"}</th><td>${money(p.price * rate / n)}</td><td style="color:${n <= s.installments ? "var(--success)" : "var(--muted)"}">${label}</td></tr>`;
      }).join("");
      openModal("Medios de pago", `<p style="color:var(--muted);font-size:14px;margin-bottom:12px">Precio: ${money(p.price)}. Simulación con fines demostrativos.</p>
        <table class="specs"><tbody>${rows}</tbody></table>
        <p style="margin-top:16px;font-size:14px">También podés pagar con <strong>Mercado Pago</strong> o <strong>transferencia</strong> (${s.transferDiscount}% OFF).</p>`);
    });

    /* Envío (simulado) */
    $("#ship-calc").addEventListener("submit", (e) => {
      e.preventDefault();
      const zip = $("#zip").value.trim();
      const res = $("#ship-result");
      if (!/^\d{4}$/.test(zip)) { res.innerHTML = `<span style="color:var(--danger)">Ingresá un código postal válido de 4 dígitos.</span>`; return; }
      const amba = Number(zip) < 2000;
      const free = p.price >= s.freeShippingFrom;
      res.innerHTML = `<div class="alert alert--success">${icon("truck")}<div><strong>${free ? "Envío gratis" : "Envío a domicilio: " + money(amba ? s.shippingCost : s.shippingCost + 2500)}</strong><br>Llega ${amba ? "entre mañana y el jueves" : "en 3 a 6 días hábiles"} · Retiro en local: gratis</div></div>`;
    });

    /* Tabs accesibles */
    const tabs = $$(".pdp-tabs [role=tab]");
    const select = (tab) => {
      tabs.forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; $("#" + t.getAttribute("aria-controls")).hidden = !on; });
      tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length]);
        if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length]);
      });
    });
    $("[data-go-reviews]").addEventListener("click", (e) => {
      e.preventDefault();
      select($("#t-reviews"));
      $(".pdp-tabs").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* Reseñas */
    $("#review-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#rv-name"), text = $("#rv-text");
      let ok = true;
      [[name, name.value.trim().length >= 2], [text, text.value.trim().length >= 10]].forEach(([el, valid]) => {
        el.closest(".field").classList.toggle("has-error", !valid); if (!valid) ok = false;
      });
      if (!ok) return;
      const review = { name: name.value.trim(), rating: Number($('input[name="rv-rating"]:checked').value), title: "Reseña de cliente", text: text.value.trim(), date: new Date().toISOString().slice(0, 10), verified: false };
      const saved = store.get("nova_reviews_" + p.id, []);
      saved.unshift(review);
      store.set("nova_reviews_" + p.id, saved);
      $("#review-list").insertAdjacentHTML("afterbegin", reviewHtml(review));
      e.target.reset();
      toast("¡Gracias! Tu reseña fue publicada", "success");
    });

    /* Barra fija de compra (mobile) */
    const bar = $("#sticky-buy");
    bar.innerHTML = `<div><div class="price"><span class="price__now">${money(p.price)}</span></div><small style="color:var(--muted)">${esc(p.name)}</small></div>
      <button type="button" class="btn btn--dark" id="sticky-add" ${out ? "disabled" : ""}>${out ? "Agotado" : "Agregar al carrito"}</button>`;
    $("#sticky-add").addEventListener("click", add);
    if (addBtn && "IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => {
        const vis = !en.isIntersecting && en.boundingClientRect.top < 0;
        bar.classList.toggle("is-visible", vis);
        bar.setAttribute("aria-hidden", !vis);
      }).observe(addBtn);
    }

    /* Relacionados */
    const related = products().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
    if (related.length) {
      $("#related-grid").innerHTML = related.map(productCard).join("");
      $("#related-link").href = `productos.html?cat=${p.category}`;
      $("#related-section").hidden = false;
    }

    // Recientemente vistos (para futuras recomendaciones)
    const seen = store.get("nova_seen", []).filter((id) => id !== p.id);
    seen.unshift(p.id);
    store.set("nova_seen", seen.slice(0, 8));
  }

  function reviewHtml(r) {
    const date = new Date(r.date + "T12:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    return `<article class="review">
      <div class="review__head"><div><strong>${esc(r.name)}</strong>${r.verified ? `<span class="review__verified">✓ Compra verificada</span>` : ""}</div><time datetime="${r.date}">${date}</time></div>
      ${stars(r.rating, false)}
      <p style="margin-top:8px"><strong style="color:var(--ink)">${esc(r.title)}.</strong> ${esc(r.text)}</p>
    </article>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const id = N.params().get("id");
    const p = id && product(id);
    setTimeout(() => (p ? render(p) : renderNotFound($("#pdp-root"))), 150);
  });
})();
