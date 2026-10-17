/* =========================================================
   NOVA · Datos ficticios del panel (clientes, pedidos, cupones,
   envíos y series para estadísticas). Reemplazables por API.
   ========================================================= */

window.NOVA_CUSTOMERS = [
  { id: "C-001", name: "Juan Pérez",        email: "juan.perez@mail.com",      phone: "11 5823-4410", city: "CABA",           province: "Buenos Aires", since: "2025-03-12", status: "Activo" },
  { id: "C-002", name: "Lucía Fernández",   email: "lucia.fernandez@mail.com", phone: "11 6234-9981", city: "La Plata",       province: "Buenos Aires", since: "2025-06-02", status: "Activo" },
  { id: "C-003", name: "Martín Gómez",      email: "martin.gomez@mail.com",    phone: "351 488-2210", city: "Córdoba",        province: "Córdoba",      since: "2025-01-20", status: "VIP" },
  { id: "C-004", name: "Sofía Rodríguez",   email: "sofi.rodriguez@mail.com",  phone: "341 522-7713", city: "Rosario",        province: "Santa Fe",     since: "2025-09-15", status: "Activo" },
  { id: "C-005", name: "Tomás Álvarez",     email: "tomas.alvarez@mail.com",   phone: "261 431-0098", city: "Mendoza",        province: "Mendoza",      since: "2026-02-08", status: "Nuevo" },
  { id: "C-006", name: "Valentina Ruiz",    email: "vale.ruiz@mail.com",       phone: "11 4410-7765", city: "Quilmes",        province: "Buenos Aires", since: "2024-11-30", status: "VIP" },
  { id: "C-007", name: "Nicolás Torres",    email: "nico.torres@mail.com",     phone: "223 594-3321", city: "Mar del Plata",  province: "Buenos Aires", since: "2025-12-01", status: "Activo" },
  { id: "C-008", name: "Camila Díaz",       email: "camila.diaz@mail.com",     phone: "381 466-1204", city: "San Miguel de Tucumán", province: "Tucumán", since: "2026-07-19", status: "Nuevo" },
  { id: "C-009", name: "Federico Romero",   email: "fede.romero@mail.com",     phone: "299 512-8876", city: "Neuquén",        province: "Neuquén",      since: "2025-04-27", status: "Inactivo" },
  { id: "C-010", name: "Agustina Morales",  email: "agus.morales@mail.com",    phone: "11 3398-2256", city: "Berazategui",    province: "Buenos Aires", since: "2025-08-10", status: "Activo" }
];

/* Estados de pedido: Pendiente, Confirmado, Preparando, Enviado, Entregado, Cancelado
   items: [idProducto, cantidad, precioUnitario (opcional: precio histórico de la compra)] */
