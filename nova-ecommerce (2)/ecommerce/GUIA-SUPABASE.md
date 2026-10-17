# Guía: cuentas reales con Supabase (Paso 1)

Esta guía es para aprender haciendo. Al terminar, los clientes de la tienda van a poder
**registrarse, iniciar sesión, recuperar la contraseña y guardar sus datos y direcciones
en una base de datos real**, y el panel admin solo va a poder abrirlo el dueño.

> Tiempo estimado: 30–45 minutos. No hace falta instalar nada.

---

## Cómo está armado (entendé esto primero)

```
Navegador (tu HTML/CSS/JS)                      Supabase (en la nube)
─────────────────────────                       ─────────────────────
login.html / cuenta.html                        Auth  → emails y contraseñas
      │                                         Postgres → tablas profiles, addresses
      ▼                                         RLS   → reglas: quién puede ver qué
js/db.js  (NovaAuth)  ──── internet ────────►
      ▲
js/supabase-config.js  (URL + anon key)
```

- **`js/db.js`** es la única pieza que habla con Supabase. Las páginas llaman a
  `NovaAuth.signIn()`, `NovaAuth.getUser()`, `NovaAuth.addAddress()`, etc.
- Si **no** configurás claves, `db.js` usa el **modo demo** (localStorage). Por eso la
  tienda sigue funcionando offline mientras aprendés.
- **La seguridad NO está en el JavaScript** (cualquiera puede leerlo). Está en las reglas
  **RLS** de la base de datos: aunque alguien modifique el JS, Postgres solo le devuelve
  sus propias filas.

---

## 1. Crear el proyecto en Supabase

1. Entrá a <https://supabase.com> y creá una cuenta (podés usar GitHub).
2. **New project** → nombre: `nova-tienda` (o el del cliente).
3. Elegí una contraseña de base de datos fuerte y **guardala** (no va en el código).
4. Región: la más cercana a tus clientes (para Argentina, **São Paulo**).
5. Esperá 1–2 minutos a que se cree.

## 2. Crear las tablas y la seguridad

1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abrí el archivo **`supabase/01-cuentas.sql`**, copiá todo y pegalo.
3. Tocá **Run**. Tiene que decir *Success*.
4. Andá a **Table Editor**: vas a ver las tablas `profiles` y `addresses`.

Leé el SQL con calma, está comentado. Lo más importante:

| Parte | Qué hace |
|---|---|
| `profiles` | Datos del cliente (nombre, teléfono, rol). El email/contraseña los guarda Supabase en `auth.users`. |
| `addresses` | Direcciones de envío, varias por cliente. |
| `handle_new_user` (trigger) | Cuando alguien se registra, crea su fila en `profiles` automáticamente. |
| `enable row level security` + `policy` | Cada cliente solo ve y edita lo suyo. El admin ve todo. |
| `protect_role` | Nadie puede hacerse admin a sí mismo desde la web. |

## 3. Conectar la tienda

1. En Supabase: **Project Settings → API** (en algunas versiones: **Project Settings → API Keys** y **Data API**).
2. Copiá:
   - **Project URL** → algo como `https://abcd1234.supabase.co`
   - **anon / public key** (en versiones nuevas puede llamarse **publishable key**)
3. Abrí **`js/supabase-config.js`** y pegalos:

```js
window.NOVA_SUPABASE = {
  url: "https://abcd1234.supabase.co",
  anonKey: "eyJhbGciOi..."
};
```

⚠️ **Nunca** uses la `service_role` / `secret key` en el frontend: esa clave saltea todas las reglas.

## 4. Configurar las URLs (para los emails)

En **Authentication → URL Configuration**:

- **Site URL**: mientras probás, `http://127.0.0.1:5500` (Live Server). Cuando publiques, la URL real.
- **Redirect URLs**: agregá
  - `http://127.0.0.1:5500/**`
  - la URL publicada, por ejemplo `https://nova-tienda.netlify.app/**`

Sin esto, los links de “confirmar email” y “recuperar contraseña” no vuelven a tu sitio.

> Importante: abrí la tienda con **Live Server** (http://…), no con doble clic (file://).
> Los links de los emails necesitan una dirección web.

## 5. Probar

1. Abrí `login.html` con Live Server → pestaña **Crear cuenta** → registrate.
2. Por defecto Supabase pide **confirmar el email**: vas a ver la pantalla “Revisá tu email”.
   Abrí el mail, confirmá y después iniciá sesión.
   - Para probar más rápido podés desactivarlo en **Authentication → Sign In / Providers → Email → Confirm email**.
     En producción dejalo activado.
3. En **Mi cuenta**: cambiá tu teléfono, agregá una dirección, recargá la página → los datos siguen ahí.
4. Abrí la tienda en **otro navegador o el celular** e iniciá sesión: ves los mismos datos. 🎉
5. En Supabase → **Table Editor → profiles** vas a ver tu fila.

## 6. Hacer admin al dueño

1. Registrate en la tienda con el email del dueño (o el tuyo para probar).
2. En **SQL Editor**, ejecutá (con ese email):

```sql
update public.profiles set role = 'admin' where email = 'dueño@tienda.com';
```

3. Ahora, al iniciar sesión con esa cuenta, te lleva a `admin/index.html`.
   Un cliente común que intente entrar al panel ve “Acceso restringido”.

## 7. Publicar en internet (gratis para empezar)

La forma más simple es **Netlify**:

1. Entrá a <https://app.netlify.com> → **Add new site → Deploy manually**.
2. Arrastrá la carpeta `ecommerce` completa.
3. Te da una URL tipo `https://nombre-random.netlify.app` (podés cambiarla o conectar el dominio del cliente).
4. Volvé al paso 4 y agregá esa URL en Supabase.

(Otras opciones iguales de simples: Vercel, Cloudflare Pages.)

## 8. Antes de entregarlo a un cliente

- **Emails:** el servidor de email incluido en Supabase tiene un límite bajo de envíos por hora y es
  para pruebas. Para producción configurá un SMTP propio en
  **Authentication → Emails / SMTP Settings** (por ejemplo con Resend o Brevo).
- **Plantillas de email:** en **Authentication → Emails** podés traducir y personalizar los mails
  (confirmación, recuperar contraseña) con la marca del cliente.
- **Backups:** revisá qué incluye el plan que uses.
- **Cuenta del cliente:** lo ideal es crear el proyecto de Supabase con una cuenta del cliente
  (o transferírselo), y vos quedar como colaborador.

---

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| “No se pudo conectar con el servidor” | Sin internet o URL mal copiada en `supabase-config.js`. |
| “Email o contraseña incorrectos” recién registrado | Falta confirmar el email. |
| El link del email abre `localhost:3000` | Falta configurar **Site URL / Redirect URLs** (paso 4). |
| Se registra pero no aparece en `profiles` | No corriste el SQL completo (falta el trigger). Volvé a correrlo. |
| Error “row-level security” | Estás intentando leer/escribir filas de otro usuario: las reglas funcionan. |
| El admin no entra al panel | Falta el `update ... set role = 'admin'` del paso 6. |

---

## Qué sigue (próximos pasos)

- **Paso 2 — Catálogo y pedidos en la base:** tablas `products`, `orders`, `order_items`,
  `coupons`; el admin edita productos reales y el checkout guarda pedidos de verdad.
- **Paso 3 — Mercado Pago:** una Edge Function crea la preferencia de pago y otra recibe el
  webhook que confirma el pago y marca el pedido como pagado.
- **Paso 4 — Fotos:** Supabase Storage para subir imágenes de productos desde el admin.
