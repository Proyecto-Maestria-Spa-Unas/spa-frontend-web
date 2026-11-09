/** Reglas del tablero de decisiones (F15). Sin dependencias de React. */
import { ESTADO_INVENTARIO } from "../../design-system/estados";
import { formatoCantidad } from "./formato";

export const DIAS_VENTANA = 30; // igual que la API: los últimos 30 días, incluido hoy
export const MAX_COBERTURA = 10; // el gráfico muestra los 10 productos con menos cobertura

export const AGRUPACIONES = Object.freeze([
  { value: "categoria", label: "Categoría" },
  { value: "producto", label: "Producto" },
]);

const ORDEN_ESTADOS = ["DISPONIBLE", "BAJO_STOCK", "AGOTADO", "DESCONTINUADO"];
const COLOR_ESTADO = Object.freeze({
  DISPONIBLE: "bg-estado-disponible-texto",
  BAJO_STOCK: "bg-estado-bajo-barra",
  AGOTADO: "bg-estado-agotado-texto",
  DESCONTINUADO: "bg-estado-descontinuado-texto",
});

const MENSAJES = Object.freeze({
  SIN_CONEXION: "No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  SIN_PERMISO: "No tienes permiso para ver este indicador.",
  NO_AUTENTICADO: "Tu sesión venció. Vuelve a ingresar.",
  NO_IMPLEMENTADO: "Este indicador todavía no está disponible en este servidor.",
});

/** Mensaje para el usuario según el `code` estable de la API. */
export function mensajeIndicador(error) {
  return MENSAJES[error?.code] ?? "No fue posible cargar este indicador.";
}

const aFecha = (fecha) => fecha.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

/** Rango de los últimos 30 días, incluido hoy, en fechas de Bogotá (AAAA-MM-DD). */
export function rangoUltimos30Dias(ahora = new Date()) {
  const hasta = aFecha(ahora);
  const desde = aFecha(new Date(ahora.getTime() - (DIAS_VENTANA - 1) * 86_400_000));
  return { desde, hasta };
}

/** Porcentaje de ancho de una barra (0 a 100) respecto del valor máximo. */
export function porcentajeBarra(valor, maximo) {
  const v = Number(valor);
  const m = Number(maximo);
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0 || v <= 0) return 0;
  return Math.min(100, Math.round((v / m) * 1000) / 10);
}

const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** "4250000.0000" → "$ 4.250.000"; sin costos registrados (null) → texto explicativo. */
export function formatoValor(valor) {
  if (valor === null || valor === undefined) return "Sin costos registrados";
  const n = Number(valor);
  return Number.isFinite(n) ? COP.format(n) : String(valor);
}

/** Días de cobertura: "70.0" → "70 días"; null → "Sin consumo". */
export function formatoDias(dias) {
  if (dias === null || dias === undefined) return "Sin consumo";
  const n = Number(dias);
  if (!Number.isFinite(n)) return String(dias);
  const texto = formatoCantidad(Math.round(n * 10) / 10);
  return `${texto} ${n === 1 ? "día" : "días"}`;
}

/** Productos por estado en orden fijo, con etiqueta, ícono y color del design system. */
export function filasEstados(porEstado = {}) {
  return ORDEN_ESTADOS.filter((e) => porEstado[e] !== undefined).map((e) => ({
    clave: e,
    etiqueta: `${ESTADO_INVENTARIO[e].icono} ${ESTADO_INVENTARIO[e].etiqueta}`,
    nombre: ESTADO_INVENTARIO[e].etiqueta,
    valor: porEstado[e],
    texto: String(porEstado[e]),
    color: COLOR_ESTADO[e],
  }));
}

export const totalProductos = (porEstado = {}) => Object.values(porEstado).reduce((a, n) => a + n, 0);

/** Consumo agrupado: de mayor a menor. */
export function filasConsumo(items = []) {
  return [...items]
    .sort((a, b) => Number(b.cantidad) - Number(a.cantidad))
    .map((i) => ({ clave: i.clave, etiqueta: i.clave, nombre: i.clave, valor: Number(i.cantidad), texto: formatoCantidad(i.cantidad) }));
}

/** Top de rotación: la API ya lo entrega ordenado (máximo 10). */
export function filasRotacion(items = []) {
  return items.map((p) => ({
    clave: p.producto_id,
    etiqueta: p.nombre,
    detalle: p.codigo,
    nombre: p.nombre,
    valor: Number(p.consumo),
    texto: formatoCantidad(p.consumo),
  }));
}

/** Cobertura ordenada de menor a mayor; los productos sin consumo (null) van al final. */
export function ordenarCobertura(items = []) {
  const con = items.filter((c) => c.dias_cobertura !== null).sort((a, b) => Number(a.dias_cobertura) - Number(b.dias_cobertura));
  const sin = items.filter((c) => c.dias_cobertura === null);
  return [...con, ...sin];
}

/** Las barras del gráfico: los productos con menos cobertura (los que tienen consumo). */
export function filasCobertura(items = []) {
  return ordenarCobertura(items)
    .filter((c) => c.dias_cobertura !== null)
    .slice(0, MAX_COBERTURA)
    .map((c) => ({
      clave: c.producto_id,
      etiqueta: c.nombre,
      detalle: c.codigo,
      nombre: c.nombre,
      valor: Number(c.dias_cobertura),
      texto: formatoDias(c.dias_cobertura),
    }));
}

/** Resumen para lectores de pantalla: "Disponible 40, Bajo stock 5". */
export function resumenFilas(filas, unidad = "") {
  return filas.map((f) => `${f.nombre} ${f.texto}${unidad}`).join(", ");
}
