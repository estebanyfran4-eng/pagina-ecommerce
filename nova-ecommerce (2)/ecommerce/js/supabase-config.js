/* =========================================================
   NOVA · Conexión a Supabase
   1) Creá un proyecto en https://supabase.com
   2) Project Settings → API → copiá "Project URL" y "anon public key"
   3) Pegalos acá abajo.

   Si los dejás vacíos, la tienda sigue funcionando en MODO DEMO
   (todo se guarda solo en el navegador, como hasta ahora).

   La "anon key" es pública por diseño: lo que protege los datos
   son las reglas RLS del archivo supabase/01-cuentas.sql.
   NUNCA pegues acá la "service_role key".
   ========================================================= */
window.NOVA_SUPABASE = {
  url: "",      // ej: "https://abcdefghijk.supabase.co"
  anonKey: ""   // ej: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
