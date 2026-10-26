/**
 * Adaptador de Axios que simula el backend (VITE_API_MOCK=true). No requiere dependencias.
 * Responde con la forma del contrato, incluidos los errores problem+json con su `code`,
 * para que frontend construya y pruebe las pantallas antes de que el endpoint exista.
 */
import { AxiosError, AxiosHeaders } from "axios";
import { CATEGORIAS, MOTIVOS, MOVIMIENTOS, PERMISOS_POR_ROL, PRODUCTOS, PROVEEDORES, UNIDADES, USUARIOS } from "./datos";

const CONTRASENA = "spa12345";
/** POST que crean recursos responden 201 en la API; los demás 200. */
const CREA = /^\/(usuarios|categorias|productos|proveedores|movimientos\/(entradas|salidas|\d+\/anulaciones))$/;
const ACEPTA = /^\/auth\/recuperar$/;
const estado = { productos: structuredClone(PRODUCTOS), movimientos: structuredClone(MOVIMIENTOS), proveedores: structuredClone(PROVEEDORES), claves: new Map() };

export function reiniciarSimulacion() {
  estado.productos = structuredClone(PRODUCTOS);
  estado.movimientos = structuredClone(MOVIMIENTOS);
  estado.proveedores = structuredClone(PROVEEDORES);
  estado.claves = new Map();
}

const responder = (config, status, data) => ({
  data, status, statusText: String(status), headers: new AxiosHeaders({ "content-type": "application/json" }), config, request: {},
});

function problema(config, status, code, detail) {
  const respuesta = { ...responder(config, status, { type: `about:blank`, title: code, status, detail, code, errors: [] }) };
  return new AxiosError(detail, String(status), config, {}, respuesta);
}

function usuarioDelToken(config) {
  const auth = config.headers?.Authorization ?? config.headers?.get?.("Authorization");
  const [, token] = String(auth ?? "").split("Bearer ");
  return USUARIOS.find((u) => `simulado.${u.id}` === token);
}

const sesion = (u) => ({ id: u.id, correo: u.correo, nombre_completo: u.nombre_completo, rol: u.rol, permisos: PERMISOS_POR_ROL[u.rol] });
const pagina = (items, params = {}) => {
  const page = Number(params.page ?? 1);
  const size = Number(params.size ?? 20);
  return { items: items.slice((page - 1) * size, page * size), total: items.length, page, size };
};
const decimal = (n) => Number(n).toFixed(3);
const costo = (n) => Number(n).toFixed(4);

