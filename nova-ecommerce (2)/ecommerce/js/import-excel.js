/* NOVA · Importar productos desde Excel (.xlsx) o CSV
   Sin librerías: un .xlsx es un ZIP con XML adentro. Lo abrimos con
   DecompressionStream (nativo del navegador) y leemos la primera hoja.
   API: NovaImport.readFile(file) → filas; NovaImport.parse(filas, productosActuales) → { items, errors } */
(function () {
  "use strict";

  const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  /* ---------- ZIP / XLSX ---------- */
  async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function unzip(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error("zip");
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const files = {};
    const dec = new TextDecoder();
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const off = dv.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      files[name] = { method, csize, off };
      p += 46 + nlen + elen + clen;
    }
    return {
      has: (name) => !!files[name],
      async text(name) {
        const f = files[name];
        if (!f) return null;
        const nlen = dv.getUint16(f.off + 26, true), elen = dv.getUint16(f.off + 28, true);
        const start = f.off + 30 + nlen + elen;
        const raw = u8.subarray(start, start + f.csize);
        const bytes = f.method === 0 ? raw : await inflate(raw);
        return dec.decode(bytes);
      }
    };
  }
  const xml = (s) => new DOMParser().parseFromString(s, "application/xml");
  const colIndex = (ref) => { let n = 0; for (const ch of ref.replace(/[0-9]/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

  async function readXlsx(file) {
    const zip = await unzip(await file.arrayBuffer());
    // Textos compartidos
    const shared = [];
    const sst = await zip.text("xl/sharedStrings.xml");
    if (sst) xml(sst).querySelectorAll("si").forEach((si) => { shared.push(Array.from(si.querySelectorAll("t")).map((t) => t.textContent).join("")); });
    // Primera hoja
    let sheetPath = "xl/worksheets/sheet1.xml";
    const wb = await zip.text("xl/workbook.xml"), rels = await zip.text("xl/_rels/workbook.xml.rels");
    if (wb && rels) {
      const first = xml(wb).querySelector("sheets > sheet, sheet");
      const rid = first && (first.getAttribute("r:id") || first.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"));
      const rel = rid && Array.from(xml(rels).querySelectorAll("Relationship")).find((r) => r.getAttribute("Id") === rid);
      if (rel) { const t = rel.getAttribute("Target"); sheetPath = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, ""); }
    }
    const sheet = await zip.text(sheetPath);
    if (!sheet) throw new Error("sheet");
    const rows = [];
    xml(sheet).querySelectorAll("sheetData > row").forEach((r) => {
      const idx = Number(r.getAttribute("r")) - 1;
      const row = [];
      r.querySelectorAll("c").forEach((c) => {
        const t = c.getAttribute("t"), v = c.querySelector("v");
        let val = "";
        if (t === "s") val = shared[Number(v && v.textContent)] ?? "";
        else if (t === "inlineStr") val = Array.from(c.querySelectorAll("t")).map((x) => x.textContent).join("");
        else if (t === "b") val = v && v.textContent === "1" ? "sí" : "no";
        else if (t === "str" || t === "e") val = v ? v.textContent : "";
        else if (v) val = Number(v.textContent);
        row[colIndex(c.getAttribute("r"))] = val;
      });
      rows[idx] = row;
    });
    return Array.from(rows, (r) => r || []);
  }

  /* ---------- CSV ---------- */
  function readCsv(text) {
    text = text.replace(/^﻿/, "");
    const first = text.split(/\r?\n/)[0] || "";
    const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cur); cur = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += ch;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) return readCsv(await file.text());
    if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
      if (typeof DecompressionStream === "undefined") throw new Error("nosupport");
      return readXlsx(file);
    }
    throw new Error("format");
  }

  /* ---------- Interpretar filas ---------- */
  const COLUMNS = {
    sku: ["sku", "codigo", "cod"],
    name: ["nombre", "producto", "name", "titulo"],
    category: ["categoria", "category", "rubro"],
    brand: ["marca", "brand"],
    price: ["precio", "price", "precio actual", "precio venta"],
    oldPrice: ["precio anterior", "precio antes", "precio de lista", "precio lista", "old price"],
    stock: ["stock", "cantidad", "existencias"],
    description: ["descripcion", "description", "detalle"],
    status: ["estado", "status"],
    featured: ["destacado", "destacar", "featured"],
    variantLabel: ["variante", "tipo de variante", "variante nombre", "nombre de variante"],
    variantOptions: ["opciones", "opciones de variante", "opciones variante", "variantes"],
    photos: ["fotos", "imagenes", "imagen", "foto", "images"]
  };
  const REQUIRED = { sku: "SKU", name: "Nombre", category: "Categoría", price: "Precio", stock: "Stock", description: "Descripción" };

  function num(v) {
    if (typeof v === "number") return v;
    let s = String(v ?? "").replace(/[$\s]|ARS/gi, "");
    if (!s) return NaN;
    if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    return Number(s);
  }
  const list = (v) => String(v ?? "").split(/[,;|\n]/).map((x) => x.trim()).filter(Boolean);
  const yes = (v) => ["si", "s", "x", "1", "true", "yes", "y", "verdadero"].includes(norm(v));

  function parse(rows, existing, categories) {
    const errors = [], items = [];
    // Fila de encabezados: la primera que reconozca la columna SKU y Nombre
    let h = rows.findIndex((r) => r.some((c) => COLUMNS.sku.includes(norm(c))) && r.some((c) => COLUMNS.name.includes(norm(c))));
    if (h < 0) return { items, errors: [{ row: 1, msg: "No encontré la fila de títulos. Usá la plantilla (necesita al menos las columnas SKU y Nombre)." }], fatal: true };
    const map = {};
    rows[h].forEach((c, i) => { const n = norm(c); for (const k in COLUMNS) if (map[k] === undefined && COLUMNS[k].includes(n)) map[k] = i; });
    const missing = Object.keys(REQUIRED).filter((k) => map[k] === undefined).map((k) => REQUIRED[k]);
    if (missing.length) return { items, errors: [{ row: h + 1, msg: "Faltan columnas: " + missing.join(", ") + "." }], fatal: true };
    const get = (r, k) => (map[k] === undefined ? "" : r[map[k]] ?? "");

    const bySku = new Map(existing.map((p) => [norm(p.sku), p]));
    const seen = new Set();
    const usable = categories.filter((c) => !c.virtual);

    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      if (!r.some((c) => String(c ?? "").trim() !== "")) continue;
      const n = i + 1, bad = [];
      const sku = String(get(r, "sku")).trim().toUpperCase();
      const name = String(get(r, "name")).trim();
      const desc = String(get(r, "description")).trim();
      const price = num(get(r, "price")), stock = num(get(r, "stock"));
      const oldRaw = get(r, "oldPrice"), old = String(oldRaw).trim() === "" ? undefined : num(oldRaw);
      const catRaw = norm(get(r, "category"));
      const cat = usable.find((c) => norm(c.id) === catRaw || norm(c.name) === catRaw);

      if (sku.length < 3) bad.push("SKU vacío o muy corto");
      else if (seen.has(norm(sku))) bad.push("SKU repetido en el archivo");
      if (name.length < 3) bad.push("Nombre muy corto");
      if (!cat) bad.push(`Categoría “${get(r, "category")}” no existe (usá: ${usable.map((c) => c.name).join(", ")})`);
      if (!(price > 0)) bad.push("Precio inválido");
      if (!(stock >= 0) || !Number.isFinite(stock)) bad.push("Stock inválido");
      if (old !== undefined && !(old > price)) bad.push("El precio anterior debe ser mayor al precio");
      if (desc.length < 10) bad.push("Descripción muy corta (mín. 10 letras)");

      let status = "Activo";
      const stRaw = norm(get(r, "status"));
      if (stRaw) {
        const st = ["activo", "borrador", "archivado"].find((x) => x === stRaw);
        if (!st) bad.push("Estado debe ser Activo, Borrador o Archivado"); else status = st[0].toUpperCase() + st.slice(1);
      }
      const vLabel = String(get(r, "variantLabel")).trim(), vOpts = list(get(r, "variantOptions"));
      if ((vLabel && !vOpts.length) || (!vLabel && vOpts.length)) bad.push("Variante: completá el nombre (ej. Talle) y las opciones (ej. S, M, L)");

      if (bad.length) { errors.push({ row: n, sku: sku || "—", msg: bad.join(" · ") }); continue; }
      seen.add(norm(sku));

      const photos = list(get(r, "photos")).map((s) => (/^(https?:|data:|\/|\.\.\/|assets\/)/i.test(s) ? s : "assets/products/" + s));
      const prev = bySku.get(norm(sku));
      const values = {
        sku, name, category: cat.id, price, stock, description: desc, status, oldPrice: old,
        brand: String(get(r, "brand")).trim() || (prev && prev.brand) || "Nova",
        featured: map.featured === undefined ? !!(prev && prev.featured) : yes(get(r, "featured"))
      };
      if (vLabel) values.variants = { label: vLabel, options: vOpts };
      if (photos.length) values.images = photos;
      items.push({ row: n, isNew: !prev, prevId: prev && prev.id, values, hasVariants: !!vLabel });
    }
    return { items, errors };
  }

  window.NovaImport = { readFile, parse };
})();
