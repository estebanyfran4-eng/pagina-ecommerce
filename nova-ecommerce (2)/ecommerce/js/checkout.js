/* NOVA · Checkout (simulación: no se procesan pagos reales) */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, esc, money, media, icon, cart, toast, store, KEYS, settings } = N;

  const PROVINCES = ["Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"];

  const state = { shipping: "domicilio", payment: "mercadopago" };

  function field(id, label, opts = {}) {
    const { type = "text", auto = "", span = false, placeholder = "", error = "Completá este campo.", inputmode = "", value = "" } = opts;
    return `<div class="field${span ? " span-2" : ""}">
      <label for="${id}">${label}</label>
      <input class="input" id="${id}" name="${id}" type="${type}" ${auto ? `autocomplete="${auto}"` : ""} ${inputmode ? `inputmode="${inputmode}"` : ""} placeholder="${placeholder}" value="${esc(value)}" required>
      <span class="field__error">${error}</span>
    </div>`;
  }

  function renderEmpty(root) {
    root.innerHTML = `<div class="empty" style="margin:48px 0 96px">
      <div class="empty__icon">${icon("bag")}</div>
      <h1 style="font-size:24px">No hay productos para comprar</h1>
      <p>Tu carrito está vacío. Agregá productos para continuar con el checkout.</p>
      <a href="productos.html" class="btn btn--dark">Ver productos</a>
    </div>`;
  }

  function render() {
    const root = $("#checkout-root");
    if (!cart.items().length) { renderEmpty(root); return; }
    const s = settings();
    const user = store.get(KEYS.user, null) || {};
    const [first = "", ...rest] = (user.name || "").split(" ");

    if (!s.methods.domicilio) state.shipping = "retiro";
    const firstPay = ["mercadopago", "tarjeta", "transferencia"].find((k) => s.payments[k]);
    if (!s.payments[state.payment]) state.payment = firstPay;

    root.innerHTML = `
      <ol class="steps" aria-label="Pasos de la compra">
        <li class="is-done"><span class="steps__num">✓</span><span>Carrito</span></li>
        <li class="is-current" aria-current="step"><span class="steps__num">2</span><span>Datos y pago</span></li>
        <li><span class="steps__num">3</span><span>Confirmación</span></li>
      </ol>
      <h1 class="sr-only">Finalizar compra</h1>
      <form class="checkout-layout" id="checkout-form" novalidate>
        <div>
          <section class="checkout-section" aria-labelledby="h-personal">
            <div class="checkout-section__head"><span class="checkout-section__num">1</span><h2 id="h-personal">Datos personales</h2></div>
            <div class="form-grid">
              ${field("firstName", "Nombre", { auto: "given-name", placeholder: "Juan", value: first })}
              ${field("lastName", "Apellido", { auto: "family-name", placeholder: "Pérez", value: rest.join(" ") })}
              ${field("email", "Email", { type: "email", auto: "email", placeholder: "tu@email.com", error: "Ingresá un email válido.", value: user.email || "" })}
              ${field("phone", "Teléfono", { type: "tel", auto: "tel", inputmode: "tel", placeholder: "11 5555-5555", error: "Ingresá un teléfono válido." })}
            </div>
          </section>

          <section class="checkout-section" aria-labelledby="h-ship">
            <div class="checkout-section__head"><span class="checkout-section__num">2</span><h2 id="h-ship">Método de envío</h2></div>
            <div class="option-cards" role="radiogroup" aria-labelledby="h-ship">
              ${s.methods.domicilio ? `<label class="option-card"><input type="radio" name="shipping" value="domicilio" ${state.shipping === "domicilio" ? "checked" : ""}><span class="option-card__radio"></span>
                <span class="option-card__body"><strong>Envío a domicilio</strong><span>Llega en 2 a 5 días hábiles</span></span><span class="option-card__price" id="ship-price"></span></label>` : ""}
              ${s.methods.retiro ? `<label class="option-card"><input type="radio" name="shipping" value="retiro" ${state.shipping === "retiro" ? "checked" : ""}><span class="option-card__radio"></span>
                <span class="option-card__body"><strong>Retiro en local</strong><span>Av. Corrientes 1234, CABA · Listo en 24 h</span></span><span class="option-card__price" style="color:var(--success)">Gratis</span></label>` : ""}
            </div>
            <div id="address-block" style="margin-top:20px">
              <h3 style="font-size:16px;margin-bottom:14px">Dirección de entrega</h3>
              <div class="form-grid">
                ${field("street", "Calle", { auto: "address-line1", placeholder: "Av. Siempre Viva" })}
                ${field("number", "Número", { inputmode: "numeric", placeholder: "742" })}
                ${field("city", "Ciudad", { auto: "address-level2", placeholder: "Berazategui" })}
                <div class="field">
                  <label for="province">Provincia</label>
                  <select class="select" id="province" name="province" required>
                    <option value="">Seleccioná una provincia</option>
                    ${PROVINCES.map((p) => `<option>${p}</option>`).join("")}
                  </select>
                  <span class="field__error">Seleccioná una provincia.</span>
                </div>
                ${field("zip", "Código postal", { auto: "postal-code", inputmode: "numeric", placeholder: "1884", error: "Ingresá un código postal de 4 dígitos." })}
                <div class="field"><label for="notes">Indicaciones (opcional)</label><input class="input" id="notes" placeholder="Piso, depto, timbre…"></div>
              </div>
            </div>
          </section>

          <section class="checkout-section" aria-labelledby="h-pay">
            <div class="checkout-section__head"><span class="checkout-section__num">3</span><h2 id="h-pay">Método de pago</h2></div>
            <div class="option-cards option-cards--3" role="radiogroup" aria-labelledby="h-pay">
              ${s.payments.mercadopago ? `<label class="option-card option-card--pay"><input type="radio" name="payment" value="mercadopago" ${state.payment === "mercadopago" ? "checked" : ""}><span class="option-card__radio"></span>
                <span class="pay-logo pay-logo--mp">MP</span><span class="option-card__body"><strong>Mercado Pago</strong><span>Dinero en cuenta o tarjetas</span></span></label>` : ""}
              ${s.payments.tarjeta ? `<label class="option-card option-card--pay"><input type="radio" name="payment" value="tarjeta" ${state.payment === "tarjeta" ? "checked" : ""}><span class="option-card__radio"></span>
                <span class="pay-logo pay-logo--card">VISA</span><span class="option-card__body"><strong>Tarjeta</strong><span>Hasta ${s.installments} cuotas sin interés</span></span></label>` : ""}
              ${s.payments.transferencia ? `<label class="option-card option-card--pay"><input type="radio" name="payment" value="transferencia" ${state.payment === "transferencia" ? "checked" : ""}><span class="option-card__radio"></span>
                <span class="pay-logo pay-logo--transfer">${s.transferDiscount}%</span><span class="option-card__body"><strong>Transferencia</strong><span>${s.transferDiscount}% OFF extra</span></span></label>` : ""}
            </div>
            <div class="pay-detail" id="pay-detail"></div>
          </section>

          <label class="check" style="margin:4px 0 16px"><input type="checkbox" id="terms" required> Acepto los <a href="info.html#terminos" class="link" target="_blank" rel="noopener">términos y condiciones</a></label>
        </div>

        <aside class="summary" aria-labelledby="co-summary">
          <h2 id="co-summary">Tu pedido</h2>
          <div class="mini-lines" id="mini-lines"></div>
          <div id="co-totals"></div>
          <div class="summary__actions">
            <button type="submit" class="btn btn--accent btn--lg btn--block" id="confirm-btn">Confirmar pedido</button>
            <a href="carrito.html" class="btn btn--ghost btn--block">Volver al carrito</a>
          </div>
          <p class="summary__secure">${icon("shield")} Simulación: no se realizará ningún cobro</p>
        </aside>
      </form>`;

    // Líneas del resumen
    const t0 = cart.totals(state.shipping, state.payment);
    $("#mini-lines").innerHTML = t0.lines.map((l) => `<div class="mini-line">
      <div class="mini-line__media"><span>${media(l.product)}</span><span class="mini-line__qty">${l.qty}</span></div>
      <div><strong>${esc(l.product.name)}</strong>${l.variant ? `<small>${esc(l.variant)}</small>` : ""}</div>
      <span>${money(l.product.price * l.qty)}</span></div>`).join("");

    $$('input[name="shipping"]').forEach((r) => r.addEventListener("change", () => { state.shipping = r.value; updateTotals(); }));
    $$('input[name="payment"]').forEach((r) => r.addEventListener("change", () => { state.payment = r.value; renderPayDetail(); updateTotals(); }));
    // Quitar error al escribir
    $$("#checkout-form .input, #checkout-form .select").forEach((el) => el.addEventListener("input", () => el.closest(".field") && el.closest(".field").classList.remove("has-error")));
    $("#checkout-form").addEventListener("submit", submit);
    renderPayDetail();
    updateTotals();
  }

  function updateTotals() {
    const t = cart.totals(state.shipping, state.payment);
    const s = settings();
    const sp = $("#ship-price");
    if (sp) sp.innerHTML = t.subtotal >= s.freeShippingFrom || (t.coupon && t.coupon.type === "Envío gratis") ? `<span style="color:var(--success)">Gratis</span>` : money(s.shippingCost);
    $("#address-block").hidden = state.shipping !== "domicilio";
    $("#co-totals").innerHTML = `
      <div class="summary__row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      <div class="summary__row summary__row--discount"><span>Descuento${t.coupon ? ` (${esc(t.coupon.code)})` : ""}</span><span>${t.discount ? "−" + money(t.discount) : "$0"}</span></div>
      ${t.transfer ? `<div class="summary__row summary__row--discount"><span>Descuento transferencia</span><span>−${money(t.transfer)}</span></div>` : ""}
      <div class="summary__row"><span>Envío</span><span>${t.shipping ? money(t.shipping) : `<strong style="color:var(--success)">Gratis</strong>`}</span></div>
      <div class="summary__total"><span>Total</span><strong>${money(t.total)}</strong></div>
      ${state.payment === "tarjeta" ? `<p class="summary__note">${s.installments} cuotas sin interés de ${money(t.total / s.installments)}</p>` : ""}`;
  }

  function renderPayDetail() {
    const box = $("#pay-detail");
    const s = settings();
    if (state.payment === "tarjeta") {
      box.innerHTML = `
        <div class="card-preview" aria-hidden="true">
          <div class="card-preview__row"><span class="card-preview__chip"></span><span id="cp-brand">NOVA PAY</span></div>
          <div class="card-preview__num" id="cp-num">•••• •••• •••• ••••</div>
          <div class="card-preview__row"><span id="cp-name">NOMBRE APELLIDO</span><span id="cp-exp">MM/AA</span></div>
        </div>
        <div class="form-grid">
          <div class="field span-2"><label for="cc-num">Número de tarjeta</label><input class="input" id="cc-num" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="19" required><span class="field__error">Ingresá los 16 dígitos de la tarjeta.</span></div>
          <div class="field span-2"><label for="cc-name">Nombre en la tarjeta</label><input class="input" id="cc-name" autocomplete="cc-name" placeholder="Como figura en la tarjeta" required><span class="field__error">Completá el nombre.</span></div>
          <div class="field"><label for="cc-exp">Vencimiento</label><input class="input" id="cc-exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" required><span class="field__error">Formato MM/AA.</span></div>
          <div class="field"><label for="cc-cvv">Código de seguridad</label><input class="input" id="cc-cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" required><span class="field__error">3 o 4 dígitos.</span></div>
          <div class="field span-2"><label for="cc-inst">Cuotas</label><select class="select" id="cc-inst">${[1, 3, 6].filter((n) => n <= s.installments).map((n) => `<option value="${n}">${n} ${n === 1 ? "pago" : "cuotas sin interés"}</option>`).join("")}</select></div>
        </div>
        <p class="field__hint" style="margin-top:12px">Demo: podés usar cualquier número de 16 dígitos. No se guarda ni se envía ningún dato.</p>`;
      const num = $("#cc-num"), name = $("#cc-name"), exp = $("#cc-exp");
      num.addEventListener("input", () => {
        const v = num.value.replace(/\D/g, "").slice(0, 16);
        num.value = v.replace(/(.{4})/g, "$1 ").trim();
        $("#cp-num").textContent = (v + "•".repeat(16 - v.length)).replace(/(.{4})/g, "$1 ").trim();
        $("#cp-brand").textContent = v.startsWith("4") ? "VISA" : v.startsWith("5") ? "MASTERCARD" : v.startsWith("3") ? "AMEX" : "NOVA PAY";
      });
      name.addEventListener("input", () => { $("#cp-name").textContent = name.value.toUpperCase() || "NOMBRE APELLIDO"; });
      exp.addEventListener("input", () => {
        let v = exp.value.replace(/\D/g, "").slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
        exp.value = v; $("#cp-exp").textContent = v || "MM/AA";
      });
      $$("#pay-detail .input").forEach((el) => el.addEventListener("input", () => el.closest(".field").classList.remove("has-error")));
    } else if (state.payment === "transferencia") {
      box.innerHTML = `<div class="bank-box">
        <p style="margin-bottom:6px">Al confirmar te mostraremos los datos para transferir. Tenés <strong>48 h</strong> para enviar el comprobante.</p>
        <div><span>Titular</span><code>NOVA Commerce S.A.</code></div>
        <div><span>CBU</span><code>0000003100012345678901</code></div>
        <div><span>Alias</span><code>NOVA.TIENDA.PAGOS</code></div>
        <div><span>Descuento aplicado</span><strong style="color:var(--success)">${s.transferDiscount}% OFF</strong></div>
      </div>`;
    } else {
      box.innerHTML = `<div style="display:flex;gap:14px;align-items:flex-start">
        <span class="pay-logo pay-logo--mp">MP</span>
        <p style="font-size:14px">Al confirmar serías redirigido a Mercado Pago para completar el pago con tu dinero en cuenta, tarjetas guardadas o cuotas. <strong>En esta demo el pago se simula y se aprueba automáticamente.</strong></p>
      </div>`;
    }
  }

  function validate() {
    const rules = {
      firstName: (v) => v.trim().length >= 2,
      lastName: (v) => v.trim().length >= 2,
      email: (v) => /^\S+@\S+\.\S+$/.test(v),
      phone: (v) => v.replace(/\D/g, "").length >= 8
    };
    if (state.shipping === "domicilio") Object.assign(rules, {
      street: (v) => v.trim().length >= 2, number: (v) => /\d/.test(v), city: (v) => v.trim().length >= 2,
      province: (v) => !!v, zip: (v) => /^\d{4}$/.test(v.trim())
    });
    if (state.payment === "tarjeta") Object.assign(rules, {
      "cc-num": (v) => v.replace(/\D/g, "").length === 16, "cc-name": (v) => v.trim().length >= 3,
      "cc-exp": (v) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v), "cc-cvv": (v) => /^\d{3,4}$/.test(v)
    });
    let firstBad = null;
    Object.entries(rules).forEach(([id, ok]) => {
      const el = document.getElementById(id);
      const valid = ok(el.value);
      el.closest(".field").classList.toggle("has-error", !valid);
      el.setAttribute("aria-invalid", !valid);
      if (!valid && !firstBad) firstBad = el;
    });
    if (firstBad) { firstBad.focus(); toast("Revisá los campos marcados", "error"); return false; }
    if (!$("#terms").checked) { toast("Tenés que aceptar los términos y condiciones", "error"); $("#terms").focus(); return false; }
    return true;
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    const btn = $("#confirm-btn");
    btn.classList.add("is-loading");
    btn.disabled = true;
    const t = cart.totals(state.shipping, state.payment);
    const val = (id) => (document.getElementById(id) || {}).value || "";
    // Número de pedido ficticio correlativo
    const prev = store.get(KEYS.newOrders, []);
    const num = 1062 + prev.length;
    const order = {
      id: "NVA-" + num,
      date: new Date().toISOString().slice(0, 16),
      customerName: `${val("firstName")} ${val("lastName")}`.trim(),
      email: val("email"), phone: val("phone"),
      address: state.shipping === "domicilio" ? `${val("street")} ${val("number")}, ${val("city")}, ${val("province")} (${val("zip")})` : "Retiro en local — Av. Corrientes 1234, CABA",
      items: t.lines.map((l) => [l.id, l.qty, l.product.price, l.variant]),
      shipping: state.shipping === "domicilio" ? "Envío a domicilio" : "Retiro en local",
      payment: { mercadopago: "Mercado Pago", tarjeta: "Tarjeta", transferencia: "Transferencia" }[state.payment],
      subtotal: t.subtotal, discount: t.discount + t.transfer, shippingCost: t.shipping, total: t.total,
      coupon: t.coupon ? t.coupon.code : null,
      status: state.payment === "transferencia" ? "Pendiente" : "Confirmado"
    };
    setTimeout(() => {
      prev.unshift(order);
      store.set(KEYS.newOrders, prev);
      store.set(KEYS.lastOrder, order);
      cart.clear();
      toast("Pedido realizado correctamente", "success");
      renderSuccess(order);
      window.scrollTo({ top: 0 });
    }, 1200);
  }

  function renderSuccess(o) {
    const root = $("#checkout-root");
    const eta = new Date(Date.now() + 4 * 864e5).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    root.innerHTML = `
      <ol class="steps" aria-label="Pasos de la compra">
        <li class="is-done"><span class="steps__num">✓</span><span>Carrito</span></li>
        <li class="is-done"><span class="steps__num">✓</span><span>Datos y pago</span></li>
        <li class="is-current" aria-current="step"><span class="steps__num">3</span><span>Confirmación</span></li>
      </ol>
      <section class="checkout-success" aria-labelledby="ok-title">
        <div class="success-mark"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h1 id="ok-title" tabindex="-1">¡Pedido realizado!</h1>
        <p>Gracias por tu compra, ${esc(o.customerName.split(" ")[0])}. Te enviamos la confirmación a <strong>${esc(o.email)}</strong>.</p>
        <div class="order-number"><span>Número de pedido</span><strong>#${o.id}</strong></div>
        <div class="success-card">
          <div class="mini-lines" style="max-height:none">${o.items.map(([id, qty, price, variant]) => {
            const p = N.product(id);
            return p ? `<div class="mini-line"><div class="mini-line__media"><span>${media(p)}</span><span class="mini-line__qty">${qty}</span></div><div><strong>${esc(p.name)}</strong>${variant ? `<small>${esc(variant)}</small>` : ""}</div><span>${money(price * qty)}</span></div>` : "";
          }).join("")}</div>
          <div class="summary__total" style="margin-top:0"><span>Total pagado</span><strong>${money(o.total)}</strong></div>
          <div class="success-card__grid">
            <div><span>Entrega</span>${esc(o.shipping)}${o.shipping === "Envío a domicilio" ? ` · llega aprox. el ${eta}` : ""}</div>
            <div><span>Pago</span>${esc(o.payment)}${o.payment === "Transferencia" ? " · pendiente de acreditación" : " · aprobado (simulado)"}</div>
            <div style="grid-column:1/-1"><span>Dirección</span>${esc(o.address)}</div>
          </div>
        </div>
        <div class="success-actions">
          <a href="cuenta.html#pedidos" class="btn btn--dark btn--lg">Ver mis pedidos</a>
          <a href="productos.html" class="btn btn--outline btn--lg">Seguir comprando</a>
        </div>
      </section>`;
    $("#ok-title").focus();
    document.title = `Pedido ${o.id} confirmado · NOVA`;
  }

  document.addEventListener("DOMContentLoaded", render);
})();
