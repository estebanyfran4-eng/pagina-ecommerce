/* NOVA · Página de carrito */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, esc, money, media, icon, cart, toast, store, KEYS, findCoupon, products, productCard } = N;

  function render() {
    const root = $("#cart-root");
    const t = cart.totals("domicilio");
    const count = cart.count();
    $("#cart-heading-count").textContent = count ? `(${count})` : "";

    if (!t.lines.length) {
      root.innerHTML = `<div class="empty" style="margin-bottom:96px">
        <div class="empty__icon">${icon("bag")}</div>
        <h2>Tu carrito está vacío</h2>
        <p>Probá explorar nuestros productos.</p>
        <a href="productos.html" class="btn btn--dark">Ver productos</a>
        <a href="cuenta.html#favoritos" class="btn btn--outline">Ver favoritos</a>
      </div>`;
      renderUpsell([]);
      return;
    }

    const pct = Math.min(100, Math.round((t.subtotal / t.freeShipFrom) * 100));
    root.innerHTML = `<div class="cart-layout">
      <section aria-label="Productos en el carrito">
        <div class="ship-progress">
          ${t.missingForFree > 0 ? `Te faltan <strong>${money(t.missingForFree)}</strong> para obtener <strong>envío gratis</strong>.` : `<strong style="color:var(--success)">¡Genial! Tenés envío gratis.</strong>`}
          <div class="ship-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progreso hacia envío gratis"><div class="ship-progress__fill" style="width:${pct}%"></div></div>
        </div>
        <div class="cart-list">
          ${t.lines.map((l, i) => {
            const p = l.product;
            return `<article class="cart-item" data-index="${i}">
              <a class="cart-item__media" href="producto.html?id=${encodeURIComponent(p.id)}" tabindex="-1" aria-hidden="true">${media(p)}</a>
              <div class="cart-item__info">
                <h3><a href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
                ${l.variant ? `<span class="cart-item__meta">${esc(p.variants ? p.variants.label : "Variante")}: ${esc(l.variant)}</span>` : ""}
                <span class="cart-item__unit">${money(p.price)} c/u ${p.stock <= 5 ? `<span style="color:var(--warning);font-size:13px"> · Quedan ${p.stock}</span>` : ""}</span>
                <div class="cart-item__actions">
                  <div class="qty qty--sm">
                    <button type="button" data-qty="-1" aria-label="Restar uno de ${esc(p.name)}" ${l.qty <= 1 ? "disabled" : ""}>${icon("minus")}</button>
                    <label class="sr-only" for="qty-${i}">Cantidad de ${esc(p.name)}</label>
                    <input id="qty-${i}" type="number" min="1" max="${p.stock}" value="${l.qty}" data-qty-input>
                    <button type="button" data-qty="1" aria-label="Sumar uno de ${esc(p.name)}" ${l.qty >= p.stock ? "disabled" : ""}>${icon("plus")}</button>
                  </div>
                  <button type="button" class="cart-item__remove" data-remove>${icon("trash")} Eliminar</button>
                </div>
              </div>
              <div class="cart-item__total">${money(p.price * l.qty)}${p.oldPrice ? `<small>${money(p.oldPrice * l.qty)}</small>` : ""}</div>
            </article>`;
          }).join("")}
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:20px">
          <a href="productos.html" class="link-arrow"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(180deg)"><path d="M5 12h14M13 6l6 6-6 6"/></svg> Continuar comprando</a>
          <button type="button" class="btn btn--ghost btn--sm" id="clear-cart">Vaciar carrito</button>
        </div>
      </section>

      <aside class="summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Resumen de compra</h2>
        <div class="summary__row"><span>Subtotal (${count} ${count === 1 ? "producto" : "productos"})</span><span>${money(t.subtotal)}</span></div>
        ${t.savings ? `<div class="summary__row summary__row--discount"><span>Ahorro en ofertas</span><span>−${money(t.savings)}</span></div>` : ""}
        <div class="summary__row summary__row--discount"><span>Descuento${t.coupon ? ` (${esc(t.coupon.code)})` : ""}</span><span>${t.discount ? "−" + money(t.discount) : "$0"}</span></div>
        <div class="summary__row"><span>Envío</span><span>${t.shipping ? money(t.shipping) : `<strong style="color:var(--success)">Gratis</strong>`}</span></div>
        <div class="coupon">
          ${t.coupon ? `<div class="coupon__applied"><span>Cupón ${esc(t.coupon.code)} aplicado</span><button type="button" id="remove-coupon">Quitar</button></div>`
            : `<form class="coupon__row" id="coupon-form" novalidate>
                <label for="coupon-code" class="sr-only">Código de cupón</label>
                <input class="input" id="coupon-code" placeholder="Código de cupón" autocomplete="off">
                <button type="submit" class="btn btn--outline">Aplicar</button>
              </form>
              <p class="field__hint" style="margin-top:6px">Probá con <strong>NOVA10</strong> o <strong>NOVA20</strong>.</p>`}
        </div>
        <div class="summary__total"><span>Total</span><strong>${money(t.total)}</strong></div>
        <p class="summary__note">o ${N.settings().installments} cuotas sin interés de ${money(t.total / N.settings().installments)}</p>
        <div class="summary__actions">
          <a href="checkout.html" class="btn btn--dark btn--lg btn--block">Finalizar compra</a>
          <a href="productos.html" class="btn btn--outline btn--block">Continuar comprando</a>
        </div>
        <p class="summary__secure">${icon("shield")} Compra 100% segura</p>
      </aside>
    </div>`;

    // Eventos
    $$(".cart-item").forEach((row) => {
      const i = Number(row.dataset.index);
      $$("[data-qty]", row).forEach((b) => b.addEventListener("click", () => {
        const current = cart.items()[i].qty;
        cart.setQty(i, current + Number(b.dataset.qty));
      }));
      $("[data-qty-input]", row).addEventListener("change", (e) => cart.setQty(i, Number(e.target.value) || 1));
      $("[data-remove]", row).addEventListener("click", () => {
        row.classList.add("is-removing");
        setTimeout(() => { cart.remove(i); toast("Producto eliminado", "info"); }, 260);
      });
    });
    $("#clear-cart").addEventListener("click", () => {
      if (confirm("¿Querés vaciar el carrito?")) { cart.clear(); toast("Carrito vaciado", "info"); }
    });
    const form = $("#coupon-form");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = $("#coupon-code").value.trim();
      if (!code) { toast("Ingresá un código de cupón", "error"); return; }
      const res = findCoupon(code);
      if (res.error) { toast(res.error, "error"); $("#coupon-code").focus(); return; }
      store.set(KEYS.coupon, res.coupon.code);
      toast(`Cupón ${res.coupon.code} aplicado`, "success");
      render();
    });
    const rc = $("#remove-coupon");
    if (rc) rc.addEventListener("click", () => { store.remove(KEYS.coupon); toast("Cupón eliminado", "info"); render(); });

    renderUpsell(t.lines.map((l) => l.id));
  }

  function renderUpsell(exclude) {
    const list = products().filter((p) => !exclude.includes(p.id) && p.stock > 0).sort((a, b) => b.sold - a.sold).slice(0, 4);
    $("#upsell-grid").innerHTML = list.map(productCard).join("");
    $("#upsell").hidden = !list.length;
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    document.addEventListener("cart:change", render);
  });
})();
