/* NOVA · Home */
(function () {
  "use strict";
  const { $, $$, products, product, productCard, art, media, categoryCount, discountPct, initReveal } = window.Nova;

  document.addEventListener("DOMContentLoaded", () => {
    // Imágenes del hero
    $$("[data-hero]").forEach((el) => { const p = product(el.dataset.hero); if (p) el.innerHTML = media(p, el.classList.contains("hero__product--a") ? 0 : 1); });
    $$("[data-hero-thumb]").forEach((el) => { const p = product(el.dataset.heroThumb); if (p) el.innerHTML = media(p); });

    // Arte decorativo de promos
    const promo1 = $('[data-promo-art="1"]');
    if (promo1) promo1.innerHTML = art({ icon: "headphones", hue: 222, name: "" }, 1);
    const promo2 = $('[data-promo-art="2"]');
    if (promo2) promo2.innerHTML = art({ icon: "tag", hue: 18, name: "" }, 3);

    // Categorías
    const catGrid = $("#cat-grid");
    catGrid.innerHTML = window.NOVA_CATEGORIES.map((c, i) => `
      <a class="cat-card reveal" style="transition-delay:${i * 60}ms" href="productos.html?${c.id === "ofertas" ? "ofertas=1" : "cat=" + c.id}">
        <div class="cat-card__media">${art({ icon: c.icon, hue: c.hue, name: c.name }, c.id === "ofertas" ? 1 : 0)}</div>
        <div class="cat-card__body">
          <div><strong>${c.name}</strong><small>${categoryCount(c.id)} productos</small></div>
          <span class="cat-card__arrow" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        </div>
      </a>`).join("");

    // Destacados con tabs
    const grid = $("#featured-grid");
    const lists = {
      featured: () => products().filter((p) => p.featured).slice(0, 12),
      sale: () => products().filter((p) => discountPct(p) > 0).sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 12),
      best: () => products().slice().sort((a, b) => b.sold - a.sold).slice(0, 12),
      new: () => products().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12)
    };
    function renderTab(key) {
      // Estado de carga breve (simula la respuesta de una API)
      grid.setAttribute("aria-busy", "true");
      grid.innerHTML = Array.from({ length: 8 }, () => `<div class="skeleton-card" aria-hidden="true"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`).join("");
      setTimeout(() => {
        let list = lists[key]();
        if (key === "featured" && list.length < 12) list = list.concat(lists.best().filter((p) => !list.includes(p))).slice(0, 12);
        grid.innerHTML = list.map(productCard).join("");
        grid.removeAttribute("aria-busy");
      }, 350);
    }
    $$("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
      $$("[data-tab]").forEach((t) => t.setAttribute("aria-selected", t === tab));
      renderTab(tab.dataset.tab);
    }));
    renderTab("featured");

    // Recién llegados
    $("#new-grid").innerHTML = lists.new().slice(0, 4).map(productCard).join("");

    initReveal();
  });
})();
