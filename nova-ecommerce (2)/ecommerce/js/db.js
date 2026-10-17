/* =========================================================
   NOVA · Capa de cuentas (NovaAuth)
   Todas las pantallas hablan con estas funciones, nunca con
   Supabase directo. Así el mismo código funciona en:
     - MODO REAL: Supabase (si js/supabase-config.js tiene claves)
     - MODO DEMO: localStorage (si no hay claves)
   Todas las funciones son async y devuelven datos simples.
   ========================================================= */
(function () {
  "use strict";
  const N = window.Nova;
  const { store, KEYS } = N;
  const cfg = window.NOVA_SUPABASE || {};
  const enabled = !!(cfg.url && cfg.anonKey);
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let sb = null;

  // Carga el SDK de Supabase solo si hace falta (el modo demo funciona sin internet)
  const ready = !enabled ? Promise.resolve(null) : new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.onload = () => { sb = window.supabase.createClient(cfg.url, cfg.anonKey); resolve(sb); };
    s.onerror = () => reject(new Error("No se pudo conectar con el servidor. Revisá tu conexión a internet."));
    document.head.appendChild(s);
  });

  // Traduce los errores más comunes de Supabase al español
  function friendly(err) {
    const m = String((err && err.message) || err || "");
    if (/invalid login credentials/i.test(m)) return "Email o contraseña incorrectos.";
    if (/email not confirmed/i.test(m)) return "Todavía no confirmaste tu email. Revisá tu bandeja de entrada.";
    if (/already registered|already been registered/i.test(m)) return "Ya existe una cuenta con ese email. Probá iniciar sesión.";
    if (/password should be at least/i.test(m)) return "La contraseña es demasiado corta.";
    if (/rate limit|too many/i.test(m)) return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
    if (/network|fetch/i.test(m)) return "No hay conexión con el servidor. Revisá tu internet.";
    return m || "Ocurrió un error inesperado.";
  }
  const fail = (err) => { throw new Error(friendly(err)); };
  // Guarda nombre/email para que el header sepa que hay sesión (sin datos sensibles)
  const syncHeader = (u) => { if (u) store.set(KEYS.user, { name: u.name, email: u.email }); else store.remove(KEYS.user); };

  /* ---------------- MODO DEMO (localStorage) ---------------- */
  const DEMO_ADDR = [
    { id: 1, label: "Casa", street: "Av. Mitre 1450, 3° B", city: "Berazategui, Buenos Aires", zip: "1884", main: true },
    { id: 2, label: "Trabajo", street: "Av. Corrientes 880, piso 7", city: "CABA", zip: "1043", main: false }
  ];
  const demo = {
    async getUser() {
      const u = store.get(KEYS.user, null);
      return u ? { id: "demo", role: "admin", phone: "", birth: "", newsletter: true, ...u } : null;
    },
    async signIn(email, password) {
      if (password.length < 6) fail("Invalid login credentials");
      const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const u = { name, email };
      syncHeader(u); return u;
    },
    async signUp({ name, email }) { const u = { name, email }; syncHeader(u); return { user: u, needsConfirm: false }; },
    async signOut() { syncHeader(null); },
    async resetPassword() { return true; },
    async updatePassword() { return true; },
    async saveProfile(p) { const u = { ...(await demo.getUser()), ...p }; store.set(KEYS.user, u); return u; },
    async listAddresses() { return store.get("nova_addresses", DEMO_ADDR); },
    async addAddress(a) { const l = await demo.listAddresses(); l.push({ ...a, id: Date.now(), main: !l.length }); store.set("nova_addresses", l); },
    async deleteAddress(id) {
      const l = (await demo.listAddresses()).filter((a) => String(a.id) !== String(id));
      if (l.length && !l.some((a) => a.main)) l[0].main = true;
      store.set("nova_addresses", l);
    },
    async setMainAddress(id) { store.set("nova_addresses", (await demo.listAddresses()).map((a) => ({ ...a, main: String(a.id) === String(id) }))); }
  };

  /* ---------------- MODO REAL (Supabase) ---------------- */
  const real = {
    async getUser() {
      await ready;
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { syncHeader(null); return null; }
      const { data, error } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (error) fail(error);
      const p = data || {};
      const u = { id: session.user.id, email: session.user.email, name: p.full_name || session.user.email.split("@")[0], phone: p.phone || "", birth: p.birth_date || "", newsletter: p.newsletter !== false, role: p.role || "customer" };
      syncHeader(u);
      return u;
    },
    async signIn(email, password) {
      await ready;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) fail(error);
      return real.getUser();
    },
    async signUp({ name, email, password, newsletter }) {
      await ready;
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name, newsletter: !!newsletter }, emailRedirectTo: pageUrl("cuenta.html") }
      });
      if (error) fail(error);
      // Si Supabase pide confirmar el email, todavía no hay sesión
      if (!data.session) return { user: null, needsConfirm: true };
      return { user: await real.getUser(), needsConfirm: false };
    },
    async signOut() { await ready; await sb.auth.signOut(); syncHeader(null); },
    async resetPassword(email) {
      await ready;
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: pageUrl("nueva-clave.html") });
      if (error) fail(error);
      return true;
    },
    async updatePassword(password) {
      await ready;
      const { error } = await sb.auth.updateUser({ password });
      if (error) fail(error);
      return true;
    },
    async saveProfile({ name, phone, birth, newsletter, email }) {
      await ready;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) fail("Tu sesión expiró. Volvé a iniciar sesión.");
      const { error } = await sb.from("profiles").update({ full_name: name, phone, birth_date: birth || null, newsletter }).eq("id", user.id);
      if (error) fail(error);
      let emailPending = false;
      if (email && email !== user.email) {
        const r = await sb.auth.updateUser({ email });
        if (r.error) fail(r.error);
        emailPending = true; // Supabase manda un email para confirmar el cambio
      }
      const u = await real.getUser();
      return { ...u, emailPending };
    },
    async listAddresses() {
      await ready;
      const { data, error } = await sb.from("addresses").select("*").order("created_at");
      if (error) fail(error);
      return data.map((a) => ({ id: a.id, label: a.label, street: a.street, city: a.city, zip: a.zip, main: a.is_main }));
    },
    async addAddress(a) {
      await ready;
      const { data: { user } } = await sb.auth.getUser();
      const current = await real.listAddresses();
      const { error } = await sb.from("addresses").insert({ user_id: user.id, label: a.label, street: a.street, city: a.city, zip: a.zip, is_main: !current.length });
      if (error) fail(error);
    },
    async deleteAddress(id) {
      await ready;
      const list = await real.listAddresses();
      const removed = list.find((a) => String(a.id) === String(id));
      const { error } = await sb.from("addresses").delete().eq("id", id);
      if (error) fail(error);
      const rest = list.filter((a) => a !== removed);
      if (removed && removed.main && rest.length) await real.setMainAddress(rest[0].id);
    },
    async setMainAddress(id) {
      await ready;
      const { data: { user } } = await sb.auth.getUser();
      let r = await sb.from("addresses").update({ is_main: false }).eq("user_id", user.id);
      if (r.error) fail(r.error);
      r = await sb.from("addresses").update({ is_main: true }).eq("id", id);
      if (r.error) fail(r.error);
    }
  };

  // URL absoluta de otra página del sitio (para los links de los emails)
  function pageUrl(page) {
    return new URL(page, location.href.replace(/\/admin\/[^/]*$/, "/").replace(/[^/]*$/, "")).href;
  }

  const api = enabled ? real : demo;
  window.NovaAuth = {
    enabled, ready,
    client: () => sb,
    ...api,
    /* Si hay Supabase y no hay sesión, manda al login y vuelve después */
    async requireUser(next) {
      const u = await api.getUser();
      if (!u && enabled) { location.replace(`${window.NOVA_BASE || ""}login.html?next=${encodeURIComponent(next)}`); return null; }
      return u;
    }
  };
})();
