/* NOVA · Nueva contraseña
   El email de "¿Olvidaste tu contraseña?" trae a esta página con un
   token en la URL. El SDK de Supabase lo lee solo y abre una sesión
   temporal que permite cambiar la contraseña. */
(function () {
  "use strict";
  const { $, toast } = window.Nova;
  const A = window.NovaAuth;

  document.addEventListener("DOMContentLoaded", async () => {
    const status = $("#np-status");
    const form = $("#np-form");
    let hasSession = !A.enabled; // en modo demo se simula

    if (A.enabled) {
      try {
        const sb = await A.ready;
        // Espera a que el SDK procese el token de la URL
        const { data } = await sb.auth.getSession();
        hasSession = !!data.session;
        if (!hasSession) {
          await new Promise((resolve) => {
            const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
              if (session) { hasSession = true; sub.subscription.unsubscribe(); resolve(); }
            });
            setTimeout(resolve, 2500);
          });
        }
      } catch (err) { status.className = "alert alert--danger"; status.textContent = err.message; return; }
    }

    if (!hasSession) {
      status.className = "alert alert--danger";
      status.innerHTML = 'El enlace venció o ya se usó. <a class="link" href="login.html">Pedí uno nuevo</a> desde “¿Olvidaste tu contraseña?”.';
      return;
    }
    status.hidden = true;
    form.hidden = false;
    $("#np-pass").focus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const p1 = $("#np-pass"), p2 = $("#np-pass2");
      const bad1 = p1.value.length < 8, bad2 = p1.value !== p2.value;
      p1.closest(".field").classList.toggle("has-error", bad1);
      p2.closest(".field").classList.toggle("has-error", !bad1 && bad2);
      if (bad1 || bad2) return;
      const btn = form.querySelector("[type=submit]");
      btn.classList.add("is-loading"); btn.disabled = true;
      try {
        await A.updatePassword(p1.value);
        toast("Contraseña actualizada", "success");
        setTimeout(() => { location.href = "cuenta.html"; }, 700);
      } catch (err) {
        toast(err.message, "error");
        btn.classList.remove("is-loading"); btn.disabled = false;
      }
    });
  });
})();