/** Distancia de gran círculo (haversine), equivalente a ST_Distance sobre geography para estas escalas. */
function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const h = Math.sin(rad(b.latitud - a.latitud) / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(rad(b.longitud - a.longitud) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

function aplicarMovimiento(config, tipo, cuerpo, usuario) {
  const clave = config.headers?.["Idempotency-Key"] ?? config.headers?.get?.("Idempotency-Key");
  if (clave && estado.claves.has(clave)) return estado.claves.get(clave);
  const producto = estado.productos.find((p) => p.id === cuerpo.producto_id);
  if (!producto) throw problema(config, 404, "RECURSO_NO_EXISTE", "El producto no existe");
  if (producto.descontinuado) throw problema(config, 409, "PRODUCTO_DESCONTINUADO", "El producto está descontinuado");
  const signo = tipo === "SALIDA" ? -1 : 1;
  const saldo = Number(producto.stock_actual) + signo * Number(cuerpo.cantidad);
  if (saldo < 0) throw problema(config, 409, "STOCK_INSUFICIENTE", "La salida supera el stock disponible");
  producto.stock_actual = decimal(saldo);
  const minimo = producto.stock_minimo === null ? null : Number(producto.stock_minimo);
  producto.estado = saldo === 0 ? "AGOTADO" : minimo !== null && saldo <= minimo ? "BAJO_STOCK" : "DISPONIBLE";
  const movimiento = {
    id: estado.movimientos.length + 1, producto_id: producto.id, tipo, motivo_codigo: cuerpo.motivo_codigo ?? "ANULACION",
    cantidad: decimal(cuerpo.cantidad), saldo_resultante: producto.stock_actual, costo_unitario: cuerpo.costo_unitario ?? null, proveedor_id: cuerpo.proveedor_id ?? null,
    observacion: cuerpo.observacion ?? null, registrado_por: usuario.id, ocurrido_en: new Date().toISOString(),
    movimiento_anulado_id: cuerpo.movimiento_anulado_id ?? null, anulado_por_id: null,
  };
  estado.movimientos.push(movimiento);
  const resultado = { movimiento, saldo: producto.stock_actual, estado: producto.estado };
  if (clave) estado.claves.set(clave, resultado);
  return resultado;
}

/** [método, patrón, permiso | null (público) | "" (autenticado), manejador] */
const RUTAS = [
  ["post", /^\/auth\/login$/, null, (c, _m, b) => {
    const u = USUARIOS.find((x) => x.correo === b.correo);
    if (!u || b.contrasena !== CONTRASENA) throw problema(c, 401, "CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos");
    if (!u.activo) throw problema(c, 403, "USUARIO_INACTIVO", "La cuenta está desactivada");
    return { access_token: `simulado.${u.id}`, token_type: "bearer", expires_in: 1800, usuario: sesion(u) };
  }],
  ["post", /^\/auth\/recuperar$/, null, () => ({ mensaje: "Si el correo está registrado, recibirá un enlace para restablecer la contraseña." })],
  ["get", /^\/auth\/me$/, "", (_c, _m, _b, u) => sesion(u)],
  ["get", /^\/usuarios$/, "usuario.gestionar", (c) => pagina(USUARIOS, c.params)],
  ["post", /^\/usuarios$/, "usuario.gestionar", (_c, _m, b) => ({ id: crypto.randomUUID(), activo: true, creado_en: new Date().toISOString(), ...b })],
  ["get", /^\/usuarios\/([\w-]+)$/, "usuario.gestionar", (c, [id]) => USUARIOS.find((u) => u.id === id) ?? Promise.reject(problema(c, 404, "RECURSO_NO_EXISTE", "El usuario no existe"))],
  ["patch", /^\/usuarios\/([\w-]+)$/, "usuario.gestionar", (_c, [id], b) => ({ ...USUARIOS.find((u) => u.id === id), ...b })],
  ["patch", /^\/usuarios\/([\w-]+)\/estado$/, "usuario.gestionar", (_c, [id], b) => ({ ...USUARIOS.find((u) => u.id === id), activo: b.activo })],
  ["get", /^\/roles$/, "usuario.gestionar", () => Object.entries(PERMISOS_POR_ROL).map(([codigo, permisos]) => ({ codigo, nombre: codigo, permisos }))],
  ["get", /^\/categorias$/, "producto.consultar", () => CATEGORIAS.filter((c) => c.activa)],
  ["post", /^\/categorias$/, "catalogo.administrar", (_c, _m, b) => ({ id: CATEGORIAS.length + 1, orden: 0, activa: true, descripcion: null, ...b })],
  ["patch", /^\/categorias\/(\d+)$/, "catalogo.administrar", (_c, [id], b) => ({ ...CATEGORIAS.find((x) => x.id === Number(id)), ...b })],
  ["get", /^\/unidades-medida$/, "producto.consultar", () => UNIDADES],
  ["get", /^\/productos$/, "producto.consultar", (c) => {
    const p = c.params ?? {};
    const items = estado.productos.filter((x) =>
      (p.incluir_descontinuados || !x.descontinuado) &&
      (!p.categoria_id || x.categoria_id === Number(p.categoria_id)) &&
      (!p.estado || x.estado === p.estado) &&
      (!p.q || `${x.codigo} ${x.nombre}`.toLowerCase().includes(String(p.q).toLowerCase())));
    return pagina(items, p);
  }],
  ["get", /^\/productos\/([\w-]+)$/, "producto.consultar", (c, [id]) => estado.productos.find((x) => x.id === id) ?? Promise.reject(problema(c, 404, "RECURSO_NO_EXISTE", "El producto no existe"))],
  ["post", /^\/productos$/, "producto.crear", (c, _m, b) => {
    if (estado.productos.some((x) => x.codigo.toLowerCase() === String(b.codigo).toLowerCase())) {
      throw problema(c, 409, "CODIGO_DUPLICADO", "El código ya está registrado");
    }
    const nuevo = { id: crypto.randomUUID(), descripcion: null, stock_actual: decimal(b.cantidad_inicial ?? 0), stock_minimo: b.stock_minimo ?? null, estado: b.cantidad_inicial ? "DISPONIBLE" : "AGOTADO", descontinuado: false, version: 1, creado_en: new Date().toISOString(), actualizado_en: new Date().toISOString(), ...b };
    estado.productos.push(nuevo);
    return nuevo;
  }],
  ["patch", /^\/productos\/([\w-]+)$/, "producto.editar", (c, [id], b) => {
    const p = estado.productos.find((x) => x.id === id);
    if (!p) throw problema(c, 404, "RECURSO_NO_EXISTE", "El producto no existe");
    const version = c.headers?.["If-Match"] ?? c.headers?.get?.("If-Match");
    if (Number(version) !== p.version) throw problema(c, 412, "VERSION_CONFLICTO", "Otro usuario modificó el producto primero");
    Object.assign(p, b, { version: p.version + 1 });
    return p;
  }],
  ["put", /^\/productos\/([\w-]+)\/stock-minimo$/, "producto.configurar_minimo", (_c, [id], b) => Object.assign(estado.productos.find((x) => x.id === id), { stock_minimo: b.stock_minimo })],
  ["post", /^\/productos\/([\w-]+)\/descontinuar$/, "producto.descontinuar", (_c, [id]) => Object.assign(estado.productos.find((x) => x.id === id), { descontinuado: true, estado: "DESCONTINUADO" })],
  ["post", /^\/productos\/([\w-]+)\/reactivar$/, "producto.descontinuar", (_c, [id]) => Object.assign(estado.productos.find((x) => x.id === id), { descontinuado: false, estado: "DISPONIBLE" })],
  ["get", /^\/proveedores$/, "producto.consultar", (c) => estado.proveedores.filter((p) => c.params?.incluir_inactivos || p.activo)],
  ["post", /^\/proveedores$/, "catalogo.administrar", (c, _m, b) => {
    if (estado.proveedores.some((p) => p.nit === b.nit)) throw problema(c, 409, "CODIGO_DUPLICADO", "El NIT ya está registrado");
    const nuevo = { id: crypto.randomUUID(), telefono: null, correo: null, direccion: null, ubicacion: null, activo: true, ...b };
    estado.proveedores.push(nuevo);
    return nuevo;
  }],
  ["patch", /^\/proveedores\/([\w-]+)$/, "catalogo.administrar", (c, [id], b) => {
    const p = estado.proveedores.find((x) => x.id === id);
    if (!p) throw problema(c, 404, "RECURSO_NO_EXISTE", "El proveedor no existe");
    return Object.assign(p, b);
  }],
  ["get", /^\/motivos-movimiento$/, "movimiento.consultar", (c) => MOTIVOS.filter((m) => !c.params?.tipo || m.aplica_a === c.params.tipo)],
  ["post", /^\/movimientos\/entradas$/, "movimiento.registrar_entrada", (c, _m, b, u) => aplicarMovimiento(c, "ENTRADA", b, u)],
  ["post", /^\/movimientos\/salidas$/, "movimiento.registrar_salida", (c, _m, b, u) => aplicarMovimiento(c, "SALIDA", b, u)],
  ["get", /^\/movimientos$/, "movimiento.consultar", (c, _m, _b, u) => {
    const propios = u.rol === "MANICURISTA";
    const p = c.params ?? {};
    const items = estado.movimientos.filter((m) => (!propios || m.registrado_por === u.id) && (!p.producto_id || m.producto_id === p.producto_id) && (!p.tipo || m.tipo === p.tipo));
    return pagina([...items].reverse(), p);
  }],
  ["get", /^\/movimientos\/(\d+)$/, "movimiento.consultar", (c, [id]) => estado.movimientos.find((m) => m.id === Number(id)) ?? Promise.reject(problema(c, 404, "RECURSO_NO_EXISTE", "El movimiento no existe"))],
  ["post", /^\/movimientos\/(\d+)\/anulaciones$/, "movimiento.anular", (c, [id], _b, u) => {
    const original = estado.movimientos.find((m) => m.id === Number(id));
    if (!original) throw problema(c, 404, "RECURSO_NO_EXISTE", "El movimiento no existe");
    if (original.anulado_por_id) throw problema(c, 409, "MOVIMIENTO_YA_ANULADO", "El movimiento ya fue anulado");
    const inverso = original.tipo === "SALIDA" ? "ENTRADA" : "SALIDA";
    const resultado = aplicarMovimiento(c, inverso, { producto_id: original.producto_id, cantidad: original.cantidad, movimiento_anulado_id: original.id }, u);
    resultado.movimiento.tipo = "ANULACION";
    original.anulado_por_id = resultado.movimiento.id;
    return resultado;
  }],
  ["get", /^\/alertas$/, "alerta.consultar", (c) => estado.productos
    .filter((p) => ["BAJO_STOCK", "AGOTADO"].includes(p.estado) && (!c.params?.estado || p.estado === c.params.estado))
    .map((p) => ({ producto_id: p.id, codigo: p.codigo, nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo, estado: p.estado, faltante: decimal(Number(p.stock_minimo) - Number(p.stock_actual)) }))],
  ["get", /^\/alertas\/resumen$/, "alerta.consultar", () => {
    const bajo = estado.productos.filter((p) => p.estado === "BAJO_STOCK").length;
    const agotado = estado.productos.filter((p) => p.estado === "AGOTADO").length;
    return { bajo_stock: bajo, agotado, total: bajo + agotado };
  }],
  ["get", /^\/analitica\/tablero$/, "analitica.consultar", () => ({
    productos_por_estado: estado.productos.reduce((acc, p) => ({ ...acc, [p.estado]: (acc[p.estado] ?? 0) + 1 }), {}),
    valor_inventario: null,
    consumo_30_dias: "150.000",
    top_rotacion: [{ producto_id: PRODUCTOS[1].id, codigo: "REM-001", nombre: "Acetona pura", consumo: "150.000" }],
  })],
  ["get", /^\/analitica\/consumo$/, "analitica.consultar", () => [{ clave: "Removedores", cantidad: "150.000" }]],
  ["get", /^\/analitica\/cobertura$/, "analitica.consultar", () => [{ producto_id: PRODUCTOS[1].id, codigo: "REM-001", nombre: "Acetona pura", stock_actual: "350.000", consumo_diario_promedio: "5.000", dias_cobertura: "70.0" }]],
  ["get", /^\/analitica\/kardex$/, "analitica.consultar", (c) => {
    const producto = estado.productos.find((p) => p.id === c.params?.producto_id);
    if (!producto) throw problema(c, 404, "RECURSO_NO_EXISTE", "El producto no existe");
    let saldo = 0;
    let promedio = 0;
    const lineas = estado.movimientos.filter((m) => m.producto_id === producto.id).map((m) => {
      const cantidad = Number(m.cantidad);
      const entra = m.tipo === "ENTRADA";
      if (entra && m.costo_unitario !== null) promedio = (saldo * promedio + cantidad * Number(m.costo_unitario)) / (saldo + cantidad);
      saldo += entra ? cantidad : -cantidad;
      return {
        ocurrido_en: m.ocurrido_en, tipo: m.tipo, motivo_codigo: m.motivo_codigo, cantidad: decimal(cantidad),
        costo_unitario: m.costo_unitario, costo_total: m.costo_unitario === null ? null : costo(cantidad * Number(m.costo_unitario)),
        saldo: decimal(saldo), costo_promedio: costo(promedio), valor_saldo: costo(saldo * promedio),
      };
    });
    return { producto_id: producto.id, codigo: producto.codigo, nombre: producto.nombre, metodo: "PROMEDIO_PONDERADO", lineas, saldo_final: decimal(saldo), valor_final: costo(saldo * promedio) };
  }],
  ["get", /^\/analitica\/proveedores-cercanos$/, "alerta.consultar", (c) => {
    const origen = { latitud: Number(c.params.latitud), longitud: Number(c.params.longitud) };
    const radio = Number(c.params.radio_km ?? 10);
    const features = estado.proveedores
      .filter((p) => p.activo && p.ubicacion)
      .map((p) => ({ p, d: distanciaKm(origen, p.ubicacion) }))
      .filter(({ d }) => d <= radio)
      .sort((a, b) => a.d - b.d)
      .map(({ p, d }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.ubicacion.longitud, p.ubicacion.latitud] },
        properties: { proveedor_id: p.id, nombre: p.nombre, telefono: p.telefono, distancia_km: d.toFixed(2) },
      }));
    return { type: "FeatureCollection", features };
  }],
  ["get", /^\/analitica\/exportar$/, "analitica.consultar", () => new Blob(["codigo,nombre,stock_actual\nESM-001,Esmalte rojo 15 ml,24.000\n"], { type: "text/csv" })],
];

export async function adaptadorSimulado(config) {
  const metodo = (config.method ?? "get").toLowerCase();
  const ruta = (config.url ?? "").split("?")[0];
  const cuerpo = typeof config.data === "string" ? JSON.parse(config.data || "{}") : (config.data ?? {});
  for (const [m, patron, permiso, manejador] of RUTAS) {
    const coincidencia = metodo === m && ruta.match(patron);
    if (!coincidencia) continue;
    const usuario = usuarioDelToken(config);
    if (permiso !== null && !usuario) throw problema(config, 401, "NO_AUTENTICADO", "Falta el token o no es válido");
    if (permiso && !PERMISOS_POR_ROL[usuario.rol].includes(permiso)) {
      throw problema(config, 403, "SIN_PERMISO", `Se requiere el permiso ${permiso}`);
    }
    const data = await manejador(config, coincidencia.slice(1), cuerpo, usuario);
    return responder(config, metodo === "post" && CREA.test(ruta) ? 201 : ACEPTA.test(ruta) ? 202 : 200, data);
  }
  throw problema(config, 404, "RECURSO_NO_EXISTE", `Ruta simulada no definida: ${metodo.toUpperCase()} ${ruta}`);
}