window.NOVA_ORDERS = [
  { id: "NVA-1061", customer: "C-004", date: "2026-09-29T10:12", items: [["auriculares-nova-pro", 1], ["cargador-dual-65w", 1]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Pendiente" },
  { id: "NVA-1060", customer: "C-008", date: "2026-09-29T09:40", items: [["buzo-cloud", 2]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Pendiente" },
  { id: "NVA-1059", customer: "C-002", date: "2026-09-28T19:05", items: [["lampara-halo", 1], ["set-tazas-ceramica", 1]], payment: "Transferencia", shipping: "Retiro en local", status: "Confirmado" },
  { id: "NVA-1058", customer: "C-003", date: "2026-09-28T16:22", items: [["tablet-slate-11", 1]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Preparando" },
  { id: "NVA-1057", customer: "C-006", date: "2026-09-28T11:48", items: [["zapatillas-urban-x", 1], ["remera-basic-pack", 1]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Preparando" },
  { id: "NVA-1056", customer: "C-010", date: "2026-09-27T21:30", items: [["mochila-daily", 1]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Enviado" },
  { id: "NVA-1055", customer: "C-007", date: "2026-09-27T14:02", items: [["running-velocity", 1], ["botella-termica-750", 2]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Enviado" },
  { id: "NVA-1054", customer: "C-001", date: "2026-09-26T18:15", items: [["smartwatch-active", 1]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Enviado" },
  { id: "NVA-1053", customer: "C-005", date: "2026-09-26T10:50", items: [["campera-essential", 1], ["gorra-classic", 1]], payment: "Transferencia", shipping: "Envío a domicilio", status: "Cancelado" },
  { id: "NVA-1052", customer: "C-003", date: "2026-09-25T13:37", items: [["teclado-mecanico-k75", 1], ["mouse-glide", 1]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1051", customer: "C-006", date: "2026-09-24T09:10", items: [["silla-nordica", 2]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1050", customer: "C-002", date: "2026-09-23T17:44", items: [["anteojos-sol-aero", 1]], payment: "Mercado Pago", shipping: "Retiro en local", status: "Entregado" },
  { id: "NVA-1049", customer: "C-009", date: "2026-09-22T12:00", items: [["botas-trail", 1]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1048", customer: "C-004", date: "2026-09-21T20:26", items: [["difusor-aroma", 1], ["manta-tejida", 1]], payment: "Transferencia", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1047", customer: "C-010", date: "2026-09-20T15:15", items: [["parlante-pulse-mini", 1]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1046", customer: "C-001", date: "2026-09-18T11:31", items: [["pantalon-cargo-flex", 1], ["remera-basic-pack", 1]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1045", customer: "C-007", date: "2026-09-16T19:48", items: [["bolso-weekender", 1]], payment: "Mercado Pago", shipping: "Retiro en local", status: "Entregado" },
  { id: "NVA-1044", customer: "C-003", date: "2026-09-14T08:59", items: [["zapatillas-urban-x", 1]], payment: "Tarjeta", shipping: "Envío a domicilio", status: "Cancelado" },
  { id: "NVA-1043", customer: "C-006", date: "2026-09-12T16:03", items: [["maceta-autorriego", 3], ["set-tazas-ceramica", 1]], payment: "Transferencia", shipping: "Envío a domicilio", status: "Entregado" },
  { id: "NVA-1042", customer: "C-001", date: "2026-09-10T14:20", items: [["zapatillas-urban-x", 1, 149990], ["gorra-classic", 2, 20000]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Entregado" }
  ,{ id: "NVA-1038", customer: "C-001", date: "2026-09-05T10:05", items: [["smartwatch-active", 1, 79990]], payment: "Mercado Pago", shipping: "Envío a domicilio", status: "Enviado" }
];

window.NOVA_COUPONS = [
  { code: "NOVA10",     type: "Porcentaje", value: 10,    uses: 342, limit: 1000, expires: "2026-12-31", status: "Activo" },
  { code: "NOVA20",     type: "Porcentaje", value: 20,    uses: 118, limit: 300,  expires: "2026-10-31", status: "Activo" },
  { code: "BIENVENIDA", type: "Porcentaje", value: 15,    uses: 604, limit: 0,    expires: "2027-03-31", status: "Activo" },
  { code: "ENVIOGRATIS",type: "Envío gratis", value: 0,   uses: 211, limit: 500,  expires: "2026-11-15", status: "Activo" },
  { code: "AHORRA5000", type: "Monto fijo", value: 5000,  uses: 87,  limit: 200,  expires: "2026-10-15", status: "Activo" },
  { code: "CYBER30",    type: "Porcentaje", value: 30,    uses: 500, limit: 500,  expires: "2026-05-15", status: "Agotado" },
  { code: "HOTSALE25",  type: "Porcentaje", value: 25,    uses: 420, limit: 600,  expires: "2026-05-20", status: "Vencido" },
  { code: "INVIERNO15", type: "Porcentaje", value: 15,    uses: 96,  limit: 400,  expires: "2026-08-31", status: "Vencido" },
  { code: "VIP10000",   type: "Monto fijo", value: 10000, uses: 12,  limit: 50,   expires: "2026-12-31", status: "Pausado" },
  { code: "PRIMAVERA",  type: "Porcentaje", value: 12,    uses: 34,  limit: 800,  expires: "2026-12-21", status: "Activo" }
];

/* Datos de envío por pedido (transportista, tracking, estimada) */
window.NOVA_SHIPMENTS = [
  { order: "NVA-1061", carrier: "Andreani",     method: "Estándar",  tracking: "AND-99231045", status: "Preparando",  eta: "2026-10-03" },
  { order: "NVA-1060", carrier: "OCA",          method: "Estándar",  tracking: "OCA-44819302", status: "Preparando",  eta: "2026-10-04" },
  { order: "NVA-1058", carrier: "Andreani",     method: "Express",   tracking: "AND-99230877", status: "Preparando",  eta: "2026-09-30" },
  { order: "NVA-1057", carrier: "Correo Arg.",  method: "Estándar",  tracking: "CA-778120933AR", status: "Despachado", eta: "2026-10-02" },
  { order: "NVA-1056", carrier: "OCA",          method: "Estándar",  tracking: "OCA-44817766", status: "En tránsito", eta: "2026-10-01" },
  { order: "NVA-1055", carrier: "Andreani",     method: "Express",   tracking: "AND-99229810", status: "En tránsito", eta: "2026-09-30" },
  { order: "NVA-1054", carrier: "Correo Arg.",  method: "Estándar",  tracking: "CA-778119204AR", status: "En tránsito", eta: "2026-10-01" },
  { order: "NVA-1052", carrier: "Andreani",     method: "Estándar",  tracking: "AND-99226651", status: "Entregado",   eta: "2026-09-28" },
  { order: "NVA-1051", carrier: "OCA",          method: "Estándar",  tracking: "OCA-44811029", status: "Entregado",   eta: "2026-09-27" },
  { order: "NVA-1049", carrier: "Correo Arg.",  method: "Estándar",  tracking: "CA-778112855AR", status: "Devuelto",   eta: "2026-09-26" },
  { order: "NVA-1048", carrier: "Andreani",     method: "Express",   tracking: "AND-99221478", status: "Entregado",   eta: "2026-09-23" },
  { order: "NVA-1047", carrier: "OCA",          method: "Estándar",  tracking: "OCA-44806612", status: "Entregado",   eta: "2026-09-24" }
];

/* Métricas agregadas del dashboard, por período */
window.NOVA_STATS = {
  periods: {
    "hoy":  { label: "Hoy",       sales: 312490,   orders: 14,  customers: 1284, products: 326, newCustomers: 6,   returning: 8,   ticket: 22321, units: 21 },
    "7d":   { label: "7 días",    sales: 1498300,  orders: 61,  customers: 1284, products: 326, newCustomers: 38,  returning: 23,  ticket: 24562, units: 97 },
    "30d":  { label: "30 días",   sales: 4285900,  orders: 184, customers: 1284, products: 326, newCustomers: 112, returning: 72,  ticket: 23293, units: 301 },
    "90d":  { label: "90 días",   sales: 11920400, orders: 522, customers: 1284, products: 326, newCustomers: 298, returning: 224, ticket: 22836, units: 861 },
    "anio": { label: "Este año",  sales: 36480200, orders: 1611,customers: 1284, products: 326, newCustomers: 904, returning: 707, ticket: 22644, units: 2688 }
  },
  // Ventas diarias de los últimos 30 días (ARS)
  daily: [98200, 121400, 104900, 88300, 132800, 176500, 158200, 112300, 119700, 97600, 141200, 163900, 188400, 171000,
          126400, 118900, 134600, 99800, 152300, 197600, 211400, 145900, 138200, 129400, 161800, 174300, 208900, 186200, 155700, 312490],
  // Ventas mensuales del año (ARS)
  monthly: [2410000, 2280000, 2890000, 2760000, 4120000, 3350000, 3480000, 3920000, 4285900],
  byCategory: { "Tecnología": 1628200, "Indumentaria": 857200, "Calzado": 942900, "Accesorios": 514300, "Hogar": 343300 },
  lowStockThreshold: 10
};
