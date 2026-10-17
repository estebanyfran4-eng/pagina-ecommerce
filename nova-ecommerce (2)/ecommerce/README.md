# NOVA · E-commerce (demo frontend)

Plantilla de e-commerce profesional hecha con **HTML, CSS y JavaScript puro**.
Sin backend, sin base de datos, sin dependencias ni conexión a internet.

## Cómo abrirlo

1. Abrí la carpeta `ecommerce/` en Visual Studio Code.
2. Abrí `index.html` en el navegador (doble clic) **o** usá la extensión *Live Server* (clic derecho → *Open with Live Server*).

El panel de administración está en `admin/index.html` (también hay un link “Panel admin” en el footer de la tienda).

## Flujos para probar

- **Compra:** Home → Productos → Producto → Carrito (probá el cupón `NOVA10`) → Checkout → ¡Pedido realizado!
- **Cuenta:** Iniciar sesión (cualquier email + 6 caracteres, o “entrar como Juan Pérez”) → Mi cuenta → Pedidos / Favoritos / Direcciones / Datos.
- **Admin:** los cambios se reflejan en la tienda:
  - Crear/editar productos → aparecen en el catálogo.
  - Crear un cupón → funciona en el carrito.
  - Cambiar el estado de un pedido → se ve en “Mis pedidos” del cliente.
  - Configuración (costo de envío, envío gratis, medios de pago, cuotas, nombre y logo) → se aplica en la tienda.
  - “Configuración → Restablecer” vuelve todo a los datos de ejemplo.

## Estructura

```text
ecommerce/
├── index.html, productos.html, producto.html, carrito.html,
│   checkout.html, login.html, cuenta.html, info.html
├── admin/        index, productos, categorias, pedidos, clientes,
│                 envios, cupones, estadisticas, configuracion
├── css/
│   ├── style.css     sistema de diseño + tienda (variables en :root)
│   └── admin.css     panel de administración
├── js/
│   ├── data/
│   │   ├── products.js     30+ productos, 6 categorías, marcas
│   │   └── store-data.js   clientes, pedidos, cupones, envíos, estadísticas
│   ├── app.js          núcleo: carrito, favoritos, cupones, toasts, header/footer, cards
│   ├── home.js · products.js · product.js · cart.js · checkout.js
│   ├── auth.js · account.js · info.js
│   ├── admin.js        layout del panel, modales, gráficos SVG, acceso a datos
│   └── admin-pages.js  lógica de cada página del panel
└── assets/
    ├── favicon.svg
    └── products/       (lugar para fotos reales)
```

## Personalización rápida

- **Colores y tipografía:** variables al inicio de `css/style.css` (`--primary`, `--background`, `--surface`, `--text`, `--muted`, `--border`, `--success`, `--warning`, `--danger`).
- **Marca:** nombre y logo desde Admin → Configuración (o `DEFAULT_SETTINGS` en `js/app.js`).
- **Productos:** editá `js/data/products.js`. Para usar fotos reales agregá a cada producto
  `images: ["assets/products/mi-foto.jpg", "assets/products/mi-foto-2.jpg"]`.
  Sin fotos, se generan ilustraciones SVG automáticamente (campos `icon` y `hue`).
- **Carga masiva por Excel:** Admin → Productos → *Importar Excel*. Usá `assets/plantilla-productos.xlsx`
  (una fila por producto; si el SKU ya existe se actualiza). Después filtrá por *Sin fotos* y subí las fotos de cada producto.

## Cuentas reales (Supabase)

Seguí **GUIA-SUPABASE.md**: pegás el SQL de `supabase/01-cuentas.sql`, completás `js/supabase-config.js`
y el login, registro, recuperación de contraseña, datos y direcciones quedan guardados en la nube.
Sin claves configuradas, todo sigue funcionando en modo demo.

## Pasar a full-stack

Todo el acceso a datos está centralizado (`Nova.products()`, `Nova.cart`, `Nova.allOrders()`,
`Admin.data.*`). Para conectar una API o base de datos, reemplazá esas funciones por llamadas
`fetch` sin tocar las vistas. El almacenamiento actual es `localStorage` (claves `nova_*`).

> Demo: los pagos, emails, logins y envíos son simulados. No se envía ningún dato a servidores.
