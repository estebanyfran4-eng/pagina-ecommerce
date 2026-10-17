/* NOVA · Página de ayuda: formulario de contacto simulado */
(function () {
  "use strict";
  const { $, toast } = window.Nova;
  document.addEventListener("DOMContentLoaded", () => {
    const form = $("#contact-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const checks = [[$("#c-name"), (v) => v.trim().length >= 2], [$("#c-email"), (v) => /^\S+@\S+\.\S+$/.test(v)], [$("#c-msg"), (v) => v.trim().length >= 5]];
      let ok = true;
      checks.forEach(([el, fn]) => { const bad = !fn(el.value); el.closest(".field").classList.toggle("has-error", bad); if (bad) ok = false; });
      if (!ok) return;
      form.reset();
      toast("Recibimos tu consulta. Te respondemos en menos de 24 h", "success");
    });
    // Abrir la pregunta frecuente si se llega con #faq
    if (location.hash === "#faq") { const d = document.querySelector("#faq details"); if (d) d.open = true; }
  });
})();
