/* NOVA · Login, registro y recuperación de contraseña
   Usa NovaAuth (js/db.js): cuentas reales con Supabase si está
   configurado, o simulación en el navegador (modo demo). */
(function () {
  "use strict";
  const N = window.Nova;
  const { $, $$, toast, art, esc } = N;
  const A = window.NovaAuth;
  const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v);

  function setError(input, bad) {
    input.closest(".field").classList.toggle("has-error", bad);
    input.setAttribute("aria-invalid", bad);
    return !bad;
  }

  function show(view) {
    const panels = { login: $("#panel-login"), register: $("#panel-register"), forgot: $("#panel-forgot"), check: $("#panel-check") };
    Object.entries(panels).forEach(([k, el]) => { if (el) el.hidden = k !== view; });
    $("#tab-login").setAttribute("aria-selected", view !== "register");
    $("#tab-register").setAttribute("aria-selected", view === "register");
    const h = panels[view].querySelector("h1");
    if (h) { h.tabIndex = -1; h.focus(); }
  }

  // Adónde volver después de entrar (solo páginas propias del sitio)
  function nextUrl(u) {
    const next = N.params().get("next") || "";
    if (/^(admin\/)?[\w-]+\.html(#[\w-]+)?$/.test(next)) return next;
    return u && u.role === "admin" && A.enabled ? "admin/index.html" : "cuenta.html";
  }

  // Ejecuta una acción con spinner en el botón y errores amigables
  async function withLoading(btn, fn) {
    btn.classList.add("is-loading");
    btn.disabled = true;
    try { return await fn(); }
    catch (err) { toast(err.message, "error"); return null; }
    finally { btn.classList.remove("is-loading"); btn.disabled = false; }
  }

  function welcome(u) {
    toast(`¡Hola, ${u.name.split(" ")[0]}! Iniciaste sesión`, "success");
    setTimeout(() => { location.href = nextUrl(u); }, 600);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    $("#auth-art").innerHTML = art({ icon: "bag", hue: 18, name: "" }, 3);
    if (location.hash === "#registro") show("register");

    // Modo demo: se muestra el acceso rápido. Con Supabase se oculta.
    const demoHint = $("#demo-hint");
    if (A.enabled && demoHint) demoHint.hidden = true;

    // Si ya tiene sesión, no tiene sentido mostrar el login
    if (A.enabled) {
      try { const u = await A.getUser(); if (u) { location.replace(nextUrl(u)); return; } } catch (e) { /* sigue en el login */ }
    }

    $("#tab-login").addEventListener("click", () => show("login"));
    $("#tab-register").addEventListener("click", () => show("register"));
    $$("[data-go]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); show(a.dataset.go); }));
    $("#forgot-link").addEventListener("click", (e) => { e.preventDefault(); show("forgot"); });

    $$("[data-toggle-pass]").forEach((b) => b.addEventListener("click", () => {
      const input = document.getElementById(b.dataset.togglePass);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      b.textContent = showing ? "Mostrar" : "Ocultar";
      b.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
    }));
    $$(".auth .input").forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("has-error")));

    /* ---------- Iniciar sesión ---------- */
    const loginBtn = $("#login-form [type=submit]");
    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#login-email"), pass = $("#login-pass");
      const ok = [setError(email, !emailOk(email.value)), setError(pass, pass.value.length < 6)].every(Boolean);
      if (!ok) { toast("Revisá los datos ingresados", "error"); return; }
      const u = await withLoading(loginBtn, () => A.signIn(email.value.trim(), pass.value));
      if (u) welcome(u);
    });
    const demoBtn = $("#demo-login");
    if (demoBtn) demoBtn.addEventListener("click", async () => {
      const u = await withLoading(loginBtn, () => A.signIn("juan.perez@mail.com", "demo1234"));
      if (u) welcome({ ...u, name: "Juan Pérez" });
    });
    $$("[data-social]").forEach((b) => b.addEventListener("click", () => {
      toast(`El acceso con ${b.dataset.social} se activa en Supabase → Authentication → Providers`, "info");
    }));

    /* ---------- Crear cuenta ---------- */
    const pass = $("#reg-pass");
    pass.addEventListener("input", () => {
      const v = pass.value;
      const score = (v.length >= 8) + /\d/.test(v) + /[A-Z]/.test(v) + /[^\w]/.test(v);
      const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"];
      const colors = ["var(--danger)", "var(--danger)", "var(--warning)", "var(--success)", "var(--success)"];
      $("#pass-strength").innerHTML = v ? `Seguridad: <strong style="color:${colors[score]}">${labels[score]}</strong>` : "Usá al menos 8 caracteres, con números y letras.";
    });
    const regBtn = $("#register-form [type=submit]");
    $("#register-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const n = $("#reg-name"), l = $("#reg-last"), m = $("#reg-email");
      const ok = [setError(n, n.value.trim().length < 2), setError(l, l.value.trim().length < 2), setError(m, !emailOk(m.value)), setError(pass, pass.value.length < 8)].every(Boolean);
      if (!ok) { toast("Revisá los datos ingresados", "error"); return; }
      if (!$("#reg-terms").checked) { toast("Tenés que aceptar los términos", "error"); return; }
      const res = await withLoading(regBtn, () => A.signUp({
        name: `${n.value.trim()} ${l.value.trim()}`, email: m.value.trim(), password: pass.value, newsletter: $("#reg-news").checked
      }));
      if (!res) return;
      if (res.needsConfirm) {
        $("#check-email").textContent = m.value.trim();
        show("check");
      } else {
        welcome(res.user);
      }
    });

    /* ---------- Recuperar contraseña ---------- */
    const forgotBtn = $("#forgot-form [type=submit]");
    $("#forgot-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const m = $("#forgot-email");
      if (!setError(m, !emailOk(m.value))) return;
      const sent = await withLoading(forgotBtn, () => A.resetPassword(m.value.trim()));
      if (!sent) return;
      const box = $("#forgot-ok");
      box.hidden = false;
      box.innerHTML = `Listo. Si <strong>${esc(m.value)}</strong> tiene una cuenta, vas a recibir un enlace para crear una nueva contraseña${A.enabled ? "." : " (simulado en modo demo)."}`;
    });
  });
})();
